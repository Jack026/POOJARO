import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | POOJARO',
};

export default function PrivacyPage() {
  return (
    <main id="main" className="pt-10 pb-16">
      <div className="container-page max-w-2xl">
        <p className="eyebrow text-gold-deep mb-3 text-xs">Your Data</p>
        <h1 className="font-display text-display-xl text-brown mb-4">Privacy Policy</h1>
        <p className="text-xs text-brown-muted mb-8">Last updated: September 2026</p>

        <div className="prose prose-brown max-w-none space-y-6 text-[1rem] leading-[1.75] text-brown-soft">
          <p>
            We collect only what is necessary to fulfil your order and improve our service.
            We do not sell your data.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">What We Collect</h2>
          <ul className="space-y-2 list-none pl-0">
            {[
              ['Account data', 'Name, email address, and (if you save it) phone number'],
              ['Order data', 'Delivery address, order contents, and payment confirmation (not card details)'],
              ['Usage data', 'Pages visited and search terms, to improve product discovery'],
            ].map(([label, detail]) => (
              <li key={label} className="flex gap-3 items-start text-sm">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold-deep shrink-0" />
                <span><strong className="text-brown">{label}:</strong> {detail}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">What We Do Not Collect</h2>
          <p>
            We do not store payment card numbers. Payments are processed by Razorpay;
            their privacy policy governs how they handle your payment data.
            We do not collect data beyond what is needed for your order.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">How We Use Your Data</h2>
          <ul className="space-y-2 list-none pl-0">
            {[
              'To process and deliver your order',
              'To send order confirmations and shipping updates',
              'To respond to your support messages',
              'To improve the website and product catalogue',
            ].map((item) => (
              <li key={item} className="flex gap-3 items-start text-sm">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold-deep shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Marketing</h2>
          <p>
            We only send marketing messages if you opt in. You can unsubscribe at any time
            from any message we send, or from your account notification settings.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Data Retention</h2>
          <p>
            Order data is retained for 7 years for tax compliance. Account data is deleted
            within 30 days if you request account deletion, except where retention is legally
            required.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Your Rights</h2>
          <p>
            You may request a copy of your data, correction of inaccurate data, or deletion
            of your account by writing to hello@poojaro.in. We will respond within 30 days.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Cookies</h2>
          <p>
            We use cookies only for authentication (keeping you logged in) and for an
            anonymous session identifier used by the shopping cart. We do not use
            third-party tracking or advertising cookies.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Contact</h2>
          <p>
            Questions about this policy: hello@poojaro.in
          </p>
        </div>
      </div>
    </main>
  );
}
