/**
 * Button styling, as a pure function.
 *
 * Kept apart from the component so a server component can put button styling on
 * a `<Link>` without pulling the client bundle in with it — the reason most of
 * the site's navigation costs nothing in JavaScript (§48).
 */
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'relative inline-flex items-center justify-center gap-2 select-none whitespace-nowrap ' +
  'font-medium tracking-[0.08em] uppercase transition-[background-color,color,border-color,box-shadow,transform] ' +
  'duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'disabled:cursor-not-allowed disabled:opacity-45 disabled:pointer-events-none';

const VARIANTS: Record<ButtonVariant, string> = {
  // Deep brown on ivory. The one button on a page that must be pressed.
  primary: 'bg-brown text-ivory hover:bg-charcoal shadow-subtle hover:shadow-lift active:shadow-subtle',
  // Hairline outline. Sits beside primary without competing with it.
  secondary: 'bg-transparent text-brown border border-sand-deep hover:border-brown hover:bg-sand-soft/60',
  // No chrome until you touch it. For toolbars and card overlays.
  ghost: 'bg-transparent text-brown hover:bg-sand-soft',
  // Text that behaves like a button — "Continue shopping", "Clear filters".
  quiet: 'bg-transparent text-brown-soft hover:text-brown underline-offset-4 hover:underline px-0',
  danger: 'bg-danger text-ivory hover:brightness-110 shadow-subtle',
  // Reserved for one accent CTA per page, never two.
  gold: 'bg-gold text-brown hover:bg-gold-deep hover:text-ivory shadow-subtle hover:shadow-glow',
};

const SIZES: Record<ButtonSize, string> = {
  // 40px tall — the smallest we allow, and only where a 44px touch target is
  // provided by surrounding padding (§61).
  sm: 'h-10 px-4 text-[0.6875rem] rounded-md',
  md: 'h-12 px-6 text-xs rounded-md',
  lg: 'h-14 px-8 text-[0.8125rem] rounded-md',
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
}

/** Square icon-only button. Always 44px so it is a legal touch target on its own. */
export function iconButtonClasses(className?: string): string {
  return cn(
    'inline-flex h-11 w-11 items-center justify-center rounded-md text-brown',
    'transition-colors duration-[160ms] hover:bg-sand-soft active:bg-sand',
    'disabled:opacity-45 disabled:pointer-events-none',
    className,
  );
}
