const sharp = require('sharp');
const path = require('path');

const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';

async function inspectMobilePedestal() {
  const { data, info } = await sharp(mobileBg).raw().toBuffer({ resolveWithObject: true });
  
  // Crop a patch around the carved block: x: 300..500, y: 550..700
  const patch = await sharp(mobileBg)
    .extract({ left: 300, top: 550, width: 200, height: 150 })
    .toFile(path.join(__dirname, '../public/images/test-pedestal-patch.jpg'));
  
  console.log('Saved pedestal patch to public/images/test-pedestal-patch.jpg');
}

inspectMobilePedestal().catch(console.error);
