import ExcelJS from "exceljs";

interface OCRResult {
  imageId: string;
  text: string;
  success: boolean;
  error?: string;
}

export async function generateExcel(
  results: OCRResult[],
  projectName: string,
  subject: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(projectName || "Sheet1");

  worksheet.columns = [
    { header: "No.", key: "no", width: 5 },
    { header: "Text", key: "text", width: 100 },
    { header: "Status", key: "status", width: 15 },
  ];

  // Make header bold
  worksheet.getRow(1).font = { bold: true };

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    
    worksheet.addRow({
      no: i + 1,
      text: result.text || "",
      status: result.success ? "Success" : "Failed",
    });

    // Make the text cell wrap
    const row = worksheet.getRow(i + 2);
    row.getCell("text").alignment = { wrapText: true, vertical: "top" };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
