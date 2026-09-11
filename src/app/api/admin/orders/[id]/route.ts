import { NextRequest, NextResponse } from 'next/server';
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
}