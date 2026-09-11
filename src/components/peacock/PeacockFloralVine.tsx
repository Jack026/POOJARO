import React from 'react';
import { PeacockProps, PEACOCK_PALETTES } from './types';

export const PeacockFloralVine: React.FC<PeacockProps> = ({
  variant = 'gold-on-dark',
  className = '',
  size = 200,
  animate = true,
}) => {
  const palette = PEACOCK_PALETTES[variant];

  // Scale height proportionally to viewbox 300x90
  const width = typeof size === 'number' ? size : parseInt(String(size), 10) || 200;
  const height = width * 0.3;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 300 90"
      className={`${className} ${animate ? 'transition-all duration-300 hover:scale-105' : ''}`}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`vine-grad-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.deep} />
          <stop offset="30%" stopColor={palette.primary} />
          <stop offset="70%" stopColor={palette.accent} />
          <stop offset="100%" stopColor={palette.highlight} />
        </linearGradient>
        <radialGradient id={`lotus-grad-${variant}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={palette.highlight} />
          <stop offset="40%" stopColor={palette.accent} />
          <stop offset="80%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.deep} />
        </radialGradient>
        <linearGradient id={`leaf-grad-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.primary} />
          <stop offset="50%" stopColor={palette.secondary} />
          <stop offset="100%" stopColor={palette.deep} />
        </linearGradient>
        <radialGradient id={`dot-grad-${variant}`} cx="0.3" cy="0.3" r="0.7">
          <stop offset="0%" stopColor={palette.highlight} />
          <stop offset="50%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.deep} />
        </radialGradient>
      </defs>

      <g className="transition-colors duration-300">
        {/* Main Sinuous Stem */}
        {/* We want a flowing S-curve roughly through the center horizontally */}
        <path
          d="M 10 45 C 50 10, 80 80, 150 45 C 220 10, 250 80, 290 45"
          stroke={`url(#vine-grad-${variant})`}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Thick C-curves and S-curve scrolls (Curling tendrils) */}
        {/* Left side tendrils */}
        <path
          d="M 40 33 C 40 20, 25 15, 20 25 C 17 31, 23 35, 26 33"
          stroke={`url(#vine-grad-${variant})`}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 60 58 C 70 75, 55 85, 48 80 C 43 75, 48 70, 52 72"
          stroke={`url(#vine-grad-${variant})`}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Right side tendrils */}
        <path
          d="M 240 58 C 230 75, 245 85, 252 80 C 257 75, 252 70, 248 72"
          stroke={`url(#vine-grad-${variant})`}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 260 33 C 260 20, 275 15, 280 25 C 283 31, 277 35, 274 33"
          stroke={`url(#vine-grad-${variant})`}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Pointed Leaves Branching Off */}
        <g stroke={palette.deep} strokeWidth="1">
          {/* Leaf 1 */}
          <path d="M 30 40 C 25 35, 25 25, 35 20 C 40 25, 40 35, 30 40 Z" fill={`url(#leaf-grad-${variant})`} />
          <path d="M 35 20 C 33 28, 30 40, 30 40" stroke={palette.deep} fill="none" />
          
          {/* Leaf 2 */}
          <path d="M 75 60 C 80 65, 80 75, 70 80 C 65 75, 65 65, 75 60 Z" fill={`url(#leaf-grad-${variant})`} />
          <path d="M 70 80 C 72 72, 75 60, 75 60" stroke={palette.deep} fill="none" />

          {/* Leaf 3 */}
          <path d="M 225 30 C 220 25, 220 15, 230 10 C 235 15, 235 25, 225 30 Z" fill={`url(#leaf-grad-${variant})`} />
          <path d="M 230 10 C 228 18, 225 30, 225 30" stroke={palette.deep} fill="none" />

          {/* Leaf 4 */}
          <path d="M 270 50 C 275 55, 275 65, 265 70 C 260 65, 260 55, 270 50 Z" fill={`url(#leaf-grad-${variant})`} />
          <path d="M 265 70 C 267 62, 270 50, 270 50" stroke={palette.deep} fill="none" />
        </g>

        {/* Central Large Lotus Bloom at (150, 45) */}
        <g transform="translate(150, 45)">
          {/* Outer wide petals */}
          <path d="M 0 5 C -25 -5, -30 15, 0 25 Z" fill={`url(#lotus-grad-${variant})`} stroke={palette.deep} strokeWidth="1" />
          <path d="M 0 5 C 25 -5, 30 15, 0 25 Z" fill={`url(#lotus-grad-${variant})`} stroke={palette.deep} strokeWidth="1" />
          {/* Mid petals */}
          <path d="M 0 -2 C -18 -10, -20 12, 0 20 Z" fill={`url(#lotus-grad-${variant})`} stroke={palette.deep} strokeWidth="1" />
          <path d="M 0 -2 C 18 -10, 20 12, 0 20 Z" fill={`url(#lotus-grad-${variant})`} stroke={palette.deep} strokeWidth="1" />
          {/* Central bud petal */}
          <path d="M 0 -10 C -10 -5, -8 15, 0 20 C 8 15, 10 -5, 0 -10 Z" fill={`url(#lotus-grad-${variant})`} stroke={palette.deep} strokeWidth="1" />
          {/* Midrib lines for central bud */}
          <path d="M 0 -8 L 0 18" stroke={palette.deep} strokeWidth="1" fill="none" />
          {/* Golden sphere dot in the center base */}
          <circle cx="0" cy="18" r="4" fill={`url(#dot-grad-${variant})`} />
        </g>

        {/* Small Lotus Bud 1 (left side) at (100, 35) rotated */}
        <g transform="translate(100, 35) rotate(-30) scale(0.6)">
          <path d="M 0 5 C -25 -5, -30 15, 0 25 Z" fill={`url(#lotus-grad-${variant})`} stroke={palette.deep} strokeWidth="1" />
          <path d="M 0 5 C 25 -5, 30 15, 0 25 Z" fill={`url(#lotus-grad-${variant})`} stroke={palette.deep} strokeWidth="1" />
          <path d="M 0 -10 C -10 -5, -8 15, 0 20 C 8 15, 10 -5, 0 -10 Z" fill={`url(#lotus-grad-${variant})`} stroke={palette.deep} strokeWidth="1" />
          <path d="M 0 -8 L 0 18" stroke={palette.deep} strokeWidth="1" fill="none" />
          <circle cx="0" cy="18" r="4" fill={`url(#dot-grad-${variant})`} />
        </g>

        {/* Small Lotus Bud 2 (right side) at (200, 55) rotated */}
        <g transform="translate(200, 55) rotate(30) scale(0.6)">
          <path d="M 0 5 C -25 -5, -30 15, 0 25 Z" fill={`url(#lotus-grad-${variant})`} stroke={palette.deep} strokeWidth="1" />
          <path d="M 0 5 C 25 -5, 30 15, 0 25 Z" fill={`url(#lotus-grad-${variant})`} stroke={palette.deep} strokeWidth="1" />
          <path d="M 0 -10 C -10 -5, -8 15, 0 20 C 8 15, 10 -5, 0 -10 Z" fill={`url(#lotus-grad-${variant})`} stroke={palette.deep} strokeWidth="1" />
          <path d="M 0 -8 L 0 18" stroke={palette.deep} strokeWidth="1" fill="none" />
          <circle cx="0" cy="18" r="4" fill={`url(#dot-grad-${variant})`} />
        </g>

        {/* Graduated Bead Dot Trails */}
        {/* Left trail */}
        <circle cx="20" cy="55" r="2.5" fill={`url(#dot-grad-${variant})`} />
        <circle cx="16" cy="62" r="2.0" fill={`url(#dot-grad-${variant})`} />
        <circle cx="13" cy="68" r="1.5" fill={`url(#dot-grad-${variant})`} />
        <circle cx="11" cy="73" r="1.0" fill={`url(#dot-grad-${variant})`} />
        <circle cx="10" cy="77" r="0.6" fill={`url(#dot-grad-${variant})`} />

        {/* Center-left trail */}
        <circle cx="125" cy="20" r="3.0" fill={`url(#dot-grad-${variant})`} />
        <circle cx="117" cy="15" r="2.5" fill={`url(#dot-grad-${variant})`} />
        <circle cx="110" cy="11" r="2.0" fill={`url(#dot-grad-${variant})`} />
        <circle cx="104" cy="8" r="1.5" fill={`url(#dot-grad-${variant})`} />
        <circle cx="99" cy="6" r="1.0" fill={`url(#dot-grad-${variant})`} />

        {/* Center-right trail */}
        <circle cx="175" cy="70" r="3.0" fill={`url(#dot-grad-${variant})`} />
        <circle cx="183" cy="75" r="2.5" fill={`url(#dot-grad-${variant})`} />
        <circle cx="190" cy="79" r="2.0" fill={`url(#dot-grad-${variant})`} />
        <circle cx="196" cy="82" r="1.5" fill={`url(#dot-grad-${variant})`} />
        <circle cx="201" cy="84" r="1.0" fill={`url(#dot-grad-${variant})`} />

        {/* Right trail */}
        <circle cx="280" cy="35" r="2.5" fill={`url(#dot-grad-${variant})`} />
        <circle cx="284" cy="28" r="2.0" fill={`url(#dot-grad-${variant})`} />
        <circle cx="287" cy="22" r="1.5" fill={`url(#dot-grad-${variant})`} />
        <circle cx="289" cy="17" r="1.0" fill={`url(#dot-grad-${variant})`} />
        <circle cx="290" cy="13" r="0.6" fill={`url(#dot-grad-${variant})`} />

        {/* Large Golden Sphere Dots at Key Junctions */}
        <circle cx="45" cy="38" r="3.5" fill={`url(#dot-grad-${variant})`} />
        <circle cx="85" cy="62" r="3.5" fill={`url(#dot-grad-${variant})`} />
        <circle cx="215" cy="28" r="3.5" fill={`url(#dot-grad-${variant})`} />
        <circle cx="255" cy="52" r="3.5" fill={`url(#dot-grad-${variant})`} />
      </g>
    </svg>
  );
};
