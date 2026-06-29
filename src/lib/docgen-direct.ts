import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  PageNumber,
  Footer,
  Header,
  ImageRun,
} from "docx";
import sharp from "sharp";

/**
 * Generate a Word document by directly inserting images - no OCR needed.
 * This is the fastest possible path: download images → resize → insert into docx.
 */
export async function generateDocumentDirect(
  images: { imagePath: string; imageBuffer: Buffer }[],
  projectName: string,
  subject: string
): Promise<Buffer> {
  const fontFamily = subject === "HINDI" ? "Mangal" : "Times New Roman";
  const children: Paragraph[] = [];

  for (const img of images) {
    try {
      // Get image dimensions
      const metadata = await sharp(img.imageBuffer).metadata();
      const origW = metadata.width || 800;
      const origH = metadata.height || 600;

      // Fit to A4 page width (approx 600 points usable with 1-inch margins)
      const maxWidth = 580;
      const scale = Math.min(1, maxWidth / origW);
      const docWidth = Math.floor(origW * scale);
      const docHeight = Math.floor(origH * scale);

      // Determine image type from extension
      const ext = img.imagePath
        .substring(img.imagePath.lastIndexOf(".") + 1)
        .toLowerCase();
      const type = (["jpg", "png", "gif", "bmp"].includes(ext) ? ext : "jpg") as
        | "jpg"
        | "png"
        | "gif"
        | "bmp";

      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: img.imageBuffer,
              type,
              transformation: { width: docWidth, height: docHeight },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    } catch (err) {
      console.error(`Failed to process image ${img.imagePath}:`, err);
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: fontFamily, size: 24 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: projectName,
                    font: fontFamily,
                    size: 18,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [
                      "Page ",
                      PageNumber.CURRENT,
                      " of ",
                      PageNumber.TOTAL_PAGES,
                    ],
                    font: fontFamily,
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
