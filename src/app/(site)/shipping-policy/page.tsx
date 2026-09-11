import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy | POOJARO',
};

export default function ShippingPolicyPage() {
  return (
    <main id="main" className="pt-10 pb-16">
      <div className="container-page max-w-2xl">
        <p className="eyebrow text-gold-deep mb-3 text-xs">Delivery</p>
        <h1 className="font-display text-display-xl text-brown mb-8">Shipping Policy</h1>

        <div className="prose prose-brown max-w-none space-y-6 text-[1rem] leading-[1.75] text-brown-soft">
          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Delivery Areas</h2>
          <p>
            We ship across India via our courier partners. We currently do not ship internationally.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Delivery Times</h2>
          <ul className="space-y-2 list-none pl-0">
            {[
              ['Standard delivery', '3–6 business days from dispatch'],
              ['Express delivery', '1–2 business days (metro cities, available at checkout)'],
              ['Remote areas', 'May take up to 10 business days'],
            ].map(([label, detail]) => (
              <li key={label} className="flex gap-3 items-start text-sm">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold-deep shrink-0" />
                <span><strong className="text-brown">{label}:</strong> {detail}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Business days exclude Sundays and public holidays. Delivery estimates are from
            the dispatch date, not the order date. Dispatch usually happens within one
            business day of payment confirmation.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Free Shipping</h2>
          <p>
            Free standard delivery applies when the order value (after any discounts, before
            shipping) meets the threshold shown at checkout. The threshold is set by our admin
            and may change from time to time.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Tracking</h2>
          <p>
            Once your order is dispatched, we share a tracking link by email and WhatsApp.
            You can also track from My Orders in your account.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Failed Deliveries</h2>
          <p>
            If a delivery attempt fails and the package is returned to us, we will contact
            you to arrange re-delivery. Additional charges may apply for re-dispatch.
          </p>
        </div>
      </div>
    </main>
  );
}
