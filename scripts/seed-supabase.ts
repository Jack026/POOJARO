/**
 * Database seeder for Supabase PostgreSQL.
 *
 * Populates all tables with POOJARO's curated catalog, categories,
 * occasions, festivals, kit components, banners, and settings.
 *
 * Usage:
 *   npx tsx scripts/seed-supabase.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// 1. Automatically load .env.local if present
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[error] Missing Supabase credentials.');
  console.error('Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`[poojaro] Connecting to Supabase at: ${supabaseUrl}`);

  // Dynamic import of seed data
  const { buildSeedDatabase } = await import('../src/lib/data/seed');
  const seed = await buildSeedDatabase();
  const now = new Date().toISOString();

  console.log('[poojaro] Seeding settings...');
  await supabase.from('settings').upsert({
    id: 'store_settings',
    store_name: seed.settings.storeName,
    support_email: seed.settings.supportEmail,
    support_phone: seed.settings.supportPhone,
    whatsapp_number: seed.settings.whatsappNumber,
    free_delivery_threshold: seed.settings.freeShippingThreshold / 100,
    delivery_fee: seed.settings.shippingFee / 100,
    raw: seed.settings,
    updated_at: now,
  });

  console.log(`[poojaro] Seeding categories (${seed.categories.length})...`);
  if (seed.categories.length > 0) {
    const { error } = await supabase.from('categories').upsert(
      seed.categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parent_id: c.parentId,
        description: c.description,
        sort_order: c.sortOrder,
        is_active: c.isActive,
        raw: c,
        updated_at: now,
      }))
    );
    if (error) console.warn('  Category warning:', error.message);
  }

  console.log(`[poojaro] Seeding occasions (${seed.occasions.length})...`);
  if (seed.occasions.length > 0) {
    const { error } = await supabase.from('occasions').upsert(
      seed.occasions.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        tagline: o.tagline,
        description: o.description,
        image_url: o.imageUrl,
        icon: o.icon,
        sort_order: o.sortOrder,
        is_active: o.isActive,
        raw: o,
        updated_at: now,
      }))
    );
    if (error) console.warn('  Occasion warning:', error.message);
  }

  console.log(`[poojaro] Seeding festivals (${seed.festivals.length})...`);
  if (seed.festivals.length > 0) {
    const { error } = await supabase.from('festivals').upsert(
      seed.festivals.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        headline: f.headline,
        tagline: f.tagline,
        description: f.description,
        image_url: f.imageUrl,
        icon: f.icon,
        start_date: f.startDate,
        end_date: f.endDate,
        accent: f.accent,
        sort_order: f.sortOrder,
        is_active: f.isActive,
        raw: f,
        updated_at: now,
      }))
    );
    if (error) console.warn('  Festival warning:', error.message);
  }

  console.log(`[poojaro] Seeding kit components (${seed.kitComponents.length})...`);
  if (seed.kitComponents.length > 0) {
    const { error } = await supabase.from('kit_components').upsert(
      seed.kitComponents.map((k) => ({
        id: k.id,
        name: k.name,
        sku: k.id,
        stock: k.stock,
        low_stock_threshold: k.lowStockThreshold,
        cost_price: 0,
        unit: k.unit,
        raw: k,
        updated_at: now,
      }))
    );
    if (error) console.warn('  Kit component warning:', error.message);
  }

  console.log(`[poojaro] Seeding products (${seed.products.length})...`);
  if (seed.products.length > 0) {
    const { error } = await supabase.from('products').upsert(
      seed.products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        subtitle: p.shortDescription || '',
        description: p.description,
        category_id: p.categoryId,
        occasion_id: p.occasionIds?.[0] || null,
        festival_id: p.festivalIds?.[0] || null,
        is_kit: p.isKit,
        is_featured: p.isFeatured,
        tags: p.tags || [],
        keywords: p.keywords || [],
        price: p.price / 100,
        compare_at_price: p.mrp ? p.mrp / 100 : null,
        sku: p.sku,
        stock: p.stock,
        low_stock_threshold: p.lowStockThreshold,
        status: p.status,
        images: p.images || [],
        kit_items: p.contents || [],
        variants: p.variants || [],
        rating: p.rating || 0,
        review_count: p.reviewCount || 0,
        raw: p,
        updated_at: now,
      }))
    );
    if (error) console.warn('  Product warning:', error.message);
  }

  console.log(`[poojaro] Seeding banners (${seed.banners.length})...`);
  if (seed.banners.length > 0) {
    const { error } = await supabase.from('banners').upsert(
      seed.banners.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        image_url: b.imageUrl,
        link_url: b.ctaHref,
        slot: b.slot,
        sort_order: b.sortOrder,
        is_active: b.isActive,
        raw: b,
        updated_at: now,
      }))
    );
    if (error) console.warn('  Banner warning:', error.message);
  }

  console.log(`[poojaro] Seeding coupons (${seed.coupons.length})...`);
  if (seed.coupons.length > 0) {
    const { error } = await supabase.from('coupons').upsert(
      seed.coupons.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        type: c.type,
        value: c.value,
        min_order_amount: c.minOrderAmount / 100,
        max_discount: c.maxDiscount ? c.maxDiscount / 100 : null,
        usage_limit: c.usageLimit,
        usage_count: c.usageCount,
        per_user_limit: c.perUserLimit ?? 1,
        is_active: c.isActive,
        raw: c,
        updated_at: now,
      }))
    );
    if (error) console.warn('  Coupon warning:', error.message);
  }

  console.log(`[poojaro] Seeding recommendation rules (${seed.recommendationRules.length})...`);
  if (seed.recommendationRules.length > 0) {
    const { error } = await supabase.from('recommendation_rules').upsert(
      seed.recommendationRules.map((r) => ({
        id: r.id,
        name: `${r.occasionId}-${r.level}`,
        condition: { occasionId: r.occasionId, minPeople: r.minPeople, maxPeople: r.maxPeople, level: r.level },
        recommendations: { productId: r.productId, suggestedQty: r.suggestedQty, reason: r.reason, addOnProductIds: r.addOnProductIds },
        is_active: r.isActive,
        priority: r.sortOrder,
        raw: r,
        updated_at: now,
      }))
    );
    if (error) console.warn('  Recommendation rules warning:', error.message);
  }

  console.log(`[poojaro] Seeding testimonials (${seed.testimonials.length})...`);
  if (seed.testimonials.length > 0) {
    const { error } = await supabase.from('testimonials').upsert(
      seed.testimonials.map((t) => ({
        id: t.id,
        name: t.authorName,
        location: t.city,
        quote: t.quote,
        rating: t.rating,
        is_active: t.isActive,
        sort_order: t.sortOrder,
        raw: t,
        updated_at: now,
      }))
    );
    if (error) console.warn('  Testimonials warning:', error.message);
  }

  console.log(`[poojaro] Seeding reviews (${seed.reviews.length})...`);
  if (seed.reviews.length > 0) {
    const { error } = await supabase.from('reviews').upsert(
      seed.reviews.map((r) => ({
        id: r.id,
        product_id: r.productId,
        user_id: r.userId,
        user_name: r.authorName,
        rating: r.rating,
        title: r.title,
        body: r.body,
        is_verified_purchase: r.verifiedPurchase,
        status: r.status,
        helpful_count: r.helpfulCount,
        raw: r,
        updated_at: now,
      }))
    );
    if (error) console.warn('  Reviews warning:', error.message);
  }

  console.log(`[poojaro] Seeding admin users (${seed.adminUsers.length})...`);
  if (seed.adminUsers && seed.adminUsers.length > 0) {
    const { error } = await supabase.from('admin_users').upsert(
      seed.adminUsers.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.name,
        role: a.role,
        is_active: a.isActive,
        password_hash: a.passwordHash,
        last_login_at: a.lastLoginAt,
        raw: a,
        updated_at: now,
      }))
    );
    if (error) console.warn('  Admin user warning:', error.message);
  }

  console.log('--- Initializing Storage Buckets ---');
  const buckets = ['poojaro-products', 'poojaro-banners', 'poojaro-media'];
  for (const bucket of buckets) {
    try {
      const { error: bError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
      });
      if (bError && !bError.message.includes('already exists')) {
        console.warn(`  Bucket ${bucket} notice:`, bError.message);
      } else {
        console.log(`  Bucket "${bucket}" verified.`);
      }
    } catch (bErr) {
      console.warn(`  Bucket error for ${bucket}:`, (bErr as Error).message);
    }
  }

  console.log('\n✅ Supabase database seed completed successfully!');
}

main().catch((err) => {
  console.error('[error] Seeding failed:', err);
  process.exit(1);
});
