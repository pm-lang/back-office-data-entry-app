const { createWorker } = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');

async function testOCR() {
  console.time('Full Process');
  
  console.time('Initialize Worker');
  const worker = await createWorker('eng');
  console.timeEnd('Initialize Worker');

  // Create a dummy image
  console.time('Create Dummy Image');
  const buffer = await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  }).jpeg().toBuffer();
  console.timeEnd('Create Dummy Image');

  console.time('Recognize Text');
  const { data: { text } } = await worker.recognize(buffer);
  console.timeEnd('Recognize Text');

  await worker.terminate();
  console.timeEnd('Full Process');
  
  console.log("Extracted text:", text.slice(0, 50));
}

testOCR().catch(console.error);
