'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

import { useHasFinePointer, useMediaQuery } from '@/hooks/useMediaQuery';

/** A deliberately quiet desktop-only cursor accent (§45). */
export function CustomCursor() {
  const hasFinePointer = useHasFinePointer();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 700, damping: 42, mass: 0.18 });
  const springY = useSpring(y, { stiffness: 700, damping: 42, mass: 0.18 });

  useEffect(() => {
    if (!hasFinePointer || reducedMotion) return;
    const move = (event: PointerEvent) => { x.set(event.clientX); y.set(event.clientY); };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [hasFinePointer, reducedMotion, x, y]);

  if (!hasFinePointer || reducedMotion) return null;
  return <motion.span aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[100] hidden h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-deep/60 bg-gold/10 md:block" style={{ x: springX, y: springY }} />;
}
