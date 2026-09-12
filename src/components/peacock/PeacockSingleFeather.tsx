import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

export interface PeacockSingleFeatherProps {
  variant?: string;
  className?: string;
  size?: number | string;
  tilt?: number;
  opacity?: number;
  style?: React.CSSProperties;
  glow?: boolean;
}

/**
 * POOJARO SIGNATURE SINGLE PEACOCK FEATHER
 * Magnificent golden Mehendi peacock feather with radiant lotus halo eye and filigree barbs.
 */
export const PeacockSingleFeather: React.FC<PeacockSingleFeatherProps> = ({
  className = '',
  size = 120,
  tilt = 0,
  opacity = 1,
  style,
  glow = true,
}) => {
  const widthVal = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={cn(
        'peacock-single-feather pointer-events-none select-none relative inline-block transition-transform duration-500 ease-out-soft',
        glow && 'drop-shadow-[0_4px_16px_rgba(183,131,50,0.22)]',
        className
      )}
      style={{
        width: widthVal,
        opacity,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      <Image
        src="/images/peacock/single-feather.png"
        alt="POOJARO Sacred Peacock Feather"
        width={825}
        height={1024}
        className="w-full h-auto object-contain"
        priority={false}
        unoptimized
      />
    </div>
  );
};
