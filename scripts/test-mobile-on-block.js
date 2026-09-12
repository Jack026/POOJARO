const sharp = require('sharp');
const path = require('path');

const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testMobileOnBlock() {
  for (const w of [300, 330, 360]) {
    const scale = w / 1024;
    const feetY = 485 * scale;
    const top = Math.round(615 - feetY);

    for (const feetX_target of [290, 310, 330]) {
      const feetX_scaled = 190 * scale;
      const left = Math.round(feetX_target - feetX_scaled);

      const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
      const out = path.join(__dirname, `../public/images/test-block-w${w}-fx${feetX_target}.jpg`);
      await sharp(mobileBg)
        .composite([{ input: resized, left: Math.max(0, left), top }])
        .jpeg({ quality: 92 })
        .toFile(out);
      console.log(`w=${w}, fx=${feetX_target}: left=${left}, top=${top} -> ${out}`);
    }
  }
}

testMobileOnBlock().catch(console.error);
