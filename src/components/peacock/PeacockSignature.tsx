import React from 'react';
import { PeacockMini } from './PeacockMini';

export interface PeacockSignatureProps {
  layout?: 'horizontal' | 'vertical' | 'mark-only';
  showTagline?: boolean;
  className?: string;
  size?: number;
  variant?: string;
}

/**
 * POOJARO PEACOCK SIGNATURE
 * Minimal brand signature lockup:
 * - The signature peacock image
 * - Classical POOJARO wordmark
 * - Optional manuscript inscription
 */
export function PeacockSignature({
  layout = 'horizontal',
  showTagline = true,
  className = '',
  size = 180,
  variant,
}: PeacockSignatureProps) {
  const isLight = variant === 'henna-on-light';
  const gold = isLight ? '#4A2A1A' : '#D4A04A';
  const secondary = isLight ? '#7A4A28' : '#D9B871';
  const accentGold = isLight ? '#B78332' : '#D4A04A';

  if (layout === 'mark-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <PeacockMini size={size} blendMode="normal" />
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <PeacockMini size={typeof size === 'number' ? size * 0.45 : 72} blendMode="normal" />

        {/* Brand Name */}
        <span
          className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase font-normal mt-3"
          style={{ color: gold }}
        >
          POOJARO
        </span>

        {/* Small golden ornamental divider */}
        <div className="flex items-center gap-2 my-2.5 w-36">
          <span className="h-px flex-1" style={{ backgroundColor: accentGold, opacity: 0.4 }} />
          <svg viewBox="0 0 28 14" width="28" height="14" fill="none" aria-hidden="true">
            <path
              d="M 14,1 C 9,6 3,6 0,6 C 3,6 9,6 14,12 C 19,6 25,6 28,6 C 25,6 19,6 14,1 Z"
              fill={isLight ? '#8B5E3C' : '#8B5E3C'}
              stroke={accentGold}
              strokeWidth="0.8"
            />
            <circle cx="14" cy="6" r="1.8" fill={accentGold} />
            <circle cx="14" cy="6" r="0.8" fill={isLight ? '#FAF8F3' : '#F5E8C8'} />
            <circle cx="4" cy="6" r="1.2" fill={accentGold} />
            <circle cx="7.5" cy="4.5" r="0.9" fill="#C4703C" />
            <circle cx="24" cy="6" r="1.2" fill={accentGold} />
            <circle cx="20.5" cy="4.5" r="0.9" fill="#C4703C" />
          </svg>
          <span className="h-px flex-1" style={{ backgroundColor: accentGold, opacity: 0.4 }} />
        </div>

        {showTagline && (
          <span
            className="text-[11px] tracking-[0.16em] uppercase font-medium"
            style={{ color: secondary }}
          >
            Sacred rituals. Beautifully prepared.
          </span>
        )}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <PeacockMini size={typeof size === 'number' ? size * 0.28 : 36} blendMode="normal" />
      <div className="flex flex-col">
        <span
          className="font-display text-lg md:text-xl tracking-[0.18em] uppercase font-normal leading-tight"
          style={{ color: gold }}
        >
          POOJARO
        </span>
        {showTagline && (
          <span
            className="text-[9px] tracking-[0.14em] uppercase font-medium leading-tight"
            style={{ color: secondary }}
          >
            Sacred Rituals
          </span>
        )}
      </div>
    </div>
  );
}
