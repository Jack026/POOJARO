/**
 * Star rating (§31).
 *
 * Renders the exact average as partial stars via a clipped overlay, so 4.3 looks
 * like 4.3 rather than being rounded to 4 or 4.5. A product with no reviews
 * renders nothing at all — five empty stars read as "rated zero", which is a
 * claim we have no basis for (§23).
 */
import { cn } from '@/lib/cn';

const SIZES = {
  sm: { star: 12, gap: 3, text: 'text-[0.6875rem]' },
  md: { star: 15, gap: 4, text: 'text-xs' },
  lg: { star: 20, gap: 5, text: 'text-sm' },
} as const;

const STARS = [0, 1, 2, 3, 4];

export interface RatingProps {
  value: number;
  count?: number;
  size?: keyof typeof SIZES;
  /** Show "4.3 (24)" beside the stars. */
  showCount?: boolean;
  className?: string;
}

export function Rating({ value, count, size = 'md', showCount = true, className }: RatingProps) {
  if (count !== undefined && count <= 0) return null;

  const { star, gap, text } = SIZES[size];
  const clamped = Math.max(0, Math.min(5, value));

  // Measured in pixels rather than as a percentage of the row: a percentage
  // would spread the fill across the gaps too, and 4.3 would render as ~4.45.
  const whole = Math.floor(clamped);
  const fillWidth = whole * (star + gap) + (clamped - whole) * star;

  const label =
    count === undefined
      ? `Rated ${clamped.toFixed(1)} out of 5`
      : `Rated ${clamped.toFixed(1)} out of 5 from ${count} ${count === 1 ? 'review' : 'reviews'}`;

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative inline-flex" style={{ gap }} role="img" aria-label={label}>
        {STARS.map((i) => (
          <Star key={i} size={star} className="text-sand-deep" />
        ))}
        <span
          className="pointer-events-none absolute inset-y-0 left-0 inline-flex overflow-hidden"
          style={{ width: fillWidth, gap }}
          aria-hidden="true"
        >
          {STARS.map((i) => (
            <Star key={i} size={star} className="shrink-0 text-gold" />
          ))}
        </span>
      </span>

      {showCount && count !== undefined && (
        <span className={cn('tabular text-brown-muted', text)} aria-hidden="true">
          {clamped.toFixed(1)} ({count})
        </span>
      )}
    </span>
  );
}

function Star({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.2l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.27 6.1 20.36l1.13-6.57-4.78-4.65 6.6-.96L12 2.2z" />
    </svg>
  );
}
