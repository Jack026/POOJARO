import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getStore } from '@/lib/data';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export const metadata: Metadata = {
  title: 'Festival Collections | POOJARO',
  description: 'Puja kits and ritual essentials curated for every Hindu festival — Diwali, Navratri, Janmashtami, and more.',
};

const CRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Festivals' },
];

export default async function FestivalsPage() {
  const store = await getStore();
  const festivals = (await store.listFestivals()).filter((f) => f.isActive);

  return (
    <main id="main" className="pt-10 pb-16">
      <div className="container-page">
        <Breadcrumb items={CRUMBS} className="mb-6" />

        <SectionHeading
          eyebrow="Festival collections"
          title="Shop by Festival"
          copy="Curated kits and essentials for every major festival. Each collection is built around what the ritual genuinely requires."
          className="mb-10"
        />

        {festivals.length === 0 ? (
          <p className="text-brown-soft">No festival collections available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {festivals.map((festival) => (
              <Link
                key={festival.id}
                href={`/festivals/${festival.slug}`}
                className="group relative flex flex-col rounded-2xl overflow-hidden border border-sand-deep transition-all duration-200 hover:border-gold-deep/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2"
              >
                {festival.imageUrl && (
                  <div className="relative h-36 overflow-hidden bg-sand-soft/50">
                    <Image
                      src={festival.imageUrl}
                      alt={festival.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                    {festival.accent && (
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{ backgroundColor: festival.accent }}
                        aria-hidden
                      />
                    )}
                  </div>
                )}
                <div className="flex-1 p-4">
                  <p className="font-display font-medium text-brown text-lg leading-snug group-hover:text-gold-deep transition-colors">
                    {festival.headline || festival.name}
                  </p>
                  {festival.tagline && (
                    <p className="text-sm text-brown-soft mt-1 leading-snug">{festival.tagline}</p>
                  )}
                  <p className="mt-3 text-xs font-medium text-gold-deep">
                    Shop collection →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
