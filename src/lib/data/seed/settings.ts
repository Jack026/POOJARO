import type { Settings, TrustBadge } from '../types';
import { SEEDED_AT } from './products';

/**
 * Store configuration. Everything here is editable in Admin → Settings, which
 * is the point: shipping thresholds, delivery windows, the return window and
 * the trust badges are business promises, so they must be changeable by the
 * owner rather than compiled into a component.
 *
 * The trust badge copy is deliberately narrow — it states what the store can
 * verifiably do (ship via a courier network, take UPI and cards through a
 * gateway, accept returns inside a stated window) and avoids claims about
 * sourcing or authenticity that nobody can substantiate from here.
 */

const TRUST_BADGES: TrustBadge[] = [
  {
    id: 'trust-delivery',
    icon: 'Truck',
    title: 'Pan-India delivery',
    subtitle: 'Shipped to serviceable pincodes across India.',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'trust-payments',
    icon: 'ShieldCheck',
    title: 'Secure payments',
    subtitle: 'UPI, cards and net banking through an encrypted gateway.',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'trust-returns',
    icon: 'RotateCcw',
    title: '7-day returns',
    subtitle: 'On unopened, non-perishable items.',
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'trust-packing',
    icon: 'Package',
    title: 'Packed to arrive intact',
    subtitle: 'Powders sealed, clay cushioned, fresh items wrapped.',
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'trust-support',
    icon: 'MessageCircle',
    title: 'Help choosing',
    subtitle: 'Message us on WhatsApp before you order.',
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'trust-curation',
    icon: 'ListChecks',
    title: 'Checked against the vidhi',
    subtitle: 'Kit contents are listed in full, item by item.',
    isActive: true,
    sortOrder: 6,
  },
];

export function buildSeedSettings(): Settings {
  return {
    storeName: 'POOJARO',
    tagline: 'Every Ritual. Everything You Need.',
    supportEmail: process.env.SUPPORT_EMAIL?.trim() || 'support@poojaro.in',
    supportPhone: process.env.SUPPORT_PHONE?.trim() || '',
    // Placeholder until the business WhatsApp number is set — the floating
    // button hides itself rather than linking to a number nobody answers.
    whatsappNumber: process.env.WHATSAPP_NUMBER?.trim() || '',
    whatsappMessage: 'Namaste POOJARO, I need help choosing a Puja Kit.',
    freeShippingThreshold: Number(process.env.FREE_DELIVERY_THRESHOLD ?? 499) * 100,
    shippingFee: Number(process.env.DELIVERY_FEE ?? 49) * 100,
    codEnabled: true,
    codFee: 2900,
    deliveryDaysMin: 3,
    deliveryDaysMax: 6,
    returnWindowDays: 7,
    blockedPincodePrefixes: [],
    announcement: {
      text: 'Free delivery on orders above ₹499',
      href: '/kits',
      isActive: true,
    },
    trustBadges: TRUST_BADGES,
    social: { instagram: '', facebook: '', youtube: '' },
    updatedAt: SEEDED_AT,
  };
}
