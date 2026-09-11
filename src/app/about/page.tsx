import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About Us | POOJARO',
  description: 'The story behind POOJARO — why we built it and what we believe about ritual.',
};

export default function AboutPage() {
  return (
    <main id="main" className="pt-10 pb-16">
      <div className="container-page max-w-3xl">

        {/* Hero */}
        <div className="mb-12">
          <p className="eyebrow text-gold-deep mb-3 text-xs">Our Story</p>
          <h1 className="font-display text-display-xl text-brown leading-tight mb-6">
            Built for Every Ritual, Made With Intention
          </h1>
          <p className="text-lede text-brown-soft leading-relaxed">
            POOJARO was born from a simple frustration: sourcing everything you need for a
            puja from a dozen different shops, never quite sure whether what you bought is
            right for the ceremony. We set out to change that.
          </p>
        </div>

        {/* Body */}
        <div className="prose prose-brown max-w-none space-y-6 text-[1rem] leading-[1.75] text-brown-soft">
          <p>
            Every kit we curate is checked against what the ceremony actually requires.
            We work with suppliers who share our belief that puja samagri should be
            authentic, pure, and consistent — not whatever fills a shelf. When a product
            does not meet that standard, we do not list it.
          </p>
          <p>
            We are a small team, and that is deliberate. A smaller team means every
            sourcing decision is reviewed, every kit is assembled with care, and when
            something goes wrong we hear about it directly. We do not want to be the
            largest puja shop online. We want to be the most dependable one.
          </p>

          <h2 className="font-display text-display-sm text-brown mt-10 mb-4">
            What We Believe
          </h2>
          <ul className="space-y-3 list-none pl-0">
            {[
              'A ritual should start with confidence, not a to-do list.',
              'The right materials matter — but so does arriving on time.',
              'Transparency about what is in a kit is not optional.',
              'Every household, every occasion, is different. Kits should reflect that.',
            ].map((belief) => (
              <li key={belief} className="flex gap-3 items-start">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-deep shrink-0" />
                <span>{belief}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-display text-display-sm text-brown mt-10 mb-4">
            How We Source
          </h2>
          <p>
            Most of what we carry comes from traditional artisan suppliers and
            agricultural cooperatives across India. We visit our primary suppliers at
            least once a year. Where we cannot visit, we sample every batch before it
            ships to a customer.
          </p>
          <p>
            We do not make claims about sourcing we cannot substantiate, and we do not
            label something "organic" or "certified" unless it is. If something changes
            in a supply chain, we update the product page rather than leaving stale copy.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gold-deep text-ivory text-sm font-medium hover:bg-gold-dark transition-colors"
          >
            Browse the Collection
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-sand-deep text-brown text-sm font-medium hover:border-brown transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </main>
  );
}
