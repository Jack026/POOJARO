'use client';

import { useEffect } from 'react';
import { NetworkError } from '@/components/ui/EmptyState';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('POOJARO route error'); }, []);
  return <main id="main" className="container-page py-16 sm:py-24"><NetworkError onRetry={reset} /></main>;
}
