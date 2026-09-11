import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { verifyPaymentSignature } from '@/lib/domain/payments';
import { getCustomerSession } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
    
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const result = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    
    if (!result.ok) {
      return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });
    }

    const store = await getStore();
    
    // We try to get session to use as actor, otherwise system
    const session = await getCustomerSession();
    const actor = session ? { id: session.userId, name: session.name, kind: 'customer' as const } : { id: 'system', name: 'System', kind: 'system' as const };
    
    const order = await store.updateOrderPayment(orderId, {
      paymentStatus: 'paid',
      razorpayOrderId,
      razorpayPaymentId,
    }, actor);
    
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
