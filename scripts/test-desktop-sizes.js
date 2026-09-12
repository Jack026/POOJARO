const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testDesktopSizes() {
  // peacockPng is 1024x682
  // Let's find exact coordinates of feet and crown in peacockPng
  // In peacockPng:
  // Crest top bead: y ≈ 16, x ≈ 202
  // Feet bottom (where feet touch perch): y ≈ 485, x ≈ 190
  // Hanging vines below feet reach down to: y ≈ 600
  
  // We want the feet (y ≈ 485) to land at y = 354 on desktopBg (1024x576)
  // And the feet x (x ≈ 190) to be at x = 540 on desktopBg
  // For each width:
  // scale = width / 1024
  // feetY_scaled = 485 * scale
  // top = Math.round(354 - feetY_scaled)
  // feetX_scaled = 190 * scale
  // left = Math.round(540 - feetX_scaled)

  for (const w of [490, 520, 545, 570]) {
    const scale = w / 1024;
    const feetY_scaled = 485 * scale;
    const top = Math.round(354 - feetY_scaled);
    const feetX_scaled = 190 * scale;
    const left = Math.round(540 - feetX_scaled);

    const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
    const out = path.join(__dirname, `../public/images/test-align-w${w}.jpg`);
    await sharp(desktopBg)
      .composite([{ input: resized, left, top }])
      .jpeg({ quality: 92 })
      .toFile(out);
    console.log(`w=${w}: left=${left}, top=${top} -> ${out}`);
  }
}

testDesktopSizes().catch(console.error);
