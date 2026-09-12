const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testGrid() {
  // Let's test w = 520
  // In our previous test, left=440 top=58 put the peacock way up in the sky.
  // That means:
  // To move DOWN to the pedestal, top needs to be MUCH LARGER! (e.g. 150, 180, 200, 220)
  // To move RIGHT to the pedestal, left needs to be LARGER! (e.g. 450, 480, 510, 540)
  
  const resized = await sharp(peacockPng).resize({ width: 520 }).toBuffer();

  for (const top of [160, 190, 220]) {
    for (const left of [460, 500, 540]) {
      const out = path.join(__dirname, `../public/images/grid-l${left}-t${top}.jpg`);
      await sharp(desktopBg)
        .composite([{ input: resized, left, top }])
        .jpeg({ quality: 80 })
        .toFile(out);
      console.log(`Saved grid: left=${left}, top=${top}`);
    }
  }
}

testGrid().catch(console.error);
