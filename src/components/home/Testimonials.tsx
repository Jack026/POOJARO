'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Reveal } from '@/components/ui/Reveal';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { EASE_OUT_SOFT, DURATION } from '@/lib/motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Testimonial } from '@/lib/data/types';

interface TestimonialsProps {
  testimonials: Testimonial[];
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [activeIdx, setActiveIdx] = useState(0);

  const filtered = testimonials.filter((t) => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  const handleNext = () => setActiveIdx((i) => (i + 1) % filtered.length);
  const handlePrev = () => setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);

  const current = filtered[activeIdx];
  if (!current) return null;

  return (
    <section className="section-y bg-ivory">
      <div className="container-page">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs eyebrow text-gold-deep mb-4">Testimonials</p>
            <h2 className="text-display-lg md:text-display-xl font-display text-brown">
              Words From Our Community
            </h2>
            {/* Demo disclosure */}
            <Reveal effect="up" delay={0.1}>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-brown-muted">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-soft" />
                Illustrative customer reviews — structured for real testimonials when live.
              </div>
            </Reveal>
          </div>

          {/* Carousel nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2.5 rounded-full border border-sand-deep hover:border-brown transition-colors"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-4 h-4 text-brown" />
            </button>
            <button
              onClick={handleNext}
              className="p-2.5 rounded-full border border-sand-deep hover:border-brown transition-colors"
              aria-label="Next review"
            >
              <ChevronRight className="w-4 h-4 text-brown" />
            </button>
          </div>
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: reduced ? 0.01 : DURATION.base, ease: EASE_OUT_SOFT }}
            className="max-w-3xl mx-auto bg-sand-soft/50 rounded-2xl border border-sand-deep/30 p-6 md:p-10 relative"
          >
            {/* Quote mark */}
            <Quote className="w-10 h-10 text-gold-deep/20 absolute top-6 right-8" />

            <div className="flex flex-col gap-6">
              <div>
                <Rating value={current.rating} size="sm" />
              </div>
              <blockquote className="text-lg md:text-xl font-display text-brown leading-snug">
                &ldquo;{current.quote}&rdquo;
              </blockquote>

              <footer className="flex items-center gap-4 pt-4 border-t border-sand-deep/40">
                <div className="flex-1 space-y-0.5">
                  <p className="font-medium text-brown text-sm">
                    {current.authorName}
                    {current.isDemo && <Badge tone="info" className="ml-2">Sample</Badge>}
                  </p>
                  <p className="text-xs text-brown-muted">{current.city}</p>
                </div>
                {current.verifiedPurchase && (
                  <Badge tone="success">Verified Purchase</Badge>
                )}
              </footer>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {filtered.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === activeIdx ? 'bg-gold-deep w-6' : 'bg-sand-deep'
              }`}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
