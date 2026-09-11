'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from 'motion/react';
import { ArrowRight, RefreshCw, ShieldCheck, Sparkles, Truck } from 'lucide-react';

import { buttonClasses } from '@/components/ui/button-styles';
import { Photo } from '@/components/ui/Photo';
import { PeacockMaster } from '@/components/peacock';
import { cn } from '@/lib/cn';
import { EASE_OUT_QUART, EASE_OUT_SOFT } from '@/lib/motion';
import { useHasFinePointer, useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * The homepage hero — the one brown "stage" on the page (§5).
 *
 * The composition is a lit altar seen through a portal: the brass thali sits in
 * a circle of its own warm light, ringed by a slow gold orbit, with a few
 * samagri medallions floating around it. Everything expensive to watch — the
 * orbit, the float, the pointer parallax, the rising embers — is a progressive
 * enhancement that only switches on for a fine pointer and never for someone who
 * asked for reduced motion (§42, §49). The server and first client paint render
 * the calm, still version, so there is no layout shift and no hydration flash.
 */

/** Rising embers around the diya. Deterministic (no Math.random) so the array is
 *  identical every render; it is only mounted client-side, past reduced-motion. */
const EMBERS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: 8 + ((i * 53) % 84), // 8–92% across the portal box
  size: 2 + (i % 3), // 2–4px
  delay: (i % 6) * 0.8, // 0–4s
  duration: 6 + (i % 4) * 1.5, // 6–10.5s
  drift: (i % 2 ? 1 : -1) * (6 + (i % 3) * 5), // horizontal sway
  rise: 90 + (i % 4) * 35, // 90–195px climb
  startBottom: 18 + (i % 5) * 9, // 18–54% up from the base
}));

export function Hero() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const finePointer = useHasFinePointer();
  const [mounted, setMounted] = useState(false);

  // Both hooks report `false` on the server and on the first client render, so
  // parallax and embers begin off and enable after mount — never mid-paint.
  useEffect(() => setMounted(true), []);
  const parallax = mounted && finePointer && !reduced;

  // Normalised pointer position (−0.5…0.5), spring-smoothed so the scene lags
  // the cursor like something with weight rather than snapping to it.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 90, damping: 18, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 90, damping: 18, mass: 0.5 });

  // Depth layers: the closer something reads, the more it travels.
  const portalX = useTransform(sx, (v) => v * 36);
  const portalY = useTransform(sy, (v) => v * 36);
  const glowX = useTransform(sx, (v) => v * -24); // behind, so it drifts opposite
  const glowY = useTransform(sy, (v) => v * -24);

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

  // Masked line-by-line headline (§43): each line rises out of a clip. Reduced
  // motion keeps the reveal but swaps the travel for a plain fade.
  const headline: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : 0.12,
        delayChildren: reduced ? 0 : 0.28,
      },
    },
  };
  const line: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.25 } } }
    : { hidden: { y: '118%' }, visible: { y: '0%', transition: { duration: 0.9, ease: EASE_OUT_QUART } } };

  return (
    <section
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className="relative isolate flex min-h-[88vh] items-center overflow-hidden bg-brown py-24 text-ivory lg:min-h-[92vh] lg:py-20"
    >
      {/* --- Background stage ------------------------------------------------ */}
      {/* Depth vignette: brown deepens to charcoal at the edges so the centre
          reads as lit and the section has a horizon. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_70%_35%,transparent_35%,rgb(36_32_29/0.55)_100%)]"
      />
      <div aria-hidden className="texture-paper pointer-events-none absolute inset-0 -z-10 opacity-50" />

      <div className="container-page relative z-10 w-full">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* --- Editorial column ------------------------------------------- */}
          <div className="max-w-xl">
            {/* Eyebrow */}
            <motion.div
              className="mb-7 flex items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.15 }}
            >
              <span aria-hidden className="h-px w-8 bg-gold-soft/60" />
              <span className="inline-flex items-center gap-1.5 eyebrow text-gold-soft">
                <Sparkles aria-hidden className="h-3.5 w-3.5" />
                Authentic Puja Samagri
              </span>
            </motion.div>

            {/* Headline — masked line reveal. The explicit text-ivory is load-
                bearing: globals.css sets `h1 { color: brown }` in the base layer,
                and on this brown stage the heading would blend into it without a
                utility-layer colour to override that. The accent word keeps its
                own gold. */}
            <motion.h1
              className="font-display text-display-xl leading-[0.95] text-ivory"
              variants={headline}
              initial="hidden"
              animate="visible"
            >
              <span className="block overflow-hidden pb-[0.08em]">
                <motion.span variants={line} className="block">
                  Every Ritual.
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.08em]">
                <motion.span variants={line} className="block">
                  <span className="font-display italic text-gold-soft">Everything</span> You Need.
                </motion.span>
              </span>
            </motion.h1>

            {/* Lede */}
            <motion.p
              className="mt-7 max-w-md text-lede text-sand-soft"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.55, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.6 }}
            >
              Authentic puja samagri and thoughtfully prepared ritual kits — brought together for the
              moments that matter.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.72 }}
            >
              {/* Gold on brown: the one accent CTA the page is allowed (§7). */}
              <Link href="/kits" className={buttonClasses({ variant: 'gold', size: 'lg' })}>
                Shop Puja Kits
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
              {/* Secondary re-skinned for the dark stage — the default outline is
                  tuned for ivory and would vanish here. */}
              <Link
                href="/ritual-finder"
                className={buttonClasses({
                  variant: 'secondary',
                  size: 'lg',
                  className:
                    'border-ivory/25 bg-transparent text-ivory hover:border-ivory/55 hover:bg-ivory/10',
                })}
              >
                Find Your Ritual
              </Link>
            </motion.div>

            {/* Trust row */}
            <motion.ul
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-sand-soft"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.9 }}
            >
              {[
                { Icon: Truck, label: 'Pan-India delivery' },
                { Icon: ShieldCheck, label: 'Secure checkout' },
                { Icon: RefreshCw, label: 'Easy returns' },
              ].map(({ Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <Icon aria-hidden className="h-4 w-4 text-gold-soft" />
                  {label}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* --- Portal column ---------------------------------------------- */}
          <div className="relative mx-auto aspect-square w-[min(78vw,20rem)] lg:w-full lg:max-w-[34rem]">
            {/* Bleed glow — larger than the portal and unclipped, so the light
                spills past the frame onto the brown. */}
            <motion.div
              aria-hidden
              className="glow-diya absolute -inset-[20%] -z-10 blur-2xl"
              style={parallax ? { x: glowX, y: glowY } : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0.01 : 1.4, ease: EASE_OUT_SOFT }}
            />

            {/* Signature POOJARO Indian Mehendi Peacock Master Artwork */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-[28%] lg:-inset-[36%] -z-10 flex items-center justify-center overflow-visible"
              style={parallax ? { x: glowX, y: glowY } : undefined}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 0.88, scale: 1 }}
              transition={{ duration: reduced ? 0.01 : 1.6, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.2 }}
            >
              <PeacockMaster
                variant="gold-on-dark"
                className="w-[145%] h-[145%] max-w-none transform -rotate-6 md:-rotate-3 drop-shadow-[0_4px_24px_rgba(183,131,50,0.22)]"
              />
            </motion.div>

            {/* Slow gold orbit — a hairline ring that turns forever. Purely
                decorative, and stilled for reduced motion. */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-[6%] rounded-full border border-dashed border-gold-soft/20"
              animate={parallax || !reduced ? { rotate: 360 } : undefined}
              transition={{ duration: 64, ease: 'linear', repeat: Infinity }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-[1.5%] rounded-full border border-gold-soft/15"
            />

            {/* The portal itself */}
            <motion.div
              className="absolute inset-0"
              style={parallax ? { x: portalX, y: portalY } : undefined}
            >
              <motion.div
                className="relative h-full w-full"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduced ? 0.01 : 1, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.2 }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full bg-sand-soft shadow-overlay ring-1 ring-gold-soft/40">
                  {/* Photo carries its own width/height from the manifest, so it
                      is sized with h-full/w-full + object-cover rather than
                      `fill` (which next/image rejects alongside dimensions). */}
                  <Photo
                    name="hero-thali"
                    sizes="(min-width: 1024px) 34vw, 78vw"
                    priority
                    className="h-full w-full scale-[1.03] object-cover"
                  />
                  {/* Warm lamp bloom over the centre, flickering like a flame. */}
                  <div aria-hidden className="glow-diya animate-flicker absolute inset-0 opacity-60" />
                  {/* Grounding vignette + inner rim highlight. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-gradient-to-t from-brown/45 via-transparent to-transparent"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full ring-1 ring-inset ring-ivory/10"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Floating samagri medallions */}
            <Medallion
              name="sam-marigold"
              className="right-[2%] top-[-2%] h-24 w-24 md:h-28 md:w-28"
              sizeHint="128px"
              sx={sx}
              sy={sy}
              depth={80}
              parallax={parallax}
              reduced={reduced}
              delay={0.0}
              floatY={-12}
              floatDuration={6.5}
            />
            <Medallion
              name="sam-kumkum"
              className="bottom-[4%] left-[-5%] h-20 w-20 md:h-24 md:w-24"
              sizeHint="112px"
              sx={sx}
              sy={sy}
              depth={112}
              parallax={parallax}
              reduced={reduced}
              delay={0.12}
              floatY={14}
              floatDuration={7.5}
            />
            <Medallion
              name="sam-diya-brass"
              className="bottom-[20%] right-[-7%] h-16 w-16 md:h-20 md:w-20"
              sizeHint="96px"
              sx={sx}
              sy={sy}
              depth={64}
              parallax={parallax}
              reduced={reduced}
              delay={0.24}
              floatY={-10}
              floatDuration={8}
            />

            {/* Rising embers — client-only, and only past reduced motion. */}
            {mounted && !reduced && (
              <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-visible">
                {EMBERS.map((e) => (
                  <motion.span
                    key={e.id}
                    className="absolute rounded-full bg-gold-soft/70 blur-[0.5px]"
                    style={{
                      left: `${e.left}%`,
                      bottom: `${e.startBottom}%`,
                      width: e.size,
                      height: e.size,
                    }}
                    initial={{ opacity: 0, y: 0, x: 0 }}
                    animate={{ opacity: [0, 0.8, 0], y: [0, -e.rise], x: [0, e.drift] }}
                    transition={{
                      duration: e.duration,
                      delay: e.delay,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll cue — a gold segment sliding down a hairline. Desktop only. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-6 z-10 hidden justify-center lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0.01 : 0.6, delay: reduced ? 0 : 1.1 }}
      >
        <div className="flex flex-col items-center gap-2 text-sand-soft/70">
          <span className="text-[0.625rem] uppercase tracking-[0.25em]">Explore</span>
          <span className="relative block h-9 w-px overflow-hidden bg-ivory/15">
            <motion.span
              className="absolute inset-x-0 top-0 block h-3 bg-gold-soft"
              animate={reduced ? undefined : { y: [-12, 36] }}
              transition={reduced ? undefined : { duration: 1.9, ease: 'easeInOut', repeat: Infinity }}
            />
          </span>
        </div>
      </motion.div>
    </section>
  );
}

/**
 * A small circular samagri photo that floats near the portal.
 *
 * Three transforms are deliberately kept on three separate elements so they
 * never fight over the same property: the outer wrapper carries pointer
 * parallax (translate via motion values), the middle wrapper carries the
 * continuous float (an animated `y` loop), and the inner element carries the
 * one-shot entrance (opacity + scale). Reduced motion drops the first two and
 * collapses the third.
 */
function Medallion({
  name,
  className,
  sizeHint,
  sx,
  sy,
  depth,
  parallax,
  reduced,
  delay,
  floatY,
  floatDuration,
}: {
  name: string;
  className?: string;
  sizeHint: string;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  depth: number;
  parallax: boolean;
  reduced: boolean;
  delay: number;
  floatY: number;
  floatDuration: number;
}) {
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);

  return (
    <motion.div className={cn('absolute', className)} style={parallax ? { x, y } : undefined}>
      <motion.div
        className="h-full w-full"
        animate={reduced ? undefined : { y: [0, floatY, 0] }}
        transition={
          reduced ? undefined : { duration: floatDuration, ease: 'easeInOut', repeat: Infinity, delay }
        }
      >
        <motion.div
          className="relative h-full w-full overflow-hidden rounded-full bg-sand-soft shadow-lift ring-1 ring-gold-soft/30"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0.01 : 0.7, ease: EASE_OUT_SOFT, delay: reduced ? 0 : 0.7 + delay }}
        >
          <Photo name={name} sizes={sizeHint} className="h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-0 rounded-full ring-1 ring-inset ring-ivory/15" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
