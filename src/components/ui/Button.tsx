'use client';

/**
 * Button (§42).
 *
 * Three things it does that a styled `<button>` does not:
 *
 *  1. `loading` — swaps the label for a spinner, disables the control and marks
 *     it `aria-busy`, so a double-tap cannot submit an order twice.
 *  2. `magnetic` — the CTA leans towards the cursor. Desktop pointers only, and
 *     off entirely under `prefers-reduced-motion`.
 *  3. A press response that is scale, not colour, so it reads on every variant.
 *
 * For a link that merely *looks* like a button, use `buttonClasses()` on a
 * `<Link>` in a server component instead — no JavaScript required.
 */
import { forwardRef, useCallback, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from 'motion/react';

import { cn } from '@/lib/cn';
import { transition } from '@/lib/motion';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-styles';

/**
 * Props extend `HTMLMotionProps`, not React's own button props: Motion
 * repurposes `onDrag` and friends for gesture callbacks with different
 * signatures, and mixing the two produces an unresolvable conflict.
 */
export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  /** Replaces the label while `loading`. Announced to screen readers. */
  loadingLabel?: string;
  /** Pull towards the pointer on hover. Reserve for hero and checkout CTAs. */
  magnetic?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

/** How far the button may travel towards the cursor, in pixels. */
const MAGNET_RANGE = 6;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    fullWidth,
    loading = false,
    loadingLabel = 'Working…',
    magnetic = false,
    iconLeft,
    iconRight,
    className,
    children,
    disabled,
    type = 'button',
    onPointerMove,
    onPointerLeave,
    ...rest
  },
  forwardedRef,
) {
  const reduced = useReducedMotion();
  const localRef = useRef<HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, transition.spring);
  const springY = useSpring(y, transition.spring);

  const magnetActive = magnetic && !reduced;

  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerMove?.(event);
      // Coarse pointers have no hover: a "magnetic" tap would just look like drift.
      if (!magnetActive || event.pointerType !== 'mouse') return;
      const node = localRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      x.set(Math.max(-1, Math.min(1, dx)) * MAGNET_RANGE);
      y.set(Math.max(-1, Math.min(1, dy)) * MAGNET_RANGE);
    },
    [magnetActive, onPointerMove, x, y],
  );

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(event);
      x.set(0);
      y.set(0);
    },
    [onPointerLeave, x, y],
  );

  return (
    <motion.button
      ref={setRefs}
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={magnetActive ? { x: springX, y: springY } : undefined}
      whileTap={reduced ? undefined : { scale: 0.975 }}
      transition={transition.fast}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          {iconLeft}
          {children}
          {iconRight}
        </>
      )}
    </motion.button>
  );
});

/**
 * Inline spinner.
 *
 * A bare SVG rather than an icon import: this renders inside every pending
 * button on the site, and it should not depend on an icon library being loaded.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-4 w-4 animate-spin motion-reduce:animate-none', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
