const sharp = require('sharp');
const path = require('path');

const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function findFeet() {
  const { data, info } = await sharp(peacockPng).raw().toBuffer({ resolveWithObject: true });
  
  // Find feet: bird feet are the golden legs on the left side (x: 100..250)
  // Let's find lowest non-transparent pixels in x: 140..220
  let feetMinY = 682, feetMaxY = 0, feetX = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 140; x < 220; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha > 100) {
        if (y < feetMinY) feetMinY = y;
        if (y > feetMaxY) {
          feetMaxY = y;
          feetX = x;
        }
      }
    }
  }
  console.log('Peacock feet in x:140..220:', { feetMinY, feetMaxY, feetX });

  // Let's crop the feet area to see exactly what is there!
  await sharp(peacockPng)
    .extract({ left: 100, top: 300, width: 200, height: 350 })
    .toFile(path.join(__dirname, '../public/images/test-peacock-feet.png'));
  console.log('Saved test-peacock-feet.png');
}

findFeet().catch(console.error);
