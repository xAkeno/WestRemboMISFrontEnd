import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { TextField, PDFTemplateInfo } from '@/types/certificate';

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

function getFontKey(family: TextField['fontFamily'], weight: string, style: string): keyof typeof StandardFonts {
  const map: Record<string, keyof typeof StandardFonts> = {
    'Helvetica-normal-normal': 'Helvetica',
    'Helvetica-bold-normal': 'HelveticaBold',
    'Helvetica-normal-italic': 'HelveticaOblique',
    'Helvetica-bold-italic': 'HelveticaBoldOblique',
    'TimesRoman-normal-normal': 'TimesRoman',
    'TimesRoman-bold-normal': 'TimesRomanBold',
    'TimesRoman-normal-italic': 'TimesRomanItalic',
    'TimesRoman-bold-italic': 'TimesRomanBoldItalic',
    'Courier-normal-normal': 'Courier',
    'Courier-bold-normal': 'CourierBold',
    'Courier-normal-italic': 'CourierOblique',
    'Courier-bold-italic': 'CourierBoldOblique',
  };
  return map[`${family}-${weight}-${style}`] || 'Helvetica';
}

export async function loadPDFTemplate(data: ArrayBuffer): Promise<{ doc: PDFDocument; info: PDFTemplateInfo }> {
  const doc = await PDFDocument.load(data);
  const pages = doc.getPages();
  const info: PDFTemplateInfo = {
    pageCount: pages.length,
    pages: pages.map((p) => ({ width: p.getWidth(), height: p.getHeight() })),
  };
  return { doc, info };
}

export async function generatePDF(templateBytes: ArrayBuffer, fields: TextField[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(templateBytes);
  const pages = doc.getPages();

  // Group fonts needed
  const fontCache = new Map<string, Awaited<ReturnType<PDFDocument['embedFont']>>>();

  for (const field of fields) {
    if (!field.value.trim()) continue;
    const page = pages[field.page];
    if (!page) continue;

    const fontKey = getFontKey(field.fontFamily, field.fontWeight, field.fontStyle);
    if (!fontCache.has(fontKey)) {
      fontCache.set(fontKey, await doc.embedFont(StandardFonts[fontKey]));
    }
    const font = fontCache.get(fontKey)!;
    const pageHeight = page.getHeight();

    // PDF coordinate system: origin is bottom-left. Our UI y is from top.
    const pdfY = pageHeight - field.y - field.fontSize;

    page.drawText(field.value, {
      x: field.x,
      y: pdfY,
      size: field.fontSize,
      font,
      color: hexToRgb(field.color),
      opacity: field.opacity,
    });
  }

  return doc.save();
}

export function pdfBytesToBlobUrl(bytes: Uint8Array): string {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
