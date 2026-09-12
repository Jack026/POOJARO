const sharp = require('sharp');
const path = require('path');

const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function analyze() {
  const img = sharp(peacockPng);
  const trimmed = await sharp(peacockPng).trim().toBuffer({ resolveWithObject: true });
  console.log('Trimmed dimensions:', trimmed.info.width, 'x', trimmed.info.height);
  console.log('Trim info:', trimmed.info.trimOffsetLeft, trimmed.info.trimOffsetTop);
}

analyze().catch(console.error);
