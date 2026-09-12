const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';

async function generateCleanBackdrops() {
  console.log('Generating hero-clean-desktop.jpg (1920x1080)...');
  await sharp(desktopBg)
    .resize({ width: 1920, height: 1080, kernel: 'lanczos3' })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(__dirname, '../public/images/hero-clean-desktop.jpg'));

  console.log('Generating hero-clean-mobile.jpg (1080x1920)...');
  await sharp(mobileBg)
    .resize({ width: 1080, height: 1920, kernel: 'lanczos3' })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(__dirname, '../public/images/hero-clean-mobile.jpg'));

  console.log('Clean backdrops successfully created!');
}

generateCleanBackdrops().catch(console.error);
