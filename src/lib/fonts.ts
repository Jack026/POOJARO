/**
 * Typefaces (§6).
 *
 * Cormorant Garamond for display, DM Sans for everything else. Both are loaded
 * as variable fonts, so the entire weight range costs two files rather than one
 * per weight — the single biggest font win available (§48).
 *
 * next/font self-hosts these at build time: no request to fonts.googleapis.com
 * at runtime, no render-blocking stylesheet, and no third party seeing our
 * visitors' IP addresses.
 */
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

/**
 * Display face. Used for headings and prices — the editorial voice of the brand.
 *
 * `adjustFontFallback` (on by default) generates a metric-matched local fallback
 * so the swap does not shift layout. That matters most here, because the display
 * sizes are enormous and a reflow would be impossible to miss.
 */
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cormorant',
  style: ['normal', 'italic'],
});

/** UI and body face. Carries navigation, buttons, forms and all long-form copy. */
export const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

/** Both variable class names, for the <html> element. */
export const fontVariables = `${cormorant.variable} ${dmSans.variable}`;
