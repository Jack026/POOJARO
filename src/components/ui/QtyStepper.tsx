'use client';

/**
 * Quantity stepper (§17, §25).
 *
 * The number is a real `<input type="number">`, not a label between two buttons:
 * changing 1 to 12 should not mean eleven taps. It commits on blur and on Enter,
 * and snaps back to the last valid value if what was typed is out of range.
 *
 * `max` is the smaller of the per-line cap and what is actually in stock, so the
 * control cannot be used to request more than exists (§58). The server checks
 * again regardless — this is a courtesy, not the guard (§53).
 */
import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface QtyStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /** Names what is being counted, e.g. "Ganesh Puja Kit". */
  itemLabel: string;
  className?: string;
}

const SIZES = {
  sm: { wrap: 'h-9', button: 'w-9', input: 'w-9 text-sm', icon: 13 },
  md: { wrap: 'h-11', button: 'w-11', input: 'w-11 text-base', icon: 15 },
} as const;

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  size = 'md',
  itemLabel,
  className,
}: QtyStepperProps) {
  const scale = SIZES[size];
  const [draft, setDraft] = useState(String(value));

  // Keep the text in step when the quantity changes elsewhere — a cart merge, a
  // stock correction, or the server clamping the line.
  useEffect(() => setDraft(String(value)), [value]);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  function commit() {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clamp(parsed);
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-sand-deep bg-ivory',
        'focus-within:border-gold-deep',
        scale.wrap,
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || atMin}
        className={cn(
          'grid h-full place-items-center rounded-l-md text-brown transition-colors',
          'hover:bg-sand-soft disabled:cursor-not-allowed disabled:text-brown-muted/50 disabled:hover:bg-transparent',
          scale.button,
        )}
      >
        <Minus size={scale.icon} aria-hidden="true" />
        <span className="sr-only">Decrease quantity of {itemLabel}</span>
      </button>

      <input
        type="number"
        inputMode="numeric"
        value={draft}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={`Quantity of ${itemLabel}`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
        className={cn(
          'tabular h-full border-x border-sand-deep bg-transparent text-center text-brown outline-none',
          // Spinner arrows would sit on top of our own buttons.
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          scale.input,
        )}
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || atMax}
        className={cn(
          'grid h-full place-items-center rounded-r-md text-brown transition-colors',
          'hover:bg-sand-soft disabled:cursor-not-allowed disabled:text-brown-muted/50 disabled:hover:bg-transparent',
          scale.button,
        )}
      >
        <Plus size={scale.icon} aria-hidden="true" />
        <span className="sr-only">Increase quantity of {itemLabel}</span>
      </button>
    </div>
  );
}
