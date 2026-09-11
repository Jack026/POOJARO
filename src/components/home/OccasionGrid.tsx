import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Photo } from '@/components/ui/Photo';
import { isKnownPhoto } from '@/lib/photos';
import { PeacockCornerOrnament } from '@/components/peacock';

const occasions = [
  {
    id: 'griha-pravesh',
    title: 'Griha Pravesh',
    tagline: 'Bless your new home with a complete welcome ritual.',
    description: 'A curated kit for housewarming ceremonies — kalash, rice, marigold garlands, fragrant incense, and everything needed to welcome prosperity.',
    href: '/occasions/griha-pravesh',
    image: 'kit-griha-pravesh',
  },
  {
    id: 'satyanarayan',
    title: 'Satyanarayan Puja',
    tagline: 'Offer gratitude with the complete Satyanarayan setup.',
    description: 'The sacred thali with a painted earthen pot, tulsi leaves, rice, kumkum, haldi, fragrant dhoop, and ritual instructions.',
    href: '/occasions/satyanarayan',
    image: 'kit-satyanarayan',
  },
  {
    id: 'lakshmi-puja',
    title: 'Lakshmi Puja',
    tagline: 'Draw abundance with the right offerings.',
    description: 'Golden coins, lotus seeds, coins, welcome mat, fragrant dhoop, and everything needed for the blessing of wealth and well-being.',
    href: '/occasions/lakshmi-puja',
    image: 'kit-lakshmi',
  },
  {
    id: 'ganesh-puja',
    title: 'Ganesh Puja',
    tagline: 'Begin with the remover of obstacles.',
    description: 'A clay Ganesha idol, fresh marigolds, modak offerings, fragrance, rice grains, and the traditional prayer setup.',
    href: '/occasions/ganesh-puja',
    image: 'kit-ganesh',
  },
];

export function OccasionGrid() {
  return (
    <section className="section-y relative isolate overflow-hidden bg-ivory">
      {/* Subtle handcrafted peacock corner ornament in top-left */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-4 -left-4 z-0 opacity-20">
        <PeacockCornerOrnament variant="henna-on-light" position="top-left" size={140} />
      </div>

      <div className="container-page relative z-10">
        <SectionHeading
          eyebrow="Choose Your Occasion"
          title="Every Ritual, Perfectly Prepared"
          copy="Select the special moment you are preparing for, and we will bring together everything you need."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-10">
          {occasions.map((o, i) => (
            <Reveal key={o.id} effect="up" delay={i * 0.08}>
              <Link href={o.href} className="group relative block rounded-2xl overflow-hidden bg-sand-soft/30 border border-sand-deep/40 hover:border-sand-deep hover:shadow-card transition-all duration-300">
                <div className="aspect-[4/3] relative overflow-hidden bg-brown">
                  {isKnownPhoto(o.image) ? (
                    <Photo
                      name={o.image as any}
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out-soft"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ivory/60 text-xs">
                      Ritual Essence
                    </div>
                  )}
                </div>
                <div className="p-5 md:p-6 space-y-2">
                  <h3 className="font-display text-xl text-brown group-hover:text-gold-deep transition-colors leading-tight">
                    {o.title}
                  </h3>
                  <p className="text-sm text-brown-soft font-medium leading-snug">
                    {o.tagline}
                  </p>
                  <p className="text-xs text-brown-muted leading-relaxed line-clamp-2">
                    {o.description}
                  </p>
                  <div className="pt-2">
                    <span className="text-xs font-medium text-gold-deep flex items-center gap-1 hover:underline">
                      Explore <ArrowRight className="inline-block w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}