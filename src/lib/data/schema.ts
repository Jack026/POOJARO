/**
 * POOJARO Data Schema
 *
 * Core types for all entities in the store.
 * This is the single source of truth for data structure.
 */

// ============================================================================
// User & Auth
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'owner' | 'manager' | 'staff';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

// ============================================================================
// Products & Inventory
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: string;
}

export interface Occasion {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: string;
}

export interface Festival {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  date?: string;
  active: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  discount?: number;
  image: string;
  images: string[];
  category: string;
  occasions: string[];
  festivals: string[];
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  rating: number;
  reviewCount: number;
  isKit: boolean;
  kitComponents?: KitComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface KitComponent {
  productId: string;
  quantity: number;
  name?: string;
}

export interface Inventory {
  productId: string;
  quantity: number;
  reserved: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'add' | 'remove' | 'reserve' | 'release' | 'sale';
  quantity: number;
  previousQty: number;
  newQty: number;
  reason?: string;
  adminId?: string;
  orderId?: string;
  createdAt: string;
}

// ============================================================================
// Cart & Orders
// ============================================================================

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  coupon?: string;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  address: Address;
  estimatedDelivery: string;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Payments & Coupons
// ============================================================================

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  maxUses?: number;
  used: number;
  validFrom: string;
  validUntil: string;
  applicableTo?: 'all' | 'product' | 'category';
  applicableIds?: string[];
  active: boolean;
  createdAt: string;
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  razorpayId?: string;
  createdAt: string;
}

// ============================================================================
// Reviews & Ratings
// ============================================================================

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  images?: string[];
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Content & CMS
// ============================================================================

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  position: number;
  active: boolean;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  quote: string;
  rating: number;
  verified: boolean;
  createdAt: string;
}

// ============================================================================
// Settings & Configuration
// ============================================================================

export interface Settings {
  id: string;
  storeName: string;
  storeDescription: string;
  storeEmail: string;
  storePhone: string;
  whatsappNumber?: string;
  supportEmail?: string;
  supportPhone?: string;
  freeDeliveryThreshold: number;
  deliveryFee: number;
  taxRate: number;
  currency: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  updatedAt: string;
}

// ============================================================================
// Notifications
// ============================================================================

export type NotificationType =
  | 'order-placed'
  | 'payment-confirmed'
  | 'order-packed'
  | 'order-shipped'
  | 'out-for-delivery'
  | 'delivered'
  | 'promo'
  | 'restock'
  | 'low-stock';

export interface Notification {
  id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// ============================================================================
// Admin Audit Log
// ============================================================================

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  createdAt: string;
}

// ============================================================================
// Store Interface
// ============================================================================

export interface Store {
  // Products
  listProducts(query?: { status?: string; category?: string; limit?: number; offset?: number }): Promise<{
    items: Product[];
    total: number;
  }>;
  getProduct(id: string): Promise<Product | null>;
  createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  updateProduct(id: string, data: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Orders
  listOrders(query?: { userId?: string; status?: string; limit?: number; offset?: number }): Promise<{
    items: Order[];
    total: number;
  }>;
  getOrder(id: string): Promise<Order | null>;
  createOrder(data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;

  // Cart
  getCart(userId: string): Promise<Cart | null>;
  updateCart(userId: string, items: CartItem[]): Promise<Cart>;

  // Inventory
  getInventory(productId: string): Promise<Inventory | null>;
  updateInventory(productId: string, quantity: number, reason?: string): Promise<Inventory>;
  listInventory(): Promise<Inventory[]>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(data: Partial<Settings>): Promise<Settings>;

  // Users
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;

  // Admin
  getAdminUser(id: string): Promise<AdminUser | null>;
  getAdminByEmail(email: string): Promise<AdminUser | null>;
  createAdminUser(data: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminUser>;
}
