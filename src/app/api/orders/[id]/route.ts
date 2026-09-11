import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { autoProgressOrder } from '@/lib/domain/orderProgress';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = await getStore();
    const rawOrder = (await store.getOrderById(id)) ?? (await store.getOrderByNumber(id));

    if (!rawOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { order } = autoProgressOrder(rawOrder);
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
