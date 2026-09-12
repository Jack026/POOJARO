const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const origHero = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789203351431.jpg';
const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';

async function extractPeacockFromOrig() {
  const orig = await sharp(origHero).raw().toBuffer({ resolveWithObject: true });
  const bg = await sharp(desktopBg).raw().toBuffer({ resolveWithObject: true });

  // Create a diff image highlighting where pixels differ significantly
  const width = 1024;
  const height = 576;
  const diffRgba = Buffer.alloc(width * height * 4);

  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 400; x < width; x++) { // focus on right half where peacock is
      const idx = (y * width + x) * 3;
      const rDiff = Math.abs(orig.data[idx] - bg.data[idx]);
      const gDiff = Math.abs(orig.data[idx+1] - bg.data[idx+1]);
      const bDiff = Math.abs(orig.data[idx+2] - bg.data[idx+2]);
      const totalDiff = rDiff + gDiff + bDiff;

      // Ignore navbar at y < 90
      if (y > 90 && totalDiff > 35) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        const outIdx = (y * width + x) * 4;
        diffRgba[outIdx] = orig.data[idx];
        diffRgba[outIdx+1] = orig.data[idx+1];
        diffRgba[outIdx+2] = orig.data[idx+2];
        diffRgba[outIdx+3] = 255;
      }
    }
  }

  console.log('REAL PEACOCK BOUNDS IN ORIGINAL IMAGE:', {
    minX, maxX, minY, maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  });

  // Save the extracted diff overlaid on a bright pink canvas so it's 100% visible
  await sharp(diffRgba, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(__dirname, '../public/images/extracted-peacock-diff.png'));
  
  console.log('Saved extracted-peacock-diff.png');
}

extractPeacockFromOrig().catch(console.error);
