'use client';

import { motion } from 'motion/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { EASE_OUT_SOFT } from '@/lib/motion';
import { PeacockSignature } from '@/components/peacock';

export function BrandStory() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <section className="section-y bg-ivory relative overflow-hidden">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 texture-paper pointer-events-none" aria-hidden="true" />

      <div className="container-page">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Editorial text */}
          <div className="space-y-8 text-brown">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT }}
            >
              <p className="text-xs eyebrow text-gold-deep mb-4">Our Story</p>
              <h2 className="text-display-xl md:text-display-lg font-display mb-6">Open. Prepare. Begin.</h2>
            </motion.div>

            <motion.p
              className="text-lede text-brown-soft leading-relaxed"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: 0.08 }}
            >
              For generations, India&apos;s rituals have been lived, not searched. Our ancestors gathered what they needed from local markets, from trusted merchants who knew every flame, every grain, every sacred detail.
            </motion.p>

            <motion.p
              className="text-lede text-brown-soft leading-relaxed"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: 0.16 }}
            >
              At POOJARO, we carry forward that trust. We source directly from trusted artisans and wholesalers, curate ritual kits for every occasion, and ensure every offering is authentic, complete, and ready when you need it.
            </motion.p>

            <motion.p
              className="text-lede text-brown-soft leading-relaxed"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: 0.24 }}
            >
              Whether you&apos;re welcoming new beginnings or celebrating abundance, we prepare the essentials of faith so you can focus on what matters most — the ritual itself.
            </motion.p>

            <motion.div
              className="pt-2 flex items-center"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: 0.32 }}
            >
              <PeacockSignature
                variant="henna-on-light"
                layout="horizontal"
                size={160}
                className="opacity-90 hover:opacity-100 transition-opacity"
              />
            </motion.div>
          </div>

          {/* Editorial image */}
          <motion.div
            className="relative aspect-[4/3] lg:aspect-[1/1] rounded-2xl overflow-hidden shadow-lift"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reduced ? 0.01 : 0.7, ease: EASE_OUT_SOFT }}
          >
            <img
              src="/images/story-ganesh-1024.webp"
              alt="Clay Ganesha idol with marigold garland and modak offerings on traditional cloth"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
