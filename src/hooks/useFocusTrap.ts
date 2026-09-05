'use client';

/**
 * Focus management for modal overlays (§49).
 *
 * A dialog that does not trap focus is a dialog a keyboard user can tab straight
 * out of, into a page they cannot see and cannot reach with the mouse. This hook
 * does the three things WAI-ARIA requires:
 *
 *  - moves focus into the dialog on open,
 *  - keeps Tab and Shift+Tab cycling inside it,
 *  - returns focus to whatever opened it on close.
 *
 * Focusable elements are re-queried on every Tab rather than cached, because a
 * dialog's contents change — a coupon field appears, a button becomes disabled —
 * and a stale list would send focus to something that is no longer there.
 */
import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Prefer the first real control; fall back to the panel itself, which
    // carries tabIndex={-1} so it can hold focus without being a tab stop.
    const initial = focusableWithin(container)[0] ?? container;
    // A frame's delay lets the open animation start before focus scrolls the
    // element into view, which otherwise fights the transform.
    const raf = requestAnimationFrame(() => initial.focus({ preventScroll: true }));

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !container) return;
      const items = focusableWithin(container);
      if (items.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      const current = document.activeElement;
      if (event.shiftKey && (current === first || current === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      // Guard against restoring focus to a node that has since been removed —
      // focusing a detached element silently sends focus to <body>.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [ref, active]);
}
