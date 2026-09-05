/**
 * Payments.
 *
 * SERVER ONLY. `RAZORPAY_KEY_SECRET` signs orders and verifies callbacks; it must
 * never appear in a bundle. Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is public, which
 * is by design — Razorpay's key id identifies the merchant, the secret authorises.
 *
 * Two payment paths, both real:
 *
 *  1. Cash on delivery — needs no gateway. It works today, and the admin can
 *     switch it off in Settings.
 *  2. Razorpay (UPI, cards, net banking, wallets) — needs credentials. Until they
 *     are set, `createPaymentOrder` returns `configured: false` and the checkout
 *     UI says plainly that online payment is not enabled yet, rather than showing
 *     a button that goes nowhere (§64).
 *
 * What is NOT faked anywhere: a `paid` order. `verifyPayment` only reports success
 * when Razorpay's own HMAC signature checks out against our secret, so a client
 * cannot POST `{ status: 'paid' }` and be believed (§53).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { isRazorpayConfigured, serverEnv } from '../env';
import type { Order, Paise, PaymentMethod, Settings } from '../data/types';

export const RAZORPAY_METHODS: readonly PaymentMethod[] = ['upi', 'card', 'netbanking'];

/** What the shopper is offered at checkout, given what is actually configured. */
export interface PaymentOption {
  method: PaymentMethod;
  label: string;
  detail: string;
  available: boolean;
  /** Why it is unavailable — shown to the shopper, so it must read plainly. */
  unavailableReason: string | null;
  /** Extra charged for this method, e.g. a COD handling fee. */
  fee: Paise;
}

export function paymentOptions(settings: Settings): PaymentOption[] {
  const online = isRazorpayConfigured();
  const onlineReason = online
    ? null
    : 'Online payment is not enabled on this store yet. Please choose cash on delivery.';

  return [
    {
      method: 'upi',
      label: 'UPI',
      detail: 'GPay, PhonePe, Paytm, BHIM or any UPI app.',
      available: online,
      unavailableReason: onlineReason,
      fee: 0,
    },
    {
      method: 'card',
      label: 'Credit or debit card',
      detail: 'Visa, Mastercard, RuPay and American Express.',
      available: online,
      unavailableReason: onlineReason,
      fee: 0,
    },
    {
      method: 'netbanking',
      label: 'Net banking',
      detail: 'All major Indian banks.',
      available: online,
      unavailableReason: onlineReason,
      fee: 0,
    },
    {
      method: 'cod',
      label: 'Cash on delivery',
      detail:
        settings.codFee > 0
          ? 'Pay the courier when your order arrives. A small handling fee applies.'
          : 'Pay the courier when your order arrives.',
      available: settings.codEnabled,
      unavailableReason: settings.codEnabled ? null : 'Cash on delivery is currently switched off.',
      fee: settings.codFee,
    },
  ];
}

export function isMethodAvailable(method: PaymentMethod, settings: Settings): boolean {
  return paymentOptions(settings).some((option) => option.method === method && option.available);
}

export function requiresGateway(method: PaymentMethod): boolean {
  return RAZORPAY_METHODS.includes(method);
}

// ---------------------------------------------------------------------------
// Creating a gateway order
// ---------------------------------------------------------------------------

export interface PaymentIntent {
  /** Razorpay's order id, handed to the browser checkout widget. */
  gatewayOrderId: string;
  /** Publishable key id — safe to send to the client. */
  keyId: string;
  amount: Paise;
  currency: 'INR';
}

export type CreatePaymentResult =
  | { ok: true; intent: PaymentIntent }
  | { ok: false; code: 'not_configured' | 'gateway_error' | 'package_missing'; message: string };

/**
 * Create a Razorpay order for an order we have already priced and saved.
 *
 * The amount comes from `order.totals.total`, which was computed server-side in
 * `priceCart`. The browser has no say in it (§53).
 *
 * `razorpay` is an optional dependency and is imported dynamically, so a
 * deployment that never takes online payments does not need the package
 * installed and `next build` does not fail without it.
 */
export async function createPaymentOrder(order: Order): Promise<CreatePaymentResult> {
  if (!isRazorpayConfigured()) {
    return {
      ok: false,
      code: 'not_configured',
      message:
        'Online payment is not configured. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and NEXT_PUBLIC_RAZORPAY_KEY_ID to enable it.',
    };
  }

  const { razorpay } = serverEnv();
  const keyId = razorpay.keyId;
  const keySecret = razorpay.keySecret;
  if (!keyId || !keySecret) {
    return { ok: false, code: 'not_configured', message: 'Razorpay credentials are incomplete.' };
  }

  let Razorpay: RazorpayConstructor;
  try {
    const mod = (await import('razorpay')) as unknown as { default: RazorpayConstructor };
    Razorpay = mod.default;
  } catch {
    return {
      ok: false,
      code: 'package_missing',
      message: 'Razorpay credentials are set but the package is not installed. Run: npm install razorpay',
    };
  }

  try {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const created = await client.orders.create({
      // Razorpay works in paise, which is also our internal unit — no conversion.
      amount: order.totals.total,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: order.id, orderNumber: order.orderNumber },
    });
    return {
      ok: true,
      intent: { gatewayOrderId: created.id, keyId, amount: order.totals.total, currency: 'INR' },
    };
  } catch (error) {
    return {
      ok: false,
      code: 'gateway_error',
      message: error instanceof Error ? error.message : 'Razorpay rejected the request.',
    };
  }
}

/**
 * The minimum of Razorpay's SDK surface that we use, declared structurally so
 * `tsc` does not need the optional package to be installed.
 */
interface RazorpayConstructor {
  new (options: { key_id: string; key_secret: string }): {
    orders: {
      create(options: {
        amount: number;
        currency: string;
        receipt: string;
        notes?: Record<string, string>;
      }): Promise<{ id: string }>;
    };
  };
}

// ---------------------------------------------------------------------------
// Verifying a payment
// ---------------------------------------------------------------------------

export interface PaymentCallback {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export type VerifyResult =
  | { ok: true; paymentId: string }
  | { ok: false; reason: 'not_configured' | 'invalid_signature' };

/**
 * Verify the callback the browser hands back after checkout.
 *
 * Razorpay signs `<order_id>|<payment_id>` with the key secret. Recomputing that
 * HMAC is the only thing that makes a payment believable — the `razorpay_payment_id`
 * in the callback is not proof of anything on its own, because anyone can invent
 * a string. This is why an order is never marked paid from a client assertion.
 */
export function verifyPaymentSignature(callback: PaymentCallback): VerifyResult {
  const { razorpay } = serverEnv();
  if (!razorpay.keySecret) return { ok: false, reason: 'not_configured' };

  const expected = createHmac('sha256', razorpay.keySecret)
    .update(`${callback.razorpayOrderId}|${callback.razorpayPaymentId}`)
    .digest('hex');

  if (!safeEqualHex(expected, callback.razorpaySignature)) return { ok: false, reason: 'invalid_signature' };
  return { ok: true, paymentId: callback.razorpayPaymentId };
}

/**
 * Verify a webhook body against RAZORPAY_WEBHOOK_SECRET.
 *
 * Webhooks matter because the browser callback can be lost — the shopper closes
 * the tab after paying. The webhook is the authoritative path, so it gets its own
 * secret and its own verification.
 *
 * Pass the *raw* request body. Parsing and re-stringifying JSON changes bytes and
 * breaks the signature.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const { razorpay } = serverEnv();
  if (!razorpay.webhookSecret) return false;
  const expected = createHmac('sha256', razorpay.webhookSecret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}

function safeEqualHex(expected: string, provided: string): boolean {
  if (typeof provided !== 'string' || expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(provided, 'utf8'));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

export type RefundResult =
  | { ok: true; refundId: string }
  | { ok: false; code: 'not_configured' | 'not_online' | 'gateway_error'; message: string };

/**
 * Refund a captured payment.
 *
 * Admin-initiated refunds for COD orders are settled outside the gateway, so this
 * refuses rather than pretending. The order status still moves to `refunded` and
 * the audit log records who did it — the money movement is just manual.
 */
export async function refundPayment(order: Order, amount: Paise): Promise<RefundResult> {
  if (order.paymentMethod === 'cod' || !order.razorpayPaymentId) {
    return {
      ok: false,
      code: 'not_online',
      message: 'This order was not paid online, so there is nothing for the gateway to refund. Settle it directly with the customer.',
    };
  }
  if (!isRazorpayConfigured()) {
    return { ok: false, code: 'not_configured', message: 'Razorpay credentials are not set.' };
  }

  const { razorpay } = serverEnv();
  if (!razorpay.keyId || !razorpay.keySecret) {
    return { ok: false, code: 'not_configured', message: 'Razorpay credentials are incomplete.' };
  }

  try {
    const mod = (await import('razorpay')) as unknown as {
      default: new (o: { key_id: string; key_secret: string }) => {
        payments: { refund(paymentId: string, options: { amount: number }): Promise<{ id: string }> };
      };
    };
    const client = new mod.default({ key_id: razorpay.keyId, key_secret: razorpay.keySecret });
    const refund = await client.payments.refund(order.razorpayPaymentId, { amount });
    return { ok: true, refundId: refund.id };
  } catch (error) {
    return {
      ok: false,
      code: 'gateway_error',
      message: error instanceof Error ? error.message : 'Razorpay rejected the refund.',
    };
  }
}

// ---------------------------------------------------------------------------
// Readiness, for the admin Settings screen
// ---------------------------------------------------------------------------

export interface PaymentReadiness {
  onlineEnabled: boolean;
  webhookConfigured: boolean;
  /** True while the keys are Razorpay test keys, so the admin is never unsure. */
  isTestMode: boolean;
  requirements: string[];
}

export function paymentReadiness(): PaymentReadiness {
  const { razorpay } = serverEnv();
  const requirements: string[] = [];
  if (!razorpay.keyId) requirements.push('RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID');
  if (!razorpay.keySecret) requirements.push('RAZORPAY_KEY_SECRET');
  if (!razorpay.webhookSecret) {
    requirements.push('RAZORPAY_WEBHOOK_SECRET (needed so a payment still confirms if the shopper closes the tab)');
  }
  return {
    onlineEnabled: isRazorpayConfigured(),
    webhookConfigured: Boolean(razorpay.webhookSecret),
    isTestMode: razorpay.keyId?.startsWith('rzp_test') ?? false,
    requirements,
  };
}
