/**
 * Build-time image pipeline for POOJARO.
 *
 * The Flutter app ships four 1024x1024 photographs in `../assets/images/`. Two
 * carry a *different* brand's wordmark printed on the kit carton ("SAHAJ" on
 * gp_kit, "SHUBH VIBES" on lx_kit), so those regions are cropped away rather
 * than shipped. `gn_kit` and `hero_bg` are clean.
 *
 * Those four frames are also the whole photo budget, so instead of padding the
 * catalogue with mismatched stock, individual samagri are cropped out of them —
 * the marigold bowl, the kumkum, the lit diya, the coin row, the labelled vials.
 * Every product therefore gets a real photograph of itself, all from the same
 * shoot, so lighting and colour temperature match across the entire grid.
 *
 *   node scripts/prepare-images.mjs           # build derivatives
 *   node scripts/prepare-images.mjs --sheet   # also emit a QA contact sheet
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '..');
const SRC = resolve(SITE, '..', 'assets', 'images');
const OUT = join(SITE, 'public', 'images');

/**
 * @typedef {{ left: number, top: number, width: number, height: number }} Crop
 * @typedef {{ key: string, from: string, crop?: Crop, widths: number[], alt: string, note?: string }} Job
 */

/** @type {Job[]} */
const JOBS = [
  // -- Editorial / hero -----------------------------------------------------
  {
    key: 'hero-thali',
    from: 'hero_bg.png',
    widths: [1024, 640],
    alt: 'A brass puja thali laid with marigolds, kumkum, rice, a lit diya and incense on ivory linen',
    note: 'Unbranded. Used full-frame as the hero composition.',
  },
  {
    key: 'hero-thali-wide',
    from: 'hero_bg.png',
    crop: { left: 0, top: 212, width: 1024, height: 600 },
    widths: [1024],
    alt: 'A brass puja thali arranged with ritual essentials',
    note: 'Letterbox band for wide section banners.',
  },
  {
    key: 'story-ganesh',
    from: 'gn_kit.png',
    crop: { left: 0, top: 180, width: 1024, height: 620 },
    widths: [1024],
    alt: 'A clay Ganesha idol garlanded with marigolds beside a coconut, modak and incense',
    note: 'Brand-story editorial band.',
  },
  {
    key: 'og-default',
    from: 'hero_bg.png',
    crop: { left: 0, top: 244, width: 1024, height: 536 },
    widths: [1024],
    alt: 'POOJARO — Every Ritual. Everything You Need.',
    note: 'Open Graph / Twitter card.',
  },

  // -- Flagship kits --------------------------------------------------------
  {
    key: 'kit-ganesh',
    from: 'gn_kit.png',
    widths: [1024, 640],
    alt: 'Ganesh Puja Kit — a garlanded clay Ganesha idol with coconut, modak, kumkum and durva grass',
    note: 'Verified free of third-party branding.',
  },
  {
    key: 'kit-lakshmi',
    from: 'lx_kit.png',
    crop: { left: 190, top: 388, width: 640, height: 636 },
    widths: [640],
    alt: 'Lakshmi Puja Kit — a brass thali of haldi and kumkum ringed by Lakshmi coins, lit diyas and a betel leaf',
    note: 'Lower band only — excludes the third-party carton top-right.',
  },
  {
    key: 'kit-griha-pravesh',
    from: 'gp_kit.png',
    crop: { left: 232, top: 424, width: 680, height: 590 },
    widths: [680, 640],
    alt: 'Griha Pravesh Puja Kit — a compartment tray of labelled kumkum, haldi and akshat vials with clay diyas, dhoop and kalawa',
    note: 'Open tray only — excludes the SAHAJ-printed lid above it.',
  },
  {
    key: 'kit-lakshmi-lotus',
    from: 'lx_kit.png',
    crop: { left: 120, top: 214, width: 430, height: 430 },
    widths: [430],
    alt: 'Pink lotus blooms on leaf pads beside a marigold garland',
    note: 'Second gallery angle for the Lakshmi kit. Stops short of the carton at x>590.',
  },

  // -- Samagri close-ups from hero_bg --------------------------------------
  {
    key: 'sam-marigold',
    from: 'hero_bg.png',
    crop: { left: 232, top: 212, width: 272, height: 272 },
    widths: [272],
    alt: 'A brass bowl heaped with orange and yellow marigold blooms and loose petals',
  },
  {
    key: 'sam-kumkum',
    from: 'hero_bg.png',
    crop: { left: 466, top: 206, width: 268, height: 268 },
    widths: [268],
    alt: 'A scalloped brass bowl of deep red kumkum powder',
  },
  {
    key: 'sam-incense',
    from: 'hero_bg.png',
    crop: { left: 632, top: 120, width: 336, height: 356 },
    widths: [336],
    alt: 'Incense sticks fanned in a small brass stand with smoke rising',
  },
  {
    key: 'sam-diya-brass',
    from: 'hero_bg.png',
    crop: { left: 396, top: 356, width: 304, height: 296 },
    widths: [304],
    alt: 'A lit brass diya with a steady flame on an engraved thali',
  },
  {
    key: 'sam-akshat',
    from: 'hero_bg.png',
    crop: { left: 222, top: 432, width: 268, height: 262 },
    widths: [268],
    alt: 'A brass bowl of raw white akshat rice',
  },
  {
    key: 'sam-chandan',
    from: 'hero_bg.png',
    crop: { left: 628, top: 456, width: 306, height: 258 },
    widths: [306],
    alt: 'Ground sandalwood chandan paste in a brass bowl with a wooden applicator',
  },
  {
    key: 'sam-thali-spoon',
    from: 'hero_bg.png',
    crop: { left: 300, top: 616, width: 404, height: 306 },
    widths: [404],
    alt: 'An engraved brass thali rim with an ornate brass offering spoon',
  },
  {
    key: 'sam-supari',
    from: 'hero_bg.png',
    crop: { left: 508, top: 578, width: 292, height: 262 },
    widths: [292],
    alt: 'A brass bowl of marigold blooms and whole nutmeg on a puja thali',
  },

  // -- Samagri close-ups from lx_kit ---------------------------------------
  {
    key: 'sam-coins',
    from: 'lx_kit.png',
    crop: { left: 258, top: 648, width: 500, height: 200 },
    widths: [500],
    alt: 'A row of embossed golden Lakshmi coins on ivory linen',
  },
  {
    key: 'sam-diya-clay',
    from: 'lx_kit.png',
    crop: { left: 736, top: 350, width: 288, height: 360 },
    widths: [288],
    alt: 'Lit terracotta clay diyas with cotton wicks',
  },
  {
    key: 'sam-haldi',
    from: 'lx_kit.png',
    crop: { left: 316, top: 424, width: 380, height: 280 },
    widths: [380],
    alt: 'Brass bowls of turmeric haldi and red kumkum with brass spoons on a thali',
  },
  {
    key: 'sam-mishri',
    from: 'lx_kit.png',
    crop: { left: 288, top: 806, width: 220, height: 180 },
    widths: [220],
    alt: 'Crystallised mishri sugar in a small brass dish',
  },
  {
    key: 'sam-paan',
    from: 'lx_kit.png',
    crop: { left: 650, top: 744, width: 340, height: 260 },
    widths: [340],
    alt: 'A glossy green betel paan leaf with whole nutmeg',
  },
  {
    key: 'sam-garland',
    from: 'lx_kit.png',
    crop: { left: 0, top: 120, width: 240, height: 780 },
    widths: [240],
    alt: 'A long marigold garland of orange and yellow blooms strung with leaves',
  },
  {
    key: 'sam-incense-stand',
    from: 'lx_kit.png',
    crop: { left: 118, top: 636, width: 224, height: 300 },
    widths: [224],
    alt: 'Incense sticks in a footed brass stand beside a lit clay diya',
  },

  // -- Samagri close-ups from gn_kit ---------------------------------------
  {
    key: 'sam-kalash',
    from: 'gn_kit.png',
    crop: { left: 576, top: 240, width: 260, height: 400 },
    widths: [260],
    alt: 'A whole coconut resting on banana leaves in a copper kalash',
  },
  {
    key: 'sam-modak',
    from: 'gn_kit.png',
    crop: { left: 604, top: 588, width: 400, height: 290 },
    widths: [400],
    alt: 'Saffron-topped modak arranged on a silver plate with pistachio',
  },
  {
    key: 'sam-durva',
    from: 'gn_kit.png',
    crop: { left: 96, top: 700, width: 300, height: 220 },
    widths: [300],
    alt: 'A fresh bundle of durva grass beside marigold petals',
  },
  {
    key: 'sam-sindoor',
    from: 'gn_kit.png',
    crop: { left: 108, top: 592, width: 260, height: 200 },
    widths: [260],
    alt: 'A copper bowl of bright red sindoor with a wooden spoon',
  },
  {
    key: 'sam-idol',
    from: 'gn_kit.png',
    crop: { left: 258, top: 140, width: 330, height: 520 },
    widths: [330],
    alt: 'A terracotta Ganesha idol draped in a marigold garland',
  },

  // -- Samagri close-ups from gp_kit (below the branded lid) ---------------
  {
    key: 'sam-vials',
    from: 'gp_kit.png',
    crop: { left: 416, top: 556, width: 380, height: 230 },
    widths: [380],
    alt: 'Glass vials of kumkum, haldi and akshat with printed labels and silver caps',
  },
  {
    key: 'sam-dhoop',
    from: 'gp_kit.png',
    crop: { left: 240, top: 430, width: 200, height: 400 },
    widths: [200],
    alt: 'A bundle of dhoop sticks packed in a kraft tray compartment',
  },
  {
    key: 'sam-kalawa',
    from: 'gp_kit.png',
    crop: { left: 700, top: 430, width: 230, height: 300 },
    widths: [230],
    alt: 'A skein of red and yellow kalawa thread',
  },
  {
    key: 'sam-diya-row',
    from: 'gp_kit.png',
    crop: { left: 296, top: 424, width: 420, height: 200 },
    widths: [420],
    alt: 'Three painted terracotta diyas with cotton wicks in a kit tray',
  },
  {
    key: 'sam-camphor',
    from: 'gp_kit.png',
    crop: { left: 264, top: 366, width: 210, height: 130 },
    widths: [210],
    alt: 'White camphor tablets in a small wooden box',
  },
];

/** Downscale to 12px wide and inline as base64 for the LQIP. */
async function blurDataUrl(pipeline) {
  const buf = await pipeline
    .clone()
    .resize(12, null, { fit: 'inside' })
    .webp({ quality: 45 })
    .toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  /** @type {Record<string, {src:string;width:number;height:number;blurDataURL:string;alt:string;sizes:Array<{src:string;width:number}>}>} */
  const manifest = {};
  const sheet = [];

  for (const job of JOBS) {
    const base = sharp(join(SRC, job.from));
    // metadata() reports the *input* dimensions even after extract(), so the
    // post-crop size has to come from the crop spec itself.
    const meta = await base.clone().metadata();
    const prepared = job.crop ? base.extract(job.crop) : base;
    const srcW = job.crop ? job.crop.width : (meta.width ?? 0);
    const srcH = job.crop ? job.crop.height : (meta.height ?? 0);

    const written = [];
    const emitted = new Set();
    for (const w of job.widths) {
      // Never upscale — an enlarged crop looks soft, not premium.
      const target = Math.min(w, srcW);
      if (emitted.has(target)) continue;
      emitted.add(target);
      const name = `${job.key}-${target}.webp`;
      await prepared
        .clone()
        .resize(target, null, { withoutEnlargement: true })
        // Tight crops lose micro-contrast; a light unsharp mask restores it.
        .sharpen({ sigma: 0.6, m1: 0.4, m2: 0.9 })
        .webp({ quality: 84, effort: 6 })
        .toFile(join(OUT, name));
      written.push({ name, width: target });
    }

    const largest = written[0];
    manifest[job.key] = {
      src: `/images/${largest.name}`,
      width: srcW,
      height: srcH,
      blurDataURL: await blurDataUrl(prepared),
      alt: job.alt,
      sizes: written.map((v) => ({ src: `/images/${v.name}`, width: v.width })),
    };

    sheet.push({ key: job.key, buf: await prepared.clone().resize(200, 200, { fit: 'cover' }).png().toBuffer() });
    console.log(`  ${job.key.padEnd(22)} ${String(srcW).padStart(4)}x${String(srcH).padEnd(4)}  ${job.note ?? ''}`);
  }

  const banner = `// GENERATED by scripts/prepare-images.mjs — do not edit by hand.\n// Run \`node scripts/prepare-images.mjs\` after changing a crop.\n`;
  const body =
    `export interface PhotoAsset {\n  src: string;\n  width: number;\n  height: number;\n  blurDataURL: string;\n  alt: string;\n  sizes: ReadonlyArray<{ src: string; width: number }>;\n}\n\n` +
    `export const PHOTOS: Record<string, PhotoAsset> = ${JSON.stringify(manifest, null, 2)};\n\n` +
    `export type PhotoKey = keyof typeof PHOTOS;\n\n` +
    `export function photo(key: string): PhotoAsset | null {\n  return PHOTOS[key] ?? null;\n}\n`;
  await writeFile(join(SITE, 'src', 'lib', 'photos.ts'), banner + body, 'utf8');
  console.log(`\nWrote src/lib/photos.ts (${Object.keys(manifest).length} assets)`);

  if (process.argv.includes('--sheet')) {
    const COLS = 8;
    const TILE = 200;
    const LABEL = 26;
    const rows = Math.ceil(sheet.length / COLS);
    const W = COLS * TILE;
    const H = rows * (TILE + LABEL);
    const labels = sheet
      .map((s, i) => {
        const x = (i % COLS) * TILE;
        const y = Math.floor(i / COLS) * (TILE + LABEL) + TILE;
        return `<rect x="${x}" y="${y}" width="${TILE}" height="${LABEL}" fill="#24201D"/><text x="${x + 6}" y="${y + 18}" font-family="monospace" font-size="13" fill="#E8DDCA">${s.key}</text>`;
      })
      .join('');
    await sharp({ create: { width: W, height: H, channels: 3, background: '#FAF8F3' } })
      .composite([
        ...sheet.map((s, i) => ({
          input: s.buf,
          left: (i % COLS) * TILE,
          top: Math.floor(i / COLS) * (TILE + LABEL),
        })),
        { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${labels}</svg>`), left: 0, top: 0 },
      ])
      .png()
      .toFile(join(SITE, 'contact-sheet.png'));
    console.log('Wrote contact-sheet.png for visual QA');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
