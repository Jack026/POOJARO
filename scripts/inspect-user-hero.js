const sharp = require('sharp');
const path = require('path');

const userImg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789219170797.jpg';

async function inspectUserHero() {
  const { data, info } = await sharp(userImg).raw().toBuffer({ resolveWithObject: true });
  console.log('User Hero info:', info.width, 'x', info.height);

  // Let's crop the peacock area in userImg (1024x498)
  // Crest is around x: 500..560, y: 50..150
  // Claws at pedestal around y: 250..350
  // Tail spans to x: ~950
  await sharp(userImg)
    .extract({ left: 450, top: 40, width: 550, height: 440 })
    .toFile(path.join(__dirname, '../public/images/user-peacock-crop.jpg'));

  console.log('Saved user-peacock-crop.jpg');
}

inspectUserHero().catch(console.error);
