import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageNumber,
  Footer,
  Header,
  UnderlineType,
  ImageRun,
} from "docx";
import path from "path";
import sharp from "sharp";
// supabase import removed - images are now pre-fetched by the caller

interface FontConfig {
  hindi: string;
  english: string;
  size: number;
}

function getFontConfig(subject: string): FontConfig {
  return {
    hindi: "Mangal",
    english: subject === "HINDI" ? "Mangal" : "Times New Roman",
    size: 24, // docx uses half-points, 24 = 12pt
  };
}

function isDevanagari(text: string): boolean {
  // Check if text contains Devanagari characters (Unicode range)
  return /[\u0900-\u097F]/.test(text);
}

function createTextRun(
  text: string,
  fontConfig: FontConfig,
  options?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    size?: number;
  }
): TextRun {
  const hasHindi = isDevanagari(text);
  const font = hasHindi ? fontConfig.hindi : fontConfig.english;

  return new TextRun({
    text,
    font,
    size: options?.size || fontConfig.size,
    bold: options?.bold,
    italics: options?.italic,
    underline: options?.underline
      ? { type: UnderlineType.SINGLE }
      : undefined,
  });
}

function parseMarkdownLine(
  line: string,
  fontConfig: FontConfig
): TextRun[] {
  const runs: TextRun[] = [];
  // Handle bold (**text** or __text__)
  // Handle italic (*text* or _text_)
  // Handle mixed content with Hindi and English

  let remaining = line;
  const boldRegex = /\*\*(.+?)\*\*/g;
  const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
  const underlineRegex = /__(.+?)__/g;

  // Simple approach: split by formatting markers
  let lastIndex = 0;
  const segments: { text: string; bold?: boolean; italic?: boolean; underline?: boolean }[] = [];

  // Find all bold segments
  const boldMatches = [...line.matchAll(/\*\*(.+?)\*\*/g)];
  const allMatches: { start: number; end: number; text: string; bold?: boolean; italic?: boolean }[] = [];

  for (const match of boldMatches) {
    allMatches.push({
      start: match.index!,
      end: match.index! + match[0].length,
      text: match[1],
      bold: true,
    });
  }

  // Sort by position
  allMatches.sort((a, b) => a.start - b.start);

  let pos = 0;
  for (const match of allMatches) {
    if (match.start > pos) {
      segments.push({ text: remaining.substring(pos, match.start) });
    }
    segments.push({ text: match.text, bold: match.bold, italic: match.italic });
    pos = match.end;
  }
  if (pos < remaining.length) {
    segments.push({ text: remaining.substring(pos) });
  }

  if (segments.length === 0) {
    segments.push({ text: line });
  }

  for (const seg of segments) {
    if (seg.text) {
      runs.push(createTextRun(seg.text, fontConfig, { bold: seg.bold, italic: seg.italic }));
    }
  }

  return runs;
}

function parseMarkdownTable(
  lines: string[],
  fontConfig: FontConfig
): Table | null {
  if (lines.length < 2) return null;

  const parseRow = (line: string): string[] => {
    return line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell !== "");
  };

  const headerCells = parseRow(lines[0]);
  const dataRows = lines
    .slice(2) // skip header separator
    .filter((l) => l.includes("|") && !l.match(/^[\s|:-]+$/))
    .map(parseRow);

  const allRows = [headerCells, ...dataRows];
  const colCount = Math.max(...allRows.map((r) => r.length));

  const tableRows = allRows.map(
    (row, rowIndex) =>
      new TableRow({
        children: Array.from({ length: colCount }, (_, i) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  createTextRun(row[i] || "", fontConfig, {
                    bold: rowIndex === 0,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: Math.floor(100 / colCount), type: WidthType.PERCENTAGE },
          })
        ),
      })
  );

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

export async function generateDocument(
  ocrContent: { text: string; imagePath: string; imageBuffer?: Buffer | null }[],
  projectName: string,
  subject: string
): Promise<Buffer> {
  const fontConfig = getFontConfig(subject);
  const children: (Paragraph | Table)[] = [];

  for (const page of ocrContent) {
    const lines = page.text.split("\n");

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trimEnd();

      // Skip empty lines
      if (line.trim() === "") {
        children.push(new Paragraph({ children: [] }));
        i++;
        continue;
      }

      // Skip horizontal rules
      if (line.match(/^---+$/)) {
        i++;
        continue;
      }

      // Handle headings
      if (line.startsWith("### ")) {
        children.push(
          new Paragraph({
            children: parseMarkdownLine(line.substring(4), fontConfig),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 240, after: 120 },
          })
        );
        i++;
        continue;
      }

      if (line.startsWith("## ")) {
        children.push(
          new Paragraph({
            children: parseMarkdownLine(line.substring(3), fontConfig),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 360, after: 120 },
          })
        );
        i++;
        continue;
      }

      if (line.startsWith("# ")) {
        children.push(
          new Paragraph({
            children: parseMarkdownLine(line.substring(2), fontConfig),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 480, after: 240 },
          })
        );
        i++;
        continue;
      }

      // Handle tables
      if (line.includes("|") && i + 1 < lines.length && lines[i + 1]?.match(/^[\s|:-]+$/)) {
        const tableLines: string[] = [line];
        let j = i + 1;
        while (j < lines.length && lines[j].includes("|")) {
          tableLines.push(lines[j]);
          j++;
        }
        const table = parseMarkdownTable(tableLines, fontConfig);
        if (table) {
          children.push(table);
          children.push(new Paragraph({ children: [] })); // spacing after table
        }
        i = j;
        continue;
      }

      // Handle image bbox placeholders [IMAGE_BBOX: ymin,xmin,ymax,xmax]
      const bboxMatch = line.match(/\[IMAGE_BBOX:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]/);
      if (bboxMatch) {
        try {
          const pageImageBuffer = page.imageBuffer ?? null;
          if (pageImageBuffer) {
            const ymin = parseInt(bboxMatch[1], 10);
            const xmin = parseInt(bboxMatch[2], 10);
            const ymax = parseInt(bboxMatch[3], 10);
            const xmax = parseInt(bboxMatch[4], 10);

            const image = sharp(pageImageBuffer);
            const metadata = await image.metadata();

            if (metadata.width && metadata.height) {
              // Convert normalized coordinates (0-1000) to actual pixels
              // Add a small 2% padding to the bounding box if possible
              const padding = 20;
              const pxMin = Math.max(0, Math.floor((xmin - padding) * metadata.width / 1000));
              const pyMin = Math.max(0, Math.floor((ymin - padding) * metadata.height / 1000));
              const pxMax = Math.min(metadata.width, Math.ceil((xmax + padding) * metadata.width / 1000));
              const pyMax = Math.min(metadata.height, Math.ceil((ymax + padding) * metadata.height / 1000));

              const extractWidth = pxMax - pxMin;
              const extractHeight = pyMax - pyMin;

              if (extractWidth > 0 && extractHeight > 0) {
                const croppedBuffer = await image
                  .extract({ left: pxMin, top: pyMin, width: extractWidth, height: extractHeight })
                  .toBuffer();

                const ext = path.extname(page.imagePath).toLowerCase().replace(".", "");
                const type = (["jpg", "png", "gif", "bmp"].includes(ext) ? ext : "jpg") as "jpg" | "png" | "gif" | "bmp";

                // Scale down for docx if too large (A4 width is approx 600 points)
                const docWidth = Math.min(500, extractWidth);
                const docHeight = Math.floor(extractHeight * (docWidth / extractWidth));

                children.push(
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: croppedBuffer,
                        type: type,
                        transformation: {
                          width: docWidth,
                          height: docHeight,
                        },
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 120, after: 120 },
                  })
                );
              }
            }
          }
        } catch (err) {
          console.error("Failed to crop/insert image into docx:", err);
        }
        i++;
        continue;
      }

      // Handle old IMAGE placeholders for backward compatibility
      if (line.match(/\[IMAGE:.*\]/)) {
        try {
          const pageImageBuffer = page.imageBuffer ?? null;
          if (pageImageBuffer) {
            const ext = page.imagePath.substring(page.imagePath.lastIndexOf(".")).toLowerCase().replace(".", "");
            const type = (["jpg", "png", "gif", "bmp"].includes(ext) ? ext : "jpg") as "jpg" | "png" | "gif" | "bmp";

            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: pageImageBuffer,
                    type: type,
                    transformation: {
                      width: 500,
                      height: 500,
                    },
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 120 },
              })
            );
          }
        } catch (err) {
          console.error("Failed to insert image into docx:", err);
        }

        children.push(
          new Paragraph({
            children: [
              createTextRun(line, fontConfig, {
                italic: true,
                bold: true,
              }),
            ],
            spacing: { before: 120, after: 120 },
            alignment: AlignmentType.CENTER,
          })
        );
        i++;
        continue;
      }

      // Handle fill-in-the-blanks (lines with multiple underscores)
      if (line.match(/_{5,}/)) {
        children.push(
          new Paragraph({
            children: parseMarkdownLine(line, fontConfig),
            spacing: { before: 60, after: 60 },
          })
        );
        i++;
        continue;
      }

      // Regular paragraph
      children.push(
        new Paragraph({
          children: parseMarkdownLine(line, fontConfig),
          spacing: { before: 60, after: 60 },
        })
      );
      i++;
    }

    // Add page break separator if there are more pages
    if (page !== ocrContent[ocrContent.length - 1]) {
      children.push(new Paragraph({
        children: [createTextRun("---", fontConfig)],
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240 }
      }));
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fontConfig.english,
            size: fontConfig.size,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240, // A4 width in twips
              height: 15840, // A4 height in twips
            },
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  createTextRun(projectName, fontConfig, {
                    size: 18,
                    italic: true,
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
                    children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                    font: fontConfig.english,
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
