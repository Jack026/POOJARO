import { hashPassword } from '../../auth/password';
import { serverEnv } from '../../env';
import type { AdminUser, Database, Product, Review } from '../types';
import { KIT_COMPONENTS } from './components';
import { BANNERS, COUPONS, RECOMMENDATION_RULES } from './marketing';
import { PRODUCTS, SEEDED_AT } from './products';
import { buildSeedSettings } from './settings';
import { REVIEWS, TESTIMONIALS } from './social-proof';
import { CATEGORIES, FESTIVALS, OCCASIONS } from './taxonomy';

export const SCHEMA_VERSION = 1;

/**
 * Referential integrity check. A kit that points at a component id which does
 * not exist would silently skip its stock deduction at checkout, which is
 * exactly the class of bug that lets a shop oversell. Failing at seed time is
 * far cheaper than discovering it from an oversold order.
 */
function assertSeedIntegrity(): void {
  const componentIds = new Set(KIT_COMPONENTS.map((k) => k.id));
  const productIds = new Set(PRODUCTS.map((p) => p.id));
  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  const occasionIds = new Set(OCCASIONS.map((o) => o.id));
  const festivalIds = new Set(FESTIVALS.map((f) => f.id));
  const errors: string[] = [];

  const slugs = new Map<string, string>();
  const skus = new Map<string, string>();

  for (const product of PRODUCTS) {
    const clashingSlug = slugs.get(product.slug);
    if (clashingSlug) errors.push(`Duplicate slug "${product.slug}" on ${clashingSlug} and ${product.id}.`);
    slugs.set(product.slug, product.id);

    const clashingSku = skus.get(product.sku);
    if (clashingSku) errors.push(`Duplicate SKU "${product.sku}" on ${clashingSku} and ${product.id}.`);
    skus.set(product.sku, product.id);

    if (!categoryIds.has(product.categoryId)) {
      errors.push(`${product.id} → unknown category "${product.categoryId}".`);
    }
    for (const id of product.occasionIds) {
      if (!occasionIds.has(id)) errors.push(`${product.id} → unknown occasion "${id}".`);
    }
    for (const id of product.festivalIds) {
      if (!festivalIds.has(id)) errors.push(`${product.id} → unknown festival "${id}".`);
    }
    if (product.price > product.mrp) {
      errors.push(`${product.id} → price (${product.price}) exceeds MRP (${product.mrp}).`);
    }
    for (const line of product.contents) {
      if (line.componentId && !componentIds.has(line.componentId)) {
        errors.push(`${product.id} → content "${line.name}" references unknown component "${line.componentId}".`);
      }
    }
    for (const variant of product.variants) {
      if (variant.price > variant.mrp) {
        errors.push(`${product.id} → variant ${variant.id} price exceeds MRP.`);
      }
    }
  }

  for (const rule of RECOMMENDATION_RULES) {
    if (!productIds.has(rule.productId)) {
      errors.push(`${rule.id} → recommends unknown product "${rule.productId}".`);
    }
    if (!occasionIds.has(rule.occasionId)) {
      errors.push(`${rule.id} → unknown occasion "${rule.occasionId}".`);
    }
    for (const id of rule.addOnProductIds) {
      if (!productIds.has(id)) errors.push(`${rule.id} → unknown add-on "${id}".`);
    }
  }

  for (const review of REVIEWS) {
    if (!productIds.has(review.productId)) {
      errors.push(`${review.id} → unknown product "${review.productId}".`);
    }
  }

  for (const coupon of COUPONS) {
    for (const id of coupon.categoryIds) {
      if (!categoryIds.has(id)) errors.push(`${coupon.code} → unknown category "${id}".`);
    }
    for (const id of coupon.productIds) {
      if (!productIds.has(id)) errors.push(`${coupon.code} → unknown product "${id}".`);
    }
  }

  for (const category of CATEGORIES) {
    if (category.parentId && !categoryIds.has(category.parentId)) {
      errors.push(`Category ${category.id} → unknown parent "${category.parentId}".`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`POOJARO seed data is inconsistent:\n  - ${errors.join('\n  - ')}`);
  }
}

/**
 * Ratings are derived from the reviews that exist, never typed in by hand — so
 * a product with no reviews reads 0 and renders its empty state, and clearing
 * the sample reviews in Admin correctly drops every rating back to zero.
 */
function withReviewAggregates(products: Product[], reviews: Review[]): Product[] {
  const published = reviews.filter((r) => r.status === 'published');
  const byProduct = new Map<string, { sum: number; count: number }>();
  for (const review of published) {
    const entry = byProduct.get(review.productId) ?? { sum: 0, count: 0 };
    entry.sum += review.rating;
    entry.count += 1;
    byProduct.set(review.productId, entry);
  }
  return products.map((product) => {
    const entry = byProduct.get(product.id);
    if (!entry || entry.count === 0) return { ...product, rating: 0, reviewCount: 0 };
    return {
      ...product,
      // One decimal place, computed in integers to dodge float noise.
      rating: Math.round((entry.sum / entry.count) * 10) / 10,
      reviewCount: entry.count,
    };
  });
}

async function buildSeedAdmin(): Promise<AdminUser> {
  const { adminSeed } = serverEnv();
  return {
    id: 'admin-owner',
    name: 'Store Owner',
    email: adminSeed.email.toLowerCase(),
    role: 'owner',
    passwordHash: await hashPassword(adminSeed.password),
    isActive: true,
    lastLoginAt: null,
    createdAt: SEEDED_AT,
  };
}

/**
 * Build the initial dataset. Called once, when a datastore is found empty.
 *
 * Async because the seed admin password is hashed rather than stored — there is
 * no plaintext credential anywhere in this repository.
 */
export async function buildSeedDatabase(): Promise<Database> {
  assertSeedIntegrity();

  const { adminSeed, isProduction } = serverEnv();
  if (adminSeed.isDefault && !isProduction) {
    console.warn(
      `\n  POOJARO admin seeded with the development default:\n    email    ${adminSeed.email}\n    password ${adminSeed.password}\n  Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD before deploying.\n`,
    );
  }

  return {
    meta: { schemaVersion: SCHEMA_VERSION, seededAt: SEEDED_AT, revision: 1 },
    settings: buildSeedSettings(),
    products: withReviewAggregates(PRODUCTS, REVIEWS),
    categories: CATEGORIES,
    occasions: OCCASIONS,
    festivals: FESTIVALS,
    kitComponents: KIT_COMPONENTS,
    // The ledger opens empty: seeded stock is the opening balance, and every
    // movement from here on writes a transaction.
    inventoryTransactions: [],
    users: [],
    carts: [],
    orders: [],
    coupons: COUPONS,
    banners: BANNERS,
    reviews: REVIEWS,
    testimonials: TESTIMONIALS,
    recommendationRules: RECOMMENDATION_RULES,
    notifications: [],
    adminUsers: [await buildSeedAdmin()],
    auditLogs: [],
    analyticsEvents: [],
    counters: { order: 0 },
    couponRedemptions: [],
  };
}

export {
  BANNERS,
  CATEGORIES,
  COUPONS,
  FESTIVALS,
  KIT_COMPONENTS,
  OCCASIONS,
  PRODUCTS,
  RECOMMENDATION_RULES,
  REVIEWS,
  TESTIMONIALS,
};
