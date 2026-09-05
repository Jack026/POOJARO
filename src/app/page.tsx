import type { Metadata } from 'next';
import Link from 'next/link';

import { getStore } from '@/lib/data';
import { buttonClasses } from '@/components/ui/button-styles';
import { Photo } from '@/components/ui/Photo';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  return buildMetadata({ path: '/' }, await store.getSettings());
}

/**
 * Placeholder home page.
 *
 * Replaced in the next step by the composed sections. It exists now so the
 * design tokens, fonts and data layer can be verified end to end in a real
 * build before any of that is layered on top.
 */
export default async function HomePage() {
  const store = await getStore();
  const [settings, products] = await Promise.all([
    store.getSettings(),
    store.listProducts({ status: 'published' }),
  ]);

  return (
    <main id="main" className="container-page section-y">
      <p className="eyebrow">{settings.storeName}</p>
      <h1 className="mt-4 text-display-xl">
        Every Ritual.
        <br />
        Everything You Need.
      </h1>
      <p className="mt-6 max-w-xl text-lede text-brown-soft">
        Authentic Puja Samagri and thoughtfully prepared ritual kits, brought together for the moments that matter.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
          Shop puja kits
        </Link>
        <Link href="/ritual-finder" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
          Explore by occasion
        </Link>
      </div>

      <div className="mt-14 max-w-lg overflow-hidden rounded-xl">
        <Photo name="hero-thali" sizes="(min-width: 640px) 32rem, 100vw" priority />
      </div>

      <p className="mt-8 text-sm text-brown-muted">{products.total} published products in the catalogue.</p>
    </main>
  );
}
