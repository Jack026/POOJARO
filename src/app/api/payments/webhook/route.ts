import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { verifyWebhookSignature } from '@/lib/domain/payments';
import { SYSTEM_ACTOR } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const store = await getStore();

    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const razorpayOrderId = event.payload.payment.entity.order_id;
      const razorpayPaymentId = event.payload.payment.entity.id;
      
      const orderNumber = event.payload.payment.entity.notes?.orderNumber;
      if (orderNumber) {
        const order = await store.getOrderByNumber(orderNumber);
        if (order && order.paymentStatus !== 'paid') {
          await store.updateOrderPayment(order.id, {
            paymentStatus: 'paid',
            razorpayOrderId,
            razorpayPaymentId,
          }, SYSTEM_ACTOR);
        }
      }
    } else if (event.event === 'payment.failed') {
      const razorpayOrderId = event.payload.payment.entity.order_id;
      const orderNumber = event.payload.payment.entity.notes?.orderNumber;
      
      if (orderNumber) {
        const order = await store.getOrderByNumber(orderNumber);
        if (order && order.paymentStatus !== 'paid') {
          await store.updateOrderPayment(order.id, {
            paymentStatus: 'failed',
          }, SYSTEM_ACTOR);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
