import React from 'react';
import { PeacockProps, PEACOCK_PALETTES } from './types';

export interface PeacockDividerProps extends PeacockProps {
  wrapperClassName?: string;
}

export const PeacockDivider: React.FC<PeacockDividerProps> = ({
  variant = 'gold-on-dark',
  className = '',
  wrapperClassName = '',
  size,
  animate = false,
  ...props
}) => {
  const palette = PEACOCK_PALETTES[variant] || PEACOCK_PALETTES['gold-on-dark'];
  const gradientPrefix = `peacock-divider-${variant}`;

  // Animation classes if requested
  const animationClass = animate ? 'animate-pulse' : '';

  return (
    <div className={`flex items-center justify-center w-full my-3 sm:my-4 ${wrapperClassName}`}>
      <svg
        viewBox="0 0 700 120"
        className={`w-full max-w-[240px] sm:max-w-[280px] h-auto transition-colors duration-300 ${animationClass} ${className}`}
        aria-hidden="true"
        width={size}
        height={size ? (typeof size === 'number' ? size * 0.17 : size) : undefined}
        {...props}
      >
        <defs>
          {/* Deep Amber Gradient for Back Petals and Main Scrolls */}
          <linearGradient id={`${gradientPrefix}-deep-amber`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.mid} />
            <stop offset="50%" stopColor={palette.deep} />
            <stop offset="100%" stopColor={palette.secondary} />
          </linearGradient>

          {/* Medium Gold Gradient for Middle Petals and Leaves */}
          <linearGradient id={`${gradientPrefix}-medium-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.lightGold} />
            <stop offset="50%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={palette.mid} />
          </linearGradient>

          {/* Light Cream Gradient for Front Bud */}
          <linearGradient id={`${gradientPrefix}-cream`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.highlight} />
            <stop offset="70%" stopColor={palette.lightGold} />
            <stop offset="100%" stopColor={palette.primary} />
          </linearGradient>

          {/* Metallic Sphere Gradient for Dots */}
          <radialGradient id={`${gradientPrefix}-sphere`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={palette.highlight} />
            <stop offset="40%" stopColor={palette.lightGold} />
            <stop offset="80%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={palette.deep} />
          </radialGradient>
        </defs>

        <g transform="translate(350, 60)">
          {/* --- LEFT SCROLLWORK --- */}
          <g>
            {/* Outermost tight spiral */}
            <path
              d="M -300,0 C -300,-15 -285,-20 -275,-10 C -265,0 -270,12 -280,12 C -286,12 -288,7 -284,5 C -281,4 -281,7 -284,7"
              fill="none"
              stroke={`url(#${gradientPrefix}-medium-gold)`}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Outermost dots */}
            <circle cx="-312" cy="0" r="3" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-322" cy="0" r="2.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-330" cy="0" r="1.5" fill={`url(#${gradientPrefix}-sphere)`} />

            {/* Tapered middle connecting C-curve */}
            <path
              d="M -275,-10 C -250,-40 -200,-35 -170,0 C -140,35 -90,40 -60,0"
              fill="none"
              stroke={`url(#${gradientPrefix}-deep-amber)`}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M -275,-10 C -250,-35 -200,-30 -170,0 C -140,30 -90,35 -60,0"
              fill="none"
              stroke={`url(#${gradientPrefix}-medium-gold)`}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Inner voluptuous spiral terminating towards center */}
            <path
              d="M -60,0 C -40,-25 -30,-45 -45,-60 C -55,-70 -75,-65 -80,-50 C -85,-35 -70,-25 -60,-30 C -55,-32 -55,-38 -60,-38"
              fill="none"
              stroke={`url(#${gradientPrefix}-deep-amber)`}
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <path
              d="M -60,0 C -40,-25 -30,-45 -45,-60 C -55,-70 -75,-65 -80,-50 C -85,-35 -70,-25 -60,-30"
              fill="none"
              stroke={`url(#${gradientPrefix}-medium-gold)`}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Pointed Leaf with midrib veins branching off main scroll */}
            <g transform="translate(-170, 0)">
              <path
                d="M 0,0 Q -20,20 -40,10 Q -15,0 0,0 Z"
                fill={`url(#${gradientPrefix}-medium-gold)`}
              />
              <path
                d="M -5,3 L -35,10"
                stroke={palette.deep}
                strokeWidth="1"
                strokeLinecap="round"
              />
            </g>

            {/* Second Leaf */}
            <g transform="translate(-120, 15) rotate(-30)">
              <path
                d="M 0,0 Q -25,-25 -50,-15 Q -20,5 0,0 Z"
                fill={`url(#${gradientPrefix}-medium-gold)`}
              />
              <path
                d="M -5,-3 L -45,-15"
                stroke={palette.deep}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>

            {/* Third Leaf near the inner spiral */}
            <g transform="translate(-75, -15) rotate(45)">
              <path
                d="M 0,0 Q -15,-15 -30,-5 Q -10,10 0,0 Z"
                fill={`url(#${gradientPrefix}-deep-amber)`}
              />
              <path
                d="M -3,-2 L -25,-5"
                stroke={palette.highlight}
                strokeWidth="1"
                strokeLinecap="round"
              />
            </g>

            {/* Graduated bead dot trail following outer spiral curve */}
            <circle cx="-88" cy="-55" r="4.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-100" cy="-45" r="3.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-110" cy="-35" r="2.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-118" cy="-25" r="2" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-124" cy="-15" r="1.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-128" cy="-5" r="1" fill={`url(#${gradientPrefix}-sphere)`} />

            {/* Second graduated dot trail following mid C-curve */}
            <circle cx="-185" cy="18" r="4" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-200" cy="20" r="3" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-212" cy="18" r="2" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-222" cy="12" r="1.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-230" cy="5" r="1" fill={`url(#${gradientPrefix}-sphere)`} />

            {/* Key intersection large spheres */}
            <circle cx="-170" cy="0" r="5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-60" cy="0" r="6" fill={`url(#${gradientPrefix}-sphere)`} />
          </g>

          {/* --- RIGHT SCROLLWORK (Mirrored) --- */}
          <g transform="scale(-1, 1)">
            {/* Outermost tight spiral */}
            <path
              d="M -300,0 C -300,-15 -285,-20 -275,-10 C -265,0 -270,12 -280,12 C -286,12 -288,7 -284,5 C -281,4 -281,7 -284,7"
              fill="none"
              stroke={`url(#${gradientPrefix}-medium-gold)`}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Outermost dots */}
            <circle cx="-312" cy="0" r="3" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-322" cy="0" r="2.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-330" cy="0" r="1.5" fill={`url(#${gradientPrefix}-sphere)`} />

            {/* Tapered middle connecting C-curve */}
            <path
              d="M -275,-10 C -250,-40 -200,-35 -170,0 C -140,35 -90,40 -60,0"
              fill="none"
              stroke={`url(#${gradientPrefix}-deep-amber)`}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M -275,-10 C -250,-35 -200,-30 -170,0 C -140,30 -90,35 -60,0"
              fill="none"
              stroke={`url(#${gradientPrefix}-medium-gold)`}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Inner voluptuous spiral terminating towards center */}
            <path
              d="M -60,0 C -40,-25 -30,-45 -45,-60 C -55,-70 -75,-65 -80,-50 C -85,-35 -70,-25 -60,-30 C -55,-32 -55,-38 -60,-38"
              fill="none"
              stroke={`url(#${gradientPrefix}-deep-amber)`}
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <path
              d="M -60,0 C -40,-25 -30,-45 -45,-60 C -55,-70 -75,-65 -80,-50 C -85,-35 -70,-25 -60,-30"
              fill="none"
              stroke={`url(#${gradientPrefix}-medium-gold)`}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Pointed Leaf with midrib veins branching off main scroll */}
            <g transform="translate(-170, 0)">
              <path
                d="M 0,0 Q -20,20 -40,10 Q -15,0 0,0 Z"
                fill={`url(#${gradientPrefix}-medium-gold)`}
              />
              <path
                d="M -5,3 L -35,10"
                stroke={palette.deep}
                strokeWidth="1"
                strokeLinecap="round"
              />
            </g>

            {/* Second Leaf */}
            <g transform="translate(-120, 15) rotate(-30)">
              <path
                d="M 0,0 Q -25,-25 -50,-15 Q -20,5 0,0 Z"
                fill={`url(#${gradientPrefix}-medium-gold)`}
              />
              <path
                d="M -5,-3 L -45,-15"
                stroke={palette.deep}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>

            {/* Third Leaf near the inner spiral */}
            <g transform="translate(-75, -15) rotate(45)">
              <path
                d="M 0,0 Q -15,-15 -30,-5 Q -10,10 0,0 Z"
                fill={`url(#${gradientPrefix}-deep-amber)`}
              />
              <path
                d="M -3,-2 L -25,-5"
                stroke={palette.highlight}
                strokeWidth="1"
                strokeLinecap="round"
              />
            </g>

            {/* Graduated bead dot trail following outer spiral curve */}
            <circle cx="-88" cy="-55" r="4.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-100" cy="-45" r="3.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-110" cy="-35" r="2.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-118" cy="-25" r="2" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-124" cy="-15" r="1.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-128" cy="-5" r="1" fill={`url(#${gradientPrefix}-sphere)`} />

            {/* Second graduated dot trail following mid C-curve */}
            <circle cx="-185" cy="18" r="4" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-200" cy="20" r="3" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-212" cy="18" r="2" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-222" cy="12" r="1.5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-230" cy="5" r="1" fill={`url(#${gradientPrefix}-sphere)`} />

            {/* Key intersection large spheres */}
            <circle cx="-170" cy="0" r="5" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="-60" cy="0" r="6" fill={`url(#${gradientPrefix}-sphere)`} />
          </g>

          {/* --- CENTER LOTUS BLOOM --- */}
          <g>
            {/* 3 Back Petals (Wider, darker amber) */}
            {/* Left Back Petal */}
            <path
              d="M 0,15 C -40,15 -60,-20 -40,-45 C -20,-60 -10,-40 0,15 Z"
              fill={`url(#${gradientPrefix}-deep-amber)`}
            />
            <path d="M 0,15 L -35,-40" stroke={palette.highlight} strokeWidth="1" opacity="0.5" />
            
            {/* Right Back Petal */}
            <path
              d="M 0,15 C 40,15 60,-20 40,-45 C 20,-60 10,-40 0,15 Z"
              fill={`url(#${gradientPrefix}-deep-amber)`}
            />
            <path d="M 0,15 L 35,-40" stroke={palette.highlight} strokeWidth="1" opacity="0.5" />
            
            {/* Top/Center Back Petal */}
            <path
              d="M -15,15 C -25,-10 -15,-40 0,-55 C 15,-40 25,-10 15,15 Z"
              fill={`url(#${gradientPrefix}-deep-amber)`}
            />
            <path d="M 0,15 L 0,-50" stroke={palette.highlight} strokeWidth="1" opacity="0.5" />

            {/* 2 Middle Petals (Medium gold) */}
            {/* Left Middle Petal */}
            <path
              d="M 0,15 C -25,15 -45,-10 -25,-35 C -15,-45 0,-25 0,15 Z"
              fill={`url(#${gradientPrefix}-medium-gold)`}
            />
            <path d="M 0,15 L -20,-30" stroke={palette.deep} strokeWidth="1.5" />
            
            {/* Right Middle Petal */}
            <path
              d="M 0,15 C 25,15 45,-10 25,-35 C 15,-45 0,-25 0,15 Z"
              fill={`url(#${gradientPrefix}-medium-gold)`}
            />
            <path d="M 0,15 L 20,-30" stroke={palette.deep} strokeWidth="1.5" />

            {/* 1 Front/Center Bud Petal (Light cream with golden outline) */}
            <path
              d="M -12,15 C -15,0 -10,-20 0,-35 C 10,-20 15,0 12,15 Z"
              fill={`url(#${gradientPrefix}-cream)`}
              stroke={palette.primary}
              strokeWidth="2"
            />
            {/* Front Petal Midrib */}
            <path d="M 0,15 L 0,-28" stroke={palette.primary} strokeWidth="2" strokeLinecap="round" />

            {/* Central golden sphere/dot at base of petals */}
            <circle cx="0" cy="18" r="7" fill={`url(#${gradientPrefix}-sphere)`} />
            <circle cx="0" cy="18" r="4" fill={palette.highlight} opacity="0.4" />

            {/* Hanging Teardrop Pendant */}
            <g transform="translate(0, 30)">
              {/* Dot chain above pendant */}
              <circle cx="0" cy="0" r="2.5" fill={`url(#${gradientPrefix}-sphere)`} />
              <circle cx="0" cy="8" r="2" fill={`url(#${gradientPrefix}-sphere)`} />
              <circle cx="0" cy="15" r="1.5" fill={`url(#${gradientPrefix}-sphere)`} />
              
              {/* Diamond Teardrop Shape */}
              <path
                d="M 0,20 L -6,30 L 0,45 L 6,30 Z"
                fill={`url(#${gradientPrefix}-medium-gold)`}
                stroke={palette.deep}
                strokeWidth="1"
              />
              <path
                d="M 0,25 L 0,40"
                stroke={palette.highlight}
                strokeWidth="1"
              />
              
              {/* Final small dot below pendant */}
              <circle cx="0" cy="49" r="2" fill={`url(#${gradientPrefix}-sphere)`} />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default PeacockDivider;
