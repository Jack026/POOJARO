const sharp = require('sharp');
const path = require('path');

const origHero = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789203351431.jpg';
const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';

async function locateUnderNav() {
  const orig = await sharp(origHero).raw().toBuffer({ resolveWithObject: true });
  const bg = await sharp(desktopBg).raw().toBuffer({ resolveWithObject: true });
  
  // Find highest y in y: 80..400, x: 480..600
  let topCrestY = 576, topCrestX = 0;
  for (let y = 80; y < 400; y++) {
    for (let x = 480; x < 600; x++) {
      const idx = (y * 1024 + x) * 3;
      const diff = Math.abs(orig.data[idx] - bg.data[idx]) + 
                   Math.abs(orig.data[idx+1] - bg.data[idx+1]) + 
                   Math.abs(orig.data[idx+2] - bg.data[idx+2]);
      if (diff > 80) {
        topCrestY = y;
        topCrestX = x;
        break;
      }
    }
    if (topCrestY < 576) break;
  }
  
  console.log('Top of crest under navbar:', { topCrestX, topCrestY });

  // Let's inspect the feet: around x: 500..570, y: 250..400
  let feetY = 0, feetX = 0;
  for (let y = 380; y >= 250; y--) {
    for (let x = 500; x < 570; x++) {
      const idx = (y * 1024 + x) * 3;
      const diff = Math.abs(orig.data[idx] - bg.data[idx]) + 
                   Math.abs(orig.data[idx+1] - bg.data[idx+1]) + 
                   Math.abs(orig.data[idx+2] - bg.data[idx+2]);
      if (diff > 80) {
        feetY = y;
        feetX = x;
        break;
      }
    }
    if (feetY > 0) break;
  }
  console.log('Lowest point of feet on pedestal:', { feetX, feetY });
}

locateUnderNav().catch(console.error);
