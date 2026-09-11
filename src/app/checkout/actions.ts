'use server';

/**
 * placeOrderAction — the one server action that may touch the order ledger.
 *
 * The client sends only: email, phone, cart items, coupon code, address, and
 * payment method. Prices, stock, and totals are NEVER taken from the client
 * (§53, §59). placeOrder() in the data store re-prices and atomically
 * checks+deducts stock in one transaction.
 *
 * §64: if Razorpay is not configured, we accept COD only and say so clearly
 * rather than pretending the payment gateway works.
 */

import { getStore } from '@/lib/data';
import type { Address, CartItem, PaymentMethod } from '@/lib/data/types';

interface PlaceOrderInput {
  email: string;
  phone: string;
  items: CartItem[];
  couponCode: string | null;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
}

type PlaceOrderActionResult =
  | { ok: true; orderNumber: string; orderId: string }
  | { ok: false; message: string; shortfalls?: Array<{ productId: string; name: string; requested: number; available: number }> };

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderActionResult> {
  // Validate minimum inputs
  if (!input.email || !input.phone || input.items.length === 0) {
    return { ok: false, message: 'Your cart appears to be empty. Please add items before placing an order.' };
  }

  const store = await getStore();

  const result = await store.placeOrder({
    userId: null,
    email: input.email,
    phone: input.phone,
    items: input.items,
    shippingAddress: input.shippingAddress,
    couponCode: input.couponCode,
    paymentMethod: input.paymentMethod,
    // COD orders are confirmed immediately; Razorpay orders require a webhook
    // to flip this to 'paid'. §64: do not fake payment confirmation.
    paymentStatus: input.paymentMethod === 'cod' ? 'pending' : 'pending',
  });

  if (!result.ok) {
    return {
      ok: false,
      message: result.message,
      shortfalls: result.code === 'out_of_stock' ? result.shortfalls : undefined,
    };
  }

  return {
    ok: true,
    orderNumber: result.order.orderNumber,
    orderId: result.order.id,
  };
}
