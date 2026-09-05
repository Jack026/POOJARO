'use client';

/**
 * Tabs, following the WAI-ARIA tabs pattern (§49).
 *
 * Arrow keys move between tabs, Home and End jump to the ends, and only the
 * active tab is a tab stop — so Tab moves *out* of the tablist to the panel
 * rather than walking through every tab. That is what distinguishes a real tab
 * widget from a row of buttons.
 *
 * The active indicator is a shared `layoutId`, so it slides between tabs instead
 * of blinking from one to the next.
 */
import { useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/cn';
import { transition } from '@/lib/motion';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  /** Accessible name for the tablist, e.g. "Order sections". */
  label: string;
  className?: string;
}

export function Tabs({ items, defaultTab, label, className }: TabsProps) {
  const reduced = useReducedMotion();
  const groupId = useId();
  const [active, setActive] = useState(defaultTab ?? items[0]?.id ?? '');
  const refs = useRef(new Map<string, HTMLButtonElement>());

  function onKeyDown(event: React.KeyboardEvent) {
    const index = items.findIndex((item) => item.id === active);
    if (index < 0) return;

    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;

    event.preventDefault();
    const target = items[next];
    if (!target) return;
    setActive(target.id);
    refs.current.get(target.id)?.focus();
  }

  const activeItem = items.find((item) => item.id === active);

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="scrollbar-none flex gap-1 overflow-x-auto border-b border-sand-deep/60"
      >
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) refs.current.set(item.id, node);
                else refs.current.delete(item.id);
              }}
              role="tab"
              id={`${groupId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${groupId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              className={cn(
                'relative shrink-0 px-4 py-3 text-xs font-medium tracking-[0.1em] uppercase transition-colors',
                selected ? 'text-brown' : 'text-brown-muted hover:text-brown-soft',
              )}
            >
              {item.label}
              {item.count !== undefined && <span className="tabular ml-1.5 text-brown-muted">({item.count})</span>}
              {selected && (
                <motion.span
                  layoutId={reduced ? undefined : `${groupId}-indicator`}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brown"
                  transition={transition.base}
                />
              )}
            </button>
          );
        })}
      </div>

      {activeItem && (
        <div
          role="tabpanel"
          id={`${groupId}-panel-${activeItem.id}`}
          aria-labelledby={`${groupId}-tab-${activeItem.id}`}
          tabIndex={0}
          className="pt-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep"
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
