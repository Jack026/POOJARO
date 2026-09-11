import type { Metadata } from 'next';

import { getStore } from '@/lib/data';
import { buildMetadata, jsonLd, organizationSchema, websiteSchema } from '@/lib/seo';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { ScrollProgress } from '@/components/layout/ScrollProgress';
import { CustomCursor } from '@/components/layout/CustomCursor';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { QuickViewModal } from '@/components/quick-view/QuickViewModal';
import { Toaster } from '@/components/ui/Toaster';

/**
 * Storefront shell. Everything customer-facing lives under this route group, so
 * this is where the header, footer, cart drawer and site-wide structured data
 * belong — never in the root layout, or the admin panel would inherit them.
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

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const store = await getStore();
  const settings = await store.getSettings();

  return (
    // The sticky-footer frame that used to live on <body>. It sits inside the
    // root <body> now, scoped to storefront routes only.
    <div className="flex min-h-dvh flex-col justify-between">
      {/* First tab stop on every page: jump past the header straight to content. */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <ScrollProgress />
      <CustomCursor />
      <AnnouncementBar announcement={settings.announcement} />
      <Header />

      <div className="flex-1">{children}</div>

      <Footer settings={settings} />
      <CartDrawer />
      <QuickViewModal />
      <WhatsAppButton settings={settings} />
      <Toaster />

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
    </div>
  );
}
