const sharp = require('sharp');
const path = require('path');

const desktopBg = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789205514463.jpg';

async function locateDesktop() {
  let svgLines = '<svg width="1024" height="576" xmlns="http://www.w3.org/2000/svg">';
  for (let y = 50; y < 550; y += 50) {
    svgLines += `<line x1="0" y1="${y}" x2="1024" y2="${y}" stroke="red" stroke-width="2"/>`;
    svgLines += `<text x="10" y="${y - 4}" fill="red" font-size="16" font-weight="bold">${y}</text>`;
  }
  for (let x = 100; x < 1000; x += 50) {
    svgLines += `<line x1="${x}" y1="0" x2="${x}" y2="576" stroke="blue" stroke-width="1" stroke-dasharray="4"/>`;
    svgLines += `<text x="${x + 4}" y="30" fill="blue" font-size="14">${x}</text>`;
  }
  svgLines += '</svg>';

  await sharp(desktopBg)
    .composite([{ input: Buffer.from(svgLines), left: 0, top: 0 }])
    .jpeg({ quality: 85 })
    .toFile(path.join(__dirname, '../public/images/desktop-coord-grid.jpg'));
  
  console.log('Saved desktop-coord-grid.jpg');
}

locateDesktop().catch(console.error);
