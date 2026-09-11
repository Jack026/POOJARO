/**
 * App icon pipeline for POOJARO.
 *
 * `src/app/manifest.ts` promises /icon-192x192.png and /icon-512x512.png, so
 * those files have to exist or an install prompt 404s. There is no brand mark
 * anywhere in the repo to rasterise, and the four source photographs are the
 * wrong thing to crop one out of — two of them carry a *different* brand's
 * wordmark (see prepare-images.mjs), and a photo crop is unreadable at 32px
 * anyway. So the mark is drawn here: a lit diya, flat vector, brand palette
 * only, no outside asset involved.
 *
 * Geometry sits inside the maskable safe zone — the whole mark fits within a
 * circle of radius 198 about the 512-canvas centre, under the 205 that Android's
 * 80% safe area allows — so one square file serves both `any` and `maskable`.
 *
 *   node scripts/make-icons.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '..');

// Straight from globals.css. The icon is a surface the palette has to cover too.
const BROWN = '#3a2118';
const GOLD = '#b78332';
const GOLD_SOFT = '#d9b871';
const GOLD_WASH = '#f7efdc';
const IVORY = '#faf8f3';

/**
 * The mark, at its native 512 grid. `bg` is separate because the favicon reads
 * better full-bleed while nothing else needs the choice made differently.
 * @param {{ bg: string }} opts
 */
function markSvg({ bg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GOLD_WASH}"/>
      <stop offset="1" stop-color="${GOLD_SOFT}"/>
    </linearGradient>
    <linearGradient id="bowl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GOLD_SOFT}"/>
      <stop offset="1" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="${bg}"/>
  <path fill="url(#flame)" d="M256 118 C302 180 320 216 320 254 C320 292 292 322 256 322 C220 322 192 292 192 254 C192 216 210 180 256 118 Z"/>
  <path fill="${IVORY}" opacity="0.92" d="M256 182 C284 222 294 244 294 266 C294 294 278 312 256 312 C234 312 218 294 218 266 C218 244 228 222 256 182 Z"/>
  <path fill="url(#bowl)" d="M120 322 L392 322 C392 322 370 402 256 402 C142 402 120 322 120 322 Z"/>
</svg>`;
}

/**
 * @typedef {{ out: string, size: number, note: string }} Job
 * @type {Job[]}
 */
const JOBS = [
  // Referenced by name from src/app/manifest.ts — these two paths are load-bearing.
  { out: join(SITE, 'public', 'icon-192x192.png'), size: 192, note: 'manifest, home-screen' },
  { out: join(SITE, 'public', 'icon-512x512.png'), size: 512, note: 'manifest, splash + maskable' },
  // App Router file conventions. Next wires the <link> tags itself, so no
  // change to layout.tsx is needed for these to take effect.
  { out: join(SITE, 'src', 'app', 'icon.png'), size: 64, note: 'favicon (app/icon.png)' },
  { out: join(SITE, 'src', 'app', 'apple-icon.png'), size: 180, note: 'iOS (app/apple-icon.png)' },
];

async function main() {
  const svg = Buffer.from(markSvg({ bg: BROWN }));
  await mkdir(join(SITE, 'public'), { recursive: true });

  for (const job of JOBS) {
    await sharp(svg, { density: 384 })
      .resize(job.size, job.size)
      .png({ compressionLevel: 9, palette: true })
      .toFile(job.out);
    const rel = job.out.slice(SITE.length + 1).replace(/\\/g, '/');
    console.log(`  ${rel.padEnd(30)} ${String(job.size).padStart(3)}px  ${job.note}`);
  }

  console.log(`\nWrote ${JOBS.length} icons. Replace with the real brand mark when there is one.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
