/**
 * Order confirmation and tracking (§26, §64).
 *
 * A server component on purpose: nothing here is interactive, so the whole
 * screen costs no client JavaScript (§48).
 *
 * Two honesty rules shape this file:
 *
 *  - The timeline shows only what the order record actually contains. Steps that
 *    have not happened are rendered grey and undated, never given a guessed date.
 *  - The delivery estimate is labelled an estimate, and the courier row appears
 *    only when a tracking number exists. We do not claim live tracking we have
 *    not been given (§64).
 */
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
} from 'lucide-react';

import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/button-styles';
import { Photo } from '@/components/ui/Photo';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, formatMoney, formatPhone } from '@/lib/format';
import { ORDER_STATUS_DETAIL, ORDER_STATUS_LABEL } from '@/lib/domain/orders';
import { isKnownPhoto } from '@/lib/photos';
import { ORDER_TIMELINE, type Order, type OrderStatus, type PaymentMethod } from '@/lib/data/types';

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

/** Statuses that leave the happy path — the step timeline no longer applies. */
const TERMINAL_OFF_PATH: OrderStatus[] = ['cancelled', 'returned', 'refunded'];

export function OrderTracker({ order }: { order: Order }) {
  const offPath = TERMINAL_OFF_PATH.includes(order.status);
  const isCod = order.paymentMethod === 'cod';

  return (
    <div className="space-y-10">
      {/* ------------------------------------------------------------- header */}
      <header className="text-center">
        {offPath ? (
          <XCircle className="mx-auto mb-4 h-11 w-11 text-danger" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mx-auto mb-4 h-11 w-11 text-success" aria-hidden="true" />
        )}

        <h1 className="text-display-lg">
          {offPath ? ORDER_STATUS_LABEL[order.status] : 'Your Ritual Begins Here'}
        </h1>

        <p className="mt-3 text-lede text-brown-soft">{ORDER_STATUS_DETAIL[order.status]}</p>

        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span className="text-xs tracking-[0.12em] text-brown-muted uppercase">Order</span>
          <span className="tabular text-sm font-medium text-brown">{order.orderNumber}</span>
          <Badge tone={STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
        </div>

        <p className="mt-2 text-xs text-brown-muted">
          Placed {formatDateTime(order.createdAt)} · Confirmation sent to {order.email}
        </p>
      </header>

      {/* ----------------------------------------------------------- timeline */}
      {offPath ? (
        <EventLog order={order} />
      ) : (
        <StepTimeline order={order} />
      )}

      {/* ------------------------------------------------------- delivery est */}
      {!offPath && order.status !== 'delivered' && (
        <div className="rounded-lg border border-sand-deep bg-sand-soft/30 p-5">
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-brown">
                Estimated delivery {formatDate(order.estimatedDelivery)}
              </p>
              {order.trackingNumber ? (
                <p className="mt-1 text-xs text-brown-soft">
                  {order.courier ? `${order.courier} · ` : ''}
                  Tracking <span className="tabular font-medium text-brown">{order.trackingNumber}</span>
                </p>
              ) : (
                <p className="mt-1 text-xs text-brown-muted">
                  A tracking number will appear here once the courier collects your parcel.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------- items */}
      <section aria-labelledby="order-items">
        <h2 id="order-items" className="text-display-sm mb-4">
          What&rsquo;s in this order
        </h2>

        <ul className="divide-y divide-sand-deep/60 border-y border-sand-deep/60">
          {order.items.map((item) => {
            const photoKey = item.image?.replace(/^\/images\//, '').replace(/\.webp$/, '') ?? '';
            const hasPhoto = isKnownPhoto(photoKey);

            return (
              <li key={`${item.productId}_${item.variantId ?? 'default'}`} className="flex gap-4 py-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-sand-deep/50 bg-sand-soft">
                  {hasPhoto ? (
                    <Photo name={photoKey} sizes="64px" className="h-full w-full object-cover" />
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
                      className="text-sm font-medium text-brown transition-colors hover:text-gold-deep"
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
                  <span className="shrink-0 text-sm font-medium tabular text-brown">
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
        <section aria-labelledby="order-totals" className="rounded-lg border border-sand-deep p-5">
          <h2 id="order-totals" className="mb-4 text-xs tracking-[0.12em] text-brown-muted uppercase">
            Payment
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
            <span className="text-sm font-medium text-brown">Total</span>
            <span className="text-display-sm tabular">{formatMoney(order.totals.total)}</span>
          </div>

          <div className="mt-4 flex items-start gap-2 border-t border-sand-deep/60 pt-3">
            <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brown-muted" aria-hidden="true" />
            <div className="text-xs">
              <p className="text-brown">{PAYMENT_LABEL[order.paymentMethod]}</p>
              <p className="mt-0.5 text-brown-muted">
                {isCod
                  ? `Please have ${formatMoney(order.totals.total)} ready for the delivery agent.`
                  : order.paymentStatus === 'paid'
                    ? 'Payment received.'
                    : 'Payment not yet confirmed.'}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="order-address" className="rounded-lg border border-sand-deep p-5">
          <h2 id="order-address" className="mb-4 text-xs tracking-[0.12em] text-brown-muted uppercase">
            Delivering to
          </h2>

          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brown-muted" aria-hidden="true" />
            <address className="text-sm not-italic leading-relaxed text-brown-soft">
              <span className="block font-medium text-brown">{order.shippingAddress.fullName}</span>
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}
              {order.shippingAddress.landmark && (
                <span className="block text-brown-muted">Near {order.shippingAddress.landmark}</span>
              )}
              <span className="block">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              </span>
              <span className="mt-1 block tabular text-xs text-brown-muted">
                {formatPhone(order.shippingAddress.phone)}
              </span>
            </address>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------------ actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-sand-deep/60 pt-8">
        <Link href="/shop" className={buttonClasses({ variant: 'primary', size: 'md' })}>
          Continue shopping
        </Link>
        <Link href="/contact" className={buttonClasses({ variant: 'secondary', size: 'md' })}>
          Need help with this order?
        </Link>
      </div>
    </div>
  );
}

/**
 * The happy-path step rail.
 *
 * `reachedAt` is looked up from the order's own timeline, so a step shows a date
 * only if it genuinely happened. Steps ahead of the current one carry no date at
 * all rather than a projection.
 */
function StepTimeline({ order }: { order: Order }) {
  const currentIndex = ORDER_TIMELINE.indexOf(order.status);

  return (
    <section aria-label="Order progress">
      <ol className="space-y-0">
        {ORDER_TIMELINE.map((status, index) => {
          const event = order.timeline.find((e) => e.status === status);
          const done = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === ORDER_TIMELINE.length - 1;

          return (
            <li key={status} className="flex gap-4">
              {/* Rail */}
              <div className="flex flex-col items-center">
                {done ? (
                  <CheckCircle2
                    className={cn('h-5 w-5 shrink-0', isCurrent ? 'text-gold-deep' : 'text-success')}
                    aria-hidden="true"
                  />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-sand-deep" aria-hidden="true" />
                )}
                {!isLast && (
                  <span
                    className={cn('w-px flex-1', index < currentIndex ? 'bg-success/40' : 'bg-sand-deep')}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Copy */}
              <div className={cn('pb-6', isLast && 'pb-0')}>
                <p
                  className={cn(
                    'text-sm',
                    isCurrent && 'font-medium text-brown',
                    done && !isCurrent && 'text-brown-soft',
                    !done && 'text-brown-muted',
                  )}
                >
                  {ORDER_STATUS_LABEL[status]}
                </p>

                {event ? (
                  <>
                    <p className="mt-0.5 text-xs text-brown-soft">{event.note}</p>
                    <p className="mt-0.5 text-[11px] tabular text-brown-muted">
                      {formatDateTime(event.at)}
                    </p>
                  </>
                ) : (
                  isCurrent && (
                    <p className="mt-0.5 text-xs text-brown-soft">{ORDER_STATUS_DETAIL[status]}</p>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** For cancelled, returned and refunded orders: just the record, in order. */
function EventLog({ order }: { order: Order }) {
  return (
    <section aria-label="Order history">
      <ol className="space-y-0">
        {order.timeline.map((event, index) => {
          const isLast = index === order.timeline.length - 1;

          return (
            <li key={`${event.status}_${event.at}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                {TERMINAL_OFF_PATH.includes(event.status) ? (
                  <RotateCcw className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brown-muted" aria-hidden="true" />
                )}
                {!isLast && <span className="w-px flex-1 bg-sand-deep" aria-hidden="true" />}
              </div>

              <div className={cn('pb-6', isLast && 'pb-0')}>
                <p className="text-sm text-brown">{ORDER_STATUS_LABEL[event.status]}</p>
                <p className="mt-0.5 text-xs text-brown-soft">{event.note}</p>
                <p className="mt-0.5 text-[11px] tabular text-brown-muted">{formatDateTime(event.at)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TotalRow({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-brown-soft">{label}</dt>
      <dd className={tone === 'success' ? 'tabular text-success' : 'tabular text-brown'}>{value}</dd>
    </div>
  );
}
