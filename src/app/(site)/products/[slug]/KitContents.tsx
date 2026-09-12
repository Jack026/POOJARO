'use client';

import { motion } from 'motion/react';
import { Package, Leaf, Flame, Droplets, Star, Circle } from 'lucide-react';
import type { KitContent } from '@/lib/data/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { EASE_OUT_SOFT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { PeacockDivider } from '@/components/peacock';

// Map lucide icon names stored in the data to components.
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  package: Package,
  leaf: Leaf,
  flame: Flame,
  droplets: Droplets,
  star: Star,
  circle: Circle,
};

function iconFor(name?: string): React.ComponentType<{ className?: string }> {
  if (name && ICON_MAP[name]) return ICON_MAP[name]!;
  return Package;
}

interface KitContentsProps {
  contents: KitContent[];
}

export function KitContents({ contents }: KitContentsProps) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs eyebrow text-gold-deep mb-2">What&apos;s Inside</p>
        <h2 className="font-display text-display-md text-brown">
          Your Ritual Box Contains
        </h2>
        <PeacockDivider maxWidth={220} className="my-2 opacity-80" wrapperClassName="!justify-start" />
        <p className="text-sm text-brown-muted mt-2">
          Every piece, chosen for the ceremony.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {contents.map((item, i) => {
          const Icon = iconFor(item.icon);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: reduced ? 0.01 : 0.4,
                ease: EASE_OUT_SOFT,
                delay: reduced ? 0 : i * 0.06,
              }}
              className={cn(
                'flex flex-col items-center text-center gap-3 p-4 rounded-xl',
                'bg-sand-soft/40 border border-sand-deep/30',
                'hover:border-sand-deep hover:bg-sand-soft/60 transition-colors',
              )}
            >
              <div className="w-10 h-10 rounded-full bg-gold-wash flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-brown" />
              </div>
              <div>
                <p className="text-sm font-medium text-brown leading-snug">{item.name}</p>
                <p className="text-xs text-brown-muted mt-0.5">
                  {item.quantity}
                  {item.unit ? ` ${item.unit}` : ''}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
