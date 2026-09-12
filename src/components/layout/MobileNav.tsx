'use client';

import Link from 'next/link';
import { Sheet } from '@/components/ui/Sheet';
import { User, Package, Heart, Sparkles, Compass, ShoppingBag } from 'lucide-react';
import { PeacockMini } from '@/components/peacock';

const NAV_GROUPS = [
  {
    label: 'Catalogue',
    links: [
      { href: '/shop', label: 'Browse All Products' },
      { href: '/kits', label: 'Complete Puja Kits' },
      { href: '/shop?category=puja-samagri', label: 'Sacred Puja Samagri' },
      { href: '/ritual-finder', label: 'Interactive Ritual Finder', highlight: true },
    ],
  },
  {
    label: 'Shop by Occasion',
    links: [
      { href: '/occasions/griha-pravesh', label: 'Griha Pravesh (Housewarming)' },
      { href: '/occasions/satyanarayan', label: 'Satyanarayan Puja' },
      { href: '/occasions/ganesh-puja', label: 'Ganesh Puja' },
      { href: '/occasions/lakshmi-puja', label: 'Lakshmi Puja' },
      { href: '/occasions/shiv-puja', label: 'Shiv Puja' },
      { href: '/occasions/durga-puja', label: 'Durga Puja' },
    ],
  },
  {
    label: 'Festivals of India',
    links: [
      { href: '/festivals/diwali', label: 'Diwali Specials' },
      { href: '/festivals/navratri', label: 'Navratri Puja Sets' },
      { href: '/festivals/ganesh-chaturthi', label: 'Ganesh Chaturthi' },
      { href: '/festivals/mahashivratri', label: 'Mahashivratri' },
    ],
  },
  {
    label: 'POOJARO',
    links: [
      { href: '/about', label: 'Our Heritage & Mission' },
      { href: '/contact', label: 'Customer Support' },
      { href: '/shipping-policy', label: 'Shipping & Delivery' },
      { href: '/refund-policy', label: 'Returns & Refunds' },
    ],
  },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="left"
      title="Navigation"
      className="max-w-xs w-full"
    >
      <nav aria-label="Mobile navigation" className="pb-8">
        {/* Brand Header */}
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-sand-deep/40">
          <PeacockMini variant="henna-on-light" size={24} className="shrink-0" />
          <span className="font-display text-lg tracking-wider text-brown font-semibold">
            POOJARO
          </span>
        </div>

        {/* Navigation Sections */}
        <div className="divide-y divide-sand-deep/40">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="py-4 first:pt-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-deep mb-2">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={`min-h-[44px] flex items-center px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
                        link.highlight
                          ? 'bg-gold/15 text-gold-deep border border-gold/30'
                          : 'text-brown hover:text-gold-deep hover:bg-gold-wash/60'
                      }`}
                    >
                      {link.highlight && <Compass className="w-4 h-4 mr-2 text-gold-deep shrink-0" />}
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Customer Account & Wishlist */}
        <div className="mt-6 pt-6 border-t border-sand-deep/60">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brown-muted mb-2">
            My Account
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href="/account"
                onClick={onClose}
                className="min-h-[44px] flex items-center gap-2.5 px-3 py-2 text-sm text-brown hover:text-gold-deep hover:bg-gold-wash/60 rounded-lg transition-colors"
              >
                <User className="w-4 h-4 text-gold-deep shrink-0" />
                <span>Profile & Details</span>
              </Link>
            </li>
            <li>
              <Link
                href="/account/orders"
                onClick={onClose}
                className="min-h-[44px] flex items-center gap-2.5 px-3 py-2 text-sm text-brown hover:text-gold-deep hover:bg-gold-wash/60 rounded-lg transition-colors"
              >
                <Package className="w-4 h-4 text-gold-deep shrink-0" />
                <span>My Orders & Tracking</span>
              </Link>
            </li>
            <li>
              <Link
                href="/wishlist"
                onClick={onClose}
                className="min-h-[44px] flex items-center gap-2.5 px-3 py-2 text-sm text-brown hover:text-gold-deep hover:bg-gold-wash/60 rounded-lg transition-colors"
              >
                <Heart className="w-4 h-4 text-gold-deep shrink-0" />
                <span>Saved Wishlist</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Footer Tagline */}
        <div className="mt-8 pt-4 border-t border-sand-deep/30 text-[11px] text-brown-muted/70 text-center font-medium">
          Every Ritual. Everything You Need.
        </div>
      </nav>
    </Sheet>
  );
}
