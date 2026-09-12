import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

export interface PeacockTailProps {
  className?: string;
  size?: number | string;
  maxWidth?: number | string;
  flip?: 'none' | 'horizontal' | 'vertical' | 'both';
  blendMode?: 'screen' | 'lighten' | 'normal' | 'multiply';
  opacity?: number;
  glow?: boolean;
  style?: React.CSSProperties;
  variant?: string;
  animate?: boolean;
}

/**
 * POOJARO GRAND PEACOCK TAIL PLUME
 * Sinuous cascading royal peacock feather plume with intricate henna barbs,
 * blossoming lotuses, and hanging jewel pendants.
 * Rendered from ultra-high-resolution 1024x512 artwork.
 */
export function PeacockTail({
  className = '',
  size,
  maxWidth,
  flip = 'none',
  blendMode = 'normal',
  opacity = 1,
  glow = true,
  style,
  ...rest
}: PeacockTailProps) {
  const widthVal = size ? (typeof size === 'number' ? `${size}px` : size) : undefined;
  const maxW = maxWidth ? (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth) : undefined;

  let transformStr = '';
  if (flip === 'horizontal') transformStr = 'scaleX(-1)';
  else if (flip === 'vertical') transformStr = 'scaleY(-1)';
  else if (flip === 'both') transformStr = 'scale(-1, -1)';

  return (
    <div
      className={cn(
        'peacock-tail pointer-events-none select-none relative inline-block transition-transform duration-500 ease-out-soft',
        glow && 'drop-shadow-[0_4px_24px_rgba(183,131,50,0.22)]',
        className
      )}
      style={{
        width: widthVal,
        maxWidth: maxW,
        mixBlendMode: blendMode,
        opacity,
        transform: transformStr || undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      <Image
        src="/images/peacock/peacock-tail-grand.png"
        alt="POOJARO Sacred Peacock Tail Plume"
        width={1024}
        height={512}
        className="w-full h-auto object-contain"
        priority={false}
        unoptimized
      />
    </div>
  );
}
