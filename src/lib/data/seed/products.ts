import { PHOTOS } from '../../photos';
import type { KitContent, Product, ProductImage, ProductVariant } from '../types';
import { CATEGORIES } from './taxonomy';

/** Deterministic seed timestamp so a reset produces byte-identical data. */
export const SEEDED_AT = '2026-09-01T06:00:00.000Z';

/**
 * Resolve a generated photo into a ProductImage. Throws rather than rendering a
 * broken tile, so renaming a crop in prepare-images.mjs fails loudly at seed
 * time instead of quietly shipping a missing image.
 */
function img(key: string, altOverride?: string): ProductImage {
  const asset = PHOTOS[key];
  if (!asset) {
    throw new Error(
      `Seed references photo "${key}", which scripts/prepare-images.mjs has not generated. Run \`node scripts/prepare-images.mjs\`.`,
    );
  }
  return {
    url: asset.src,
    alt: altOverride ?? asset.alt,
    width: asset.width,
    height: asset.height,
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface Draft {
  id: string;
  name: string;
  /** Rupees — converted to paise below so the seed stays readable. */
  price: number;
  mrp: number;
  shortDescription: string;
  description: string;
  photos: string[];
  categoryId: string;
  occasionIds: string[];
  festivalIds?: string[];
  contents?: KitContent[];
  variants?: ProductVariant[];
  stock: number;
  lowStockThreshold?: number;
  sku: string;
  isFeatured?: boolean;
  isKit: boolean;
  tags: string[];
  keywords: string[];
  howToPrepare: string[];
  whoIsItFor: string;
}

/**
 * `c` builds a kit line. componentId/componentQty are what make a kit sale
 * deduct raw component stock, so overselling is caught at the component level
 * and not just the assembled-kit level.
 */
function c(
  name: string,
  quantity: string,
  icon: string,
  componentId?: string,
  componentQty = 1,
): KitContent {
  return componentId ? { name, quantity, icon, componentId, componentQty } : { name, quantity, icon };
}

const DRAFTS: Draft[] = [
  // =========================================================================
  // Kits
  // =========================================================================
  {
    id: 'kit-griha-pravesh',
    name: 'Griha Pravesh Puja Kit',
    price: 1499,
    mrp: 1999,
    shortDescription: 'Every samagri the housewarming asks for, in one tray.',
    description:
      'A Griha Pravesh has a long list and a short window — you are unpacking a house and hosting a ceremony on the same morning. This kit removes the sourcing from that morning. The kalash, the nine diyas, the kalawa for the doorway, the labelled vials of haldi, kumkum and akshat: all of it portioned for a full ceremony with a pandit, and laid out in the order it gets used.',
    photos: ['kit-griha-pravesh', 'sam-vials', 'sam-diya-row', 'sam-kalawa'],
    categoryId: 'puja-kits',
    occasionIds: ['griha-pravesh'],
    festivalIds: [],
    stock: 34,
    sku: 'PJR-GP-001',
    isFeatured: true,
    isKit: true,
    tags: ['bestseller', 'housewarming', 'complete kit'],
    keywords: ['griha pravesh kit', 'housewarming puja samagri', 'new home puja kit', 'vastu puja items'],
    contents: [
      c('Copper Kalash', '1 pc', 'Trophy', 'comp-kalash', 1),
      c('Whole Coconut', '1 pc', 'Circle', 'comp-coconut', 1),
      c('Terracotta Diyas', '9 pcs', 'Flame', 'comp-diya-clay', 9),
      c('Pure Cotton Wicks', '25 pcs', 'Minus', 'comp-wick', 25),
      c('Kumkum', '20 g', 'Droplets', 'comp-kumkum', 1),
      c('Haldi', '20 g', 'Droplets', 'comp-haldi', 1),
      c('Chandan Powder', '15 g', 'Droplets', 'comp-chandan', 1),
      c('Akshat (Raw Rice)', '100 g', 'Wheat', 'comp-akshat', 1),
      c('Kalawa Thread', '1 skein', 'Scroll', 'comp-kalawa', 1),
      c('Camphor Tablets', '10 g', 'Sparkles', 'comp-camphor', 1),
      c('Agarbatti', '20 sticks', 'Wind', 'comp-agarbatti', 1),
      c('Dhoop Sticks', '10 pcs', 'Wind', 'comp-dhoop', 1),
      c('Supari (Betel Nut)', '5 pcs', 'Nut', 'comp-supari', 5),
      c('Mauli & Panchpatra', '1 set', 'Package'),
      c('Printed Vidhi Card', '1 pc', 'BookOpen'),
    ],
    howToPrepare: [
      'Wash the kalash, fill it three-quarters with clean water and add a pinch of haldi and a coin.',
      'Set five mango or betel leaves around the rim and rest the coconut on top.',
      'Tie the kalawa across the main doorway before the first entry.',
      'Arrange the nine diyas at the threshold and in each corner of the main room.',
      'Lay out haldi, kumkum, chandan and akshat in the panchpatra in the order printed on the vidhi card.',
      'Light the diyas and agarbatti just before the muhurat begins.',
    ],
    whoIsItFor:
      'Families moving into a new home or flat and hosting a Griha Pravesh with a pandit. Sized for a ceremony of roughly 8–15 people.',
  },
  {
    id: 'kit-satyanarayan',
    name: 'Satyanarayan Puja Kit',
    price: 999,
    mrp: 1299,
    shortDescription: 'For the vrat, the katha and the prasad after.',
    description:
      'A Satyanarayan Katha runs for a couple of hours and the panchamrit has to be ready before it starts. Everything here is measured for the full vidhi — the five ingredients for the panchamrit, the tulsi, the banana leaves, and enough samagri for the aarti at the end. The two sizes are the difference between an immediate family and a house full of relatives.',
    photos: ['sam-thali-spoon', 'sam-akshat', 'sam-paan', 'sam-supari'],
    categoryId: 'puja-kits',
    occasionIds: ['satyanarayan'],
    festivalIds: [],
    stock: 0, // variant-level stock is authoritative for this product
    sku: 'PJR-SN-001',
    isFeatured: true,
    isKit: true,
    tags: ['bestseller', 'katha', 'vrat'],
    keywords: ['satyanarayan puja kit', 'satyanarayan katha samagri', 'vrat puja items'],
    variants: [
      {
        id: 'kit-satyanarayan-family',
        label: 'Family (4–6 people)',
        sku: 'PJR-SN-001-F',
        price: 99900,
        mrp: 129900,
        stock: 41,
        isDefault: true,
      },
      {
        id: 'kit-satyanarayan-gathering',
        label: 'Gathering (10–12 people)',
        sku: 'PJR-SN-001-G',
        price: 149900,
        mrp: 189900,
        stock: 18,
        isDefault: false,
      },
    ],
    contents: [
      c('Panchamrit Set (5 items)', '1 set', 'Milk', 'comp-panchamrit', 1),
      c('Tulsi Leaves (dried)', '10 g', 'Leaf', 'comp-tulsi', 1),
      c('Banana Leaves', '2 pcs', 'Leaf', 'comp-banana-leaf', 2),
      c('Akshat (Raw Rice)', '100 g', 'Wheat', 'comp-akshat', 1),
      c('Kumkum', '20 g', 'Droplets', 'comp-kumkum', 1),
      c('Haldi', '20 g', 'Droplets', 'comp-haldi', 1),
      c('Paan Leaves', '5 pcs', 'Leaf', 'comp-paan', 5),
      c('Supari (Betel Nut)', '5 pcs', 'Nut', 'comp-supari', 5),
      c('Terracotta Diyas', '5 pcs', 'Flame', 'comp-diya-clay', 5),
      c('Pure Cotton Wicks', '20 pcs', 'Minus', 'comp-wick', 20),
      c('Camphor Tablets', '10 g', 'Sparkles', 'comp-camphor', 1),
      c('Agarbatti', '20 sticks', 'Wind', 'comp-agarbatti', 1),
      c('Mishri', '50 g', 'Candy', 'comp-mishri', 1),
      c('Katha Booklet', '1 pc', 'BookOpen'),
    ],
    howToPrepare: [
      'Prepare the panchamrit first — milk, curd, ghee, honey and sugar, mixed in equal parts.',
      'Line the puja chowki with the banana leaves and set the thali on top.',
      'Place akshat, haldi, kumkum and tulsi in separate compartments within reach.',
      'Light the diyas and agarbatti, then begin the katha from the booklet.',
      'Offer the panchamrit and mishri as prasad once the katha is complete.',
    ],
    whoIsItFor:
      'Households observing the Satyanarayan vrat, monthly on Purnima or for a specific sankalp. Choose the Gathering size if relatives are joining.',
  },
  {
    id: 'kit-ganesh',
    name: 'Ganesh Puja Kit',
    price: 699,
    mrp: 899,
    shortDescription: 'Durva, modak and everything the aarti needs.',
    description:
      'Ganesh puja is specific about its offerings — durva grass in bundles of twenty-one, red flowers, modak. Those are exactly the things that are hard to find on the morning of Chaturthi. This kit carries them along with the general samagri for the sthapana and the evening aarti, sized to run through the first few days comfortably.',
    photos: ['kit-ganesh', 'sam-idol', 'sam-modak', 'sam-durva'],
    categoryId: 'puja-kits',
    occasionIds: ['ganesh-puja'],
    festivalIds: ['ganesh-chaturthi'],
    stock: 62,
    sku: 'PJR-GN-001',
    isFeatured: true,
    isKit: true,
    tags: ['bestseller', 'chaturthi', 'complete kit'],
    keywords: ['ganesh puja kit', 'ganesh chaturthi samagri', 'ganpati puja items', 'durva modak'],
    contents: [
      c('Durva Grass Bundles', '3 bundles', 'Leaf', 'comp-durva', 3),
      c('Red Hibiscus (dried)', '10 g', 'Flower2', 'comp-red-flower', 1),
      c('Marigold Garland', '1 pc', 'Flower2', 'comp-garland', 1),
      c('Sindoor', '20 g', 'Droplets', 'comp-sindoor', 1),
      c('Kumkum', '20 g', 'Droplets', 'comp-kumkum', 1),
      c('Akshat (Raw Rice)', '100 g', 'Wheat', 'comp-akshat', 1),
      c('Terracotta Diyas', '5 pcs', 'Flame', 'comp-diya-clay', 5),
      c('Pure Cotton Wicks', '20 pcs', 'Minus', 'comp-wick', 20),
      c('Camphor Tablets', '10 g', 'Sparkles', 'comp-camphor', 1),
      c('Agarbatti', '20 sticks', 'Wind', 'comp-agarbatti', 1),
      c('Whole Coconut', '1 pc', 'Circle', 'comp-coconut', 1),
      c('Supari (Betel Nut)', '5 pcs', 'Nut', 'comp-supari', 5),
      c('Aarti Card', '1 pc', 'BookOpen'),
    ],
    howToPrepare: [
      'Set the idol on a clean chowki facing east or north, on a fresh cloth.',
      'Offer akshat and sindoor, then place the marigold garland.',
      'Arrange the durva in bundles of twenty-one and offer them together.',
      'Light the diya and agarbatti, then perform the aarti with camphor.',
      'Offer modak or any sweet as prasad to close.',
    ],
    whoIsItFor:
      'Homes bringing Ganpati in for Chaturthi, and anyone who keeps a weekly Ganesh puja. Idol not included — pair it with your own.',
  },
  {
    id: 'kit-lakshmi',
    name: 'Lakshmi Puja Kit',
    price: 799,
    mrp: 1099,
    shortDescription: 'Lotus, coins and lamps for the evening puja.',
    description:
      'The Diwali evening puja and the ordinary Friday one need the same things in different quantities: lotus, embossed coins, mishri, and lamps that stay lit through the night. This kit is built around the version that happens at home, with enough diyas and wicks that you are not rationing them by the second hour.',
    photos: ['kit-lakshmi', 'sam-coins', 'kit-lakshmi-lotus', 'sam-haldi'],
    categoryId: 'puja-kits',
    occasionIds: ['lakshmi-puja'],
    festivalIds: ['diwali'],
    stock: 55,
    sku: 'PJR-LX-001',
    isFeatured: true,
    isKit: true,
    tags: ['bestseller', 'diwali', 'complete kit'],
    keywords: ['lakshmi puja kit', 'diwali puja samagri', 'lakshmi ganesh puja items', 'dhanteras kit'],
    contents: [
      c('Embossed Lakshmi Coins', '2 pcs', 'Coins', 'comp-coins', 2),
      c('Dried Lotus', '2 pcs', 'Flower2', 'comp-lotus', 2),
      c('Marigold Garland', '1 pc', 'Flower2', 'comp-garland', 1),
      c('Terracotta Diyas', '11 pcs', 'Flame', 'comp-diya-clay', 11),
      c('Pure Cotton Wicks', '40 pcs', 'Minus', 'comp-wick', 40),
      c('Kumkum', '20 g', 'Droplets', 'comp-kumkum', 1),
      c('Haldi', '20 g', 'Droplets', 'comp-haldi', 1),
      c('Akshat (Raw Rice)', '100 g', 'Wheat', 'comp-akshat', 1),
      c('Mishri', '50 g', 'Candy', 'comp-mishri', 1),
      c('Camphor Tablets', '15 g', 'Sparkles', 'comp-camphor', 1),
      c('Agarbatti', '30 sticks', 'Wind', 'comp-agarbatti', 1),
      c('Paan Leaves', '5 pcs', 'Leaf', 'comp-paan', 5),
      c('Kalawa Thread', '1 skein', 'Scroll', 'comp-kalawa', 1),
      c('Vidhi Card', '1 pc', 'BookOpen'),
    ],
    howToPrepare: [
      'Clean the puja space and the entrance thoroughly before you begin.',
      'Set the coins and a small pile of akshat on the thali beside the idols.',
      'Offer haldi, kumkum and the lotus, then place the garland.',
      'Light the diyas at the doorway, the balcony and the altar.',
      'Finish with camphor aarti and offer mishri as prasad.',
    ],
    whoIsItFor:
      'Households doing Lakshmi Puja on Diwali or Dhanteras, and anyone who keeps a regular Friday puja. Sized for a home rather than a shop.',
  },
  {
    id: 'kit-shiv',
    name: 'Shiv Puja Kit',
    price: 549,
    mrp: 699,
    shortDescription: 'Bilva, vibhuti and gangajal — restrained by design.',
    description:
      'Shiv puja asks for less than most, and this kit respects that. Bilva leaves, vibhuti, gangajal, a rudraksha mala and white flowers, with enough for the four abhisheks of a Shivratri vigil. Nothing decorative has been added to make the box look fuller.',
    photos: ['sam-chandan', 'sam-dhoop', 'sam-akshat'],
    categoryId: 'puja-kits',
    occasionIds: ['shiv-puja'],
    festivalIds: ['mahashivratri'],
    stock: 47,
    sku: 'PJR-SV-001',
    isKit: true,
    tags: ['shivratri', 'somvar'],
    keywords: ['shiv puja kit', 'mahashivratri samagri', 'bilva patra', 'rudraksha mala', 'shivling abhishek'],
    contents: [
      c('Bilva Patra (dried)', '21 leaves', 'Leaf', 'comp-bilva', 21),
      c('Vibhuti (Sacred Ash)', '25 g', 'Droplets', 'comp-vibhuti', 1),
      c('Gangajal', '100 ml', 'Droplets', 'comp-gangajal', 1),
      c('Rudraksha Mala', '1 pc', 'CircleDot', 'comp-rudraksha', 1),
      c('Chandan Powder', '15 g', 'Droplets', 'comp-chandan', 1),
      c('White Flowers (dried)', '10 g', 'Flower2', 'comp-white-flower', 1),
      c('Black Til', '50 g', 'Wheat', 'comp-til', 1),
      c('Terracotta Diyas', '3 pcs', 'Flame', 'comp-diya-clay', 3),
      c('Pure Cotton Wicks', '15 pcs', 'Minus', 'comp-wick', 15),
      c('Dhoop Sticks', '10 pcs', 'Wind', 'comp-dhoop', 1),
      c('Camphor Tablets', '10 g', 'Sparkles', 'comp-camphor', 1),
    ],
    howToPrepare: [
      'Begin the abhishek with gangajal, then water, then gangajal again.',
      'Apply chandan in three horizontal lines, and vibhuti above them.',
      'Offer the bilva patra with the smooth side down, in threes.',
      'Place the white flowers and til at the base.',
      'Light the dhoop and diya, and keep the lamp burning through the vigil.',
    ],
    whoIsItFor:
      'Anyone observing Mahashivratri or the Sawan Somvar vrat, and homes with a Shivling on the altar.',
  },
  {
    id: 'kit-durga',
    name: 'Durga Puja Kit',
    price: 1199,
    mrp: 1599,
    shortDescription: 'Sindoor, garlands and enough lamps for the Ashtami.',
    description:
      'Durga Puja is not one evening, and a kit built for one evening runs out by Ashtami. This one carries the sindoor for the khela, red garlands, the chunri, and lamp oil and wicks in a quantity that survives five days of morning and evening aarti.',
    photos: ['sam-sindoor', 'sam-garland', 'sam-diya-clay'],
    categoryId: 'puja-kits',
    occasionIds: ['durga-puja'],
    festivalIds: ['durga-puja-festival', 'navratri'],
    stock: 29,
    sku: 'PJR-DG-001',
    isKit: true,
    tags: ['navratri', 'ashtami', 'multi-day'],
    keywords: ['durga puja kit', 'navratri puja samagri', 'sindoor khela', 'ashtami puja items'],
    contents: [
      c('Sindoor', '50 g', 'Droplets', 'comp-sindoor', 2),
      c('Red Chunri', '1 pc', 'Shirt', 'comp-chunri', 1),
      c('Marigold Garlands', '3 pcs', 'Flower2', 'comp-garland', 3),
      c('Red Hibiscus (dried)', '25 g', 'Flower2', 'comp-red-flower', 2),
      c('Terracotta Diyas', '15 pcs', 'Flame', 'comp-diya-clay', 15),
      c('Pure Cotton Wicks', '60 pcs', 'Minus', 'comp-wick', 60),
      c('Kumkum', '25 g', 'Droplets', 'comp-kumkum', 1),
      c('Haldi', '25 g', 'Droplets', 'comp-haldi', 1),
      c('Akshat (Raw Rice)', '200 g', 'Wheat', 'comp-akshat', 2),
      c('Camphor Tablets', '25 g', 'Sparkles', 'comp-camphor', 2),
      c('Agarbatti', '40 sticks', 'Wind', 'comp-agarbatti', 2),
      c('Dhoop Sticks', '20 pcs', 'Wind', 'comp-dhoop', 2),
      c('Whole Coconut', '1 pc', 'Circle', 'comp-coconut', 1),
      c('Kalawa Thread', '1 skein', 'Scroll', 'comp-kalawa', 1),
    ],
    howToPrepare: [
      'Drape the chunri and place the first garland on Shashthi morning.',
      'Keep one diya lit continuously from Shashthi through Dashami.',
      'Refresh the flowers and garland each morning before the aarti.',
      'Set aside the sindoor for the khela on Dashami.',
      'Perform the camphor aarti at dusk on each of the five days.',
    ],
    whoIsItFor:
      'Bengali households and anyone running a five-day Durga Puja at home. Quantities assume twice-daily aarti.',
  },
  {
    id: 'kit-navratri',
    name: 'Navratri Akhand Jyot Kit',
    price: 1099,
    mrp: 1449,
    shortDescription: 'One lamp, nine nights, no midnight refills.',
    description:
      'The akhand jyot is a simple idea with an unforgiving requirement: the flame does not go out for nine days. That takes more oil and more wicks than people expect. This kit is calculated for the full nine nights of continuous burning, with the garlands and samagri for the daily puja alongside it.',
    photos: ['sam-garland', 'sam-diya-clay', 'sam-incense-stand'],
    categoryId: 'puja-kits',
    occasionIds: ['durga-puja', 'daily-puja'],
    festivalIds: ['navratri'],
    stock: 33,
    sku: 'PJR-NV-001',
    isKit: true,
    tags: ['navratri', 'akhand jyot', 'nine nights'],
    keywords: ['navratri kit', 'akhand jyot samagri', 'nine nights puja', 'garba puja items'],
    contents: [
      c('Brass Akhand Diya', '1 pc', 'Flame', 'comp-diya-brass', 1),
      c('Long-Burn Cotton Wicks', '100 pcs', 'Minus', 'comp-wick', 100),
      c('Sesame Oil', '500 ml', 'Droplets', 'comp-oil', 1),
      c('Marigold Garlands', '2 pcs', 'Flower2', 'comp-garland', 2),
      c('Red Chunri', '1 pc', 'Shirt', 'comp-chunri', 1),
      c('Kumkum', '25 g', 'Droplets', 'comp-kumkum', 1),
      c('Haldi', '25 g', 'Droplets', 'comp-haldi', 1),
      c('Akshat (Raw Rice)', '200 g', 'Wheat', 'comp-akshat', 2),
      c('Jau (Barley Seeds)', '100 g', 'Wheat', 'comp-jau', 1),
      c('Clay Sowing Pot', '1 pc', 'Package', 'comp-clay-pot', 1),
      c('Camphor Tablets', '25 g', 'Sparkles', 'comp-camphor', 2),
      c('Agarbatti', '40 sticks', 'Wind', 'comp-agarbatti', 2),
    ],
    howToPrepare: [
      'Sow the jau in the clay pot with a little soil on the first morning.',
      'Fill the brass diya with sesame oil and set a long wick in it.',
      'Light the jyot at the muhurat and top up the oil twice daily without letting it dry.',
      'Change the wick only from the lit flame, never by relighting.',
      'Offer fresh flowers each morning and perform the aarti at dusk.',
    ],
    whoIsItFor:
      'Homes keeping an akhand jyot through Navratri. The oil quantity assumes a single lamp burning continuously for nine days.',
  },
  {
    id: 'kit-havan',
    name: 'Havan Samagri Kit',
    price: 299,
    mrp: 399,
    shortDescription: 'The fire-ritual mix, measured for one household havan.',
    description:
      'Havan samagri is the part people end up buying loose and guessing at. This is a measured mix of the nine dry ingredients plus the samidha, til, jau and ghee, portioned for a single household havan of roughly forty-five minutes. It burns clean and does not need topping up mid-ritual.',
    photos: ['sam-dhoop', 'sam-camphor', 'sam-akshat'],
    categoryId: 'havan',
    occasionIds: ['havan', 'griha-pravesh'],
    festivalIds: ['festival-specials'],
    stock: 88,
    lowStockThreshold: 20,
    sku: 'PJR-HV-001',
    isKit: true,
    tags: ['havan', 'yagna', 'add-on'],
    keywords: ['havan samagri', 'havan kit', 'yagna samagri', 'hawan samagri online'],
    contents: [
      c('Havan Samagri Mix', '500 g', 'Flame', 'comp-havan-mix', 1),
      c('Mango Samidha', '250 g', 'Wheat', 'comp-samidha', 1),
      c('Black Til', '100 g', 'Wheat', 'comp-til', 2),
      c('Jau (Barley)', '100 g', 'Wheat', 'comp-jau', 1),
      c('Desi Ghee', '100 ml', 'Milk', 'comp-ghee', 1),
      c('Camphor Tablets', '25 g', 'Sparkles', 'comp-camphor', 2),
      c('Kapoor Tablet Stand', '1 pc', 'Package'),
    ],
    howToPrepare: [
      'Arrange the samidha in a criss-cross lattice inside the havan kund.',
      'Light the camphor at the centre and let the fire establish itself.',
      'Add ghee with the spoon before each round of offerings.',
      'Offer the samagri mix with til and jau at each mantra.',
      'Let the fire burn down naturally — do not douse it with water.',
    ],
    whoIsItFor:
      'Anyone performing a household havan, and a common add-on to the Griha Pravesh ceremony. One kit covers one havan.',
  },

  // =========================================================================
  // Samagri
  // =========================================================================
  {
    id: 'sam-agarbatti',
    name: 'Hand-Rolled Agarbatti',
    price: 149,
    mrp: 199,
    shortDescription: 'Rolled by hand, low smoke, holds its scent.',
    description:
      'Machine-extruded incense burns fast and smells thin. These are rolled by hand on bamboo, which means an uneven surface, a slower burn and a scent that lasts the whole stick. Sandalwood, mogra and loban, thirty sticks each, in a card sleeve that keeps them from drying out.',
    photos: ['sam-incense', 'sam-incense-stand'],
    categoryId: 'incense',
    occasionIds: ['daily-puja'],
    festivalIds: [],
    stock: 210,
    lowStockThreshold: 40,
    sku: 'PJR-AG-001',
    isFeatured: true,
    isKit: false,
    tags: ['daily', 'refill', 'low smoke'],
    keywords: ['agarbatti', 'incense sticks', 'hand rolled agarbatti', 'sandalwood incense', 'puja agarbatti'],
    contents: [
      c('Sandalwood Sticks', '30 pcs', 'Wind'),
      c('Mogra Sticks', '30 pcs', 'Wind'),
      c('Loban Sticks', '30 pcs', 'Wind'),
    ],
    howToPrepare: [
      'Light the coated tip and let it flame for two seconds.',
      'Blow the flame out so the ember glows.',
      'Set it in a stand away from curtains and open windows.',
    ],
    whoIsItFor: 'Daily altars and anyone who burns incense more than a few times a week.',
  },
  {
    id: 'sam-diya-clay',
    name: 'Terracotta Diyas — Set of 12',
    price: 99,
    mrp: 149,
    shortDescription: 'Unglazed clay, deep well, sits flat.',
    description:
      'Wheel-thrown in unglazed terracotta with a deeper well than the usual pressed diya, so one filling burns longer without the wick tipping over. The base is trued flat, which matters more than it sounds when you are lining a parapet on Diwali night.',
    photos: ['sam-diya-clay', 'sam-diya-row'],
    categoryId: 'diyas',
    occasionIds: ['daily-puja', 'lakshmi-puja', 'durga-puja'],
    festivalIds: ['diwali', 'navratri'],
    stock: 340,
    lowStockThreshold: 60,
    sku: 'PJR-DY-001',
    isFeatured: true,
    isKit: false,
    tags: ['diwali', 'refill', 'value'],
    keywords: ['clay diya', 'terracotta diya', 'diwali diya', 'mitti ka diya', 'oil lamp'],
    contents: [c('Terracotta Diyas', '12 pcs', 'Flame')],
    howToPrepare: [
      'Soak new diyas in water for twenty minutes and dry them fully — unsoaked clay drinks the oil.',
      'Fill each about two-thirds with mustard or sesame oil.',
      'Rest the wick against the lip with the tip clear of the oil.',
    ],
    whoIsItFor: 'Diwali, Navratri and any evening that needs more than a couple of lamps.',
  },
  {
    id: 'sam-kumkum',
    name: 'Kumkum',
    price: 79,
    mrp: 99,
    shortDescription: 'Fine-milled, holds its colour on the skin.',
    description:
      'Milled fine enough to take a clean tilak without crumbling, and pigmented enough that it does not fade to pink by afternoon. Fifty grams in a screw-top jar rather than a paper packet, so it survives a shelf.',
    photos: ['sam-kumkum'],
    categoryId: 'kumkum-haldi',
    occasionIds: ['daily-puja', 'lakshmi-puja', 'satyanarayan'],
    festivalIds: [],
    stock: 260,
    lowStockThreshold: 50,
    sku: 'PJR-KK-001',
    isKit: false,
    tags: ['daily', 'refill'],
    keywords: ['kumkum', 'kumkum powder', 'tilak powder', 'roli', 'puja kumkum'],
    contents: [c('Kumkum', '50 g', 'Droplets')],
    howToPrepare: [
      'Take a small pinch with the ring finger.',
      'Apply with a single upward stroke on the forehead.',
      'Keep the jar closed and dry — moisture cakes the powder.',
    ],
    whoIsItFor: 'Every puja. The first thing to run out on a daily altar.',
  },
  {
    id: 'sam-wick',
    name: 'Pure Cotton Wicks — 100 pcs',
    price: 49,
    mrp: 69,
    shortDescription: 'Long-staple cotton, twisted, burns without soot.',
    description:
      'Twisted from long-staple cotton with no synthetic core, which is why they burn with a steady flame and almost no black soot on the diya rim. A hundred to a pack, in both the short round and the long flat cut.',
    photos: ['sam-diya-clay'],
    categoryId: 'diyas',
    occasionIds: ['daily-puja'],
    festivalIds: ['diwali', 'navratri'],
    stock: 410,
    lowStockThreshold: 80,
    sku: 'PJR-WK-001',
    isKit: false,
    tags: ['daily', 'refill', 'value'],
    keywords: ['cotton wicks', 'diya batti', 'puja wicks', 'akhand jyot wick', 'rui batti'],
    contents: [
      c('Round Wicks', '60 pcs', 'Minus'),
      c('Long Flat Wicks', '40 pcs', 'Minus'),
    ],
    howToPrepare: [
      'Dip the wick in oil before setting it, so it lights on the first touch.',
      'Leave about a centimetre clear of the oil.',
      'Use the long flat wicks for a lamp that must burn overnight.',
    ],
    whoIsItFor: 'Anyone lighting a diya daily, and essential for an akhand jyot.',
  },
  {
    id: 'sam-camphor',
    name: 'Camphor Tablets',
    price: 89,
    mrp: 119,
    shortDescription: 'Pure kapoor, lights clean, leaves no residue.',
    description:
      'Pressed pure camphor with no filler, so it lights on the first flame and burns off completely without the grey residue that cheaper tablets leave in the aarti stand. Fifty grams in pre-scored tablets, sealed against evaporation.',
    photos: ['sam-camphor'],
    categoryId: 'puja-samagri',
    occasionIds: ['daily-puja', 'havan'],
    festivalIds: [],
    stock: 185,
    lowStockThreshold: 40,
    sku: 'PJR-CM-001',
    isKit: false,
    tags: ['daily', 'refill', 'aarti'],
    keywords: ['camphor', 'kapoor', 'camphor tablets', 'aarti camphor', 'pure camphor'],
    contents: [c('Camphor Tablets', '50 g', 'Sparkles')],
    howToPrepare: [
      'Place one tablet in a metal aarti stand — never directly on the thali.',
      'Light it and circle the flame clockwise before the deity.',
      'Reseal the pack immediately; camphor evaporates in open air.',
    ],
    whoIsItFor: 'Every aarti, and the starter for a havan fire.',
  },
  {
    id: 'sam-thali',
    name: 'Brass Puja Thali Set',
    price: 899,
    mrp: 1199,
    shortDescription: 'Hand-engraved brass, seven pieces, no lacquer.',
    description:
      'A hand-engraved brass thali with the five bowls, the offering spoon and the bell. Unlacquered, so it darkens with use and comes back with a wipe of tamarind — the way brass is meant to age. The bowls sit in the engraved recesses instead of sliding around the plate.',
    photos: ['sam-thali-spoon', 'sam-diya-brass', 'hero-thali'],
    categoryId: 'thali',
    occasionIds: ['daily-puja', 'satyanarayan', 'lakshmi-puja'],
    festivalIds: ['diwali'],
    stock: 42,
    lowStockThreshold: 10,
    sku: 'PJR-TH-001',
    isFeatured: true,
    isKit: false,
    tags: ['gifting', 'heirloom', 'brass'],
    keywords: ['brass puja thali', 'pooja thali set', 'puja plate', 'brass thali online', 'aarti thali'],
    contents: [
      c('Engraved Brass Thali (9 in)', '1 pc', 'Circle'),
      c('Brass Bowls', '5 pcs', 'Soup'),
      c('Offering Spoon', '1 pc', 'Utensils'),
      c('Brass Bell', '1 pc', 'Bell'),
    ],
    howToPrepare: [
      'Wash with warm water and dry fully before the first use.',
      'Arrange haldi, kumkum, chandan, akshat and water in the five bowls, left to right.',
      'Clean with tamarind pulp or lemon and salt when the shine dulls.',
    ],
    whoIsItFor:
      'A permanent altar, and a standard housewarming or wedding gift. Not a consumable — this is the piece everything else sits on.',
  },
  {
    id: 'sam-tilak-set',
    name: 'Haldi, Roli & Chandan Set',
    price: 199,
    mrp: 259,
    shortDescription: 'The three tilak powders, in sealed glass.',
    description:
      'Haldi, roli and sandalwood chandan in three sealed glass vials with silver caps. Buying them together costs less than separately and, more usefully, they stay dry — paper packets absorb kitchen humidity within a fortnight and cake solid.',
    photos: ['sam-haldi', 'sam-chandan', 'sam-vials'],
    categoryId: 'kumkum-haldi',
    occasionIds: ['daily-puja', 'griha-pravesh', 'satyanarayan'],
    festivalIds: [],
    stock: 145,
    lowStockThreshold: 30,
    sku: 'PJR-TL-001',
    isKit: false,
    tags: ['daily', 'refill', 'set'],
    keywords: ['haldi kumkum set', 'chandan powder', 'roli chandan', 'tilak set', 'puja powders'],
    contents: [
      c('Haldi', '30 g', 'Droplets'),
      c('Roli', '30 g', 'Droplets'),
      c('Chandan Powder', '25 g', 'Droplets'),
    ],
    howToPrepare: [
      'Mix a pinch of chandan with two drops of water to a smooth paste.',
      'Apply haldi and roli dry, with the ring finger.',
      'Close each vial fully — chandan loses its scent to open air.',
    ],
    whoIsItFor: 'Daily puja, and the set most often bought as a standalone refill.',
  },
  {
    id: 'sam-garland',
    name: 'Marigold Garland',
    price: 179,
    mrp: 229,
    shortDescription: 'Strung fresh, dispatched the same morning.',
    description:
      'A three-foot garland of orange and yellow marigold, strung the morning it ships and packed in a breathable sleeve. Fresh flowers are dispatched only on weekdays and against serviceable pincodes, and the checkout will tell you before you pay if yours is not one.',
    photos: ['sam-garland', 'sam-marigold'],
    categoryId: 'puja-samagri',
    occasionIds: ['ganesh-puja', 'durga-puja', 'lakshmi-puja'],
    festivalIds: ['ganesh-chaturthi', 'navratri', 'durga-puja-festival'],
    // Deliberately low — perishable, and it exercises the low-stock UI and the
    // admin low-stock view without anyone having to place test orders first.
    stock: 6,
    lowStockThreshold: 8,
    sku: 'PJR-GL-001',
    isKit: false,
    tags: ['fresh', 'perishable', 'limited'],
    keywords: ['marigold garland', 'phool mala', 'genda phool', 'fresh flower garland', 'puja garland'],
    contents: [c('Marigold Garland (3 ft)', '1 pc', 'Flower2')],
    howToPrepare: [
      'Unwrap on arrival and mist lightly with water.',
      'Keep it out of direct sun until the puja.',
      'It will hold two to three days in a cool room.',
    ],
    whoIsItFor:
      'Ganesh Chaturthi, Navratri and Durga Puja. Perishable — order for a date, not to keep on hand.',
  },
  {
    id: 'sam-kalash',
    name: 'Copper Kalash',
    price: 649,
    mrp: 849,
    shortDescription: 'Seamless copper, flared rim, holds leaves properly.',
    description:
      'Drawn from a single sheet with no seam at the base, in a five-inch size that takes mango leaves without them sliding out. The rim is flared rather than rolled, which is what lets the coconut sit steady on top instead of rocking.',
    photos: ['sam-kalash'],
    categoryId: 'sacred',
    occasionIds: ['griha-pravesh', 'satyanarayan', 'havan'],
    festivalIds: [],
    stock: 58,
    lowStockThreshold: 12,
    sku: 'PJR-KL-001',
    isKit: false,
    tags: ['copper', 'heirloom', 'griha pravesh'],
    keywords: ['copper kalash', 'tamba kalash', 'puja kalash', 'kalash for griha pravesh', 'copper pot puja'],
    contents: [c('Copper Kalash (5 in)', '1 pc', 'Trophy')],
    howToPrepare: [
      'Clean with lemon and salt before the first use.',
      'Fill three-quarters with clean water, a pinch of haldi and a coin.',
      'Set five mango or betel leaves around the rim and rest the coconut on top.',
    ],
    whoIsItFor:
      'Griha Pravesh, Satyanarayan and any puja with a kalash sthapana. Reusable — buy once.',
  },
  {
    id: 'sam-akshat',
    name: 'Akshat — Unbroken Raw Rice',
    price: 59,
    mrp: 79,
    shortDescription: 'Hand-sorted, whole grains only.',
    description:
      'Akshat has to be unbroken, which is the one thing bulk rice never is. These grains are hand-sorted so what reaches you is whole, and washed and dried rather than polished. Two hundred grams, enough for several pujas.',
    photos: ['sam-akshat'],
    categoryId: 'puja-samagri',
    occasionIds: ['daily-puja', 'griha-pravesh', 'satyanarayan', 'ganesh-puja'],
    festivalIds: [],
    stock: 290,
    lowStockThreshold: 60,
    sku: 'PJR-AK-001',
    isKit: false,
    tags: ['daily', 'refill', 'value'],
    keywords: ['akshat', 'raw rice puja', 'chawal puja', 'unbroken rice', 'akshat rice'],
    contents: [c('Akshat (Raw Rice)', '200 g', 'Wheat')],
    howToPrepare: [
      'Mix a spoon of akshat with a pinch of haldi or kumkum before offering.',
      'Offer with the right hand, a pinch at a time.',
      'Store in a dry jar away from the stove.',
    ],
    whoIsItFor: 'Every puja without exception.',
  },
  {
    id: 'sam-mishri',
    name: 'Mishri — Crystal Sugar',
    price: 69,
    mrp: 89,
    shortDescription: 'Slow-crystallised, no thread, no bleaching.',
    description:
      'Crystallised slowly without a cotton thread through the middle, so what you offer is sugar and nothing else. Unbleached, which is why it is faintly amber rather than white. Two hundred grams for prasad and panchamrit.',
    photos: ['sam-mishri'],
    categoryId: 'puja-samagri',
    occasionIds: ['lakshmi-puja', 'satyanarayan', 'daily-puja'],
    festivalIds: ['diwali', 'janmashtami'],
    stock: 175,
    lowStockThreshold: 35,
    sku: 'PJR-MS-001',
    isKit: false,
    tags: ['prasad', 'refill'],
    keywords: ['mishri', 'crystal sugar', 'prasad mishri', 'makhan mishri', 'panchamrit sugar'],
    contents: [c('Mishri', '200 g', 'Candy')],
    howToPrepare: [
      'Offer in a clean bowl on the thali.',
      'Crush a little into the panchamrit as the fifth ingredient.',
      'Distribute as prasad once the aarti is done.',
    ],
    whoIsItFor: 'Lakshmi Puja, Satyanarayan Katha and Janmashtami, where mishri is part of the vidhi.',
  },
  {
    id: 'sam-kalawa',
    name: 'Kalawa Thread',
    price: 39,
    mrp: 49,
    shortDescription: 'Colour-fast red and yellow, does not bleed.',
    description:
      'Cotton kalawa in the traditional red and yellow twist, dyed colour-fast so it does not bleed onto the wrist in the first week. A twenty-metre skein — enough for a full ceremony and the guests.',
    photos: ['sam-kalawa'],
    categoryId: 'sacred',
    occasionIds: ['griha-pravesh', 'daily-puja', 'durga-puja'],
    festivalIds: [],
    stock: 320,
    lowStockThreshold: 60,
    sku: 'PJR-KW-001',
    isKit: false,
    tags: ['value', 'refill'],
    keywords: ['kalawa', 'mauli thread', 'raksha sutra', 'puja thread', 'kalava'],
    contents: [c('Kalawa Thread', '20 m skein', 'Scroll')],
    howToPrepare: [
      'Tie on the right wrist for men and unmarried women, the left for married women.',
      'Three turns, knotted, with the other hand held open beneath.',
      'Cut the remaining skein only as needed to keep it from tangling.',
    ],
    whoIsItFor: 'Griha Pravesh, festival pujas and anyone tying kalawa for a group.',
  },
  {
    id: 'sam-paan-supari',
    name: 'Paan & Supari Set',
    price: 129,
    mrp: 169,
    shortDescription: 'Fresh betel leaves with whole supari and laung.',
    description:
      'Ten fresh betel leaves with whole supari, laung and elaichi — the offering set that every vidhi lists and no one has in the house. The leaves ship in a damp wrap and hold for three or four days in the fridge.',
    photos: ['sam-paan', 'sam-supari'],
    categoryId: 'sacred',
    occasionIds: ['satyanarayan', 'lakshmi-puja', 'griha-pravesh'],
    festivalIds: ['diwali'],
    // Sold out in the seed so the out-of-stock states are real from first boot:
    // disabled add-to-cart, the §50 unavailable message, and the admin view.
    stock: 0,
    lowStockThreshold: 15,
    sku: 'PJR-PS-001',
    isKit: false,
    tags: ['fresh', 'perishable', 'set'],
    keywords: ['paan supari', 'betel leaf puja', 'supari', 'paan patta', 'betel nut puja'],
    contents: [
      c('Betel Paan Leaves', '10 pcs', 'Leaf'),
      c('Whole Supari', '10 pcs', 'Nut'),
      c('Laung & Elaichi', '10 g', 'Sparkles'),
    ],
    howToPrepare: [
      'Rinse the leaves and pat them dry before the puja.',
      'Set two leaves stem-inward with a supari on top.',
      'Refrigerate what is left, wrapped in a damp cloth.',
    ],
    whoIsItFor:
      'Satyanarayan, Lakshmi Puja and Griha Pravesh. Perishable — order it for the date of the puja.',
  },
];

const CATEGORY_NAME = new Map(CATEGORIES.map((cat) => [cat.id, cat.name]));

export const PRODUCTS: Product[] = DRAFTS.map((d) => {
  const categoryName = CATEGORY_NAME.get(d.categoryId);
  if (!categoryName) {
    throw new Error(`Product "${d.id}" references unknown category "${d.categoryId}".`);
  }
  const variants = d.variants ?? [];
  return {
    id: d.id,
    name: d.name,
    slug: slugify(d.name),
    description: d.description,
    shortDescription: d.shortDescription,
    price: d.price * 100,
    mrp: d.mrp * 100,
    images: d.photos.map((key, i) => img(key, i === 0 ? `${d.name} — ${PHOTOS[key]?.alt ?? ''}` : undefined)),
    categoryId: d.categoryId,
    categoryName,
    occasionIds: d.occasionIds,
    festivalIds: d.festivalIds ?? [],
    contents: d.contents ?? [],
    variants,
    // With variants present, the parent stock is the sum — variant rows stay authoritative.
    stock: variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : d.stock,
    lowStockThreshold: d.lowStockThreshold ?? 10,
    sku: d.sku,
    status: 'published',
    isFeatured: d.isFeatured ?? false,
    isKit: d.isKit,
    tags: d.tags,
    keywords: d.keywords,
    // Aggregates are computed from seeded reviews in seed/index.ts — never invented here.
    rating: 0,
    reviewCount: 0,
    howToPrepare: d.howToPrepare,
    whoIsItFor: d.whoIsItFor,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  };
});
