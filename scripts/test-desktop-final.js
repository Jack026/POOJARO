const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testFinalDesktop() {
  for (const [w, left, top] of [
    [490, 455, 152],
    [510, 450, 142],
    [525, 446, 134],
  ]) {
    const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
    const out = path.join(__dirname, `../public/images/desktop-final-w${w}.jpg`);
    await sharp(desktopBg)
      .composite([{ input: resized, left, top }])
      .jpeg({ quality: 90 })
      .toFile(out);
    console.log(`w=${w}: left=${left}, top=${top}`);
  }
}

testFinalDesktop().catch(console.error);
