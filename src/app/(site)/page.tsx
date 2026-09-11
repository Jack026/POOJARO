import type { Metadata } from 'next';

import { getStore } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';

import { Hero } from '@/components/home/Hero';
import { OccasionGrid } from '@/components/home/OccasionGrid';
import { KitShowcase } from '@/components/home/KitShowcase';
import { RitualFinderTeaser } from '@/components/home/RitualFinderTeaser';
import { FestivalRail } from '@/components/home/FestivalRail';
import { BrandStory } from '@/components/home/BrandStory';
import { WhyPoojaro } from '@/components/home/WhyPoojaro';
import { Testimonials } from '@/components/home/Testimonials';
import { TrustStrip } from '@/components/home/TrustStrip';

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  const settings = await store.getSettings();
  return buildMetadata({ path: '/' }, settings);
}

export default async function HomePage() {
  const store = await getStore();
  const [settings, kits, festivals, testimonials, trustBadges] = await Promise.all([
    store.getSettings(),
    store.listProducts({ isKit: true, isFeatured: true, status: 'published' }),
    store.listFestivals(),
    store.listTestimonials(),
    store.getSettings().then((s) => s.trustBadges),
  ]);

  const featuredKits = kits.items;

  return (
    <main id="main">
      <Hero />
      <OccasionGrid />
      <KitShowcase featuredKits={featuredKits} />
      <RitualFinderTeaser />
      <FestivalRail festivals={festivals} />
      <BrandStory />
      <WhyPoojaro />
      <Testimonials testimonials={testimonials} />
      <TrustStrip badges={trustBadges} storeName={settings.storeName} />
    </main>
  );
}
