const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testExactDesktop() {
  const w = 510;
  const scale = w / 1024;
  // Claws at y=530, x=180 in peacock
  // We want claws at y=350, x=525 in desktopBg
  const top = Math.round(350 - 530 * scale); // 350 - 264 = 86
  const left = Math.round(525 - 180 * scale); // 525 - 90 = 435

  const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
  const out = path.join(__dirname, `../public/images/test-exact-desktop.jpg`);
  await sharp(desktopBg)
    .composite([{ input: resized, left, top }])
    .jpeg({ quality: 92 })
    .toFile(out);
  console.log(`Saved exact desktop: left=${left}, top=${top} (claws at 525, 350)`);
}

testExactDesktop().catch(console.error);
