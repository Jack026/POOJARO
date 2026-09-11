'use client';

import Link from 'next/link';
import { HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { buttonClasses } from '@/components/ui/button-styles';
import { EASE_OUT_SOFT } from '@/lib/motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function RitualFinderTeaser() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <section className="section-y-sm bg-brown relative overflow-hidden">
      <div className="container-page">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-wash/30 mb-6"
          >
            <HelpCircle className="w-6 h-6 text-gold" />
          </motion.div>

          <motion.h2
            className="text-display-md md:text-display-lg font-display text-ivory mb-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduced ? 0.01 : 0.6, ease: EASE_OUT_SOFT, delay: 0.08 }}
          >
            Not Sure What You Need?
          </motion.h2>
          <motion.p
            className="text-sand-soft text-lede max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: 0.16 }}
          >
            Tell us what you&apos;re preparing for. We&apos;ll guide you to the right kit.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: 0.24 }}
          >
            <Link
              href="/ritual-finder"
              className={buttonClasses({ variant: 'gold', size: 'lg' })}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Find My Kit
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}