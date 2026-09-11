'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sheet } from '@/components/ui/Sheet';
import { EASE_OUT_SOFT, DURATION } from '@/lib/motion';

const NAV_GROUPS = [
  {
    label: 'Shop',
    links: [
      { href: '/shop', label: 'Browse All Products' },
      { href: '/kits', label: 'Puja Kits' },
      { href: '/shop?category=puja-samagri', label: 'Puja Samagri' },
    ],
  },
  {
    label: 'By Occasion',
    links: [
      { href: '/occasions/griha-pravesh', label: 'Griha Pravesh' },
      { href: '/occasions/satyanarayan', label: 'Satyanarayan Puja' },
      { href: '/occasions/ganesh-puja', label: 'Ganesh Puja' },
      { href: '/occasions/lakshmi-puja', label: 'Lakshmi Puja' },
      { href: '/occasions/shiv-puja', label: 'Shiv Puja' },
      { href: '/occasions/durga-puja', label: 'Durga Puja' },
    ],
  },
  {
    label: 'Festivals',
    links: [
      { href: '/festivals/diwali', label: 'Diwali' },
      { href: '/festivals/navratri', label: 'Navratri' },
      { href: '/festivals/ganesh-chaturthi', label: 'Ganesh Chaturthi' },
      { href: '/festivals/durga-puja', label: 'Durga Puja' },
      { href: '/festivals/mahashivratri', label: 'Mahashivratri' },
    ],
  },
  {
    label: 'Explore',
    links: [
      { href: '/ritual-finder', label: 'Ritual Finder' },
      { href: '/about', label: 'Our Story' },
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
      title="Menu"
      className="max-w-xs w-full"
    >
      <nav aria-label="Mobile navigation">
        <div className="divide-y divide-sand-deep/50">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="py-4 first:pt-0">
              <p className="text-xs eyebrow mb-3">{group.label}</p>
              <ul className="space-y-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="block px-2 py-2 text-sm text-brown hover:text-gold-deep hover:bg-gold-wash/60 rounded-md transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Account / Auth links */}
        <div className="mt-6 pt-6 border-t border-sand-deep/60">
          <ul className="space-y-1">
            <li>
              <Link
                href="/account"
                onClick={onClose}
                className="block px-2 py-2 text-sm text-brown hover:text-gold-deep hover:bg-gold-wash/60 rounded-md transition-colors"
              >
                My Account
              </Link>
            </li>
            <li>
              <Link
                href="/account/orders"
                onClick={onClose}
                className="block px-2 py-2 text-sm text-brown hover:text-gold-deep hover:bg-gold-wash/60 rounded-md transition-colors"
              >
                My Orders
              </Link>
            </li>
            <li>
              <Link
                href="/account/wishlist"
                onClick={onClose}
                className="block px-2 py-2 text-sm text-brown hover:text-gold-deep hover:bg-gold-wash/60 rounded-md transition-colors"
              >
                Wishlist
              </Link>
            </li>
          </ul>
        </div>

        {/* Bottom tag */}
        <div className="mt-8 pt-4 border-t border-sand-deep/40 text-[11px] text-brown-muted/60 text-center">
          Every Ritual. Everything You Need.
        </div>
      </nav>
    </Sheet>
  );
}
