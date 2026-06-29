import { createWorker, Worker } from "tesseract.js";
import { supabase } from "@/lib/supabase";
import sharp from "sharp";
import path from "path";

export interface OCRResult {
  imageId: string;
  text: string;
  success: boolean;
  error?: string;
}

export async function processImage(
  imagePath: string,
  imageId: string,
  worker: Worker
): Promise<OCRResult> {
  try {
    console.time(`Download Image ${imageId}`);
    // Download image from Supabase Storage
    const { data: storageData, error: downloadError } = await supabase.storage
      .from("worksheets")
      .download(imagePath);
    console.timeEnd(`Download Image ${imageId}`);
      
    if (downloadError || !storageData) {
      throw new Error(`Failed to download image from storage: ${downloadError?.message}`);
    }

    const arrayBuffer = await storageData.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    console.time(`Optimize Image ${imageId}`);
    // Optimize image for Tesseract to dramatically speed up OCR
    // 1. Resize to max 1000px width (huge smartphone photos take forever)
    // 2. Grayscale & normalize for better contrast
    const optimizedBuffer = await sharp(originalBuffer)
      .resize({ width: 1000, withoutEnlargement: true })
      .grayscale()
      .normalize()
      .toBuffer();
    console.timeEnd(`Optimize Image ${imageId}`);

    console.time(`Tesseract Recognize ${imageId}`);
    // Recognize text using the provided worker
    const { data: { text } } = await worker.recognize(optimizedBuffer);
    console.timeEnd(`Tesseract Recognize ${imageId}`);

    return {
      imageId,
      text: text.trim(),
      success: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`OCR failed for image ${imageId}:`, errorMessage);
    return {
      imageId,
      text: "",
      success: false,
      error: errorMessage,
    };
  }
}

export async function processImages(
  images: { id: string; path: string }[],
  subject: string
): Promise<OCRResult[]> {
  const results: OCRResult[] = [];

  // Determine language based on subject
  const lang = subject === "HINDI" ? "hin+eng" : "eng";

  let worker: Worker | null = null;
  
  try {
    console.time('Initialize Tesseract Worker');
    // Initialize worker ONCE for the entire batch.
    // Use an absolute cachePath so it doesn't re-download 20MB language models 
    // on every API route invocation in Next.js.
    // Use the 'fast' language models to massively speed up OCR process.
    worker = await createWorker(lang, 1, {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast',
      cachePath: path.join(process.cwd(), '.tesseract_cache'),
      logger: m => console.log(`[Tesseract] ${m.status} - ${(m.progress * 100).toFixed(0)}%`)
    });
    console.timeEnd('Initialize Tesseract Worker');

    for (const img of images) {
      console.log(`Processing image ${img.id}...`);
      const result = await processImage(img.path, img.id, worker);
      results.push(result);
    }
  } catch (error) {
    console.error("Failed to initialize Tesseract worker:", error);
    // If worker fails to initialize, mark all as failed
    for (const img of images) {
      results.push({
        imageId: img.id,
        text: "",
        success: false,
        error: "Failed to initialize OCR engine",
      });
    }
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }

  return results;
}
