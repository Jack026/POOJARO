const sharp = require('sharp');
const path = require('path');

const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testMobileVariations() {
  // Variation 1: Normal orientation, placed on the marble courtyard floor (facing left)
  // Floor is around y: 700..900, open space from x: 0 to 450
  for (const w of [380, 420, 480]) {
    const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
    
    // On floor, bottom of image:
    // Feet land at y ≈ 820
    const scale = w / 1024;
    const feetY = 485 * scale;
    const topFloor = Math.round(820 - feetY);
    const leftFloor = 50;
    
    const outFloor = path.join(__dirname, `../public/images/test-mobile-floor-w${w}.jpg`);
    await sharp(mobileBg)
      .composite([{ input: resized, left: leftFloor, top: topFloor }])
      .jpeg({ quality: 90 })
      .toFile(outFloor);
    console.log(`Saved floor test w=${w}`);
  }

  // Variation 2: Mirrored (facing right, tail fanning left into courtyard)
  // Perched on the carved block:
  const peacockFlipped = await sharp(peacockPng).flop().toBuffer();
  for (const w of [360, 400, 440]) {
    const resizedFlipped = await sharp(peacockFlipped).resize({ width: w }).toBuffer();
    const scale = w / 1024;
    // When flipped:
    // Original feet were at x: 190. Flipped feet are at x: 1024 - 190 = 834.
    // Feet y is still 485.
    const feetY = 485 * scale;
    const topPedestal = Math.round(615 - feetY);
    const feetX = 834 * scale;
    // We want feet to rest on the carved block (x around 480..520)
    const leftPedestal = Math.round(500 - feetX);

    const outFlipped = path.join(__dirname, `../public/images/test-mobile-flipped-w${w}.jpg`);
    await sharp(mobileBg)
      .composite([{ input: resizedFlipped, left: Math.max(0, leftPedestal), top: topPedestal }])
      .jpeg({ quality: 90 })
      .toFile(outFlipped);
    console.log(`Saved flipped test w=${w}`);
  }

  // Variation 3: Normal orientation, perched on the middle step (y ≈ 700), tail flows right over thali
  for (const w of [400, 450]) {
    const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
    const scale = w / 1024;
    const feetY = 485 * scale;
    const topStep = Math.round(720 - feetY);
    const feetX = 190 * scale;
    const leftStep = Math.round(260 - feetX);

    const outStep = path.join(__dirname, `../public/images/test-mobile-step-w${w}.jpg`);
    await sharp(mobileBg)
      .composite([{ input: resized, left: Math.max(0, leftStep), top: topStep }])
      .jpeg({ quality: 90 })
      .toFile(outStep);
    console.log(`Saved step test w=${w}`);
  }
}

testMobileVariations().catch(console.error);
