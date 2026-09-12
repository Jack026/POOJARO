import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

export interface PeacockFloralVineProps {
  variant?: string;
  className?: string;
  size?: number | string;
  maxWidth?: number | string;
  flip?: 'none' | 'horizontal' | 'vertical' | 'both';
  opacity?: number;
  style?: React.CSSProperties;
  glow?: boolean;
}

/**
 * POOJARO SIGNATURE CASCADING FLORAL VINE
 * Flowing S-curved golden lotus vine with graduated beads, buds, and ornate leaves.
 */
export const PeacockFloralVine: React.FC<PeacockFloralVineProps> = ({
  className = '',
  size = 220,
  maxWidth,
  flip = 'none',
  opacity = 1,
  style,
  glow = true,
}) => {
  const widthVal = typeof size === 'number' ? `${size}px` : size;
  const maxW = maxWidth ? (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth) : undefined;

  let transformStr = '';
  if (flip === 'horizontal') transformStr = 'scaleX(-1)';
  else if (flip === 'vertical') transformStr = 'scaleY(-1)';
  else if (flip === 'both') transformStr = 'scale(-1, -1)';

  return (
    <div
      className={cn(
        'peacock-floral-vine pointer-events-none select-none relative inline-block transition-transform duration-500',
        glow && 'drop-shadow-[0_4px_16px_rgba(183,131,50,0.15)]',
        className
      )}
      style={{
        width: widthVal,
        maxWidth: maxW,
        opacity,
        transform: transformStr || undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      <Image
        src="/images/peacock/lotus-vine.png"
        alt="POOJARO Lotus Floral Vine"
        width={898}
        height={1024}
        className="w-full h-auto object-contain"
        priority={false}
        unoptimized
      />
    </div>
  );
};
