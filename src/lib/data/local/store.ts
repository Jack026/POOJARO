/**
 * The local, file-backed DataStore.
 *
 * Every write funnels through `mutate()` in ./persistence, which serialises
 * callbacks. That is what makes `placeOrder` genuinely atomic here: the stock
 * check and the stock deduction happen inside one exclusive callback, so two
 * simultaneous checkouts for the last unit cannot both succeed — the second one
 * reads the already-decremented value and is rejected.
 *
 * Reads return deep clones. Callers get plain data they can hand to a client
 * component, and no accidental mutation can corrupt the in-memory dataset.
 */
import { evaluateCoupon, findShortfalls, priceCart } from '../../domain/pricing';
import {
  canTransition,
  notificationCopy,
  NOTIFICATION_FOR_STATUS,
  ORDER_STATUS_DETAIL,
  STOCK_HELD_STATUSES,
} from '../../domain/orders';
import { addBusinessDays } from '../../format';
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
import { mutate, snapshot } from './persistence';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function bySortOrder<T extends { sortOrder: number }>(a: T, b: T): number {
  return a.sortOrder - b.sortOrder;
}

// ---------------------------------------------------------------------------
// Ledger, audit and notification primitives
// ---------------------------------------------------------------------------

interface LedgerInput {
  targetId: Id;
  targetType: InventoryTransaction['targetType'];
  targetName: string;
  previousQty: number;
  newQty: number;
  reason: InventoryTransaction['reason'];
  note: string;
  orderId?: Id;
}

/**
 * The single place a stock number changes. Writing the ledger row and the new
 * quantity together means there is no code path that can move stock silently.
 */
function writeLedger(db: Database, input: LedgerInput, actor: Actor): InventoryTransaction {
  const entry: InventoryTransaction = {
    id: newId('inv'),
    targetId: input.targetId,
    targetType: input.targetType,
    targetName: input.targetName,
    previousQty: input.previousQty,
    newQty: input.newQty,
    delta: input.newQty - input.previousQty,
    reason: input.reason,
    note: input.note,
    ...(input.orderId ? { orderId: input.orderId } : {}),
    actorId: actor.id,
    actorName: actor.name,
    createdAt: nowIso(),
  };
  db.inventoryTransactions.push(entry);
  return entry;
}

function audit(
  db: Database,
  actor: Actor,
  action: string,
  entityType: string,
  entityId: Id,
  entityLabel: string,
  changes: AuditLog['changes'],
): AuditLog {
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
  db.auditLogs.push(entry);
  return entry;
}

function notify(
  db: Database,
  userId: Id | null,
  topic: AppNotification['topic'],
  title: string,
  body: string,
  href: string | null,
): AppNotification {
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
  db.notifications.push(notification);
  return notification;
}

/** Raises the admin low-stock alert once a target crosses its threshold. */
function maybeLowStockAlert(db: Database, name: string, newQty: number, threshold: number, href: string): void {
  if (newQty > threshold) return;
  const body =
    newQty <= 0 ? `${name} is out of stock.` : `${name} is down to ${newQty}, below its threshold of ${threshold}.`;
  const alreadyOpen = db.notifications.some(
    (n) => n.topic === 'low_stock' && n.userId === null && n.body === body && !n.isRead,
  );
  if (alreadyOpen) return;
  notify(db, null, 'low_stock', newQty <= 0 ? 'Out of stock' : 'Low stock', body, href);
}

function requireProduct(db: Database, id: Id): Product {
  const product = db.products.find((p) => p.id === id);
  if (!product) throw new Error(`Product ${id} not found.`);
  return product;
}

function requireOrder(db: Database, id: Id): Order {
  const order = db.orders.find((o) => o.id === id);
  if (!order) throw new Error(`Order ${id} not found.`);
  return order;
}

function pushTimeline(order: Order, status: OrderStatus, note: string): void {
  order.status = status;
  order.timeline.push({ status, at: nowIso(), note: note || ORDER_STATUS_DETAIL[status] });
  order.updatedAt = nowIso();
}

/**
 * True when this email/user has no prior order — the honest basis for a
 * first-order-only coupon, checked server-side at the moment of payment.
 */
function isFirstOrder(db: Database, userId: Id | null, email: string): boolean {
  const normalised = email.trim().toLowerCase();
  return !db.orders.some(
    (order) =>
      order.status !== 'cancelled' &&
      (userId !== null ? order.userId === userId : order.email.toLowerCase() === normalised),
  );
}

/** Component draw for one kit line: componentId → units required. */
function componentRequirements(product: Product, qty: number): Map<Id, number> {
  const required = new Map<Id, number>();
  if (!product.isKit) return required;
  for (const line of product.contents) {
    if (!line.componentId) continue;
    const per = line.componentQty ?? 1;
    required.set(line.componentId, (required.get(line.componentId) ?? 0) + per * qty);
  }
  return required;
}

// ---------------------------------------------------------------------------
// The adapter
// ---------------------------------------------------------------------------

export class LocalDataStore implements DataStore {
  readonly backend = 'local' as const;

  // -- Settings ------------------------------------------------------------

  async getSettings(): Promise<Settings> {
    return clone((await snapshot()).settings);
  }

  async updateSettings(patch: Partial<Settings>, actor: Actor): Promise<Settings> {
    return mutate((db) => {
      const before = clone(db.settings);
      db.settings = { ...db.settings, ...patch, updatedAt: nowIso() };
      audit(db, actor, 'settings.update', 'settings', 'settings', 'Store settings', diffFields(before, db.settings));
      return clone(db.settings);
    });
  }

  // -- Taxonomy ------------------------------------------------------------

  async listCategories(includeInactive = false): Promise<Category[]> {
    const db = await snapshot();
    return clone(db.categories.filter((c) => includeInactive || c.isActive).sort(bySortOrder));
  }

  async listOccasions(includeInactive = false): Promise<Occasion[]> {
    const db = await snapshot();
    return clone(db.occasions.filter((o) => includeInactive || o.isActive).sort(bySortOrder));
  }

  async getOccasionBySlug(slug: string): Promise<Occasion | null> {
    const db = await snapshot();
    return clone(db.occasions.find((o) => o.slug === slug) ?? null);
  }

  async listFestivals(includeInactive = false): Promise<Festival[]> {
    const db = await snapshot();
    return clone(db.festivals.filter((f) => includeInactive || f.isActive).sort(bySortOrder));
  }

  async getFestivalBySlug(slug: string): Promise<Festival | null> {
    const db = await snapshot();
    return clone(db.festivals.find((f) => f.slug === slug) ?? null);
  }

  async upsertCategory(category: Category, actor: Actor): Promise<Category> {
    return this.#upsert('categories', category, actor, 'category', category.name);
  }

  async upsertOccasion(occasion: Occasion, actor: Actor): Promise<Occasion> {
    return this.#upsert('occasions', occasion, actor, 'occasion', occasion.name);
  }

  async upsertFestival(festival: Festival, actor: Actor): Promise<Festival> {
    return this.#upsert('festivals', festival, actor, 'festival', festival.name);
  }

  async deleteCategory(id: Id, actor: Actor): Promise<void> {
    await mutate((db) => {
      if (db.products.some((p) => p.categoryId === id)) {
        throw new Error('This category still has products. Move them first.');
      }
      if (db.categories.some((c) => c.parentId === id)) {
        throw new Error('This category has subcategories. Remove them first.');
      }
      this.#remove(db, 'categories', id, actor, 'category');
    });
  }

  async deleteOccasion(id: Id, actor: Actor): Promise<void> {
    await mutate((db) => {
      for (const product of db.products) {
        product.occasionIds = product.occasionIds.filter((o) => o !== id);
      }
      db.recommendationRules = db.recommendationRules.filter((r) => r.occasionId !== id);
      this.#remove(db, 'occasions', id, actor, 'occasion');
    });
  }

  async deleteFestival(id: Id, actor: Actor): Promise<void> {
    await mutate((db) => {
      for (const product of db.products) {
        product.festivalIds = product.festivalIds.filter((f) => f !== id);
      }
      this.#remove(db, 'festivals', id, actor, 'festival');
    });
  }

  // -- Catalogue -----------------------------------------------------------

  async listProducts(query: ProductQuery = {}): Promise<Page<Product>> {
    const db = await snapshot();
    const page = applyProductQuery(db.products, db.categories, query);
    return { items: clone(page.items), total: page.total };
  }

  async getProductById(id: Id): Promise<Product | null> {
    const db = await snapshot();
    return clone(db.products.find((p) => p.id === id) ?? null);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const db = await snapshot();
    return clone(db.products.find((p) => p.slug === slug) ?? null);
  }

  async getProductsByIds(ids: Id[]): Promise<Product[]> {
    const db = await snapshot();
    const wanted = new Set(ids);
    const found = db.products.filter((p) => wanted.has(p.id));
    // Preserve the caller's order — recommendation lists depend on it.
    const byId = new Map(found.map((p) => [p.id, p]));
    return clone(ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p)));
  }

  async upsertProduct(product: Product, actor: Actor): Promise<Product> {
    return mutate((db) => {
      const index = db.products.findIndex((p) => p.id === product.id);
      const before = index >= 0 ? clone(db.products[index]!) : null;

      const clash = db.products.find((p) => p.slug === product.slug && p.id !== product.id);
      if (clash) throw new Error(`Another product already uses the URL "/products/${product.slug}".`);

      // Stock is ledger-controlled: an edit here cannot move it. Admin uses the
      // inventory screen, which writes a transaction.
      const stock = before ? before.stock : product.stock;
      const variants = product.variants.map((variant) => {
        const priorVariant = before?.variants.find((v) => v.id === variant.id);
        return { ...variant, stock: priorVariant ? priorVariant.stock : variant.stock };
      });

      const next: Product = {
        ...product,
        stock: variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : stock,
        variants,
        createdAt: before?.createdAt ?? nowIso(),
        updatedAt: nowIso(),
      };

      if (index >= 0) db.products[index] = next;
      else db.products.push(next);

      // A brand new product's opening stock is a real movement, so it is logged.
      if (!before && next.stock !== 0) {
        writeLedger(
          db,
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
      }

      audit(
        db,
        actor,
        before ? 'product.update' : 'product.create',
        'product',
        next.id,
        next.name,
        diffFields(before as unknown as Record<string, unknown> | null, next as unknown as Record<string, unknown>),
      );
      return clone(next);
    });
  }

  async deleteProduct(id: Id, actor: Actor): Promise<void> {
    await mutate((db) => {
      const product = db.products.find((p) => p.id === id);
      if (!product) return;
      if (db.orders.some((o) => o.items.some((i) => i.productId === id))) {
        // Orders reference it, so archive instead of destroying order history.
        product.status = 'archived';
        product.updatedAt = nowIso();
        audit(db, actor, 'product.archive', 'product', id, product.name, [
          { field: 'status', from: 'published', to: 'archived' },
        ]);
        return;
      }
      db.products = db.products.filter((p) => p.id !== id);
      db.reviews = db.reviews.filter((r) => r.productId !== id);
      db.recommendationRules = db.recommendationRules.filter((r) => r.productId !== id);
      audit(db, actor, 'product.delete', 'product', id, product.name, [{ field: '*', from: 'existed', to: null }]);
    });
  }

  // -- Inventory -----------------------------------------------------------

  async listKitComponents(): Promise<KitComponent[]> {
    const db = await snapshot();
    return clone([...db.kitComponents].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async upsertKitComponent(component: KitComponent, actor: Actor): Promise<KitComponent> {
    return mutate((db) => {
      const index = db.kitComponents.findIndex((k) => k.id === component.id);
      const before = index >= 0 ? clone(db.kitComponents[index]!) : null;
      const next: KitComponent = {
        ...component,
        // Same rule as products: stock moves only through the ledger.
        stock: before ? before.stock : component.stock,
        updatedAt: nowIso(),
      };
      if (index >= 0) db.kitComponents[index] = next;
      else db.kitComponents.push(next);

      if (!before && next.stock !== 0) {
        writeLedger(
          db,
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
      }
      audit(db, actor, before ? 'component.update' : 'component.create', 'component', next.id, next.name, diffFields(before, next));
      return clone(next);
    });
  }

  async adjustStock(adjustment: StockAdjustment, actor: Actor): Promise<InventoryTransaction> {
    return mutate((db) => {
      const { targetId, targetType, reason, note, orderId } = adjustment;

      let name: string;
      let previousQty: number;
      let commit: (qty: number) => void;
      let threshold: number;
      let href: string;

      if (targetType === 'component') {
        const component = db.kitComponents.find((k) => k.id === targetId);
        if (!component) throw new Error(`Component ${targetId} not found.`);
        name = component.name;
        previousQty = component.stock;
        threshold = component.lowStockThreshold;
        href = '/admin/inventory';
        commit = (qty) => {
          component.stock = qty;
          component.updatedAt = nowIso();
        };
      } else if (targetType === 'variant') {
        const product = db.products.find((p) => p.variants.some((v) => v.id === targetId));
        const variant = product?.variants.find((v) => v.id === targetId);
        if (!product || !variant) throw new Error(`Variant ${targetId} not found.`);
        name = `${product.name} — ${variant.label}`;
        previousQty = variant.stock;
        threshold = product.lowStockThreshold;
        href = `/admin/products/${product.id}`;
        commit = (qty) => {
          variant.stock = qty;
          product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
          product.updatedAt = nowIso();
        };
      } else {
        const product = requireProduct(db, targetId);
        if (product.variants.length > 0) {
          throw new Error(`${product.name} has variants — adjust the variant stock instead.`);
        }
        name = product.name;
        previousQty = product.stock;
        threshold = product.lowStockThreshold;
        href = `/admin/products/${product.id}`;
        commit = (qty) => {
          product.stock = qty;
          product.updatedAt = nowIso();
        };
      }

      const newQty = adjustment.newQty ?? previousQty + adjustment.delta;
      if (!Number.isInteger(newQty)) throw new Error('Stock must be a whole number.');
      if (newQty < 0) throw new Error(`Cannot reduce ${name} below zero (would be ${newQty}).`);

      commit(newQty);
      const entry = writeLedger(
        db,
        { targetId, targetType, targetName: name, previousQty, newQty, reason, note, ...(orderId ? { orderId } : {}) },
        actor,
      );
      maybeLowStockAlert(db, name, newQty, threshold, href);
      audit(db, actor, 'inventory.adjust', targetType, targetId, name, [
        { field: 'stock', from: previousQty, to: newQty },
        { field: 'reason', from: null, to: reason },
      ]);
      return clone(entry);
    });
  }

  async listInventoryTransactions(query: InventoryQuery = {}): Promise<Page<InventoryTransaction>> {
    const db = await snapshot();
    const filtered = db.inventoryTransactions.filter((entry) => {
      if (query.targetId && entry.targetId !== query.targetId) return false;
      if (query.reason && entry.reason !== query.reason) return false;
      if (query.orderId && entry.orderId !== query.orderId) return false;
      return true;
    });
    filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const page = paginate(filtered, query.limit, query.offset);
    return { items: clone(page.items), total: page.total };
  }

  // -- Cart ----------------------------------------------------------------

  async getCart(id: Id): Promise<Cart | null> {
    const db = await snapshot();
    return clone(db.carts.find((c) => c.id === id) ?? null);
  }

  async saveCart(cart: Cart): Promise<Cart> {
    return mutate((db) => {
      const next: Cart = { ...cart, updatedAt: nowIso() };
      const index = db.carts.findIndex((c) => c.id === cart.id);
      if (index >= 0) db.carts[index] = next;
      else db.carts.push(next);
      return clone(next);
    });
  }

  async deleteCart(id: Id): Promise<void> {
    await mutate((db) => {
      db.carts = db.carts.filter((c) => c.id !== id);
    });
  }

  // -- Coupons -------------------------------------------------------------

  async listCoupons(includeInactive = false): Promise<Coupon[]> {
    const db = await snapshot();
    return clone(
      db.coupons
        .filter((c) => includeInactive || c.isActive)
        .sort((a, b) => a.code.localeCompare(b.code)),
    );
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    const db = await snapshot();
    const normalised = code.trim().toUpperCase();
    return clone(db.coupons.find((c) => c.code.toUpperCase() === normalised) ?? null);
  }

  async upsertCoupon(coupon: Coupon, actor: Actor): Promise<Coupon> {
    return mutate((db) => {
      const code = coupon.code.trim().toUpperCase();
      const clash = db.coupons.find((c) => c.code.toUpperCase() === code && c.id !== coupon.id);
      if (clash) throw new Error(`Coupon code ${code} already exists.`);
      const index = db.coupons.findIndex((c) => c.id === coupon.id);
      const before = index >= 0 ? clone(db.coupons[index]!) : null;
      // usageCount is owned by checkout, never by the edit form.
      const next: Coupon = {
        ...coupon,
        code,
        usageCount: before?.usageCount ?? 0,
        createdAt: before?.createdAt ?? nowIso(),
      };
      if (index >= 0) db.coupons[index] = next;
      else db.coupons.push(next);
      audit(db, actor, before ? 'coupon.update' : 'coupon.create', 'coupon', next.id, next.code, diffFields(before, next));
      return clone(next);
    });
  }

  async deleteCoupon(id: Id, actor: Actor): Promise<void> {
    await mutate((db) => {
      this.#remove(db, 'coupons', id, actor, 'coupon');
    });
  }

  async countCouponRedemptions(couponId: Id, userId: Id | null): Promise<number> {
    const db = await snapshot();
    return db.couponRedemptions.filter((r) => r.couponId === couponId && r.userId === userId).length;
  }

  // -- Orders --------------------------------------------------------------

  async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    return mutate((db): PlaceOrderResult => {
      if (input.items.length === 0) {
        return { ok: false, code: 'empty_cart', message: 'Your ritual box is waiting to be filled.' };
      }

      const coupon = input.couponCode
        ? db.coupons.find((c) => c.code.toUpperCase() === input.couponCode!.trim().toUpperCase()) ?? null
        : null;
      if (input.couponCode && !coupon) {
        return { ok: false, code: 'invalid_coupon', message: 'That code is not valid.' };
      }

      const firstOrder = isFirstOrder(db, input.userId, input.email);
      const redemptions = coupon
        ? db.couponRedemptions.filter((r) => r.couponId === coupon.id && r.userId === input.userId).length
        : 0;

      // Re-price from the catalogue. Whatever the browser thought the total was
      // is irrelevant from here on.
      const priced = priceCart({
        items: input.items,
        products: db.products,
        settings: db.settings,
        coupon,
        paymentMethod: input.paymentMethod,
        isFirstOrder: firstOrder,
        couponRedemptionsByUser: redemptions,
      });

      // Classify every line the cart could not honour. Sold-out and withdrawn
      // items get different codes so the shopper reads the right message.
      const { shortfalls, unavailable } = findShortfalls(input.items, db.products, priced.lines);

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

      if (coupon) {
        const check = evaluateCoupon({
          coupon,
          lines: priced.lines,
          products: db.products,
          subtotal: priced.totals.subtotal,
          isFirstOrder: firstOrder,
          couponRedemptionsByUser: redemptions,
          now: new Date(),
        });
        if (!check.ok) {
          return { ok: false, code: 'invalid_coupon', message: check.message };
        }
      }

      // Aggregate the component draw across every kit line before touching
      // anything, so a shortfall on the last component does not leave earlier
      // components already decremented.
      const componentDraw = new Map<Id, number>();
      for (const line of priced.lines) {
        const product = requireProduct(db, line.productId);
        for (const [componentId, units] of componentRequirements(product, line.qty)) {
          componentDraw.set(componentId, (componentDraw.get(componentId) ?? 0) + units);
        }
      }
      for (const [componentId, units] of componentDraw) {
        const component = db.kitComponents.find((k) => k.id === componentId);
        if (!component) continue;
        if (component.stock < units) {
          const kit = priced.lines.find((line) => {
            const product = db.products.find((p) => p.id === line.productId);
            return product?.contents.some((cnt) => cnt.componentId === componentId) ?? false;
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

      // ---- Commit -------------------------------------------------------
      const orderId = newId('ord');
      db.counters.order = (db.counters.order ?? 0) + 1;
      const orderNumber = formatOrderNumber(db.counters.order);
      const customerActor: Actor = {
        id: input.userId ?? 'guest',
        name: input.shippingAddress.fullName || input.email,
        kind: 'customer',
      };

      const items: OrderItem[] = priced.lines.map((line) => {
        const product = requireProduct(db, line.productId);
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

      for (const line of priced.lines) {
        const product = requireProduct(db, line.productId);
        if (line.variantId) {
          const variant = product.variants.find((v) => v.id === line.variantId);
          if (!variant) throw new Error(`Variant ${line.variantId} vanished mid-checkout.`);
          const previousQty = variant.stock;
          variant.stock -= line.qty;
          product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
          product.updatedAt = nowIso();
          writeLedger(
            db,
            {
              targetId: variant.id,
              targetType: 'variant',
              targetName: `${product.name} — ${variant.label}`,
              previousQty,
              newQty: variant.stock,
              reason: 'sale',
              note: `Order ${orderNumber}`,
              orderId,
            },
            customerActor,
          );
          maybeLowStockAlert(db, `${product.name} — ${variant.label}`, variant.stock, product.lowStockThreshold, `/admin/products/${product.id}`);
        } else {
          const previousQty = product.stock;
          product.stock -= line.qty;
          product.updatedAt = nowIso();
          writeLedger(
            db,
            {
              targetId: product.id,
              targetType: 'product',
              targetName: product.name,
              previousQty,
              newQty: product.stock,
              reason: 'sale',
              note: `Order ${orderNumber}`,
              orderId,
            },
            customerActor,
          );
          maybeLowStockAlert(db, product.name, product.stock, product.lowStockThreshold, `/admin/products/${product.id}`);
        }
      }

      for (const [componentId, units] of componentDraw) {
        const component = db.kitComponents.find((k) => k.id === componentId);
        if (!component) continue;
        const previousQty = component.stock;
        component.stock -= units;
        component.updatedAt = nowIso();
        writeLedger(
          db,
          {
            targetId: component.id,
            targetType: 'component',
            targetName: component.name,
            previousQty,
            newQty: component.stock,
            reason: 'sale',
            note: `Consumed by order ${orderNumber}`,
            orderId,
          },
          customerActor,
        );
        maybeLowStockAlert(db, component.name, component.stock, component.lowStockThreshold, '/admin/inventory');
      }

      if (coupon) {
        coupon.usageCount += 1;
        db.couponRedemptions.push({
          couponId: coupon.id,
          userId: input.userId,
          orderId,
          at: nowIso(),
        });
      }

      const status: OrderStatus = input.paymentStatus === 'paid' ? 'payment_confirmed' : 'pending';
      const order: Order = {
        id: orderId,
        orderNumber,
        userId: input.userId,
        email: input.email.trim().toLowerCase(),
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
        estimatedDelivery: addBusinessDays(new Date(), db.settings.deliveryDaysMax).toISOString(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      if (status !== 'pending') {
        pushTimeline(order, status, ORDER_STATUS_DETAIL[status]);
      }
      db.orders.push(order);

      for (const notifiable of status === 'pending' ? (['pending'] as const) : (['pending', status] as const)) {
        const topic = NOTIFICATION_FOR_STATUS[notifiable];
        const copy = notificationCopy(notifiable, orderNumber);
        if (topic && copy) {
          notify(db, input.userId, topic, copy.title, copy.body, `/orders/${orderNumber}`);
        }
      }

      db.analyticsEvents.push({
        id: newId('evt'),
        name: 'purchase',
        value: order.totals.total,
        meta: { orderId, items: items.length },
        sessionId: 'server',
        createdAt: nowIso(),
      });

      return { ok: true, order: clone(order) };
    });
  }

  async getOrderById(id: Id): Promise<Order | null> {
    const db = await snapshot();
    return clone(db.orders.find((o) => o.id === id) ?? null);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const db = await snapshot();
    const normalised = orderNumber.trim().toUpperCase();
    return clone(db.orders.find((o) => o.orderNumber.toUpperCase() === normalised) ?? null);
  }

  async listOrders(query: OrderQuery = {}): Promise<Page<Order>> {
    const db = await snapshot();
    const page = applyOrderQuery(db.orders, query);
    return { items: clone(page.items), total: page.total };
  }

  async updateOrderStatus(id: Id, status: OrderStatus, note: string, actor: Actor): Promise<Order> {
    return mutate((db) => {
      const order = requireOrder(db, id);
      if (order.status === status) return clone(order);
      if (!canTransition(order.status, status)) {
        throw new Error(`An order cannot move from ${order.status} to ${status}.`);
      }
      if (status === 'cancelled' || status === 'returned') {
        this.#restock(db, order, status === 'cancelled' ? 'Order cancelled' : 'Order returned', actor);
      }
      const from = order.status;
      pushTimeline(order, status, note);
      if (status === 'payment_confirmed') order.paymentStatus = 'paid';

      const topic = NOTIFICATION_FOR_STATUS[status];
      const copy = notificationCopy(status, order.orderNumber);
      if (topic && copy) notify(db, order.userId, topic, copy.title, copy.body, `/orders/${order.orderNumber}`);

      audit(db, actor, 'order.status', 'order', order.id, order.orderNumber, [
        { field: 'status', from, to: status },
      ]);
      return clone(order);
    });
  }

  async updateOrderPayment(
    id: Id,
    payment: { paymentStatus: PaymentStatus; razorpayPaymentId?: string; razorpayOrderId?: string },
    actor: Actor,
  ): Promise<Order> {
    return mutate((db) => {
      const order = requireOrder(db, id);
      const from = order.paymentStatus;
      order.paymentStatus = payment.paymentStatus;
      if (payment.razorpayPaymentId) order.razorpayPaymentId = payment.razorpayPaymentId;
      if (payment.razorpayOrderId) order.razorpayOrderId = payment.razorpayOrderId;
      order.updatedAt = nowIso();

      if (payment.paymentStatus === 'paid' && canTransition(order.status, 'payment_confirmed')) {
        pushTimeline(order, 'payment_confirmed', ORDER_STATUS_DETAIL.payment_confirmed);
        const copy = notificationCopy('payment_confirmed', order.orderNumber);
        if (copy) {
          notify(db, order.userId, 'payment_successful', copy.title, copy.body, `/orders/${order.orderNumber}`);
        }
      }
      audit(db, actor, 'order.payment', 'order', order.id, order.orderNumber, [
        { field: 'paymentStatus', from, to: payment.paymentStatus },
      ]);
      return clone(order);
    });
  }

  async cancelOrder(id: Id, reason: string, actor: Actor): Promise<Order> {
    return mutate((db) => {
      const order = requireOrder(db, id);
      if (!canTransition(order.status, 'cancelled')) {
        throw new Error(`An order that is ${order.status} can no longer be cancelled.`);
      }
      this.#restock(db, order, `Cancelled: ${reason}`, actor);
      const from = order.status;
      pushTimeline(order, 'cancelled', reason || 'Order cancelled.');
      order.internalNotes.push(`[${nowIso()}] ${actor.name} cancelled: ${reason}`);
      audit(db, actor, 'order.cancel', 'order', order.id, order.orderNumber, [
        { field: 'status', from, to: 'cancelled' },
        { field: 'reason', from: null, to: reason },
      ]);
      return clone(order);
    });
  }

  async refundOrder(id: Id, note: string, actor: Actor): Promise<Order> {
    return mutate((db) => {
      const order = requireOrder(db, id);
      if (!canTransition(order.status, 'refunded')) {
        throw new Error(`Refund the order after it is cancelled or returned (currently ${order.status}).`);
      }
      const from = order.status;
      order.paymentStatus = 'refunded';
      pushTimeline(order, 'refunded', note || 'Refund issued.');
      order.internalNotes.push(`[${nowIso()}] ${actor.name} recorded a refund: ${note}`);
      audit(db, actor, 'order.refund', 'order', order.id, order.orderNumber, [
        { field: 'status', from, to: 'refunded' },
        { field: 'amount', from: null, to: order.totals.total },
      ]);
      return clone(order);
    });
  }

  async addOrderNote(id: Id, note: string, actor: Actor): Promise<Order> {
    return mutate((db) => {
      const order = requireOrder(db, id);
      order.internalNotes.push(`[${nowIso()}] ${actor.name}: ${note}`);
      order.updatedAt = nowIso();
      audit(db, actor, 'order.note', 'order', order.id, order.orderNumber, [
        { field: 'internalNotes', from: null, to: note },
      ]);
      return clone(order);
    });
  }

  async setOrderTracking(
    id: Id,
    tracking: { trackingNumber: string; courier: string },
    actor: Actor,
  ): Promise<Order> {
    return mutate((db) => {
      const order = requireOrder(db, id);
      const before = { trackingNumber: order.trackingNumber ?? null, courier: order.courier ?? null };
      order.trackingNumber = tracking.trackingNumber;
      order.courier = tracking.courier;
      order.updatedAt = nowIso();
      audit(db, actor, 'order.tracking', 'order', order.id, order.orderNumber, [
        { field: 'trackingNumber', from: before.trackingNumber, to: tracking.trackingNumber },
        { field: 'courier', from: before.courier, to: tracking.courier },
      ]);
      return clone(order);
    });
  }

  // -- Customers -----------------------------------------------------------

  async getUserById(id: Id): Promise<User | null> {
    const db = await snapshot();
    return clone(db.users.find((u) => u.id === id) ?? null);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await snapshot();
    const normalised = email.trim().toLowerCase();
    return clone(db.users.find((u) => u.email.toLowerCase() === normalised) ?? null);
  }

  async upsertUser(user: User): Promise<User> {
    return mutate((db) => {
      const index = db.users.findIndex((u) => u.id === user.id);
      const next: User = { ...user, email: user.email.trim().toLowerCase() };
      if (index >= 0) db.users[index] = next;
      else db.users.push(next);
      return clone(next);
    });
  }

  async listUsers(query: { search?: string; limit?: number; offset?: number } = {}): Promise<Page<User>> {
    const db = await snapshot();
    const search = query.search?.trim().toLowerCase();
    const filtered = search
      ? db.users.filter((u) =>
          [u.name, u.email, u.phone].join(' ').toLowerCase().includes(search),
        )
      : [...db.users];
    filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const page = paginate(filtered, query.limit, query.offset);
    return { items: clone(page.items), total: page.total };
  }

  // -- Reviews & social proof ---------------------------------------------

  async listReviews(productId?: Id, status: Review['status'] | 'any' = 'published'): Promise<Review[]> {
    const db = await snapshot();
    const filtered = db.reviews.filter(
      (r) => (!productId || r.productId === productId) && (status === 'any' || r.status === status),
    );
    filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return clone(filtered);
  }

  async createReview(review: Review): Promise<Review> {
    return mutate((db) => {
      db.reviews.push(review);
      this.#recomputeRating(db, review.productId);
      return clone(review);
    });
  }

  async setReviewStatus(id: Id, status: Review['status'], actor: Actor): Promise<Review> {
    return mutate((db) => {
      const review = db.reviews.find((r) => r.id === id);
      if (!review) throw new Error(`Review ${id} not found.`);
      const from = review.status;
      review.status = status;
      this.#recomputeRating(db, review.productId);
      audit(db, actor, 'review.status', 'review', review.id, review.title, [
        { field: 'status', from, to: status },
      ]);
      return clone(review);
    });
  }

  async deleteReview(id: Id, actor: Actor): Promise<void> {
    await mutate((db) => {
      const review = db.reviews.find((r) => r.id === id);
      if (!review) return;
      db.reviews = db.reviews.filter((r) => r.id !== id);
      this.#recomputeRating(db, review.productId);
      audit(db, actor, 'review.delete', 'review', id, review.title, [{ field: '*', from: 'existed', to: null }]);
    });
  }

  async purgeDemoSocialProof(actor: Actor): Promise<{ reviews: number; testimonials: number }> {
    return mutate((db) => {
      const demoReviews = db.reviews.filter((r) => r.isDemo);
      const demoTestimonials = db.testimonials.filter((t) => t.isDemo);
      const affected = new Set(demoReviews.map((r) => r.productId));
      db.reviews = db.reviews.filter((r) => !r.isDemo);
      db.testimonials = db.testimonials.filter((t) => !t.isDemo);
      for (const productId of affected) this.#recomputeRating(db, productId);
      audit(db, actor, 'social.purge_demo', 'settings', 'social-proof', 'Sample reviews and testimonials', [
        { field: 'reviews', from: demoReviews.length, to: 0 },
        { field: 'testimonials', from: demoTestimonials.length, to: 0 },
      ]);
      return { reviews: demoReviews.length, testimonials: demoTestimonials.length };
    });
  }

  async listTestimonials(includeInactive = false): Promise<Testimonial[]> {
    const db = await snapshot();
    return clone(db.testimonials.filter((t) => includeInactive || t.isActive).sort(bySortOrder));
  }

  async upsertTestimonial(testimonial: Testimonial, actor: Actor): Promise<Testimonial> {
    return this.#upsert('testimonials', testimonial, actor, 'testimonial', testimonial.authorName);
  }

  async deleteTestimonial(id: Id, actor: Actor): Promise<void> {
    await mutate((db) => {
      this.#remove(db, 'testimonials', id, actor, 'testimonial');
    });
  }

  // -- Content -------------------------------------------------------------

  async listBanners(slot?: BannerSlot, includeInactive = false): Promise<Banner[]> {
    const db = await snapshot();
    const now = Date.now();
    const filtered = db.banners.filter((banner) => {
      if (slot && banner.slot !== slot) return false;
      if (includeInactive) return true;
      if (!banner.isActive) return false;
      // Scheduling is honoured on read, so a festival banner appears and
      // disappears on its own without anyone remembering to switch it off.
      if (banner.startsAt && now < Date.parse(banner.startsAt)) return false;
      if (banner.endsAt && now > Date.parse(banner.endsAt)) return false;
      return true;
    });
    return clone(filtered.sort(bySortOrder));
  }

  async upsertBanner(banner: Banner, actor: Actor): Promise<Banner> {
    return this.#upsert('banners', banner, actor, 'banner', banner.title);
  }

  async deleteBanner(id: Id, actor: Actor): Promise<void> {
    await mutate((db) => {
      this.#remove(db, 'banners', id, actor, 'banner');
    });
  }

  // -- Ritual Finder -------------------------------------------------------

  async listRecommendationRules(includeInactive = false): Promise<RecommendationRule[]> {
    const db = await snapshot();
    return clone(db.recommendationRules.filter((r) => includeInactive || r.isActive).sort(bySortOrder));
  }

  async upsertRecommendationRule(rule: RecommendationRule, actor: Actor): Promise<RecommendationRule> {
    return this.#upsert('recommendationRules', rule, actor, 'recommendation_rule', rule.id);
  }

  async deleteRecommendationRule(id: Id, actor: Actor): Promise<void> {
    await mutate((db) => {
      this.#remove(db, 'recommendationRules', id, actor, 'recommendation_rule');
    });
  }

  // -- Notifications -------------------------------------------------------

  async listNotifications(userId: Id | null, limit = 30): Promise<AppNotification[]> {
    const db = await snapshot();
    const filtered = db.notifications.filter((n) => n.userId === userId);
    filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return clone(filtered.slice(0, limit));
  }

  async createNotification(notification: AppNotification): Promise<AppNotification> {
    return mutate((db) => {
      db.notifications.push(notification);
      return clone(notification);
    });
  }

  async markNotificationsRead(userId: Id | null, ids?: Id[]): Promise<number> {
    return mutate((db) => {
      let count = 0;
      for (const notification of db.notifications) {
        if (notification.userId !== userId || notification.isRead) continue;
        if (ids && !ids.includes(notification.id)) continue;
        notification.isRead = true;
        count += 1;
      }
      return count;
    });
  }

  // -- Admin ---------------------------------------------------------------

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    const db = await snapshot();
    const normalised = email.trim().toLowerCase();
    return clone(db.adminUsers.find((a) => a.email.toLowerCase() === normalised) ?? null);
  }

  async getAdminById(id: Id): Promise<AdminUser | null> {
    const db = await snapshot();
    return clone(db.adminUsers.find((a) => a.id === id) ?? null);
  }

  async listAdmins(): Promise<AdminUser[]> {
    const db = await snapshot();
    return clone([...db.adminUsers].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async upsertAdmin(admin: AdminUser, actor: Actor): Promise<AdminUser> {
    return mutate((db) => {
      const email = admin.email.trim().toLowerCase();
      const clash = db.adminUsers.find((a) => a.email.toLowerCase() === email && a.id !== admin.id);
      if (clash) throw new Error(`${email} is already an admin.`);
      const index = db.adminUsers.findIndex((a) => a.id === admin.id);
      const before = index >= 0 ? clone(db.adminUsers[index]!) : null;
      const next: AdminUser = {
        ...admin,
        email,
        // An empty hash means "unchanged" — the edit form never round-trips one.
        passwordHash: admin.passwordHash || before?.passwordHash || '',
        createdAt: before?.createdAt ?? nowIso(),
      };
      if (!next.passwordHash) throw new Error('A new admin needs a password.');

      if (before?.role === 'owner' && next.role !== 'owner') {
        const owners = db.adminUsers.filter((a) => a.role === 'owner' && a.isActive).length;
        if (owners <= 1) throw new Error('There must be at least one active owner.');
      }

      if (index >= 0) db.adminUsers[index] = next;
      else db.adminUsers.push(next);

      // Never log a hash, not even a changed one.
      const changes = diffFields(before, next).filter((change) => change.field !== 'passwordHash');
      if (before && before.passwordHash !== next.passwordHash) {
        changes.push({ field: 'password', from: '(hash)', to: '(new hash)' });
      }
      audit(db, actor, before ? 'admin.update' : 'admin.create', 'admin', next.id, next.email, changes);
      return clone(next);
    });
  }

  async deleteAdmin(id: Id, actor: Actor): Promise<void> {
    await mutate((db) => {
      const admin = db.adminUsers.find((a) => a.id === id);
      if (!admin) return;
      if (admin.role === 'owner' && db.adminUsers.filter((a) => a.role === 'owner').length <= 1) {
        throw new Error('The last owner account cannot be removed.');
      }
      db.adminUsers = db.adminUsers.filter((a) => a.id !== id);
      audit(db, actor, 'admin.delete', 'admin', id, admin.email, [{ field: '*', from: 'existed', to: null }]);
    });
  }

  async recordAdminLogin(id: Id): Promise<void> {
    await mutate((db) => {
      const admin = db.adminUsers.find((a) => a.id === id);
      if (admin) admin.lastLoginAt = nowIso();
    });
  }

  async appendAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    return mutate((db) => {
      const full: AuditLog = { ...entry, id: newId('audit'), createdAt: nowIso() };
      db.auditLogs.push(full);
      return clone(full);
    });
  }

  async listAuditLogs(query: AuditQuery = {}): Promise<Page<AuditLog>> {
    const db = await snapshot();
    const filtered = db.auditLogs.filter((entry) => {
      if (query.actorId && entry.actorId !== query.actorId) return false;
      if (query.entityType && entry.entityType !== query.entityType) return false;
      if (query.entityId && entry.entityId !== query.entityId) return false;
      return true;
    });
    filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const page = paginate(filtered, query.limit, query.offset);
    return { items: clone(page.items), total: page.total };
  }

  // -- Analytics -----------------------------------------------------------

  async recordAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<void> {
    await mutate((db) => {
      db.analyticsEvents.push({ ...event, id: newId('evt'), createdAt: nowIso() });
      // Keep the local file from growing without bound in a long dev session.
      if (db.analyticsEvents.length > 20_000) {
        db.analyticsEvents = db.analyticsEvents.slice(-15_000);
      }
    });
  }

  async getAnalyticsSummary(range: AnalyticsRange): Promise<AnalyticsSummary> {
    const db = await snapshot();
    return summarise(db, range);
  }

  // -- Internals -----------------------------------------------------------

  /** Generic upsert for the simple `{ id }` collections, with an audit entry. */
  async #upsert<K extends keyof Database, T extends { id: Id }>(
    collection: K,
    record: T,
    actor: Actor,
    entityType: string,
    label: string,
  ): Promise<T> {
    return mutate((db) => {
      const list = db[collection] as unknown as T[];
      const index = list.findIndex((item) => item.id === record.id);
      const before = index >= 0 ? clone(list[index]!) : null;
      if (index >= 0) list[index] = record;
      else list.push(record);
      audit(
        db,
        actor,
        before ? `${entityType}.update` : `${entityType}.create`,
        entityType,
        record.id,
        label,
        diffFields(before as unknown as Record<string, unknown> | null, record as unknown as Record<string, unknown>),
      );
      return clone(record);
    });
  }

  #remove(db: Database, collection: keyof Database, id: Id, actor: Actor, entityType: string): void {
    const list = db[collection] as unknown as Array<{ id: Id }>;
    const existing = list.find((item) => item.id === id);
    if (!existing) return;
    (db[collection] as unknown as Array<{ id: Id }>) = list.filter((item) => item.id !== id);
    audit(db, actor, `${entityType}.delete`, entityType, id, id, [{ field: '*', from: 'existed', to: null }]);
  }

  /** Returns an order's units to product, variant and component stock. */
  #restock(db: Database, order: Order, note: string, actor: Actor): void {
    if (!STOCK_HELD_STATUSES.includes(order.status)) return;

    for (const item of order.items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) continue;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          const previousQty = variant.stock;
          variant.stock += item.qty;
          product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
          writeLedger(
            db,
            {
              targetId: variant.id,
              targetType: 'variant',
              targetName: `${product.name} — ${variant.label}`,
              previousQty,
              newQty: variant.stock,
              reason: 'return',
              note,
              orderId: order.id,
            },
            actor,
          );
        }
      } else {
        const previousQty = product.stock;
        product.stock += item.qty;
        writeLedger(
          db,
          {
            targetId: product.id,
            targetType: 'product',
            targetName: product.name,
            previousQty,
            newQty: product.stock,
            reason: 'return',
            note,
            orderId: order.id,
          },
          actor,
        );
      }
      product.updatedAt = nowIso();

      for (const [componentId, units] of componentRequirements(product, item.qty)) {
        const component = db.kitComponents.find((k) => k.id === componentId);
        if (!component) continue;
        const previousQty = component.stock;
        component.stock += units;
        component.updatedAt = nowIso();
        writeLedger(
          db,
          {
            targetId: component.id,
            targetType: 'component',
            targetName: component.name,
            previousQty,
            newQty: component.stock,
            reason: 'return',
            note,
            orderId: order.id,
          },
          actor,
        );
      }
    }
  }

  #recomputeRating(db: Database, productId: Id): void {
    const product = db.products.find((p) => p.id === productId);
    if (!product) return;
    const published = db.reviews.filter((r) => r.productId === productId && r.status === 'published');
    if (published.length === 0) {
      product.rating = 0;
      product.reviewCount = 0;
    } else {
      const sum = published.reduce((total, r) => total + r.rating, 0);
      product.rating = Math.round((sum / published.length) * 10) / 10;
      product.reviewCount = published.length;
    }
    product.updatedAt = nowIso();
  }
}

// ---------------------------------------------------------------------------
// Analytics rollup — shared shape, computed from the same events either backend
// records, so the admin charts read identically on both.
// ---------------------------------------------------------------------------

export function summarise(db: Database, range: AnalyticsRange): AnalyticsSummary {
  const from = Date.parse(range.from);
  const to = Date.parse(range.to);
  const inRange = (iso: string): boolean => {
    const at = Date.parse(iso);
    return at >= from && at <= to;
  };

  const orders = db.orders.filter((o) => inRange(o.createdAt));
  const paid = orders.filter((o) => o.paymentStatus === 'paid' && o.status !== 'refunded');
  const revenue = paid.reduce((sum, o) => sum + o.totals.total, 0);
  const events = db.analyticsEvents.filter((e) => inRange(e.createdAt));

  const count = (name: AnalyticsEvent['name']): number => events.filter((e) => e.name === name).length;
  const productViews = count('product_view');
  const addToCarts = count('add_to_cart');
  const checkoutsStarted = count('begin_checkout');
  const purchases = orders.length;

  const revenueByDay = new Map<string, { revenue: number; orders: number }>();
  for (const order of orders) {
    const day = order.createdAt.slice(0, 10);
    const entry = revenueByDay.get(day) ?? { revenue: 0, orders: 0 };
    entry.orders += 1;
    if (order.paymentStatus === 'paid' && order.status !== 'refunded') entry.revenue += order.totals.total;
    revenueByDay.set(day, entry);
  }

  const sellers = new Map<Id, { name: string; units: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const entry = sellers.get(item.productId) ?? { name: item.name, units: 0, revenue: 0 };
      entry.units += item.qty;
      entry.revenue += item.lineTotal;
      sellers.set(item.productId, entry);
    }
  }

  const statusCounts = new Map<OrderStatus, number>();
  for (const order of orders) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
  }

  const ratio = (numerator: number, denominator: number): number =>
    denominator > 0 ? Math.round((numerator / denominator) * 1000) / 1000 : 0;

  return {
    revenue,
    orderCount: purchases,
    averageOrderValue: paid.length > 0 ? Math.round(revenue / paid.length) : 0,
    customerCount: new Set(orders.map((o) => o.userId ?? o.email.toLowerCase())).size,
    productViews,
    addToCarts,
    checkoutsStarted,
    purchases,
    addToCartRate: ratio(addToCarts, productViews),
    checkoutRate: ratio(checkoutsStarted, addToCarts),
    conversionRate: ratio(purchases, productViews),
    cartAbandonmentRate: checkoutsStarted > 0 ? ratio(checkoutsStarted - purchases, checkoutsStarted) : 0,
    revenueByDay: [...revenueByDay.entries()]
      .map(([date, value]) => ({ date, revenue: value.revenue, orders: value.orders }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    bestSellers: [...sellers.entries()]
      .map(([productId, value]) => ({ productId, ...value }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 10),
    ordersByStatus: [...statusCounts.entries()].map(([status, count]) => ({ status, count })),
  };
}
