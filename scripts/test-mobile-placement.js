const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testPlacement() {
  // Let's create visual previews of desktop and mobile with peacock placed
  // Desktop: 1024x576
  // Mobile: 576x1024

  // In desktop:
  // Let's try placing peacock at different widths and positions
  // On desktop (1024x576):
  // Pedestal step is in the right half: x around 450 to 900, y around 250 to 450
  
  // On mobile (576x1024):
  // Let's inspect where the pedestal step is in mobileBg
  const mMeta = await sharp(mobileBg).metadata();
  console.log('Mobile image:', mMeta);

  // Let's generate a test composite for mobile with different scales & positions
  // e.g. width: 380, 420, 460
  for (const w of [380, 420, 460]) {
    const resizedPeacock = await sharp(peacockPng)
      .resize({ width: w })
      .toBuffer();
    const pInfo = await sharp(resizedPeacock).metadata();
    
    // Test different vertical placements (e.g. top: 400, 450, 500)
    for (const top of [380, 440, 500]) {
      const left = Math.round((576 - w) / 2 + 10); // slightly centered/right
      const outPath = path.join(__dirname, `../public/images/test-mobile-w${w}-t${top}.jpg`);
      await sharp(mobileBg)
        .composite([{ input: resizedPeacock, left: Math.max(0, left), top: top }])
        .jpeg({ quality: 85 })
        .toFile(outPath);
      console.log(`Saved ${outPath}`);
    }
  }
}

testPlacement().catch(console.error);
