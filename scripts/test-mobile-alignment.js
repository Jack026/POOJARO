const sharp = require('sharp');
const path = require('path');

const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testMobileAlignment() {
  // mobileBg is 576 x 1024
  // Let's test placing peacock on mobileBg
  // Notice in mobileBg:
  // The pillar is on the right half (x: ~380..576)
  // The top of the square carved block is at y ≈ 615
  // If the peacock perches on this block:
  // Its feet are at y ≈ 615, x ≈ 450 to 480
  // But wait! If the tail goes to the right, how wide is it?
  // In mobileBg, the right edge is at x=576!
  // If the peacock's tail goes right, does it fit within 576, or does it hang over?
  // Let's test widths: 360, 400, 440, 480
  // Let's also check if the peacock is centered or on the pedestal

  for (const w of [340, 380, 420, 460]) {
    const scale = w / 1024;
    const feetY_scaled = 485 * scale;
    const top = Math.round(615 - feetY_scaled);
    const feetX_scaled = 190 * scale;
    
    // Position 1: feet on the pedestal (x=440)
    const leftPedestal = Math.round(440 - feetX_scaled);
    
    // Position 2: shifted slightly left so more tail is visible (x=360)
    const leftShifted = Math.round(340 - feetX_scaled);

    const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
    
    const out1 = path.join(__dirname, `../public/images/test-mobile-w${w}-pedestal.jpg`);
    await sharp(mobileBg)
      .composite([{ input: resized, left: Math.max(0, leftPedestal), top }])
      .jpeg({ quality: 92 })
      .toFile(out1);

    const out2 = path.join(__dirname, `../public/images/test-mobile-w${w}-shifted.jpg`);
    await sharp(mobileBg)
      .composite([{ input: resized, left: Math.max(0, leftShifted), top }])
      .jpeg({ quality: 92 })
      .toFile(out2);

    console.log(`w=${w}: pedestal=${leftPedestal}, shifted=${leftShifted}, top=${top}`);
  }
}

testMobileAlignment().catch(console.error);
