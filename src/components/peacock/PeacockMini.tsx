import React from 'react';
import Image from 'next/image';

export interface PeacockMiniProps {
  className?: string;
  size?: number | string;
  blendMode?: 'screen' | 'lighten' | 'normal' | 'multiply';
  opacity?: number;
  style?: React.CSSProperties;
  variant?: string;
  animate?: boolean;
}

/**
 * POOJARO MINI PEACOCK
 * Compact signature peacock image (PNG) for headers, badges,
 * empty states, and small accents.
 */
export function PeacockMini({
  className = '',
  size = 48,
  blendMode = 'normal',
  opacity = 1,
  style,
  ...rest
}: PeacockMiniProps) {
  const width = typeof size === 'number' ? size : size;
  const height = typeof size === 'number' ? Math.round(size * 0.666) : undefined;

  const inlineStyle: React.CSSProperties = {
    position: 'relative',
    mixBlendMode: blendMode,
    opacity,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...style,
  };

  return (
    <div
      className={`peacock-mini pointer-events-none select-none relative inline-block ${className}`}
      style={inlineStyle}
      aria-hidden="true"
    >
      <Image
        src="/images/peacock/peacock-main.png"
        alt="POOJARO Peacock"
        width={160}
        height={107}
        className="w-full h-full object-contain"
        priority={false}
        unoptimized
      />
    </div>
  );
}
