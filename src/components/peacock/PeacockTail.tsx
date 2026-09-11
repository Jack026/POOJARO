import React from 'react';
import Image from 'next/image';

export interface PeacockTailProps {
  className?: string;
  size?: number | string;
  blendMode?: 'screen' | 'lighten' | 'normal' | 'multiply';
  opacity?: number;
  style?: React.CSSProperties;
  variant?: string;
  animate?: boolean;
}

/**
 * PEACOCK TAIL / WATERMARK
 * Signature peacock PNG used as background watermark.
 */
export function PeacockTail({
  className = '',
  size = 400,
  blendMode = 'normal',
  opacity = 0.2,
  style,
  ...rest
}: PeacockTailProps) {
  const width = typeof size === 'number' ? size : size;
  const height = typeof size === 'number' ? Math.round(size * 0.666) : undefined;

  const inlineStyle: React.CSSProperties = {
    position: 'relative',
    mixBlendMode: blendMode,
    opacity,
    overflow: 'hidden',
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...style,
  };

  return (
    <div
      className={`peacock-tail pointer-events-none select-none relative ${className}`}
      style={inlineStyle}
      aria-hidden="true"
    >
      <Image
        src="/images/peacock/peacock-main.png"
        alt=""
        width={1024}
        height={682}
        className="w-full h-full object-contain"
        priority={false}
        quality={80}
        unoptimized
      />
    </div>
  );
}
