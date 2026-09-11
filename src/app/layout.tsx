import type { Metadata, Viewport } from 'next';

import { fontVariables } from '@/lib/fonts';

import './globals.css';

/**
 * The one true root layout — the only place in the app allowed to render
 * <html>/<body>. It is deliberately bare: the storefront and the admin panel
 * are two different experiences, so each owns its own chrome in its own layout
 * (app/(site)/layout.tsx and app/admin/layout.tsx) rather than sharing one.
 *
 * Nesting <html> inside <html> is exactly the hydration error this structure
 * fixes — admin used to declare its own document shell while living inside the
 * storefront root. Route groups keep the URLs unchanged ((site) is stripped
 * from the path) while letting the chrome apply to storefront routes only.
 */
export const metadata: Metadata = {
  title: { default: 'POOJARO', template: '%s | POOJARO' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Pinch-zoom must stay available. Locking it is an accessibility failure (§49).
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f3' },
    { media: '(prefers-color-scheme: dark)', color: '#3a2118' },
  ],
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={fontVariables} suppressHydrationWarning>
      {/* bg-ivory is the storefront default and the surface the global 404 /
          error boundaries sit on; the admin layout paints its own white canvas
          over it. */}
      <body className="min-h-dvh bg-ivory text-brown antialiased">{children}</body>
    </html>
  );
}
