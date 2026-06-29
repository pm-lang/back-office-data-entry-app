// Test with a realistic worksheet-sized image
const { createWorker } = require('tesseract.js');
const path = require('path');
const sharp = require('sharp');

async function diagnose() {
  const cachePath = path.join(process.cwd(), '.tesseract_cache');

  // Worker init (should be fast now - cached)
  console.time('Worker init (cached)');
  const worker = await createWorker('eng', 1, {
    langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast',
    cachePath: cachePath,
  });
  console.timeEnd('Worker init (cached)');

  // Create a large worksheet-like image (2000x3000 - typical phone photo)
  console.time('Create large image');
  const bigImage = await sharp({
    create: { width: 2000, height: 3000, channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
    .composite([{
      input: Buffer.from(`<svg width="2000" height="3000">
        <text x="100" y="200" font-size="48" fill="black">Question 1: What is 2 + 2?</text>
        <text x="100" y="300" font-size="48" fill="black">Answer: 4</text>
        <text x="100" y="500" font-size="48" fill="black">Question 2: What is the capital?</text>
        <text x="100" y="600" font-size="48" fill="black">Answer: New Delhi</text>
        <text x="100" y="800" font-size="48" fill="black">Question 3: Name the planet</text>
        <text x="100" y="900" font-size="48" fill="black">Answer: Earth</text>
      </svg>`),
      top: 0, left: 0,
    }])
    .png()
    .toBuffer();
  console.timeEnd('Create large image');
  console.log('Large image size:', (bigImage.length / 1024).toFixed(0), 'KB');

  // Recognize full size
  console.time('Recognize FULL SIZE (2000x3000)');
  const { data: d1 } = await worker.recognize(bigImage);
  console.timeEnd('Recognize FULL SIZE (2000x3000)');
  console.log('Text:', d1.text.trim().substring(0, 100));

  // Downscale to 800px width first
  console.time('Downscale to 800px');
  const smallImage = await sharp(bigImage)
    .resize({ width: 800, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .toBuffer();
  console.timeEnd('Downscale to 800px');
  console.log('Small image size:', (smallImage.length / 1024).toFixed(0), 'KB');

  console.time('Recognize DOWNSCALED (800px)');
  const { data: d2 } = await worker.recognize(smallImage);
  console.timeEnd('Recognize DOWNSCALED (800px)');
  console.log('Text:', d2.text.trim().substring(0, 100));

  // Downscale to 600px width 
  console.time('Downscale to 600px');
  const tinyImage = await sharp(bigImage)
    .resize({ width: 600, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .toBuffer();
  console.timeEnd('Downscale to 600px');

  console.time('Recognize TINY (600px)');
  const { data: d3 } = await worker.recognize(tinyImage);
  console.timeEnd('Recognize TINY (600px)');
  console.log('Text:', d3.text.trim().substring(0, 100));

  await worker.terminate();
  console.log('\nDone!');
}

diagnose().catch(console.error);
