const sharp = require('sharp');
const path = require('path');

const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function testMobileOptions() {
  // Option A: On carved block (claws at x=440, y=620)
  // w = 340
  {
    const w = 340;
    const scale = w / 1024;
    const top = Math.round(620 - 530 * scale);
    const left = Math.round(440 - 180 * scale);
    const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
    await sharp(mobileBg)
      .composite([{ input: resized, left, top }])
      .jpeg({ quality: 90 })
      .toFile(path.join(__dirname, '../public/images/mobile-opt-a-block.jpg'));
    console.log(`Option A (block): left=${left}, top=${top}, right=${left + w}`);
  }

  // Option B: On step (claws at x=250, y=720)
  // w = 380
  {
    const w = 380;
    const scale = w / 1024;
    const top = Math.round(720 - 530 * scale);
    const left = Math.round(250 - 180 * scale);
    const resized = await sharp(peacockPng).resize({ width: w }).toBuffer();
    await sharp(mobileBg)
      .composite([{ input: resized, left, top }])
      .jpeg({ quality: 90 })
      .toFile(path.join(__dirname, '../public/images/mobile-opt-b-step.jpg'));
    console.log(`Option B (step): left=${left}, top=${top}, right=${left + w}`);
  }
}

testMobileOptions().catch(console.error);
