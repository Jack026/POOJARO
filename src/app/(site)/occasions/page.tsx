import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getStore } from '@/lib/data';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Photo } from '@/components/ui/Photo';
import { isKnownPhoto, normalizePhotoKey, resolveImageUrl } from '@/lib/photos';

export const metadata: Metadata = {
  title: 'Shop by Occasion | POOJARO',
  description: 'Puja kits and samagri for every Hindu ritual and occasion — Ganesh Puja, Satyanarayan Katha, Griha Pravesh, and more.',
};

const CRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Occasions' },
];

export default async function OccasionsPage() {
  const store = await getStore();
  const occasions = (await store.listOccasions()).filter((o) => o.isActive);

  return (
    <main id="main" className="pt-10 pb-16">
      <div className="container-page">
        <Breadcrumb items={CRUMBS} className="mb-6" />

        <SectionHeading
          eyebrow="Browse by ritual"
          title="Shop by Occasion"
          copy="Find everything you need for the puja you are planning. Each page lists kits and loose items curated for that ritual."
          className="mb-10"
        />

        {occasions.length === 0 ? (
          <p className="text-brown-soft">No occasions available yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {occasions.map((occ) => (
              <Link
                key={occ.id}
                href={`/occasions/${occ.slug}`}
                className="group relative flex flex-col items-center gap-3 rounded-2xl border border-sand-deep bg-sand-soft/20 p-5 text-center transition-all duration-200 hover:border-gold-deep/60 hover:bg-sand-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2"
              >
                {occ.imageUrl ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-sand-soft/60 shrink-0">
                    {isKnownPhoto(normalizePhotoKey(occ.imageUrl)) ? (
                      <Photo
                        name={normalizePhotoKey(occ.imageUrl)}
                        alt={occ.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <Image
                        src={resolveImageUrl(occ.imageUrl)}
                        alt={occ.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gold-wash/60 border border-gold-deep/20 flex items-center justify-center shrink-0">
                    <span className="text-2xl" aria-hidden>🪔</span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-brown text-sm leading-snug group-hover:text-gold-deep transition-colors">
                    {occ.name}
                  </p>
                  {occ.tagline && (
                    <p className="text-xs text-brown-muted mt-0.5 leading-snug">{occ.tagline}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
