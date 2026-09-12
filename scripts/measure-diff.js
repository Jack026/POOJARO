const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');
const origHero = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789203351431.jpg';

async function measure() {
  const oMeta = await sharp(origHero).metadata();
  console.log('Original Hero with peacock:', oMeta.width, 'x', oMeta.height);

  const dMeta = await sharp(desktopBg).metadata();
  console.log('Desktop BG without peacock:', dMeta.width, 'x', dMeta.height);

  const mMeta = await sharp(mobileBg).metadata();
  console.log('Mobile BG without peacock:', mMeta.width, 'x', mMeta.height);

  // In origHero (1024x576), let's find the difference between origHero and desktopBg!
  // Since both are 1024x576, subtracting desktopBg from origHero will reveal the EXACT position of the peacock in origHero!
  const origRaw = await sharp(origHero).raw().toBuffer();
  const dRaw = await sharp(desktopBg).raw().toBuffer();

  let diffMinX = 1024, diffMaxX = 0, diffMinY = 576, diffMaxY = 0;
  for (let y = 0; y < 576; y++) {
    for (let x = 0; x < 1024; x++) {
      const idx = (y * 1024 + x) * 3;
      const dr = Math.abs(origRaw[idx] - dRaw[idx]);
      const dg = Math.abs(origRaw[idx+1] - dRaw[idx+1]);
      const db = Math.abs(origRaw[idx+2] - dRaw[idx+2]);
      if (dr + dg + db > 40) {
        if (x < diffMinX) diffMinX = x;
        if (x > diffMaxX) diffMaxX = x;
        if (y < diffMinY) diffMinY = y;
        if (y > diffMaxY) diffMaxY = y;
      }
    }
  }
  console.log('EXACT peacock bounding box in origHero (1024x576):', {
    diffMinX, diffMaxX, diffMinY, diffMaxY,
    width: diffMaxX - diffMinX + 1,
    height: diffMaxY - diffMinY + 1
  });
}

measure().catch(console.error);
