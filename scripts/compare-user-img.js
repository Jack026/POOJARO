const sharp = require('sharp');
const path = require('path');

const userImg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789219170797.jpg';
const cleanBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const origHero = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789203351431.jpg';

async function compare() {
  const uMeta = await sharp(userImg).metadata();
  console.log('User uploaded (new):', uMeta.width, 'x', uMeta.height);

  const cMeta = await sharp(cleanBg).metadata();
  console.log('Clean BG:', cMeta.width, 'x', cMeta.height);

  const oMeta = await sharp(origHero).metadata();
  console.log('Orig Hero:', oMeta.width, 'x', oMeta.height);

  // In userImg (1024x498):
  // Let's find where the peacock is!
  // Find bounding box of the peacock in userImg
  const uRaw = await sharp(userImg).raw().toBuffer({ resolveWithObject: true });
  
  // Find peacock crest: x in 450..550
  // And claws: x in 480..560
  // And tail: x in 500..1024
}

compare().catch(console.error);
