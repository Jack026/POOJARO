import { NextRequest, NextResponse } from 'next/server';
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
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin('catalogue.read');
    const store = await getStore();
    const body = await req.json().catch(() => ({}));
    const { ids } = body;
    const count = await store.markNotificationsRead(null, Array.isArray(ids) ? ids : undefined);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    const status = statusForAuthError(error);
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}