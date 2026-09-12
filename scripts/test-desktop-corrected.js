const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testDesktopCorrected() {
  // Let's test a few top and left values around top=55..65, left=440..460
  for (const w of [520, 545, 570]) {
    const scale = w / 1024;
    const feetY = Math.round(540 * scale);
    const top = 345 - feetY;
    const feetX = Math.round(170 * scale);
    const left = 530 - feetX;

    const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
    const out = path.join(__dirname, `../public/images/test-desktop-corrected-w${w}.jpg`);
    await sharp(desktopBg)
      .composite([{ input: resized, left, top }])
      .jpeg({ quality: 92 })
      .toFile(out);
    console.log(`w=${w}: left=${left}, top=${top} -> ${out}`);
  }
}

testDesktopCorrected().catch(console.error);
