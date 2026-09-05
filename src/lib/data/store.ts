/**
 * The data-access contract.
 *
 * Two implementations satisfy it:
 *
 *   local/     a JSON file under `.data/`, works with zero credentials
 *   firestore/ Cloud Firestore, matching the Flutter app's collections
 *
 * `DATA_BACKEND` selects one. Nothing above this layer knows which is active.
 *
 * Design notes that matter:
 *
 *  - Money is never accepted from the caller for pricing. `placeOrder` takes
 *    cart items and re-prices them from the catalogue inside the transaction.
 *  - Stock changes go through `adjustStock` / `placeOrder` only. There is no
 *    method that writes a bare stock number, because every movement must leave
 *    a ledger entry.
 *  - `placeOrder` is the atomic boundary. Both adapters must guarantee that two
 *    concurrent callers cannot both take the last unit.
 */
import type {
  Address,
  AdminUser,
  AnalyticsEvent,
  AnalyticsSummary,
  AppNotification,
  AuditLog,
  Banner,
  BannerSlot,
  Cart,
  CartItem,
  CartTotals,
  Category,
  Coupon,
  Festival,
  Id,
  InventoryReason,
  InventoryTransaction,
  KitComponent,
  Occasion,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  RecommendationRule,
  Review,
  Settings,
  Testimonial,
  User,
} from './types';

// ---------------------------------------------------------------------------
// Shared shapes
// ---------------------------------------------------------------------------

/** Identifies who performed a write, for the ledger and the audit log. */
export interface Actor {
  id: Id;
  name: string;
  kind: 'admin' | 'customer' | 'system';
}

export const SYSTEM_ACTOR: Actor = { id: 'system', name: 'System', kind: 'system' };

export interface ProductQuery {
  categoryId?: Id;
  /** Includes descendants of the given category. */
  categorySlugPath?: Id[];
  occasionId?: Id;
  festivalId?: Id;
  isKit?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  /** Free text across name, description, tags and keywords. */
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  status?: Product['status'] | 'any';
  sort?: 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'discount';
  limit?: number;
  offset?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export interface OrderQuery {
  userId?: Id;
  email?: string;
  status?: OrderStatus | 'any';
  paymentStatus?: PaymentStatus | 'any';
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface InventoryQuery {
  targetId?: Id;
  reason?: InventoryReason;
  orderId?: Id;
  limit?: number;
  offset?: number;
}

export interface AuditQuery {
  actorId?: Id;
  entityType?: string;
  entityId?: Id;
  limit?: number;
  offset?: number;
}

/** A single explicit stock movement. Either an absolute target or a delta. */
export type StockAdjustment = {
  targetId: Id;
  targetType: 'product' | 'component' | 'variant';
  reason: InventoryReason;
  note: string;
  orderId?: Id;
} & ({ delta: number; newQty?: never } | { newQty: number; delta?: never });

export interface PlaceOrderInput {
  userId: Id | null;
  email: string;
  phone: string;
  items: CartItem[];
  shippingAddress: Address;
  couponCode: string | null;
  paymentMethod: PaymentMethod;
  /** Set only after a gateway has confirmed payment server-side. */
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

export type PlaceOrderResult =
  | { ok: true; order: Order }
  | {
      ok: false;
      /** `out_of_stock` carries the lines that failed so the UI can be specific. */
      code: 'out_of_stock' | 'empty_cart' | 'invalid_coupon' | 'product_unavailable' | 'price_changed';
      message: string;
      shortfalls?: Array<{ productId: Id; name: string; requested: number; available: number }>;
    };

export interface CouponEvaluation {
  ok: boolean;
  coupon: Coupon | null;
  discount: number;
  message: string;
}

export interface AnalyticsRange {
  from: string;
  to: string;
}

// ---------------------------------------------------------------------------
// The interface
// ---------------------------------------------------------------------------

export interface DataStore {
  readonly backend: 'local' | 'firestore';

  // -- Settings ------------------------------------------------------------
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>, actor: Actor): Promise<Settings>;

  // -- Taxonomy ------------------------------------------------------------
  listCategories(includeInactive?: boolean): Promise<Category[]>;
  listOccasions(includeInactive?: boolean): Promise<Occasion[]>;
  getOccasionBySlug(slug: string): Promise<Occasion | null>;
  listFestivals(includeInactive?: boolean): Promise<Festival[]>;
  getFestivalBySlug(slug: string): Promise<Festival | null>;
  upsertCategory(category: Category, actor: Actor): Promise<Category>;
  upsertOccasion(occasion: Occasion, actor: Actor): Promise<Occasion>;
  upsertFestival(festival: Festival, actor: Actor): Promise<Festival>;
  deleteCategory(id: Id, actor: Actor): Promise<void>;
  deleteOccasion(id: Id, actor: Actor): Promise<void>;
  deleteFestival(id: Id, actor: Actor): Promise<void>;

  // -- Catalogue -----------------------------------------------------------
  listProducts(query?: ProductQuery): Promise<Page<Product>>;
  getProductById(id: Id): Promise<Product | null>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductsByIds(ids: Id[]): Promise<Product[]>;
  upsertProduct(product: Product, actor: Actor): Promise<Product>;
  deleteProduct(id: Id, actor: Actor): Promise<void>;

  // -- Inventory -----------------------------------------------------------
  listKitComponents(): Promise<KitComponent[]>;
  upsertKitComponent(component: KitComponent, actor: Actor): Promise<KitComponent>;
  /** The only path to a stock change outside checkout. Always writes a ledger row. */
  adjustStock(adjustment: StockAdjustment, actor: Actor): Promise<InventoryTransaction>;
  listInventoryTransactions(query?: InventoryQuery): Promise<Page<InventoryTransaction>>;

  // -- Cart ----------------------------------------------------------------
  getCart(id: Id): Promise<Cart | null>;
  saveCart(cart: Cart): Promise<Cart>;
  deleteCart(id: Id): Promise<void>;

  // -- Coupons -------------------------------------------------------------
  listCoupons(includeInactive?: boolean): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | null>;
  upsertCoupon(coupon: Coupon, actor: Actor): Promise<Coupon>;
  deleteCoupon(id: Id, actor: Actor): Promise<void>;
  /** Redemption count for a user, so perUserLimit can be enforced. */
  countCouponRedemptions(couponId: Id, userId: Id | null): Promise<number>;

  // -- Orders --------------------------------------------------------------
  /**
   * Prices the cart, verifies and deducts stock (product, variant and kit
   * components), applies the coupon, writes the ledger and creates the order —
   * all in one atomic step.
   */
  placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;
  getOrderById(id: Id): Promise<Order | null>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  listOrders(query?: OrderQuery): Promise<Page<Order>>;
  updateOrderStatus(id: Id, status: OrderStatus, note: string, actor: Actor): Promise<Order>;
  updateOrderPayment(
    id: Id,
    payment: { paymentStatus: PaymentStatus; razorpayPaymentId?: string; razorpayOrderId?: string },
    actor: Actor,
  ): Promise<Order>;
  /** Cancels and returns every reserved unit to stock, with ledger rows. */
  cancelOrder(id: Id, reason: string, actor: Actor): Promise<Order>;
  refundOrder(id: Id, note: string, actor: Actor): Promise<Order>;
  addOrderNote(id: Id, note: string, actor: Actor): Promise<Order>;
  setOrderTracking(id: Id, tracking: { trackingNumber: string; courier: string }, actor: Actor): Promise<Order>;

  // -- Customers -----------------------------------------------------------
  getUserById(id: Id): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  upsertUser(user: User): Promise<User>;
  listUsers(query?: { search?: string; limit?: number; offset?: number }): Promise<Page<User>>;

  // -- Reviews & social proof ---------------------------------------------
  listReviews(productId?: Id, status?: Review['status'] | 'any'): Promise<Review[]>;
  createReview(review: Review): Promise<Review>;
  setReviewStatus(id: Id, status: Review['status'], actor: Actor): Promise<Review>;
  deleteReview(id: Id, actor: Actor): Promise<void>;
  /** Clears every seeded sample review and testimonial in one step. */
  purgeDemoSocialProof(actor: Actor): Promise<{ reviews: number; testimonials: number }>;
  listTestimonials(includeInactive?: boolean): Promise<Testimonial[]>;
  upsertTestimonial(testimonial: Testimonial, actor: Actor): Promise<Testimonial>;
  deleteTestimonial(id: Id, actor: Actor): Promise<void>;

  // -- Content -------------------------------------------------------------
  listBanners(slot?: BannerSlot, includeInactive?: boolean): Promise<Banner[]>;
  upsertBanner(banner: Banner, actor: Actor): Promise<Banner>;
  deleteBanner(id: Id, actor: Actor): Promise<void>;

  // -- Ritual Finder -------------------------------------------------------
  listRecommendationRules(includeInactive?: boolean): Promise<RecommendationRule[]>;
  upsertRecommendationRule(rule: RecommendationRule, actor: Actor): Promise<RecommendationRule>;
  deleteRecommendationRule(id: Id, actor: Actor): Promise<void>;

  // -- Notifications -------------------------------------------------------
  listNotifications(userId: Id | null, limit?: number): Promise<AppNotification[]>;
  createNotification(notification: AppNotification): Promise<AppNotification>;
  markNotificationsRead(userId: Id | null, ids?: Id[]): Promise<number>;

  // -- Admin ---------------------------------------------------------------
  getAdminByEmail(email: string): Promise<AdminUser | null>;
  getAdminById(id: Id): Promise<AdminUser | null>;
  listAdmins(): Promise<AdminUser[]>;
  upsertAdmin(admin: AdminUser, actor: Actor): Promise<AdminUser>;
  deleteAdmin(id: Id, actor: Actor): Promise<void>;
  recordAdminLogin(id: Id): Promise<void>;

  appendAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  listAuditLogs(query?: AuditQuery): Promise<Page<AuditLog>>;

  // -- Analytics -----------------------------------------------------------
  recordAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<void>;
  getAnalyticsSummary(range: AnalyticsRange): Promise<AnalyticsSummary>;
}

/** Totals are computed by the pricing service; re-exported for adapter use. */
export type { CartTotals };
