/**
 * pdfGenerator.ts
 *
 * AUTO-CENTER COORDINATE CONTRACT
 * ─────────────────────────────────────────────────────────────────────────────
 * When TextField.autoCenter is true, field.x is the HORIZONTAL CENTER ANCHOR
 * in PDF points.
 *
 * Screen (DraggableTextField):
 *   position: absolute; left: field.x(px); transform: translateX(-50%)
 *   → visual centre of the div sits exactly at field.x px.
 *
 * PDF (here):
 *   totalWidth = font.widthOfTextAtSize(text, size) + letterSpacing * (chars-1)
 *   drawX = field.x - totalWidth / 2
 *   → pdf-lib draws from left edge; shifting by half total width centres it.
 *
 * letterSpacing is included because it visually widens the text and must be
 * accounted for to match what the browser renders.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TextField } from '@/types/certificate';
import type { QRCodeFieldData } from '@/components/documentMaker/QRCodeField';

export interface PDFPageInfo  { width: number; height: number; }
export interface PDFTemplateInfo { pageCount: number; pages: PDFPageInfo[]; }

export async function loadPDFTemplate(buffer: ArrayBuffer): Promise<{ info: PDFTemplateInfo }> {
  const pdfDoc = await PDFDocument.load(buffer);
  const pages  = pdfDoc.getPages().map((p) => {
    const { width, height } = p.getSize();
    return { width, height };
  });
  return { info: { pageCount: pages.length, pages } };
}

export function pdfBytesToBlobUrl(bytes: Uint8Array): string {
  const blob = new Blob([new Uint8Array(bytes).buffer], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

async function qrToPngBytes(value: string, sizePts: number): Promise<Uint8Array> {
  const QRCode     = (await import('qrcode')).default;
  const renderSize = Math.round(sizePts * 2);
  return new Promise((resolve, reject) => {
    const canvas  = document.createElement('canvas');
    canvas.width  = renderSize;
    canvas.height = renderSize;
    QRCode.toCanvas(canvas, value, {
      width: renderSize, margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(() => canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('toBlob failed'));
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
      }, 'image/png'))
      .catch(reject);
  });
}

export async function generatePDF(
  templateBytes: ArrayBuffer,
  fields:        TextField[],
  qrField?:      QRCodeFieldData | null,
  bcertNumber?:  string | null,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages  = pdfDoc.getPages();

  const fontCache: Record<string, any> = {};
  const getFont = async (name: string) => {
    if (fontCache[name]) return fontCache[name];
    let std = StandardFonts.Helvetica;
    if (name === 'TimesRoman') std = StandardFonts.TimesRoman;
    if (name === 'Courier')    std = StandardFonts.Courier;
    const font = await pdfDoc.embedFont(std);
    fontCache[name] = font;
    return font;
  };

  for (const field of fields) {
    if (field.hidden) continue;
    const page = pages[field.page];
    if (!page) continue;

    const { height } = page.getSize();
    const font        = await getFont(field.fontFamily ?? 'Helvetica');
    const fontSize    = field.fontSize ?? 12;
    const text        = String(field.value ?? '');
    const ls          = field.letterSpacing ?? 0; // pts of extra spacing per char gap

    const hex = (field.color ?? '#000000').replace('#', '');
    const r   = parseInt(hex.slice(0, 2), 16) / 255;
    const g   = parseInt(hex.slice(2, 4), 16) / 255;
    const b   = parseInt(hex.slice(4, 6), 16) / 255;

    let drawX = field.x;

    if (field.autoCenter && text.length > 0) {
      try {
        // Base glyph width from the font
        const glyphWidth = font.widthOfTextAtSize(text, fontSize);
        // Letter spacing adds (charCount - 1) extra gaps between characters
        // browser CSS letter-spacing applies after each character except last
        const spacingExtra = ls * Math.max(0, text.length - 1);
        const totalWidth   = glyphWidth + spacingExtra;
        drawX = field.x - totalWidth / 2;
      } catch {
        drawX = field.x; // graceful fallback
      }
    }

    // field.y = top-of-text in PDF points (down-positive / top-left origin).
    // pdf-lib draws from baseline with bottom-left origin, so:
    const pdfY = height - field.y - fontSize;

    page.drawText(text, {
      x:            drawX,
      y:            pdfY,
      size:         fontSize,
      font,
      color:        rgb(r, g, b),
      opacity:      field.opacity ?? 1,
      // pdf-lib's characterSpacing is in PDF points — same unit as our letterSpacing
      ...(ls > 0 ? { characterSpacing: ls } : {}),
    });
  }

  if (qrField?.visible && bcertNumber) {
    const targetPage = pages[qrField.page];
    if (targetPage) {
      const { height } = targetPage.getSize();
      const pngBytes   = await qrToPngBytes(bcertNumber, qrField.size);
      const pngImage   = await pdfDoc.embedPng(pngBytes);
      targetPage.drawImage(pngImage, {
        x:      qrField.x,
        y:      height - qrField.y - qrField.size,
        width:  qrField.size,
        height: qrField.size,
      });
    }
  }

  return pdfDoc.save();
}