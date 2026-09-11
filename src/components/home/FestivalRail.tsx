import Link from 'next/link';
import { Photo } from '@/components/ui/Photo';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { isKnownPhoto } from '@/lib/photos';
import type { Festival } from '@/lib/data/types';
import { daysUntil, countdownLabel } from '@/lib/format';

interface FestivalRailProps {
  festivals: Festival[];
  now?: Date;
}

function getNextFestival(festivals: Festival[], now: Date): Festival | null {
  let next: Festival | null = null;
  let nextTime = Infinity;
  for (const f of festivals) {
    if (!f.isActive || !f.startDate) continue;
    const start = Date.parse(f.startDate);
    if (start < nextTime) {
      nextTime = start;
      next = f;
    }
  }
  return next;
}

export function FestivalRail({ festivals, now = new Date() }: FestivalRailProps) {
  if (festivals.length === 0) return null;

  const upcoming = getNextFestival(festivals, now);
  const active = festivals.slice(0, 6);

  return (
    <section className="section-y-sm bg-sand-soft/60">
      <div className="container-page">
        <SectionHeading
          eyebrow="Festivals"
          title="Celebrate With Intention"
          copy="Seasonal kits curated for the festivals that light up our homes — and our hearts."
        />

        {/* Countdown for the next upcoming festival */}
        {upcoming && upcoming.startDate && (
          <Reveal effect="up" delay={0.1}>
            <div className="mt-8 p-6 rounded-2xl bg-gold-wash border border-gold-deep/20 max-w-lg">
              <p
                className="text-xs eyebrow text-brown-muted mb-2"
                aria-live="polite"
              >
                {countdownLabel(upcoming.name, upcoming.startDate, now)}
              </p>
              {daysUntil(upcoming.startDate, now) !== null && (
                <p className="text-3xl font-display text-brown mb-1 tabular-nums">
                  {daysUntil(upcoming.startDate, now)!}
                </p>
              )}
              <p className="text-xs text-brown-muted">days remaining</p>
            </div>
          </Reveal>
        )}

        {/* Festival rail */}
        <div className="mt-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {active.map((f, i) => {
              const photoKey = f.imageUrl.replace(/^\/images\//, '').replace(/\.webp$/, '');
              const hasPhoto = isKnownPhoto(photoKey);
              return (
                <Reveal key={f.id} effect="up" delay={i * 0.05}>
                  <Link
                    href={`/festivals/${f.slug ?? f.id}`}
                    className="group block text-center space-y-3"
                  >
                    <div className="relative mx-auto w-16 h-16 rounded-full overflow-hidden border-2 border-sand-deep/30 bg-sand-soft group-hover:border-gold transition-colors flex items-center justify-center">
                      {hasPhoto ? (
                        <Photo name={photoKey as any} sizes="64px" className="object-cover w-full h-full" priority={i < 3} />
                      ) : (
                        <span className="text-gold text-xs">Festival</span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-brown/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                    </div>
                    <h3 className="text-sm font-display text-brown group-hover:text-gold-deep transition-colors">
                      {f.name}
                    </h3>
                    {f.tagline && (
                      <p className="text-[11px] text-brown-muted line-clamp-1">
                        {f.tagline}
                      </p>
                    )}
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
