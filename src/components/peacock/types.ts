export type PeacockVariant =
  | 'gold-on-dark'
  | 'henna-on-light'
  | 'terracotta-accent'
  | 'maroon-accent'
  | 'monochrome'
  | 'subtle-watermark';

export interface PeacockProps extends React.SVGProps<SVGSVGElement> {
  variant?: PeacockVariant;
  className?: string;
  size?: number | string;
  animate?: boolean;
}

/**
 * Rich 3D metallic golden palette derived from the reference artwork.
 * Each variant provides colors for SVG gradients that create
 * the volumetric, embossed Indian Mehendi look.
 */
export const PEACOCK_PALETTES = {
  'gold-on-dark': {
    primary: '#D4A04A',       // Rich medium gold (main strokes/fills)
    secondary: '#B78332',     // Warm antique gold
    accent: '#C4703C',        // Warm copper-terracotta accent
    highlight: '#F5E8C8',     // Cream highlight (lightest)
    deep: '#5C3820',          // Deep shadow brown
    mid: '#8B5E3C',           // Mid amber
    lightGold: '#E8C872',     // Light gold
    fillLight: 'rgba(212, 160, 74, 0.12)',
    fillWarm: 'rgba(196, 112, 60, 0.15)',
  },
  'henna-on-light': {
    primary: '#7A4A28',       // Deep henna amber
    secondary: '#5C3820',     // Dark henna brown
    accent: '#C4703C',        // Warm copper
    highlight: '#D4A04A',     // Golden highlight
    deep: '#3A2118',          // Deepest brown
    mid: '#8B5E3C',           // Mid amber
    lightGold: '#E8C872',     // Light gold
    fillLight: 'rgba(122, 74, 40, 0.06)',
    fillWarm: 'rgba(196, 112, 60, 0.10)',
  },
  'terracotta-accent': {
    primary: '#C4703C',
    secondary: '#8B5E3C',
    accent: '#D4A04A',
    highlight: '#F5E8C8',
    deep: '#5C3820',
    mid: '#B78332',
    lightGold: '#E8C872',
    fillLight: 'rgba(196, 112, 60, 0.08)',
    fillWarm: 'rgba(212, 160, 74, 0.12)',
  },
  'maroon-accent': {
    primary: '#7A2021',
    secondary: '#5C3820',
    accent: '#D4A04A',
    highlight: '#E8C872',
    deep: '#4E1415',
    mid: '#8B5E3C',
    lightGold: '#F5E8C8',
    fillLight: 'rgba(122, 32, 33, 0.06)',
    fillWarm: 'rgba(212, 160, 74, 0.12)',
  },
  'monochrome': {
    primary: 'currentColor',
    secondary: 'currentColor',
    accent: 'currentColor',
    highlight: 'currentColor',
    deep: 'currentColor',
    mid: 'currentColor',
    lightGold: 'currentColor',
    fillLight: 'transparent',
    fillWarm: 'transparent',
  },
  'subtle-watermark': {
    primary: 'currentColor',
    secondary: 'currentColor',
    accent: 'currentColor',
    highlight: 'currentColor',
    deep: 'currentColor',
    mid: 'currentColor',
    lightGold: 'currentColor',
    fillLight: 'transparent',
    fillWarm: 'transparent',
  },
};
