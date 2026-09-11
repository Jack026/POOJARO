import React from 'react';
import { PeacockProps } from './types';

const PEACOCK_PALETTES = {
  'gold-on-dark': {
    primary: '#D4A04A',
    secondary: '#B78332',
    accent: '#E8C872',
    highlight: '#FAF0D8',
    deep: '#5C3820'
  },
  'henna-on-light': {
    primary: '#8B5E3C',
    secondary: '#7A4A28',
    accent: '#5C3820',
    highlight: '#F5E8C8',
    deep: '#3A2118'
  }
};

export const PeacockSingleFeather: React.FC<PeacockProps> = ({
  variant = 'gold-on-dark',
  className = '',
  size = 120,
  animate = false
}) => {
  const colors = (variant === 'henna-on-light' ? PEACOCK_PALETTES['henna-on-light'] : PEACOCK_PALETTES['gold-on-dark']);
  const numSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 120;
  const height = numSize * 2.2;
  const animationClass = animate ? 'animate-pulse hover:scale-105 transition-transform duration-500' : '';

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 200 440"
      className={`transition-colors duration-300 ${animationClass} ${className}`}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`shaft-grad-${variant}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={colors.deep} />
          <stop offset="50%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>
        
        <radialGradient id={`eye-halo-${variant}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="40%" stopColor={colors.secondary} />
          <stop offset="90%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.deep} />
        </radialGradient>

        <linearGradient id={`barb-grad-left-${variant}`} x1="1" y1="0.5" x2="0" y2="0">
          <stop offset="0%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.primary} />
        </linearGradient>
        <linearGradient id={`barb-grad-right-${variant}`} x1="0" y1="0.5" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.primary} />
        </linearGradient>

        <radialGradient id={`core-grad-${variant}`} cx="0.5" cy="0.7" r="0.6">
          <stop offset="0%" stopColor={colors.deep} />
          <stop offset="100%" stopColor={colors.secondary} />
        </radialGradient>
      </defs>

      {/* Tilted container for the feather */}
      <g transform="translate(100, 220) rotate(15) translate(-100, -220)">
        
        {/* DENSE PARALLEL BARBS - Left Side */}
        <path 
          d="
            M 98,390 Q 60,370 30,340 
            M 98,370 Q 50,350 20,310 
            M 98,350 Q 40,330 15,280 
            M 98,330 Q 35,310 10,250 
            M 98,310 Q 30,290 8,220 
            M 98,290 Q 30,270 10,190 
            M 98,270 Q 35,250 15,160 
            M 98,250 Q 45,230 25,140 
            M 98,230 Q 55,210 35,120 
            M 98,210 Q 65,190 50,110
            M 98,190 Q 75,170 65,100
          " 
          stroke={`url(#barb-grad-left-${variant})`} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />

        {/* DENSE PARALLEL BARBS - Right Side */}
        <path 
          d="
            M 102,390 Q 140,370 170,340 
            M 102,370 Q 150,350 180,310 
            M 102,350 Q 160,330 185,280 
            M 102,330 Q 165,310 190,250 
            M 102,310 Q 170,290 192,220 
            M 102,290 Q 170,270 190,190 
            M 102,270 Q 165,250 185,160 
            M 102,250 Q 155,230 175,140 
            M 102,230 Q 145,210 165,120 
            M 102,210 Q 135,190 150,110
            M 102,190 Q 125,170 135,100
          " 
          stroke={`url(#barb-grad-right-${variant})`} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />

        {/* THICK ORNAMENTAL BARBS (Thick filled leaf-like shapes) */}
        <path d="M 98,170 Q 70,160 55,140 Q 65,130 98,160 Z" fill={colors.accent} />
        <path d="M 102,170 Q 130,160 145,140 Q 135,130 102,160 Z" fill={colors.accent} />
        <path d="M 98,200 Q 60,190 40,165 Q 50,155 98,190 Z" fill={colors.primary} />
        <path d="M 102,200 Q 140,190 160,165 Q 150,155 102,190 Z" fill={colors.primary} />

        {/* SHAFT (Rachis) */}
        <path 
          d="M 96,420 Q 98,240 99,60 L 101,60 Q 102,240 104,420 Z" 
          fill={`url(#shaft-grad-${variant})`} 
        />

        {/* CURLING SPIRAL TENDRILS */}
        <path 
          d="M 98,340 Q 50,340 40,370 Q 35,390 50,400 Q 60,405 65,395 Q 70,385 60,380 Q 55,378 52,382" 
          fill="none" 
          stroke={colors.primary} 
          strokeWidth="3" 
          strokeLinecap="round" 
        />
        <path 
          d="M 102,260 Q 160,250 170,220 Q 175,200 160,190 Q 150,185 145,195 Q 140,205 150,210 Q 155,212 158,208" 
          fill="none" 
          stroke={colors.primary} 
          strokeWidth="3" 
          strokeLinecap="round" 
        />

        {/* GRADUATED BEAD DOT TRAILS ALONG CURVES */}
        {/* Left spiral trail */}
        <circle cx="58" cy="370" r="3.5" fill={colors.accent} />
        <circle cx="67" cy="365" r="3" fill={colors.accent} />
        <circle cx="75" cy="360" r="2.5" fill={colors.accent} />
        <circle cx="82" cy="355" r="2" fill={colors.accent} />
        <circle cx="88" cy="350" r="1.5" fill={colors.accent} />
        
        {/* Right spiral trail */}
        <circle cx="142" cy="225" r="3.5" fill={colors.accent} />
        <circle cx="133" cy="230" r="3" fill={colors.accent} />
        <circle cx="125" cy="235" r="2.5" fill={colors.accent} />
        <circle cx="118" cy="240" r="2" fill={colors.accent} />
        <circle cx="112" cy="245" r="1.5" fill={colors.accent} />

        {/* MAGNIFICENT CENTRAL EYE */}
        <g transform="translate(0, 10)">
          {/* Outermost Scalloped Halo (Lotus petals) */}
          <path 
            d="
              M 100,20 
              Q 115,10 130,25 
              Q 155,20 160,45 
              Q 185,55 175,80 
              Q 195,100 175,120 
              Q 185,145 160,155 
              Q 155,180 130,175 
              Q 115,190 100,175 
              Q 85,190 70,175 
              Q 45,180 40,155 
              Q 15,145 25,120 
              Q 5,100 25,80 
              Q 15,55 40,45 
              Q 45,20 70,25 
              Q 85,10 100,20 Z
            " 
            fill={`url(#eye-halo-${variant})`} 
          />

          {/* Surrounding Ornamental Triangular Segments with lines */}
          <path d="M 100,28 L 120,40 L 100,45 Z" fill={colors.deep} />
          <path d="M 100,28 L 80,40 L 100,45 Z" fill={colors.deep} />
          <path d="M 152,65 L 135,80 L 130,60 Z" fill={colors.deep} />
          <path d="M 48,65 L 65,80 L 70,60 Z" fill={colors.deep} />
          <path d="M 152,135 L 135,120 L 130,140 Z" fill={colors.deep} />
          <path d="M 48,135 L 65,120 L 70,140 Z" fill={colors.deep} />
          <path d="M 100,172 L 120,160 L 100,155 Z" fill={colors.deep} />
          <path d="M 100,172 L 80,160 L 100,155 Z" fill={colors.deep} />

          {/* Ring of Graduated Bead Dots Around the Eye */}
          {[
            [100, 36, 4], [118, 41, 3.5], [134, 53, 3], [146, 70, 3.5],
            [151, 88, 4], [151, 108, 4], [146, 126, 3.5], [134, 143, 3],
            [118, 155, 3.5], [100, 160, 4], [82, 155, 3.5], [66, 143, 3],
            [54, 126, 3.5], [49, 108, 4], [49, 88, 4], [54, 70, 3.5],
            [66, 53, 3], [82, 41, 3.5]
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill={colors.accent} />
          ))}

          {/* Outer Frame: Medium Gold Diamond/Paisley */}
          <path 
            d="M 100,45 Q 135,70 135,100 Q 135,130 100,150 Q 65,130 65,100 Q 65,70 100,45 Z" 
            fill={colors.primary} 
          />

          {/* Inner Frame: Warm Copper Diamond */}
          <path 
            d="M 100,55 Q 120,75 120,100 Q 120,120 100,138 Q 80,120 80,100 Q 80,75 100,55 Z" 
            fill={colors.secondary} 
          />

          {/* Deep Jewel Core: Teardrop/Leaf shape */}
          <path 
            d="M 100,65 Q 110,85 110,105 A 10 10 0 0 1 90,105 Q 90,85 100,65 Z" 
            fill={`url(#core-grad-${variant})`} 
          />

          {/* Cream Crescent Highlight */}
          <path 
            d="M 94,103 A 6 6 0 0 0 106,103 A 7 7 0 0 1 94,103 Z" 
            fill={colors.highlight} 
          />
        </g>

        {/* BASE DECORATIVE LEAVES */}
        <path d="M 97,410 Q 75,405 70,390 Q 85,392 98,400 Z" fill={colors.secondary} />
        <path d="M 103,410 Q 125,405 130,390 Q 115,392 102,400 Z" fill={colors.secondary} />
        <path d="M 96,400 Q 80,395 75,380 Q 90,385 98,390 Z" fill={colors.primary} />
        <path d="M 104,400 Q 120,395 125,380 Q 110,385 102,390 Z" fill={colors.primary} />

      </g>
    </svg>
  );
};

export default PeacockSingleFeather;
