/**
 * Badge — a small status or category chip.
 *
 * Restrained on purpose: the brief warns against a pill-covered interface (§7),
 * so there are six tones and no size options. Anything that needs to be louder
 * than this is a heading, not a badge.
 */
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'gold' | 'success' | 'danger' | 'info' | 'solid';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-sand-soft text-brown-soft',
  gold: 'bg-gold-wash text-gold-deep',
  success: 'bg-success-wash text-success',
  danger: 'bg-danger-wash text-danger',
  info: 'bg-info-wash text-info',
  solid: 'bg-brown text-ivory',
};

export interface BadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-xs px-2 py-1',
        'text-[0.625rem] font-medium uppercase tracking-[0.12em]',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
