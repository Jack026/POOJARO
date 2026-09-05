/**
 * The motion vocabulary (§9, §10, §42, §43).
 *
 * One file so every animation on the site shares the same easing and timing.
 * Components import a variant from here instead of inventing durations, which is
 * what keeps a hundred small interactions feeling like one designed system
 * rather than a hundred separate decisions.
 *
 * The numbers mirror the CSS custom properties in globals.css. CSS transitions
 * and Motion animations must agree, or a card that lifts on hover in CSS and
 * reveals on scroll in JS will feel like two different products.
 */
import type { Transition, Variants } from 'motion/react';

/** cubic-bezier(0.22, 1, 0.36, 1) — the house easing. Decelerates, never bounces. */
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;
export const EASE_IN_OUT_SOFT = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
  fast: 0.16,
  base: 0.28,
  slow: 0.52,
  reveal: 0.72,
} as const;

export const transition = {
  fast: { duration: DURATION.fast, ease: EASE_OUT_SOFT },
  base: { duration: DURATION.base, ease: EASE_OUT_SOFT },
  slow: { duration: DURATION.slow, ease: EASE_OUT_SOFT },
  reveal: { duration: DURATION.reveal, ease: EASE_OUT_SOFT },
  /** For things that follow the pointer or a drag — spring, not duration. */
  spring: { type: 'spring', stiffness: 320, damping: 30, mass: 0.6 },
  springSoft: { type: 'spring', stiffness: 180, damping: 24, mass: 0.8 },
} satisfies Record<string, Transition>;

// ---------------------------------------------------------------------------
// Reveal variants
// ---------------------------------------------------------------------------

/** The default scroll reveal: 24px up, fading in (§10). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: transition.reveal },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.slow },
};

/** For imagery: settles from a slight over-scale, so it reads as a camera move. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.9, ease: EASE_OUT_SOFT } },
};

/**
 * Mask reveal — the image slides up behind a clip that opens (§43).
 * Apply to a wrapper with `overflow: hidden`; the child does the counter-move.
 */
export const maskReveal: Variants = {
  hidden: { clipPath: 'inset(100% 0% 0% 0%)' },
  visible: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.95, ease: EASE_OUT_QUART } },
};

/** Parent that staggers its children. `custom` sets the gap in seconds. */
export function stagger(gap = 0.08, delay = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: gap, delayChildren: delay } },
  };
}

/** A single line of a line-by-line text reveal (§43). Child of a clipped span. */
export const lineReveal: Variants = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 0.85, ease: EASE_OUT_QUART } },
};

// ---------------------------------------------------------------------------
// Overlay variants — modals, drawers, dropdowns
// ---------------------------------------------------------------------------

export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.base },
  exit: { opacity: 0, transition: transition.fast },
};

export const modalPop: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transition.base },
  exit: { opacity: 0, scale: 0.98, y: 8, transition: transition.fast },
};

export const sheetSlide = {
  right: {
    hidden: { x: '100%' },
    visible: { x: 0, transition: { duration: 0.36, ease: EASE_OUT_QUART } },
    exit: { x: '100%', transition: { duration: 0.26, ease: EASE_IN_OUT_SOFT } },
  },
  left: {
    hidden: { x: '-100%' },
    visible: { x: 0, transition: { duration: 0.36, ease: EASE_OUT_QUART } },
    exit: { x: '-100%', transition: { duration: 0.26, ease: EASE_IN_OUT_SOFT } },
  },
  bottom: {
    hidden: { y: '100%' },
    visible: { y: 0, transition: { duration: 0.36, ease: EASE_OUT_QUART } },
    exit: { y: '100%', transition: { duration: 0.26, ease: EASE_IN_OUT_SOFT } },
  },
  top: {
    hidden: { y: '-100%' },
    visible: { y: 0, transition: { duration: 0.36, ease: EASE_OUT_QUART } },
    exit: { y: '-100%', transition: { duration: 0.26, ease: EASE_IN_OUT_SOFT } },
  },
} satisfies Record<string, Variants>;

export type SheetSide = keyof typeof sheetSlide;

/**
 * When the visitor asks for reduced motion, replace a variant's movement with a
 * plain cross-fade rather than removing the animation.
 *
 * Stripping animation entirely is the usual mistake: an element whose hidden
 * state is `opacity: 0` would simply never appear. Every variant here keeps its
 * `hidden`/`visible` names and only loses the transform.
 */
export function calm(variants: Variants, reduced: boolean): Variants {
  if (!reduced) return variants;
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2, ease: 'linear' } },
    exit: { opacity: 0, transition: { duration: 0.15, ease: 'linear' } },
  };
}

/** Standard viewport trigger for scroll reveals: once, slightly before entry. */
export const inViewOnce = { once: true, amount: 0.25, margin: '0px 0px -80px 0px' } as const;
