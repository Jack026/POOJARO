/**
 * Cloud Firestore adapter.
 *
 * Same contract as the local adapter, backed by the collections the Flutter app
 * already reads, so the website and the mobile app share one dataset.
 *
 * Three things are worth knowing before editing this file:
 *
 *  1. `firebase-admin` is an optional dependency and is imported dynamically,
 *     server-side only. The types below are minimal structural declarations
 *     rather than imports, so `tsc` and `next build` never depend on a package
 *     that a deployment may have omitted. If the package is missing at runtime,
 *     the error says exactly what to install.
 *
 *  2. `placeOrder` and `adjustStock` run inside `runTransaction`. Firestore
 *     retries a transaction whose read set changed, so two shoppers taking the
 *     last unit cannot both succeed — the loser re-reads the decremented stock
 *     and is rejected. Every read happens before every write, as Firestore
 *     requires.
 *
 *  3. Small, slow-moving collections (categories, occasions, festivals, banners,
 *     coupons, settings) are cached in-process for a few seconds to keep read
 *     costs sane. Products, orders and inventory are never cached, because their
 *     stock and status must be current.
 */
import { evaluateCoupon, findShortfalls, priceCart } from '../../domain/pricing';
import {
  canTransition,
  notificationCopy,
  NOTIFICATION_FOR_STATUS,
  ORDER_STATUS_DETAIL,
  STOCK_HELD_STATUSES,
} from '../../domain/orders';
import { serverEnv } from '../../env';
import { addBusinessDays } from '../../format';
import { buildSeedDatabase, SCHEMA_VERSION } from '../seed';
import {
  applyOrderQuery,
  applyProductQuery,
  diffFields,
  formatOrderNumber,
  newId,
  nowIso,
  paginate,
} from '../shared';
import type {
  Actor,
  AnalyticsRange,
  AuditQuery,
  DataStore,
  InventoryQuery,
  OrderQuery,
  Page,
  PlaceOrderInput,
  PlaceOrderResult,
  ProductQuery,
  StockAdjustment,
} from '../store';
import type {
  AdminUser,
  AnalyticsEvent,
  AnalyticsSummary,
  AppNotification,
  AuditLog,
  Banner,
  BannerSlot,
  Cart,
  Category,
  Coupon,
  Database,
  Festival,
  Id,
  InventoryTransaction,
  KitComponent,
  Occasion,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Product,
  RecommendationRule,
  Review,
  Settings,
  Testimonial,
  User,
} from '../types';
import { summarise } from '../local/store';

// ---------------------------------------------------------------------------
// Minimal structural types for the slice of firebase-admin we use
// ---------------------------------------------------------------------------

type DocData = Record<string, unknown>;

interface FsDocSnapshot {
  readonly exists: boolean;
  readonly id: string;
  data(): DocData | undefined;
}

interface FsQuerySnapshot {
  readonly docs: FsDocSnapshot[];
  readonly empty: boolean;
  readonly size: number;
}

interface FsDocRef {
  readonly id: string;
  get(): Promise<FsDocSnapshot>;
  create(data: DocData): Promise<unknown>;
  set(data: DocData, options?: { merge?: boolean }): Promise<unknown>;
  delete(): Promise<unknown>;
}

interface FsQuery {
  where(field: string, op: string, value: unknown): FsQuery;
  orderBy(field: string, direction?: 'asc' | 'desc'): FsQuery;
  limit(count: number): FsQuery;
  get(): Promise<FsQuerySnapshot>;
}

interface FsCollectionRef extends FsQuery {
  doc(id: string): FsDocRef;
}

interface FsTransaction {
  get(ref: FsDocRef): Promise<FsDocSnapshot>;
  get(query: FsQuery): Promise<FsQuerySnapshot>;
  set(ref: FsDocRef, data: DocData, options?: { merge?: boolean }): FsTransaction;
  delete(ref: FsDocRef): FsTransaction;
}

interface FsBatch {
  set(ref: FsDocRef, data: DocData): FsBatch;
  delete(ref: FsDocRef): FsBatch;
  commit(): Promise<unknown>;
}

interface FsFirestore {
  collection(path: string): FsCollectionRef;
  doc(path: string): FsDocRef;
  runTransaction<T>(fn: (transaction: FsTransaction) => Promise<T>): Promise<T>;
  batch(): FsBatch;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

const C = {
  products: 'products',
  categories: 'categories',
  occasions: 'occasions',
  festivals: 'festivals',
  kitComponents: 'kit_components',
  inventoryTransactions: 'inventory_transactions',
  users: 'users',
  carts: 'carts',
  orders: 'orders',
  coupons: 'coupons',
  couponRedemptions: 'coupon_redemptions',
  banners: 'banners',
  reviews: 'reviews',
  testimonials: 'testimonials',
  recommendationRules: 'recommendation_rules',
  notifications: 'notifications',
  adminUsers: 'admin_users',
  auditLogs: 'audit_logs',
  analyticsEvents: 'analytics_events',
} as const;

const META_STORE = 'meta/store';
const META_SETTINGS = 'meta/settings';
const META_COUNTERS = 'meta/counters';

/** Collections small and stable enough to cache between requests. */
const CACHEABLE = new Set<string>([
  C.categories,
  C.occasions,
  C.festivals,
  C.banners,
  C.coupons,
  C.testimonials,
  C.recommendationRules,
]);

const CACHE_TTL_MS = 10_000;

// ---------------------------------------------------------------------------
// Connection, held on globalThis so dev-server reloads reuse one app
// ---------------------------------------------------------------------------

interface FirestoreGlobal {
  db: FsFirestore | null;
  connecting: Promise<FsFirestore> | null;
  seeded: Promise<void> | null;
  cache: Map<string, { at: number; docs: DocData[] }>;
}

const GLOBAL_KEY = '__poojaro_firestore__';

function globals(): FirestoreGlobal {
  const holder = globalThis as typeof globalThis & { [GLOBAL_KEY]?: FirestoreGlobal };
  holder[GLOBAL_KEY] ??= { db: null, connecting: null, seeded: null, cache: new Map() };
  return holder[GLOBAL_KEY];
}

async function connect(): Promise<FsFirestore> {
  const { firebase } = serverEnv();
  if (!firebase.projectId || !firebase.clientEmail || !firebase.privateKey) {
    throw new Error(
      'Firestore is selected but not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
    );
  }

  let app: typeof import('firebase-admin/app');
  let firestore: typeof import('firebase-admin/firestore');
  try {
    app = (await import('firebase-admin/app')) as typeof import('firebase-admin/app');
    firestore = (await import('firebase-admin/firestore')) as typeof import('firebase-admin/firestore');
  } catch {
    throw new Error(
      'DATA_BACKEND=firestore needs the firebase-admin package. Install it with: npm install firebase-admin',
    );
  }

  const existing = app.getApps().find((a) => a.name === 'poojaro');
  const instance =
    existing ??
    app.initializeApp(
      {
        credential: app.cert({
          projectId: firebase.projectId,
          clientEmail: firebase.clientEmail,
          privateKey: firebase.privateKey,
        }),
      },
      'poojaro',
    );

  const db = firestore.getFirestore(instance);
  // Undefined fields are common in optional model properties; dropping them
  // keeps writes from failing on `trackingNumber: undefined` and similar.
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Already initialised on a reused app — nothing to do.
  }
  return db as unknown as FsFirestore;
}

async function fs(): Promise<FsFirestore> {
  const g = globals();
  if (g.db) return g.db;
  g.connecting ??= connect().then((db) => {
    g.db = db;
    g.connecting = null;
    return db;
  });
  return g.connecting;
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

interface TimestampLike {
  toDate(): Date;
}

function isTimestamp(value: unknown): value is TimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  );
}

/**
 * Converts Firestore Timestamps to ISO strings on the way in, so documents the
 * Flutter app wrote with `FieldValue.serverTimestamp()` read the same as ours.
 */
function normalise(value: unknown): unknown {
  if (isTimestamp(value)) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalise);
  if (value && typeof value === 'object') {
    const out: DocData = {};
    for (const [key, inner] of Object.entries(value as DocData)) out[key] = normalise(inner);
    return out;
  }
  return value;
}

function fromDoc<T>(snapshot: FsDocSnapshot): T | null {
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data) return null;
  return normalise({ ...data, id: snapshot.id }) as T;
}

function fromDocs<T>(snapshot: FsQuerySnapshot): T[] {
  return snapshot.docs
    .map((doc) => fromDoc<T>(doc))
    .filter((item): item is T => item !== null);
}

/** Strips `undefined`, which Firestore rejects, and keeps `id` out of the body. */
function toDoc<T extends { id: Id }>(record: T): DocData {
  const { id: _id, ...rest } = record;
  return JSON.parse(JSON.stringify(rest)) as DocData;
}

/**
 * A variant id is not a document id, so `variantIds` is denormalised onto the
 * parent product. That is what lets an admin adjust one variant's stock with a
 * single indexed lookup instead of scanning the catalogue. Every write that can
 * change the variant list must go through here.
 */
function productDoc(product: Product): DocData {
  return { ...toDoc(product), variantIds: product.variants.map((variant) => variant.id) };
}

// ---------------------------------------------------------------------------
// Cached collection reads
// ---------------------------------------------------------------------------

async function readAll<T>(collection: string): Promise<T[]> {
  const g = globals();
  if (CACHEABLE.has(collection)) {
    const hit = g.cache.get(collection);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.docs.map((d) => structuredClone(d)) as T[];
  }
  const db = await fs();
  const snapshot = await db.collection(collection).get();
  const items = fromDocs<T>(snapshot);
  if (CACHEABLE.has(collection)) {
    g.cache.set(collection, { at: Date.now(), docs: items as unknown as DocData[] });
  }
  return items;
}

function invalidate(collection: string): void {
  globals().cache.delete(collection);
}

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

/**
 * Writes the seed dataset the first time the site talks to an empty project.
 * `meta/store` is created with `create()`, which fails if the document already
 * exists — that is the lock that stops two server instances double-seeding.
 * An existing project is never touched.
 */
async function ensureSeeded(): Promise<void> {
  const db = await fs();
  const marker = db.doc(META_STORE);
  const existing = await marker.get();
  if (existing.exists) {
    const version = existing.data()?.schemaVersion;
    if (version !== SCHEMA_VERSION) {
      throw new Error(
        `Firestore project holds schema v${String(version)}, this build expects v${SCHEMA_VERSION}. Migrate the data before deploying.`,
      );
    }
    return;
  }

  try {
    await marker.create({ schemaVersion: SCHEMA_VERSION, seedingStartedAt: nowIso() });
  } catch {
    // Another instance won the race and is seeding. Nothing further to do.
    return;
  }

  console.info('[poojaro] Empty Firestore project detected — writing the seed catalogue.');
  const seed = await buildSeedDatabase();

  const writes: Array<{ path: string; id: Id; data: DocData }> = [];
  const push = <T extends { id: Id }>(collection: string, records: T[]): void => {
    for (const record of records) writes.push({ path: collection, id: record.id, data: toDoc(record) });
  };

  for (const product of seed.products) {
    writes.push({ path: C.products, id: product.id, data: productDoc(product) });
  }
  push(C.categories, seed.categories);
  push(C.occasions, seed.occasions);
  push(C.festivals, seed.festivals);
  push(C.kitComponents, seed.kitComponents);
  push(C.coupons, seed.coupons);
  push(C.banners, seed.banners);
  push(C.reviews, seed.reviews);
  push(C.testimonials, seed.testimonials);
  push(C.recommendationRules, seed.recommendationRules);
  push(C.adminUsers, seed.adminUsers);

  // Firestore caps a batch at 500 writes.
  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    for (const write of writes.slice(i, i + 400)) {
      batch.set(db.collection(write.path).doc(write.id), write.data);
    }
    await batch.commit();
  }

  await db.doc(META_SETTINGS).set(seed.settings as unknown as DocData);
  await db.doc(META_COUNTERS).set({ order: 0 });
  await marker.set({ schemaVersion: SCHEMA_VERSION, seededAt: nowIso() });
  console.info(`[poojaro] Seeded ${writes.length} documents into Firestore.`);
}

async function ready(): Promise<FsFirestore> {
  const g = globals();
  g.seeded ??= ensureSeeded().catch((error) => {
    // Let the next request retry rather than caching a transient failure.
    g.seeded = null;
    throw error;
  });
  await g.seeded;
  return fs();
}

// ---------------------------------------------------------------------------
// Shared write helpers
// ---------------------------------------------------------------------------

async function writeAudit(
  db: FsFirestore,
  actor: Actor,
  action: string,
  entityType: string,
  entityId: Id,
  entityLabel: string,
  changes: AuditLog['changes'],
): Promise<void> {
  const entry: AuditLog = {
    id: newId('audit'),
    actorId: actor.id,
    actorName: actor.name,
    action,
    entityType,
    entityId,
    entityLabel,
    changes,
    createdAt: nowIso(),
  };
  await db.collection(C.auditLogs).doc(entry.id).set(toDoc(entry));
}

async function writeNotification(
  db: FsFirestore,
  userId: Id | null,
  topic: AppNotification['topic'],
  title: string,
  body: string,
  href: string | null,
): Promise<void> {
  const notification: AppNotification = {
    id: newId('ntf'),
    userId,
    topic,
    title,
    body,
    href,
    isRead: false,
    createdAt: nowIso(),
  };
  await db.collection(C.notifications).doc(notification.id).set(toDoc(notification));
}

function ledgerEntry(
  input: Omit<InventoryTransaction, 'id' | 'delta' | 'createdAt' | 'actorId' | 'actorName'>,
  actor: Actor,
): InventoryTransaction {
  return {
    ...input,
    id: newId('inv'),
    delta: input.newQty - input.previousQty,
    actorId: actor.id,
    actorName: actor.name,
    createdAt: nowIso(),
  };
}

function componentRequirements(product: Product, qty: number): Map<Id, number> {
  const required = new Map<Id, number>();
  if (!product.isKit) return required;
  for (const line of product.contents) {
    if (!line.componentId) continue;
    required.set(line.componentId, (required.get(line.componentId) ?? 0) + (line.componentQty ?? 1) * qty);
  }
  return required;
}

function pushTimeline(order: Order, status: OrderStatus, note: string): void {
  order.status = status;
  order.timeline = [...order.timeline, { status, at: nowIso(), note: note || ORDER_STATUS_DETAIL[status] }];
  order.updatedAt = nowIso();
}

function bySortOrder<T extends { sortOrder: number }>(a: T, b: T): number {
  return a.sortOrder - b.sortOrder;
}

// ---------------------------------------------------------------------------
// The adapter
// ---------------------------------------------------------------------------

export class FirestoreDataStore implements DataStore {
  readonly backend = 'firestore' as const;

  // -- Settings ------------------------------------------------------------

  async getSettings(): Promise<Settings> {
    const db = await ready();
    const doc = await db.doc(META_SETTINGS).get();
    const data = doc.data();
    if (!data) throw new Error('Store settings document is missing (meta/settings).');
    return normalise(data) as Settings;
  }

  async updateSettings(patch: Partial<Settings>, actor: Actor): Promise<Settings> {
    const db = await ready();
    const before = await this.getSettings();
    const next: Settings = { ...before, ...patch, updatedAt: nowIso() };
    await db.doc(META_SETTINGS).set(JSON.parse(JSON.stringify(next)) as DocData);
    await writeAudit(db, actor, 'settings.update', 'settings', 'settings', 'Store settings', diffFields(before, next));
    return next;
  }

  // -- Taxonomy ------------------------------------------------------------

  async listCategories(includeInactive = false): Promise<Category[]> {
    await ready();
    const all = await readAll<Category>(C.categories);
    return all.filter((c) => includeInactive || c.isActive).sort(bySortOrder);
  }

  async listOccasions(includeInactive = false): Promise<Occasion[]> {
    await ready();
    const all = await readAll<Occasion>(C.occasions);
    return all.filter((o) => includeInactive || o.isActive).sort(bySortOrder);
  }

  async getOccasionBySlug(slug: string): Promise<Occasion | null> {
    const all = await this.listOccasions(true);
    return all.find((o) => o.slug === slug) ?? null;
  }

  async listFestivals(includeInactive = false): Promise<Festival[]> {
    await ready();
    const all = await readAll<Festival>(C.festivals);
    return all.filter((f) => includeInactive || f.isActive).sort(bySortOrder);
  }

  async getFestivalBySlug(slug: string): Promise<Festival | null> {
    const all = await this.listFestivals(true);
    return all.find((f) => f.slug === slug) ?? null;
  }

  async upsertCategory(category: Category, actor: Actor): Promise<Category> {
    return this.#upsert(C.categories, category, actor, 'category', category.name);
  }

  async upsertOccasion(occasion: Occasion, actor: Actor): Promise<Occasion> {
    return this.#upsert(C.occasions, occasion, actor, 'occasion', occasion.name);
  }

  async upsertFestival(festival: Festival, actor: Actor): Promise<Festival> {
    return this.#upsert(C.festivals, festival, actor, 'festival', festival.name);
  }

  async deleteCategory(id: Id, actor: Actor): Promise<void> {
    const db = await ready();
    const inUse = await db.collection(C.products).where('categoryId', '==', id).limit(1).get();
    if (!inUse.empty) throw new Error('This category still has products. Move them first.');
    const children = await db.collection(C.categories).where('parentId', '==', id).limit(1).get();
    if (!children.empty) throw new Error('This category has subcategories. Remove them first.');
    await this.#delete(C.categories, id, actor, 'category');
  }

  async deleteOccasion(id: Id, actor: Actor): Promise<void> {
    const db = await ready();
    const tagged = await db.collection(C.products).where('occasionIds', 'array-contains', id).get();
    for (const doc of tagged.docs) {
      const product = fromDoc<Product>(doc);
      if (!product) continue;
      await db
        .collection(C.products)
        .doc(product.id)
        .set({ occasionIds: product.occasionIds.filter((o) => o !== id) }, { merge: true });
    }
    const rules = await db.collection(C.recommendationRules).where('occasionId', '==', id).get();
    for (const doc of rules.docs) await db.collection(C.recommendationRules).doc(doc.id).delete();
    invalidate(C.recommendationRules);
    await this.#delete(C.occasions, id, actor, 'occasion');
  }

  async deleteFestival(id: Id, actor: Actor): Promise<void> {
    const db = await ready();
    const tagged = await db.collection(C.products).where('festivalIds', 'array-contains', id).get();
    for (const doc of tagged.docs) {
      const product = fromDoc<Product>(doc);
      if (!product) continue;
      await db
        .collection(C.products)
        .doc(product.id)
        .set({ festivalIds: product.festivalIds.filter((f) => f !== id) }, { merge: true });
    }
    await this.#delete(C.festivals, id, actor, 'festival');
  }

  // -- Catalogue -----------------------------------------------------------

  /**
   * Filtering and sorting happen in memory against the full product list.
   *
   * That is a considered choice for a catalogue of this size: it gives the local
   * and Firestore backends byte-identical search, faceting and relevance
   * behaviour with no composite indexes to maintain. Past a few thousand
   * products, move the indexable predicates (categoryId, status, price range)
   * into the Firestore query and keep only relevance scoring here.
   */
  async listProducts(query: ProductQuery = {}): Promise<Page<Product>> {
    await ready();
    const [products, categories] = await Promise.all([
      readAll<Product>(C.products),
      this.listCategories(true),
    ]);
    return applyProductQuery(products, categories, query);
  }

  async getProductById(id: Id): Promise<Product | null> {
    const db = await ready();
    return fromDoc<Product>(await db.collection(C.products).doc(id).get());
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const db = await ready();
    const snapshot = await db.collection(C.products).where('slug', '==', slug).limit(1).get();
    const first = snapshot.docs[0];
    return first ? fromDoc<Product>(first) : null;
  }

  async getProductsByIds(ids: Id[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const db = await ready();
    const docs = await Promise.all(ids.map((id) => db.collection(C.products).doc(id).get()));
    return docs.map((doc) => fromDoc<Product>(doc)).filter((p): p is Product => p !== null);
  }

  async upsertProduct(product: Product, actor: Actor): Promise<Product> {
    const db = await ready();
    const before = await this.getProductById(product.id);

    const clash = await db.collection(C.products).where('slug', '==', product.slug).limit(2).get();
    if (clash.docs.some((doc) => doc.id !== product.id)) {
      throw new Error(`Another product already uses the URL "/products/${product.slug}".`);
    }

    // Stock is ledger-controlled; an edit form cannot move it.
    const variants = product.variants.map((variant) => {
      const prior = before?.variants.find((v) => v.id === variant.id);
      return { ...variant, stock: prior ? prior.stock : variant.stock };
    });
    const next: Product = {
      ...product,
      stock: variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : before?.stock ?? product.stock,
      variants,
      createdAt: before?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    };

    await db.collection(C.products).doc(next.id).set(productDoc(next));

    if (!before && next.stock !== 0) {
      const entry = ledgerEntry(
        {
          targetId: next.id,
          targetType: 'product',
          targetName: next.name,
          previousQty: 0,
          newQty: next.stock,
          reason: 'correction',
          note: 'Opening stock on product creation',
        },
        actor,
      );
      await db.collection(C.inventoryTransactions).doc(entry.id).set(toDoc(entry));
    }

    await writeAudit(
      db,
      actor,
      before ? 'product.update' : 'product.create',
      'product',
      next.id,
      next.name,
      diffFields(before, next),
    );
    return next;
  }

  async deleteProduct(id: Id, actor: Actor): Promise<void> {
    const db = await ready();
    const product = await this.getProductById(id);
    if (!product) return;

    const ordered = await db.collection(C.orders).where('itemProductIds', 'array-contains', id).limit(1).get();
    if (!ordered.empty) {
      // Archive rather than destroy, so order history keeps its product record.
      await db.collection(C.products).doc(id).set({ status: 'archived', updatedAt: nowIso() }, { merge: true });
      await writeAudit(db, actor, 'product.archive', 'product', id, product.name, [
        { field: 'status', from: product.status, to: 'archived' },
      ]);
      return;
    }

    await db.collection(C.products).doc(id).delete();
    const reviews = await db.collection(C.reviews).where('productId', '==', id).get();
    for (const doc of reviews.docs) await db.collection(C.reviews).doc(doc.id).delete();
    await writeAudit(db, actor, 'product.delete', 'product', id, product.name, [
      { field: '*', from: 'existed', to: null },
    ]);
  }

  // -- Inventory -----------------------------------------------------------

  async listKitComponents(): Promise<KitComponent[]> {
    await ready();
    const all = await readAll<KitComponent>(C.kitComponents);
    return all.sort((a, b) => a.name.localeCompare(b.name));
  }

  async upsertKitComponent(component: KitComponent, actor: Actor): Promise<KitComponent> {
    const db = await ready();
    const existing = fromDoc<KitComponent>(await db.collection(C.kitComponents).doc(component.id).get());
    const next: KitComponent = {
      ...component,
      stock: existing ? existing.stock : component.stock,
      updatedAt: nowIso(),
    };
    await db.collection(C.kitComponents).doc(next.id).set(toDoc(next));
    if (!existing && next.stock !== 0) {
      const entry = ledgerEntry(
        {
          targetId: next.id,
          targetType: 'component',
          targetName: next.name,
          previousQty: 0,
          newQty: next.stock,
          reason: 'correction',
          note: 'Opening stock on component creation',
        },
        actor,
      );
      await db.collection(C.inventoryTransactions).doc(entry.id).set(toDoc(entry));
    }
    await writeAudit(
      db,
      actor,
      existing ? 'component.update' : 'component.create',
      'component',
      next.id,
      next.name,
      diffFields(existing, next),
    );
    return next;
  }

  async adjustStock(adjustment: StockAdjustment, actor: Actor): Promise<InventoryTransaction> {
    const db = await ready();
    const { targetId, targetType, reason, note, orderId } = adjustment;

    const outcome = await db.runTransaction(async (tx) => {
      if (targetType === 'component') {
        const ref = db.collection(C.kitComponents).doc(targetId);
        const component = fromDoc<KitComponent>(await tx.get(ref));
        if (!component) throw new Error(`Component ${targetId} not found.`);
        const previousQty = component.stock;
        const newQty = adjustment.newQty ?? previousQty + adjustment.delta;
        guardQty(newQty, component.name);
        tx.set(ref, { stock: newQty, updatedAt: nowIso() }, { merge: true });
        return {
          name: component.name,
          previousQty,
          newQty,
          threshold: component.lowStockThreshold,
          href: '/admin/inventory',
        };
      }

      if (targetType === 'variant') {
        // A variant id is not a document id, so the parent product carries it.
        const parents = await tx.get(
          db.collection(C.products).where('variantIds', 'array-contains', targetId).limit(1),
        );
        const parentDoc = parents.docs[0];
        const product = parentDoc ? fromDoc<Product>(parentDoc) : null;
        const variant = product?.variants.find((v) => v.id === targetId);
        if (!product || !variant) throw new Error(`Variant ${targetId} not found.`);
        const previousQty = variant.stock;
        const newQty = adjustment.newQty ?? previousQty + adjustment.delta;
        const name = `${product.name} — ${variant.label}`;
        guardQty(newQty, name);
        const variants = product.variants.map((v) => (v.id === targetId ? { ...v, stock: newQty } : v));
        tx.set(
          db.collection(C.products).doc(product.id),
          { variants, stock: variants.reduce((sum, v) => sum + v.stock, 0), updatedAt: nowIso() },
          { merge: true },
        );
        return {
          name,
          previousQty,
          newQty,
          threshold: product.lowStockThreshold,
          href: `/admin/products/${product.id}`,
        };
      }

      const ref = db.collection(C.products).doc(targetId);
      const product = fromDoc<Product>(await tx.get(ref));
      if (!product) throw new Error(`Product ${targetId} not found.`);
      if (product.variants.length > 0) {
        throw new Error(`${product.name} has variants — adjust the variant stock instead.`);
      }
      const previousQty = product.stock;
      const newQty = adjustment.newQty ?? previousQty + adjustment.delta;
      guardQty(newQty, product.name);
      tx.set(ref, { stock: newQty, updatedAt: nowIso() }, { merge: true });
      return {
        name: product.name,
        previousQty,
        newQty,
        threshold: product.lowStockThreshold,
        href: `/admin/products/${product.id}`,
      };
    });

    const entry = ledgerEntry(
      {
        targetId,
        targetType,
        targetName: outcome.name,
        previousQty: outcome.previousQty,
        newQty: outcome.newQty,
        reason,
        note,
        ...(orderId ? { orderId } : {}),
      },
      actor,
    );
    await db.collection(C.inventoryTransactions).doc(entry.id).set(toDoc(entry));
    if (outcome.newQty <= outcome.threshold) {
      await writeNotification(
        db,
        null,
        'low_stock',
        outcome.newQty <= 0 ? 'Out of stock' : 'Low stock',
        outcome.newQty <= 0
          ? `${outcome.name} is out of stock.`
          : `${outcome.name} is down to ${outcome.newQty}, below its threshold of ${outcome.threshold}.`,
        outcome.href,
      );
    }
    await writeAudit(db, actor, 'inventory.adjust', targetType, targetId, outcome.name, [
      { field: 'stock', from: outcome.previousQty, to: outcome.newQty },
      { field: 'reason', from: null, to: reason },
    ]);
    return entry;
  }

  async listInventoryTransactions(query: InventoryQuery = {}): Promise<Page<InventoryTransaction>> {
    const db = await ready();
    let ref: FsQuery = db.collection(C.inventoryTransactions);
    if (query.targetId) ref = ref.where('targetId', '==', query.targetId);
    if (query.reason) ref = ref.where('reason', '==', query.reason);
    if (query.orderId) ref = ref.where('orderId', '==', query.orderId);
    const snapshot = await ref.orderBy('createdAt', 'desc').limit((query.offset ?? 0) + (query.limit ?? 200)).get();
    return paginate(fromDocs<InventoryTransaction>(snapshot), query.limit, query.offset);
  }

  // -- Cart ----------------------------------------------------------------

  async getCart(id: Id): Promise<Cart | null> {
    const db = await ready();
    return fromDoc<Cart>(await db.collection(C.carts).doc(id).get());
  }

  async saveCart(cart: Cart): Promise<Cart> {
    const db = await ready();
    const next: Cart = { ...cart, updatedAt: nowIso() };
    await db.collection(C.carts).doc(next.id).set(toDoc(next));
    return next;
  }

  async deleteCart(id: Id): Promise<void> {
    const db = await ready();
    await db.collection(C.carts).doc(id).delete();
  }

  // -- Coupons -------------------------------------------------------------

  async listCoupons(includeInactive = false): Promise<Coupon[]> {
    await ready();
    const all = await readAll<Coupon>(C.coupons);
    return all.filter((c) => includeInactive || c.isActive).sort((a, b) => a.code.localeCompare(b.code));
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    const normalised = code.trim().toUpperCase();
    const all = await this.listCoupons(true);
    return all.find((c) => c.code.toUpperCase() === normalised) ?? null;
  }

  async upsertCoupon(coupon: Coupon, actor: Actor): Promise<Coupon> {
    const db = await ready();
    const code = coupon.code.trim().toUpperCase();
    const all = await this.listCoupons(true);
    if (all.some((c) => c.code.toUpperCase() === code && c.id !== coupon.id)) {
      throw new Error(`Coupon code ${code} already exists.`);
    }
    const before = all.find((c) => c.id === coupon.id) ?? null;
    const next: Coupon = {
      ...coupon,
      code,
      usageCount: before?.usageCount ?? 0,
      createdAt: before?.createdAt ?? nowIso(),
    };
    await db.collection(C.coupons).doc(next.id).set(toDoc(next));
    invalidate(C.coupons);
    await writeAudit(db, actor, before ? 'coupon.update' : 'coupon.create', 'coupon', next.id, next.code, diffFields(before, next));
    return next;
  }

  async deleteCoupon(id: Id, actor: Actor): Promise<void> {
    await this.#delete(C.coupons, id, actor, 'coupon');
  }

  async countCouponRedemptions(couponId: Id, userId: Id | null): Promise<number> {
    const db = await ready();
    const snapshot = await db
      .collection(C.couponRedemptions)
      .where('couponId', '==', couponId)
      .where('userId', '==', userId)
      .get();
    return snapshot.size;
  }

  // -- Orders --------------------------------------------------------------

  async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    if (input.items.length === 0) {
      return { ok: false, code: 'empty_cart', message: 'Your ritual box is waiting to be filled.' };
    }
    const db = await ready();
    const settings = await this.getSettings();
    const coupon = input.couponCode ? await this.getCouponByCode(input.couponCode) : null;
    if (input.couponCode && !coupon) {
      return { ok: false, code: 'invalid_coupon', message: 'That code is not valid.' };
    }

    const email = input.email.trim().toLowerCase();
    const productIds = [...new Set(input.items.map((item) => item.productId))];

    const result = await db.runTransaction(async (tx): Promise<PlaceOrderResult> => {
      // ---- Reads (Firestore requires all reads before any write) ----------
      const productRefs = productIds.map((id) => db.collection(C.products).doc(id));
      const productSnapshots = await Promise.all(productRefs.map((ref) => tx.get(ref)));
      const products = productSnapshots
        .map((snapshot) => fromDoc<Product>(snapshot))
        .filter((p): p is Product => p !== null);

      const counterRef = db.doc(META_COUNTERS);
      const counterSnapshot = await tx.get(counterRef);

      const priorOrders = await tx.get(
        input.userId
          ? db.collection(C.orders).where('userId', '==', input.userId).limit(1)
          : db.collection(C.orders).where('email', '==', email).limit(1),
      );
      const firstOrder = priorOrders.empty;

      const redemptions = coupon
        ? (
            await tx.get(
              db
                .collection(C.couponRedemptions)
                .where('couponId', '==', coupon.id)
                .where('userId', '==', input.userId),
            )
          ).size
        : 0;

      const couponRef = coupon ? db.collection(C.coupons).doc(coupon.id) : null;
      const freshCoupon = couponRef ? fromDoc<Coupon>(await tx.get(couponRef)) : null;

      // ---- Price from the catalogue, not from the browser ------------------
      const priced = priceCart({
        items: input.items,
        products,
        settings,
        coupon: freshCoupon,
        paymentMethod: input.paymentMethod,
        isFirstOrder: firstOrder,
        couponRedemptionsByUser: redemptions,
      });

      // Classify every line the cart could not honour. Sold-out and withdrawn
      // items get different codes so the shopper reads the right message.
      const { shortfalls, unavailable } = findShortfalls(input.items, products, priced.lines);

      if (unavailable.length > 0) {
        const [first] = unavailable;
        return {
          ok: false,
          code: 'product_unavailable',
          message:
            unavailable.length === 1 && first
              ? `${first.name} is currently unavailable. Please remove it to continue.`
              : 'Some items in your cart are no longer available. Please review your cart.',
          shortfalls: unavailable,
        };
      }

      if (shortfalls.length > 0) {
        const [first] = shortfalls;
        return {
          ok: false,
          code: 'out_of_stock',
          message:
            shortfalls.length === 1 && first
              ? first.available === 0
                ? `${first.name} sold out while you were checking out.`
                : `Only ${first.available} of ${first.name} left. Please adjust the quantity.`
              : 'Stock changed while you were checking out. Please review your cart.',
          shortfalls,
        };
      }

      if (priced.lines.length === 0) {
        return {
          ok: false,
          code: 'product_unavailable',
          message: 'The items in your cart are no longer available.',
        };
      }

      if (freshCoupon) {
        const check = evaluateCoupon({
          coupon: freshCoupon,
          lines: priced.lines,
          products,
          subtotal: priced.totals.subtotal,
          isFirstOrder: firstOrder,
          couponRedemptionsByUser: redemptions,
          now: new Date(),
        });
        if (!check.ok) return { ok: false, code: 'invalid_coupon', message: check.message };
      }

      // ---- Component availability ----------------------------------------
      const componentDraw = new Map<Id, number>();
      for (const line of priced.lines) {
        const product = products.find((p) => p.id === line.productId);
        if (!product) continue;
        for (const [componentId, units] of componentRequirements(product, line.qty)) {
          componentDraw.set(componentId, (componentDraw.get(componentId) ?? 0) + units);
        }
      }
      const componentIds = [...componentDraw.keys()];
      const componentSnapshots = await Promise.all(
        componentIds.map((id) => tx.get(db.collection(C.kitComponents).doc(id))),
      );
      const components = new Map<Id, KitComponent>();
      for (const snapshot of componentSnapshots) {
        const component = fromDoc<KitComponent>(snapshot);
        if (component) components.set(component.id, component);
      }
      for (const [componentId, units] of componentDraw) {
        const component = components.get(componentId);
        if (!component) continue;
        if (component.stock < units) {
          const kit = priced.lines.find((line) => {
            const product = products.find((p) => p.id === line.productId);
            return product?.contents.some((entry) => entry.componentId === componentId) ?? false;
          });
          return {
            ok: false,
            code: 'out_of_stock',
            message: `We are short on ${component.name}, which goes into this kit. Please reduce the quantity or try again shortly.`,
            shortfalls: kit
              ? [{ productId: kit.productId, name: kit.name, requested: kit.qty, available: Math.max(0, kit.qty - 1) }]
              : [],
          };
        }
      }

      // ---- Writes ---------------------------------------------------------
      const sequence = ((counterSnapshot.data()?.order as number | undefined) ?? 0) + 1;
      tx.set(counterRef, { order: sequence }, { merge: true });
      const orderNumber = formatOrderNumber(sequence);
      const orderId = newId('ord');
      const customerActor: Actor = {
        id: input.userId ?? 'guest',
        name: input.shippingAddress.fullName || email,
        kind: 'customer',
      };

      const items: OrderItem[] = priced.lines.map((line) => {
        const product = products.find((p) => p.id === line.productId)!;
        const variant = line.variantId ? product.variants.find((v) => v.id === line.variantId) ?? null : null;
        return {
          productId: line.productId,
          variantId: line.variantId,
          name: line.name,
          variantLabel: line.variantLabel,
          slug: line.slug,
          sku: variant?.sku ?? product.sku,
          image: line.image?.url ?? null,
          unitPrice: line.unitPrice,
          unitMrp: line.unitMrp,
          qty: line.qty,
          lineTotal: line.lineTotal,
        };
      });

      const ledger: InventoryTransaction[] = [];

      for (const line of priced.lines) {
        const product = products.find((p) => p.id === line.productId)!;
        const ref = db.collection(C.products).doc(product.id);
        if (line.variantId) {
          const variants = product.variants.map((v) =>
            v.id === line.variantId ? { ...v, stock: v.stock - line.qty } : v,
          );
          const variant = product.variants.find((v) => v.id === line.variantId)!;
          const updated = variants.find((v) => v.id === line.variantId)!;
          tx.set(
            ref,
            { variants, stock: variants.reduce((sum, v) => sum + v.stock, 0), updatedAt: nowIso() },
            { merge: true },
          );
          ledger.push(
            ledgerEntry(
              {
                targetId: variant.id,
                targetType: 'variant',
                targetName: `${product.name} — ${variant.label}`,
                previousQty: variant.stock,
                newQty: updated.stock,
                reason: 'sale',
                note: `Order ${orderNumber}`,
                orderId,
              },
              customerActor,
            ),
          );
        } else {
          tx.set(ref, { stock: product.stock - line.qty, updatedAt: nowIso() }, { merge: true });
          ledger.push(
            ledgerEntry(
              {
                targetId: product.id,
                targetType: 'product',
                targetName: product.name,
                previousQty: product.stock,
                newQty: product.stock - line.qty,
                reason: 'sale',
                note: `Order ${orderNumber}`,
                orderId,
              },
              customerActor,
            ),
          );
        }
      }

      for (const [componentId, units] of componentDraw) {
        const component = components.get(componentId);
        if (!component) continue;
        tx.set(
          db.collection(C.kitComponents).doc(componentId),
          { stock: component.stock - units, updatedAt: nowIso() },
          { merge: true },
        );
        ledger.push(
          ledgerEntry(
            {
              targetId: componentId,
              targetType: 'component',
              targetName: component.name,
              previousQty: component.stock,
              newQty: component.stock - units,
              reason: 'sale',
              note: `Consumed by order ${orderNumber}`,
              orderId,
            },
            customerActor,
          ),
        );
      }

      for (const entry of ledger) {
        tx.set(db.collection(C.inventoryTransactions).doc(entry.id), toDoc(entry));
      }

      if (freshCoupon && couponRef) {
        tx.set(couponRef, { usageCount: freshCoupon.usageCount + 1 }, { merge: true });
        const redemptionId = newId('red');
        tx.set(db.collection(C.couponRedemptions).doc(redemptionId), {
          couponId: freshCoupon.id,
          userId: input.userId,
          orderId,
          at: nowIso(),
        });
      }

      const order: Order = {
        id: orderId,
        orderNumber,
        userId: input.userId,
        email,
        phone: input.phone,
        items,
        shippingAddress: input.shippingAddress,
        totals: priced.totals,
        status: 'pending',
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentStatus,
        ...(input.razorpayOrderId ? { razorpayOrderId: input.razorpayOrderId } : {}),
        ...(input.razorpayPaymentId ? { razorpayPaymentId: input.razorpayPaymentId } : {}),
        timeline: [{ status: 'pending', at: nowIso(), note: ORDER_STATUS_DETAIL.pending }],
        internalNotes: [],
        estimatedDelivery: addBusinessDays(new Date(), settings.deliveryDaysMax).toISOString(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      if (input.paymentStatus === 'paid') {
        pushTimeline(order, 'payment_confirmed', ORDER_STATUS_DETAIL.payment_confirmed);
      }

      tx.set(db.collection(C.orders).doc(orderId), {
        ...toDoc(order),
        // Denormalised so `array-contains` can answer "was this product ever
        // ordered?" without reading every order document.
        itemProductIds: items.map((item) => item.productId),
      });

      return { ok: true, order };
    });

    if (!result.ok) return result;

    if (coupon) invalidate(C.coupons);
    const copy = notificationCopy('pending', result.order.orderNumber);
    if (copy) {
      await writeNotification(db, input.userId, 'order_placed', copy.title, copy.body, `/orders/${result.order.orderNumber}`);
    }
    if (result.order.status === 'payment_confirmed') {
      const paid = notificationCopy('payment_confirmed', result.order.orderNumber);
      if (paid) {
        await writeNotification(db, input.userId, 'payment_successful', paid.title, paid.body, `/orders/${result.order.orderNumber}`);
      }
    }
    await this.recordAnalyticsEvent({
      name: 'purchase',
      value: result.order.totals.total,
      meta: { orderId: result.order.id, items: result.order.items.length },
      sessionId: 'server',
    });
    return result;
  }

  async getOrderById(id: Id): Promise<Order | null> {
    const db = await ready();
    return fromDoc<Order>(await db.collection(C.orders).doc(id).get());
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const db = await ready();
    const snapshot = await db
      .collection(C.orders)
      .where('orderNumber', '==', orderNumber.trim().toUpperCase())
      .limit(1)
      .get();
    const first = snapshot.docs[0];
    return first ? fromDoc<Order>(first) : null;
  }

  async listOrders(query: OrderQuery = {}): Promise<Page<Order>> {
    const db = await ready();
    let ref: FsQuery = db.collection(C.orders);
    // Indexable predicates go to Firestore; free-text search and pagination are
    // applied in memory by the shared helper so both backends agree.
    if (query.userId) ref = ref.where('userId', '==', query.userId);
    if (query.email) ref = ref.where('email', '==', query.email.trim().toLowerCase());
    if (query.status && query.status !== 'any') ref = ref.where('status', '==', query.status);
    if (query.paymentStatus && query.paymentStatus !== 'any') {
      ref = ref.where('paymentStatus', '==', query.paymentStatus);
    }
    const snapshot = await ref.orderBy('createdAt', 'desc').limit(500).get();
    return applyOrderQuery(fromDocs<Order>(snapshot), { ...query, userId: undefined, email: undefined });
  }

  async updateOrderStatus(id: Id, status: OrderStatus, note: string, actor: Actor): Promise<Order> {
    const db = await ready();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order ${id} not found.`);
    if (order.status === status) return order;
    if (!canTransition(order.status, status)) {
      throw new Error(`An order cannot move from ${order.status} to ${status}.`);
    }
    const from = order.status;
    if (status === 'cancelled' || status === 'returned') {
      await this.#restock(order, status === 'cancelled' ? 'Order cancelled' : 'Order returned', actor);
    }
    pushTimeline(order, status, note);
    if (status === 'payment_confirmed') order.paymentStatus = 'paid';
    await db
      .collection(C.orders)
      .doc(id)
      .set(
        {
          status: order.status,
          paymentStatus: order.paymentStatus,
          timeline: JSON.parse(JSON.stringify(order.timeline)) as DocData[],
          updatedAt: order.updatedAt,
        },
        { merge: true },
      );

    const topic = NOTIFICATION_FOR_STATUS[status];
    const copy = notificationCopy(status, order.orderNumber);
    if (topic && copy) {
      await writeNotification(db, order.userId, topic, copy.title, copy.body, `/orders/${order.orderNumber}`);
    }
    await writeAudit(db, actor, 'order.status', 'order', order.id, order.orderNumber, [
      { field: 'status', from, to: status },
    ]);
    return order;
  }

  async updateOrderPayment(
    id: Id,
    payment: { paymentStatus: PaymentStatus; razorpayPaymentId?: string; razorpayOrderId?: string },
    actor: Actor,
  ): Promise<Order> {
    const db = await ready();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order ${id} not found.`);
    const from = order.paymentStatus;
    order.paymentStatus = payment.paymentStatus;
    if (payment.razorpayPaymentId) order.razorpayPaymentId = payment.razorpayPaymentId;
    if (payment.razorpayOrderId) order.razorpayOrderId = payment.razorpayOrderId;
    order.updatedAt = nowIso();

    if (payment.paymentStatus === 'paid' && canTransition(order.status, 'payment_confirmed')) {
      pushTimeline(order, 'payment_confirmed', ORDER_STATUS_DETAIL.payment_confirmed);
      const copy = notificationCopy('payment_confirmed', order.orderNumber);
      if (copy) {
        await writeNotification(db, order.userId, 'payment_successful', copy.title, copy.body, `/orders/${order.orderNumber}`);
      }
    }
    await db
      .collection(C.orders)
      .doc(id)
      .set(
        {
          status: order.status,
          paymentStatus: order.paymentStatus,
          ...(order.razorpayPaymentId ? { razorpayPaymentId: order.razorpayPaymentId } : {}),
          ...(order.razorpayOrderId ? { razorpayOrderId: order.razorpayOrderId } : {}),
          timeline: JSON.parse(JSON.stringify(order.timeline)) as DocData[],
          updatedAt: order.updatedAt,
        },
        { merge: true },
      );
    await writeAudit(db, actor, 'order.payment', 'order', order.id, order.orderNumber, [
      { field: 'paymentStatus', from, to: payment.paymentStatus },
    ]);
    return order;
  }

  async cancelOrder(id: Id, reason: string, actor: Actor): Promise<Order> {
    const db = await ready();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order ${id} not found.`);
    if (!canTransition(order.status, 'cancelled')) {
      throw new Error(`An order that is ${order.status} can no longer be cancelled.`);
    }
    const from = order.status;
    await this.#restock(order, `Cancelled: ${reason}`, actor);
    pushTimeline(order, 'cancelled', reason || 'Order cancelled.');
    order.internalNotes = [...order.internalNotes, `[${nowIso()}] ${actor.name} cancelled: ${reason}`];
    await db
      .collection(C.orders)
      .doc(id)
      .set(
        {
          status: order.status,
          timeline: JSON.parse(JSON.stringify(order.timeline)) as DocData[],
          internalNotes: order.internalNotes,
          updatedAt: order.updatedAt,
        },
        { merge: true },
      );
    await writeAudit(db, actor, 'order.cancel', 'order', order.id, order.orderNumber, [
      { field: 'status', from, to: 'cancelled' },
      { field: 'reason', from: null, to: reason },
    ]);
    return order;
  }

  async refundOrder(id: Id, note: string, actor: Actor): Promise<Order> {
    const db = await ready();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order ${id} not found.`);
    if (!canTransition(order.status, 'refunded')) {
      throw new Error(`Refund the order after it is cancelled or returned (currently ${order.status}).`);
    }
    const from = order.status;
    order.paymentStatus = 'refunded';
    pushTimeline(order, 'refunded', note || 'Refund issued.');
    order.internalNotes = [...order.internalNotes, `[${nowIso()}] ${actor.name} recorded a refund: ${note}`];
    await db
      .collection(C.orders)
      .doc(id)
      .set(
        {
          status: order.status,
          paymentStatus: order.paymentStatus,
          timeline: JSON.parse(JSON.stringify(order.timeline)) as DocData[],
          internalNotes: order.internalNotes,
          updatedAt: order.updatedAt,
        },
        { merge: true },
      );
    await writeAudit(db, actor, 'order.refund', 'order', order.id, order.orderNumber, [
      { field: 'status', from, to: 'refunded' },
      { field: 'amount', from: null, to: order.totals.total },
    ]);
    return order;
  }

  async addOrderNote(id: Id, note: string, actor: Actor): Promise<Order> {
    const db = await ready();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order ${id} not found.`);
    order.internalNotes = [...order.internalNotes, `[${nowIso()}] ${actor.name}: ${note}`];
    order.updatedAt = nowIso();
    await db
      .collection(C.orders)
      .doc(id)
      .set({ internalNotes: order.internalNotes, updatedAt: order.updatedAt }, { merge: true });
    await writeAudit(db, actor, 'order.note', 'order', order.id, order.orderNumber, [
      { field: 'internalNotes', from: null, to: note },
    ]);
    return order;
  }

  async setOrderTracking(
    id: Id,
    tracking: { trackingNumber: string; courier: string },
    actor: Actor,
  ): Promise<Order> {
    const db = await ready();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order ${id} not found.`);
    const before = { trackingNumber: order.trackingNumber ?? null, courier: order.courier ?? null };
    order.trackingNumber = tracking.trackingNumber;
    order.courier = tracking.courier;
    order.updatedAt = nowIso();
    await db.collection(C.orders).doc(id).set({ ...tracking, updatedAt: order.updatedAt }, { merge: true });
    await writeAudit(db, actor, 'order.tracking', 'order', order.id, order.orderNumber, [
      { field: 'trackingNumber', from: before.trackingNumber, to: tracking.trackingNumber },
      { field: 'courier', from: before.courier, to: tracking.courier },
    ]);
    return order;
  }

  // -- Customers -----------------------------------------------------------

  async getUserById(id: Id): Promise<User | null> {
    const db = await ready();
    return fromDoc<User>(await db.collection(C.users).doc(id).get());
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await ready();
    const snapshot = await db
      .collection(C.users)
      .where('email', '==', email.trim().toLowerCase())
      .limit(1)
      .get();
    const first = snapshot.docs[0];
    return first ? fromDoc<User>(first) : null;
  }

  async upsertUser(user: User): Promise<User> {
    const db = await ready();
    const next: User = { ...user, email: user.email.trim().toLowerCase() };
    await db.collection(C.users).doc(next.id).set(toDoc(next));
    return next;
  }

  async listUsers(query: { search?: string; limit?: number; offset?: number } = {}): Promise<Page<User>> {
    const db = await ready();
    const snapshot = await db.collection(C.users).orderBy('createdAt', 'desc').limit(500).get();
    const search = query.search?.trim().toLowerCase();
    const users = fromDocs<User>(snapshot).filter((user) =>
      search ? [user.name, user.email, user.phone].join(' ').toLowerCase().includes(search) : true,
    );
    return paginate(users, query.limit, query.offset);
  }

  // -- Reviews & social proof ---------------------------------------------

  async listReviews(productId?: Id, status: Review['status'] | 'any' = 'published'): Promise<Review[]> {
    const db = await ready();
    let ref: FsQuery = db.collection(C.reviews);
    if (productId) ref = ref.where('productId', '==', productId);
    if (status !== 'any') ref = ref.where('status', '==', status);
    const snapshot = await ref.get();
    return fromDocs<Review>(snapshot).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async createReview(review: Review): Promise<Review> {
    const db = await ready();
    await db.collection(C.reviews).doc(review.id).set(toDoc(review));
    await this.#recomputeRating(review.productId);
    return review;
  }

  async setReviewStatus(id: Id, status: Review['status'], actor: Actor): Promise<Review> {
    const db = await ready();
    const review = fromDoc<Review>(await db.collection(C.reviews).doc(id).get());
    if (!review) throw new Error(`Review ${id} not found.`);
    const from = review.status;
    review.status = status;
    await db.collection(C.reviews).doc(id).set({ status }, { merge: true });
    await this.#recomputeRating(review.productId);
    await writeAudit(db, actor, 'review.status', 'review', id, review.title, [
      { field: 'status', from, to: status },
    ]);
    return review;
  }

  async deleteReview(id: Id, actor: Actor): Promise<void> {
    const db = await ready();
    const review = fromDoc<Review>(await db.collection(C.reviews).doc(id).get());
    if (!review) return;
    await db.collection(C.reviews).doc(id).delete();
    await this.#recomputeRating(review.productId);
    await writeAudit(db, actor, 'review.delete', 'review', id, review.title, [
      { field: '*', from: 'existed', to: null },
    ]);
  }

  async purgeDemoSocialProof(actor: Actor): Promise<{ reviews: number; testimonials: number }> {
    const db = await ready();
    const reviews = await db.collection(C.reviews).where('isDemo', '==', true).get();
    const testimonials = await db.collection(C.testimonials).where('isDemo', '==', true).get();

    const affected = new Set<Id>();
    for (const doc of reviews.docs) {
      const productId = doc.data()?.productId;
      if (typeof productId === 'string') affected.add(productId);
    }

    const batch = db.batch();
    for (const doc of reviews.docs) batch.delete(db.collection(C.reviews).doc(doc.id));
    for (const doc of testimonials.docs) batch.delete(db.collection(C.testimonials).doc(doc.id));
    await batch.commit();
    invalidate(C.testimonials);

    for (const productId of affected) await this.#recomputeRating(productId);
    await writeAudit(db, actor, 'social.purge_demo', 'settings', 'social-proof', 'Sample reviews and testimonials', [
      { field: 'reviews', from: reviews.size, to: 0 },
      { field: 'testimonials', from: testimonials.size, to: 0 },
    ]);
    return { reviews: reviews.size, testimonials: testimonials.size };
  }

  async listTestimonials(includeInactive = false): Promise<Testimonial[]> {
    await ready();
    const all = await readAll<Testimonial>(C.testimonials);
    return all.filter((t) => includeInactive || t.isActive).sort(bySortOrder);
  }

  async upsertTestimonial(testimonial: Testimonial, actor: Actor): Promise<Testimonial> {
    return this.#upsert(C.testimonials, testimonial, actor, 'testimonial', testimonial.authorName);
  }

  async deleteTestimonial(id: Id, actor: Actor): Promise<void> {
    await this.#delete(C.testimonials, id, actor, 'testimonial');
  }

  // -- Content -------------------------------------------------------------

  async listBanners(slot?: BannerSlot, includeInactive = false): Promise<Banner[]> {
    await ready();
    const all = await readAll<Banner>(C.banners);
    const now = Date.now();
    return all
      .filter((banner) => {
        if (slot && banner.slot !== slot) return false;
        if (includeInactive) return true;
        if (!banner.isActive) return false;
        if (banner.startsAt && now < Date.parse(banner.startsAt)) return false;
        if (banner.endsAt && now > Date.parse(banner.endsAt)) return false;
        return true;
      })
      .sort(bySortOrder);
  }

  async upsertBanner(banner: Banner, actor: Actor): Promise<Banner> {
    return this.#upsert(C.banners, banner, actor, 'banner', banner.title);
  }

  async deleteBanner(id: Id, actor: Actor): Promise<void> {
    await this.#delete(C.banners, id, actor, 'banner');
  }

  // -- Ritual Finder -------------------------------------------------------

  async listRecommendationRules(includeInactive = false): Promise<RecommendationRule[]> {
    await ready();
    const all = await readAll<RecommendationRule>(C.recommendationRules);
    return all.filter((r) => includeInactive || r.isActive).sort(bySortOrder);
  }

  async upsertRecommendationRule(rule: RecommendationRule, actor: Actor): Promise<RecommendationRule> {
    return this.#upsert(C.recommendationRules, rule, actor, 'recommendation_rule', rule.id);
  }

  async deleteRecommendationRule(id: Id, actor: Actor): Promise<void> {
    await this.#delete(C.recommendationRules, id, actor, 'recommendation_rule');
  }

  // -- Notifications -------------------------------------------------------

  async listNotifications(userId: Id | null, limit = 30): Promise<AppNotification[]> {
    const db = await ready();
    const snapshot = await db
      .collection(C.notifications)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return fromDocs<AppNotification>(snapshot);
  }

  async createNotification(notification: AppNotification): Promise<AppNotification> {
    const db = await ready();
    await db.collection(C.notifications).doc(notification.id).set(toDoc(notification));
    return notification;
  }

  async markNotificationsRead(userId: Id | null, ids?: Id[]): Promise<number> {
    const db = await ready();
    const snapshot = await db
      .collection(C.notifications)
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();
    const targets = snapshot.docs.filter((doc) => !ids || ids.includes(doc.id));
    if (targets.length === 0) return 0;
    const batch = db.batch();
    for (const doc of targets) batch.set(db.collection(C.notifications).doc(doc.id), { isRead: true });
    await batch.commit();
    return targets.length;
  }

  // -- Admin ---------------------------------------------------------------

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    const db = await ready();
    const snapshot = await db
      .collection(C.adminUsers)
      .where('email', '==', email.trim().toLowerCase())
      .limit(1)
      .get();
    const first = snapshot.docs[0];
    return first ? fromDoc<AdminUser>(first) : null;
  }

  async getAdminById(id: Id): Promise<AdminUser | null> {
    const db = await ready();
    return fromDoc<AdminUser>(await db.collection(C.adminUsers).doc(id).get());
  }

  async listAdmins(): Promise<AdminUser[]> {
    const db = await ready();
    const snapshot = await db.collection(C.adminUsers).get();
    return fromDocs<AdminUser>(snapshot).sort((a, b) => a.name.localeCompare(b.name));
  }

  async upsertAdmin(admin: AdminUser, actor: Actor): Promise<AdminUser> {
    const db = await ready();
    const all = await this.listAdmins();
    const email = admin.email.trim().toLowerCase();
    if (all.some((a) => a.email.toLowerCase() === email && a.id !== admin.id)) {
      throw new Error(`${email} is already an admin.`);
    }
    const before = all.find((a) => a.id === admin.id) ?? null;
    const next: AdminUser = {
      ...admin,
      email,
      passwordHash: admin.passwordHash || before?.passwordHash || '',
      createdAt: before?.createdAt ?? nowIso(),
    };
    if (!next.passwordHash) throw new Error('A new admin needs a password.');
    if (before?.role === 'owner' && next.role !== 'owner') {
      const owners = all.filter((a) => a.role === 'owner' && a.isActive).length;
      if (owners <= 1) throw new Error('There must be at least one active owner.');
    }
    await db.collection(C.adminUsers).doc(next.id).set(toDoc(next));

    const changes = diffFields(before, next).filter((change) => change.field !== 'passwordHash');
    if (before && before.passwordHash !== next.passwordHash) {
      changes.push({ field: 'password', from: '(hash)', to: '(new hash)' });
    }
    await writeAudit(db, actor, before ? 'admin.update' : 'admin.create', 'admin', next.id, next.email, changes);
    return next;
  }

  async deleteAdmin(id: Id, actor: Actor): Promise<void> {
    const db = await ready();
    const all = await this.listAdmins();
    const admin = all.find((a) => a.id === id);
    if (!admin) return;
    if (admin.role === 'owner' && all.filter((a) => a.role === 'owner').length <= 1) {
      throw new Error('The last owner account cannot be removed.');
    }
    await db.collection(C.adminUsers).doc(id).delete();
    await writeAudit(db, actor, 'admin.delete', 'admin', id, admin.email, [
      { field: '*', from: 'existed', to: null },
    ]);
  }

  async recordAdminLogin(id: Id): Promise<void> {
    const db = await ready();
    await db.collection(C.adminUsers).doc(id).set({ lastLoginAt: nowIso() }, { merge: true });
  }

  async appendAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const db = await ready();
    const full: AuditLog = { ...entry, id: newId('audit'), createdAt: nowIso() };
    await db.collection(C.auditLogs).doc(full.id).set(toDoc(full));
    return full;
  }

  async listAuditLogs(query: AuditQuery = {}): Promise<Page<AuditLog>> {
    const db = await ready();
    let ref: FsQuery = db.collection(C.auditLogs);
    if (query.actorId) ref = ref.where('actorId', '==', query.actorId);
    if (query.entityType) ref = ref.where('entityType', '==', query.entityType);
    if (query.entityId) ref = ref.where('entityId', '==', query.entityId);
    const snapshot = await ref.orderBy('createdAt', 'desc').limit((query.offset ?? 0) + (query.limit ?? 200)).get();
    return paginate(fromDocs<AuditLog>(snapshot), query.limit, query.offset);
  }

  // -- Analytics -----------------------------------------------------------

  async recordAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<void> {
    const db = await ready();
    const full: AnalyticsEvent = { ...event, id: newId('evt'), createdAt: nowIso() };
    await db.collection(C.analyticsEvents).doc(full.id).set(toDoc(full));
  }

  async getAnalyticsSummary(range: AnalyticsRange): Promise<AnalyticsSummary> {
    const db = await ready();
    const [orders, events] = await Promise.all([
      db
        .collection(C.orders)
        .where('createdAt', '>=', range.from)
        .where('createdAt', '<=', range.to)
        .get(),
      db
        .collection(C.analyticsEvents)
        .where('createdAt', '>=', range.from)
        .where('createdAt', '<=', range.to)
        .get(),
    ]);
    // The rollup arithmetic lives with the local adapter so both backends
    // produce identical numbers from the same records.
    const partial = {
      orders: fromDocs<Order>(orders),
      analyticsEvents: fromDocs<AnalyticsEvent>(events),
    } as unknown as Database;
    return summarise(partial, range);
  }

  // -- Internals -----------------------------------------------------------

  async #upsert<T extends { id: Id }>(
    collection: string,
    record: T,
    actor: Actor,
    entityType: string,
    label: string,
  ): Promise<T> {
    const db = await ready();
    const before = fromDoc<T>(await db.collection(collection).doc(record.id).get());
    await db.collection(collection).doc(record.id).set(toDoc(record));
    invalidate(collection);
    await writeAudit(
      db,
      actor,
      before ? `${entityType}.update` : `${entityType}.create`,
      entityType,
      record.id,
      label,
      diffFields(before, record),
    );
    return record;
  }

  async #delete(collection: string, id: Id, actor: Actor, entityType: string): Promise<void> {
    const db = await ready();
    const existing = await db.collection(collection).doc(id).get();
    if (!existing.exists) return;
    await db.collection(collection).doc(id).delete();
    invalidate(collection);
    await writeAudit(db, actor, `${entityType}.delete`, entityType, id, id, [
      { field: '*', from: 'existed', to: null },
    ]);
  }

  /** Returns an order's units to product, variant and component stock. */
  async #restock(order: Order, note: string, actor: Actor): Promise<void> {
    if (!STOCK_HELD_STATUSES.includes(order.status)) return;

    for (const item of order.items) {
      // Each line goes through adjustStock, so every returned unit gets its own
      // ledger row with a reason and an actor, exactly like a sale does.
      await this.adjustStock(
        {
          targetId: item.variantId ?? item.productId,
          targetType: item.variantId ? 'variant' : 'product',
          delta: item.qty,
          reason: 'return',
          note,
          orderId: order.id,
        },
        actor,
      ).catch((error: unknown) => {
        console.error(`[poojaro] Could not restock ${item.name} for ${order.orderNumber}:`, error);
      });

      const product = await this.getProductById(item.productId);
      if (!product) continue;
      for (const [componentId, units] of componentRequirements(product, item.qty)) {
        await this.adjustStock(
          { targetId: componentId, targetType: 'component', delta: units, reason: 'return', note, orderId: order.id },
          actor,
        ).catch((error: unknown) => {
          console.error(`[poojaro] Could not restock component ${componentId}:`, error);
        });
      }
    }
  }

  async #recomputeRating(productId: Id): Promise<void> {
    const db = await ready();
    const published = await this.listReviews(productId, 'published');
    const reviewCount = published.length;
    const rating =
      reviewCount === 0
        ? 0
        : Math.round((published.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10;
    await db.collection(C.products).doc(productId).set({ rating, reviewCount, updatedAt: nowIso() }, { merge: true });
  }
}

function guardQty(newQty: number, name: string): void {
  if (!Number.isInteger(newQty)) throw new Error('Stock must be a whole number.');
  if (newQty < 0) throw new Error(`Cannot reduce ${name} below zero (would be ${newQty}).`);
}
