import React from 'react';
import { PeacockProps, PEACOCK_PALETTES } from './types';

export const PeacockHead: React.FC<PeacockProps> = ({
  variant = 'gold-on-dark',
  className = '',
  size = 64,
  animate = false,
}) => {
  const palette = PEACOCK_PALETTES[variant];
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 160"
      className={`transition-colors duration-300 ${className} ${animate ? 'animate-pulse' : ''}`}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`head-grad-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.highlight} />
          <stop offset="40%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.deep} />
        </linearGradient>
        
        <radialGradient id={`eye-grad-${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.deep} />
          <stop offset="70%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.highlight} />
        </radialGradient>
        
        <linearGradient id={`beak-grad-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.secondary} />
          <stop offset="100%" stopColor={palette.deep} />
        </linearGradient>
      </defs>

      {/* S-Curved Neck */}
      <path
        d="M 60 75 C 75 95, 85 115, 80 145 C 78 155, 60 160, 45 155 C 30 150, 25 125, 30 110 C 35 95, 45 85, 45 75 Z"
        fill={`url(#head-grad-${variant})`}
      />

      {/* Head */}
      <path
        d="M 75 55 C 80 45, 70 35, 55 35 C 40 35, 35 50, 35 60 C 35 70, 45 80, 60 80 C 70 80, 75 65, 75 55 Z"
        fill={`url(#head-grad-${variant})`}
      />

      {/* Beak */}
      <path
        d="M 73 53 C 88 53, 98 58, 98 63 C 93 63, 83 66, 75 60 Z"
        fill={`url(#beak-grad-${variant})`}
      />
      <path 
        d="M 73 53 C 88 53, 98 58, 98 63" 
        stroke={palette.deep} 
        strokeWidth="1.5" 
        fill="none" 
      />

      {/* Royal Crest (Kalgi) */}
      <g className="crest">
        {/* Stems */}
        <path d="M 50 35 Q 45 20 35 10" stroke={palette.primary} strokeWidth="2.5" fill="none" />
        <path d="M 53 34 Q 50 15 45 5" stroke={palette.primary} strokeWidth="2.5" fill="none" />
        <path d="M 56 34 Q 58 13 58 3" stroke={palette.primary} strokeWidth="2.5" fill="none" />
        <path d="M 60 34 Q 68 15 70 7" stroke={palette.primary} strokeWidth="2.5" fill="none" />
        <path d="M 63 36 Q 75 22 82 15" stroke={palette.primary} strokeWidth="2.5" fill="none" />
        
        {/* Golden Spheres */}
        <circle cx="35" cy="10" r="3.5" fill={`url(#head-grad-${variant})`} />
        <circle cx="45" cy="5" r="4.5" fill={`url(#head-grad-${variant})`} />
        <circle cx="58" cy="3" r="5" fill={`url(#head-grad-${variant})`} />
        <circle cx="70" cy="7" r="4.5" fill={`url(#head-grad-${variant})`} />
        <circle cx="82" cy="15" r="3.5" fill={`url(#head-grad-${variant})`} />
      </g>

      {/* Eye */}
      <g className="eye">
        {/* Whites/Highlight */}
        <path d="M 50 53 Q 55 48 60 53 Q 55 58 50 53 Z" fill={palette.highlight} />
        {/* Pupil */}
        <circle cx="55" cy="53" r="2.5" fill={`url(#eye-grad-${variant})`} />
        {/* Kohl line & extended eyeliner */}
        <path d="M 42 51 Q 48 53 50 53" stroke={palette.deep} strokeWidth="2.5" fill="none" />
        <path d="M 60 53 Q 66 54 70 48" stroke={palette.deep} strokeWidth="2" fill="none" />
        {/* Cream highlight crescent */}
        <path d="M 54 51.5 Q 56 51.5 56.5 53" stroke={palette.highlight} strokeWidth="1" fill="none" />
      </g>
      
      {/* Hanging Teardrop Pendant */}
      <g className="pendant">
        <circle cx="68" cy="62" r="1.5" fill={palette.primary} />
        <circle cx="68" cy="66" r="1.5" fill={palette.primary} />
        <path d="M 65 70 L 71 70 L 68 78 Z" fill={palette.accent} />
      </g>

      {/* Internal Neck Patterns (Scales) */}
      <g fill="none" stroke={palette.deep} strokeWidth="2">
        <path d="M 42 85 Q 52 93 62 87" />
        <path d="M 39 95 Q 52 105 66 96" />
        <path d="M 36 105 Q 52 118 70 106" />
        <path d="M 33 115 Q 52 131 75 118" />
        <path d="M 31 125 Q 52 144 79 130" />
      </g>

      {/* Graduated Dot Trails on Neck */}
      <g fill={palette.accent}>
        <circle cx="48" cy="92" r="2" />
        <circle cx="49" cy="103" r="3" />
        <circle cx="50" cy="115" r="4" />
        <circle cx="52" cy="128" r="3" />
        <circle cx="54" cy="140" r="2" />
      </g>

      {/* Chest Scalloped Paisley Feather Scales */}
      <g fill="none" stroke={palette.deep} strokeWidth="2">
        <path d="M 30 145 Q 38 153 45 146 Q 53 158 62 149 Q 68 162 76 150" />
        {/* Internal line textures for scales */}
        <path d="M 38 145 L 38 149" strokeWidth="1" />
        <path d="M 54 149 L 54 153" strokeWidth="1" />
        <path d="M 68 153 L 68 157" strokeWidth="1" />
      </g>
    </svg>
  );
};
