/**
 * pdfGenerator.ts
 *
 * Drop-in replacement — adds optional QR code embedding.
 * Everything else (loadPDFTemplate, pdfBytesToBlobUrl) is unchanged.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TextField } from '@/types/certificate';
import type { QRCodeFieldData } from '@/components/documentMaker/QRCodeField';

// ─── Public types (re-exported so nothing else needs to change) ───────────────

export interface PDFPageInfo {
  width: number;
  height: number;
}

export interface PDFTemplateInfo {
  pageCount: number;
  pages: PDFPageInfo[];
}

// ─── Load template ────────────────────────────────────────────────────────────

export async function loadPDFTemplate(
  buffer: ArrayBuffer
): Promise<{ info: PDFTemplateInfo }> {
  const pdfDoc = await PDFDocument.load(buffer);
  const pages = pdfDoc.getPages().map((p) => {
    const { width, height } = p.getSize();
    return { width, height };
  });
  return { info: { pageCount: pages.length, pages } };
}

// ─── Blob URL helper ──────────────────────────────────────────────────────────

export function pdfBytesToBlobUrl(bytes: Uint8Array): string {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

// ─── QR PNG helper ────────────────────────────────────────────────────────────

/**
 * Renders a QR code string into a PNG Uint8Array using an off-screen canvas.
 * Requires the `qrcode` package (already installed for the overlay component).
 */
async function qrToPngBytes(value: string, size: number): Promise<Uint8Array> {
  const QRCode = (await import('qrcode')).default;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(() => {
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('QR canvas toBlob failed'));
          blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
        }, 'image/png');
      })
      .catch(reject);
  });
}

// ─── Main: generate PDF ───────────────────────────────────────────────────────

/**
 * @param templateBytes  Original PDF buffer
 * @param fields         Text overlay fields
 * @param qrField        Optional QR position/size data (from state)
 * @param bcertNumber    The string to encode in the QR
 */
export async function generatePDF(
  templateBytes: ArrayBuffer,
  fields: TextField[],
  qrField?: QRCodeFieldData | null,
  bcertNumber?: string | null
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages  = pdfDoc.getPages();

  // Font map — extend as needed
  const fontCache: Record<string, any> = {};
  const getFont = async (name: string) => {
    if (fontCache[name]) return fontCache[name];
    let stdFont = StandardFonts.Helvetica;
    if (name === 'TimesRoman')  stdFont = StandardFonts.TimesRoman;
    if (name === 'Courier')     stdFont = StandardFonts.Courier;
    const font = await pdfDoc.embedFont(stdFont);
    fontCache[name] = font;
    return font;
  };

  // ── Draw text fields ────────────────────────────────────────────────────────
  for (const field of fields) {
    if (field.hidden) continue;
    const page = pages[field.page];
    if (!page) continue;

    const { width, height } = page.getSize();
    const font = await getFont(field.fontFamily ?? 'Helvetica');

    // Parse hex color → rgb(0-1)
    const hex = (field.color ?? '#000000').replace('#', '');
    const r   = parseInt(hex.slice(0, 2), 16) / 255;
    const g   = parseInt(hex.slice(2, 4), 16) / 255;
    const b   = parseInt(hex.slice(4, 6), 16) / 255;

    // DOM coordinate system has y=0 at top; PDF has y=0 at bottom
    const pdfY = height - field.y - (field.fontSize ?? 12);

    page.drawText(String(field.value ?? ''), {
      x:        field.x,
      y:        pdfY,
      size:     field.fontSize ?? 12,
      font,
      color:    rgb(r, g, b),
      opacity:  field.opacity ?? 1,
    });
  }

  // ── Embed QR code ───────────────────────────────────────────────────────────
  if (qrField?.visible && bcertNumber) {
    const targetPage = pages[qrField.page];
    if (targetPage) {
      const { width, height } = targetPage.getSize();

      // qrField.x / y are percentages of the preview container.
      // The preview container matches the PDF page dimensions at scale=1,
      // so converting % → pts is straightforward.
      const pxX    = (qrField.x / 100) * width;
      const pxY    = (qrField.y / 100) * height;
      const pxSize = qrField.size; // already in px == pts at scale 1

      // Rasterize QR → PNG
      const pngBytes = await qrToPngBytes(bcertNumber, Math.round(pxSize * 2)); // 2× for crisp print
      const pngImage = await pdfDoc.embedPng(pngBytes);

      // PDF y-axis is flipped vs DOM
      const pdfY = height - pxY - pxSize;

      targetPage.drawImage(pngImage, {
        x:      pxX,
        y:      pdfY,
        width:  pxSize,
        height: pxSize,
      });
    }
  }

  return pdfDoc.save();
}