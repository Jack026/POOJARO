/**
 * Order state machine and the customer-facing language for each state.
 *
 * Transitions are declared, not implied. An admin cannot move a delivered order
 * back to packed, and cannot cancel one that has already shipped — the store
 * rejects it rather than relying on the UI to hide the button.
 */
import type { NotificationTopic, OrderStatus } from '../data/types';

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['payment_confirmed', 'processing', 'cancelled'],
  payment_confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'returned'],
  out_for_delivery: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: ['refunded'],
  returned: ['refunded'],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Statuses whose stock has been taken out of inventory and can be returned. */
export const STOCK_HELD_STATUSES: OrderStatus[] = [
  'pending',
  'payment_confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Order Placed',
  payment_confirmed: 'Payment Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

export const ORDER_STATUS_DETAIL: Record<OrderStatus, string> = {
  pending: 'We have your order and are waiting on payment confirmation.',
  payment_confirmed: 'Payment received. Your kit moves to our packing table next.',
  processing: 'We are checking every item in your order against the kit list.',
  packed: 'Sealed, cushioned and labelled, ready for the courier.',
  shipped: 'Handed to the courier and on its way to your city.',
  out_for_delivery: 'With the delivery agent today.',
  delivered: 'Delivered. We hope the preparation goes smoothly.',
  cancelled: 'This order was cancelled and stock was returned.',
  returned: 'We have received the return.',
  refunded: 'The refund has been issued to your original payment method.',
};

export const NOTIFICATION_FOR_STATUS: Partial<Record<OrderStatus, NotificationTopic>> = {
  pending: 'order_placed',
  payment_confirmed: 'payment_successful',
  packed: 'order_packed',
  shipped: 'order_shipped',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
};

export function notificationCopy(
  status: OrderStatus,
  orderNumber: string,
): { title: string; body: string } | null {
  switch (status) {
    case 'pending':
      return {
        title: 'Your ritual begins here',
        body: `Order ${orderNumber} is confirmed. We will let you know as soon as it is packed.`,
      };
    case 'payment_confirmed':
      return { title: 'Payment received', body: `Payment for ${orderNumber} has been confirmed.` };
    case 'packed':
      return { title: 'Packed and ready', body: `${orderNumber} is sealed and waiting for the courier.` };
    case 'shipped':
      return { title: 'On its way', body: `${orderNumber} has been handed to the courier.` };
    case 'out_for_delivery':
      return { title: 'Arriving today', body: `${orderNumber} is with the delivery agent.` };
    case 'delivered':
      return { title: 'Delivered', body: `${orderNumber} has been delivered. Tell us how it went.` };
    default:
      return null;
  }
}
