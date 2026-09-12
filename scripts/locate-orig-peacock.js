const sharp = require('sharp');
const path = require('path');

const origHero = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789203351431.jpg';
const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';

async function locate() {
  const orig = await sharp(origHero).raw().toBuffer({ resolveWithObject: true });
  const bg = await sharp(desktopBg).raw().toBuffer({ resolveWithObject: true });
  
  // Find highest y where peacock crest differs from bg
  let topCrestY = 576, topCrestX = 0;
  for (let y = 0; y < 576; y++) {
    for (let x = 450; x < 650; x++) {
      const idx = (y * 1024 + x) * 3;
      const diff = Math.abs(orig.data[idx] - bg.data[idx]) + 
                   Math.abs(orig.data[idx+1] - bg.data[idx+1]) + 
                   Math.abs(orig.data[idx+2] - bg.data[idx+2]);
      if (diff > 50) {
        topCrestY = y;
        topCrestX = x;
        break;
      }
    }
    if (topCrestY < 576) break;
  }
  
  // Find lowest y where peacock feet / tail ends
  let bottomY = 0, bottomX = 0;
  for (let y = 575; y >= 0; y--) {
    for (let x = 500; x < 1000; x++) {
      const idx = (y * 1024 + x) * 3;
      const diff = Math.abs(orig.data[idx] - bg.data[idx]) + 
                   Math.abs(orig.data[idx+1] - bg.data[idx+1]) + 
                   Math.abs(orig.data[idx+2] - bg.data[idx+2]);
      if (diff > 50) {
        bottomY = y;
        bottomX = x;
        break;
      }
    }
    if (bottomY > 0) break;
  }

  // Find leftmost x of peacock body/neck
  let leftX = 1024, leftY = 0;
  for (let x = 450; x < 650; x++) {
    for (let y = topCrestY; y < bottomY; y++) {
      const idx = (y * 1024 + x) * 3;
      const diff = Math.abs(orig.data[idx] - bg.data[idx]) + 
                   Math.abs(orig.data[idx+1] - bg.data[idx+1]) + 
                   Math.abs(orig.data[idx+2] - bg.data[idx+2]);
      if (diff > 50) {
        if (x < leftX) {
          leftX = x;
          leftY = y;
        }
      }
    }
  }

  // Find rightmost x of peacock tail
  let rightX = 0, rightY = 0;
  for (let x = 1023; x >= 650; x--) {
    for (let y = topCrestY; y < bottomY; y++) {
      const idx = (y * 1024 + x) * 3;
      const diff = Math.abs(orig.data[idx] - bg.data[idx]) + 
                   Math.abs(orig.data[idx+1] - bg.data[idx+1]) + 
                   Math.abs(orig.data[idx+2] - bg.data[idx+2]);
      if (diff > 50) {
        if (x > rightX) {
          rightX = x;
          rightY = y;
        }
      }
    }
  }

  console.log('Peacock exact bounds in origHero:', {
    topCrest: { x: topCrestX, y: topCrestY },
    bottom: { x: bottomX, y: bottomY },
    left: { x: leftX, y: leftY },
    right: { x: rightX, y: rightY },
    width: rightX - leftX + 1,
    height: bottomY - topCrestY + 1
  });
}

locate().catch(console.error);
