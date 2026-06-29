import sharp from "sharp";

export interface OCRResult {
  imageId: string;
  text: string;
  success: boolean;
  error?: string;
}

async function processImageGroq(
  imageBuffer: Buffer,
  imageId: string,
  subject: string,
  apiKey: string
): Promise<OCRResult> {
  try {
    console.time(`Optimize ${imageId}`);
    // Resize to reasonable size for API upload speed
    const optimizedBuffer = await sharp(imageBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    console.timeEnd(`Optimize ${imageId}`);

    const base64Image = optimizedBuffer.toString("base64");

    // Build prompt based on subject
    let langHint = "English";
    if (subject === "HINDI") {
      langHint = "Hindi (Devanagari script) and English";
    }

    const prompt = `Extract ALL text from this worksheet image. The text is in ${langHint}. 
Return ONLY the extracted text exactly as written, preserving the layout and line breaks. 
Do NOT add any commentary, explanations, or markdown formatting.
If there are questions with numbers, preserve the numbering.`;

    console.time(`Groq API ${imageId}`);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_completion_tokens: 4096,
      }),
    });

    const result = await response.json();
    console.timeEnd(`Groq API ${imageId}`);

    if (!response.ok) {
      throw new Error(result.error?.message || `Groq API error: ${response.status}`);
    }

    const text = result.choices?.[0]?.message?.content || "";

    return {
      imageId,
      text: text.trim(),
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Groq OCR failed for image ${imageId}:`, errorMessage);
    return { imageId, text: "", success: false, error: errorMessage };
  }
}

export async function processImagesGroq(
  images: { id: string; path: string; buffer?: Buffer }[],
  subject: string,
  apiKey: string
): Promise<OCRResult[]> {
  console.log(`Processing ${images.length} images via Groq...`);

  // Process all images in parallel — Groq handles concurrency well
  const results = await Promise.all(
    images.map((img) => {
      if (!img.buffer) {
        return Promise.resolve({
          imageId: img.id,
          text: "",
          success: false,
          error: "No image data provided",
        } as OCRResult);
      }
      return processImageGroq(img.buffer, img.id, subject, apiKey);
    })
  );

  return results;
}
