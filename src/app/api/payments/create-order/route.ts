import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { createPaymentOrder } from '@/lib/domain/payments';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const store = await getStore();
    const order = await store.getOrderById(orderId);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }
    
    const result = await createPaymentOrder(order);
    
    if (result.ok) {
      return NextResponse.json(result.intent);
    }
    
    return NextResponse.json({ error: result.message, code: result.code }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
