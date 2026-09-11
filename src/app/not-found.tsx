import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  return (
    <main id="main" className="container-page py-16 sm:py-24">
      <EmptyState icon={<Compass size={22} aria-hidden="true" />} title="This page is not part of the ritual." body="It may have moved, or the link may no longer be available." action={{ href: '/shop', label: 'Browse puja essentials' }} />
    </main>
  );
}
