import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | POOJARO',
};

export default function ContactPage() {
  return (
    <main id="main" className="pt-10 pb-16">
      <div className="container-page max-w-2xl">
        <p className="eyebrow text-gold-deep mb-3 text-xs">We&rsquo;re Here</p>
        <h1 className="font-display text-display-xl text-brown mb-6">Contact Us</h1>
        <p className="text-brown-soft leading-relaxed mb-8">
          For order questions, sourcing enquiries, or anything else — reach us directly.
          We reply within one business day.
        </p>

        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-sand-soft/40 border border-sand-deep/30">
            <p className="text-xs eyebrow text-gold-deep mb-1">Email</p>
            <a
              href="mailto:hello@poojaro.in"
              className="text-brown font-medium hover:text-gold-deep transition-colors"
            >
              hello@poojaro.in
            </a>
          </div>

          <div className="p-5 rounded-xl bg-sand-soft/40 border border-sand-deep/30">
            <p className="text-xs eyebrow text-gold-deep mb-1">WhatsApp</p>
            <p className="text-brown-soft text-sm">
              Send us a message on WhatsApp for the fastest response.
              Number available on order confirmation.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-sand-soft/40 border border-sand-deep/30">
            <p className="text-xs eyebrow text-gold-deep mb-1">Business Hours</p>
            <p className="text-sm text-brown-soft">Monday – Saturday, 9 am – 7 pm IST</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-sand-deep/40">
          <p className="text-xs text-brown-muted">
            For order tracking, visit <Link href="/account/orders" className="text-gold-deep underline underline-offset-2">My Orders</Link> in your account.
          </p>
        </div>
      </div>
    </main>
  );
}
