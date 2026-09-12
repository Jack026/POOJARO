const sharp = require('sharp');
const path = require('path');

const userImg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789219170797.jpg';

async function processUserScene() {
  // Upscale userImg (1024x498) to crisp high-res 2048x996
  await sharp(userImg)
    .resize({ width: 2048, height: 996, kernel: 'lanczos3' })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(__dirname, '../public/images/hero-desktop-scene.jpg'));

  console.log('Saved public/images/hero-desktop-scene.jpg from user uploaded image (2048x996)!');
}

processUserScene().catch(console.error);
