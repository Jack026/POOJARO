import type { Metadata, Viewport } from 'next';
import { fontVariables } from '@/lib/fonts';
import { publicEnv } from '@/lib/env';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: 'POOJARO — Every Ritual. Everything You Need.',
    template: '%s | POOJARO',
  },
  description:
    'Authentic Indian Puja Samagri and thoughtfully curated Vedic ritual kits delivered across India. Pure havan samagri, handcrafted brass, and complete ceremony essentials.',
  keywords: [
    'puja samagri online',
    'puja kits india',
    'havan samagri',
    'diwali puja kit',
    'satyanarayan puja kit',
    'griha pravesh puja kit',
    'brass pooja thali',
    'vedic ritual essentials',
    'poojaro',
  ],
  authors: [{ name: 'POOJARO', url: publicEnv.siteUrl }],
  creator: 'POOJARO',
  publisher: 'POOJARO',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: publicEnv.siteUrl,
    siteName: 'POOJARO',
    title: 'POOJARO — Every Ritual. Everything You Need.',
    description:
      'Authentic Indian Puja Samagri and thoughtfully curated Vedic ritual kits delivered across India.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POOJARO — Every Ritual. Everything You Need.',
    description:
      'Authentic Indian Puja Samagri and thoughtfully curated Vedic ritual kits delivered across India.',
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
      <body className="min-h-dvh bg-ivory text-brown antialiased">{children}</body>
    </html>
  );
}
