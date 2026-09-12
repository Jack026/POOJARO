'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type Variants } from 'motion/react';
import { ArrowRight, Truck } from 'lucide-react';

import { EASE_OUT_QUART, EASE_OUT_SOFT } from '@/lib/motion';
import { useHasFinePointer, useMediaQuery } from '@/hooks/useMediaQuery';

// Gentle falling lotus petals drifting through the morning sunlight
const PETALS = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: 8 + ((i * 37) % 84),
  size: 14 + (i % 3) * 4,
  delay: (i % 4) * 1.8,
  duration: 11 + (i % 3) * 3,
  drift: (i % 2 ? 1 : -1) * (18 + (i % 3) * 12),
}));

export function Hero() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const finePointer = useHasFinePointer();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const parallax = mounted && finePointer && !reduced;

  // Pointer parallax for desktop scene
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 70, damping: 20, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 70, damping: 20, mass: 0.5 });

  const bgX = useTransform(sx, (v) => v * 12);
  const bgY = useTransform(sy, (v) => v * 8);

  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    if (!parallax) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }

  function resetPointer() {
    px.set(0);
    py.set(0);
  }

  // Headline reveal animations
  const headline: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : 0.12,
        delayChildren: reduced ? 0 : 0.18,
      },
    },
  };
  const line: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.25 } } }
    : { hidden: { y: '110%' }, visible: { y: '0%', transition: { duration: 0.9, ease: EASE_OUT_QUART } } };

  return (
    <section
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className="relative isolate flex min-h-[92vh] sm:min-h-[88vh] lg:min-h-[92vh] items-center overflow-hidden bg-[#FAF4EB] py-8 sm:py-12 lg:py-16 text-[#3A2118]"
    >
      {/* ============================================================ */}
      {/* MASTER TEMPLE BACKGROUND SCENES                              */}
      {/* Desktop (lg+): Exact size & position from user image         */}
      {/* Mobile (<lg): 1080x1920 Vertical Portrait Temple Scene       */}
      {/* ============================================================ */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden"
        style={parallax ? { x: bgX, y: bgY, scale: 1.03 } : undefined}
      >
        {/* Desktop Landscape Scene (lg: 1024px and up) */}
        <div className="hidden lg:block absolute inset-0">
          <Image
            src="/images/1-real.png"
            alt="POOJARO Sacred Rituals"
            fill
            priority
            quality={95}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Mobile / Tablet Portrait Scene (< 1024px) */}
        <div className="block lg:hidden absolute inset-0">
          <Image
            src="/images/hero-mobile-scene.jpg"
            alt="POOJARO Sacred Rituals"
            fill
            priority
            quality={95}
            sizes="100vw"
            className="object-cover object-bottom"
          />
        </div>
      </motion.div>

      {/* Soft gradient readability overlays on mobile */}
      <div
        aria-hidden="true"
        className="block lg:hidden pointer-events-none absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-[#FAF4EB]/85 via-[#FAF4EB]/45 to-transparent -z-10"
      />
      <div
        aria-hidden="true"
        className="block lg:hidden pointer-events-none absolute inset-x-0 bottom-0 h-[24%] bg-gradient-to-t from-[#FAF4EB]/85 via-[#FAF4EB]/40 to-transparent -z-10"
      />

      {/* Floating Lotus Petals */}
      {!reduced && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden z-[2]">
          {PETALS.map((p) => (
            <motion.div
              key={p.id}
              className="absolute pointer-events-none select-none"
              style={{ left: `${p.left}%`, top: '-5%' }}
              animate={{
                y: ['0vh', '105vh'],
                x: [0, p.drift, -p.drift, 0],
                rotate: [0, 60, -45, 120],
                opacity: [0, 0.85, 0.85, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <svg width={p.size} height={p.size * 1.3} viewBox="0 0 20 26" fill="currentColor">
                <path
                  d="M10 0 C16 6 20 14 17 22 C14 26 6 26 3 22 C0 14 4 6 10 0 Z"
                  fill="rgba(244, 180, 192, 0.72)"
                />
                <path
                  d="M10 2 C13 8 14 16 10 24"
                  stroke="rgba(226, 134, 155, 0.45)"
                  strokeWidth="0.8"
                  fill="none"
                />
              </svg>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="container-page relative z-10 w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] items-center gap-8 lg:gap-10 xl:gap-14">
          {/* Left Column: Editorial & Actions */}
          <div className="max-w-xl mx-auto lg:mx-0 w-full">
            {/* Eyebrow: MORE THAN A STORE — ❖ */}
            <motion.div
              className="flex items-center gap-2.5 text-xs uppercase tracking-[0.24em] text-[#8A6A52] font-semibold mb-3.5 sm:mb-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.1 }}
            >
              <span>MORE THAN A STORE</span>
              <span className="h-[1px] w-10 sm:w-12 bg-[#8A6A52]/50" />
              <span className="text-[10px] text-[#B78332]">❖</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] xl:text-[4.4rem] leading-[1.06] text-[#382015] tracking-tight font-normal"
              variants={headline}
              initial="hidden"
              animate="visible"
            >
              <span className="block overflow-hidden pb-[0.06em]">
                <motion.span variants={line} className="block">
                  Sacred Rituals.
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <motion.span variants={line} className="block">
                  Beautifully Prepared.
                </motion.span>
              </span>
            </motion.h1>

            {/* Subtitle / Lede */}
            <motion.p
              className="mt-3.5 sm:mt-5 text-[#5C3D2E] text-base sm:text-lg leading-relaxed max-w-lg font-normal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.55, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.35 }}
            >
              Authentic Puja Samagri. Curated with devotion.<br className="hidden sm:inline" />
              For a more peaceful, prosperous and mindful life.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.48 }}
            >
              <Link
                href="/shop"
                className="px-8 py-3.5 rounded-lg bg-[#5C341F] hover:bg-[#482816] text-[#FAF6F0] font-medium text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                Shop Now <ArrowRight className="w-4 h-4 text-[#E6C98A]" />
              </Link>
              <Link
                href="/kits"
                className="px-8 py-3.5 rounded-lg bg-[#F8F1E7]/90 hover:bg-[#F8F1E7] border border-[#8C6D53]/60 hover:border-[#5C341F] text-[#382015] font-medium text-sm sm:text-base flex items-center justify-center transition-all duration-300 shadow-sm backdrop-blur-sm"
              >
                Explore Puja Kits
              </Link>
            </motion.div>

            {/* Mobile Breathing Room to showcase the temple peacock scene */}
            <div className="h-[28vh] min-h-[160px] sm:h-[22vh] lg:hidden pointer-events-none" />

            {/* Trust Badges Row */}
            <motion.div
              className="mt-6 sm:mt-10 pt-4 flex items-center justify-between sm:justify-start gap-4 sm:gap-8 max-w-lg border-t border-[#8C6D53]/20 bg-[#FAF4EB]/70 sm:bg-transparent backdrop-blur-[2px] sm:backdrop-blur-none p-3 sm:p-0 rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.6 }}
            >
              {/* Badge 1: Authentic Products */}
              <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                <div className="w-8 h-8 flex items-center justify-center text-[#B78332]">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 3c1.5 3 4.5 6 4.5 9a4.5 4.5 0 0 1-9 0c0-3 3-6 4.5-9z" />
                    <path d="M12 12c-2.5-2-6-2-8 0 2 3.5 5 4.5 8 2z" />
                    <path d="M12 12c2.5-2 6-2 8 0-2 3.5-5 4.5-8 2z" />
                    <path d="M12 16c-3 1-6 3-8 5 3 0 6-.5 8-2z" />
                    <path d="M12 16c3 1 6 3 8 5-3 0-6-.5-8-2z" />
                  </svg>
                </div>
                <span className="text-xs font-serif text-[#382015] leading-tight font-medium">
                  Authentic<br />Products
                </span>
              </div>

              <div className="h-8 w-px bg-[#8C6D53]/25" />

              {/* Badge 2: Free Shipping Above ₹999 */}
              <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                <div className="w-8 h-8 flex items-center justify-center text-[#B78332]">
                  <Truck className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-serif text-[#382015] leading-tight font-medium">
                  Free Shipping<br />Above ₹999
                </span>
              </div>

              <div className="h-8 w-px bg-[#8C6D53]/25" />

              {/* Badge 3: Trusted by Devotees */}
              <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                <div className="w-8 h-8 flex items-center justify-center text-[#B78332]">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                </div>
                <span className="text-xs font-serif text-[#382015] leading-tight font-medium">
                  Trusted<br />by Devotees
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Desktop Tagline */}
          <div className="hidden lg:flex flex-col items-end justify-between h-full min-h-[460px] pointer-events-none select-none">
            {/* Top Right Tagline: A LITTLE MORE DIVINITY IN EVERY HOME — ❖ */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-right pt-2"
            >
              <p className="font-serif text-[11px] uppercase tracking-[0.28em] text-[#8A6A52] font-semibold leading-relaxed">
                A LITTLE MORE<br />DIVINITY<br />IN EVERY HOME
              </p>
              <div className="mt-2.5 flex items-center justify-end gap-2.5 text-[#8A6A52]/45">
                <span className="h-[1px] w-10 bg-[#8A6A52]/40" />
                <span className="text-[10px] text-[#B78332]">❖</span>
                <span className="h-[1px] w-10 bg-[#8A6A52]/40" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
