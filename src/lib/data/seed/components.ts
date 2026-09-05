import type { KitComponent } from '../types';
import { SEEDED_AT } from './products';

/**
 * Raw components that kits are assembled from.
 *
 * A kit's `contents[].componentId` points here, and checkout deducts the
 * component stock as well as the kit stock. That is what stops the shop from
 * accepting eleven Lakshmi kits when there are only enough diyas for nine.
 *
 * Standalone samagri products hold their own stock and are intentionally not
 * mapped to components — one number, one owner, no drift between the two.
 */
function comp(
  id: string,
  name: string,
  unit: string,
  stock: number,
  lowStockThreshold: number,
): KitComponent {
  return { id, name, unit, stock, lowStockThreshold, updatedAt: SEEDED_AT };
}

export const KIT_COMPONENTS: KitComponent[] = [
  // -- Powders & pastes ------------------------------------------------------
  comp('comp-kumkum', 'Kumkum (20 g sachet)', 'sachet', 640, 120),
  comp('comp-haldi', 'Haldi (20 g sachet)', 'sachet', 610, 120),
  comp('comp-chandan', 'Chandan Powder (15 g vial)', 'vial', 380, 80),
  comp('comp-sindoor', 'Sindoor (25 g jar)', 'jar', 240, 50),
  comp('comp-vibhuti', 'Vibhuti (25 g pack)', 'pack', 190, 40),

  // -- Grains & offerings ---------------------------------------------------
  comp('comp-akshat', 'Akshat (100 g pack)', 'pack', 720, 150),
  comp('comp-til', 'Black Til (50 g pack)', 'pack', 430, 90),
  comp('comp-jau', 'Jau / Barley (100 g pack)', 'pack', 300, 60),
  comp('comp-mishri', 'Mishri (50 g pack)', 'pack', 350, 70),
  comp('comp-supari', 'Whole Supari', 'pc', 1400, 300),
  comp('comp-coconut', 'Whole Coconut', 'pc', 260, 60),
  comp('comp-ghee', 'Desi Ghee (100 ml)', 'bottle', 210, 40),
  comp('comp-panchamrit', 'Panchamrit Set (5 items)', 'set', 150, 30),
  comp('comp-havan-mix', 'Havan Samagri Mix (500 g)', 'pack', 240, 50),
  comp('comp-samidha', 'Mango Samidha (250 g)', 'pack', 230, 50),

  // -- Flame ----------------------------------------------------------------
  comp('comp-diya-clay', 'Terracotta Diya', 'pc', 2600, 500),
  comp('comp-diya-brass', 'Brass Akhand Diya', 'pc', 120, 25),
  comp('comp-wick', 'Cotton Wick', 'pc', 12000, 2500),
  comp('comp-oil', 'Sesame Oil (500 ml)', 'bottle', 140, 30),
  comp('comp-camphor', 'Camphor (10 g pack)', 'pack', 780, 150),
  comp('comp-agarbatti', 'Agarbatti (20 sticks)', 'pack', 700, 140),
  comp('comp-dhoop', 'Dhoop Sticks (10 pcs)', 'pack', 460, 90),

  // -- Botanicals (short shelf life, so thresholds sit high relative to stock)
  comp('comp-garland', 'Marigold Garland', 'pc', 90, 30),
  comp('comp-durva', 'Durva Grass Bundle', 'bundle', 180, 60),
  comp('comp-bilva', 'Bilva Patra (dried)', 'leaf', 1500, 400),
  comp('comp-tulsi', 'Tulsi Leaves (10 g)', 'pack', 210, 50),
  comp('comp-banana-leaf', 'Banana Leaf', 'pc', 280, 80),
  comp('comp-paan', 'Betel Paan Leaf', 'pc', 520, 150),
  comp('comp-red-flower', 'Red Hibiscus (dried, 10 g)', 'pack', 190, 45),
  comp('comp-white-flower', 'White Flowers (dried, 10 g)', 'pack', 160, 40),
  // Seasonal and genuinely short — surfaces in the admin low-stock view on
  // first boot, which is the point: the owner should see it, not discover it.
  comp('comp-lotus', 'Dried Lotus', 'pc', 38, 60),

  // -- Vessels & sacred items ----------------------------------------------
  comp('comp-kalash', 'Copper Kalash (5 in)', 'pc', 150, 30),
  comp('comp-clay-pot', 'Clay Sowing Pot', 'pc', 110, 25),
  comp('comp-coins', 'Embossed Lakshmi Coin', 'pc', 480, 100),
  comp('comp-kalawa', 'Kalawa Skein (20 m)', 'skein', 520, 100),
  comp('comp-rudraksha', 'Rudraksha Mala', 'pc', 130, 30),
  comp('comp-chunri', 'Red Chunri', 'pc', 170, 35),
  comp('comp-gangajal', 'Gangajal (100 ml)', 'bottle', 260, 50),
];
