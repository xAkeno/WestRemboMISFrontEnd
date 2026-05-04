/**
 * QRCodeField.tsx
 *
 * Draggable QR code overlay for CertificateEditor.
 *
 * COORDINATE SYSTEM
 * ─────────────────────────────────────────────────────────────────────────────
 * QRCodeFieldData.x / y / size are stored in PDF POINTS — the same unit used
 * by TextField.x and TextField.y. This means:
 *
 *   • Saving the layout just serialises the raw pts values — no conversion.
 *   • Restoring the layout just deserialises them — no conversion.
 *   • pdfGenerator.ts embeds the QR directly with those values — no conversion.
 *   • The screen overlay converts pts → DOM pixels on the fly using the live
 *     scale factor  (pageRect.width / pageWidth).
 *
 * This is identical to how text fields work and keeps all three operations
 * (drag, save, PDF embed) in sync regardless of zoom level.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Move } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QRCodeFieldData {
  /** Distance from the LEFT edge of the page, in PDF points. */
  x: number;
  /** Distance from the TOP edge of the page, in PDF points. */
  y: number;
  /** Side length of the square QR code, in PDF points. */
  size: number;
  /** Zero-based page index the QR belongs to. */
  page: number;
  /** Whether the QR overlay is visible / active. */
  visible: boolean;
}

interface QRCodeFieldProps {
  bcertNumber: string | undefined | null;
  field: QRCodeFieldData;
  onChange: (updates: Partial<QRCodeFieldData>) => void;
  onRemove: () => void;
  /** Ref to the PDF preview container div (kept for legacy; prefer pageRef). */
  containerRef: React.RefObject<HTMLDivElement>;
  /**
   * Ref to the actual rendered PDF surface element — the div that is sized to
   * exactly pageWidth × pageHeight CSS pixels (after max-width/max-height
   * clamping). Using this instead of containerRef makes getBoundingClientRect()
   * return the true PDF origin and dimensions, so drag/resize coordinate math
   * is always correct regardless of surrounding padding or scroll position.
   */
  pageRef: React.RefObject<HTMLElement | null>;
  isSelected: boolean;
  onSelect: () => void;
  /** Width of the PDF page in points (from templateInfo). */
  pageWidth: number;
  /** Height of the PDF page in points (from templateInfo). */
  pageHeight: number;
}

// ─── QR Canvas ───────────────────────────────────────────────────────────────

function QRCanvas({ value, size }: { value: string; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    
    // Generate full verification URL for QR code
    const baseUrl = import.meta.env.VITE_VERIFY_URL || 'http://localhost:8000';
    const verifyUrl = `${baseUrl}/verify/${value}`;
    
    // Create QR code with custom authentication message
    // When scanned, it shows: "This QR/Document is Authenticated" + the link
    const qrMessage = `This QR/Document is Authenticated\n\nFor further details, follow this link:\n${verifyUrl}`;
    
    QRCode.toCanvas(canvasRef.current, qrMessage, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H', // Use 'H' (high) error correction for text readability
    }).catch(console.error);
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', borderRadius: 2 }}
    />
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function QRCodeField({
  bcertNumber,
  field,
  onChange,
  onRemove,
  containerRef,
  pageRef,
  isSelected,
  onSelect,
  pageWidth,
  pageHeight,
}: QRCodeFieldProps) {
  const fieldRef    = useRef<HTMLDivElement>(null);
  const isDragging  = useRef(false);
  const isResizing  = useRef(false);
  const dragStart   = useRef({ mouseX: 0, mouseY: 0, fieldX: 0, fieldY: 0 });
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, size: 0 });

  // ── Scale helpers ────────────────────────────────────────────────────────────

  /**
   * Returns the current DOM rect of the PDF page surface.
   *
   * pageRef targets the wrapper div that is sized to the PDF page dimensions,
   * so its bounding rect gives us the true rendered width/height of the page —
   * not the outer scroll container with padding around it.  This is the rect
   * we divide by pageWidth/pageHeight to get the correct scale factor.
   *
   * Falls back to containerRef if pageRef is not yet attached (e.g. during
   * the very first render before the ref callback fires).
   */
  const getPageRect = useCallback(() => {
    return (
      pageRef.current?.getBoundingClientRect() ??
      containerRef.current?.getBoundingClientRect()
    );
  }, [pageRef, containerRef]);

  /**
   * Scale factor: DOM pixels per PDF point.
   *   sx = renderedPageWidth  / pageWidthPts
   *   sy = renderedPageHeight / pageHeightPts
   *
   * We prefer sx for the square QR so it is consistent with the X axis.
   */
  const getScale = useCallback(() => {
    const r = getPageRect();
    if (!r || !pageWidth || !pageHeight) return { sx: 1, sy: 1 };
    return {
      sx: r.width  / pageWidth,
      sy: r.height / pageHeight,
    };
  }, [getPageRect, pageWidth, pageHeight]);

  // ── Convert pts → DOM px for display ────────────────────────────────────────
  const toDisplay = useCallback(() => {
    const { sx, sy } = getScale();
    return {
      left: field.x    * sx,
      top:  field.y    * sy,
      size: field.size * sx,   // use X scale for square
    };
  }, [field.x, field.y, field.size, getScale]);

  // ── Drag ─────────────────────────────────────────────────────────────────────
  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    isDragging.current = true;
    dragStart.current  = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      fieldX: field.x,
      fieldY: field.y,
    };

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const { sx, sy } = getScale();

      // Mouse delta in DOM pixels → convert to PDF points
      const dxPts = (ev.clientX - dragStart.current.mouseX) / sx;
      const dyPts = (ev.clientY - dragStart.current.mouseY) / sy;

      // Clamp within page bounds (in pts)
      const newX = Math.max(0, Math.min(dragStart.current.fieldX + dxPts, pageWidth  - field.size));
      const newY = Math.max(0, Math.min(dragStart.current.fieldY + dyPts, pageHeight - field.size));

      onChange({ x: newX, y: newY });
    };

    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [field, onChange, onSelect, getScale, pageWidth, pageHeight]);

  // ── Resize ───────────────────────────────────────────────────────────────────
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    isResizing.current  = true;
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, size: field.size };

    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const { sx } = getScale();

      // Diagonal drag delta in DOM pixels → convert to PDF points
      const dxPx  = ev.clientX - resizeStart.current.mouseX;
      const dyPx  = ev.clientY - resizeStart.current.mouseY;
      const delta = (Math.abs(dxPx) > Math.abs(dyPx) ? dxPx : dyPy) / sx;

      // Min 36 pts (~0.5 inch), max 200 pts (~2.8 inch)
      const newSizePts = Math.max(36, Math.min(200, resizeStart.current.size + delta));
      onChange({ size: newSizePts });
    };

    const onUp = () => {
      isResizing.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [field.size, onChange, getScale]);

  if (!field.visible || !bcertNumber) return null;

  const { left, top, size: displaySize } = toDisplay();

  return (
    <div
      ref={fieldRef}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{
        position:   'absolute',
        left,
        top,
        width:      displaySize,
        height:     displaySize,
        zIndex:     isSelected ? 50 : 30,
        cursor:     'move',
        userSelect: 'none',
      }}
    >
      {/* Selection ring */}
      <div style={{
        position:      'absolute',
        inset:         isSelected ? -3 : 0,
        borderRadius:  6,
        border:        isSelected ? '2px dashed #3b82f6' : '1px solid transparent',
        boxShadow:     isSelected ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
        transition:    'all 0.12s ease',
        pointerEvents: 'none',
      }} />

      {/* Drag handle — top bar (only when selected) */}
      <div
        onMouseDown={handleDragMouseDown}
        style={{
          position:       'absolute',
          top:            isSelected ? -22 : 0,
          left:           0,
          right:          0,
          height:         isSelected ? 20 : '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            4,
          background:     isSelected ? '#3b82f6' : 'transparent',
          borderRadius:   isSelected ? '4px 4px 0 0' : 0,
          cursor:         'grab',
          zIndex:         10,
          opacity:        isSelected ? 1 : 0,
          transition:     'opacity 0.15s',
        }}
        title="Drag to reposition"
      >
        {isSelected && (
          <>
            <Move style={{ width: 10, height: 10, color: '#fff' }} />
            <span style={{ fontSize: 9, color: '#fff', fontWeight: 600, letterSpacing: '0.05em' }}>
              DRAG
            </span>
          </>
        )}
      </div>

      {/* Invisible full-surface drag target when NOT showing the top bar */}
      {!isSelected && (
        <div
          onMouseDown={handleDragMouseDown}
          style={{
            position: 'absolute',
            inset:    0,
            zIndex:   5,
            cursor:   'move',
          }}
        />
      )}

      {/* QR canvas */}
      <div style={{
        width:        '100%',
        height:       '100%',
        background:   '#fff',
        borderRadius: 4,
        overflow:     'hidden',
        boxShadow:    isSelected
          ? '0 4px 20px rgba(0,0,0,0.15)'
          : '0 1px 6px rgba(0,0,0,0.12)',
        transition:   'box-shadow 0.15s',
      }}>
        {/* Render at 2× display size for crispness, CSS scales it back down */}
        <QRCanvas value={bcertNumber} size={Math.round(displaySize * 2)} />
      </div>

      {/* bcert label under QR when selected */}
      {isSelected && (
        <div style={{
          position:      'absolute',
          bottom:        -20,
          left:          0,
          right:         0,
          textAlign:     'center',
          fontSize:      9,
          fontWeight:    700,
          color:         '#6b7280',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace:    'nowrap',
        }}>
          {bcertNumber}
        </div>
      )}

      {/* Controls — only when selected */}
      {isSelected && (
        <>
          {/* Remove button */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              position:       'absolute',
              top:            -22,
              right:          -1,
              width:          20,
              height:         20,
              background:     '#ef4444',
              border:         'none',
              borderRadius:   '0 4px 0 0',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              padding:        0,
            }}
            title="Remove QR code"
          >
            <X style={{ width: 10, height: 10, color: '#fff' }} />
          </button>

          {/* Resize handle — bottom-right */}
          <div
            onMouseDown={handleResizeMouseDown}
            style={{
              position:       'absolute',
              bottom:         -6,
              right:          -6,
              width:          16,
              height:         16,
              background:     '#3b82f6',
              borderRadius:   '0 0 4px 0',
              cursor:         'nwse-resize',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              zIndex:         20,
            }}
            title="Drag to resize"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
              <path d="M1 7L7 1M4 7L7 4M7 7L7 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Toolbar Button ──────────────────────────────────────────────────────────

interface QRToolbarButtonProps {
  bcertNumber: string | undefined | null;
  qrField: QRCodeFieldData | null;
  onToggle: () => void;
}

export function QRToolbarButton({ bcertNumber, qrField, onToggle }: QRToolbarButtonProps) {
  const hasQR = qrField?.visible;

  return (
    <button
      onClick={onToggle}
      disabled={!bcertNumber}
      title={
        bcertNumber
          ? hasQR ? 'Remove QR code from canvas' : 'Add draggable QR code to certificate'
          : 'No BCert number available'
      }
      style={{
        display:     'inline-flex',
        alignItems:  'center',
        gap:         6,
        height:      32,
        padding:     '0 12px',
        borderRadius: 6,
        border:      hasQR ? '1px solid #3b82f6' : '1px solid hsl(var(--border))',
        background:  hasQR ? '#eff6ff' : 'hsl(var(--card))',
        color:       hasQR ? '#1d4ed8' : 'hsl(var(--muted-foreground))',
        fontSize:    12,
        fontWeight:  600,
        cursor:      bcertNumber ? 'pointer' : 'not-allowed',
        opacity:     bcertNumber ? 1 : 0.4,
        transition:  'all 0.15s',
        whiteSpace:  'nowrap',
      }}
    >
      <QrCode style={{ width: 14, height: 14 }} />
      {hasQR ? 'QR Added ✓' : 'Add QR Code'}
    </button>
  );
}