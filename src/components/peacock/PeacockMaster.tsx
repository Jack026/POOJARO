import React from 'react';
import Image from 'next/image';

export interface PeacockMasterProps {
  className?: string;
  size?: number | string;
  blendMode?: 'screen' | 'lighten' | 'normal' | 'multiply';
  opacity?: number;
  style?: React.CSSProperties;
  variant?: string;
  animate?: boolean;
}

/**
 * POOJARO MASTER PEACOCK
 * Renders the signature golden Mehendi peacock as a high-resolution transparent PNG.
 */
export function PeacockMaster({
  className = '',
  size,
  blendMode = 'normal',
  opacity = 1,
  style,
  ...rest
}: PeacockMasterProps) {
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
      className={`peacock-master pointer-events-none select-none relative ${className}`}
      style={inlineStyle}
      aria-hidden="true"
    >
      <Image
        src="/images/peacock/peacock-main.png"
        alt="POOJARO Signature Peacock"
        width={1024}
        height={682}
        className="w-full h-full object-contain drop-shadow-[0_4px_24px_rgba(183,131,50,0.25)]"
        priority={false}
        unoptimized
      />
    </div>
  );
}
