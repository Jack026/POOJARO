'use client';

/**
 * Full-page cart (§25, §53).
 *
 * The drawer in CartDrawer is for glancing; this is for editing. Both read the
 * same `pricedCart` the server returned, so a quantity change here and a
 * quantity change there cannot disagree about the total.
 *
 * Nothing on this page computes money. `line.lineTotal` and `totals.*` arrive
 * priced from the catalogue server-side — the client only renders them (§53).
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowLeft, Tag, X, AlertCircle, Trash2, Sparkles } from 'lucide-react';

import { useCartStore } from '@/components/cart/cart-store';
import { Photo } from '@/components/ui/Photo';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { EmptyCart } from '@/components/ui/EmptyState';
import { buttonClasses } from '@/components/ui/button-styles';
import { formatMoney } from '@/lib/format';
import { isKnownPhoto, normalizePhotoKey, resolveImageUrl } from '@/lib/photos';

export function CartPageClient() {
  const {
    items,
    pricedCart,
    couponCode,
    isSyncing,
    hasHydrated,
    updateQty,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!hasHydrated) {
    return (
      <div className="py-24 text-center text-sm text-brown-muted" role="status">
        Loading your ritual box…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12">
        <EmptyCart />
        <div className="mt-8 text-center">
          <Link href="/kits" className={buttonClasses({ variant: 'primary', size: 'md' })}>
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            Explore Puja Kits
          </Link>
        </div>
      </div>
    );
  }

  const totals = pricedCart?.totals;
  const lines = pricedCart?.lines ?? [];
  const freeShippingGap = totals?.freeShippingGap ?? 0;
  const threshold = totals?.freeShippingThreshold ?? 0;
  const progressPercent =
    threshold > 0 ? Math.min(100, Math.round(((totals?.subtotal ?? 0) / threshold) * 100)) : 100;

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError(null);
    if (!inputCoupon.trim()) return;

    setIsApplyingCoupon(true);
    const result = await applyCoupon(inputCoupon);
    setIsApplyingCoupon(false);

    if (!result.valid) {
      setCouponError(result.message ?? 'That code could not be applied to this cart.');
      return;
    }
    setInputCoupon('');
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-12">
      {/* ------------------------------------------------------------- lines */}
      <div>
        {pricedCart && pricedCart.notices.length > 0 && (
          <div className="mb-6 space-y-1.5 rounded-md border border-gold-deep/25 bg-gold-wash p-3.5">
            {pricedCart.notices.map((note, i) => (
              <p key={i} className="flex gap-2 text-xs text-brown">
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-gold-deep" aria-hidden="true" />
                {note}
              </p>
            ))}
          </div>
        )}

        <ul className="divide-y divide-sand-deep/60 border-y border-sand-deep/60">
          {lines.map((line) => {
            const photoKey = line.image?.url ? normalizePhotoKey(line.image.url) : '';
            const hasPhoto = isKnownPhoto(photoKey);

            return (
              <li key={`${line.productId}_${line.variantId ?? 'default'}`} className="flex gap-4 py-5 sm:gap-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-sand-deep/50 bg-sand-soft sm:h-24 sm:w-24">
                  {hasPhoto ? (
                    <Photo name={photoKey} sizes="96px" className="h-full w-full object-cover" />
                  ) : line.image?.url ? (
                    <Image
                      src={resolveImageUrl(line.image.url)}
                      alt={line.image.alt || line.name}
                      width={line.image.width || 200}
                      height={line.image.height || 200}
                      sizes="96px"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <ShoppingBag className="h-5 w-5 text-gold" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${line.slug}`}
                          className="text-sm font-medium text-brown transition-colors hover:text-gold-deep"
                        >
                          {line.name}
                        </Link>
                        {line.variantLabel && (
                          <p className="mt-0.5 text-[11px] text-brown-muted">{line.variantLabel}</p>
                        )}
                        <p className="mt-1 text-xs tabular text-brown-soft">
                          {formatMoney(line.unitPrice)}
                          {line.unitMrp > line.unitPrice && (
                            <span className="ml-1.5 text-brown-muted line-through">
                              {formatMoney(line.unitMrp)}
                            </span>
                          )}
                          <span className="text-brown-muted"> each</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void removeItem(line.productId, line.variantId)}
                        className="shrink-0 p-1 text-brown-muted transition-colors hover:text-danger"
                        aria-label={`Remove ${line.name} from cart`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    {!line.inStock ? (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-danger">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        Out of stock — remove it to continue
                      </p>
                    ) : (
                      line.availableStock <= 5 && (
                        <p className="mt-1.5 text-[11px] text-gold-deep">
                          Only {line.availableStock} left
                        </p>
                      )
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <QtyStepper
                      value={line.qty}
                      min={1}
                      max={Math.min(20, line.availableStock || 20)}
                      size="sm"
                      disabled={!line.inStock || isSyncing}
                      onChange={(next) => void updateQty(line.productId, line.variantId, next)}
                      itemLabel={line.name}
                    />
                    <span className="text-sm font-medium tabular text-brown">
                      {formatMoney(line.lineTotal)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-brown-soft uppercase transition-colors hover:text-brown"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Continue shopping
          </Link>
        </div>
      </div>

      {/* ----------------------------------------------------------- summary */}
      <aside aria-label="Order summary">
        <div className="rounded-lg border border-sand-deep bg-sand-soft/30 p-5 lg:sticky lg:top-28">
          <h2 className="text-display-sm mb-5">Order summary</h2>

          {threshold > 0 && (
            <div className="mb-5 space-y-2 rounded-md border border-sand-deep/50 bg-ivory p-3">
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-brown">
                {freeShippingGap > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-gold-deep" aria-hidden="true" />
                    Add <strong className="text-gold-deep">{formatMoney(freeShippingGap)}</strong> for free delivery
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-success">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Free delivery unlocked
                  </span>
                )}
                <span className="tabular text-[11px] text-brown-muted">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-deep/40">
                <div
                  className="h-full bg-gradient-to-r from-gold to-gold-deep transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <dl className="space-y-2.5 text-sm">
            <Row label="Subtotal" value={formatMoney(totals?.subtotal ?? 0)} />

            {(totals?.productDiscount ?? 0) > 0 && (
              <Row
                label="Product savings"
                value={`− ${formatMoney(totals!.productDiscount)}`}
                tone="success"
              />
            )}

            {couponCode && (totals?.couponDiscount ?? 0) > 0 && (
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-brown-soft">
                  <Tag className="h-3.5 w-3.5 text-gold-deep" aria-hidden="true" />
                  <span className="tracking-wide">{couponCode}</span>
                  <button
                    type="button"
                    onClick={() => void removeCoupon()}
                    className="p-0.5 text-brown-muted transition-colors hover:text-danger"
                    aria-label={`Remove coupon ${couponCode}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </dt>
                <dd className="tabular text-success">− {formatMoney(totals!.couponDiscount)}</dd>
              </div>
            )}

            <Row
              label="Delivery"
              value={totals?.shipping === 0 ? 'Free' : formatMoney(totals?.shipping ?? 0)}
              tone={totals?.shipping === 0 ? 'success' : undefined}
            />
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-sand-deep/60 pt-4">
            <span className="text-sm font-medium text-brown">Total</span>
            <span className="text-display-sm tabular">{formatMoney(totals?.total ?? 0)}</span>
          </div>

          {(totals?.mrpTotal ?? 0) > (totals?.total ?? 0) && (
            <p className="mt-1.5 text-right text-[11px] text-success">
              You save {formatMoney((totals?.mrpTotal ?? 0) - (totals?.total ?? 0))}
            </p>
          )}

          <Link
            href="/checkout"
            className={buttonClasses({ size: 'lg', fullWidth: true, className: 'mt-5' })}
          >
            Proceed to checkout
          </Link>

          {/* Coupon */}
          {!couponCode && (
            <form onSubmit={handleApplyCoupon} className="mt-5 space-y-1.5">
              <label htmlFor="cart-coupon" className="block text-[11px] text-brown-soft">
                Have a coupon code?
              </label>
              <div className="flex gap-2">
                <input
                  id="cart-coupon"
                  type="text"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                  placeholder="e.g. FIRST10"
                  aria-describedby={couponError ? 'cart-coupon-error' : undefined}
                  className="min-w-0 flex-1 rounded-md border border-sand-deep bg-ivory px-3 py-2 text-xs uppercase text-brown placeholder:text-brown-muted/70 focus:border-gold-deep focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isApplyingCoupon || !inputCoupon.trim()}
                  className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                >
                  {isApplyingCoupon ? 'Checking…' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <p id="cart-coupon-error" className="text-[11px] text-danger" role="alert">
                  {couponError}
                </p>
              )}
            </form>
          )}

          <p className="mt-4 text-center text-[11px] text-brown-muted">
            Prices confirmed against live stock at checkout.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success';
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-brown-soft">{label}</dt>
      <dd className={tone === 'success' ? 'tabular text-success' : 'tabular text-brown'}>{value}</dd>
    </div>
  );
}
