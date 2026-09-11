import React from 'react';
import { PeacockProps } from './types';

export const PeacockFeatherEye: React.FC<PeacockProps> = ({
  variant = 'gold-on-dark',
  className = '',
  size = 48,
  animate = false,
}) => {
  const isLight = variant === 'henna-on-light';
  
  // Metallic Golden Palette extracted for gradients
  const jewelCenter = isLight ? '#3A2118' : '#2A1108';
  const jewelEdge = isLight ? '#5C3820' : '#4A2810';
  
  const innerPaisleyStart = isLight ? '#8B5E3C' : '#B78332';
  const innerPaisleyEnd = isLight ? '#5C3820' : '#8B5E3C';
  
  const outerFrameStart = isLight ? '#C4893B' : '#D4A04A';
  const outerFrameEnd = isLight ? '#8B5E3C' : '#B78332';

  const petalStart = isLight ? '#7A4A28' : '#D9B871';
  const petalEnd = isLight ? '#5C3820' : '#8B5E3C';

  const dotColor = isLight ? '#5C3820' : '#F5E8C8';
  const highlightColor = isLight ? '#D4A04A' : '#FAF0D8';

  const animClass = animate ? 'animate-pulse' : '';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={`transition-colors duration-300 ${animClass} ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="jewelGrad" cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
          <stop offset="0%" stopColor={jewelCenter} />
          <stop offset="100%" stopColor={jewelEdge} />
        </radialGradient>
        <linearGradient id="innerPaisleyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={innerPaisleyStart} />
          <stop offset="100%" stopColor={innerPaisleyEnd} />
        </linearGradient>
        <linearGradient id="outerFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={outerFrameStart} />
          <stop offset="100%" stopColor={outerFrameEnd} />
        </linearGradient>
        <linearGradient id="petalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={petalStart} />
          <stop offset="100%" stopColor={petalEnd} />
        </linearGradient>
      </defs>

      <g transform="translate(60, 70)">
        {/* 1. OUTERMOST RING: Scalloped lotus-petal halo */}
        <g fill="url(#petalGrad)" stroke={highlightColor} strokeWidth="1.5">
          {[...Array(12)].map((_, i) => {
            const angle = (i * 360) / 12;
            return (
              <path
                key={`petal-${i}`}
                d="M 0,-48 C 6,-56 12,-62 0,-70 C -12,-62 -6,-56 0,-48"
                transform={`rotate(${angle})`}
              />
            );
          })}
        </g>

        {/* Ring of graduated bead dots just outside */}
        <g fill={dotColor}>
          {[...Array(24)].map((_, i) => {
            const angle = (i * 360) / 24;
            const r = i % 2 === 0 ? 2 : 1.2;
            return (
              <circle
                key={`dot-${i}`}
                cx="0"
                cy="-74"
                r={r}
                transform={`rotate(${angle})`}
              />
            );
          })}
        </g>

        {/* 2. OUTER DIAMOND/PAISLEY FRAME */}
        <path
          d="M 0,-50 C 25,-25 35,10 0,45 C -35,10 -25,-25 0,-50 Z"
          fill="url(#outerFrameGrad)"
          stroke={jewelEdge}
          strokeWidth="2"
        />
        
        {/* Internal line texture for outer diamond */}
        <g stroke={jewelEdge} strokeWidth="1" fill="none" opacity="0.6">
          <path d="M 0,-40 C 15,-20 25,5 0,35" />
          <path d="M 0,-40 C -15,-20 -25,5 0,35" />
          <path d="M 0,-30 C 8,-10 15,10 0,25" />
          <path d="M 0,-30 C -8,-10 -15,10 0,25" />
        </g>

        {/* 3. INNER PAISLEY */}
        <path
          d="M 0,-35 C 15,-15 20,5 0,25 C -20,5 -15,-15 0,-35 Z"
          fill="url(#innerPaisleyGrad)"
          stroke={highlightColor}
          strokeWidth="1.5"
        />
        
        {/* Dot trail inside inner paisley */}
        <g fill={jewelEdge}>
          {[...Array(14)].map((_, i) => {
            const angle = (i * 360) / 14;
            // slightly elliptical placement
            const isVertical = angle < 45 || angle > 315 || (angle > 135 && angle < 225);
            const dist = isVertical ? 25 : 12;
            return (
              <circle
                key={`inner-dot-${i}`}
                cx="0"
                cy={-dist}
                r="1.2"
                transform={`rotate(${angle})`}
              />
            );
          })}
        </g>

        {/* 4. CENTER JEWEL */}
        <path
          d="M 0,-20 C 10,-5 12,10 0,18 C -12,10 -10,-5 0,-20 Z"
          fill="url(#jewelGrad)"
        />
        
        {/* Center Jewel Crescent Highlight */}
        <path
          d="M 1,-2 C 6,6 2,12 -2,10 C 3,12 7,6 1,-2 Z"
          fill={highlightColor}
          opacity="0.8"
        />
        {/* Tiny Bright Dot at top for specular highlight */}
        <circle cx="-2" cy="-8" r="1.5" fill={highlightColor} />

        {/* 5. DECORATIVE SURROUNDS: Graduated bead dots at cardinal points inside petals */}
        <g fill={highlightColor}>
          <circle cx="0" cy="-62" r="1.5" />
          <circle cx="0" cy="62" r="1.5" />
          <circle cx="-62" cy="0" r="1.5" />
          <circle cx="62" cy="0" r="1.5" />
        </g>
      </g>
    </svg>
  );
};
