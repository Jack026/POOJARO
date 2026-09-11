'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PaginationProps {
  current: number;
  total: number;
}

export function Pagination({ current, total }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function href(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const pages: (number | 'ellipsis')[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis');
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-12" aria-label="Pagination">
      <Link
        href={href(current - 1)}
        aria-label="Previous page"
        aria-disabled={current === 1}
        className={cn(
          'p-2 rounded-lg border border-sand-deep hover:border-brown transition-colors',
          current === 1 && 'pointer-events-none opacity-40',
        )}
      >
        <ChevronLeft className="w-4 h-4 text-brown" />
      </Link>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-brown-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-label={`Page ${p}`}
            aria-current={p === current ? 'page' : undefined}
            className={cn(
              'min-w-[36px] h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors border',
              p === current
                ? 'bg-brown text-ivory border-brown'
                : 'text-brown border-sand-deep hover:border-brown',
            )}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={href(current + 1)}
        aria-label="Next page"
        aria-disabled={current === total}
        className={cn(
          'p-2 rounded-lg border border-sand-deep hover:border-brown transition-colors',
          current === total && 'pointer-events-none opacity-40',
        )}
      >
        <ChevronRight className="w-4 h-4 text-brown" />
      </Link>
    </nav>
  );
}
