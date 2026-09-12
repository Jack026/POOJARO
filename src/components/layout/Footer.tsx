import { Facebook, Instagram, Youtube } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { LotusMandala, PeacockTail } from '@/components/peacock';
import type { Settings } from '@/lib/data/types';
import { FooterNewsletter } from './FooterNewsletter';

function PinterestIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.053.225-.174.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.546.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
    </svg>
  );
}

/**
 * POOJARO SIGNATURE ROYAL HERITAGE FOOTER
 * Inspired by Indian royal palace archways and temple colophons.
 * Crowned by grand peacock plumes, sacred lotus bloom, and perched golden peacock.
 */
export function Footer({ settings }: { settings: Settings }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden bg-[#24130A] text-sand-soft pt-6 pb-6 md:pb-8 border-t border-gold/40">
      {/* Top Left Grand Peacock Tail Plume */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-[-35px] w-[46%] sm:w-[40%] lg:w-[35%] max-w-[460px] select-none z-0"
      >
        <PeacockTail
          flip="none"
          className="w-full h-auto opacity-75 sm:opacity-90 drop-shadow-[0_4px_24px_rgba(183,131,50,0.35)]"
        />
      </div>

      {/* Top Right Grand Peacock Tail Plume (Mirrored) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-[-35px] sm:right-] w-[46%] sm:w-[40%] lg:w-[35%] max-w-[460px] select-none z-0"
      >
        <PeacockTail
          flip="horizontal"
          className="w-full h-auto opacity-75 sm:opacity-90 drop-shadow-[0_4px_24px_rgba(183,131,50,0.35)]"
        />
      </div>

      {/* Subtle Background Lotus Rangoli Watermarks in Bottom Corners */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -left-36 z-0 opacity-[0.06] scale-110"
      >
        <LotusMandala variant="circular" size={420} />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -right-36 z-0 opacity-[0.06] scale-110"
      >
        <LotusMandala variant="circular" size={420} />
      </div>

      {/* Top Center Brand Archway */}
      <div className="container-page relative z-10">
        <div className="flex flex-col items-center justify-center text-center pt-2 sm:pt-4">
          {/* Sacred Golden Lotus Bloom */}
          <div className="relative w-12 sm:w-14 md:w-16 h-auto mb-1 drop-shadow-[0_2px_14px_rgba(183,131,50,0.45)]">
            <Image
              src="/images/peacock/footer-lotus-top.png"
              alt=""
              width={160}
              height={156}
              className="w-full h-auto object-contain"
              priority={false}
              unoptimized
            />
          </div>

          {/* Royal Brand Title */}
          <Link href="/" aria-label="POOJARO Home">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-[0.24em] text-[#E8C988] uppercase drop-shadow-[0_2px_18px_rgba(183,131,50,0.3)] transition-colors hover:text-white">
              POOJARO
            </h2>
          </Link>

          {/* Tagline */}
          <p className="font-serif italic text-sm sm:text-base text-[#D4AF37]/90 tracking-wide mt-1">
            Sacred Rituals. Beautifully Prepared.
          </p>

          {/* Ornamental Flourish Node */}
          <div className="flex items-center justify-center gap-3 mt-2.5 text-gold-soft/70">
            <span className="h-[1px] w-12 sm:w-16 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            <span className="text-xs">❖</span>
            <span className="h-[1px] w-12 sm:w-16 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          </div>
        </div>

        {/* 6 Column Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6 mt-12 md:mt-16 pb-12">
          {/* 1. Shop */}
          <FooterColumn
            title="Shop"
            links={[
              { href: '/kits', label: 'Puja Kits' },
              { href: '/shop?category=puja-samagri', label: 'Samagri' },
              { href: '/shop?category=idols-murtis', label: 'Idols & Murtis' },
              { href: '/festivals', label: 'Festive Collection' },
              { href: '/shop?sort=newest', label: 'New Arrivals' },
              { href: '/shop', label: 'All Products' },
            ]}
          />

          {/* 2. Support */}
          <FooterColumn
            title="Support"
            links={[
              { href: '/contact#faq', label: 'FAQ' },
              { href: '/shipping-policy', label: 'Shipping' },
              { href: '/refund-policy', label: 'Returns & Refunds' },
              { href: '/account/orders', label: 'Track Order' },
              { href: '/contact?type=bulk', label: 'Bulk Orders' },
              { href: '/contact', label: 'Contact Us' },
            ]}
          />

          {/* 3. Company */}
          <FooterColumn
            title="Company"
            links={[
              { href: '/about', label: 'About Us' },
              { href: '/about#story', label: 'Our Story' },
              { href: '/about', label: 'Blogs' },
              { href: '/about', label: 'Careers' },
              { href: '/about', label: 'Press' },
              { href: '/privacy', label: 'Terms & Privacy' },
            ]}
          />

          {/* 4. Occasions */}
          <FooterColumn
            title="Occasions"
            links={[
              { href: '/occasions', label: 'Daily Puja' },
              { href: '/festivals', label: 'Festivals' },
              { href: '/occasions/griha-pravesh', label: 'Griha Pravesh' },
              { href: '/occasions', label: 'Wedding' },
              { href: '/contact?type=corporate', label: 'Corporate Gifting' },
              { href: '/ritual-finder', label: 'Custom Kits' },
            ]}
          />

          {/* 5. Stay Connected */}
          <div className="space-y-4">
            <h3 className="font-display text-base tracking-wider text-[#E8C988]">Stay Connected</h3>
            <p className="text-xs sm:text-sm text-sand-deep/80 leading-relaxed">
              Follow us for rituals, traditions and special offers.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={settings.social?.instagram || 'https://instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow POOJARO on Instagram"
                className="w-8 h-8 rounded-full border border-gold/40 flex items-center justify-center text-gold-soft hover:text-white hover:border-gold hover:bg-gold/20 transition-all"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href={settings.social?.facebook || 'https://facebook.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow POOJARO on Facebook"
                className="w-8 h-8 rounded-full border border-gold/40 flex items-center justify-center text-gold-soft hover:text-white hover:border-gold hover:bg-gold/20 transition-all"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a
                href={settings.social?.youtube || 'https://youtube.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow POOJARO on YouTube"
                className="w-8 h-8 rounded-full border border-gold/40 flex items-center justify-center text-gold-soft hover:text-white hover:border-gold hover:bg-gold/20 transition-all"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow POOJARO on Pinterest"
                className="w-8 h-8 rounded-full border border-gold/40 flex items-center justify-center text-gold-soft hover:text-white hover:border-gold hover:bg-gold/20 transition-all"
              >
                <PinterestIcon className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] text-sand-deep/70">
              <span className="text-gold-soft text-xs">❖</span>
              <span className="font-medium tracking-wide">Made with devotion in India 💛</span>
            </div>
          </div>

          {/* 6. Newsletter */}
          <div className="space-y-4">
            <h3 className="font-display text-base tracking-wider text-[#E8C988]">Newsletter</h3>
            <p className="text-xs sm:text-sm text-sand-deep/80 leading-relaxed">
              Get exclusive offers, new arrivals and spiritual insights.
            </p>
            <FooterNewsletter />
          </div>
        </div>

        {/* Bottom Perched Peacock Divider Bar */}
        <div className="relative mt-4 pt-6 border-t border-gold/30">
          {/* Perched Peacock sitting in the center of the divider */}
          <div className="absolute left-1/2 -top-5 -translate-x-1/2 flex items-center gap-3 px-3 bg-[#24130A]">
            <span className="text-gold-soft/80 text-xs">✦</span>
            <div className="relative w-12 md:w-14 h-auto">
              <Image
                src="/images/peacock/footer-peacock.png"
                alt="POOJARO Sacred Peacock Emblem"
                width={240}
                height={168}
                className="w-full h-auto object-contain drop-shadow-[0_2px_10px_rgba(183,131,50,0.45)]"
                priority={false}
                unoptimized
              />
            </div>
            <span className="text-gold-soft/80 text-xs">✦</span>
          </div>

          {/* Bottom Copyright & Sacred Statement */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-sand-deep/70 tracking-wider pt-2">
            <div className="flex items-center gap-2">
              <span className="text-gold-soft/80 text-xs">✦</span>
              <p>© {currentYear} {settings.storeName}. All rights reserved.</p>
            </div>
            <p className="uppercase tracking-[0.18em] font-medium text-gold-soft/80 text-[10px] md:text-[11px] text-center md:text-right">
              POOJARO — MORE THAN A STORE. A SACRED EXPERIENCE.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-base tracking-wider text-[#E8C988]">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-xs sm:text-sm text-sand-deep/80 transition-colors hover:text-white hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-soft"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
