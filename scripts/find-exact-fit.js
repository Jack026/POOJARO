const sharp = require('sharp');
const path = require('path');

const origHero = 'C:/Users/soura/.gemini/antigravity/brain/d5f808a8-d024-4a9e-8925-62c26e5fca3e/.user_uploaded/media_1789203351431.jpg';
const peacockPng = path.join(__dirname, '../public/images/peacock/peacock-transparent.png');

async function findExactFit() {
  const orig = await sharp(origHero).raw().toBuffer({ resolveWithObject: true });
  
  // We'll search across widths: 440 to 520
  // and left: 400 to 480
  // and top: 100 to 180
  // We compare the eye of the peacock in origHero vs in peacockPng
  // In origHero:
  // Eye of peacock is a distinctive dark circle with golden outline around x=540, y=170
  
  let bestScore = Infinity;
  let bestFit = null;

  for (const w of [460, 480, 500, 520]) {
    const resized = await sharp(peacockPng).resize({ width: w }).raw().toBuffer({ resolveWithObject: true });
    
    for (const top of [120, 135, 150, 165]) {
      for (const left of [430, 445, 460, 475]) {
        let diffSum = 0;
        let sampleCount = 0;

        // Sample pixels on the neck/chest where alpha is 255
        for (let py = 100; py < 250; py += 3) {
          for (let px = 50; px < 150; px += 3) {
            const pIdx = (py * resized.info.width + px) * 4;
            if (resized.data[pIdx + 3] > 200) {
              const ox = left + px;
              const oy = top + py;
              if (ox < 1024 && oy < 576) {
                const oIdx = (oy * 1024 + ox) * 3;
                diffSum += Math.abs(orig.data[oIdx] - resized.data[pIdx]) +
                           Math.abs(orig.data[oIdx+1] - resized.data[pIdx+1]) +
                           Math.abs(orig.data[oIdx+2] - resized.data[pIdx+2]);
                sampleCount++;
              }
            }
          }
        }

        const avgDiff = sampleCount > 0 ? diffSum / sampleCount : Infinity;
        if (avgDiff < bestScore) {
          bestScore = avgDiff;
          bestFit = { w, left, top, avgDiff };
        }
      }
    }
  }

  console.log('BEST MATCH FIT:', bestFit);

  // Now refine around best match
  const bw = bestFit.w;
  let fineBestScore = Infinity;
  let fineBestFit = null;

  for (let w = bw - 15; w <= bw + 15; w += 5) {
    const resized = await sharp(peacockPng).resize({ width: w }).raw().toBuffer({ resolveWithObject: true });
    for (let top = bestFit.top - 10; top <= bestFit.top + 10; top += 2) {
      for (let left = bestFit.left - 10; left <= bestFit.left + 10; left += 2) {
        let diffSum = 0;
        let sampleCount = 0;

        for (let py = 80; py < 280; py += 2) {
          for (let px = 40; px < 180; px += 2) {
            const pIdx = (py * resized.info.width + px) * 4;
            if (resized.data[pIdx + 3] > 220) {
              const ox = left + px;
              const oy = top + py;
              if (ox < 1024 && oy < 576) {
                const oIdx = (oy * 1024 + ox) * 3;
                diffSum += Math.abs(orig.data[oIdx] - resized.data[pIdx]) +
                           Math.abs(orig.data[oIdx+1] - resized.data[pIdx+1]) +
                           Math.abs(orig.data[oIdx+2] - resized.data[pIdx+2]);
                sampleCount++;
              }
            }
          }
        }

        const avgDiff = sampleCount > 0 ? diffSum / sampleCount : Infinity;
        if (avgDiff < fineBestScore) {
          fineBestScore = avgDiff;
          fineBestFit = { w, left, top, avgDiff };
        }
      }
    }
  }

  console.log('FINE BEST MATCH FIT:', fineBestFit);

  // Generate test overlay with fineBestFit
  const testResized = await sharp(peacockPng).resize({ width: fineBestFit.w }).toBuffer();
  await sharp(origHero)
    .composite([{ input: testResized, left: fineBestFit.left, top: fineBestFit.top, blend: 'difference' }])
    .jpeg({ quality: 90 })
    .toFile(path.join(__dirname, '../public/images/test-difference.jpg'));
  
  console.log('Saved test-difference.jpg (should be black where perfectly aligned)');
}

findExactFit().catch(console.error);
