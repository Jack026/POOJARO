'use client';

import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, RevealGroup } from '@/components/ui/Reveal';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { ProductCard } from '@/components/shop/ProductCard';
import { buttonClasses } from '@/components/ui/button-styles';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/data/types';

interface KitShowcaseProps {
  featuredKits: Product[];
  isLoading?: boolean;
}

export function KitShowcase({ featuredKits, isLoading = false }: KitShowcaseProps) {
  return (
    <section className="section-y bg-ivory-warm">
      <div className="container-page">
        <Reveal effect="up">
          <SectionHeading
            eyebrow="Crafted Ritual Kits"
            title="Complete Puja Kits"
            copy="Everything you need, thoughtfully curated by our pandits with authentic samagri — right for beginners and experienced practitioners alike."
            align="center"
          />
        </Reveal>

        <div className="mt-12">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <RevealGroup gap={0.12} as="div" className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredKits.map((product) => (
                <Reveal key={product.id} effect="up">
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </RevealGroup>
          )}
        </div>
        
        <div className="mt-12 flex justify-center">
          <Reveal effect="up" delay={0.2}>
            <Link href="/kits" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
              View All Kits <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
