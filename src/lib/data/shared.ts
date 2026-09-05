/**
 * Query, id and audit helpers shared by both adapters, so filtering and sorting
 * behave identically whichever backend is active.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import type { AuditLog, Category, Id, Order, Product } from './types';
import type { OrderQuery, Page, ProductQuery } from './store';

export function newId(prefix: string): Id {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

const ORDER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Human-facing order reference: sequence for ordering, random suffix so a
 * reference cannot be guessed by incrementing someone else's.
 */
export function formatOrderNumber(sequence: number): string {
  const seq = sequence.toString(36).toUpperCase().padStart(3, '0');
  const bytes = randomBytes(4);
  let suffix = '';
  for (const byte of bytes) {
    suffix += ORDER_ALPHABET[byte % ORDER_ALPHABET.length];
  }
  return `PJR-${seq}${suffix}`;
}

export function paginate<T>(items: T[], limit?: number, offset = 0): Page<T> {
  const total = items.length;
  const start = Math.max(0, offset);
  const end = limit === undefined ? undefined : start + Math.max(0, limit);
  return { items: items.slice(start, end), total };
}

// ---------------------------------------------------------------------------
// Audit diffing
// ---------------------------------------------------------------------------

const AUDIT_IGNORED = new Set(['updatedAt', 'createdAt', 'rating', 'reviewCount']);

/**
 * Field-level before/after for the audit log. Deep-compares by serialisation,
 * which is adequate for plain JSON documents and keeps `changes` readable.
 *
 * Takes `object` rather than `Record<string, unknown>` so entity interfaces pass
 * without a cast at every call site — an interface has no index signature, and
 * requiring one would push `as unknown as` casts into the adapters.
 */
export function diffFields(before: object | null, after: object): AuditLog['changes'] {
  const changes: AuditLog['changes'] = [];
  if (!before) {
    return [{ field: '*', from: null, to: 'created' }];
  }
  const from_ = before as Record<string, unknown>;
  const to_ = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(from_), ...Object.keys(to_)]);
  for (const key of keys) {
    if (AUDIT_IGNORED.has(key)) continue;
    const from = from_[key];
    const to = to_[key];
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes.push({ field: key, from: from ?? null, to: to ?? null });
    }
  }
  return changes;
}

// ---------------------------------------------------------------------------
// Product querying
// ---------------------------------------------------------------------------

/** Category ids including every descendant, so /shop/puja-samagri shows children. */
export function categoryWithDescendants(categories: Category[], rootId: Id): Id[] {
  const result = new Set<Id>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const category of categories) {
      if (category.parentId && result.has(category.parentId) && !result.has(category.id)) {
        result.add(category.id);
        grew = true;
      }
    }
  }
  return [...result];
}

function searchScore(product: Product, terms: string[]): number {
  const name = product.name.toLowerCase();
  const short = product.shortDescription.toLowerCase();
  const haystack = [
    name,
    short,
    product.description.toLowerCase(),
    product.categoryName.toLowerCase(),
    ...product.tags.map((t) => t.toLowerCase()),
    ...product.keywords.map((k) => k.toLowerCase()),
    ...product.contents.map((c) => c.name.toLowerCase()),
  ].join(' ');

  let score = 0;
  for (const term of terms) {
    if (!haystack.includes(term)) return 0;
    if (name === term) score += 100;
    else if (name.startsWith(term)) score += 40;
    else if (name.includes(term)) score += 25;
    else if (product.keywords.some((k) => k.toLowerCase().includes(term))) score += 12;
    else if (short.includes(term)) score += 8;
    else score += 3;
  }
  // Nudge in-stock, featured items up so the first row is always buyable.
  if (product.stock > 0) score += 4;
  if (product.isFeatured) score += 2;
  return score;
}

export function applyProductQuery(
  products: Product[],
  categories: Category[],
  query: ProductQuery = {},
): Page<Product> {
  const status = query.status ?? 'published';
  const terms =
    query.search
      ?.toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1) ?? [];

  const categoryIds = query.categoryId
    ? new Set(categoryWithDescendants(categories, query.categoryId))
    : null;

  const scored: Array<{ product: Product; score: number }> = [];

  for (const product of products) {
    if (status !== 'any' && product.status !== status) continue;
    if (categoryIds && !categoryIds.has(product.categoryId)) continue;
    if (query.occasionId && !product.occasionIds.includes(query.occasionId)) continue;
    if (query.festivalId && !product.festivalIds.includes(query.festivalId)) continue;
    if (query.isKit !== undefined && product.isKit !== query.isKit) continue;
    if (query.isFeatured !== undefined && product.isFeatured !== query.isFeatured) continue;
    if (query.inStockOnly && product.stock <= 0) continue;
    if (query.minPrice !== undefined && product.price < query.minPrice) continue;
    if (query.maxPrice !== undefined && product.price > query.maxPrice) continue;
    if (query.tags?.length && !query.tags.some((tag) => product.tags.includes(tag))) continue;

    let score = 1;
    if (terms.length > 0) {
      score = searchScore(product, terms);
      if (score === 0) continue;
    }
    scored.push({ product, score });
  }

  const sort = query.sort ?? (terms.length > 0 ? 'relevance' : 'newest');
  scored.sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return a.product.price - b.product.price;
      case 'price-desc':
        return b.product.price - a.product.price;
      case 'rating':
        return b.product.rating - a.product.rating || b.product.reviewCount - a.product.reviewCount;
      case 'discount':
        return discountRatio(b.product) - discountRatio(a.product);
      case 'newest':
        return Date.parse(b.product.createdAt) - Date.parse(a.product.createdAt);
      case 'relevance':
      default:
        return b.score - a.score || a.product.name.localeCompare(b.product.name);
    }
  });

  return paginate(
    scored.map((s) => s.product),
    query.limit,
    query.offset,
  );
}

function discountRatio(product: Product): number {
  return product.mrp > 0 ? (product.mrp - product.price) / product.mrp : 0;
}

// ---------------------------------------------------------------------------
// Order querying
// ---------------------------------------------------------------------------

export function applyOrderQuery(orders: Order[], query: OrderQuery = {}): Page<Order> {
  const search = query.search?.trim().toLowerCase();
  const from = query.from ? Date.parse(query.from) : null;
  const to = query.to ? Date.parse(query.to) : null;

  const filtered = orders.filter((order) => {
    if (query.userId && order.userId !== query.userId) return false;
    if (query.email && order.email.toLowerCase() !== query.email.toLowerCase()) return false;
    if (query.status && query.status !== 'any' && order.status !== query.status) return false;
    if (query.paymentStatus && query.paymentStatus !== 'any' && order.paymentStatus !== query.paymentStatus) {
      return false;
    }
    const created = Date.parse(order.createdAt);
    if (from !== null && created < from) return false;
    if (to !== null && created > to) return false;
    if (search) {
      const haystack = [
        order.orderNumber,
        order.email,
        order.phone,
        order.shippingAddress.fullName,
        order.shippingAddress.city,
        order.shippingAddress.pincode,
        ...order.items.map((i) => i.name),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return paginate(filtered, query.limit, query.offset);
}

/** Staff-only fields stripped before an order is returned to a customer. */
export function toCustomerOrder(order: Order): Order {
  return { ...order, internalNotes: [] };
}
