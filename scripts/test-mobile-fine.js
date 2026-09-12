const sharp = require('sharp');
const path = require('path');

const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testMobileFine() {
  const resized = await sharp(peacockPng).resize({ width: 350 }).toBuffer();

  for (const top of [430, 434, 438]) {
    for (const left of [228, 232, 236]) {
      const out = path.join(__dirname, `../public/images/mobile-fine-l${left}-t${top}.jpg`);
      await sharp(mobileBg)
        .composite([{ input: resized, left, top }])
        .jpeg({ quality: 90 })
        .toFile(out);
      console.log(`Saved mobile fine: left=${left}, top=${top}`);
    }
  }
}

testMobileFine().catch(console.error);
