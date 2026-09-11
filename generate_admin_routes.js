const fs = require('fs');
const path = require('path');

const baseDir = 'c:/Users/soura/Downloads/pojaro/site/src/app/api/admin';

function createDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const files = {
    'auth/login/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { verifyPassword } from '@/lib/auth/password';
import { seal, ADMIN_COOKIE, cookieOptions, ADMIN_TTL_SECONDS } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const store = await getStore();
    const admin = await store.getAdminByEmail(email);
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const session = {
      kind: 'admin',
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      exp: Math.floor(Date.now() / 1000) + ADMIN_TTL_SECONDS
    };

    const token = await seal(session);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, token, cookieOptions(ADMIN_TTL_SECONDS));

    await store.recordAdminLogin(admin.id);

    const { passwordHash, ...adminInfo } = admin;
    return NextResponse.json(adminInfo);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'auth/logout/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, clearedCookieOptions } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, '', clearedCookieOptions());
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'products/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('catalogue.read');
    const store = await getStore();
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    query.status = query.status || 'any';
    const products = await store.listProducts(query);
    return NextResponse.json(products);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const body = await req.json();
    const product = await store.upsertProduct(body, actorFor(admin));
    return NextResponse.json(product);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'products/[id]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin('catalogue.read');
    const store = await getStore();
    const { id } = await params;
    const product = await store.getProductById(id);
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    const product = await store.upsertProduct({ ...body, id }, actorFor(admin));
    return NextResponse.json(product);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteProduct(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'categories/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('catalogue.read');
    const store = await getStore();
    const categories = await store.listCategories(true);
    return NextResponse.json(categories);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const body = await req.json();
    const category = await store.upsertCategory(body, actorFor(admin));
    return NextResponse.json(category);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'categories/[id]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    const category = await store.upsertCategory({ ...body, id }, actorFor(admin));
    return NextResponse.json(category);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteCategory(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'occasions/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('catalogue.read');
    const store = await getStore();
    const occasions = await store.listOccasions(true);
    return NextResponse.json(occasions);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const body = await req.json();
    const occasion = await store.upsertOccasion(body, actorFor(admin));
    return NextResponse.json(occasion);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'occasions/[id]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    const occasion = await store.upsertOccasion({ ...body, id }, actorFor(admin));
    return NextResponse.json(occasion);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteOccasion(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'festivals/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('catalogue.read');
    const store = await getStore();
    const festivals = await store.listFestivals(true);
    return NextResponse.json(festivals);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const body = await req.json();
    const festival = await store.upsertFestival(body, actorFor(admin));
    return NextResponse.json(festival);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'festivals/[id]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    const festival = await store.upsertFestival({ ...body, id }, actorFor(admin));
    return NextResponse.json(festival);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('catalogue.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteFestival(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'coupons/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('marketing.write');
    const store = await getStore();
    const coupons = await store.listCoupons();
    return NextResponse.json(coupons);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('marketing.write');
    const store = await getStore();
    const body = await req.json();
    const coupon = await store.upsertCoupon(body, actorFor(admin));
    return NextResponse.json(coupon);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'coupons/[id]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('marketing.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    const coupon = await store.upsertCoupon({ ...body, id }, actorFor(admin));
    return NextResponse.json(coupon);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('marketing.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteCoupon(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'banners/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('content.write');
    const store = await getStore();
    const banners = await store.listBanners();
    return NextResponse.json(banners);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('content.write');
    const store = await getStore();
    const body = await req.json();
    const banner = await store.upsertBanner(body, actorFor(admin));
    return NextResponse.json(banner);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'banners/[id]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('content.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    const banner = await store.upsertBanner({ ...body, id }, actorFor(admin));
    return NextResponse.json(banner);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('content.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteBanner(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'orders/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('orders.read');
    const store = await getStore();
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const orders = await store.listOrders(query);
    return NextResponse.json(orders);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'orders/[id]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin('orders.read');
    const store = await getStore();
    const { id } = await params;
    const order = await store.getOrderById(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('orders.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    const { action, status, note, tracking, payment, reason } = body;
    
    if (action === 'status') {
      await store.updateOrderStatus(id, status, note, actorFor(admin));
    } else if (action === 'note') {
      await store.addOrderNote(id, note, actorFor(admin));
    } else if (action === 'tracking') {
      await store.setOrderTracking(id, tracking, actorFor(admin));
    } else if (action === 'payment') {
      await store.updateOrderPayment(id, payment, actorFor(admin));
    } else if (action === 'cancel') {
      await store.cancelOrder(id, reason, actorFor(admin));
    } else if (action === 'refund') {
      const refundAdmin = await requireAdmin('orders.refund');
      await store.refundOrder(id, note, actorFor(refundAdmin));
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    const order = await store.getOrderById(id);
    return NextResponse.json(order);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'customers/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('customers.read');
    const store = await getStore();
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const customers = await store.listUsers(query);
    return NextResponse.json(customers);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'inventory/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('inventory.read');
    const store = await getStore();
    const products = await store.listProducts({ status: 'any' });
    const components = await store.listKitComponents();
    return NextResponse.json({ products, components });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('inventory.write');
    const store = await getStore();
    const body = await req.json();
    await store.adjustStock(body, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'inventory/transactions/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('inventory.read');
    const store = await getStore();
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const transactions = await store.listInventoryTransactions(query);
    return NextResponse.json(transactions);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'analytics/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('analytics.read');
    const store = await getStore();
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || 'last_30_days';
    const analytics = await store.getAnalyticsSummary(range as any);
    return NextResponse.json(analytics);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'settings/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';
import { paymentReadiness } from '@/lib/domain/payments';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('settings.write');
    const store = await getStore();
    const settings = await store.getSettings();
    const readiness = paymentReadiness(settings);
    return NextResponse.json({ settings, readiness });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin('settings.write');
    const store = await getStore();
    const body = await req.json();
    const settings = await store.updateSettings(body, actorFor(admin));
    return NextResponse.json(settings);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'admins/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';
import { hashPassword } from '@/lib/auth/password';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('admins.write');
    const store = await getStore();
    const admins = await store.listAdmins();
    return NextResponse.json(admins);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('admins.write');
    const store = await getStore();
    const { password, ...body } = await req.json();
    const passwordHash = await hashPassword(password);
    const newAdmin = await store.upsertAdmin({ ...body, passwordHash }, actorFor(admin));
    return NextResponse.json(newAdmin);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'admins/[id]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';
import { hashPassword } from '@/lib/auth/password';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('admins.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    
    let updateData = { ...body, id };
    if (body.password) {
      updateData.passwordHash = await hashPassword(body.password);
      delete updateData.password;
    }
    
    const updatedAdmin = await store.upsertAdmin(updateData, actorFor(admin));
    return NextResponse.json(updatedAdmin);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('admins.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteAdmin(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'audit-logs/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('audit.read');
    const store = await getStore();
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const logs = await store.listAuditLogs(query);
    return NextResponse.json(logs);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'reviews/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('content.write');
    const store = await getStore();
    const reviews = await store.listReviews(undefined, 'any');
    return NextResponse.json(reviews);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'reviews/[id]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('content.write');
    const store = await getStore();
    const { id } = await params;
    const { status } = await req.json();
    await store.setReviewStatus(id, status, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('content.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteReview(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'recommendation-rules/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('marketing.write');
    const store = await getStore();
    const rules = await store.listRecommendationRules();
    return NextResponse.json(rules);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('marketing.write');
    const store = await getStore();
    const body = await req.json();
    const rule = await store.upsertRecommendationRule(body, actorFor(admin));
    return NextResponse.json(rule);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'recommendation-rules/[id]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('marketing.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    const rule = await store.upsertRecommendationRule({ ...body, id }, actorFor(admin));
    return NextResponse.json(rule);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('marketing.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteRecommendationRule(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'testimonials/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('content.write');
    const store = await getStore();
    const testimonials = await store.listTestimonials();
    return NextResponse.json(testimonials);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin('content.write');
    const store = await getStore();
    const body = await req.json();
    const testimonial = await store.upsertTestimonial(body, actorFor(admin));
    return NextResponse.json(testimonial);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'testimonials/[id]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, actorFor, statusForAuthError } from '@/lib/auth/guards';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('content.write');
    const store = await getStore();
    const { id } = await params;
    const body = await req.json();
    const testimonial = await store.upsertTestimonial({ ...body, id }, actorFor(admin));
    return NextResponse.json(testimonial);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin('content.write');
    const store = await getStore();
    const { id } = await params;
    await store.deleteTestimonial(id, actorFor(admin));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,

    'notifications/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { requireAdmin, statusForAuthError } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin('catalogue.read'); // generic admin capability check
    const store = await getStore();
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    // null userId is for system/admin notifications
    const notifications = await store.listNotifications(null, limit);
    return NextResponse.json(notifications);
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`
};

for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(baseDir, relativePath);
    createDir(path.dirname(fullPath));
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Created: ' + fullPath);
}
