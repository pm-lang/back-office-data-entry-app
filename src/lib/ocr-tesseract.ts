import { createWorker, Worker } from "tesseract.js";
import sharp from "sharp";
import path from "path";

export interface OCRResult {
  imageId: string;
  text: string;
  success: boolean;
  error?: string;
}

// Module-level persistent worker cache to avoid re-initialization on every request
let cachedWorker: Worker | null = null;
let cachedLang: string = "";

async function getWorker(lang: string): Promise<Worker> {
  // Reuse existing worker if same language
  if (cachedWorker && cachedLang === lang) {
    return cachedWorker;
  }
  // Terminate old worker if switching language
  if (cachedWorker) {
    try { await cachedWorker.terminate(); } catch (e) { /* ignore */ }
  }
  
  console.time("Initialize Tesseract Worker");
  cachedWorker = await createWorker(lang, 1, {
    langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
    cachePath: path.join(process.cwd(), ".tesseract_cache"),
  });
  cachedLang = lang;
  console.timeEnd("Initialize Tesseract Worker");
  return cachedWorker;
}

async function processImage(
  imageBuffer: Buffer,
  imageId: string,
  worker: Worker
): Promise<OCRResult> {
  try {
    console.time(`Optimize ${imageId}`);
    // Aggressively downscale to 800px width - this is the sweet spot
    // (benchmark shows 0.3s vs 1.6s for full size, with similar accuracy)
    const optimizedBuffer = await sharp(imageBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .grayscale()
      .normalize()
      .png() // Tesseract works best with PNG
      .toBuffer();
    console.timeEnd(`Optimize ${imageId}`);

    console.time(`Recognize ${imageId}`);
    const { data: { text } } = await worker.recognize(optimizedBuffer);
    console.timeEnd(`Recognize ${imageId}`);

    return {
      imageId,
      text: text.trim(),
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`OCR failed for image ${imageId}:`, errorMessage);
    return { imageId, text: "", success: false, error: errorMessage };
  }
}

export async function processImages(
  images: { id: string; path: string; buffer?: Buffer }[],
  subject: string
): Promise<OCRResult[]> {
  // Determine language
  let lang = "eng";
  if (subject === "HINDI") {
    lang = "hin";
  }

  try {
    const worker = await getWorker(lang);

    // Process images sequentially (Tesseract worker is single-threaded)
    const results: OCRResult[] = [];
    for (const img of images) {
      if (!img.buffer) {
        results.push({ imageId: img.id, text: "", success: false, error: "No image data provided" });
        continue;
      }
      console.log(`Processing image ${img.id}...`);
      const result = await processImage(img.buffer, img.id, worker);
      results.push(result);
    }

    return results;
  } catch (error) {
    console.error("Failed to initialize Tesseract worker:", error);
    return images.map((img) => ({
      imageId: img.id,
      text: "",
      success: false,
      error: "Failed to initialize OCR engine",
    }));
  }
}
