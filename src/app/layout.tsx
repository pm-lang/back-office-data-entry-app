import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorksheetAI — Scan & Convert Worksheets to Word",
  description:
    "Scan handwritten Hindi, Maths, English and Science worksheets and convert them to editable Word documents using AI-powered OCR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
