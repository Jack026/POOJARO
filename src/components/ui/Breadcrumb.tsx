/**
 * Breadcrumb trail (§47, §49).
 *
 * Renders an ordered list inside a labelled <nav> so assistive technology can
 * skip it, and marks the final crumb with aria-current="page" rather than
 * styling alone. The last item is intentionally not a link — it is where the
 * reader already is.
 *
 * Emitting matching BreadcrumbList JSON-LD is the page's job, via
 * `breadcrumbSchema()` in lib/seo.ts; this component is presentation only.
 */
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface Crumb {
  label: string;
  /** Omit on the final crumb — the current page is not a link. */
  href?: string;
}

export interface BreadcrumbProps {
  items: ReadonlyArray<Crumb>;
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('text-xs text-brown-muted', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2 rounded"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn(isLast && 'text-brown font-medium')} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}

              {!isLast && <ChevronRight size={12} aria-hidden="true" className="text-sand-deep" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
