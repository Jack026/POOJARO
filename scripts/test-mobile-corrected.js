const sharp = require('sharp');
const path = require('path');

const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testMobileCorrected() {
  for (const w of [330, 350, 370]) {
    const scale = w / 1024;
    const feetY = Math.round(540 * scale);
    const top = 615 - feetY;

    for (const feetX of [270, 290, 310]) {
      const feetX_scaled = Math.round(170 * scale);
      const left = feetX - feetX_scaled;

      const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
      const out = path.join(__dirname, `../public/images/test-mobile-feet-w${w}-fx${feetX}.jpg`);
      await sharp(mobileBg)
        .composite([{ input: resized, left: Math.max(0, left), top }])
        .jpeg({ quality: 92 })
        .toFile(out);
      console.log(`w=${w}, fx=${feetX}: left=${left}, top=${top} -> ${out}`);
    }
  }
}

testMobileCorrected().catch(console.error);
