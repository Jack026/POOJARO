const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';
const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function inspect() {
  const dMeta = await sharp(desktopBg).metadata();
  console.log('Desktop BG:', dMeta.width, 'x', dMeta.height, dMeta.format);

  const mMeta = await sharp(mobileBg).metadata();
  console.log('Mobile BG:', mMeta.width, 'x', mMeta.height, mMeta.format);

  const pMeta = await sharp(peacockPng).metadata();
  console.log('Peacock PNG:', pMeta.width, 'x', pMeta.height, pMeta.channels, pMeta.format);
}

inspect().catch(console.error);
