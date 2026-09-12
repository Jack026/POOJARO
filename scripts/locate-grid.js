const sharp = require('sharp');
const path = require('path');

const mobileBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205834455.jpg';

async function locateCarvedBlock() {
  // We'll draw horizontal grid lines every 50 pixels on mobileBg with line numbers
  // This will show us the EXACT pixel coordinates on the image visually!
  let svgLines = '<svg width="576" height="1024" xmlns="http://www.w3.org/2000/svg">';
  for (let y = 100; y < 1000; y += 50) {
    svgLines += `<line x1="0" y1="${y}" x2="576" y2="${y}" stroke="red" stroke-width="2"/>`;
    svgLines += `<text x="10" y="${y - 4}" fill="red" font-size="18" font-weight="bold">${y}</text>`;
  }
  for (let x = 100; x < 550; x += 50) {
    svgLines += `<line x1="${x}" y1="0" x2="${x}" y2="1024" stroke="blue" stroke-width="1" stroke-dasharray="4"/>`;
    svgLines += `<text x="${x + 4}" y="50" fill="blue" font-size="16">${x}</text>`;
  }
  svgLines += '</svg>';

  await sharp(mobileBg)
    .composite([{ input: Buffer.from(svgLines), left: 0, top: 0 }])
    .jpeg({ quality: 85 })
    .toFile(path.join(__dirname, '../public/images/mobile-coord-grid.jpg'));
  
  console.log('Saved mobile-coord-grid.jpg');
}

locateCarvedBlock().catch(console.error);
