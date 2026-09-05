/**
 * Loading placeholders (§43, §44).
 *
 * Skeletons exist to hold the exact shape the real content will take. A skeleton
 * whose proportions differ from the loaded card causes a visible jump, which is
 * worse than no skeleton at all — so `ProductCardSkeleton` mirrors the real card
 * grid, and callers should reach for a purpose-built shape rather than stacking
 * generic bars.
 *
 * The shimmer is pure CSS (see `.skeleton` in globals.css), so it animates
 * before hydration and stops entirely under `prefers-reduced-motion`.
 */
import { cn } from '@/lib/cn';

export interface SkeletonProps extends React.ComponentPropsWithoutRef<'div'> {
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const ROUNDED = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

export function Skeleton({ rounded = 'sm', className, ...rest }: SkeletonProps) {
  return <div className={cn('skeleton', ROUNDED[rounded], className)} aria-hidden="true" {...rest} />;
}

/** A line of text. `width` lets a paragraph end raggedly like real copy does. */
export function SkeletonText({ width = '100%', className }: { width?: string; className?: string }) {
  return <Skeleton className={cn('h-3.5', className)} style={{ width }} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton rounded="lg" className="aspect-4/5 w-full" />
      <SkeletonText width="45%" />
      <SkeletonText width="85%" />
      <SkeletonText width="35%" className="h-5" />
    </div>
  );
}

/**
 * A grid of card skeletons.
 *
 * `aria-busy` plus a polite live region means a screen reader hears "Loading
 * products" once, instead of nothing at all while the page appears to be empty.
 */
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
