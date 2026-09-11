import Link from 'next/link';

import type { Settings } from '@/lib/data/types';

/**
 * Server-rendered footer. Contact details come from Settings so the owner can
 * change them in the admin panel. There is intentionally no newsletter form:
 * sending marketing email needs a configured consent-aware provider (§64).
 */
export function Footer({ settings }: { settings: Settings }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-8 border-gold bg-brown pb-8 pt-16 text-sand-soft md:pb-12 md:pt-24">
      <div className="container-page">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-5 lg:gap-12">
          <div className="space-y-6 lg:col-span-2">
            <Link href="/" className="inline-block" aria-label="POOJARO Home">
              <span className="font-display text-3xl tracking-widest text-ivory">{settings.storeName}</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-sand-deep md:text-base">
              {settings.tagline}
            </p>
            <div className="space-y-2 pt-2">
              <p className="eyebrow text-xs text-gold-soft">Need help choosing?</p>
              <p className="max-w-sm text-sm leading-relaxed text-sand-deep">
                Our support team can help you select a kit for the occasion you are preparing for.
              </p>
              <a
                href={`mailto:${settings.supportEmail}`}
                className="inline-flex text-sm font-medium text-gold-soft transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft focus-visible:ring-offset-2 focus-visible:ring-offset-brown"
              >
                {settings.supportEmail}
              </a>
            </div>
          </div>

          <FooterColumn
            title="Shop"
            links={[
              { href: '/kits', label: 'Complete Puja Kits' },
              { href: '/shop?category=puja-samagri', label: 'Puja Samagri' },
              { href: '/shop?category=diyas', label: 'Diyas & Lighting' },
              { href: '/shop?category=incense', label: 'Incense & Dhoop' },
              { href: '/shop', label: 'All Products' },
            ]}
          />
          <FooterColumn
            title="Occasions"
            links={[
              { href: '/occasions/griha-pravesh', label: 'Griha Pravesh' },
              { href: '/occasions/satyanarayan', label: 'Satyanarayan Puja' },
              { href: '/occasions/lakshmi-puja', label: 'Lakshmi Puja' },
              { href: '/occasions/ganesh-puja', label: 'Ganesh Puja' },
              { href: '/festivals', label: 'Shop by Festival' },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { href: '/about', label: 'Our Story' },
              { href: '/contact', label: 'Contact Us' },
              { href: '/shipping-policy', label: 'Shipping Policy' },
              { href: '/refund-policy', label: 'Returns & Refunds' },
              { href: '/privacy', label: 'Privacy Policy' },
            ]}
          />
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-sand-deep/20 pt-8 text-center md:mt-24 md:flex-row md:text-left">
          <div className="flex flex-col items-center gap-2 text-xs text-sand-deep/60 md:flex-row md:gap-4">
            <p>© {currentYear} {settings.storeName}. All rights reserved.</p>
            <span className="hidden md:inline">•</span>
            <p>{settings.tagline}</p>
          </div>
          <p className="text-xs text-sand-deep/60">Payment options are confirmed securely at checkout.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div className="space-y-4">
      <h2 className="eyebrow text-xs text-gold-soft">{title}</h2>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft focus-visible:ring-offset-2 focus-visible:ring-offset-brown">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}