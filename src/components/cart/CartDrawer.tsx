'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Tag, X, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useCartStore } from './cart-store';
import { Sheet } from '@/components/ui/Sheet';
import { Photo } from '@/components/ui/Photo';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { EmptyCart } from '@/components/ui/EmptyState';
import { buttonClasses } from '@/components/ui/button-styles';
import { formatMoney } from '@/lib/format';
import { isKnownPhoto, normalizePhotoKey, resolveImageUrl } from '@/lib/photos';
import { PeacockSignature } from '@/components/peacock';

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
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
  const [showCouponInput, setShowCouponInput] = useState(false);

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);

  const totals = pricedCart?.totals;
  const freeShippingThreshold = totals?.freeShippingThreshold ?? 49900;
  const subtotal = totals?.subtotal ?? 0;
  const freeShippingGap = totals?.freeShippingGap ?? Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <Sheet
      open={isOpen}
      onClose={closeCart}
      side="right"
      title="Your Ritual Box"
      description={`${totalCount} ${totalCount === 1 ? 'item' : 'items'} in your cart`}
      className="max-w-md w-full"
      footer={
        hasHydrated && items.length > 0 && totals ? (
          <div className="space-y-4 pt-2">
            {/* Coupon Accordion / Badge */}
            {couponCode ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gold-wash border border-gold-deep/20 text-xs">
                <div className="flex items-center gap-2 text-brown">
                  <Tag className="w-3.5 h-3.5 text-gold-deep" />
                  <span className="font-medium tracking-wide">CODE: {couponCode}</span>
                  {totals.couponDiscount > 0 && (
                    <span className="text-success font-medium">
                      (-{formatMoney(totals.couponDiscount)})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void removeCoupon()}
                  className="p-1 text-brown-muted hover:text-brown transition-colors"
                  aria-label="Remove coupon"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div>
                {!showCouponInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCouponInput(true)}
                    className="flex items-center gap-1.5 text-xs text-gold-deep hover:underline font-medium"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Have a promo coupon code?
                  </button>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputCoupon}
                        onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                        placeholder="e.g. FIRST10, PUJA100"
                        className="flex-1 px-3 py-1.5 text-xs rounded-md border border-sand-deep bg-ivory focus:outline-none focus:ring-1 focus:ring-gold-deep uppercase"
                      />
                      <button
                        type="submit"
                        disabled={isApplyingCoupon || !inputCoupon.trim()}
                        className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                      >
                        {isApplyingCoupon ? 'Applying...' : 'Apply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCouponInput(false);
                          setCouponError(null);
                        }}
                        className="p-1 text-brown-muted hover:text-brown"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-danger">{couponError}</p>}
                  </form>
                )}
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-1.5 text-xs text-brown-soft border-t border-sand-deep/60 pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular font-medium text-brown">{formatMoney(totals.subtotal)}</span>
              </div>
              {totals.productDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Product Savings</span>
                  <span className="tabular font-medium">-{formatMoney(totals.productDiscount)}</span>
                </div>
              )}
              {totals.couponDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Coupon Discount</span>
                  <span className="tabular font-medium">-{formatMoney(totals.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="tabular font-medium">
                  {totals.shipping === 0 ? (
                    <span className="text-success font-medium">FREE</span>
                  ) : (
                    formatMoney(totals.shipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-display font-medium text-brown pt-2 border-t border-sand-deep/60">
                <span>Total</span>
                <span className="tabular font-bold text-brown">{formatMoney(totals.total)}</span>
              </div>
            </div>

            {/* Checkout action */}
            <div className="space-y-2 pt-1">
              <Link
                href="/checkout"
                onClick={closeCart}
                className={buttonClasses({
                  variant: 'primary',
                  size: 'lg',
                  fullWidth: true,
                })}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-brown-muted text-center">
                <span>🔒 Secure 256-bit Checkout • Pan-India Delivery</span>
              </div>

              <div className="pt-2 flex justify-center opacity-85">
                <PeacockSignature
                  variant="henna-on-light"
                  layout="horizontal"
                  size={120}
                  showTagline={false}
                />
              </div>
            </div>
          </div>
        ) : null
      }
    >
      {!hasHydrated ? (
        <div className="p-8 text-center text-brown-muted text-sm animate-pulse">
          Loading ritual box...
        </div>
      ) : items.length === 0 ? (
        <div className="py-8">
          <EmptyCart />
          <div className="mt-6 text-center">
            <Link
              href="/kits"
              onClick={closeCart}
              className={buttonClasses({ variant: 'primary', size: 'md' })}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Explore Puja Kits
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Free shipping banner */}
          <div className="p-3 rounded-lg bg-sand-soft/80 border border-sand-deep/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-brown">
              {freeShippingGap > 0 ? (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-deep" />
                  <span>
                    Add <strong className="text-gold-deep">{formatMoney(freeShippingGap)}</strong> for FREE DELIVERY
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-success">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>You have unlocked FREE Delivery!</span>
                </div>
              )}
              <span className="text-[11px] tabular text-brown-muted">{progressPercent}%</span>
            </div>
            {/* Progress Track */}
            <div className="h-1.5 w-full bg-sand-deep/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-gold-deep transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart item lines */}
          <div className="divide-y divide-sand-deep/60">
            {pricedCart?.lines.map((line) => {
              const photoKey = line.image?.url ? normalizePhotoKey(line.image.url) : '';
              const hasPhoto = isKnownPhoto(photoKey);

              return (
                <div key={`${line.productId}_${line.variantId ?? 'default'}`} className="py-4 flex gap-3.5 first:pt-0">
                  {/* Item Image */}
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-sand-soft shrink-0 border border-sand-deep/50">
                    {hasPhoto ? (
                      <Photo name={photoKey} sizes="64px" className="object-cover w-full h-full" />
                    ) : line.image?.url ? (
                      <Image
                        src={resolveImageUrl(line.image.url)}
                        alt={line.image.alt || line.name}
                        width={line.image.width || 200}
                        height={line.image.height || 200}
                        sizes="64px"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-brown-muted">
                        <ShoppingBag className="w-5 h-5 text-gold" />
                      </div>
                    )}
                  </div>

                  {/* Line Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${line.slug}`}
                          onClick={closeCart}
                          className="text-xs font-medium text-brown hover:text-gold-deep transition-colors line-clamp-1"
                        >
                          {line.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => void removeItem(line.productId, line.variantId)}
                          className="p-1 text-brown-muted hover:text-danger transition-colors shrink-0"
                          aria-label={`Remove ${line.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {line.variantLabel && (
                        <p className="text-[11px] text-brown-muted">{line.variantLabel}</p>
                      )}

                      {!line.inStock && (
                        <p className="text-[11px] text-danger flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          Out of stock
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <QtyStepper
                        value={line.qty}
                        min={1}
                        max={Math.min(20, line.availableStock || 20)}
                        size="sm"
                        disabled={!line.inStock || isSyncing}
                        onChange={(newQty) => void updateQty(line.productId, line.variantId, newQty)}
                        itemLabel={line.name}
                      />

                      <div className="text-right">
                        <span className="text-xs font-medium tabular text-brown">
                          {formatMoney(line.lineTotal)}
                        </span>
                        {line.unitMrp > line.unitPrice && (
                          <span className="block text-[10px] tabular text-brown-muted line-through">
                            {formatMoney(line.unitMrp * line.qty)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Sheet>
  );

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError(null);
    if (!inputCoupon.trim()) return;

    setIsApplyingCoupon(true);
    const result = await applyCoupon(inputCoupon);
    setIsApplyingCoupon(false);

    if (result.valid) {
      setInputCoupon('');
      setShowCouponInput(false);
    } else {
      setCouponError(result.message ?? 'Invalid coupon code');
    }
  }
}