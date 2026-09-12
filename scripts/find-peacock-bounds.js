const sharp = require('sharp');
const path = require('path');

const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function findBbox() {
  const { data, info } = await sharp(peacockPng).raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  let lowestY = 0, lowestX = 0;
  
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (y > lowestY) {
          lowestY = y;
          lowestX = x;
        }
      }
    }
  }
  console.log('Peacock alpha bounding box:', { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 });
  console.log('Lowest non-transparent pixel (feet/base):', { lowestX, lowestY });
}

findBbox().catch(console.error);
