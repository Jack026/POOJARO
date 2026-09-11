import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CheckoutClient } from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout | POOJARO',
};

const CRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Cart', href: '/cart' },
  { label: 'Checkout' },
];

export default function CheckoutPage() {
  return (
    <main id="main" className="pt-10 pb-16">
      <div className="container-page">
        <Breadcrumb items={CRUMBS} className="mb-6" />
        <h1 className="font-display text-display-xl text-brown mb-8">Checkout</h1>
        <CheckoutClient />
      </div>
    </main>
  );
}
