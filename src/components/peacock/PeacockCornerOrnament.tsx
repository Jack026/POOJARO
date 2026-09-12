import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';
import { PeacockProps } from './types';

export interface PeacockCornerProps extends PeacockProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  glow?: boolean;
}

/**
 * POOJARO SIGNATURE CORNER ORNAMENT
 * Intricate Indian Mehendi lotus vine framing for cards, section corners, and modals.
 */
export const PeacockCornerOrnament: React.FC<PeacockCornerProps> = ({
  position = 'top-left',
  size = 140,
  opacity = 1,
  glow = true,
  className = '',
  style,
  ...props
}) => {
  const widthVal = typeof size === 'number' ? `${size}px` : size;

  let transformStr = '';
  switch (position) {
    case 'top-right':
      transformStr = 'scaleX(-1)';
      break;
    case 'bottom-left':
      transformStr = 'scaleY(-1)';
      break;
    case 'bottom-right':
      transformStr = 'scale(-1, -1)';
      break;
    case 'top-left':
    default:
      transformStr = 'none';
      break;
  }

  return (
    <div
      className={cn(
        'peacock-corner-ornament pointer-events-none select-none relative inline-block transition-transform duration-500',
        glow && 'drop-shadow-[0_2px_12px_rgba(183,131,50,0.18)]',
        className
      )}
      style={{
        width: widthVal,
        opacity,
        transform: transformStr,
        ...style,
      }}
      aria-hidden="true"
    >
      <Image
        src="/images/peacock/lotus-vine.png"
        alt="POOJARO Corner Lotus Flourish"
        width={898}
        height={1024}
        className="w-full h-auto object-contain"
        priority={false}
        unoptimized
      />
    </div>
  );
};
