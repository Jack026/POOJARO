const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function buildMasterScenes() {
  console.log('Generating Master Desktop Hero Scene...');
  // 1. Composite on 1024x576 base FIRST
  // Verified match: w=470, left=420, top=175
  const peacockDesktop = await sharp(peacockPng)
    .resize({ width: 470 })
    .toBuffer();

  const desktopComp1024 = await sharp(desktopBg)
    .composite([
      { input: peacockDesktop, left: 420, top: 175 }
    ])
    .toBuffer();

  // 2. Now resize the final composited image to 1920x1080 with lanczos3
  await sharp(desktopComp1024)
    .resize({ width: 1920, height: 1080, kernel: 'lanczos3' })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(__dirname, '../public/images/hero-desktop-scene.jpg'));

  console.log('Desktop Scene successfully generated: 1920x1080');

  console.log('Generating Master Mobile Hero Scene...');
  // 1. Composite on 576x1024 base FIRST
  // Verified match: w=380, left=183, top=523
  const peacockMobile = await sharp(peacockPng)
    .resize({ width: 380 })
    .toBuffer();

  const mobileComp576 = await sharp(mobileBg)
    .composite([
      { input: peacockMobile, left: 183, top: 523 }
    ])
    .toBuffer();

  // 2. Now resize the final composited image to 1080x1920 with lanczos3
  await sharp(mobileComp576)
    .resize({ width: 1080, height: 1920, kernel: 'lanczos3' })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(__dirname, '../public/images/hero-mobile-scene.jpg'));

  console.log('Mobile Scene successfully generated: 1080x1920');
}

buildMasterScenes().catch(console.error);
