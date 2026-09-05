import type { Metadata, Viewport } from 'next';

import { getStore } from '@/lib/data';
import { fontVariables } from '@/lib/fonts';
import { buildMetadata, jsonLd, organizationSchema, websiteSchema } from '@/lib/seo';

import './globals.css';

/**
 * Root metadata.
 *
 * Read from Settings rather than hard-coded so the owner can rename the store or
 * rewrite the tagline in the admin panel and have it reach search results and
 * social cards without a deploy (§52, §57).
 */
export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  const settings = await store.getSettings();
  return buildMetadata({ path: '/' }, settings);
}

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await getStore();
  const settings = await store.getSettings();

  return (
    <html lang="en-IN" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh bg-ivory text-brown antialiased">
        {/* First tab stop on every page: jump past the header straight to content. */}
        <a href="#main" className="skip-link">
          Skip to main content
        </a>

        {children}

        {/* Site-wide structured data (§47). Page-level Product and Breadcrumb
            schemas are emitted by the pages that own them. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema(settings)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema(settings)) }}
        />
      </body>
    </html>
  );
}
