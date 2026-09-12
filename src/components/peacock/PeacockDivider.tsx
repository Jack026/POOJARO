import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

export interface PeacockDividerProps {
  variant?: string;
  className?: string;
  wrapperClassName?: string;
  size?: number | string;
  maxWidth?: number | string;
  opacity?: number;
  style?: React.CSSProperties;
  alt?: string;
  glow?: boolean;
}

/**
 * POOJARO SIGNATURE LOTUS DIVIDER
 * Symmetrical Indian Mehendi lotus with ornamental flourishes and pendant drop.
 * Rendered from ultra-high-resolution transparent artwork.
 */
export const PeacockDivider: React.FC<PeacockDividerProps> = ({
  className = '',
  wrapperClassName = '',
  size,
  maxWidth = 280,
  opacity = 1,
  style,
  alt = 'POOJARO Sacred Lotus Ornament',
  glow = true,
}) => {
  const maxW = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
  const w = size ? (typeof size === 'number' ? `${size}px` : size) : '100%';

  return (
    <div
      className={cn(
        'flex items-center justify-center w-full my-4 sm:my-6 pointer-events-none select-none',
        wrapperClassName
      )}
      style={{ opacity, ...style }}
      aria-hidden="true"
    >
      <div
        className={cn(
          'relative transition-transform duration-500 ease-out-soft',
          glow && 'drop-shadow-[0_2px_12px_rgba(183,131,50,0.18)]',
          className
        )}
        style={{ width: w, maxWidth: maxW }}
      >
        <Image
          src="/images/peacock/lotus-divider.png"
          alt={alt}
          width={1024}
          height={341}
          className="w-full h-auto object-contain"
          priority={false}
          unoptimized
        />
      </div>
    </div>
  );
};
