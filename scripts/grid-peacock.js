const sharp = require('sharp');
const path = require('path');

const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function gridPeacock() {
  const meta = await sharp(peacockPng).metadata();
  let svgLines = `<svg width="${meta.width}" height="${meta.height}" xmlns="http://www.w3.org/2000/svg">`;
  for (let y = 50; y < meta.height; y += 50) {
    svgLines += `<line x1="0" y1="${y}" x2="${meta.width}" y2="${y}" stroke="red" stroke-width="1"/>`;
    svgLines += `<text x="10" y="${y - 4}" fill="red" font-size="14">${y}</text>`;
  }
  for (let x = 50; x < meta.width; x += 50) {
    svgLines += `<line x1="${x}" y1="0" x2="${x}" y2="${meta.height}" stroke="blue" stroke-width="1" stroke-dasharray="2"/>`;
    svgLines += `<text x="${x + 4}" y="20" fill="blue" font-size="12">${x}</text>`;
  }
  svgLines += '</svg>';

  // Composite on white background so it's easy to read
  await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([
      { input: peacockPng, left: 0, top: 0 },
      { input: Buffer.from(svgLines), left: 0, top: 0 }
    ])
    .jpeg({ quality: 85 })
    .toFile(path.join(__dirname, '../public/images/peacock-coord-grid.jpg'));
  
  console.log('Saved peacock-coord-grid.jpg');
}

gridPeacock().catch(console.error);
