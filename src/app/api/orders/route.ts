import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { PlaceOrderInput } from '@/lib/data/store';
import { newId } from '@/lib/data/shared';

export async function POST(req: NextRequest) {
  try {
    const input: PlaceOrderInput = await req.json();
    const store = await getStore();
    
    const result = await store.placeOrder(input);
    
    if (result.ok) {
      await store.recordAnalyticsEvent({
        name: 'purchase',
        sessionId: req.headers.get('x-session-id') || newId('ses'),
        value: result.order.totals.total,
        meta: { orderId: result.order.id }
      });
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: result.message, shortfalls: result.shortfalls }, { status: 400 });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
