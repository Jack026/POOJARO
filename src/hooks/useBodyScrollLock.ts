'use client';

/**
 * Body scroll lock for overlays.
 *
 * Two details that are easy to get wrong and very visible when you do:
 *
 *  1. Hiding the scrollbar changes the viewport width, so the page jumps left.
 *     The gap is replaced with equivalent padding.
 *  2. iOS Safari ignores `overflow: hidden` on <body>. Position-fixing the body
 *     and restoring the scroll offset on release is the only reliable fix.
 *
 * A counter means two overlays open at once (a modal over a drawer) release the
 * lock once, not on the first close.
 */
import { useEffect } from 'react';

let lockCount = 0;
let saved: { overflow: string; paddingRight: string; position: string; top: string; width: string } | null = null;
let savedScrollY = 0;

function lock() {
  lockCount += 1;
  if (lockCount > 1) return;

  const body = document.body;
  savedScrollY = window.scrollY;
  saved = {
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
    position: body.style.position,
    top: body.style.top,
    width: body.style.width,
  };

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarWidth > 0) {
    const existing = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${existing + scrollbarWidth}px`;
  }

  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.width = '100%';
}

function release() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0 || !saved) return;

  const body = document.body;
  body.style.overflow = saved.overflow;
  body.style.paddingRight = saved.paddingRight;
  body.style.position = saved.position;
  body.style.top = saved.top;
  body.style.width = saved.width;
  saved = null;

  // Restore instantly — a smooth scroll here would animate the page back into
  // place after the overlay has already gone, which reads as a glitch.
  window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
}

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    lock();
    return release;
  }, [active]);
}
