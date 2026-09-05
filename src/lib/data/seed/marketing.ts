import type { Banner, Coupon, PreparationLevel, RecommendationRule } from '../types';
import { SEEDED_AT } from './products';

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

/**
 * Mirrors the three codes seeded in the Flutter app so a customer sees the same
 * offers on either client. Discounts are recomputed server-side at checkout —
 * a code in the cart is only ever a claim until the server agrees with it.
 */
export const COUPONS: Coupon[] = [
  {
    id: 'coupon-first10',
    code: 'FIRST10',
    type: 'percentage',
    value: 10,
    description: '10% off your first order',
    minOrderAmount: 29900,
    maxDiscount: 30000,
    productIds: [],
    categoryIds: [],
    firstOrderOnly: true,
    usageLimit: null,
    usageCount: 0,
    perUserLimit: 1,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    createdAt: SEEDED_AT,
  },
  {
    id: 'coupon-puja100',
    code: 'PUJA100',
    type: 'flat',
    value: 10000,
    description: '₹100 off orders above ₹599',
    minOrderAmount: 59900,
    maxDiscount: null,
    productIds: [],
    categoryIds: [],
    firstOrderOnly: false,
    usageLimit: 2000,
    usageCount: 0,
    perUserLimit: 3,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    createdAt: SEEDED_AT,
  },
  {
    id: 'coupon-festive20',
    code: 'FESTIVE20',
    type: 'percentage',
    value: 20,
    description: '20% off puja kits above ₹999, capped at ₹300',
    minOrderAmount: 99900,
    maxDiscount: 30000,
    productIds: [],
    categoryIds: ['puja-kits'],
    firstOrderOnly: false,
    usageLimit: 1000,
    usageCount: 0,
    perUserLimit: 2,
    startsAt: null,
    // Expiry is data, not a constant in a component, so Admin → Coupons can
    // extend it without a deploy.
    expiresAt: '2026-11-16T18:29:59.000Z',
    isActive: true,
    createdAt: SEEDED_AT,
  },
];

// ---------------------------------------------------------------------------
// Homepage banners (editable in Admin → Banners)
// ---------------------------------------------------------------------------

export const BANNERS: Banner[] = [
  {
    id: 'banner-announcement',
    slot: 'announcement',
    eyebrow: '',
    title: 'Free delivery on orders above ₹499',
    subtitle: 'Pan-India shipping',
    ctaLabel: 'Shop kits',
    ctaHref: '/kits',
    imageUrl: '',
    sortOrder: 1,
    isActive: true,
    startsAt: null,
    endsAt: null,
  },
  {
    id: 'banner-hero-primary',
    slot: 'hero',
    eyebrow: 'Authentic Puja Samagri',
    title: 'Every Ritual. Everything You Need.',
    subtitle:
      'Authentic Puja Samagri and thoughtfully prepared ritual kits, brought together for the moments that matter.',
    ctaLabel: 'Shop Puja Kits',
    ctaHref: '/kits',
    imageUrl: 'hero-thali',
    sortOrder: 1,
    isActive: true,
    startsAt: null,
    endsAt: null,
  },
  {
    id: 'banner-promo-ritual-finder',
    slot: 'promo_strip',
    eyebrow: 'Not sure what you need?',
    title: 'Answer four questions. We will find your kit.',
    subtitle: 'Tell us what you are preparing for and how many people are joining.',
    ctaLabel: 'Start the Ritual Finder',
    ctaHref: '/ritual-finder',
    imageUrl: 'sam-vials',
    sortOrder: 1,
    isActive: true,
    startsAt: null,
    endsAt: null,
  },
  {
    id: 'banner-promo-first-order',
    slot: 'promo_strip',
    eyebrow: 'First order',
    title: '10% off with FIRST10',
    subtitle: 'On your first order above ₹299.',
    ctaLabel: 'Shop samagri',
    ctaHref: '/shop',
    imageUrl: 'sam-kumkum',
    sortOrder: 2,
    isActive: true,
    startsAt: null,
    endsAt: null,
  },
  {
    id: 'banner-festival-diwali',
    slot: 'festival',
    eyebrow: 'Diwali',
    title: 'Light Your Home',
    subtitle: 'Celebrate with intention. Lakshmi Puja essentials, diyas and lamps for the whole house.',
    ctaLabel: 'Shop Diwali',
    ctaHref: '/festivals/diwali',
    imageUrl: 'sam-coins',
    sortOrder: 1,
    isActive: true,
    startsAt: '2026-10-15T00:00:00.000Z',
    endsAt: '2026-11-13T00:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Ritual Finder rules
// ---------------------------------------------------------------------------

interface LevelSpec {
  productId: string;
  reason: string;
  addOns: string[];
}

interface OccasionSpec {
  occasionId: string;
  /** Headcount one unit of the recommended product comfortably covers. */
  peoplePerUnit: number;
  levels: Record<PreparationLevel, LevelSpec>;
}

/**
 * The recommendation table. Rules are expanded from this into three headcount
 * bands per occasion and level, so every answer combination resolves to a real
 * product with a real reason — and each generated row stays individually
 * editable in Admin → Ritual Finder.
 */
const OCCASION_SPECS: OccasionSpec[] = [
  {
    occasionId: 'griha-pravesh',
    peoplePerUnit: 15,
    levels: {
      essentials: {
        productId: 'kit-griha-pravesh',
        reason:
          'This is the full samagri list for a Griha Pravesh in one tray — kalash, nine diyas, kalawa for the doorway and the labelled vials. Enough for the ceremony itself without extras.',
        addOns: ['sam-kalawa'],
      },
      complete: {
        productId: 'kit-griha-pravesh',
        reason:
          'Most Griha Pravesh ceremonies include a havan, and the kit does not carry samidha or ghee. Pairing it with the havan samagri covers the whole morning end to end.',
        addOns: ['kit-havan', 'sam-garland', 'sam-akshat'],
      },
      premium: {
        productId: 'kit-griha-pravesh',
        reason:
          'For a new home it is worth owning the vessels rather than borrowing them. The brass thali and copper kalash stay with the house long after the ceremony, and the havan kit completes the vidhi.',
        addOns: ['sam-thali', 'sam-kalash', 'kit-havan', 'sam-garland'],
      },
    },
  },
  {
    occasionId: 'satyanarayan',
    peoplePerUnit: 6,
    levels: {
      essentials: {
        productId: 'kit-satyanarayan',
        reason:
          'The panchamrit set, tulsi and banana leaves are the parts that are hardest to gather on the day. This covers the katha with the immediate family.',
        addOns: [],
      },
      complete: {
        productId: 'kit-satyanarayan',
        reason:
          'A katha runs a couple of hours, so the diyas and agarbatti go faster than expected. Extra paan and mishri also mean prasad for everyone who turns up.',
        addOns: ['sam-paan-supari', 'sam-mishri', 'sam-agarbatti'],
      },
      premium: {
        productId: 'kit-satyanarayan',
        reason:
          'A monthly Purnima puja justifies a permanent thali. The brass set holds the five offerings properly instead of small bowls sliding around a steel plate.',
        addOns: ['sam-thali', 'sam-paan-supari', 'sam-mishri', 'sam-kalash'],
      },
    },
  },
  {
    occasionId: 'lakshmi-puja',
    peoplePerUnit: 8,
    levels: {
      essentials: {
        productId: 'kit-lakshmi',
        reason:
          'The coins, lotus, mishri and eleven diyas — the specific offerings Lakshmi Puja calls for, in the quantity a home puja actually uses.',
        addOns: ['sam-wick'],
      },
      complete: {
        productId: 'kit-lakshmi',
        reason:
          'On Diwali night the lamps go well beyond the altar — doorway, balcony, parapet. A dozen extra diyas and a hundred wicks is the difference between lighting the house and rationing.',
        addOns: ['sam-diya-clay', 'sam-wick', 'sam-garland'],
      },
      premium: {
        productId: 'kit-lakshmi',
        reason:
          'A brass thali and fresh garland make the evening puja feel like the occasion it is, and both get used again every Friday.',
        addOns: ['sam-thali', 'sam-diya-clay', 'sam-garland', 'sam-mishri'],
      },
    },
  },
  {
    occasionId: 'ganesh-puja',
    peoplePerUnit: 10,
    levels: {
      essentials: {
        productId: 'kit-ganesh',
        reason:
          'Durva in bundles of twenty-one and red flowers are the offerings specific to Ganesha, and the ones that sell out first before Chaturthi. This covers the sthapana and the first evenings.',
        addOns: [],
      },
      complete: {
        productId: 'kit-ganesh',
        reason:
          'Chaturthi runs ten days with an aarti each evening, so camphor and agarbatti need topping up. A fresh garland for the sthapana morning is worth ordering to the date.',
        addOns: ['sam-garland', 'sam-camphor', 'sam-agarbatti'],
      },
      premium: {
        productId: 'kit-ganesh',
        reason:
          'If Ganpati comes home every year, the brass thali and extra diyas stop being a purchase and become part of the setup. Ten days of aarti is easier with both.',
        addOns: ['sam-thali', 'sam-garland', 'sam-diya-clay', 'sam-camphor'],
      },
    },
  },
  {
    occasionId: 'shiv-puja',
    peoplePerUnit: 8,
    levels: {
      essentials: {
        productId: 'kit-shiv',
        reason:
          'Bilva patra, vibhuti and gangajal, with enough for the four abhisheks of a Shivratri vigil. Shiv puja asks for little, and this does not pad it out.',
        addOns: [],
      },
      complete: {
        productId: 'kit-shiv',
        reason:
          'An all-night vigil needs lamps that last until morning. Cotton wicks and extra camphor cover the later prahars, when running out is least convenient.',
        addOns: ['sam-wick', 'sam-camphor'],
      },
      premium: {
        productId: 'kit-shiv',
        reason:
          'For a regular Somvar vrat the brass thali and a copper kalash for the abhishek water make the routine simpler, and both last years.',
        addOns: ['sam-thali', 'sam-kalash', 'sam-wick'],
      },
    },
  },
  {
    occasionId: 'durga-puja',
    peoplePerUnit: 12,
    levels: {
      essentials: {
        productId: 'kit-durga',
        reason:
          'Sindoor for the khela, the chunri and three garlands, with lamp oil and wicks quantified for five days rather than one evening.',
        addOns: [],
      },
      complete: {
        productId: 'kit-durga',
        reason:
          'Twice-daily aarti from Shashthi to Dashami burns through diyas and wicks quickly. The akhand jyot kit also gives you a brass lamp that holds a continuous flame.',
        addOns: ['kit-navratri', 'sam-diya-clay', 'sam-wick'],
      },
      premium: {
        productId: 'kit-durga',
        reason:
          'For a household that hosts, the brass thali and fresh garlands carry the five days properly, with the akhand jyot lamp running alongside.',
        addOns: ['kit-navratri', 'sam-thali', 'sam-garland', 'sam-diya-clay'],
      },
    },
  },
  {
    occasionId: 'havan',
    peoplePerUnit: 12,
    levels: {
      essentials: {
        productId: 'kit-havan',
        reason:
          'A measured mix of the nine dry ingredients with samidha, til, jau and ghee — enough for one household havan of about forty-five minutes.',
        addOns: [],
      },
      complete: {
        productId: 'kit-havan',
        reason:
          'A havan is almost never performed alone. Akshat and the tilak powders cover the sankalp and puja that precede the fire.',
        addOns: ['sam-akshat', 'sam-tilak-set'],
      },
      premium: {
        productId: 'kit-havan',
        reason:
          'A copper kalash for the sthapana and a brass thali for the offerings turn a one-off havan into a setup you can repeat each year.',
        addOns: ['sam-kalash', 'sam-thali', 'sam-akshat'],
      },
    },
  },
  {
    occasionId: 'daily-puja',
    peoplePerUnit: 30,
    levels: {
      essentials: {
        productId: 'sam-agarbatti',
        reason:
          'Ninety hand-rolled sticks across three scents. Incense is the thing a daily altar runs out of first, so this is the sensible place to start.',
        addOns: ['sam-camphor'],
      },
      complete: {
        productId: 'sam-tilak-set',
        reason:
          'Haldi, roli and chandan in sealed glass, which is the set a daily puja actually depletes. Adding akshat, wicks and incense covers a couple of months without another order.',
        addOns: ['sam-akshat', 'sam-agarbatti', 'sam-wick', 'sam-camphor'],
      },
      premium: {
        productId: 'sam-thali',
        reason:
          'A permanent altar deserves the thali it is built around. Unlacquered brass with the five bowls and bell, plus the consumables to keep it in daily use.',
        addOns: ['sam-tilak-set', 'sam-akshat', 'sam-agarbatti', 'sam-diya-clay'],
      },
    },
  },
];

const LEVELS: PreparationLevel[] = ['essentials', 'complete', 'premium'];

export const RECOMMENDATION_RULES: RecommendationRule[] = (() => {
  const rules: RecommendationRule[] = [];
  let sortOrder = 0;

  for (const spec of OCCASION_SPECS) {
    for (const level of LEVELS) {
      const levelSpec = spec.levels[level];
      const unit = spec.peoplePerUnit;
      // Three bands: one unit, two units, then everything larger.
      const bands: Array<{ min: number; max: number; qty: number }> = [
        { min: 1, max: unit, qty: 1 },
        { min: unit + 1, max: unit * 2, qty: 2 },
        { min: unit * 2 + 1, max: 500, qty: 3 },
      ];
      for (const band of bands) {
        sortOrder += 1;
        rules.push({
          id: `rule-${spec.occasionId}-${level}-${band.qty}`,
          occasionId: spec.occasionId,
          minPeople: band.min,
          maxPeople: band.max,
          level,
          productId: levelSpec.productId,
          suggestedQty: band.qty,
          reason: levelSpec.reason,
          addOnProductIds: levelSpec.addOns,
          sortOrder,
          isActive: true,
        });
      }
    }
  }

  return rules;
})();
