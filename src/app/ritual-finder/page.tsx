import type { Metadata } from 'next';
import { getStore } from '@/lib/data';
import { RitualFinderClient } from './RitualFinderClient';

export const metadata: Metadata = {
  title: 'Ritual Finder — Find Your Kit | POOJARO',
  description:
    'Answer four quick questions and we will tell you exactly which kit fits your ceremony.',
};

export default async function RitualFinderPage() {
  const store = await getStore();
  const [occasions, rules, settings] = await Promise.all([
    store.listOccasions(),
    store.listRecommendationRules(),
    store.getSettings(),
  ]);

  // We fetch all published products so the resolver can run entirely on the
  // client after the initial server render. The list is not expected to be
  // large enough to cause payload issues; if it is, move resolution to a
  // server action.
  const { items: products } = await store.listProducts({ status: 'published' });

  const activeOccasions = occasions.filter((o) => o.isActive);

  return (
    <main id="main" className="pt-10 pb-16">
      <div className="container-page max-w-2xl">
        <RitualFinderClient
          occasions={activeOccasions}
          rules={rules}
          products={products}
          settings={settings}
        />
      </div>
    </main>
  );
}
