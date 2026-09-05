'use client';

/**
 * Scroll reveals (§10).
 *
 * `<Reveal>` fades a block up as it enters the viewport, once. `<RevealGroup>`
 * staggers its `<Reveal>` children — put it round a grid and each card follows
 * the last.
 *
 * Under `prefers-reduced-motion` the movement is dropped but the element still
 * transitions from hidden to visible, so nothing is ever stranded invisible.
 */
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from 'motion/react';

import { calm, fadeIn, fadeUp, inViewOnce, maskReveal, scaleIn, stagger } from '@/lib/motion';

type RevealEffect = 'up' | 'fade' | 'scale' | 'mask';

const EFFECTS: Record<RevealEffect, Variants> = {
  up: fadeUp,
  fade: fadeIn,
  scale: scaleIn,
  mask: maskReveal,
};

/**
 * The element to render. Generic rather than fixed, because `<Reveal>` inside a
 * list must be an `<li>` and inside a page must be a `<section>` — wrapping a
 * grid item in a stray `<div>` breaks both the layout and the semantics.
 *
 * Props follow `as`, so `<Reveal as="li" value={2}>` type-checks and
 * `<Reveal as="div" value={2}>` does not.
 */
export type RevealTag = 'div' | 'section' | 'article' | 'li' | 'span' | 'header' | 'figure';

export type RevealProps<T extends RevealTag = 'div'> = Omit<
  HTMLMotionProps<T>,
  'variants' | 'initial' | 'whileInView'
> & {
  effect?: RevealEffect;
  delay?: number;
  /** Inside a `<RevealGroup>`, set false so the parent drives the timing. */
  standalone?: boolean;
  as?: T;
};

export function Reveal<T extends RevealTag = 'div'>({
  effect = 'up',
  delay = 0,
  standalone = true,
  as,
  children,
  ...rest
}: RevealProps<T>) {
  const reduced = useReducedMotion();
  const variants = calm(EFFECTS[effect], Boolean(reduced));
  // The union of motion components cannot be called with a union of prop types,
  // so the tag is resolved to a generic element type here. The public signature
  // above is what keeps call sites honest.
  const Component = motion[as ?? 'div'] as React.ElementType;

  return (
    <Component
      variants={variants}
      initial="hidden"
      // A standalone reveal watches the viewport itself; a grouped one inherits
      // `visible` from its parent, which is what produces the stagger.
      {...(standalone ? { whileInView: 'visible', viewport: inViewOnce } : {})}
      {...(delay > 0 ? { transition: { delay } } : {})}
      {...rest}
    >
      {children}
    </Component>
  );
}

export type RevealGroupTag = 'div' | 'section' | 'ul' | 'ol';

export type RevealGroupProps<T extends RevealGroupTag = 'div'> = Omit<
  HTMLMotionProps<T>,
  'variants' | 'initial' | 'whileInView'
> & {
  /** Seconds between children. */
  gap?: number;
  delay?: number;
  as?: T;
};

export function RevealGroup<T extends RevealGroupTag = 'div'>({
  gap = 0.08,
  delay = 0,
  as,
  children,
  ...rest
}: RevealGroupProps<T>) {
  const reduced = useReducedMotion();
  const Component = motion[as ?? 'div'] as React.ElementType;

  return (
    <Component
      variants={stagger(reduced ? 0 : gap, reduced ? 0 : delay)}
      initial="hidden"
      whileInView="visible"
      viewport={inViewOnce}
      {...rest}
    >
      {children}
    </Component>
  );
}
