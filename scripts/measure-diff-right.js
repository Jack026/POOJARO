const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const origHero = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789203351431.jpg';

async function measureRight() {
  const origRaw = await sharp(origHero).raw().toBuffer();
  const dRaw = await sharp(desktopBg).raw().toBuffer();

  let diffMinX = 1024, diffMaxX = 0, diffMinY = 576, diffMaxY = 0;
  for (let y = 0; y < 576; y++) {
    for (let x = 450; x < 1000; x++) {
      const idx = (y * 1024 + x) * 3;
      const dr = Math.abs(origRaw[idx] - dRaw[idx]);
      const dg = Math.abs(origRaw[idx+1] - dRaw[idx+1]);
      const db = Math.abs(origRaw[idx+2] - dRaw[idx+2]);
      if (dr + dg + db > 60) {
        if (x < diffMinX) diffMinX = x;
        if (x > diffMaxX) diffMaxX = x;
        if (y < diffMinY) diffMinY = y;
        if (y > diffMaxY) diffMaxY = y;
      }
    }
  }
  console.log('Peacock diff in origHero (x > 450):', {
    diffMinX, diffMaxX, diffMinY, diffMaxY,
    width: diffMaxX - diffMinX + 1,
    height: diffMaxY - diffMinY + 1
  });
}

measureRight().catch(console.error);
