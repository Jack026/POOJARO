import React from 'react';
import { PeacockProps, PEACOCK_PALETTES } from './types';

export interface PeacockCornerProps extends PeacockProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const PeacockCornerOrnament: React.FC<PeacockCornerProps> = ({
  variant = 'gold-on-dark',
  className = '',
  size = 120,
  animate = false,
  position = 'top-left',
  style,
  ...props
}) => {
  const palette = PEACOCK_PALETTES[variant] || PEACOCK_PALETTES['gold-on-dark'];
  const gradientIdPrefix = `peacock-corner-${variant}-${Math.random().toString(36).slice(2, 7)}`;

  const getStyle = (): React.CSSProperties => {
    const baseStyle = { ...style };
    switch (position) {
      case 'top-right':
        baseStyle.transform = 'scale(-1, 1)';
        break;
      case 'bottom-left':
        baseStyle.transform = 'scale(1, -1)';
        break;
      case 'bottom-right':
        baseStyle.transform = 'scale(-1, -1)';
        break;
      case 'top-left':
      default:
        baseStyle.transform = 'scale(1, 1)';
        break;
    }
    return baseStyle;
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 180 180"
      width={size}
      height={size}
      className={`transition-colors duration-300 pointer-events-none ${className} ${
        animate ? 'animate-pulse' : ''
      }`}
      style={getStyle()}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id={`${gradientIdPrefix}-vine`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.deep} />
          <stop offset="50%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.secondary} />
        </linearGradient>
        
        <linearGradient id={`${gradientIdPrefix}-leaf`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={palette.primary} />
          <stop offset="50%" stopColor={palette.lightGold} />
          <stop offset="100%" stopColor={palette.mid} />
        </linearGradient>

        <linearGradient id={`${gradientIdPrefix}-lotus`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={palette.highlight} />
          <stop offset="40%" stopColor={palette.lightGold} />
          <stop offset="80%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.secondary} />
        </linearGradient>

        <radialGradient id={`${gradientIdPrefix}-dot`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={palette.highlight} />
          <stop offset="40%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.deep} />
        </radialGradient>
      </defs>

      {/* 1. Thick S-curved vine flowing from top-left */}
      <path
        d="M -10 -10 Q 80 10, 90 90 T 170 160"
        fill="none"
        stroke={`url(#${gradientIdPrefix}-vine)`}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 10 0 Q 70 20, 80 80 T 150 140"
        fill="none"
        stroke={`url(#${gradientIdPrefix}-vine)`}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* 4. Curling Tendrils ending in tight spirals */}
      <path
        d="M 50 30 Q 70 20, 90 30 T 110 50 Q 115 65, 105 70 Q 95 75, 90 65 Q 88 58, 95 55"
        fill="none"
        stroke={`url(#${gradientIdPrefix}-vine)`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 90 90 Q 110 80, 130 90 T 150 110 Q 155 125, 145 130 Q 135 135, 130 125 Q 128 118, 135 115"
        fill="none"
        stroke={`url(#${gradientIdPrefix}-vine)`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* 3. Pointed Leaves branching off */}
      <g stroke={palette.deep} strokeWidth="1">
        {/* Leaf 1 */}
        <path
          d="M 40 10 C 60 0, 70 10, 70 20 C 60 30, 40 20, 40 10 Z"
          fill={`url(#${gradientIdPrefix}-leaf)`}
        />
        <path d="M 40 10 Q 55 15, 70 20" fill="none" stroke={palette.deep} strokeWidth="1.5" />
        
        {/* Leaf 2 */}
        <path
          d="M 20 40 C 10 60, 20 70, 30 70 C 40 60, 30 40, 20 40 Z"
          fill={`url(#${gradientIdPrefix}-leaf)`}
        />
        <path d="M 20 40 Q 25 55, 30 70" fill="none" stroke={palette.deep} strokeWidth="1.5" />

        {/* Leaf 3 */}
        <path
          d="M 120 140 C 140 130, 150 140, 150 150 C 140 160, 120 150, 120 140 Z"
          fill={`url(#${gradientIdPrefix}-leaf)`}
        />
        <path d="M 120 140 Q 135 145, 150 150" fill="none" stroke={palette.deep} strokeWidth="1.5" />
      </g>

      {/* 2. Lotus Bloom at crux point (around 90 90) */}
      <g transform="translate(90 90) rotate(-45)">
        {/* Back petals */}
        <path
          d="M 0 0 C -30 -10, -40 -30, 0 -40 C 40 -30, 30 -10, 0 0 Z"
          fill={`url(#${gradientIdPrefix}-lotus)`}
          stroke={palette.deep}
          strokeWidth="1.5"
        />
        <path
          d="M 0 0 C -20 10, -40 0, -40 -30 C -20 -10, -10 -5, 0 0 Z"
          fill={`url(#${gradientIdPrefix}-lotus)`}
          stroke={palette.deep}
          strokeWidth="1.5"
        />
        <path
          d="M 0 0 C 20 10, 40 0, 40 -30 C 20 -10, 10 -5, 0 0 Z"
          fill={`url(#${gradientIdPrefix}-lotus)`}
          stroke={palette.deep}
          strokeWidth="1.5"
        />
        
        {/* Middle petals */}
        <path
          d="M 0 0 C -15 -10, -25 -25, 0 -35 C 25 -25, 15 -10, 0 0 Z"
          fill={`url(#${gradientIdPrefix}-leaf)`}
          stroke={palette.deep}
          strokeWidth="1.5"
        />

        {/* Center bud petal */}
        <path
          d="M 0 0 C -10 -10, -15 -20, 0 -28 C 15 -20, 10 -10, 0 0 Z"
          fill={`url(#${gradientIdPrefix}-lotus)`}
          stroke={palette.deep}
          strokeWidth="1.5"
        />
        
        {/* Midrib lines */}
        <path d="M 0 0 L 0 -38" fill="none" stroke={palette.deep} strokeWidth="1.5" />
        <path d="M 0 0 Q -20 -15, -35 -25" fill="none" stroke={palette.deep} strokeWidth="1.5" />
        <path d="M 0 0 Q 20 -15, 35 -25" fill="none" stroke={palette.deep} strokeWidth="1.5" />

        {/* Central sphere dot */}
        <circle cx="0" cy="5" r="6" fill={`url(#${gradientIdPrefix}-dot)`} />
      </g>

      {/* 5. Graduated Bead Dot Trails */}
      {/* Trail 1: Along top-left inward */}
      <circle cx="20" cy="15" r="4.5" fill={`url(#${gradientIdPrefix}-dot)`} />
      <circle cx="30" cy="22" r="3.5" fill={`url(#${gradientIdPrefix}-dot)`} />
      <circle cx="38" cy="28" r="2.5" fill={`url(#${gradientIdPrefix}-dot)`} />
      <circle cx="45" cy="33" r="1.5" fill={`url(#${gradientIdPrefix}-dot)`} />
      <circle cx="50" cy="38" r="1" fill={`url(#${gradientIdPrefix}-dot)`} />

      {/* Trail 2: Along the bottom curl */}
      <circle cx="100" cy="115" r="5" fill={`url(#${gradientIdPrefix}-dot)`} />
      <circle cx="112" cy="108" r="4" fill={`url(#${gradientIdPrefix}-dot)`} />
      <circle cx="122" cy="103" r="3" fill={`url(#${gradientIdPrefix}-dot)`} />
      <circle cx="130" cy="99" r="2" fill={`url(#${gradientIdPrefix}-dot)`} />
      <circle cx="136" cy="96" r="1.2" fill={`url(#${gradientIdPrefix}-dot)`} />

      {/* 6. Large Golden Sphere Dots at Junctions */}
      <circle cx="80" cy="80" r="7" fill={`url(#${gradientIdPrefix}-dot)`} />
      <circle cx="150" cy="150" r="8" fill={`url(#${gradientIdPrefix}-dot)`} />
      <circle cx="40" cy="100" r="6" fill={`url(#${gradientIdPrefix}-dot)`} />
      <circle cx="130" cy="30" r="6" fill={`url(#${gradientIdPrefix}-dot)`} />
    </svg>
  );
};
