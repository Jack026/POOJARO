'use client';

/**
 * Accordion (§17).
 *
 * The PDP's seven sections — About This Kit, What's Inside, How to Prepare, Who
 * Is It For, Shipping, Returns, Reviews — plus the FAQ.
 *
 * Built on a `<button>` inside a heading with `aria-expanded` and `aria-controls`
 * rather than `<details>`, because `<details>` cannot be height-animated
 * reliably across browsers and gives no control over the marker.
 *
 * `allowMultiple` defaults to true: a shopper comparing "What's Inside" against
 * "Shipping Information" should not have the first close when they open the
 * second.
 */
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';

import { cn } from '@/lib/cn';
import { EASE_OUT_SOFT } from '@/lib/motion';

export interface AccordionItem {
  id: string;
  title: string;
  /** Right-aligned hint in the header, e.g. "12 items". */
  meta?: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Ids open on first render. */
  defaultOpen?: string[];
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({ items, defaultOpen = [], allowMultiple = true, className }: AccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen);

  function toggle(id: string) {
    setOpen((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      return allowMultiple ? [...current, id] : [id];
    });
  }

  return (
    <div className={cn('divide-y divide-sand-deep/60 border-y border-sand-deep/60', className)}>
      {items.map((item) => (
        <AccordionRow key={item.id} item={item} open={open.includes(item.id)} onToggle={() => toggle(item.id)} />
      ))}
    </div>
  );
}

function AccordionRow({ item, open, onToggle }: { item: AccordionItem; open: boolean; onToggle: () => void }) {
  const reduced = useReducedMotion();
  const panelId = `accordion-panel-${item.id}`;
  const buttonId = `accordion-button-${item.id}`;

  return (
    <div>
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center gap-4 py-5 text-left transition-colors hover:text-gold-deep"
        >
          <span className="flex-1 font-sans text-sm font-medium tracking-[0.04em] text-brown uppercase">
            {item.title}
          </span>
          {item.meta && <span className="text-xs text-brown-muted">{item.meta}</span>}
          <Plus
            size={17}
            aria-hidden="true"
            className={cn(
              'shrink-0 text-brown-muted transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              open && 'rotate-45',
              'motion-reduce:transition-none',
            )}
          />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.34, ease: EASE_OUT_SOFT }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-[0.9375rem] leading-relaxed text-brown-soft">{item.content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
