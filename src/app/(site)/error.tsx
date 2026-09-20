'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { NetworkError } from '@/components/ui/EmptyState';
import { buttonClasses } from '@/components/ui/button-styles';

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[POOJARO Site] Render error:', error);
  }, [error]);

  return (
    <div className="container-page py-16 sm:py-24">
      <NetworkError onRetry={reset} />
      <div className="mt-4 flex justify-center gap-3">
        <Link href="/shop" className={buttonClasses({ variant: 'secondary' })}>
          Explore Puja Kits
        </Link>
        <Link href="/" className={buttonClasses({ variant: 'ghost' })}>
          Return Home
        </Link>
      </div>
    </div>
  );
}
