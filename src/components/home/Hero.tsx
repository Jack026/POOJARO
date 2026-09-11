'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { buttonClasses } from '@/components/ui/button-styles';
import { EASE_OUT_SOFT, DURATION, stagger } from '@/lib/motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Photo } from '@/components/ui/Photo';

const steps = [
  'bg',
  'diyas',
  'marigold',
  'incense',
  'eyebrow',
  'headline',
  'cta',
];

export function Hero() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <section className="relative min-h-[80vh] md:min-h-[70vh] lg:min-h-[80vh] bg-brown flex items-center overflow-hidden">
      {/* Warm glow */}
      <div className="absolute inset-0 glow-diya" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brown/80 via-brown/95 to-brown z-0" />

      {/* Decorative diyas - animated */}
      <motion.div
        className="absolute bottom-10 left-[5%] md:left-[8%] z-10 opacity-80"
        initial={{ opacity: 0, y: 30, scale: 0.8 }}
        animate={{ opacity: 0.8, y: 0, scale: 1 }}
        transition={{ duration: reduced ? 0.01 : 0.9, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.15 }}
      >
        <Photo name="sam-diya-row" sizes="120px" className="w-20 h-auto opacity-70" priority />
      </motion.div>

      {/* Marigold accent */}
      <motion.div
        className="absolute top-[10%] right-[5%] md:right-[8%] z-10 opacity-70"
        initial={{ opacity: 0, x: 30, rotate: -5 }}
        animate={{ opacity: 0.7, x: 0, rotate: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.8, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.25 }}
      >
        <Photo name="sam-marigold" sizes="140px" className="w-24 h-auto opacity-60" />
      </motion.div>

      {/* Hero thali image */}
      <motion.div
        className="absolute bottom-0 right-0 w-full max-w-md md:max-w-lg lg:max-w-xl z-5"
        initial={{ opacity: 0, x: 100, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: reduced ? 0.01 : 1.1, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.4 }}
      >
        <Photo
          name="hero-thali"
          sizes="(min-width: 768px) 25vw, 60vw"
          className="object-contain"
          priority
        />
      </motion.div>

      <div className="container-page relative z-10 pt-10 md:pt-0 pb-20 md:pb-0">
        <motion.div
          className="max-w-2xl lg:max-w-xl text-ivory"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.35 }}
        >
          {/* Eyebrow */}
          <motion.p
            className="eyebrow text-gold-soft mb-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.4, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.25 }}
          >
            Authentic Puja Samagri
          </motion.p>

          {/* Headline */}
          <motion.h1
            className="text-display-xl md:text-display-xl font-display leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.6, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.35 }}
          >
            Every Ritual.
            <br />
            Everything You Need.
          </motion.h1>

          {/* Copy */}
          <motion.p
            className="text-lede text-sand-soft mb-8 max-w-md"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.45 }}
          >
            Authentic Puja Samagri and thoughtfully prepared ritual kits, brought together for the moments that matter.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduced ? 0.01 : 0.45,
              ease: EASE_OUT_SOFT,
              delay: reduced ? 0 : 0.55,
              ...(reduced ? {} : stagger(0.08, 0)),
            }}
          >
            <Link
              href="/kits"
              className={buttonClasses({ variant: 'primary', size: 'lg' })}
            >
              Shop Puja Kits
            </Link>
            <Link
              href="/ritual-finder"
              className={buttonClasses({ variant: 'secondary', size: 'lg' })}
            >
              Explore by Occasion
            </Link>
          </motion.div>

          {/* Trusted by */}
          <motion.div
            className="mt-10 flex items-center gap-2.5 text-xs text-sand-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0.01 : 0.4, delay: reduced ? 0 : 0.7 }}
          >
            <span>Pan-India delivery • Secure checkout • Easy returns</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}