import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

export interface LotusMandalaProps {
  variant?: 'circular' | 'hanging';
  size?: number | string;
  maxWidth?: number | string;
  spin?: boolean;
  opacity?: number;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * POOJARO SIGNATURE LOTUS MANDALA
 * Sacred Indian Mehendi mandala available in:
 * - 'circular': Concentric radial rangoli medallion (supports slow celestial rotation)
 * - 'hanging': Grand temple emblem with hanging jhumki drops and floral canopy
 */
export const LotusMandala: React.FC<LotusMandalaProps> = ({
  variant = 'circular',
  size = 320,
  maxWidth,
  spin = false,
  opacity = 1,
  glow = true,
  className = '',
  style,
  alt = 'POOJARO Sacred Lotus Mandala',
}) => {
  const isHanging = variant === 'hanging';
  const src = isHanging
    ? '/images/peacock/lotus-mandala-hanging.png'
    : '/images/peacock/circular-mandala.png';
  const widthVal = typeof size === 'number' ? `${size}px` : size;
  const maxW = maxWidth ? (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth) : undefined;
  const aspectWidth = isHanging ? 972 : 1024;
  const aspectHeight = 1024;

  return (
    <div
      className={cn(
        'peacock-mandala pointer-events-none select-none relative inline-block',
        glow && 'drop-shadow-[0_4px_24px_rgba(183,131,50,0.18)]',
        className
      )}
      style={{
        width: widthVal,
        maxWidth: maxW,
        opacity,
        ...style,
      }}
      aria-hidden="true"
    >
      <div
        className={cn(
          'w-full h-full relative',
          spin && 'animate-[spin_90s_linear_infinite]'
        )}
      >
        <Image
          src={src}
          alt={alt}
          width={aspectWidth}
          height={aspectHeight}
          className="w-full h-auto object-contain"
          priority={false}
          unoptimized
        />
      </div>
    </div>
  );
};
