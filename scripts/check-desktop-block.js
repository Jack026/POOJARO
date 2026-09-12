const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';

async function checkDesktopBlock() {
  const { data, info } = await sharp(desktopBg).raw().toBuffer({ resolveWithObject: true });
  console.log('Desktop bg info:', info);

  // Let's crop patches of desktopBg to find where the carved block is!
  // Height is 576.
  // Let's crop y: 200..400 and y: 350..550 around x: 450..650
  await sharp(desktopBg)
    .extract({ left: 450, top: 250, width: 200, height: 200 })
    .toFile(path.join(__dirname, '../public/images/test-desktop-patch-250.jpg'));

  await sharp(desktopBg)
    .extract({ left: 450, top: 400, width: 200, height: 170 })
    .toFile(path.join(__dirname, '../public/images/test-desktop-patch-400.jpg'));

  console.log('Saved patches');
}

checkDesktopBlock().catch(console.error);
