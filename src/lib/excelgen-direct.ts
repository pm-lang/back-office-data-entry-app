import ExcelJS from "exceljs";

export async function generateExcelDirect(
  imageEntries: { imagePath: string; imageBuffer: Buffer }[],
  projectName: string,
  subject: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(projectName || "Sheet1");

  worksheet.columns = [
    { header: "No.", key: "no", width: 5 },
    { header: "Image", key: "image", width: 40 },
  ];

  let currentRow = 2; // Row 1 is header

  for (let i = 0; i < imageEntries.length; i++) {
    const entry = imageEntries[i];
    
    // Add text data
    worksheet.getCell(`A${currentRow}`).value = i + 1;
    
    // Set row height to fit image
    worksheet.getRow(currentRow).height = 150;

    // Add image
    const imageId = workbook.addImage({
      buffer: entry.imageBuffer as any,
      extension: "png",
    });

    worksheet.addImage(imageId, {
      tl: { col: 1, row: currentRow - 1 },
      ext: { width: 250, height: 180 },
    });

    currentRow++;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as any);
}
