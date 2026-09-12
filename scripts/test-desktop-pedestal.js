const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testDesktopPedestal() {
  const resized = await sharp(peacockPng).resize({ width: 490 }).toBuffer();

  for (const top of [145, 152, 160]) {
    for (const left of [445, 455, 465]) {
      const out = path.join(__dirname, `../public/images/pedestal-l${left}-t${top}.jpg`);
      await sharp(desktopBg)
        .composite([{ input: resized, left, top }])
        .jpeg({ quality: 85 })
        .toFile(out);
      console.log(`Saved l=${left}, t=${top}`);
    }
  }
}

testDesktopPedestal().catch(console.error);
