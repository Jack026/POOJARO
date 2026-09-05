'use client';

/**
 * The shared overlay shell behind `<Modal>` and `<Sheet>`.
 *
 * Everything both need and neither should reimplement: a portal to <body>, a
 * backdrop that closes on click, Escape to dismiss, a scroll lock, a focus trap,
 * and the `role="dialog" aria-modal="true"` markup screen readers expect (§49).
 *
 * Exit animations are why this uses `AnimatePresence` rather than an early
 * return — unmounting immediately would make every overlay vanish instead of
 * closing.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';

import { cn } from '@/lib/cn';
import { calm, overlayFade } from '@/lib/motion';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface OverlayProps {
  open: boolean;
  onClose: () => void;
  /** Motion variants for the panel itself. The backdrop always cross-fades. */
  panelVariants: Variants;
  panelClassName?: string;
  /** Positions the panel within the fixed layer — centred, or pinned to an edge. */
  containerClassName?: string;
  /** Accessible name. Pass `labelledBy` instead when a visible heading exists. */
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  /** Set false for overlays that must be dismissed deliberately, e.g. mid-payment. */
  dismissible?: boolean;
  children: React.ReactNode;
}

export function Overlay({
  open,
  onClose,
  panelVariants,
  panelClassName,
  containerClassName,
  label,
  labelledBy,
  describedBy,
  dismissible = true,
  children,
}: OverlayProps) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Portals need a DOM to target, so nothing renders during SSR. The overlay is
  // always opened by an interaction, so there is no first-paint content to lose.
  useEffect(() => setMounted(true), []);

  useBodyScrollLock(open);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open || !dismissible) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, dismissible, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-100 flex', containerClassName)}>
          <motion.div
            className="absolute inset-0 bg-charcoal/45 backdrop-blur-[2px]"
            variants={overlayFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={dismissible ? onClose : undefined}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={labelledBy ? undefined : label}
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            tabIndex={-1}
            className={cn('relative outline-none', panelClassName)}
            variants={calm(panelVariants, Boolean(reduced))}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Generates the id pair a dialog needs to wire up its heading and description. */
export function useDialogIds(): { titleId: string; descriptionId: string } {
  const id = useId();
  return { titleId: `${id}-title`, descriptionId: `${id}-description` };
}
