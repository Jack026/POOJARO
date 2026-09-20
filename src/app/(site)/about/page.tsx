import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Sparkles, Users, Award, ArrowRight, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | POOJARO',
  description: 'The story behind POOJARO — why we built it, our Vedic sourcing, and what we believe about sacred ritual.',
};

export default function AboutPage() {
  return (
    <main id="main" className="pt-10 pb-20">
      <div className="container-page max-w-4xl space-y-16">
        {/* 1. Hero & Our Story (#story) */}
        <section id="story" className="scroll-mt-24">
          <p className="eyebrow text-gold-deep mb-3 text-xs">Our Story</p>
          <h1 className="font-display text-display-xl text-brown leading-tight mb-6">
            Built for Every Ritual, Made With Pure Intention
          </h1>
          <p className="text-lede text-brown-soft leading-relaxed mb-6">
            POOJARO was born from a simple frustration: sourcing everything you need for a
            puja from a dozen different shops, never quite sure whether what you bought is
            pure, authentic, or right for the ceremony. We set out to change that forever.
          </p>
          <div className="prose prose-brown max-w-none space-y-5 text-[1rem] leading-[1.75] text-brown-soft">
            <p>
              Every kit we curate is checked against what the ceremony actually requires according to classical Vedic vidhis.
              We work directly with hereditary artisan families and agricultural cooperatives across India who share our belief that puja samagri should be
              authentic, unadulterated, and consistent — not whatever happens to fill a commercial shelf. When a product
              does not meet that standard of sanctity, we do not list it.
            </p>
            <p>
              We are a dedicated team rooted in devotion. That means every
              sourcing decision is verified, every kit is packed with care, and when
              devotees need guidance, we provide direct assistance. We do not aim to be the
              most commercialized store online; we are committed to being the most dependable, reverent sanctuary for your spiritual home.
            </p>
          </div>
        </section>

        {/* What We Believe & How We Source */}
        <section className="p-8 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] space-y-6 shadow-xs">
          <h2 className="font-display text-2xl text-brown">What Guides Our Devotion</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Vidhi-Compliant Accuracy',
                desc: 'A ritual should begin with peaceful confidence, not an anxious checklist. Our kits contain exact prescribed ingredients.',
              },
              {
                title: 'Artisanal Purity',
                desc: 'No adulterated powders or artificial scents. Hand-rolled dhoop, unrefined bheemleni camphor, and 100% pure cow ghee.',
              },
              {
                title: 'Direct Sourcing Integrity',
                desc: 'We visit our artisan co-ops regularly. If something changes in a harvest or supply line, we update our community transparently.',
              },
              {
                title: 'Respect for Tradition',
                desc: 'Every region, household, and festival holds sacred nuances. Our custom kits and flexible packages reflect that living heritage.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3.5 items-start">
                <span className="mt-1 w-2 h-2 rounded-full bg-gold-deep shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-brown mb-1">{item.title}</h3>
                  <p className="text-xs text-brown-soft leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Spiritual Insights & Ritual Guides (#blogs) */}
        <section id="blogs" className="scroll-mt-24 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-gold-deep mb-2 text-xs">Spiritual Wisdom & Blogs</p>
              <h2 className="font-display text-2xl md:text-3xl text-brown">Ritual Vidhis & Articles</h2>
            </div>
            <Link
              href="/ritual-finder"
              className="text-xs font-semibold text-gold-deep hover:text-gold-dark flex items-center gap-1 self-start"
            >
              <span>Explore Ritual Finder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'The Sacred Science of Bheemleni Camphor',
                category: 'Purification & Agni',
                summary: 'Why pure pine-derived camphor burns without residue and clears heavy atmospheric energies during Aarti.',
                readTime: '4 min read',
              },
              {
                title: 'Griha Pravesh Vidhi: Step-by-Step Vastu Puja',
                category: 'Home Ceremonies',
                summary: 'Essential samagri, auspicious muhurat selection, and the vital role of the Kalash establishment in welcoming prosperity.',
                readTime: '7 min read',
              },
              {
                title: 'Caring for Pure Brass & Bronze Deities',
                category: 'Heritage Care',
                summary: 'Traditional pitambari cleaning, abhishek hygiene, and how to maintain sacred patina across generations.',
                readTime: '5 min read',
              },
            ].map((blog, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-white border border-[#E8DDCF] shadow-xs flex flex-col justify-between hover:border-gold-deep/60 transition-colors"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-deep bg-gold-wash px-2 py-0.5 rounded-full inline-block mb-3">
                    {blog.category}
                  </span>
                  <h3 className="font-display text-base font-semibold text-brown mb-2 leading-snug">
                    {blog.title}
                  </h3>
                  <p className="text-xs text-brown-soft leading-relaxed mb-4">{blog.summary}</p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-brown-muted pt-3 border-t border-[#F0E6D8]">
                  <span>{blog.readTime}</span>
                  <Link href="/shop" className="text-gold-deep font-semibold hover:underline">
                    View Samagri →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Devotional Careers & Artisans (#careers) */}
        <section id="careers" className="scroll-mt-24 p-8 rounded-2xl bg-sand-soft/30 border border-[#E8DDCF] space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gold/15 rounded-xl text-gold-deep shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="eyebrow text-gold-deep mb-1 text-xs">Join Our Mission</p>
              <h2 className="font-display text-2xl text-brown">Careers & Artisan Partnerships</h2>
              <p className="text-sm text-brown-soft mt-2 leading-relaxed">
                POOJARO is always seeking passionate Vedic scholars, traditional handloom weavers, brass artisans, and logistics specialists who want to preserve India&apos;s sacred heritage.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-white rounded-xl border border-[#E8DDCF]">
              <h3 className="text-sm font-bold text-brown">Artisan & Cooperative Sourcing</h3>
              <p className="text-xs text-brown-soft mt-1">
                Are you a traditional producer of natural dhoop, brassware, or organic samagri? Partner with POOJARO for direct nationwide distribution.
              </p>
              <Link href="/contact?type=bulk" className="inline-block text-xs font-semibold text-gold-deep mt-3 hover:underline">
                Register as Supplier →
              </Link>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E8DDCF]">
              <h3 className="text-sm font-bold text-brown">Operations & Devotional Sourcing Team</h3>
              <p className="text-xs text-brown-soft mt-1">
                We have open opportunities in quality curation, supply chain fulfillment, and customer care in Mumbai, Bengaluru, and Jaipur.
              </p>
              <Link href="/contact" className="inline-block text-xs font-semibold text-gold-deep mt-3 hover:underline">
                Send Your Profile to hello@poojaro.in →
              </Link>
            </div>
          </div>
        </section>

        {/* 4. Press & Accreditations (#press) */}
        <section id="press" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold/15 rounded-lg text-gold-deep">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="eyebrow text-gold-deep mb-0.5 text-xs">Press & Recognition</p>
              <h2 className="font-display text-2xl text-brown">Preserving Heritage Authenticity</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-white border border-[#E8DDCF] shadow-xs">
              <p className="font-serif italic text-xs text-brown-soft mb-3 leading-relaxed">
                &ldquo;POOJARO bridges ancient temple traditions with modern household convenience, delivering pure samagri without compromising Vedic purity.&rdquo;
              </p>
              <span className="text-[11px] font-bold text-brown uppercase tracking-wider block">
                Heritage & Culture Today
              </span>
            </div>
            <div className="p-5 rounded-xl bg-white border border-[#E8DDCF] shadow-xs">
              <p className="font-serif italic text-xs text-brown-soft mb-3 leading-relaxed">
                &ldquo;Their curated ritual boxes solve the longstanding friction of sourcing authentic festival essentials in urban India.&rdquo;
              </p>
              <span className="text-[11px] font-bold text-brown uppercase tracking-wider block">
                The Artisan Chronicle
              </span>
            </div>
            <div className="p-5 rounded-xl bg-white border border-[#E8DDCF] shadow-xs">
              <p className="font-serif italic text-xs text-brown-soft mb-3 leading-relaxed">
                &ldquo;A shining example of ethical sourcing, bringing prosperity back to brass-smiths and natural forest herb gatherers.&rdquo;
              </p>
              <span className="text-[11px] font-bold text-brown uppercase tracking-wider block">
                Vedic Commerce Review
              </span>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <div className="pt-8 border-t border-[#E8DDCF] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-brown">Ready to Experience Sacred Rituals?</h3>
            <p className="text-xs text-brown-muted mt-1">Explore our complete collection of puja kits and pure samagri.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold-deep text-white text-xs font-semibold hover:bg-gold-dark transition-colors shadow-xs"
            >
              Browse Products
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#D9CBB9] text-brown text-xs font-semibold hover:bg-white transition-colors"
            >
              Contact Devotional Team
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
