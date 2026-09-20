/**
 * Product-level helpers shared by every surface that shows a product.
 *
 * These exist so no component ever writes `product.status === 'published'` or
 * decides for itself what "low stock" means. A card, the PDP, the quick view,
 * search results and the admin list all read stock the same way, and if the rule
 * changes it changes in one place.
 *
 * Pure and client-safe: no datastore, no environment, no secrets.
 */
import type { Paise, Product, ProductVariant } from '../data/types';
import { discountPercent } from '../format';

// ---------------------------------------------------------------------------
// Publication
// ---------------------------------------------------------------------------

/** Visible to shoppers. Drafts and archived products are not. */
export function isPublished(product: Product): boolean {
  return product.status === 'published';
}

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/**
 * The variant a PDP should pre-select: the one flagged default, else the first.
 * Returns null for a product sold without variants.
 */
export function defaultVariant(product: Product): ProductVariant | null {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) return null;
  return variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;
}

export function findVariant(product: Product, variantId: string | null | undefined): ProductVariant | null {
  if (!variantId) return null;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  return variants.find((variant) => variant.id === variantId) ?? null;
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

/**
 * Units a shopper can actually buy right now.
 *
 * For a product with variants this is the sum across variants, because the card
 * has to answer "can I buy this at all" before a variant is chosen. Pass a
 * variant once one is selected.
 */
export function availableStock(product: Product, variant?: ProductVariant | null): number {
  if (variant) return Math.max(0, variant.stock ?? 0);
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length > 0) {
    return variants.reduce((total, v) => total + Math.max(0, v.stock ?? 0), 0);
  }
  return Math.max(0, product.stock ?? 0);
}

export type StockState = 'in_stock' | 'low_stock' | 'out_of_stock';

export function stockState(product: Product, variant?: ProductVariant | null): StockState {
  const stock = availableStock(product, variant);
  if (stock <= 0) return 'out_of_stock';
  return stock <= (product.lowStockThreshold ?? 5) ? 'low_stock' : 'in_stock';
}

export function isPurchasable(product: Product, variant?: ProductVariant | null): boolean {
  return isPublished(product) && availableStock(product, variant) > 0;
}

/**
 * Shopper-facing stock line.
 *
 * "Only 3 left" is honest urgency — it is the real number from the ledger, not a
 * manufactured scarcity message. When stock is comfortable we say so plainly
 * rather than inventing pressure.
 */
export function stockLabel(product: Product, variant?: ProductVariant | null): string {
  const stock = availableStock(product, variant);
  switch (stockState(product, variant)) {
    case 'out_of_stock':
      return 'Out of stock';
    case 'low_stock':
      return stock === 1 ? 'Only 1 left' : `Only ${stock} left`;
    case 'in_stock':
      return 'In stock';
  }
}

/** The §50 copy for a product that cannot be bought. */
export const UNAVAILABLE_MESSAGE = 'This ritual essential is currently unavailable.';

// ---------------------------------------------------------------------------
// Price
// ---------------------------------------------------------------------------

export interface ProductPricing {
  price: Paise;
  mrp: Paise;
  discountPercent: number;
  hasDiscount: boolean;
  /** True when variants differ in price, so the UI can show "from ₹699". */
  isRange: boolean;
}

export function productPricing(product: Product, variant?: ProductVariant | null): ProductPricing {
  if (variant) return pricing(variant.price ?? 0, variant.mrp ?? 0, false);
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length > 0) {
    const prices = variants.map((v) => v.price ?? 0);
    const lowest = Math.min(...prices);
    const cheapest = variants.find((v) => v.price === lowest) ?? variants[0];
    return pricing(lowest, cheapest?.mrp ?? lowest, new Set(prices).size > 1);
  }
  return pricing(product.price ?? 0, product.mrp ?? 0, false);
}

function pricing(price: Paise, mrp: Paise, isRange: boolean): ProductPricing {
  const percent = discountPercent(price, mrp);
  return { price, mrp, discountPercent: percent, hasDiscount: percent > 0, isRange };
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

/** Total item count inside a kit, for "12 items inside" on a card. */
export function contentCount(product: Product): number {
  return Array.isArray(product.contents) ? product.contents.length : 0;
}

/** URL for a product, in one place so a routing change is one edit (§47). */
export function productHref(product: Pick<Product, 'slug'>): string {
  return `/products/${product.slug}`;
}
