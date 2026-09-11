'use client';

import { Shield, Truck, RefreshCw, Heart, Phone, Clock, Sparkles, Leaf, Package } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import type { TrustBadge } from '@/lib/data/types';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  truck: Truck,
  shield: Shield,
  refresh: RefreshCw,
  heart: Heart,
  phone: Phone,
  clock: Clock,
  sparkles: Sparkles,
  leaf: Leaf,
  package: Package,
  'care-package': Heart,
  'quality-curation': Sparkles,
};

export function TrustStrip({
  badges,
  storeName,
}: {
  badges: TrustBadge[];
  storeName: string;
}) {
  const active = badges.filter((b) => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  if (active.length === 0) return null;

  return (
    <section className="section-y-sm bg-brown text-ivory">
      <div className="container-page">
        <SectionHeading
          eyebrow="Why Shop With POOJARO"
          title={`The ${storeName} Promise`}
          copy="We deliver more than products — we deliver peace of mind for every ritual you prepare."
          align="center"
        />

        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
          {active.map((badge, i) => {
            const Icon = ICONS[badge.icon] ?? Shield;
            return (
              <Reveal key={badge.id} effect="up" delay={i * 0.05}>
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-ivory/10 border border-ivory/10">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <p className="text-xs font-medium text-sand-soft leading-snug">{badge.title}</p>
                  {badge.subtitle && (
                    <p className="text-[11px] text-sand-deep/60 leading-snug">{badge.subtitle}</p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}