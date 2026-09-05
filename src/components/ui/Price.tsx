/**
 * Price display (§14).
 *
 * One component so price, MRP and discount are always laid out and ordered the
 * same way — card, quick view, PDP and cart included. The strike-through MRP is
 * marked up as `<s>` and given a screen-reader label, because "₹1,899" read out
 * with no context after the real price is actively misleading.
 */
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import type { ProductPricing } from '@/lib/domain/product';

const SIZES = {
  sm: { price: 'text-base', mrp: 'text-xs', badge: 'text-[0.625rem]' },
  md: { price: 'text-xl', mrp: 'text-sm', badge: 'text-[0.6875rem]' },
  lg: { price: 'text-display-sm', mrp: 'text-base', badge: 'text-xs' },
} as const;

export interface PriceProps {
  pricing: ProductPricing;
  size?: keyof typeof SIZES;
  /** Hide the "23% OFF" chip where the layout already carries it. */
  showDiscount?: boolean;
  className?: string;
}

export function Price({ pricing, size = 'md', showDiscount = true, className }: PriceProps) {
  const scale = SIZES[size];

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2.5 gap-y-1', className)}>
      {pricing.isRange && (
        <span className="text-xs uppercase tracking-[0.14em] text-brown-muted">from</span>
      )}

      <span className={cn('font-display font-medium tabular text-brown', scale.price)}>
        {formatMoney(pricing.price)}
      </span>

      {pricing.hasDiscount && (
        <>
          <s className={cn('tabular text-brown-muted', scale.mrp)}>
            <span className="sr-only">Was </span>
            {formatMoney(pricing.mrp)}
          </s>
          {showDiscount && (
            <span
              className={cn(
                'rounded-xs bg-success-wash px-1.5 py-0.5 font-medium uppercase tracking-[0.1em] text-success',
                scale.badge,
              )}
            >
              {pricing.discountPercent}% off
            </span>
          )}
        </>
      )}
    </div>
  );
}
