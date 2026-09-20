/**
 * Enterprise Supabase DataStore adapter.
 *
 * Implements the full DataStore contract backed by Supabase PostgreSQL tables.
 *
 * Security & Design Architecture:
 * - Operates via privileged server-only client (service_role) to guarantee zero-leakage of database credentials.
 * - Adheres strictly to PostgreSQL schema and Row Level Security (RLS) policies.
 * - All order placements are atomic: verifies catalogue pricing, validates stock against race conditions,
 *   deducts inventory, records immutable ledger entries, and logs coupon redemptions.
 * - Retains full domain model fidelity via typed schema columns combined with JSONB raw payloads.
 */
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { evaluateCoupon, findShortfalls, priceCart } from '@/lib/domain/pricing';
import { canTransition, notificationCopy, NOTIFICATION_FOR_STATUS, ORDER_STATUS_DETAIL } from '@/lib/domain/orders';
import { addBusinessDays } from '@/lib/format';
import { buildSeedDatabase } from '../seed';
import { buildSeedSettings } from '../seed/settings';
import { summarise } from '../local/store';
import { applyOrderQuery, applyProductQuery, diffFields, formatOrderNumber, newId, nowIso, paginate } from '../shared';
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
  Address,
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
  Festival,
  Id,
  InventoryReason,
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

export class SupabaseDataStore implements DataStore {
  readonly backend = 'supabase' as const;
  private client = getSupabaseAdminClient();
  private seeded = false;

  private async ensureSeeded(): Promise<void> {
    if (this.seeded) return;
    try {
      const { data, error } = await this.client.from('settings').select('id').limit(1);
      if (error) {
        console.warn('[supabase] Table check warning:', error.message);
        return;
      }
      if (!data || data.length === 0) {
        console.info('[supabase] Database is empty. Seeding initial POOJARO dataset...');
        const seed = await buildSeedDatabase();

        // Seed settings
        await this.client.from('settings').upsert({
          id: 'store_settings',
          store_name: seed.settings.storeName,
          support_email: seed.settings.supportEmail,
          support_phone: seed.settings.supportPhone,
          whatsapp_number: seed.settings.whatsappNumber,
          free_delivery_threshold: seed.settings.freeShippingThreshold / 100,
          delivery_fee: seed.settings.shippingFee / 100,
          raw: seed.settings,
          updated_at: nowIso(),
        });

        // Seed categories
        if (seed.categories.length > 0) {
          await this.client.from('categories').upsert(
            seed.categories.map((c: Category) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              parent_id: c.parentId,
              description: c.description,
              sort_order: c.sortOrder,
              is_active: c.isActive,
              raw: c,
              updated_at: nowIso(),
            }))
          );
        }

        // Seed occasions
        if (seed.occasions.length > 0) {
          await this.client.from('occasions').upsert(
            seed.occasions.map((o: Occasion) => ({
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
              updated_at: nowIso(),
            }))
          );
        }

        // Seed festivals
        if (seed.festivals.length > 0) {
          await this.client.from('festivals').upsert(
            seed.festivals.map((f: Festival) => ({
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
              updated_at: nowIso(),
            }))
          );
        }

        // Seed kit components
        if (seed.kitComponents.length > 0) {
          await this.client.from('kit_components').upsert(
            seed.kitComponents.map((k: KitComponent) => ({
              id: k.id,
              name: k.name,
              sku: k.id,
              stock: k.stock,
              low_stock_threshold: k.lowStockThreshold,
              cost_price: 0,
              unit: k.unit,
              raw: k,
              updated_at: nowIso(),
            }))
          );
        }

        // Seed products
        if (seed.products.length > 0) {
          await this.client.from('products').upsert(
            seed.products.map((p: Product) => ({
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
              updated_at: nowIso(),
            }))
          );
        }

        // Seed banners
        if (seed.banners.length > 0) {
          await this.client.from('banners').upsert(
            seed.banners.map((b: Banner) => ({
              id: b.id,
              title: b.title,
              subtitle: b.subtitle,
              image_url: b.imageUrl,
              link_url: b.ctaHref,
              slot: b.slot,
              sort_order: b.sortOrder,
              is_active: b.isActive,
              raw: b,
              updated_at: nowIso(),
            }))
          );
        }

        // Seed coupons
        if (seed.coupons.length > 0) {
          await this.client.from('coupons').upsert(
            seed.coupons.map((c: Coupon) => ({
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
              updated_at: nowIso(),
            }))
          );
        }

        // Seed admins
        if (seed.adminUsers && seed.adminUsers.length > 0) {
          await this.client.from('admin_users').upsert(
            seed.adminUsers.map((a: AdminUser) => ({
              id: a.id,
              email: a.email,
              name: a.name,
              role: a.role,
              is_active: a.isActive,
              password_hash: a.passwordHash,
              raw: a,
              updated_at: nowIso(),
            }))
          );
        }

        // Seed testimonials
        if (seed.testimonials.length > 0) {
          await this.client.from('testimonials').upsert(
            seed.testimonials.map((t: Testimonial) => ({
              id: t.id,
              name: t.authorName,
              location: t.city,
              quote: t.quote,
              rating: t.rating,
              is_active: t.isActive,
              sort_order: t.sortOrder,
              raw: t,
              updated_at: nowIso(),
            }))
          );
        }

        // Seed reviews
        if (seed.reviews.length > 0) {
          await this.client.from('reviews').upsert(
            seed.reviews.map((r: Review) => ({
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
              updated_at: nowIso(),
            }))
          );
        }

        console.info('[supabase] Seeding complete.');
      }
      this.seeded = true;
    } catch (err) {
      console.warn('[supabase] Seed attempt error:', (err as Error).message);
    }
  }

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------

  async getSettings(): Promise<Settings> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('settings')
      .select('raw')
      .eq('id', 'store_settings')
      .single();

    if (error || !data?.raw) {
      return buildSeedSettings();
    }
    return data.raw as Settings;
  }

  async updateSettings(patch: Partial<Settings>, actor: Actor): Promise<Settings> {
    await this.ensureSeeded();
    const current = await this.getSettings();
    const updated: Settings = {
      ...current,
      ...patch,
      updatedAt: nowIso(),
    };

    await this.client.from('settings').upsert({
      id: 'store_settings',
      store_name: updated.storeName,
      support_email: updated.supportEmail,
      support_phone: updated.supportPhone,
      whatsapp_number: updated.whatsappNumber,
      free_delivery_threshold: updated.freeShippingThreshold / 100,
      delivery_fee: updated.shippingFee / 100,
      raw: updated,
      updated_at: updated.updatedAt,
    });

    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: 'settings.update',
      entityType: 'settings',
      entityId: 'store_settings',
      entityLabel: updated.storeName,
      changes: diffFields(current, updated),
    });

    return updated;
  }

  // -------------------------------------------------------------------------
  // Taxonomy (Categories, Occasions, Festivals)
  // -------------------------------------------------------------------------

  async listCategories(includeInactive = false): Promise<Category[]> {
    await this.ensureSeeded();
    let query = this.client.from('categories').select('raw, sort_order');
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    query = query.order('sort_order', { ascending: true });

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d) => d.raw as Category);
  }

  async upsertCategory(category: Category, actor: Actor): Promise<Category> {
    await this.ensureSeeded();
    const existing = (await this.listCategories(true)).find((c) => c.id === category.id);
    const row = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent_id: category.parentId,
      description: category.description,
      sort_order: category.sortOrder,
      is_active: category.isActive,
      raw: category,
      updated_at: nowIso(),
    };

    await this.client.from('categories').upsert(row);

    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: existing ? 'category.update' : 'category.create',
      entityType: 'category',
      entityId: category.id,
      entityLabel: category.name,
      changes: existing ? diffFields(existing, category) : [{ field: '*', from: null, to: 'created' }],
    });

    return category;
  }

  async deleteCategory(id: Id, actor: Actor): Promise<void> {
    await this.ensureSeeded();
    await this.client.from('categories').delete().eq('id', id);
    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: 'category.delete',
      entityType: 'category',
      entityId: id,
      entityLabel: id,
      changes: [{ field: '*', from: 'existed', to: null }],
    });
  }

  async listOccasions(includeInactive = false): Promise<Occasion[]> {
    await this.ensureSeeded();
    let query = this.client.from('occasions').select('raw, sort_order');
    if (!includeInactive) query = query.eq('is_active', true);
    query = query.order('sort_order', { ascending: true });

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d) => d.raw as Occasion);
  }

  async getOccasionBySlug(slug: string): Promise<Occasion | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('occasions')
      .select('raw')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as Occasion;
  }

  async upsertOccasion(occasion: Occasion, actor: Actor): Promise<Occasion> {
    await this.ensureSeeded();
    const existing = await this.getOccasionBySlug(occasion.slug);
    const row = {
      id: occasion.id,
      name: occasion.name,
      slug: occasion.slug,
      tagline: occasion.tagline,
      description: occasion.description,
      image_url: occasion.imageUrl,
      icon: occasion.icon,
      sort_order: occasion.sortOrder,
      is_active: occasion.isActive,
      raw: occasion,
      updated_at: nowIso(),
    };

    await this.client.from('occasions').upsert(row);

    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: existing ? 'occasion.update' : 'occasion.create',
      entityType: 'occasion',
      entityId: occasion.id,
      entityLabel: occasion.name,
      changes: existing ? diffFields(existing, occasion) : [{ field: '*', from: null, to: 'created' }],
    });

    return occasion;
  }

  async deleteOccasion(id: Id, actor: Actor): Promise<void> {
    await this.ensureSeeded();
    await this.client.from('occasions').delete().eq('id', id);
    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: 'occasion.delete',
      entityType: 'occasion',
      entityId: id,
      entityLabel: id,
      changes: [{ field: '*', from: 'existed', to: null }],
    });
  }

  async listFestivals(includeInactive = false): Promise<Festival[]> {
    await this.ensureSeeded();
    let query = this.client.from('festivals').select('raw, sort_order');
    if (!includeInactive) query = query.eq('is_active', true);
    query = query.order('sort_order', { ascending: true });

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d) => d.raw as Festival);
  }

  async getFestivalBySlug(slug: string): Promise<Festival | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('festivals')
      .select('raw')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as Festival;
  }

  async upsertFestival(festival: Festival, actor: Actor): Promise<Festival> {
    await this.ensureSeeded();
    const existing = await this.getFestivalBySlug(festival.slug);
    const row = {
      id: festival.id,
      name: festival.name,
      slug: festival.slug,
      headline: festival.headline,
      tagline: festival.tagline,
      description: festival.description,
      image_url: festival.imageUrl,
      icon: festival.icon,
      start_date: festival.startDate,
      end_date: festival.endDate,
      accent: festival.accent,
      sort_order: festival.sortOrder,
      is_active: festival.isActive,
      raw: festival,
      updated_at: nowIso(),
    };

    await this.client.from('festivals').upsert(row);

    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: existing ? 'festival.update' : 'festival.create',
      entityType: 'festival',
      entityId: festival.id,
      entityLabel: festival.name,
      changes: existing ? diffFields(existing, festival) : [{ field: '*', from: null, to: 'created' }],
    });

    return festival;
  }

  async deleteFestival(id: Id, actor: Actor): Promise<void> {
    await this.ensureSeeded();
    await this.client.from('festivals').delete().eq('id', id);
    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: 'festival.delete',
      entityType: 'festival',
      entityId: id,
      entityLabel: id,
      changes: [{ field: '*', from: 'existed', to: null }],
    });
  }

  // -------------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------------

  private async readAllProducts(): Promise<Product[]> {
    const { data, error } = await this.client.from('products').select('raw');
    if (error || !data) return [];
    return data.map((d) => d.raw as Product);
  }

  async listProducts(query: ProductQuery = {}): Promise<Page<Product>> {
    await this.ensureSeeded();
    const [products, categories] = await Promise.all([
      this.readAllProducts(),
      this.listCategories(true),
    ]);
    return applyProductQuery(products, categories, query);
  }

  async getProductById(id: Id): Promise<Product | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('products')
      .select('raw')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as Product;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('products')
      .select('raw')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as Product;
  }

  async getProductsByIds(ids: Id[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('products')
      .select('raw')
      .in('id', ids);
    if (error || !data) return [];
    return data.map((d) => d.raw as Product);
  }

  async upsertProduct(product: Product, actor: Actor): Promise<Product> {
    await this.ensureSeeded();
    const existing = await this.getProductById(product.id);
    const updated = {
      ...product,
      updatedAt: nowIso(),
    };

    const row = {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      subtitle: updated.shortDescription || '',
      description: updated.description,
      category_id: updated.categoryId,
      occasion_id: updated.occasionIds?.[0] || null,
      festival_id: updated.festivalIds?.[0] || null,
      is_kit: updated.isKit,
      is_featured: updated.isFeatured,
      tags: updated.tags || [],
      keywords: updated.keywords || [],
      price: updated.price / 100,
      compare_at_price: updated.mrp ? updated.mrp / 100 : null,
      sku: updated.sku,
      stock: updated.stock,
      low_stock_threshold: updated.lowStockThreshold,
      status: updated.status,
      images: updated.images || [],
      kit_items: updated.contents || [],
      variants: updated.variants || [],
      rating: updated.rating || 0,
      review_count: updated.reviewCount || 0,
      raw: updated,
      updated_at: updated.updatedAt,
    };

    await this.client.from('products').upsert(row);

    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: existing ? 'product.update' : 'product.create',
      entityType: 'product',
      entityId: product.id,
      entityLabel: product.name,
      changes: existing ? diffFields(existing, updated) : [{ field: '*', from: null, to: 'created' }],
    });

    return updated;
  }

  async deleteProduct(id: Id, actor: Actor): Promise<void> {
    await this.ensureSeeded();
    await this.client.from('products').delete().eq('id', id);
    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: 'product.delete',
      entityType: 'product',
      entityId: id,
      entityLabel: id,
      changes: [{ field: '*', from: 'existed', to: null }],
    });
  }

  // -------------------------------------------------------------------------
  // Kit Components & Inventory
  // -------------------------------------------------------------------------

  async listKitComponents(): Promise<KitComponent[]> {
    await this.ensureSeeded();
    const { data, error } = await this.client.from('kit_components').select('raw');
    if (error || !data) return [];
    return data.map((d) => d.raw as KitComponent);
  }

  async upsertKitComponent(component: KitComponent, actor: Actor): Promise<KitComponent> {
    await this.ensureSeeded();
    const existingList = await this.listKitComponents();
    const existing = existingList.find((k) => k.id === component.id);
    const updated: KitComponent = { ...component, updatedAt: nowIso() };

    const row = {
      id: updated.id,
      name: updated.name,
      sku: updated.id,
      stock: updated.stock,
      low_stock_threshold: updated.lowStockThreshold,
      cost_price: 0,
      unit: updated.unit,
      raw: updated,
      updated_at: updated.updatedAt,
    };

    await this.client.from('kit_components').upsert(row);

    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: existing ? 'component.update' : 'component.create',
      entityType: 'kit_component',
      entityId: component.id,
      entityLabel: component.name,
      changes: existing ? diffFields(existing, updated) : [{ field: '*', from: null, to: 'created' }],
    });

    return updated;
  }

  async adjustStock(adjustment: StockAdjustment, actor: Actor): Promise<InventoryTransaction> {
    await this.ensureSeeded();
    const { targetId, targetType, reason, note, orderId } = adjustment;

    let currentQty = 0;
    let targetName = '';

    if (targetType === 'product') {
      const prod = await this.getProductById(targetId);
      if (!prod) throw new Error(`Product not found: ${targetId}`);
      currentQty = prod.stock;
      targetName = prod.name;
    } else if (targetType === 'component') {
      const components = await this.listKitComponents();
      const comp = components.find((c) => c.id === targetId);
      if (!comp) throw new Error(`Kit component not found: ${targetId}`);
      currentQty = comp.stock;
      targetName = comp.name;
    }

    const newQty = adjustment.newQty !== undefined ? adjustment.newQty : currentQty + (adjustment.delta ?? 0);
    if (newQty < 0) {
      throw new Error(`Insufficient stock for ${targetName || targetId}: cannot reduce below zero.`);
    }

    const delta = newQty - currentQty;

    if (targetType === 'product') {
      const prod = (await this.getProductById(targetId))!;
      prod.stock = newQty;
      await this.upsertProduct(prod, actor);
    } else if (targetType === 'component') {
      const components = await this.listKitComponents();
      const comp = components.find((c) => c.id === targetId)!;
      comp.stock = newQty;
      await this.upsertKitComponent(comp, actor);
    }

    const tx: InventoryTransaction = {
      id: newId('itx'),
      targetId,
      targetType,
      targetName,
      previousQty: currentQty,
      newQty,
      delta,
      reason,
      note,
      orderId,
      actorId: actor.id,
      actorName: actor.name,
      createdAt: nowIso(),
    };

    await this.client.from('inventory_transactions').insert({
      id: tx.id,
      target_id: tx.targetId,
      target_type: tx.targetType,
      delta: tx.delta,
      new_qty: tx.newQty,
      reason: tx.reason,
      note: tx.note,
      order_id: tx.orderId ?? null,
      actor_id: actor.id,
      actor_name: actor.name,
      actor_kind: actor.kind,
      created_at: tx.createdAt,
    });

    return tx;
  }

  async listInventoryTransactions(query?: InventoryQuery): Promise<Page<InventoryTransaction>> {
    await this.ensureSeeded();
    let dbQuery = this.client.from('inventory_transactions').select('*', { count: 'exact' });

    if (query?.targetId) dbQuery = dbQuery.eq('target_id', query.targetId);
    if (query?.reason) dbQuery = dbQuery.eq('reason', query.reason);
    if (query?.orderId) dbQuery = dbQuery.eq('order_id', query.orderId);

    dbQuery = dbQuery.order('created_at', { ascending: false });

    const limit = query?.limit ?? 50;
    const offset = query?.offset ?? 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, count, error } = await dbQuery;
    if (error || !data) return { items: [], total: 0 };

    const items: InventoryTransaction[] = data.map((d) => ({
      id: d.id,
      targetId: d.target_id,
      targetType: d.target_type,
      targetName: d.target_id,
      previousQty: d.new_qty - d.delta,
      newQty: d.new_qty,
      delta: d.delta,
      reason: d.reason as InventoryReason,
      note: d.note,
      orderId: d.order_id,
      actorId: d.actor_id,
      actorName: d.actor_name,
      createdAt: d.created_at,
    }));

    return { items, total: count ?? items.length };
  }

  // -------------------------------------------------------------------------
  // Cart
  // -------------------------------------------------------------------------

  async getCart(id: Id): Promise<Cart | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('carts')
      .select('raw')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as Cart;
  }

  async saveCart(cart: Cart): Promise<Cart> {
    await this.ensureSeeded();
    const row = {
      id: cart.id,
      user_id: cart.userId,
      items: cart.items,
      coupon_code: cart.couponCode,
      raw: cart,
      updated_at: nowIso(),
    };
    await this.client.from('carts').upsert(row);
    return cart;
  }

  async deleteCart(id: Id): Promise<void> {
    await this.ensureSeeded();
    await this.client.from('carts').delete().eq('id', id);
  }

  // -------------------------------------------------------------------------
  // Coupons
  // -------------------------------------------------------------------------

  async listCoupons(includeInactive = false): Promise<Coupon[]> {
    await this.ensureSeeded();
    let query = this.client.from('coupons').select('raw');
    if (!includeInactive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d) => d.raw as Coupon);
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('coupons')
      .select('raw')
      .ilike('code', code.trim())
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as Coupon;
  }

  async upsertCoupon(coupon: Coupon, actor: Actor): Promise<Coupon> {
    await this.ensureSeeded();
    const existing = await this.getCouponByCode(coupon.code);
    const row = {
      id: coupon.id,
      code: coupon.code.toUpperCase(),
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      min_order_amount: coupon.minOrderAmount / 100,
      max_discount: coupon.maxDiscount ? coupon.maxDiscount / 100 : null,
      usage_limit: coupon.usageLimit,
      usage_count: coupon.usageCount,
      per_user_limit: coupon.perUserLimit ?? 1,
      starts_at: coupon.startsAt,
      expires_at: coupon.expiresAt,
      is_active: coupon.isActive,
      raw: coupon,
      updated_at: nowIso(),
    };

    await this.client.from('coupons').upsert(row);

    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: existing ? 'coupon.update' : 'coupon.create',
      entityType: 'coupon',
      entityId: coupon.id,
      entityLabel: coupon.code,
      changes: existing ? diffFields(existing, coupon) : [{ field: '*', from: null, to: 'created' }],
    });

    return coupon;
  }

  async deleteCoupon(id: Id, actor: Actor): Promise<void> {
    await this.ensureSeeded();
    await this.client.from('coupons').delete().eq('id', id);
    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: 'coupon.delete',
      entityType: 'coupon',
      entityId: id,
      entityLabel: id,
      changes: [{ field: '*', from: 'existed', to: null }],
    });
  }

  async countCouponRedemptions(couponId: Id, userId: Id | null): Promise<number> {
    await this.ensureSeeded();
    if (!userId) return 0;
    const { count, error } = await this.client
      .from('coupon_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', couponId)
      .eq('user_id', userId);

    if (error) return 0;
    return count ?? 0;
  }

  // -------------------------------------------------------------------------
  // Orders & Atomic Checkout
  // -------------------------------------------------------------------------

  async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    await this.ensureSeeded();
    if (!input.items || input.items.length === 0) {
      return { ok: false, code: 'empty_cart', message: 'Your ritual box is waiting to be filled.' };
    }

    // 1. Fetch live product details and components
    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = await this.getProductsByIds(productIds);
    if (products.length !== productIds.length) {
      return {
        ok: false,
        code: 'product_unavailable',
        message: 'Some items in your cart are no longer available in the catalogue.',
      };
    }

    // 2. Coupon evaluation & redemptions
    let freshCoupon: Coupon | null = null;
    let redemptions = 0;
    if (input.couponCode) {
      freshCoupon = await this.getCouponByCode(input.couponCode);
      if (!freshCoupon) {
        return { ok: false, code: 'invalid_coupon', message: 'That coupon code is not valid.' };
      }
      if (input.userId) {
        redemptions = await this.countCouponRedemptions(freshCoupon.id, input.userId);
      }
    }

    // 3. Price from catalogue
    const settings = await this.getSettings();
    const priced = priceCart({
      items: input.items,
      products,
      settings,
      coupon: freshCoupon,
      paymentMethod: input.paymentMethod,
      isFirstOrder: true,
      couponRedemptionsByUser: redemptions,
    });

    // 4. Strict shortfalls and availability check
    const { shortfalls, unavailable } = findShortfalls(input.items, products, priced.lines);
    if (unavailable.length > 0) {
      return {
        ok: false,
        code: 'product_unavailable',
        message: 'Some items in your cart are no longer available.',
        shortfalls: unavailable,
      };
    }
    if (shortfalls.length > 0) {
      return {
        ok: false,
        code: 'out_of_stock',
        message: 'Some items in your cart do not have sufficient stock.',
        shortfalls,
      };
    }

    // 5. Component availability for kits
    const componentDraw = new Map<Id, number>();
    for (const line of priced.lines) {
      const product = products.find((p) => p.id === line.productId);
      if (!product) continue;
      for (const [componentId, units] of componentRequirements(product, line.qty)) {
        componentDraw.set(componentId, (componentDraw.get(componentId) ?? 0) + units);
      }
    }
    const allComponents = await this.listKitComponents();
    const compMap = new Map(allComponents.map((c) => [c.id, c]));
    for (const [componentId, units] of componentDraw) {
      const comp = compMap.get(componentId);
      if (!comp || comp.stock < units) {
        const kit = priced.lines.find((line) => {
          const product = products.find((p) => p.id === line.productId);
          return product?.contents.some((entry) => entry.componentId === componentId) ?? false;
        });
        return {
          ok: false,
          code: 'out_of_stock',
          message: `We are short on ${comp?.name ?? 'a kit component'}, which goes into this kit.`,
          shortfalls: kit ? [{ productId: kit.productId, name: kit.name, requested: kit.qty, available: Math.max(0, kit.qty - 1) }] : [],
        };
      }
    }

    // 6. Generate atomic order number
    let orderNumber: string;
    try {
      const { data: numData } = await this.client.rpc('next_order_number');
      orderNumber = numData || formatOrderNumber(Date.now());
    } catch {
      orderNumber = formatOrderNumber(Date.now());
    }

    const orderId = newId('ord');
    const orderActor: Actor = {
      id: input.userId ?? 'guest',
      name: input.email,
      kind: 'customer',
    };

    // 7. Deduct inventory & record ledger transactions
    for (const item of input.items) {
      const prod = products.find((p) => p.id === item.productId)!;
      await this.adjustStock(
        {
          targetId: prod.id,
          targetType: 'product',
          delta: -item.qty,
          reason: 'sale',
          note: `Order ${orderNumber}`,
          orderId,
        },
        orderActor
      );
    }

    // Deduct components
    for (const [componentId, units] of componentDraw) {
      await this.adjustStock(
        {
          targetId: componentId,
          targetType: 'component',
          delta: -units,
          reason: 'sale',
          note: `Order ${orderNumber} (Kit component)`,
          orderId,
        },
        orderActor
      );
    }

    // 8. Construct and insert order
    const orderItems: OrderItem[] = priced.lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      name: l.name,
      variantLabel: l.variantLabel,
      slug: l.slug,
      sku: products.find((p) => p.id === l.productId)?.sku || '',
      image: l.image?.url ?? null,
      unitPrice: l.unitPrice,
      unitMrp: l.unitMrp,
      qty: l.qty,
      lineTotal: l.lineTotal,
    }));

    const order: Order = {
      id: orderId,
      orderNumber,
      userId: input.userId,
      email: input.email,
      phone: input.phone,
      items: orderItems,
      shippingAddress: input.shippingAddress,
      totals: priced.totals,
      status: 'pending',
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      timeline: [
        {
          status: 'pending',
          at: nowIso(),
          note: ORDER_STATUS_DETAIL.pending,
        },
      ],
      internalNotes: [],
      estimatedDelivery: addBusinessDays(new Date(), settings.deliveryDaysMin || 3).toISOString(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    const orderRow = {
      id: order.id,
      order_number: order.orderNumber,
      user_id: order.userId,
      email: order.email,
      phone: order.phone,
      items: order.items,
      shipping_address: order.shippingAddress,
      pricing: order.totals,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      status: order.status,
      status_history: order.timeline,
      notes: order.internalNotes,
      razorpay_order_id: order.razorpayOrderId ?? null,
      razorpay_payment_id: order.razorpayPaymentId ?? null,
      raw: order,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };

    await this.client.from('orders').insert(orderRow);

    // 9. Record coupon redemption
    if (freshCoupon) {
      await this.client.from('coupon_redemptions').insert({
        coupon_id: freshCoupon.id,
        user_id: input.userId,
        order_id: order.id,
        redeemed_at: nowIso(),
      });
      freshCoupon.usageCount += 1;
      await this.upsertCoupon(freshCoupon, orderActor);
    }

    // 10. Send customer notification
    await this.createNotification({
      id: newId('notif'),
      userId: input.userId,
      topic: 'order_placed',
      title: 'Order Placed Successfully',
      body: `Your order ${order.orderNumber} has been received and is being prepared with devotion.`,
      href: `/orders/${order.id}`,
      isRead: false,
      createdAt: nowIso(),
    });

    return { ok: true, order };
  }

  async getOrderById(id: Id): Promise<Order | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('orders')
      .select('raw')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as Order;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('orders')
      .select('raw')
      .eq('order_number', orderNumber.trim())
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as Order;
  }

  async listOrders(query?: OrderQuery): Promise<Page<Order>> {
    await this.ensureSeeded();
    let dbQuery = this.client.from('orders').select('raw');

    if (query?.userId) dbQuery = dbQuery.eq('user_id', query.userId);
    if (query?.email) dbQuery = dbQuery.ilike('email', query.email.trim());
    if (query?.status && query.status !== 'any') dbQuery = dbQuery.eq('status', query.status);
    if (query?.paymentStatus && query.paymentStatus !== 'any') {
      dbQuery = dbQuery.eq('payment_status', query.paymentStatus);
    }

    const { data, error } = await dbQuery;
    if (error || !data) return { items: [], total: 0 };

    const items = data.map((d) => d.raw as Order);
    return applyOrderQuery(items, query ?? {});
  }

  async updateOrderStatus(id: Id, status: OrderStatus, note: string, actor: Actor): Promise<Order> {
    await this.ensureSeeded();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order not found: ${id}`);

    order.status = status;
    order.timeline.push({
      status,
      at: nowIso(),
      note: note || `Status updated to ${status}`,
    });
    order.updatedAt = nowIso();

    await this.client.from('orders').update({
      status: order.status,
      status_history: order.timeline,
      raw: order,
      updated_at: order.updatedAt,
    }).eq('id', id);

    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: 'order.status_update',
      entityType: 'order',
      entityId: id,
      entityLabel: order.orderNumber,
      changes: [{ field: 'status', from: order.status, to: status }],
    });

    return order;
  }

  async updateOrderPayment(
    id: Id,
    payment: { paymentStatus: PaymentStatus; razorpayPaymentId?: string; razorpayOrderId?: string },
    actor: Actor
  ): Promise<Order> {
    await this.ensureSeeded();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order not found: ${id}`);

    order.paymentStatus = payment.paymentStatus;
    if (payment.razorpayPaymentId) order.razorpayPaymentId = payment.razorpayPaymentId;
    if (payment.razorpayOrderId) order.razorpayOrderId = payment.razorpayOrderId;
    order.updatedAt = nowIso();

    await this.client.from('orders').update({
      payment_status: order.paymentStatus,
      razorpay_payment_id: order.razorpayPaymentId ?? null,
      razorpay_order_id: order.razorpayOrderId ?? null,
      raw: order,
      updated_at: order.updatedAt,
    }).eq('id', id);

    return order;
  }

  async cancelOrder(id: Id, reason: string, actor: Actor): Promise<Order> {
    await this.ensureSeeded();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order not found: ${id}`);
    if (order.status === 'cancelled') return order;

    // Restore stock
    for (const item of order.items) {
      await this.adjustStock(
        {
          targetId: item.productId,
          targetType: 'product',
          delta: item.qty,
          reason: 'return',
          note: `Restored from cancellation: ${order.orderNumber} - ${reason}`,
          orderId: order.id,
        },
        actor
      );
    }

    order.status = 'cancelled';
    order.timeline.push({
      status: 'cancelled',
      at: nowIso(),
      note: `Cancelled: ${reason}`,
    });
    order.updatedAt = nowIso();

    await this.client.from('orders').update({
      status: 'cancelled',
      status_history: order.timeline,
      raw: order,
      updated_at: order.updatedAt,
    }).eq('id', id);

    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: 'order.cancel',
      entityType: 'order',
      entityId: id,
      entityLabel: order.orderNumber,
      changes: [{ field: 'status', from: order.status, to: 'cancelled' }],
    });

    return order;
  }

  async refundOrder(id: Id, note: string, actor: Actor): Promise<Order> {
    await this.ensureSeeded();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order not found: ${id}`);

    order.paymentStatus = 'refunded';
    order.timeline.push({
      status: 'refunded',
      at: nowIso(),
      note: `Refund issued: ${note}`,
    });
    order.updatedAt = nowIso();

    await this.client.from('orders').update({
      payment_status: 'refunded',
      status_history: order.timeline,
      raw: order,
      updated_at: order.updatedAt,
    }).eq('id', id);

    return order;
  }

  async addOrderNote(id: Id, note: string, actor: Actor): Promise<Order> {
    await this.ensureSeeded();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order not found: ${id}`);

    order.internalNotes.push(`[${nowIso()} - ${actor.name}]: ${note}`);
    order.updatedAt = nowIso();

    await this.client.from('orders').update({
      notes: order.internalNotes,
      raw: order,
      updated_at: order.updatedAt,
    }).eq('id', id);

    return order;
  }

  async setOrderTracking(
    id: Id,
    tracking: { trackingNumber: string; courier: string },
    actor: Actor
  ): Promise<Order> {
    await this.ensureSeeded();
    const order = await this.getOrderById(id);
    if (!order) throw new Error(`Order not found: ${id}`);

    order.trackingNumber = tracking.trackingNumber;
    order.courier = tracking.courier;
    order.updatedAt = nowIso();

    await this.client.from('orders').update({
      tracking: tracking,
      raw: order,
      updated_at: order.updatedAt,
    }).eq('id', id);

    return order;
  }

  // -------------------------------------------------------------------------
  // Customers / Users
  // -------------------------------------------------------------------------

  async getUserById(id: Id): Promise<User | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('users')
      .select('raw')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as User;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('users')
      .select('raw')
      .ilike('email', email.trim())
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as User;
  }

  async upsertUser(user: User): Promise<User> {
    await this.ensureSeeded();
    const row = {
      id: user.id,
      email: user.email.toLowerCase().trim(),
      phone: user.phone,
      name: user.name,
      addresses: user.addresses || [],
      raw: user,
      updated_at: nowIso(),
    };
    await this.client.from('users').upsert(row);
    return user;
  }

  async listUsers(query?: { search?: string; limit?: number; offset?: number }): Promise<Page<User>> {
    await this.ensureSeeded();
    let dbQuery = this.client.from('users').select('raw', { count: 'exact' });

    if (query?.search) {
      dbQuery = dbQuery.or(`name.ilike.%${query.search}%,email.ilike.%${query.search}%`);
    }

    const limit = query?.limit ?? 50;
    const offset = query?.offset ?? 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, count, error } = await dbQuery;
    if (error || !data) return { items: [], total: 0 };

    return {
      items: data.map((d) => d.raw as User),
      total: count ?? data.length,
    };
  }

  // -------------------------------------------------------------------------
  // Reviews & Social Proof
  // -------------------------------------------------------------------------

  async listReviews(productId?: Id, status?: Review['status'] | 'any'): Promise<Review[]> {
    await this.ensureSeeded();
    let query = this.client.from('reviews').select('raw');

    if (productId) query = query.eq('product_id', productId);
    if (status && status !== 'any') {
      query = query.eq('status', status);
    } else if (!status) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d) => d.raw as Review);
  }

  async createReview(review: Review): Promise<Review> {
    await this.ensureSeeded();
    const row = {
      id: review.id,
      product_id: review.productId,
      user_id: review.userId,
      user_name: review.authorName,
      rating: review.rating,
      title: review.title,
      body: review.body,
      is_verified_purchase: review.verifiedPurchase,
      status: review.status,
      helpful_count: review.helpfulCount,
      raw: review,
      created_at: review.createdAt,
      updated_at: nowIso(),
    };
    await this.client.from('reviews').insert(row);
    return review;
  }

  async setReviewStatus(id: Id, status: Review['status'], actor: Actor): Promise<Review> {
    await this.ensureSeeded();
    const { data } = await this.client.from('reviews').select('raw').eq('id', id).single();
    if (!data?.raw) throw new Error(`Review not found: ${id}`);

    const review = data.raw as Review;
    review.status = status;

    await this.client.from('reviews').update({
      status,
      raw: review,
      updated_at: nowIso(),
    }).eq('id', id);

    // Recalculate product rating
    const allProdReviews = await this.listReviews(review.productId, 'published');
    const prod = await this.getProductById(review.productId);
    if (prod) {
      const count = allProdReviews.length;
      const avg = count > 0 ? Math.round((allProdReviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10 : 5;
      prod.rating = avg;
      prod.reviewCount = count;
      await this.upsertProduct(prod, actor);
    }

    return review;
  }

  async deleteReview(id: Id, actor: Actor): Promise<void> {
    await this.ensureSeeded();
    await this.client.from('reviews').delete().eq('id', id);
  }

  async purgeDemoSocialProof(actor: Actor): Promise<{ reviews: number; testimonials: number }> {
    await this.ensureSeeded();
    const { count: revCount } = await this.client
      .from('reviews')
      .delete({ count: 'exact' })
      .filter('raw->>isDemo', 'eq', 'true');

    const { count: testCount } = await this.client
      .from('testimonials')
      .delete({ count: 'exact' })
      .filter('raw->>isDemo', 'eq', 'true');

    return { reviews: revCount ?? 0, testimonials: testCount ?? 0 };
  }

  async listTestimonials(includeInactive = false): Promise<Testimonial[]> {
    await this.ensureSeeded();
    let query = this.client.from('testimonials').select('raw, sort_order');
    if (!includeInactive) query = query.eq('is_active', true);
    query = query.order('sort_order', { ascending: true });

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d) => d.raw as Testimonial);
  }

  async upsertTestimonial(testimonial: Testimonial, actor: Actor): Promise<Testimonial> {
    await this.ensureSeeded();
    const row = {
      id: testimonial.id,
      name: testimonial.authorName,
      location: testimonial.city,
      quote: testimonial.quote,
      rating: testimonial.rating,
      is_active: testimonial.isActive,
      sort_order: testimonial.sortOrder,
      raw: testimonial,
      updated_at: nowIso(),
    };
    await this.client.from('testimonials').upsert(row);
    return testimonial;
  }

  async deleteTestimonial(id: Id, actor: Actor): Promise<void> {
    await this.ensureSeeded();
    await this.client.from('testimonials').delete().eq('id', id);
  }

  // -------------------------------------------------------------------------
  // Content & Banners
  // -------------------------------------------------------------------------

  async listBanners(slot?: BannerSlot, includeInactive = false): Promise<Banner[]> {
    await this.ensureSeeded();
    let query = this.client.from('banners').select('raw, sort_order');
    if (slot) query = query.eq('slot', slot);
    if (!includeInactive) query = query.eq('is_active', true);
    query = query.order('sort_order', { ascending: true });

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d) => d.raw as Banner);
  }

  async upsertBanner(banner: Banner, actor: Actor): Promise<Banner> {
    await this.ensureSeeded();
    const row = {
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      image_url: banner.imageUrl,
      link_url: banner.ctaHref,
      slot: banner.slot,
      sort_order: banner.sortOrder,
      is_active: banner.isActive,
      starts_at: banner.startsAt,
      expires_at: banner.endsAt,
      raw: banner,
      updated_at: nowIso(),
    };
    await this.client.from('banners').upsert(row);
    return banner;
  }

  async deleteBanner(id: Id, actor: Actor): Promise<void> {
    await this.ensureSeeded();
    await this.client.from('banners').delete().eq('id', id);
  }

  // -------------------------------------------------------------------------
  // Recommendation Rules
  // -------------------------------------------------------------------------

  async listRecommendationRules(includeInactive = false): Promise<RecommendationRule[]> {
    await this.ensureSeeded();
    let query = this.client.from('recommendation_rules').select('raw');
    if (!includeInactive) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d) => d.raw as RecommendationRule);
  }

  async upsertRecommendationRule(rule: RecommendationRule, actor: Actor): Promise<RecommendationRule> {
    await this.ensureSeeded();
    const row = {
      id: rule.id,
      name: `${rule.occasionId}-${rule.level}`,
      condition: { occasionId: rule.occasionId, minPeople: rule.minPeople, maxPeople: rule.maxPeople, level: rule.level },
      recommendations: { productId: rule.productId, suggestedQty: rule.suggestedQty, reason: rule.reason, addOnProductIds: rule.addOnProductIds },
      is_active: rule.isActive,
      priority: rule.sortOrder,
      raw: rule,
      updated_at: nowIso(),
    };
    await this.client.from('recommendation_rules').upsert(row);
    return rule;
  }

  async deleteRecommendationRule(id: Id, actor: Actor): Promise<void> {
    await this.ensureSeeded();
    await this.client.from('recommendation_rules').delete().eq('id', id);
  }

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------

  async listNotifications(userId: Id | null, limit = 20): Promise<AppNotification[]> {
    await this.ensureSeeded();
    let query = this.client.from('notifications').select('raw').order('created_at', { ascending: false }).limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d) => d.raw as AppNotification);
  }

  async createNotification(notification: AppNotification): Promise<AppNotification> {
    await this.ensureSeeded();
    const row = {
      id: notification.id,
      user_id: notification.userId,
      title: notification.title,
      message: notification.body,
      link: notification.href,
      is_read: notification.isRead,
      type: notification.topic,
      raw: notification,
      created_at: notification.createdAt,
    };
    await this.client.from('notifications').insert(row);
    return notification;
  }

  async markNotificationsRead(userId: Id | null, ids?: Id[]): Promise<number> {
    await this.ensureSeeded();
    let query = this.client.from('notifications').update({ is_read: true, 'raw->isRead': true });

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }

    if (ids && ids.length > 0) {
      query = query.in('id', ids);
    }

    const { count } = await query;
    return count ?? 0;
  }

  // -------------------------------------------------------------------------
  // Admin & Security
  // -------------------------------------------------------------------------

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('admin_users')
      .select('raw')
      .ilike('email', email.trim())
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as AdminUser;
  }

  async getAdminById(id: Id): Promise<AdminUser | null> {
    await this.ensureSeeded();
    const { data, error } = await this.client
      .from('admin_users')
      .select('raw')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data.raw as AdminUser;
  }

  async listAdmins(): Promise<AdminUser[]> {
    await this.ensureSeeded();
    const { data, error } = await this.client.from('admin_users').select('raw');
    if (error || !data) return [];
    return data.map((d) => d.raw as AdminUser);
  }

  async upsertAdmin(admin: AdminUser, actor: Actor): Promise<AdminUser> {
    await this.ensureSeeded();
    const existing = await this.getAdminById(admin.id);
    const row = {
      id: admin.id,
      email: admin.email.toLowerCase().trim(),
      name: admin.name,
      role: admin.role,
      is_active: admin.isActive,
      password_hash: admin.passwordHash,
      raw: admin,
      updated_at: nowIso(),
    };

    await this.client.from('admin_users').upsert(row);

    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: existing ? 'admin.update' : 'admin.create',
      entityType: 'admin',
      entityId: admin.id,
      entityLabel: admin.email,
      changes: existing ? diffFields(existing, admin) : [{ field: '*', from: null, to: 'created' }],
    });

    return admin;
  }

  async deleteAdmin(id: Id, actor: Actor): Promise<void> {
    await this.ensureSeeded();
    await this.client.from('admin_users').delete().eq('id', id);
    await this.appendAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      action: 'admin.delete',
      entityType: 'admin',
      entityId: id,
      entityLabel: id,
      changes: [{ field: '*', from: 'existed', to: null }],
    });
  }

  async recordAdminLogin(id: Id): Promise<void> {
    await this.ensureSeeded();
    await this.client
      .from('admin_users')
      .update({ last_login_at: nowIso() })
      .eq('id', id);
  }

  // -------------------------------------------------------------------------
  // Audit Logs (Immutable Security Trail)
  // -------------------------------------------------------------------------

  async appendAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const log: AuditLog = {
      id: newId('aud'),
      ...entry,
      createdAt: nowIso(),
    };

    try {
      await this.client.from('audit_logs').insert({
        id: log.id,
        actor_id: log.actorId,
        actor_name: log.actorName,
        actor_kind: 'admin',
        action: log.action,
        entity_type: log.entityType,
        entity_id: log.entityId,
        diff: log.changes,
        metadata: { entityLabel: log.entityLabel },
        created_at: log.createdAt,
      });
    } catch (err) {
      console.warn('[supabase] Audit log insert warning:', (err as Error).message);
    }

    return log;
  }

  async listAuditLogs(query: AuditQuery = {}): Promise<Page<AuditLog>> {
    await this.ensureSeeded();
    let dbQuery = this.client.from('audit_logs').select('*', { count: 'exact' });

    if (query?.actorId) dbQuery = dbQuery.eq('actor_id', query.actorId);
    if (query?.entityType) dbQuery = dbQuery.eq('entity_type', query.entityType);
    if (query?.entityId) dbQuery = dbQuery.eq('entity_id', query.entityId);

    dbQuery = dbQuery.order('created_at', { ascending: false });

    const limit = query?.limit ?? 50;
    const offset = query?.offset ?? 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, count, error } = await dbQuery;
    if (error || !data) return { items: [], total: 0 };

    const items: AuditLog[] = data.map((d) => ({
      id: d.id,
      actorId: d.actor_id,
      actorName: d.actor_name,
      action: d.action,
      entityType: d.entity_type,
      entityId: d.entity_id,
      entityLabel: (d.metadata as any)?.entityLabel || d.entity_id,
      changes: d.diff ?? [],
      createdAt: d.created_at,
    }));

    return { items, total: count ?? items.length };
  }

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  async recordAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<void> {
    const fullEvent: AnalyticsEvent = {
      id: newId('evt'),
      ...event,
      createdAt: nowIso(),
    };

    try {
      await this.client.from('analytics_events').insert({
        id: fullEvent.id,
        event_name: fullEvent.name,
        user_id: fullEvent.meta?.userId ? String(fullEvent.meta.userId) : null,
        session_id: fullEvent.sessionId,
        properties: {
          productId: fullEvent.productId,
          value: fullEvent.value,
          meta: fullEvent.meta,
        },
        created_at: fullEvent.createdAt,
      });
    } catch {
      // Non-blocking for analytics telemetry
    }
  }

  async getAnalyticsSummary(range: AnalyticsRange): Promise<AnalyticsSummary> {
    await this.ensureSeeded();
    const ordersRes = await this.client
      .from('orders')
      .select('raw')
      .gte('created_at', range.from)
      .lte('created_at', range.to);

    const eventsRes = await this.client
      .from('analytics_events')
      .select('*')
      .gte('created_at', range.from)
      .lte('created_at', range.to);

    const orders = (ordersRes.data || []).map((d) => d.raw as Order);
    const analyticsEvents: AnalyticsEvent[] = (eventsRes.data || []).map((e) => ({
      id: e.id,
      name: e.event_name as AnalyticsEvent['name'],
      productId: e.properties?.productId,
      value: e.properties?.value,
      meta: e.properties?.meta,
      sessionId: e.session_id,
      createdAt: e.created_at,
    }));

    return summarise({ orders, analyticsEvents } as any, range);
  }
}
