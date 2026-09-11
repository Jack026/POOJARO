/**
 * Server-side pricing.
 *
 * Every rupee a customer is asked to pay is computed here, from catalogue data,
 * inside the request that charges them. The client sends only product ids,
 * quantities and a coupon *code* — never a price, a discount or a total. If the
 * browser sends a price, it is ignored.
 *
 * Pure functions with no I/O, so both the local and Firestore adapters share
 * exactly one implementation of the arithmetic.
 */
import type {
  CartItem,
  CartTotals,
  Coupon,
  PaymentMethod,
  PricedCart,
  PricedCartLine,
  Product,
  ProductVariant,
  Settings,
} from '../data/types';
import type { CouponEvaluation } from '../data/store';

export const MAX_QTY_PER_LINE = 20;

interface ResolvedProduct {
  product: Product;
  variant: ProductVariant | null;
}

function resolve(products: Map<string, Product>, item: CartItem): ResolvedProduct | null {
  const product = products.get(item.productId);
  if (!product || product.status !== 'published') return null;
  if (!item.variantId) {
    // A product with variants must be bought as a variant.
    return product.variants.length > 0 ? null : { product, variant: null };
  }
  const variant = product.variants.find((v) => v.id === item.variantId) ?? null;
  return variant ? { product, variant } : null;
}

function availableStock({ product, variant }: ResolvedProduct): number {
  return variant ? variant.stock : product.stock;
}

export function priceLine(resolved: ResolvedProduct, requestedQty: number): PricedCartLine {
  const { product, variant } = resolved;
  const stock = availableStock(resolved);
  const qty = Math.max(0, Math.min(requestedQty, MAX_QTY_PER_LINE, stock));
  const unitPrice = variant ? variant.price : product.price;
  const unitMrp = variant ? variant.mrp : product.mrp;
  return {
    productId: product.id,
    variantId: variant?.id ?? null,
    slug: product.slug,
    name: product.name,
    variantLabel: variant?.label ?? null,
    image: product.images[0] ?? null,
    unitPrice,
    unitMrp,
    qty,
    lineTotal: unitPrice * qty,
    availableStock: stock,
    inStock: stock > 0,
  };
}

export interface PriceCartInput {
  items: CartItem[];
  products: Product[];
  settings: Settings;
  coupon?: Coupon | null;
  paymentMethod?: PaymentMethod;
  /** Both needed to enforce firstOrderOnly and perUserLimit honestly. */
  isFirstOrder?: boolean;
  couponRedemptionsByUser?: number;
  now?: Date;
}

export function priceCart(input: PriceCartInput): PricedCart {
  const {
    items,
    products,
    settings,
    coupon = null,
    paymentMethod,
    isFirstOrder = true,
    couponRedemptionsByUser = 0,
    now = new Date(),
  } = input;

  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: PricedCartLine[] = [];
  const notices: string[] = [];

  for (const item of items) {
    const resolved = resolve(byId, item);
    if (!resolved) {
      notices.push('An item in your cart is no longer available and has been removed.');
      continue;
    }
    const line = priceLine(resolved, item.qty);
    if (line.qty === 0) {
      notices.push(`${line.name} is out of stock and has been removed.`);
      continue;
    }
    if (line.qty < item.qty) {
      const reason =
        line.qty === line.availableStock
          ? `Only ${line.qty} left in stock`
          : `Limited to ${MAX_QTY_PER_LINE} per order`;
      notices.push(`${line.name}: ${reason}, quantity adjusted.`);
    }
    lines.push(line);
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const mrpTotal = lines.reduce((sum, l) => sum + l.unitMrp * l.qty, 0);

  const evaluation = coupon
    ? evaluateCoupon({ coupon, lines, products, subtotal, isFirstOrder, couponRedemptionsByUser, now })
    : { ok: false, coupon: null, discount: 0, message: '' };

  const couponDiscount = evaluation.ok ? evaluation.discount : 0;

  // Free-delivery progress is measured against the cart subtotal, not the
  // post-coupon figure — so applying a coupon never pushes a shopper back below
  // the threshold they had already reached.
  const threshold = settings.freeShippingThreshold;
  const qualifies = subtotal >= threshold;
  const shipping = lines.length === 0 || qualifies ? 0 : settings.shippingFee;
  const codFee = paymentMethod === 'cod' && settings.codEnabled ? settings.codFee : 0;

  const totals: CartTotals = {
    subtotal,
    mrpTotal,
    productDiscount: Math.max(0, mrpTotal - subtotal),
    couponCode: evaluation.ok ? evaluation.coupon?.code ?? null : null,
    couponDiscount,
    couponMessage: evaluation.message || null,
    shipping: shipping + codFee,
    freeShippingGap: qualifies ? 0 : Math.max(0, threshold - subtotal),
    freeShippingThreshold: threshold,
    total: Math.max(0, subtotal - couponDiscount) + shipping + codFee,
  };

  return { lines, totals, notices };
}

// ---------------------------------------------------------------------------
// Checkout validation
// ---------------------------------------------------------------------------

export interface CartShortfall {
  productId: string;
  name: string;
  requested: number;
  available: number;
}

/**
 * Why a cart could not be honoured as submitted.
 *
 * The distinction matters for the message the shopper reads. A published item
 * that has sold out is `out_of_stock` — "only 2 left", worth adjusting. An item
 * that has been unpublished, deleted or asked for by a variant that no longer
 * exists is `product_unavailable` — "this ritual essential is currently
 * unavailable", nothing the shopper can do about the quantity.
 *
 * Both adapters call this so the two backends return the same code for the same
 * cart.
 */
export function findShortfalls(
  items: CartItem[],
  products: Product[],
  lines: PricedCartLine[],
): { shortfalls: CartShortfall[]; unavailable: CartShortfall[] } {
  const byId = new Map(products.map((p) => [p.id, p]));
  const shortfalls: CartShortfall[] = [];
  const unavailable: CartShortfall[] = [];

  for (const item of items) {
    const itemVariantId = item.variantId ?? null;
    const line = lines.find((l) => l.productId === item.productId && (l.variantId ?? null) === itemVariantId);
    if (line) {
      if (line.qty < item.qty) {
        shortfalls.push({
          productId: line.productId,
          name: line.name,
          requested: item.qty,
          available: line.availableStock,
        });
      }
      continue;
    }

    // The line was dropped. Sold out, or genuinely gone?
    const product = byId.get(item.productId);
    const sellable = product?.status === 'published';
    const variant = itemVariantId ? product?.variants.find((v) => v.id === itemVariantId) ?? null : null;
    const missingVariant = Boolean(itemVariantId) && variant === null;
    const entry: CartShortfall = {
      productId: item.productId,
      name: product?.name ?? 'An item in your cart',
      requested: item.qty,
      available: 0,
    };
    if (sellable && !missingVariant) shortfalls.push(entry);
    else unavailable.push(entry);
  }

  return { shortfalls, unavailable };
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

interface EvaluateCouponInput {
  coupon: Coupon;
  lines: PricedCartLine[];
  products: Product[];
  subtotal: number;
  isFirstOrder: boolean;
  couponRedemptionsByUser: number;
  now: Date;
}

/**
 * Coupon validation. Runs server-side on every price calculation, including the
 * one inside `placeOrder` — a code that passed at cart time is re-checked at
 * payment time, so an expiring or exhausted coupon cannot slip through.
 */
export function evaluateCoupon(input: EvaluateCouponInput): CouponEvaluation {
  const { coupon, lines, products, subtotal, isFirstOrder, couponRedemptionsByUser, now } = input;
  const reject = (message: string): CouponEvaluation => ({ ok: false, coupon, discount: 0, message });

  if (!coupon.isActive) return reject('This code is no longer active.');
  if (coupon.startsAt && now < new Date(coupon.startsAt)) return reject('This code is not active yet.');
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) return reject('This code has expired.');
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return reject('This code has been fully redeemed.');
  }
  if (coupon.perUserLimit !== null && couponRedemptionsByUser >= coupon.perUserLimit) {
    return reject('You have already used this code.');
  }
  if (coupon.firstOrderOnly && !isFirstOrder) {
    return reject('This code is valid on first orders only.');
  }
  if (lines.length === 0) return reject('Add something to your cart to use a code.');

  // Scoped coupons discount only the lines they apply to.
  const byId = new Map(products.map((p) => [p.id, p]));
  const scoped = coupon.productIds.length > 0 || coupon.categoryIds.length > 0;
  const eligible = scoped
    ? lines.filter((line) => {
        if (coupon.productIds.includes(line.productId)) return true;
        const product = byId.get(line.productId);
        return product ? coupon.categoryIds.includes(product.categoryId) : false;
      })
    : lines;

  if (eligible.length === 0) {
    return reject('This code does not apply to the items in your cart.');
  }

  const eligibleTotal = eligible.reduce((sum, l) => sum + l.lineTotal, 0);

  // The minimum is checked against the whole cart, which is how shoppers read
  // "orders above ₹599".
  if (subtotal < coupon.minOrderAmount) {
    const short = coupon.minOrderAmount - subtotal;
    return reject(`Add ₹${Math.ceil(short / 100)} more to use this code.`);
  }

  let discount =
    coupon.type === 'percentage'
      ? Math.floor((eligibleTotal * coupon.value) / 100)
      : Math.min(coupon.value, eligibleTotal);

  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, eligibleTotal);

  if (discount <= 0) return reject('This code gives no discount on your current cart.');

  const label =
    coupon.type === 'percentage'
      ? `${coupon.value}% off applied`
      : `₹${Math.round(coupon.value / 100)} off applied`;

  return { ok: true, coupon, discount, message: label };
}
