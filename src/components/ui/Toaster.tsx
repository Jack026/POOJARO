'use client';

/**
 * Toaster — renders the queue from `toast-store`.
 *
 * Mounted once in the root layout. Bottom-right on desktop; top-centre on
 * phones, clear of the thumb zone and of any bottom sheet that may be open.
 *
 * Accessibility: the region is `aria-live="polite"` so a toast is announced
 * without interrupting, and the auto-dismiss timer pauses on hover and on focus
 * — otherwise a toast carrying a "View cart" link could disappear while someone
 * was tabbing towards it.
 */
import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, Check, Info, X } from 'lucide-react';

import { cn } from '@/lib/cn';
import { transition } from '@/lib/motion';
import { useToastStore, type Toast, type ToastTone } from './toast-store';

const TONE_ICON: Record<ToastTone, React.ReactNode> = {
  default: null,
  success: <Check size={14} strokeWidth={2.5} aria-hidden="true" />,
  error: <AlertCircle size={14} strokeWidth={2.5} aria-hidden="true" />,
  info: <Info size={14} strokeWidth={2.5} aria-hidden="true" />,
};

const TONE_BADGE: Record<ToastTone, string> = {
  default: 'bg-sand text-brown',
  success: 'bg-success text-ivory',
  error: 'bg-danger text-ivory',
  info: 'bg-info text-ivory',
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-200 flex flex-col gap-2',
        'inset-x-3 top-3 items-center',
        'sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:items-end',
      )}
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => (
          <ToastCard key={item.id} toast={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast: item }: { toast: Toast }) {
  const reduced = useReducedMotion();
  const dismiss = useToastStore((state) => state.dismiss);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => dismiss(item.id), [dismiss, item.id]);

  const start = useCallback(() => {
    if (item.duration === null) return;
    timer.current = setTimeout(close, item.duration);
  }, [item.duration, close]);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return (
    <motion.div
      layout={!reduced}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
      transition={transition.base}
      // Pause the countdown while the shopper is reading or reaching for a link.
      onMouseEnter={stop}
      onMouseLeave={start}
      onFocusCapture={stop}
      onBlurCapture={start}
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border border-sand-deep/70',
        'bg-ivory shadow-lift',
      )}
    >
      <div className="flex gap-3 p-3.5">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.imageAlt ?? ''}
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-md bg-sand-soft object-cover"
          />
        ) : (
          item.tone !== 'default' && (
            <span
              className={cn(
                'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                TONE_BADGE[item.tone],
              )}
            >
              {TONE_ICON[item.tone]}
            </span>
          )
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brown">{item.title}</p>
          {item.description && <p className="mt-0.5 text-xs text-brown-soft">{item.description}</p>}

          {item.actions && item.actions.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              {item.actions.map((action) =>
                action.href ? (
                  <Link
                    key={action.label}
                    href={action.href}
                    onClick={close}
                    className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-gold-deep link-underline"
                  >
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      action.onClick?.();
                      close();
                    }}
                    className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-brown-muted link-underline"
                  >
                    {action.label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={close}
          className="-mt-1 -mr-1 h-8 w-8 shrink-0 rounded-md text-brown-muted transition-colors hover:bg-sand-soft hover:text-brown"
        >
          <X size={15} className="mx-auto" aria-hidden="true" />
          <span className="sr-only">Dismiss</span>
        </button>
      </div>
    </motion.div>
  );
}
