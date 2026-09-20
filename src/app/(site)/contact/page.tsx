import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ContactClient } from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us & Corporate Enquiries | POOJARO',
  description: 'Reach our devotional team for order assistance, bulk mandir orders, corporate festival gifting, or FAQ guidance.',
};

export default function ContactPage() {
  return (
    <main id="main" className="pt-10 pb-20">
      <div className="container-page max-w-5xl">
        <Suspense fallback={<div className="p-12 text-center text-brown-muted">Loading contact portal...</div>}>
          <ContactClient />
        </Suspense>
      </div>
    </main>
  );
}
