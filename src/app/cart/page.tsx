import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CartPageClient } from './CartPageClient';

export const metadata: Metadata = {
  title: 'Your Cart | POOJARO',
};

const CRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Cart' },
];

export default function CartPage() {
  return (
    <main id="main" className="pt-10 pb-16">
      <div className="container-page max-w-4xl">
        <Breadcrumb items={CRUMBS} className="mb-6" />
        <h1 className="font-display text-display-xl text-brown mb-8">Shopping Cart</h1>
        <CartPageClient />
      </div>
    </main>
  );
}
