'use client';

/**
 * Modal dialog (§16).
 *
 * A centred panel on desktop that becomes a bottom sheet under 640px, because a
 * centred dialog on a phone leaves its close button in the hardest place on the
 * screen to reach (§40).
 */
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';
import { modalPop, sheetSlide } from '@/lib/motion';
import { useIsDesktopDialog } from '@/hooks/useMediaQuery';
import { iconButtonClasses } from './button-styles';
import { Overlay, useDialogIds } from './Overlay';

const WIDTHS = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
} as const;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Hide the heading visually but keep it for screen readers. */
  hideTitle?: boolean;
  description?: string;
  size?: keyof typeof WIDTHS;
  dismissible?: boolean;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  hideTitle = false,
  description,
  size = 'md',
  dismissible = true,
  footer,
  className,
  children,
}: ModalProps) {
  const { titleId, descriptionId } = useDialogIds();
  // The panel is a bottom sheet on phones and a centred card from `sm` up, so
  // the entrance has to match the shape it lands in.
  const isDesktop = useIsDesktopDialog();

  return (
    <Overlay
      open={open}
      onClose={onClose}
      dismissible={dismissible}
      labelledBy={titleId}
      describedBy={description ? descriptionId : undefined}
      containerClassName="items-end justify-center sm:items-center p-0 sm:p-6"
      panelVariants={isDesktop ? modalPop : sheetSlide.bottom}
      panelClassName={cn('w-full', WIDTHS[size])}
    >
      <div
        className={cn(
          'flex max-h-[92dvh] w-full flex-col overflow-hidden bg-ivory shadow-overlay',
          'rounded-t-xl sm:rounded-xl',
          className,
        )}
      >
        <header className="flex items-start gap-4 border-b border-sand-deep/60 px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className={cn('text-display-sm', hideTitle && 'sr-only')}>
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className={cn('mt-1 text-sm text-brown-soft', hideTitle && 'sr-only')}
              >
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button type="button" onClick={onClose} className={iconButtonClasses('-mr-2 shrink-0')}>
              <X size={20} aria-hidden="true" />
              <span className="sr-only">Close</span>
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
          {children}
        </div>

        {footer && (
          <footer className="border-t border-sand-deep/60 bg-ivory-warm px-5 py-4 sm:px-7">{footer}</footer>
        )}
      </div>
    </Overlay>
  );
}
