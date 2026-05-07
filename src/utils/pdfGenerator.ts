import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TextField } from '@/types/certificate';
import type { QRCodeFieldData } from '@/components/documentMaker/QRCodeField';

export interface PDFPageInfo     { width: number; height: number; }
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

// ─── HMAC-SHA256 signing (Web Crypto API) ─────────────────────────────────────
async function signRef(ref: string): Promise<string> {
  const secret = import.meta.env.VITE_QR_SECRET_KEY ?? 'fallback-secret';
  const enc    = new TextEncoder();
  const key    = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(ref));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── QR → PNG bytes ───────────────────────────────────────────────────────────
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

// ─── Add label text below QR image ───────────────────────────────────────────
async function addTextToQRImage(
  qrBytes: Uint8Array,
  sizePts: number,
  totalWidthPts: number,
  totalHeightPts: number,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    // Render at 2× for sharpness
    const scale      = 2;
    const qrPx       = Math.round(sizePts * scale);
    const totalWPx   = Math.round(totalWidthPts * scale);
    const totalHPx   = Math.round(totalHeightPts * scale);
    const textPanelW = totalWPx - qrPx;

    const blob = new Blob([qrBytes], { type: 'image/png' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();

    img.onload = () => {
      const canvas  = document.createElement('canvas');
      canvas.width  = totalWPx;
      canvas.height = totalHPx;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context'));

      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ── Left: QR image stretched to fill qrPx × totalHPx ────────────────
      ctx.drawImage(img, 0, 0, qrPx, totalHPx);

      // Divider
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(qrPx + 2, 12);
      ctx.lineTo(qrPx + 2, totalHPx - 12);
      ctx.stroke();

      // ── Right: instruction text panel ────────────────────────────────────
      const textX    = qrPx + 14;
      const maxTextW = textPanelW - 20;

      // Title
      const titleSize = Math.max(14, Math.round(totalHPx * 0.09));
      ctx.fillStyle    = '#1e3a5f';
      ctx.font         = `bold ${titleSize}px Arial`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('VERIFY', textX, Math.round(totalHPx * 0.07));

      const subtitleSize = Math.max(12, Math.round(totalHPx * 0.08));
      ctx.fillStyle = '#1e40af';
      ctx.font      = `bold ${subtitleSize}px Arial`;
      ctx.fillText('DOCUMENT', textX, Math.round(totalHPx * 0.18));

      // Underline
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth   = 2;
      const underlineY = Math.round(totalHPx * 0.30);
      ctx.beginPath();
      ctx.moveTo(textX, underlineY);
      ctx.lineTo(textX + Math.min(maxTextW, textPanelW - 16), underlineY);
      ctx.stroke();

      // Body text — word-wrap manually
      const bodySize = Math.max(10, Math.round(totalHPx * 0.07));
      ctx.fillStyle  = '#374151';
      ctx.font       = `${bodySize}px Arial`;

      const fullText = 'This document is authenticated by the Barangay. Scan the QR code to verify its authenticity online.';
      const words    = fullText.split(' ');
      const lines: string[] = [];
      let current = '';

      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxTextW && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);

      let lineY = Math.round(totalHPx * 0.36);
      const lineH = bodySize + 5;
      for (const line of lines) {
        if (lineY + lineH > totalHPx - 8) break;
        ctx.fillText(line, textX, lineY);
        lineY += lineH;
      }

      canvas.toBlob((canvasBlob) => {
        if (!canvasBlob) return reject(new Error('toBlob failed'));
        canvasBlob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
      }, 'image/png');

      URL.revokeObjectURL(url);
    };

    img.onerror = () => reject(new Error('Failed to load QR image'));
    img.src = url;
  });
}

// ─── Main PDF generator ───────────────────────────────────────────────────────
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
    const ls          = field.letterSpacing ?? 0;

    const hex = (field.color ?? '#000000').replace('#', '');
    const r   = parseInt(hex.slice(0, 2), 16) / 255;
    const g   = parseInt(hex.slice(2, 4), 16) / 255;
    const b   = parseInt(hex.slice(4, 6), 16) / 255;

    let drawX = field.x;
    if (field.autoCenter && text.length > 0) {
      try {
        const glyphWidth   = font.widthOfTextAtSize(text, fontSize);
        const spacingExtra = ls * Math.max(0, text.length - 1);
        drawX = field.x - (glyphWidth + spacingExtra) / 2;
      } catch {
        drawX = field.x;
      }
    }

    const pdfY = height - field.y - fontSize;
    page.drawText(text, {
      x:       drawX,
      y:       pdfY,
      size:    fontSize,
      font,
      color:   rgb(r, g, b),
      opacity: field.opacity ?? 1,
      ...(ls > 0 ? { characterSpacing: ls } : {}),
    });
  }

  // ── Embed signed QR into PDF ──────────────────────────────────────────────
  if (qrField?.visible && bcertNumber) {
    const targetPage = pages[qrField.page];
    if (targetPage) {
      const { height } = targetPage.getSize();
      const baseUrl    = 'http://localhost:8000';

      const sig     = await signRef(bcertNumber);
      const qrValue = `${baseUrl}/verify/${bcertNumber}?key=${sig}`;

      // Use explicit width/height if set, otherwise default to square + equal panel
      const qrSize       = qrField.size;
      const totalW       = qrField.width  ?? qrSize * 2;
      const totalH       = qrField.height ?? qrSize;

      let pngBytes = await qrToPngBytes(qrValue, qrSize);
      pngBytes     = await addTextToQRImage(pngBytes, qrSize, totalW, totalH);

      const pngImage = await pdfDoc.embedPng(pngBytes);

      targetPage.drawImage(pngImage, {
        x:      qrField.x,
        y:      height - qrField.y - totalH,
        width:  totalW,
        height: totalH,
      });
    }
  }

  return pdfDoc.save();
}