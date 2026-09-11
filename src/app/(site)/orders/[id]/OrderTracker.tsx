'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Package,
  Truck,
  MapPin,
  CreditCard,
  XCircle,
  RotateCcw,
  Clock,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

import Image from 'next/image';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/button-styles';
import { Photo } from '@/components/ui/Photo';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, formatMoney, formatPhone } from '@/lib/format';
import { ORDER_STATUS_DETAIL, ORDER_STATUS_LABEL } from '@/lib/domain/orders';
import { isKnownPhoto, normalizePhotoKey, resolveImageUrl } from '@/lib/photos';
import { PeacockSignature } from '@/components/peacock';
import type { Order, OrderStatus, PaymentMethod } from '@/lib/data/types';

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: 'Cash on Delivery',
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net Banking',
};

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: 'neutral',
  payment_confirmed: 'info',
  processing: 'info',
  packed: 'info',
  shipped: 'gold',
  out_for_delivery: 'gold',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'danger',
  refunded: 'neutral',
};

const TERMINAL_OFF_PATH: OrderStatus[] = ['cancelled', 'returned', 'refunded'];

const AMAZON_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'payment_confirmed', label: 'Ordered', icon: CheckCircle2 },
  { status: 'packed', label: 'Packed', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
  { status: 'delivered', label: 'Delivered', icon: Sparkles },
];

export function OrderTracker({ order: initialOrder }: { order: Order }) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [copied, setCopied] = useState(false);

  // Amazon-like Live Auto-Progression Polling:
  // Automatically check the order status every 6 seconds if not delivered/cancelled
  useEffect(() => {
    if (order.status === 'delivered' || TERMINAL_OFF_PATH.includes(order.status)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.orderNumber || order.id}`);
        if (res.ok) {
          const updated = await res.json();
          if (updated && updated.id) {
            setOrder(updated);
          }
        }
      } catch (err) {
        // Silently keep current state on network flicker
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [order.status, order.orderNumber, order.id]);

  const offPath = TERMINAL_OFF_PATH.includes(order.status);
  const isCod = order.paymentMethod === 'cod';

  const copyTracking = () => {
    if (!order.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine current Amazon step index
  const getStepIndex = (status: OrderStatus) => {
    if (status === 'pending') return 0;
    if (status === 'payment_confirmed') return 0;
    if (status === 'processing') return 0.5;
    if (status === 'packed') return 1;
    if (status === 'shipped') return 2;
    if (status === 'out_for_delivery') return 3;
    if (status === 'delivered') return 4;
    return 0;
  };

  const currentStep = getStepIndex(order.status);

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------- header */}
      <header className="text-center">
        {offPath ? (
          <XCircle className="mx-auto mb-4 h-11 w-11 text-danger" aria-hidden="true" />
        ) : order.status === 'delivered' ? (
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success" aria-hidden="true" />
        ) : (
          <div className="relative mx-auto mb-4 h-12 w-12 flex items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-gold/20 opacity-75"></span>
            <Truck className="h-10 w-10 text-gold" aria-hidden="true" />
          </div>
        )}

        <h1 className="text-display-lg text-charcoal font-display">
          {offPath
            ? ORDER_STATUS_LABEL[order.status]
            : order.status === 'delivered'
            ? 'Delivered with Blessings'
            : 'Your Ritual is on its Way'}
        </h1>

        <p className="mt-2 text-lede text-brown-soft">{ORDER_STATUS_DETAIL[order.status]}</p>

        <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span className="text-xs tracking-[0.12em] text-brown-muted uppercase">Order</span>
          <span className="tabular text-sm font-semibold text-charcoal">{order.orderNumber}</span>
          <Badge tone={STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
        </div>

        <p className="mt-2 text-xs text-brown-muted">
          Placed {formatDateTime(order.createdAt)} · Confirmation sent to {order.email}
        </p>
      </header>

      {/* ------------------------------------------------- Amazon-style Visual Tracker Bar */}
      {!offPath && (
        <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-brown-muted font-medium">Estimated Delivery</span>
              <p className="text-lg font-bold text-charcoal">
                {order.status === 'delivered'
                  ? 'Delivered'
                  : order.status === 'out_for_delivery'
                  ? 'Arriving Today'
                  : formatDate(order.estimatedDelivery)}
              </p>
            </div>
            {order.courier && order.trackingNumber && (
              <div className="flex items-center gap-2 bg-sand-soft/50 rounded-lg px-3 py-1.5 border border-sand-deep/40">
                <Truck className="h-4 w-4 text-gold-deep" />
                <span className="text-xs text-brown font-medium">{order.courier}:</span>
                <span className="text-xs font-mono font-bold text-charcoal">{order.trackingNumber}</span>
                <button
                  onClick={copyTracking}
                  title="Copy Tracking ID"
                  className="ml-1 text-brown-muted hover:text-gold transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Stepper Bar */}
          <div className="relative my-4 px-2 sm:px-6">
            <div className="absolute top-5 left-8 right-8 h-1.5 bg-sand-deep/30 rounded-full z-0">
              <div
                className="h-full bg-success transition-all duration-700 ease-out rounded-full"
                style={{ width: `${Math.min(100, (Math.floor(currentStep) / 4) * 100)}%` }}
              />
            </div>

            <div className="relative z-10 flex justify-between items-start">
              {AMAZON_STEPS.map((step, idx) => {
                const isPassed = currentStep >= idx;
                const isCurrent = Math.floor(currentStep) === idx && order.status !== 'delivered';
                const Icon = step.icon;

                return (
                  <div key={step.status} className="flex flex-col items-center text-center max-w-[80px]">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2',
                        isPassed
                          ? 'bg-success text-white border-success'
                          : 'bg-white text-sand-deep border-sand-deep',
                        isCurrent && 'ring-4 ring-gold/30 bg-gold text-white border-gold animate-bounce'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium',
                        isPassed ? 'text-charcoal' : 'text-brown-muted',
                        isCurrent && 'font-bold text-gold-deep'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- timeline */}
      <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gold" />
          Fulfillment Updates
        </h2>
        {offPath ? <EventLog order={order} /> : <StepTimeline order={order} />}
      </div>

      {/* -------------------------------------------------------------- items */}
      <section aria-labelledby="order-items" className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <h2 id="order-items" className="text-lg font-bold text-charcoal mb-4">
          What&rsquo;s in this order ({order.items.length} items)
        </h2>

        <ul className="divide-y divide-sand-deep/40">
          {order.items.map((item) => {
            const photoKey = item.image ? normalizePhotoKey(item.image) : '';
            const hasPhoto = isKnownPhoto(photoKey);

            return (
              <li key={`${item.productId}_${item.variantId ?? 'default'}`} className="flex gap-4 py-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-sand-deep/50 bg-sand-soft">
                  {hasPhoto ? (
                    <Photo name={photoKey} sizes="64px" className="h-full w-full object-cover" />
                  ) : item.image ? (
                    <Image
                      src={resolveImageUrl(item.image)}
                      alt={item.name}
                      width={64}
                      height={64}
                      sizes="64px"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <Package className="h-5 w-5 text-gold" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-sm font-medium text-charcoal transition-colors hover:text-gold"
                    >
                      {item.name}
                    </Link>
                    {item.variantLabel && (
                      <p className="mt-0.5 text-[11px] text-brown-muted">{item.variantLabel}</p>
                    )}
                    <p className="mt-1 text-xs tabular text-brown-soft">
                      {formatMoney(item.unitPrice)} × {item.qty}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular text-charcoal">
                    {formatMoney(item.lineTotal)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------- totals + addresses */}
      <div className="grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="order-totals" className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <h2 id="order-totals" className="mb-4 text-xs tracking-[0.12em] text-brown-muted uppercase font-semibold">
            Payment Summary
          </h2>

          <dl className="space-y-2 text-sm">
            <TotalRow label="Subtotal" value={formatMoney(order.totals.subtotal)} />
            {order.totals.productDiscount > 0 && (
              <TotalRow
                label="Product savings"
                value={`− ${formatMoney(order.totals.productDiscount)}`}
                tone="success"
              />
            )}
            {order.totals.couponDiscount > 0 && (
              <TotalRow
                label={`Coupon ${order.totals.couponCode ?? ''}`.trim()}
                value={`− ${formatMoney(order.totals.couponDiscount)}`}
                tone="success"
              />
            )}
            <TotalRow
              label="Delivery"
              value={order.totals.shipping === 0 ? 'Free' : formatMoney(order.totals.shipping)}
              tone={order.totals.shipping === 0 ? 'success' : undefined}
            />
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-sand-deep/60 pt-3">
            <span className="text-base font-bold text-charcoal">Total Amount</span>
            <span className="text-xl font-bold text-brown tabular font-display">
              {formatMoney(order.totals.total)}
            </span>
          </div>

          <div className="mt-3 text-xs text-brown-muted flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-gold" />
            <span>Method: {PAYMENT_LABEL[order.paymentMethod]}</span>
            <span className="text-gray-300">·</span>
            <span className="capitalize">{order.paymentStatus}</span>
          </div>
        </section>

        <section aria-labelledby="shipping-dest" className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <h2 id="shipping-dest" className="mb-4 text-xs tracking-[0.12em] text-brown-muted uppercase font-semibold">
            Delivery Destination
          </h2>

          <div className="space-y-1 text-sm text-brown">
            <p className="font-semibold text-charcoal">{order.shippingAddress.fullName}</p>
            <p className="text-xs text-brown-muted">{formatPhone(order.shippingAddress.phone)}</p>
            <p className="pt-2">{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            {order.shippingAddress.landmark && (
              <p className="text-xs text-brown-muted">Near: {order.shippingAddress.landmark}</p>
            )}
            <p className="font-medium text-charcoal">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
            </p>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------------ actions */}
      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-sand pt-6">
        <Link href="/shop" className={buttonClasses({ variant: 'primary', size: 'md' })}>
          Continue Shopping
        </Link>
        <Link href="/contact" className={buttonClasses({ variant: 'secondary', size: 'md' })}>
          Need help with this order?
        </Link>
      </div>

      {/* Authentic ritual blessing seal */}
      <div className="pt-10 pb-2 flex flex-col items-center justify-center text-center">
        <PeacockSignature
          variant="henna-on-light"
          layout="vertical"
          size={120}
          className="opacity-80 hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success';
}) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-brown-muted">{label}</dt>
      <dd className={cn('tabular', tone === 'success' ? 'text-success font-medium' : 'text-brown')}>
        {value}
      </dd>
    </div>
  );
}

function StepTimeline({ order }: { order: Order }) {
  const events = [...order.timeline].reverse();

  return (
    <ol className="relative border-l border-sand-deep/60 ml-3 space-y-6 py-2">
      {events.map((event, idx) => {
        const isLatest = idx === 0;

        return (
          <li key={`${event.status}_${event.at}`} className="ml-6">
            <span
              className={cn(
                'absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white',
                isLatest ? 'bg-success text-white' : 'bg-sand text-brown-soft'
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className={cn('text-sm font-semibold', isLatest ? 'text-charcoal' : 'text-brown')}>
                {ORDER_STATUS_LABEL[event.status]}
              </h3>
              <time className="text-xs text-brown-muted tabular">
                {formatDateTime(event.at)}
              </time>
            </div>
            <p className="mt-1 text-xs text-brown-soft leading-relaxed">{event.note}</p>
          </li>
        );
      })}
    </ol>
  );
}

function EventLog({ order }: { order: Order }) {
  return (
    <ol className="relative border-l border-sand-deep/60 ml-3 space-y-6 py-2">
      {order.timeline.map((event) => (
        <li key={`${event.status}_${event.at}`} className="ml-6">
          <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white ring-4 ring-white">
            <RotateCcw className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold text-charcoal">{ORDER_STATUS_LABEL[event.status]}</h3>
          <time className="text-xs text-brown-muted">{formatDateTime(event.at)}</time>
          <p className="mt-1 text-xs text-brown-soft">{event.note}</p>
        </li>
      ))}
    </ol>
  );
}
