const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testComposite() {
  for (const [w, left, top] of [
    [460, 420, 175],
    [470, 420, 175],
    [480, 425, 170],
    [490, 430, 165]
  ]) {
    const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
    const out = path.join(__dirname, `../public/images/match-w${w}-l${left}-t${top}.jpg`);
    await sharp(desktopBg)
      .composite([{ input: resized, left, top }])
      .jpeg({ quality: 90 })
      .toFile(out);
    console.log(`Saved ${out}`);
  }
}

testComposite().catch(console.error);
