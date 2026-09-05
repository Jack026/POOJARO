'use client';

/**
 * Form controls (§49).
 *
 * Every field goes through `<Field>`, which owns the label/hint/error wiring:
 * the label is always a real `<label for>`, hints and errors are joined into
 * `aria-describedby`, and an invalid field carries `aria-invalid`. Doing this
 * once is the only reliable way to keep a checkout form accessible — done per
 * field, one of them always ends up with a placeholder for a label.
 *
 * Errors are announced with `role="alert"` so a validation failure on submit is
 * heard, not just seen.
 */
import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-md border bg-ivory px-3.5 text-brown transition-colors duration-[160ms] ' +
  'placeholder:text-brown-muted/70 ' +
  'disabled:cursor-not-allowed disabled:bg-sand-soft/60 disabled:text-brown-muted';

const CONTROL_OK = 'border-sand-deep hover:border-brown-muted focus:border-gold-deep';
const CONTROL_BAD = 'border-danger hover:border-danger focus:border-danger';

function controlClasses(invalid: boolean, className?: string): string {
  return cn(CONTROL, invalid ? CONTROL_BAD : CONTROL_OK, className);
}

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------

export interface FieldProps {
  label: string;
  /** Hide the label visually — only when the context makes it unmistakable. */
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /** Receives the ids it must attach to the control. */
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
    'aria-required': boolean | undefined;
  }) => React.ReactNode;
}

export function Field({ label, hideLabel, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={cn(
          'text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-brown-soft',
          hideLabel && 'sr-only',
        )}
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-1 text-gold-deep">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-brown-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

/**
 * `leading`, not `prefix`: `prefix` is a real (if archaic) HTML attribute typed
 * as `string`, so reusing the name would collide with the DOM props.
 */
export interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  invalid?: boolean;
  /** Icon or unit rendered inside the field, e.g. a rupee sign or a search glyph. */
  leading?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, leading, className, ...rest },
  ref,
) {
  if (!leading) {
    return <input ref={ref} className={cn(controlClasses(invalid), 'h-12', className)} {...rest} />;
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-brown-muted">
        {leading}
      </span>
      <input ref={ref} className={cn(controlClasses(invalid), 'h-12 pl-10', className)} {...rest} />
    </div>
  );
});

export interface TextareaProps extends React.ComponentPropsWithoutRef<'textarea'> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className, rows = 4, ...rest },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(controlClasses(invalid), 'py-3', className)} {...rest} />;
});

export interface SelectProps extends React.ComponentPropsWithoutRef<'select'> {
  invalid?: boolean;
}

/**
 * Native `<select>` with our own chevron.
 *
 * Deliberately not a custom listbox: the native control gets keyboard search,
 * mobile wheel pickers and screen-reader support for free, and a state dropdown
 * with 36 entries is exactly where that matters (§51).
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(controlClasses(invalid), 'h-12 cursor-pointer appearance-none pr-10', className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-brown-muted"
      />
    </div>
  );
});

export interface CheckboxProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'type'> {
  label: React.ReactNode;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, id: providedId, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    // 44px minimum row height so the whole label is a legal touch target (§61).
    <label htmlFor={id} className={cn('flex min-h-11 cursor-pointer items-start gap-3 py-1.5', className)}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={cn(
          'mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 cursor-pointer appearance-none rounded-xs',
          'border border-sand-deep bg-ivory transition-colors',
          'checked:border-brown checked:bg-brown',
          "checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23FAF8F3' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 8.5l3.2 3.2L13 5'/%3E%3C/svg%3E\")] checked:bg-center checked:bg-no-repeat",
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        {...rest}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-brown">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-brown-muted">{description}</span>}
      </span>
    </label>
  );
});

export interface RadioCardProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'type'> {
  label: string;
  description?: string;
  /** Right-aligned content — a price, a delivery estimate, a payment logo. */
  meta?: React.ReactNode;
}

/**
 * A radio rendered as a selectable card. Used for delivery options, payment
 * methods and the Ritual Finder's answers.
 *
 * The real `<input>` stays in the DOM (screen-reader-only, not `display: none`)
 * so arrow-key group navigation and form semantics keep working; the card is
 * styled from its `:checked` state with `peer-checked`.
 */
export const RadioCard = forwardRef<HTMLInputElement, RadioCardProps>(function RadioCard(
  { label, description, meta, className, id: providedId, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className={cn('relative', className)}>
      <input ref={ref} id={id} type="radio" className="peer sr-only" {...rest} />
      <label
        htmlFor={id}
        className={cn(
          'flex min-h-16 cursor-pointer items-center gap-4 rounded-lg border border-sand-deep bg-ivory px-4 py-3.5',
          'transition-[border-color,background-color,box-shadow] duration-[200ms]',
          'hover:border-brown-muted',
          'peer-checked:border-brown peer-checked:bg-sand-soft/50 peer-checked:shadow-subtle',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-deep',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          // `peer-checked:` only reaches siblings of the input, and the dot is a
          // descendant of this label — so the checked styling has to be written
          // from here, descending into it.
          'peer-checked:[&_.radio-dot]:border-brown peer-checked:[&_.radio-dot]:after:scale-100',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'radio-dot grid h-[1.125rem] w-[1.125rem] shrink-0 place-items-center rounded-full',
            'border border-sand-deep transition-colors',
            "after:h-2 after:w-2 after:scale-0 after:rounded-full after:bg-brown after:content-['']",
            'after:transition-transform after:duration-[200ms] after:ease-[cubic-bezier(0.22,1,0.36,1)]',
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-brown">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-brown-soft">{description}</span>}
        </span>
        {meta && <span className="shrink-0 text-sm text-brown-soft">{meta}</span>}
      </label>
    </div>
  );
});
