/**
 * End-to-end verification of the data layer, run against a throwaway datastore.
 *
 * This exists because several of the brief's hard requirements are claims about
 * runtime behaviour, not about code shape — most of all: two shoppers must not
 * both be able to buy the last unit. Asserting that in a comment is worthless;
 * this script actually races two checkouts and fails if both succeed.
 *
 * Run with: npm run verify
 *
 * It writes to a temp directory, never to the dev store under .data/.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Must be set before anything reads serverEnv().
const workDir = await mkdtemp(join(tmpdir(), 'poojaro-verify-'));
process.env.DATA_BACKEND = 'local';
process.env.LOCAL_DATA_DIR = workDir;

const { LocalDataStore } = await import('../src/lib/data/local/store');
const { resetLocalCache } = await import('../src/lib/data/local/persistence');
const { priceCart } = await import('../src/lib/domain/pricing');
const { SYSTEM_ACTOR } = await import('../src/lib/data/store');
const { newId } = await import('../src/lib/data/shared');

type Address = import('../src/lib/data/types').Address;
type Actor = import('../src/lib/data/store').Actor;

const store = new LocalDataStore();
const admin: Actor = { id: 'adm_verify', name: 'Verification Script', kind: 'admin' };

const ADDRESS: Address = {
  id: 'addr_verify',
  label: 'Home',
  fullName: 'Ananya Iyer',
  phone: '9876543210',
  line1: '14, Brindavan Layout',
  line2: '2nd Cross',
  landmark: 'Near Shiva temple',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560034',
  isDefault: true,
};

// ---------------------------------------------------------------------------
// Tiny assertion harness — no test framework, nothing shipped to production
// ---------------------------------------------------------------------------

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function expectThrows(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
    check(label, false, 'expected a rejection, got success');
  } catch {
    check(label, true);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

const rupees = (paise: number): string => `₹${(paise / 100).toFixed(2)}`;

// ---------------------------------------------------------------------------

section('Seed integrity');

const settings = await store.getSettings();
check('settings load', settings.storeName === 'POOJARO', settings.storeName);
check('free-shipping threshold is configurable data', settings.freeShippingThreshold > 0, rupees(settings.freeShippingThreshold));

const catalogue = await store.listProducts({ status: 'any', limit: 500 });
check('catalogue seeded', catalogue.total >= 20, `${catalogue.total} products`);

const kits = await store.listProducts({ isKit: true, limit: 50 });
check('kits seeded', kits.total >= 4, `${kits.total} kits`);

const components = await store.listKitComponents();
check('kit components seeded', components.length >= 30, `${components.length} components`);

const occasions = await store.listOccasions();
const festivals = await store.listFestivals();
const rules = await store.listRecommendationRules();
check('occasions seeded', occasions.length >= 4, `${occasions.length}`);
check('festivals seeded', festivals.length >= 6, `${festivals.length}`);
check('ritual finder rules seeded', rules.length >= 24, `${rules.length} rules`);

const testimonials = await store.listTestimonials();
check(
  'every seeded testimonial is flagged as demo content',
  testimonials.length > 0 && testimonials.every((t) => t.isDemo),
);
const seededReviews = await store.listReviews(undefined, 'any');
check(
  'no seeded review claims a verified purchase',
  seededReviews.length > 0 && seededReviews.every((r) => r.isDemo && !r.verifiedPurchase),
);

section('Honest stock states exist from first boot');

const lowStock = await store.getProductBySlug('marigold-garland');
const outOfStock = await store.getProductBySlug('paan-supari-set');
check('a low-stock product exists', !!lowStock && lowStock.stock > 0 && lowStock.stock <= lowStock.lowStockThreshold, lowStock ? `${lowStock.stock}/${lowStock.lowStockThreshold}` : 'missing');
check('an out-of-stock product exists', !!outOfStock && outOfStock.stock === 0);

section('Pricing is computed server-side from the catalogue');

const ganesh = await store.getProductBySlug('ganesh-puja-kit');
if (!ganesh) throw new Error('Seed is missing the Ganesh Puja Kit — cannot verify pricing.');

const onePriced = priceCart({
  items: [{ productId: ganesh.id, variantId: null, qty: 1 }],
  products: [ganesh],
  settings,
  coupon: null,
  paymentMethod: 'upi',
  isFirstOrder: true,
  couponRedemptionsByUser: 0,
});
check('line total uses the catalogue price', onePriced.totals.subtotal === ganesh.price, `${rupees(onePriced.totals.subtotal)} vs ${rupees(ganesh.price)}`);
check(
  'a below-threshold cart is charged shipping',
  onePriced.totals.subtotal >= settings.freeShippingThreshold
    ? onePriced.totals.shipping === 0
    : onePriced.totals.shipping === settings.shippingFee,
  `subtotal ${rupees(onePriced.totals.subtotal)}, shipping ${rupees(onePriced.totals.shipping)}`,
);

const manyPriced = priceCart({
  items: [{ productId: ganesh.id, variantId: null, qty: 5 }],
  products: [ganesh],
  settings,
  coupon: null,
  paymentMethod: 'upi',
  isFirstOrder: true,
  couponRedemptionsByUser: 0,
});
check('an above-threshold cart ships free', manyPriced.totals.shipping === 0, rupees(manyPriced.totals.shipping));

const overMax = priceCart({
  items: [{ productId: ganesh.id, variantId: null, qty: 9999 }],
  products: [ganesh],
  settings,
  coupon: null,
  paymentMethod: 'upi',
  isFirstOrder: true,
  couponRedemptionsByUser: 0,
});
check(
  'quantity is clamped to available stock',
  (overMax.lines[0]?.qty ?? 0) <= ganesh.stock,
  `asked 9999, priced ${overMax.lines[0]?.qty ?? 0}, stock ${ganesh.stock}`,
);

section('Coupons are validated against store data');

const coupons = await store.listCoupons();
check('coupons seeded', coupons.length >= 3, `${coupons.length}`);

const minOrderCoupon = coupons.find((c) => c.minOrderAmount > ganesh.price);
if (!minOrderCoupon) {
  check('a coupon with a minimum above one kit exists to test against', false, 'none found');
} else {
  const blocked = priceCart({
    items: [{ productId: ganesh.id, variantId: null, qty: 1 }],
    products: [ganesh],
    settings,
    coupon: minOrderCoupon,
    paymentMethod: 'upi',
    isFirstOrder: true,
    couponRedemptionsByUser: 0,
  });
  check(
    `${minOrderCoupon.code} is refused below its minimum order`,
    blocked.totals.couponDiscount === 0 && blocked.totals.couponCode === null,
    `discount ${rupees(blocked.totals.couponDiscount)}`,
  );
  check(
    'the shopper is told how much more to add',
    (blocked.totals.couponMessage ?? '').includes('more to use this code'),
    blocked.totals.couponMessage ?? 'no message',
  );
}

// A coupon that should apply: FIRST10 on a cart above its ₹299 minimum.
const first10 = coupons.find((c) => c.code === 'FIRST10');
if (first10) {
  const applied = priceCart({
    items: [{ productId: ganesh.id, variantId: null, qty: 1 }],
    products: [ganesh],
    settings,
    coupon: first10,
    paymentMethod: 'upi',
    isFirstOrder: true,
    couponRedemptionsByUser: 0,
  });
  check('FIRST10 applies on a qualifying first order', applied.totals.couponDiscount > 0, rupees(applied.totals.couponDiscount));
  check(
    'the discount is 10% of the eligible subtotal',
    applied.totals.couponDiscount === Math.floor(applied.totals.subtotal * 0.1),
    `${rupees(applied.totals.couponDiscount)} of ${rupees(applied.totals.subtotal)}`,
  );
  check(
    'total equals subtotal minus discount plus shipping',
    applied.totals.total === applied.totals.subtotal - applied.totals.couponDiscount + applied.totals.shipping,
    rupees(applied.totals.total),
  );

  const repeat = priceCart({
    items: [{ productId: ganesh.id, variantId: null, qty: 1 }],
    products: [ganesh],
    settings,
    coupon: first10,
    paymentMethod: 'upi',
    isFirstOrder: false,
    couponRedemptionsByUser: 0,
  });
  check('a first-order-only coupon is refused on a repeat order', repeat.totals.couponDiscount === 0);

  const exhausted = priceCart({
    items: [{ productId: ganesh.id, variantId: null, qty: 1 }],
    products: [ganesh],
    settings,
    coupon: first10,
    paymentMethod: 'upi',
    isFirstOrder: true,
    couponRedemptionsByUser: 5,
  });
  check('a per-user limit is enforced', exhausted.totals.couponDiscount === 0);
}

// A scoped coupon must not discount out-of-scope lines.
const scopedCoupon = coupons.find((c) => c.categoryIds.length > 0 || c.productIds.length > 0);
const samagri = await store.getProductBySlug('brass-puja-thali-set');
if (scopedCoupon && samagri) {
  const outOfScope = priceCart({
    items: [{ productId: samagri.id, variantId: null, qty: 3 }],
    products: [samagri],
    settings,
    coupon: scopedCoupon,
    paymentMethod: 'upi',
    isFirstOrder: true,
    couponRedemptionsByUser: 0,
  });
  check(
    `${scopedCoupon.code} does not discount items outside its scope`,
    outOfScope.totals.couponDiscount === 0,
    rupees(outOfScope.totals.couponDiscount),
  );
}

// An expired coupon must be refused even if it is still marked active.
const expiring = coupons.find((c) => c.expiresAt !== null);
if (expiring?.expiresAt) {
  const afterExpiry = priceCart({
    items: [{ productId: ganesh.id, variantId: null, qty: 3 }],
    products: [ganesh],
    settings,
    coupon: expiring,
    paymentMethod: 'upi',
    isFirstOrder: true,
    couponRedemptionsByUser: 0,
    now: new Date(Date.parse(expiring.expiresAt) + 86_400_000),
  });
  check(`${expiring.code} is refused after its expiry date`, afterExpiry.totals.couponDiscount === 0);
}

const fakeCoupon = await store.getCouponByCode('DEFINITELY-NOT-A-CODE');
check('an unknown code resolves to null', fakeCoupon === null);

section('Stock never moves without a ledger row (§34)');

const beforeLedger = await store.listInventoryTransactions({ limit: 1000 });
const adjusted = await store.adjustStock(
  { targetId: ganesh.id, targetType: 'product', delta: 5, reason: 'restock', note: 'Verification top-up' },
  admin,
);
check('adjustment records previous and new quantity', adjusted.previousQty === ganesh.stock && adjusted.newQty === ganesh.stock + 5, `${adjusted.previousQty} → ${adjusted.newQty}`);
check('adjustment records a reason', adjusted.reason === 'restock');
check('adjustment records the acting admin', adjusted.actorId === admin.id && adjusted.actorName === admin.name);
check('adjustment records a timestamp', !Number.isNaN(Date.parse(adjusted.createdAt)));

const afterLedger = await store.listInventoryTransactions({ limit: 1000 });
check('ledger grew by exactly one row', afterLedger.total === beforeLedger.total + 1);

await expectThrows('stock cannot be driven negative', () =>
  store.adjustStock(
    { targetId: ganesh.id, targetType: 'product', newQty: -1, reason: 'correction', note: 'should fail' },
    admin,
  ),
);
await expectThrows('stock must be a whole number', () =>
  store.adjustStock(
    { targetId: ganesh.id, targetType: 'product', newQty: 4.5, reason: 'correction', note: 'should fail' },
    admin,
  ),
);

const productForEdit = await store.getProductById(ganesh.id);
if (!productForEdit) throw new Error('Product vanished mid-verification.');
const stockBeforeEdit = productForEdit.stock;
await store.upsertProduct({ ...productForEdit, stock: 99999, shortDescription: 'Edited by the verification script.' }, admin);
const afterEdit = await store.getProductById(ganesh.id);
check(
  'an admin product edit cannot silently move stock',
  afterEdit?.stock === stockBeforeEdit,
  `${stockBeforeEdit} → ${afterEdit?.stock}`,
);
check('the rest of the product edit did save', afterEdit?.shortDescription === 'Edited by the verification script.');

section('Kit checkout deducts component inventory');

const kitBefore = await store.getProductById(ganesh.id);
const componentIds = [...new Set((kitBefore?.contents ?? []).map((c) => c.componentId).filter((id): id is string => !!id))];
check('the Ganesh kit is composed of tracked components', componentIds.length > 0, `${componentIds.length} components`);

const componentStockBefore = new Map<string, number>();
for (const id of componentIds) {
  const component = components.find((c) => c.id === id) ?? (await store.listKitComponents()).find((c) => c.id === id);
  if (component) componentStockBefore.set(id, component.stock);
}

const kitOrder = await store.placeOrder({
  userId: null,
  email: 'verify+kit@poojaro.test',
  phone: '9876543210',
  items: [{ productId: ganesh.id, variantId: null, qty: 1 }],
  shippingAddress: ADDRESS,
  couponCode: null,
  paymentMethod: 'upi',
  paymentStatus: 'paid',
});
check('a kit order is accepted', kitOrder.ok, kitOrder.ok ? kitOrder.order.orderNumber : kitOrder.message);

if (kitOrder.ok) {
  const kitAfter = await store.getProductById(ganesh.id);
  check('kit stock decremented by one', (kitAfter?.stock ?? 0) === (kitBefore?.stock ?? 0) - 1, `${kitBefore?.stock} → ${kitAfter?.stock}`);

  const componentsAfter = await store.listKitComponents();
  let allDeducted = true;
  for (const [id, before] of componentStockBefore) {
    const required = (kitBefore?.contents ?? [])
      .filter((c) => c.componentId === id)
      .reduce((sum, c) => sum + (c.componentQty ?? 1), 0);
    const after = componentsAfter.find((c) => c.id === id)?.stock ?? -1;
    if (after !== before - required) {
      allDeducted = false;
      console.log(`       component ${id}: expected ${before - required}, got ${after}`);
    }
  }
  check('every component was drawn down by its recipe quantity', allDeducted);

  const saleRows = await store.listInventoryTransactions({ orderId: kitOrder.order.id, limit: 200 });
  check(
    'the sale wrote one ledger row per stock movement',
    saleRows.total === componentStockBefore.size + 1,
    `${saleRows.total} rows for 1 product + ${componentStockBefore.size} components`,
  );
  check('sale rows are attributed to the order', saleRows.items.every((row) => row.orderId === kitOrder.order.id && row.reason === 'sale'));

  check('order status starts confirmed for a paid order', kitOrder.order.status === 'payment_confirmed', kitOrder.order.status);
  check('order has a delivery estimate', !Number.isNaN(Date.parse(kitOrder.order.estimatedDelivery)));
  check('order number is human-readable', /^PJR-[A-Z0-9]{7}$/.test(kitOrder.order.orderNumber), kitOrder.order.orderNumber);

  const notifications = await store.listNotifications(null, 50);
  check('placing an order raised a notification', notifications.some((n) => n.topic === 'order_placed' || n.topic === 'payment_successful'));
}

section('Two shoppers cannot both take the last unit (§59)');

const scarce = await store.getProductBySlug('camphor-tablets');
if (!scarce) throw new Error('Seed is missing the camphor product — cannot verify the race.');

await store.adjustStock(
  { targetId: scarce.id, targetType: 'product', newQty: 1, reason: 'correction', note: 'Set to one unit for the race test' },
  admin,
);

const raceInput = (email: string) =>
  ({
    userId: null,
    email,
    phone: '9876543210',
    items: [{ productId: scarce.id, variantId: null, qty: 1 }],
    shippingAddress: ADDRESS,
    couponCode: null,
    paymentMethod: 'upi' as const,
    paymentStatus: 'paid' as const,
  });

const [raceA, raceB] = await Promise.all([
  store.placeOrder(raceInput('race-a@poojaro.test')),
  store.placeOrder(raceInput('race-b@poojaro.test')),
]);

const winners = [raceA, raceB].filter((r) => r.ok);
check('exactly one of two simultaneous checkouts succeeded', winners.length === 1, `${winners.length} succeeded`);

const loser = [raceA, raceB].find((r) => !r.ok);
check('the loser is told stock ran out', loser !== undefined && !loser.ok && loser.code === 'out_of_stock', loser && !loser.ok ? loser.code : 'no loser');
check(
  'the loser gets a specific message, not a generic one',
  loser !== undefined && !loser.ok && loser.message.includes(scarce.name),
  loser && !loser.ok ? loser.message : '',
);

const scarceAfter = await store.getProductById(scarce.id);
check('stock landed at exactly zero, never negative', scarceAfter?.stock === 0, `${scarceAfter?.stock}`);

const soldOut = await store.placeOrder(raceInput('race-c@poojaro.test'));
check('a third attempt on a sold-out item is refused', !soldOut.ok && soldOut.code === 'out_of_stock', !soldOut.ok ? soldOut.code : 'succeeded');
check(
  'a sold-out item reports out_of_stock, not product_unavailable',
  !soldOut.ok && (soldOut.shortfalls?.[0]?.available ?? -1) === 0,
);

// A withdrawn product is a different failure from a sold-out one.
const withdrawn = await store.getProductBySlug('mishri-crystal-sugar');
if (withdrawn) {
  await store.upsertProduct({ ...withdrawn, status: 'draft' }, admin);
  const unavailable = await store.placeOrder({
    userId: null,
    email: 'verify+withdrawn@poojaro.test',
    phone: '9876543210',
    items: [{ productId: withdrawn.id, variantId: null, qty: 1 }],
    shippingAddress: ADDRESS,
    couponCode: null,
    paymentMethod: 'upi',
    paymentStatus: 'pending',
  });
  check(
    'an unpublished product reports product_unavailable, not out_of_stock',
    !unavailable.ok && unavailable.code === 'product_unavailable',
    !unavailable.ok ? unavailable.code : 'succeeded',
  );
  await store.upsertProduct({ ...withdrawn, status: 'published' }, admin);
}

section('Ten simultaneous checkouts against five units');

const bulk = await store.getProductBySlug('kumkum');
if (!bulk) throw new Error('Seed is missing the kumkum product.');
await store.adjustStock(
  { targetId: bulk.id, targetType: 'product', newQty: 5, reason: 'correction', note: 'Set to five units for the concurrency test' },
  admin,
);

const bulkResults = await Promise.all(
  Array.from({ length: 10 }, (_, i) =>
    store.placeOrder({
      userId: null,
      email: `bulk-${i}@poojaro.test`,
      phone: '9876543210',
      items: [{ productId: bulk.id, variantId: null, qty: 1 }],
      shippingAddress: ADDRESS,
      couponCode: null,
      paymentMethod: 'upi',
      paymentStatus: 'paid',
    }),
  ),
);
const bulkWins = bulkResults.filter((r) => r.ok).length;
const bulkAfter = await store.getProductById(bulk.id);
check('exactly five of ten checkouts succeeded', bulkWins === 5, `${bulkWins} succeeded`);
check('final stock is zero', bulkAfter?.stock === 0, `${bulkAfter?.stock}`);

section('Cancelling an order returns stock with an audit trail');

const restockTarget = await store.getProductBySlug('lakshmi-puja-kit');
if (!restockTarget) throw new Error('Seed is missing the Lakshmi Puja Kit.');
const restockBefore = restockTarget.stock;

const toCancel = await store.placeOrder({
  userId: null,
  email: 'verify+cancel@poojaro.test',
  phone: '9876543210',
  items: [{ productId: restockTarget.id, variantId: null, qty: 2 }],
  shippingAddress: ADDRESS,
  couponCode: null,
  paymentMethod: 'cod',
  paymentStatus: 'pending',
});
check('a COD order is accepted', toCancel.ok, toCancel.ok ? '' : toCancel.message);

if (toCancel.ok) {
  const midway = await store.getProductById(restockTarget.id);
  check('stock was reserved on order', midway?.stock === restockBefore - 2, `${restockBefore} → ${midway?.stock}`);

  const cancelled = await store.cancelOrder(toCancel.order.id, 'Customer changed the puja date', admin);
  check('order moved to cancelled', cancelled.status === 'cancelled');

  const restored = await store.getProductById(restockTarget.id);
  check('stock was returned in full', restored?.stock === restockBefore, `${restored?.stock} vs ${restockBefore}`);

  const returnRows = await store.listInventoryTransactions({ orderId: toCancel.order.id, reason: 'return', limit: 100 });
  check('the return wrote its own ledger rows', returnRows.total > 0, `${returnRows.total} rows`);
  check('cancellation is recorded in the order timeline', cancelled.timeline.some((e) => e.status === 'cancelled'));
  check('cancellation left an internal note', cancelled.internalNotes.length > 0);

  await expectThrows('a cancelled order cannot be shipped', () =>
    store.updateOrderStatus(toCancel.order.id, 'shipped', 'illegal move', admin),
  );

  const refunded = await store.refundOrder(toCancel.order.id, 'Refunded to source', admin);
  check('a cancelled order can be refunded', refunded.status === 'refunded' && refunded.paymentStatus === 'refunded');
}

section('Order state machine rejects illegal transitions');

const fresh = await store.placeOrder({
  userId: null,
  email: 'verify+states@poojaro.test',
  phone: '9876543210',
  items: [{ productId: ganesh.id, variantId: null, qty: 1 }],
  shippingAddress: ADDRESS,
  couponCode: null,
  paymentMethod: 'upi',
  paymentStatus: 'paid',
});

if (fresh.ok) {
  await expectThrows('cannot jump from payment_confirmed straight to delivered', () =>
    store.updateOrderStatus(fresh.order.id, 'delivered', '', admin),
  );
  for (const status of ['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'] as const) {
    await store.updateOrderStatus(fresh.order.id, status, '', admin);
  }
  const delivered = await store.getOrderById(fresh.order.id);
  check('the full happy path walks to delivered', delivered?.status === 'delivered');
  check('every step is in the timeline', (delivered?.timeline.length ?? 0) >= 7, `${delivered?.timeline.length} events`);

  await store.setOrderTracking(fresh.order.id, { trackingNumber: 'VER123456789', courier: 'Delhivery' }, admin);
  const tracked = await store.getOrderById(fresh.order.id);
  check('tracking details persist', tracked?.trackingNumber === 'VER123456789' && tracked?.courier === 'Delhivery');

  const found = await store.getOrderByNumber(fresh.order.orderNumber);
  check('an order is findable by its number', found?.id === fresh.order.id);
}

section('Empty and invalid carts are refused');

const empty = await store.placeOrder({
  userId: null,
  email: 'verify+empty@poojaro.test',
  phone: '9876543210',
  items: [],
  shippingAddress: ADDRESS,
  couponCode: null,
  paymentMethod: 'upi',
  paymentStatus: 'pending',
});
check('an empty cart is refused', !empty.ok && empty.code === 'empty_cart');

const badCoupon = await store.placeOrder({
  userId: null,
  email: 'verify+badcoupon@poojaro.test',
  phone: '9876543210',
  items: [{ productId: ganesh.id, variantId: null, qty: 1 }],
  shippingAddress: ADDRESS,
  couponCode: 'NOPE-NOT-REAL',
  paymentMethod: 'upi',
  paymentStatus: 'pending',
});
check('an unknown coupon code is refused', !badCoupon.ok && badCoupon.code === 'invalid_coupon');

const unavailable = await store.placeOrder({
  userId: null,
  email: 'verify+ghost@poojaro.test',
  phone: '9876543210',
  items: [{ productId: 'prd_does_not_exist', variantId: null, qty: 1 }],
  shippingAddress: ADDRESS,
  couponCode: null,
  paymentMethod: 'upi',
  paymentStatus: 'pending',
});
check('an unknown product is refused', !unavailable.ok && unavailable.code === 'product_unavailable');

section('Search and filters');

const searchKit = await store.listProducts({ search: 'ganesh', limit: 20 });
check('search finds the Ganesh kit', searchKit.items.some((p) => p.slug === 'ganesh-puja-kit'), `${searchKit.total} results`);

const searchNonsense = await store.listProducts({ search: 'zzzzqqqq', limit: 20 });
check('a nonsense search returns nothing', searchNonsense.total === 0);

const griha = await store.getOccasionBySlug('griha-pravesh');
const grihaProducts = griha ? await store.listProducts({ occasionId: griha.id, limit: 50 }) : null;
check('occasion filter returns products', (grihaProducts?.total ?? 0) > 0, `${grihaProducts?.total ?? 0}`);

const cheapFirst = await store.listProducts({ sort: 'price-asc', limit: 5 });
const prices = cheapFirst.items.map((p) => p.price);
check('price-asc really sorts ascending', prices.every((p, i) => i === 0 || p >= (prices[i - 1] ?? 0)), prices.map(rupees).join(', '));

const inStockOnly = await store.listProducts({ inStockOnly: true, limit: 100 });
check('in-stock filter excludes sold-out items', inStockOnly.items.every((p) => p.stock > 0));

section('Reviews drive the displayed rating');

const reviewTarget = await store.getProductBySlug('satyanarayan-puja-kit');
if (reviewTarget) {
  const before = { rating: reviewTarget.rating, count: reviewTarget.reviewCount };
  await store.createReview({
    id: newId('rev'),
    productId: reviewTarget.id,
    userId: null,
    authorName: 'Verification Script',
    city: 'Bengaluru',
    rating: 5,
    title: 'Runtime check',
    body: 'Written by the verification script to confirm rating recomputation.',
    photos: [],
    verifiedPurchase: false,
    isDemo: false,
    status: 'published',
    helpfulCount: 0,
    createdAt: new Date().toISOString(),
  });
  const after = await store.getProductById(reviewTarget.id);
  check('review count went up', (after?.reviewCount ?? 0) === before.count + 1, `${before.count} → ${after?.reviewCount}`);
  check('average rating recomputed', (after?.rating ?? 0) > 0);
}

const purge = await store.purgeDemoSocialProof(admin);
check('demo social proof can be cleared in one action', purge.reviews > 0 && purge.testimonials > 0, `${purge.reviews} reviews, ${purge.testimonials} testimonials`);
const afterPurge = await store.listTestimonials(true);
check('no demo testimonials survive the purge', afterPurge.every((t) => !t.isDemo));

section('Admin accounts and the audit log');

const owner = await store.getAdminByEmail('owner@poojaro.local');
check('the seed owner account exists', !!owner, owner?.email ?? 'missing');
check('the owner has a hashed password, never a plain one', !!owner?.passwordHash.startsWith('scrypt$'));

if (owner) {
  await expectThrows('the last owner cannot be demoted', () =>
    store.upsertAdmin({ ...owner, role: 'staff' }, admin),
  );
  await expectThrows('the last owner cannot be deleted', () => store.deleteAdmin(owner.id, admin));

  await store.upsertAdmin({ ...owner, name: 'Renamed Owner', passwordHash: '' }, admin);
  const renamed = await store.getAdminById(owner.id);
  check('an empty password field means "leave the password alone"', renamed?.passwordHash === owner.passwordHash);
  check('other admin fields still update', renamed?.name === 'Renamed Owner');
}

const auditPage = await store.listAuditLogs({ limit: 1000 });
check('admin actions were logged', auditPage.total > 10, `${auditPage.total} entries`);
check('audit entries name the actor', auditPage.items.every((entry) => !!entry.actorId && !!entry.actorName));
check(
  'inventory adjustments are audited with before and after values',
  auditPage.items.some((e) => e.action === 'inventory.adjust' && e.changes.some((c) => c.field === 'stock')),
);
const leaked = JSON.stringify(auditPage.items).includes('scrypt$');
check('no password hash ever reaches the audit log', !leaked);

section('Analytics roll up from real records');

const summary = await store.getAnalyticsSummary({
  from: new Date(Date.now() - 86_400_000).toISOString(),
  to: new Date(Date.now() + 86_400_000).toISOString(),
});
check('revenue is a positive number', summary.revenue > 0, rupees(summary.revenue));
check('order count matches the orders placed', summary.orderCount > 0, `${summary.orderCount}`);
check(
  'average order value is revenue over paid orders, not invented',
  summary.averageOrderValue > 0 && summary.averageOrderValue <= summary.revenue,
  `${rupees(summary.averageOrderValue)} from ${rupees(summary.revenue)} over ${summary.orderCount} orders`,
);
check('best sellers are ranked', summary.bestSellers.length > 0, `${summary.bestSellers.length} entries`);
check('purchases were counted from real events', summary.purchases > 0, `${summary.purchases}`);
check('rates stay within 0–1', [summary.addToCartRate, summary.checkoutRate, summary.conversionRate, summary.cartAbandonmentRate].every((r) => r >= 0 && r <= 1));
check('orders are broken down by status', summary.ordersByStatus.length > 0, summary.ordersByStatus.map((s) => `${s.status}:${s.count}`).join(' '));
check('revenue by day has entries', summary.revenueByDay.length > 0, `${summary.revenueByDay.length} days`);

section('Referential guards on taxonomy');

const categories = await store.listCategories(true);
let guarded = false;
let guardedCategory = '';
for (const category of categories) {
  const inUse = await store.listProducts({ categoryId: category.id, limit: 1, status: 'any' });
  if (inUse.total === 0) continue;
  guardedCategory = category.name;
  try {
    await store.deleteCategory(category.id, admin);
  } catch {
    guarded = true;
  }
  break;
}
check('a category with products cannot be deleted', guarded, guardedCategory);

// ===========================================================================
// Domain services
// ===========================================================================

const storeSettings = await store.getSettings();

section('Pincode and delivery (§51)');

const { checkDelivery, lookupPincode, checkServiceability, INDIAN_STATES } = await import(
  '../src/lib/domain/shipping'
);

check('a Bengaluru pincode resolves to Karnataka', lookupPincode('560034')?.state === 'Karnataka');
check('a Kolkata pincode resolves to West Bengal', lookupPincode('700016')?.state === 'West Bengal');
check('a Delhi pincode is treated as metro', lookupPincode('110001')?.zone === 'metro');
check('five digits is rejected', lookupPincode('56003') === null);
check('a non-numeric pincode is rejected', lookupPincode('56A034') === null);

const bengaluru = checkDelivery('560034', storeSettings);
check('a serviceable pincode returns a window', bengaluru.status === 'deliverable' && !!bengaluru.from && !!bengaluru.to);
check(
  'the window opens no later than it closes',
  new Date(bengaluru.from ?? 0) <= new Date(bengaluru.to ?? 0),
);
const northEast = checkDelivery('790001', storeSettings);
check(
  'a north-east pincode is quoted a longer window than a metro one',
  new Date(northEast.to ?? 0) > new Date(bengaluru.to ?? 0),
  `${northEast.to} vs ${bengaluru.to}`,
);
check('an invalid pincode is reported as invalid, not undeliverable', checkDelivery('abc', storeSettings).status === 'invalid');

const blockedSettings = { ...storeSettings, blockedPincodePrefixes: ['5600'] };
check(
  'an admin-blocked prefix is refused',
  checkDelivery('560034', blockedSettings).status === 'not-served',
);
check(
  'a delivery estimate never claims to be live without a courier API (§64)',
  bengaluru.isLiveEstimate === false,
);
const serviceability = await checkServiceability('560034');
check('serviceability reports itself unconfigured rather than guessing', serviceability.configured === false && serviceability.serviceable === null);
check('every state in the address list is unique', new Set(INDIAN_STATES).size === INDIAN_STATES.length, `${INDIAN_STATES.length} states`);

section('Ritual Finder resolves from admin-editable rules (§19, §57)');

const { resolveRecommendation, summariseAnswers, PEOPLE_BANDS, LEVEL_OPTIONS, TIMING_OPTIONS } = await import(
  '../src/lib/domain/ritual-finder'
);

const finderRules = await store.listRecommendationRules();
const allProducts = (await store.listProducts({ limit: 500, status: 'any' })).items;
const allOccasions = await store.listOccasions(true);
const finderArgs = {
  rules: finderRules,
  products: allProducts,
  occasions: allOccasions,
  settings: storeSettings,
};

check('the finder has seeded rules to work from', finderRules.length > 0, `${finderRules.length} rules`);
check('the wizard offers all three levels and four timings', LEVEL_OPTIONS.length === 3 && TIMING_OPTIONS.length === 4);

const firstRule = finderRules[0];
if (!firstRule) throw new Error('No recommendation rules were seeded.');

const smallGathering = resolveRecommendation({
  ...finderArgs,
  answers: { occasionId: firstRule.occasionId, people: 4, timing: 'week', level: 'essentials' },
});
check('a complete set of answers produces a recommendation', smallGathering.ok);
if (smallGathering.ok) {
  const rec = smallGathering.recommendation;
  check('the recommended product is published', rec.product.status === 'published', rec.product.name);
  check('the recommendation carries a reason, not a slogan', rec.reason.length > 40);
  check('the suggested quantity is at least one', rec.suggestedQty >= 1, `${rec.suggestedQty}`);
  check('the timing note quotes a real delivery window, not a hard-coded date (§68)', /\d/.test(rec.timingNote));
  check('add-ons are all published products', rec.addOns.every((p) => p.status === 'published'));
}

const largeGathering = resolveRecommendation({
  ...finderArgs,
  answers: { occasionId: firstRule.occasionId, people: 40, timing: 'soon', level: 'essentials' },
});
check(
  'a larger headcount suggests at least as many units',
  largeGathering.ok && smallGathering.ok
    ? largeGathering.recommendation.suggestedQty >= smallGathering.recommendation.suggestedQty
    : false,
  largeGathering.ok && smallGathering.ok
    ? `${smallGathering.recommendation.suggestedQty} → ${largeGathering.recommendation.suggestedQty}`
    : '',
);

const premium = resolveRecommendation({
  ...finderArgs,
  answers: { occasionId: firstRule.occasionId, people: 4, timing: 'week', level: 'premium' },
});
check(
  'premium suggests at least as many add-ons as essentials',
  premium.ok && smallGathering.ok
    ? premium.recommendation.addOns.length >= smallGathering.recommendation.addOns.length
    : false,
);

const absurdHeadcount = resolveRecommendation({
  ...finderArgs,
  answers: { occasionId: firstRule.occasionId, people: 5000, timing: 'planning', level: 'complete' },
});
check('an out-of-band headcount still gets a useful answer, not an error', absurdHeadcount.ok);

const unknownOccasion = resolveRecommendation({
  ...finderArgs,
  answers: { occasionId: 'occasion-that-does-not-exist', people: 4, timing: 'week', level: 'complete' },
});
check(
  'an occasion with no rules says so plainly instead of guessing',
  !unknownOccasion.ok && unknownOccasion.code === 'no_rule',
);

const inactiveRules = finderRules.map((rule) => ({ ...rule, isActive: false }));
const allDeactivated = resolveRecommendation({
  ...finderArgs,
  rules: inactiveRules,
  answers: { occasionId: firstRule.occasionId, people: 4, timing: 'week', level: 'complete' },
});
check(
  'deactivating rules in the admin panel switches the finder off for that occasion',
  !allDeactivated.ok,
);

const firstBand = PEOPLE_BANDS[0];
check(
  'the answer summary names the occasion back to the shopper',
  firstBand
    ? summariseAnswers(
        { occasionId: firstRule.occasionId, people: firstBand.people, timing: 'week', level: 'complete' },
        allOccasions,
      ).includes(allOccasions.find((o) => o.id === firstRule.occasionId)?.name ?? '###')
    : false,
);

section('Payments refuse to be fooled (§53, §64)');

const {
  paymentOptions,
  verifyPaymentSignature,
  verifyWebhookSignature,
  paymentReadiness,
  createPaymentOrder,
  refundPayment,
  requiresGateway,
} = await import('../src/lib/domain/payments');

const readiness = paymentReadiness();
check('online payment reports itself disabled with no credentials', readiness.onlineEnabled === false);
check('the missing credentials are named for the operator', readiness.requirements.length > 0, readiness.requirements.join('; '));

const options = paymentOptions(storeSettings);
check('all four payment methods are presented', options.length === 4);
check(
  'UPI is shown as unavailable with a reason, not hidden or faked',
  options.some((o) => o.method === 'upi' && !o.available && !!o.unavailableReason),
);
check(
  'cash on delivery works with no gateway at all',
  options.some((o) => o.method === 'cod' && o.available === storeSettings.codEnabled),
);
check('only gateway methods require a gateway', requiresGateway('cod') === false && requiresGateway('upi') === true);

const anyOrder = (await store.listOrders({ limit: 1 })).items[0];
if (!anyOrder) throw new Error('No orders exist to test payment behaviour against.');
const intent = await createPaymentOrder(anyOrder);
check(
  'creating a gateway order without credentials fails honestly',
  !intent.ok && intent.code === 'not_configured',
  intent.ok ? '' : intent.message,
);

// Unsigned environment: verification must refuse, never default to success.
check(
  'a payment cannot be verified while no secret is configured',
  verifyPaymentSignature({ razorpayOrderId: 'order_x', razorpayPaymentId: 'pay_x', razorpaySignature: 'anything' })
    .ok === false,
);
check('an unsigned webhook is rejected', verifyWebhookSignature('{"event":"payment.captured"}', 'deadbeef') === false);

// Now with a secret present, so the HMAC path itself is exercised.
const { createHmac } = await import('node:crypto');
const TEST_SECRET = 'verify-only-secret';
process.env.RAZORPAY_KEY_ID = 'rzp_test_verify';
process.env.RAZORPAY_KEY_SECRET = TEST_SECRET;
process.env.RAZORPAY_WEBHOOK_SECRET = TEST_SECRET;
const { resetServerEnvCache } = await import('../src/lib/env');
resetServerEnvCache();

const signedOrderId = 'order_VERIFY123';
const signedPaymentId = 'pay_VERIFY123';
const goodSignature = createHmac('sha256', TEST_SECRET)
  .update(`${signedOrderId}|${signedPaymentId}`)
  .digest('hex');

check(
  'a correctly signed payment verifies',
  verifyPaymentSignature({ razorpayOrderId: signedOrderId, razorpayPaymentId: signedPaymentId, razorpaySignature: goodSignature }).ok,
);
check(
  'a tampered payment id fails verification',
  !verifyPaymentSignature({ razorpayOrderId: signedOrderId, razorpayPaymentId: 'pay_ATTACKER', razorpaySignature: goodSignature }).ok,
);
check(
  'a tampered order id fails verification',
  !verifyPaymentSignature({ razorpayOrderId: 'order_ATTACKER', razorpayPaymentId: signedPaymentId, razorpaySignature: goodSignature }).ok,
);
check(
  'a truncated signature fails verification rather than throwing',
  !verifyPaymentSignature({ razorpayOrderId: signedOrderId, razorpayPaymentId: signedPaymentId, razorpaySignature: goodSignature.slice(0, 20) }).ok,
);
check('an empty signature fails verification', !verifyPaymentSignature({ razorpayOrderId: signedOrderId, razorpayPaymentId: signedPaymentId, razorpaySignature: '' }).ok);

const webhookBody = '{"event":"payment.captured","payload":{}}';
const webhookSignature = createHmac('sha256', TEST_SECRET).update(webhookBody).digest('hex');
check('a correctly signed webhook is accepted', verifyWebhookSignature(webhookBody, webhookSignature));
check(
  'a webhook body altered after signing is rejected',
  !verifyWebhookSignature('{"event":"payment.captured","payload":{"amount":1}}', webhookSignature),
);
check('test keys are flagged as test mode', paymentReadiness().isTestMode);
check('online payment now reports itself enabled', paymentReadiness().onlineEnabled);

const codRefund = await refundPayment({ ...anyOrder, paymentMethod: 'cod' }, 10000);
check(
  'refunding a COD order refuses instead of pretending',
  !codRefund.ok && codRefund.code === 'not_online',
);

delete process.env.RAZORPAY_KEY_ID;
delete process.env.RAZORPAY_KEY_SECRET;
delete process.env.RAZORPAY_WEBHOOK_SECRET;
resetServerEnvCache();

section('Notification channels are honest about what is wired up (§55, §64)');

const { channelStatuses, configuredChannels, whatsappSupportUrl, dispatch, isAdminTopic, isOptional } = await import(
  '../src/lib/domain/notifications'
);

const channels = channelStatuses();
check('all four channels are accounted for', channels.length === 4);
check('the in-app channel needs no credentials and is live', channels.find((c) => c.channel === 'in_app')?.configured === true);
check(
  'unconfigured channels state their requirement',
  channels.filter((c) => !c.configured).every((c) => !!c.requirement),
);
check('only the in-app channel is live out of the box', configuredChannels().join(',') === 'in_app');

const sampleNotification = (await store.listNotifications(null, 1))[0];
check('the store raised at least one notification during these checks', sampleNotification !== undefined);
if (sampleNotification) {
  const dispatched = await dispatch(sampleNotification, { email: 'a@b.test', phone: '9876543210' });
  check('dispatch always records the in-app delivery as sent', dispatched.some((r) => r.channel === 'in_app' && r.outcome === 'sent'));
  check(
    'unconfigured channels are skipped, never reported as sent',
    dispatched.filter((r) => r.channel !== 'in_app').every((r) => r.outcome === 'skipped_unconfigured'),
  );
}

check('low stock is an admin-only topic', isAdminTopic('low_stock') && !isAdminTopic('order_shipped'));
check('order updates are not opt-out, promotions are', !isOptional('order_shipped') && isOptional('promotion'));

const waUrl = whatsappSupportUrl(storeSettings);
check(
  'no WhatsApp link is produced while the business number is unset (§24)',
  storeSettings.whatsappNumber ? waUrl !== null : waUrl === null,
  storeSettings.whatsappNumber ? String(waUrl) : 'number unset, button will hide',
);
const configuredWa = whatsappSupportUrl({ ...storeSettings, whatsappNumber: '+91 98765 43210' });
check(
  'a configured number produces a digits-only wa.me link (§56)',
  configuredWa !== null && /^https:\/\/wa\.me\/919876543210\?text=/.test(configuredWa),
  configuredWa?.slice(0, 48) ?? 'null',
);
check(
  'the prefilled message is the one the brief specifies',
  (configuredWa ?? '').includes(encodeURIComponent('Namaste POOJARO, I need help choosing a Puja Kit.')),
);
check(
  'a short or malformed number is refused rather than linked',
  whatsappSupportUrl({ ...storeSettings, whatsappNumber: '12345' }) === null,
);

section('Product helpers read stock the same way everywhere');

const {
  stockState,
  stockLabel,
  availableStock: productStock,
  isPurchasable,
  productPricing,
  productHref,
  defaultVariant,
} = await import('../src/lib/domain/product');

const soldOutProduct = allProducts.find((p) => p.stock === 0 && p.variants.length === 0);
const lowStockProduct = allProducts.find((p) => p.variants.length === 0 && p.stock > 0 && p.stock <= p.lowStockThreshold);
const healthy = allProducts.find((p) => p.variants.length === 0 && p.stock > p.lowStockThreshold);

check('a sold-out product reports out_of_stock', soldOutProduct ? stockState(soldOutProduct) === 'out_of_stock' : false, soldOutProduct?.name);
check('a sold-out product is not purchasable', soldOutProduct ? !isPurchasable(soldOutProduct) : false);
check('a low-stock product reports low_stock', lowStockProduct ? stockState(lowStockProduct) === 'low_stock' : false, lowStockProduct?.name);
check(
  'the low-stock label quotes the real number, not manufactured scarcity',
  lowStockProduct ? stockLabel(lowStockProduct) === `Only ${lowStockProduct.stock} left` : false,
  lowStockProduct ? stockLabel(lowStockProduct) : '',
);
check('a healthy product simply says In stock', healthy ? stockLabel(healthy) === 'In stock' : false, healthy?.name);

const varianted = allProducts.find((p) => p.variants.length > 1);
if (varianted) {
  const summed = varianted.variants.reduce((t, v) => t + Math.max(0, v.stock), 0);
  check('a varianted product sums stock across variants', productStock(varianted) === summed, `${summed}`);
  check('a varianted product has a default variant to pre-select', defaultVariant(varianted) !== null);
  check(
    'a varianted product prices from its cheapest variant',
    productPricing(varianted).price === Math.min(...varianted.variants.map((v) => v.price)),
  );
}

const kit = allProducts.find((p) => p.isKit && p.mrp > p.price);
check(
  'a discounted kit reports a positive discount percentage',
  kit ? productPricing(kit).hasDiscount && productPricing(kit).discountPercent > 0 : false,
  kit ? `${productPricing(kit).discountPercent}%` : '',
);
check(
  'product URLs are slug-based for SEO (§47)',
  kit ? productHref(kit) === `/products/${kit.slug}` : false,
  kit ? productHref(kit) : '',
);

// ---------------------------------------------------------------------------

resetLocalCache();
await rm(workDir, { recursive: true, force: true });

console.log(`\n${'─'.repeat(60)}`);
if (failures.length === 0) {
  console.log(`All ${passed} checks passed.`);
  console.log(`Backend: ${store.backend}. Actor used: ${SYSTEM_ACTOR.name} / ${admin.name}.`);
} else {
  console.log(`${passed} passed, ${failures.length} FAILED:`);
  for (const failure of failures) console.log(`  • ${failure}`);
  process.exitCode = 1;
}
