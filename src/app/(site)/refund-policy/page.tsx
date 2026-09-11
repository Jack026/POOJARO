import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Return Policy | POOJARO',
};

export default function RefundPolicyPage() {
  return (
    <main id="main" className="pt-10 pb-16">
      <div className="container-page max-w-2xl">
        <p className="eyebrow text-gold-deep mb-3 text-xs">Returns</p>
        <h1 className="font-display text-display-xl text-brown mb-8">Refund &amp; Return Policy</h1>

        <div className="prose prose-brown max-w-none space-y-6 text-[1rem] leading-[1.75] text-brown-soft">
          <p>
            We want every ritual to begin right. If something goes wrong on our end, we will
            make it right quickly.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Eligible Issues</h2>
          <ul className="space-y-2 list-none pl-0">
            {[
              'Damaged item on arrival',
              'Wrong item delivered',
              'Item missing from the kit as listed on the product page',
            ].map((item) => (
              <li key={item} className="flex gap-3 items-start text-sm">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold-deep shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">How to Raise a Claim</h2>
          <p>
            Contact us within 48 hours of delivery. Send a photo of the item and your
            order number to hello@poojaro.in or via WhatsApp. We will respond within
            one business day.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">What Happens Next</h2>
          <ul className="space-y-2 list-none pl-0">
            {[
              ['Damaged item', 'Full replacement dispatched or full refund, your choice'],
              ['Wrong item', 'Correct item dispatched at no cost; return of the wrong item arranged by us'],
              ['Missing component', 'Missing item dispatched or proportional refund'],
            ].map(([label, detail]) => (
              <li key={label} className="flex gap-3 items-start text-sm">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold-deep shrink-0" />
                <span><strong className="text-brown">{label}:</strong> {detail}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">What Is Not Eligible</h2>
          <ul className="space-y-2 list-none pl-0">
            {[
              'Opened ritual kits (hygiene and purity reasons)',
              'Change-of-mind returns',
              'Claims raised more than 48 hours after delivery',
            ].map((item) => (
              <li key={item} className="flex gap-3 items-start text-sm">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-display text-display-sm text-brown mt-8 mb-3">Refund Timeline</h2>
          <p>
            Approved refunds are processed within 5–7 business days. The time it takes
            to appear in your account depends on your bank or payment provider.
          </p>
        </div>
      </div>
    </main>
  );
}
