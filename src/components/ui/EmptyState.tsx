/**
 * Empty and error states (§50).
 *
 * The brief specifies the wording for four of these, so the copy lives here as
 * named constants rather than being retyped at each call site — that is how
 * "Your ritual box is waiting to be filled" ends up as "Your cart is empty" on
 * one page out of five.
 *
 * Every state carries an action. A dead end with nothing to do next is the thing
 * these components exist to prevent.
 */
import Link from 'next/link';
import { PackageOpen, SearchX, ShoppingBag, WifiOff } from 'lucide-react';

import { cn } from '@/lib/cn';
import { buttonClasses } from './button-styles';
import { PeacockMini, LotusMandala, PeacockSingleFeather } from '@/components/peacock';

export const EMPTY_COPY = {
  cart: {
    title: 'Your ritual box is waiting to be filled.',
    body: 'Browse the kits, or tell us what you are preparing for and we will suggest one.',
  },
  search: {
    title: "We couldn't find that ritual essential.",
    body: 'Try a shorter phrase, check the spelling, or browse by occasion instead.',
  },
  unavailable: {
    title: 'This ritual essential is currently unavailable.',
    body: 'It may be back soon. In the meantime, these kits cover the same rituals.',
  },
  network: {
    title: 'Something interrupted the connection.',
    body: 'Nothing was lost. Try again, and if it keeps happening let us know.',
  },
  wishlist: {
    title: 'Nothing saved yet.',
    body: 'Tap the heart on anything you want to come back to.',
  },
  orders: {
    title: 'No orders yet.',
    body: 'When you place one, it will appear here with live tracking.',
  },
} as const;

export interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: React.ReactNode;
  action?: { href: string; label: string };
  /** For retries and other in-page actions. Rendered after `action`. */
  children?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export function EmptyState({ title, body, icon, action, children, size = 'md', className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        size === 'md' ? 'gap-4 px-6 py-16' : 'gap-3 px-4 py-10',
        className,
      )}
    >
      {icon && (
        <span className="flex items-center justify-center p-3 rounded-2xl bg-sand-soft/50 text-brown-muted">
          {icon}
        </span>
      )}
      <h2 className={size === 'md' ? 'text-display-sm' : 'font-display text-xl'}>{title}</h2>
      {body && <p className="max-w-sm text-sm text-brown-soft">{body}</p>}
      {(action || children) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {action && (
            <Link href={action.href} className={buttonClasses({ variant: 'primary' })}>
              {action.label}
            </Link>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

export function EmptyCart({ className }: { className?: string }) {
  return (
    <EmptyState
      className={className}
      icon={<LotusMandala variant="hanging" size={68} />}
      title={EMPTY_COPY.cart.title}
      body={EMPTY_COPY.cart.body}
      action={{ href: '/shop', label: 'Shop puja kits' }}
    >
      <Link href="/ritual-finder" className={buttonClasses({ variant: 'secondary' })}>
        Find my kit
      </Link>
    </EmptyState>
  );
}

export function EmptySearch({ query, className }: { query?: string; className?: string }) {
  return (
    <EmptyState
      className={className}
      icon={<SearchX size={22} aria-hidden="true" />}
      title={EMPTY_COPY.search.title}
      body={
        query
          ? `Nothing matched "${query}". Try a shorter phrase, or browse by occasion instead.`
          : EMPTY_COPY.search.body
      }
      action={{ href: '/shop', label: 'Browse all kits' }}
    />
  );
}

export function ProductUnavailable({ className }: { className?: string }) {
  return (
    <EmptyState
      className={className}
      icon={<PackageOpen size={22} aria-hidden="true" />}
      title={EMPTY_COPY.unavailable.title}
      body={EMPTY_COPY.unavailable.body}
      action={{ href: '/shop', label: 'See what is in stock' }}
    />
  );
}

/**
 * Network failure.
 *
 * `onRetry` is a callback rather than a page reload so a failed fetch can be
 * retried without losing whatever was already on screen.
 */
export function NetworkError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <EmptyState
      className={className}
      icon={<WifiOff size={22} aria-hidden="true" />}
      title={EMPTY_COPY.network.title}
      body={EMPTY_COPY.network.body}
    >
      {onRetry && (
        <button type="button" onClick={onRetry} className={buttonClasses({ variant: 'primary' })}>
          Try again
        </button>
      )}
    </EmptyState>
  );
}
