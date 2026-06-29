import { supabase } from "@/lib/supabase";
import sharp from "sharp";

export interface OCRResult {
  imageId: string;
  text: string;
  success: boolean;
  error?: string;
}

export async function processImageOcrSpace(
  imagePath: string,
  imageId: string,
  subject: string,
  apiKey: string
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
    // Optimize image: OCR.Space requires < 5MB and benefits from good contrast
    const optimizedBuffer = await sharp(originalBuffer)
      .resize({ width: 1500, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    console.timeEnd(`Optimize Image ${imageId}`);

    const base64Image = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
    
    // Map our subjects to OCR Space language codes
    // OCR Space supports 'hin' (Hindi) and 'eng' (English)
    let langCode = "eng";
    if (subject === "HINDI") {
      langCode = "hin";
    }

    console.time(`OCR.Space Request ${imageId}`);
    
    const formData = new FormData();
    formData.append("base64Image", base64Image);
    formData.append("language", langCode);
    formData.append("isOverlayRequired", "false");
    formData.append("scale", "true");
    formData.append("OCREngine", langCode === "hin" ? "1" : "2"); // Engine 1 supports Hindi, Engine 2 is better for English numbers/maths

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        "apikey": apiKey || "helloworld" // use user's key or default
      },
      body: formData
    });

    const result = await response.json();
    console.timeEnd(`OCR.Space Request ${imageId}`);

    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage ? result.ErrorMessage[0] : "OCR.Space Processing Error");
    }

    if (!result.ParsedResults || result.ParsedResults.length === 0) {
      throw new Error("No text found in image");
    }

    const parsedText = result.ParsedResults[0].ParsedText;

    return {
      imageId,
      text: parsedText.trim(),
      success: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`OCR.Space failed for image ${imageId}:`, errorMessage);
    return {
      imageId,
      text: "",
      success: false,
      error: errorMessage,
    };
  }
}

export async function processImagesOcrSpace(
  images: { id: string; path: string }[],
  subject: string,
  apiKey: string
): Promise<OCRResult[]> {
  const results: OCRResult[] = [];

  // OCR.Space is fast, but the free API limits parallel requests.
  // We process them sequentially to avoid rate limit errors.
  for (const img of images) {
    console.log(`Processing image ${img.id} via OCR.Space...`);
    const result = await processImageOcrSpace(img.path, img.id, subject, apiKey);
    results.push(result);
  }

  return results;
}
