/**
 * Section heading — eyebrow, headline, supporting line, optional link.
 *
 * Every section on the site opens the same way, so the rhythm of the page comes
 * from one component rather than from remembering the same three classes
 * fourteen times (§63).
 *
 * `level` exists because heading order is not a styling decision: a section
 * inside a page that already has an `<h2>` needs an `<h3>`, at whatever size the
 * design calls for (§49).
 */
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  copy?: string;
  level?: 2 | 3;
  align?: 'left' | 'center';
  size?: 'md' | 'lg';
  link?: { href: string; label: string };
  className?: string;
  /** Forwarded to the root div so `aria-labelledby` can point to the heading. */
  id?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
  level = 2,
  align = 'left',
  size = 'md',
  link,
  className,
  id,
}: SectionHeadingProps) {
  const Heading = level === 2 ? 'h2' : 'h3';
  const centred = align === 'center';

  return (
    <div
      id={id}
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        centred && 'sm:flex-col sm:items-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centred && 'text-center')}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <Heading className={size === 'lg' ? 'text-display-lg' : 'text-display-md'}>{title}</Heading>
        {copy && (
          <p className={cn('mt-4 text-lede text-brown-soft', centred && 'mx-auto max-w-xl')}>{copy}</p>
        )}
      </div>

      {link && (
        <Link
          href={link.href}
          className="group inline-flex shrink-0 items-center gap-2 text-xs font-medium tracking-[0.12em] text-brown uppercase"
        >
          <span className="link-underline">{link.label}</span>
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          />
        </Link>
      )}
    </div>
  );
}

/** Thin rule that fades at both ends. */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('rule-fade', className)} role="presentation" />;
}
