'use client';

/**
 * Sheet — an edge-anchored drawer (§25, §40).
 *
 * The cart, the mobile navigation and the shop filters are all this component
 * with a different side. Sheets keep their header and footer pinned while the
 * middle scrolls, because a cart's checkout button must stay reachable no matter
 * how many lines are in it.
 */
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';
import { sheetSlide, type SheetSide } from '@/lib/motion';
import { iconButtonClasses } from './button-styles';
import { Overlay, useDialogIds } from './Overlay';

const POSITION: Record<SheetSide, string> = {
  right: 'justify-end items-stretch',
  left: 'justify-start items-stretch',
  bottom: 'items-end justify-center',
  top: 'items-start justify-center',
};

const SHAPE: Record<SheetSide, string> = {
  right: 'h-dvh w-full max-w-[26rem] rounded-l-xl',
  left: 'h-dvh w-full max-w-[22rem] rounded-r-xl',
  bottom: 'w-full max-h-[88dvh] rounded-t-xl',
  top: 'w-full max-h-[88dvh] rounded-b-xl',
};

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: SheetSide;
  footer?: React.ReactNode;
  /** Extra controls beside the close button, e.g. "Clear all". */
  headerAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  side = 'right',
  footer,
  headerAction,
  className,
  children,
}: SheetProps) {
  const { titleId, descriptionId } = useDialogIds();

  return (
    <Overlay
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={description ? descriptionId : undefined}
      containerClassName={POSITION[side]}
      panelVariants={sheetSlide[side]}
      panelClassName={cn(SHAPE[side], 'max-w-full')}
    >
      <div className={cn('flex h-full flex-col overflow-hidden bg-ivory shadow-overlay', className)}>
        <header className="flex items-center gap-3 border-b border-sand-deep/60 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-2xl leading-tight">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-xs text-brown-muted">
                {description}
              </p>
            )}
          </div>
          {headerAction}
          <button type="button" onClick={onClose} className={iconButtonClasses('-mr-2 shrink-0')}>
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Close {title.toLowerCase()}</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {footer && <footer className="border-t border-sand-deep/60 bg-ivory-warm px-5 py-4">{footer}</footer>}
      </div>
    </Overlay>
  );
}
