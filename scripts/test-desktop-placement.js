const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testDesktop() {
  const peacockResized = await sharp(peacockPng)
    .resize({ width: 480 })
    .toBuffer();
  
  // In peacockPng (1024x682):
  // Let's find crown and feet relative to top-left
  // Crown is around x: 190, y: 15
  // Feet are around x: 200, y: 495
  // In resized (width: 480):
  // scale = 480 / 1024 = 0.46875
  // Crown at x: 89, y: 7
  // Feet at x: 94, y: 232
  // We want feet to be on the pedestal top:
  // In desktopBg (1024x576), pedestal top surface is around x: 550, y: 358
  // So left = 550 - 94 = 456
  // top = 358 - 232 = 126
  
  for (const [left, top] of [
    [450, 126],
    [456, 126],
    [460, 130],
    [445, 120]
  ]) {
    const out = path.join(__dirname, `../public/images/test-desktop-l${left}-t${top}.jpg`);
    await sharp(desktopBg)
      .composite([{ input: peacockResized, left, top }])
      .jpeg({ quality: 90 })
      .toFile(out);
    console.log(`Saved desktop test: ${out}`);
  }
}

testDesktop().catch(console.error);
