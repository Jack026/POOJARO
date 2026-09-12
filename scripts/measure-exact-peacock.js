const sharp = require('sharp');
const path = require('path');

const diffPng = path.join(__dirname, '../public/images/extracted-peacock-diff.png');

async function measureExactPeacock() {
  const { data, info } = await sharp(diffPng).raw().toBuffer({ resolveWithObject: true });
  
  // Find crest top (x in 520..560, y in 100..200)
  let crestTopY = 576, crestTopX = 0;
  for (let y = 100; y < 200; y++) {
    for (let x = 520; x < 560; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha > 128) {
        crestTopY = y;
        crestTopX = x;
        break;
      }
    }
    if (crestTopY < 576) break;
  }

  // Find claws (x in 510..570, y in 300..380)
  let clawBottomY = 0, clawBottomX = 0;
  for (let y = 380; y >= 300; y--) {
    for (let x = 510; x < 570; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha > 128) {
        clawBottomY = y;
        clawBottomX = x;
        break;
      }
    }
    if (clawBottomY > 0) break;
  }

  // Find leftmost breast pixel (x in 480..520, y in 200..320)
  let breastLeftX = 1024, breastLeftY = 0;
  for (let x = 480; x < 540; x++) {
    for (let y = 200; y < 320; y++) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha > 128) {
        if (x < breastLeftX) {
          breastLeftX = x;
          breastLeftY = y;
        }
      }
    }
  }

  console.log('EXACT ORIGINAL PEACOCK METRICS ON 1024x576 IMAGE:', {
    crestTop: { x: crestTopX, y: crestTopY },
    clawBottom: { x: clawBottomX, y: clawBottomY },
    heightFromCrestToClaw: clawBottomY - crestTopY,
    breastLeft: { x: breastLeftX, y: breastLeftY }
  });
}

measureExactPeacock().catch(console.error);
