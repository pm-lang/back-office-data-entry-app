import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function getOCRPrompt(subject: string): string {
  const subjectHint =
    subject === "HINDI"
      ? "This is a HINDI worksheet. All Hindi text MUST be transcribed in proper Unicode Devanagari script (e.g., हिन्दी, प्रश्न, अनुशासन). Do NOT use legacy font encodings."
      : subject === "MATHS"
      ? "This is a MATHEMATICS worksheet. Pay special attention to numbers, equations, mathematical symbols, tables with numerical data, and geometric shapes."
      : subject === "ENGLISH"
      ? "This is an ENGLISH worksheet. Preserve proper English grammar, punctuation, and formatting."
      : subject === "SCIENCE" || subject === "PHYSICS" || subject === "CHEMISTRY"
      ? "This is a SCIENCE worksheet. Pay attention to scientific terminology, formulas, diagrams, and units of measurement."
      : "Transcribe this worksheet accurately, preserving all text and formatting.";

  return `You are an expert OCR engine specializing in Indian school worksheets and exam papers.

${subjectHint}

RULES:
1. Transcribe ALL handwritten AND printed text exactly as shown in the image.
2. Hindi/Devanagari text: Output in clean Unicode Devanagari script. NEVER output in legacy font encoding.
3. English text: Output as standard English.
4. Math: Use standard Unicode symbols (×, ÷, +, −, =, ², ³, ½, ¼, ¾, √, π, etc.). Use ½ for 'half' or '1/2'.
5. Preserve question numbering exactly (प्र-1, Q.1, 1., (i), etc.)
6. Preserve MCQ options: (क), (ख), (ग), (घ) or (a), (b), (c), (d)
7. Preserve marks/scoring: (1), (2), (1×2=2), etc. in their original position
8. Tables: Format as markdown tables with | column | separators |
9. Fill-in-the-blanks: Represent as _______________
10. Images/diagrams: If there is a diagram, graph, or complex visual element, output its bounding box as [IMAGE_BBOX: ymin,xmin,ymax,xmax] where coordinates are integers from 0 to 1000 representing normalized positions. DO NOT transcribe the visual content as text if it's a complex diagram, just use the BBOX.
11. Section headers and titles: Mark with ## or ### as appropriate
12. Maintain proper paragraph breaks and spacing
13. For bilingual content, preserve both languages as they appear

OUTPUT FORMAT:
Return clean, well-structured markdown that preserves the document's original structure and hierarchy.
Do NOT add any commentary, explanations, or notes. Return ONLY the transcribed content.
CRITICAL: DO NOT hallucinate, invent, or create fake examples. Only transcribe what is visibly written in the image.`;
}

export interface OCRResult {
  imageId: string;
  text: string;
  success: boolean;
  error?: string;
}

export async function processImage(
  imagePath: string,
  imageId: string,
  subject: string
): Promise<OCRResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Download image from Supabase Storage
    const { data: storageData, error: downloadError } = await supabase.storage
      .from("worksheets")
      .download(imagePath);
      
    if (downloadError || !storageData) {
      throw new Error(`Failed to download image from storage: ${downloadError?.message}`);
    }

    const arrayBuffer = await storageData.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const base64Image = imageBuffer.toString("base64");

    const ext = imagePath.substring(imagePath.lastIndexOf(".")).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".bmp": "image/bmp",
    };
    const mimeType = mimeMap[ext] || "image/jpeg";

    const result = await model.generateContent([
      getOCRPrompt(subject),
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

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
  // Process images sequentially with a delay to respect free tier rate limits (15 RPM)
  const results: OCRResult[] = [];
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const result = await processImage(img.path, img.id, subject);
    results.push(result);
    
    // Add delay between requests (except after the last one)
    if (i < images.length - 1) {
      await delay(3500); // 3.5s delay
    }
  }

  return results;
}
