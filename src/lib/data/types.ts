/**
 * POOJARO domain model.
 *
 * These types mirror the Dart models in `../../../lib/data/models/*.dart`
 * field-for-field so the Flutter app and this website can read and write the
 * same Firestore documents. If you rename a key here, rename it there too.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Amounts are stored in paise (integer) to keep money arithmetic exact. */
export type Paise = number;

/** ISO-8601 timestamp string. Firestore Timestamps are converted on read. */
export type IsoDate = string;

export type Id = string;

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

export interface KitContent {
  /** Free-text label shown in "What's Inside". */
  name: string;
  quantity: string;
  unit?: string;
  /** Optional lucide icon name, resolved by `iconFor()` on the client. */
  icon?: string;
  /**
   * When set, selling this kit draws down the named component's inventory.
   * Kits without componentId are treated as pre-assembled stock.
   */
  componentId?: Id;
  /** Units of `componentId` consumed per kit sold. */
  componentQty?: number;
}

export interface ProductVariant {
  id: Id;
  /** e.g. "Small (4 people)" */
  label: string;
  sku: string;
  price: Paise;
  mrp: Paise;
  stock: number;
  isDefault: boolean;
}

export interface ProductImage {
  url: string;
  alt: string;
  /** Intrinsic dimensions, so <Image> can reserve space and avoid CLS. */
  width: number;
  height: number;
}

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface Product {
  id: Id;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: Paise;
  mrp: Paise;
  images: ProductImage[];
  categoryId: Id;
  categoryName: string;
  occasionIds: Id[];
  festivalIds: Id[];
  contents: KitContent[];
  variants: ProductVariant[];
  stock: number;
  lowStockThreshold: number;
  sku: string;
  status: ProductStatus;
  isFeatured: boolean;
  isKit: boolean;
  tags: string[];
  keywords: string[];
  rating: number;
  reviewCount: number;
  /** Editorial copy for the PDP accordions. */
  howToPrepare: string[];
  whoIsItFor: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface Category {
  id: Id;
  name: string;
  slug: string;
  parentId: Id | null;
  description: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Occasion {
  id: Id;
  name: string;
  slug: string;
  /** One-line description used on the occasion cards. */
  tagline: string;
  description: string;
  imageUrl: string;
  /** Lucide icon name for the card mark. */
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Festival {
  id: Id;
  name: string;
  slug: string;
  /** Editorial headline, e.g. "Light Your Home". */
  headline: string;
  tagline: string;
  description: string;
  imageUrl: string;
  icon: string;
  /**
   * Next occurrence, admin-editable. Drives the countdown — never hard-coded
   * in a component, so it cannot go stale silently.
   */
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  /** Accent used for the festival card wash. */
  accent: string;
  sortOrder: number;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

/**
 * A raw component that kits are assembled from (camphor, wicks, diyas...).
 * Selling a kit deducts its components atomically.
 */
export interface KitComponent {
  id: Id;
  name: string;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  updatedAt: IsoDate;
}

export type InventoryReason =
  | 'restock'
  | 'sale'
  | 'return'
  | 'damage'
  | 'correction'
  | 'reservation'
  | 'release';

/**
 * Append-only ledger. Every stock movement writes one of these — a bare stock
 * number can never be edited without leaving a trace.
 */
export interface InventoryTransaction {
  id: Id;
  /** Either a productId or a componentId. */
  targetId: Id;
  targetType: 'product' | 'component' | 'variant';
  targetName: string;
  previousQty: number;
  newQty: number;
  delta: number;
  reason: InventoryReason;
  note: string;
  orderId?: Id;
  actorId: Id;
  actorName: string;
  createdAt: IsoDate;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface Address {
  id: Id;
  label: string;
  fullName: string;
  /** 10-digit Indian mobile, stored without the +91 prefix. */
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface User {
  id: Id;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  wishlist: Id[];
  recentlyViewed: Id[];
  /** Marketing consent — opt-in only, never defaulted to true. */
  marketingOptIn: boolean;
  createdAt: IsoDate;
}

// ---------------------------------------------------------------------------
// Cart & orders
// ---------------------------------------------------------------------------

export interface CartItem {
  productId: Id;
  variantId: Id | null;
  qty: number;
}

export interface Cart {
  id: Id;
  userId: Id | null;
  items: CartItem[];
  couponCode: string | null;
  updatedAt: IsoDate;
}

/** A cart item resolved against live catalogue data, priced server-side. */
export interface PricedCartLine {
  productId: Id;
  variantId: Id | null;
  slug: string;
  name: string;
  variantLabel: string | null;
  image: ProductImage | null;
  unitPrice: Paise;
  unitMrp: Paise;
  qty: number;
  lineTotal: Paise;
  /** Units actually available; drives "only N left" and clamping. */
  availableStock: number;
  inStock: boolean;
}

export interface CartTotals {
  subtotal: Paise;
  mrpTotal: Paise;
  productDiscount: Paise;
  couponCode: string | null;
  couponDiscount: Paise;
  couponMessage: string | null;
  shipping: Paise;
  /** Rupees still needed to unlock free delivery; 0 once unlocked. */
  freeShippingGap: Paise;
  freeShippingThreshold: Paise;
  total: Paise;
}

export interface PricedCart {
  lines: PricedCartLine[];
  totals: CartTotals;
  /** Non-fatal adjustments, e.g. a line clamped to available stock. */
  notices: string[];
}

export interface OrderItem {
  productId: Id;
  variantId: Id | null;
  name: string;
  variantLabel: string | null;
  slug: string;
  sku: string;
  image: string | null;
  unitPrice: Paise;
  unitMrp: Paise;
  qty: number;
  lineTotal: Paise;
}

export const ORDER_STATUSES = [
  'pending',
  'payment_confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The happy path, in order — used to render the tracking timeline. */
export const ORDER_TIMELINE: OrderStatus[] = [
  'pending',
  'payment_confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
];

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderEvent {
  status: OrderStatus;
  at: IsoDate;
  note: string;
}

export interface Order {
  id: Id;
  /** Human-facing reference, e.g. PJR-2K4M8Q. */
  orderNumber: string;
  userId: Id | null;
  email: string;
  phone: string;
  items: OrderItem[];
  shippingAddress: Address;
  totals: CartTotals;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Razorpay identifiers, present once a gateway is configured. */
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  timeline: OrderEvent[];
  /** Staff-only; never returned by customer-facing endpoints. */
  internalNotes: string[];
  trackingNumber?: string;
  courier?: string;
  estimatedDelivery: IsoDate;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export type CouponType = 'percentage' | 'flat';

export interface Coupon {
  id: Id;
  code: string;
  type: CouponType;
  /** Percent (1-100) when type is 'percentage', else paise off. */
  value: number;
  description: string;
  minOrderAmount: Paise;
  maxDiscount: Paise | null;
  /** Empty array means "applies to everything". */
  productIds: Id[];
  categoryIds: Id[];
  firstOrderOnly: boolean;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  startsAt: IsoDate | null;
  expiresAt: IsoDate | null;
  isActive: boolean;
  createdAt: IsoDate;
}

export type BannerSlot = 'announcement' | 'hero' | 'promo_strip' | 'festival';

export interface Banner {
  id: Id;
  slot: BannerSlot;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  startsAt: IsoDate | null;
  endsAt: IsoDate | null;
}

// ---------------------------------------------------------------------------
// Reviews & social proof
// ---------------------------------------------------------------------------

export interface Review {
  id: Id;
  productId: Id;
  userId: Id | null;
  authorName: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  photos: string[];
  verifiedPurchase: boolean;
  /**
   * True for seeded illustrative content. The UI labels these as samples so
   * they are never passed off as real customer reviews.
   */
  isDemo: boolean;
  status: 'pending' | 'published' | 'rejected';
  helpfulCount: number;
  createdAt: IsoDate;
}

export interface Testimonial {
  id: Id;
  quote: string;
  authorName: string;
  city: string;
  rating: number;
  verifiedPurchase: boolean;
  isDemo: boolean;
  sortOrder: number;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Ritual Finder
// ---------------------------------------------------------------------------

export type PreparationLevel = 'essentials' | 'complete' | 'premium';

export interface RecommendationRule {
  id: Id;
  occasionId: Id;
  minPeople: number;
  maxPeople: number;
  level: PreparationLevel;
  productId: Id;
  /** Suggested number of kits for the given headcount. */
  suggestedQty: number;
  /** Shown as "Why this kit" — must read as a reason, not a slogan. */
  reason: string;
  addOnProductIds: Id[];
  sortOrder: number;
  isActive: boolean;
}

export interface RitualFinderAnswers {
  occasionId: Id;
  people: number;
  /** 'soon' | 'week' | 'month' | 'planning' */
  timing: RitualTiming;
  level: PreparationLevel;
}

export type RitualTiming = 'soon' | 'week' | 'month' | 'planning';

export interface RitualRecommendation {
  product: Product;
  suggestedQty: number;
  reason: string;
  addOns: Product[];
  /** Delivery guidance derived from `timing`. */
  timingNote: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationTopic =
  | 'order_placed'
  | 'payment_successful'
  | 'order_packed'
  | 'order_shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'promotion'
  | 'low_stock';

export interface AppNotification {
  id: Id;
  /** null = admin-facing (e.g. low stock alerts). */
  userId: Id | null;
  topic: NotificationTopic;
  title: string;
  body: string;
  href: string | null;
  isRead: boolean;
  createdAt: IsoDate;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export type AdminRole = 'owner' | 'manager' | 'staff';

/**
 * Capability keys checked by `can()`. Roles map to sets of these so a new
 * screen can be gated without touching the role enum.
 */
export const ADMIN_CAPABILITIES = [
  'catalogue.read',
  'catalogue.write',
  'inventory.read',
  'inventory.write',
  'orders.read',
  'orders.write',
  'orders.refund',
  'customers.read',
  'marketing.write',
  'content.write',
  'analytics.read',
  'settings.write',
  'admins.write',
  'audit.read',
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

export interface AdminUser {
  id: Id;
  name: string;
  email: string;
  role: AdminRole;
  /** scrypt hash — never a plaintext or reversible value. */
  passwordHash: string;
  isActive: boolean;
  lastLoginAt: IsoDate | null;
  createdAt: IsoDate;
}

export interface AuditLog {
  id: Id;
  actorId: Id;
  actorName: string;
  action: string;
  entityType: string;
  entityId: Id;
  entityLabel: string;
  /** Field-level before/after, so a price change is fully reconstructable. */
  changes: Array<{ field: string; from: unknown; to: unknown }>;
  createdAt: IsoDate;
}

// ---------------------------------------------------------------------------
// Settings & analytics
// ---------------------------------------------------------------------------

export interface TrustBadge {
  id: Id;
  icon: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Settings {
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  whatsappMessage: string;
  freeShippingThreshold: Paise;
  shippingFee: Paise;
  codEnabled: boolean;
  codFee: Paise;
  /** Business days added to "now" for the delivery estimate. */
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  returnWindowDays: number;
  /** Pincode prefixes the store does not ship to. */
  blockedPincodePrefixes: string[];
  announcement: { text: string; href: string; isActive: boolean };
  trustBadges: TrustBadge[];
  social: { instagram: string; facebook: string; youtube: string };
  updatedAt: IsoDate;
}

export type AnalyticsEventName =
  | 'product_view'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'search'
  | 'ritual_finder_complete';

export interface AnalyticsEvent {
  id: Id;
  name: AnalyticsEventName;
  productId?: Id;
  value?: Paise;
  meta?: Record<string, string | number>;
  sessionId: string;
  createdAt: IsoDate;
}

export interface AnalyticsSummary {
  revenue: Paise;
  orderCount: number;
  averageOrderValue: Paise;
  customerCount: number;
  productViews: number;
  addToCarts: number;
  checkoutsStarted: number;
  purchases: number;
  /** Derived rates, 0-1. */
  addToCartRate: number;
  checkoutRate: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  revenueByDay: Array<{ date: string; revenue: Paise; orders: number }>;
  bestSellers: Array<{ productId: Id; name: string; units: number; revenue: Paise }>;
  ordersByStatus: Array<{ status: OrderStatus; count: number }>;
}

// ---------------------------------------------------------------------------
// The dataset
// ---------------------------------------------------------------------------

/**
 * Every collection in one shape. The local adapter persists this as a single
 * JSON document; the Firestore adapter maps each key to a collection of the
 * same name. Keeping one declaration means both adapters cannot drift apart.
 */
export interface Database {
  meta: {
    schemaVersion: number;
    seededAt: IsoDate;
    /** Increments on every write — cheap optimistic-concurrency check. */
    revision: number;
  };
  settings: Settings;
  products: Product[];
  categories: Category[];
  occasions: Occasion[];
  festivals: Festival[];
  kitComponents: KitComponent[];
  inventoryTransactions: InventoryTransaction[];
  users: User[];
  carts: Cart[];
  orders: Order[];
  coupons: Coupon[];
  banners: Banner[];
  reviews: Review[];
  testimonials: Testimonial[];
  recommendationRules: RecommendationRule[];
  notifications: AppNotification[];
  adminUsers: AdminUser[];
  auditLogs: AuditLog[];
  analyticsEvents: AnalyticsEvent[];
  /** Monotonic sequences, e.g. `order` for PJR-000123 numbering. */
  counters: Record<string, number>;
  /** Coupon redemptions per user, for perUserLimit enforcement. */
  couponRedemptions: Array<{ couponId: Id; userId: Id | null; orderId: Id; at: IsoDate }>;
}

