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

import { useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Move } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QRCodeFieldData {
  /** Distance from the LEFT edge of the page, in PDF points. */
  x: number;
  /** Distance from the TOP edge of the page, in PDF points. */
  y: number;
  /** Side length of the QR code square, in PDF points. */
  size: number;
  /** Total width including instruction panel (pts). Defaults to size * 2. */
  width?: number;
  /** Total height (pts). Defaults to size. */
  height?: number;
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

    const baseUrl   = import.meta.env.VITE_VERIFY_URL || 'http://localhost:8000';
    const verifyUrl = `${baseUrl}/verify/${value}`;
    const qrMessage = `This QR/Document is Authenticated\n\nFor further details, follow this link:\n${verifyUrl}`;

    QRCode.toCanvas(canvasRef.current, qrMessage, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
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
  const fieldRef   = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart  = useRef({ mouseX: 0, mouseY: 0, fieldX: 0, fieldY: 0 });

  // ── Derived dimensions ────────────────────────────────────────────────────
  const totalWPts = field.width  ?? field.size * 2;
  const totalHPts = field.height ?? field.size;

  // ── Scale helpers ─────────────────────────────────────────────────────────

  const getPageRect = useCallback(() => {
    return (
      pageRef.current?.getBoundingClientRect() ??
      containerRef.current?.getBoundingClientRect()
    );
  }, [pageRef, containerRef]);

  const getScale = useCallback(() => {
    const r = getPageRect();
    if (!r || !pageWidth || !pageHeight) return { sx: 1, sy: 1 };
    return {
      sx: r.width  / pageWidth,
      sy: r.height / pageHeight,
    };
  }, [getPageRect, pageWidth, pageHeight]);

  // ── Convert pts → DOM px for display ─────────────────────────────────────
  const toDisplay = useCallback(() => {
    const { sx, sy } = getScale();
    return {
      left:        field.x    * sx,
      top:         field.y    * sy,
      displayW:    totalWPts  * sx,
      displayH:    totalHPts  * sy,
      displayQrSz: field.size * sx,
    };
  }, [field.x, field.y, field.size, totalWPts, totalHPts, getScale]);

  // ── Drag ──────────────────────────────────────────────────────────────────
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
      const dxPts = (ev.clientX - dragStart.current.mouseX) / sx;
      const dyPts = (ev.clientY - dragStart.current.mouseY) / sy;
      const newX  = Math.max(0, Math.min(dragStart.current.fieldX + dxPts, pageWidth  - totalWPts));
      const newY  = Math.max(0, Math.min(dragStart.current.fieldY + dyPts, pageHeight - totalHPts));
      onChange({ x: newX, y: newY });
    };

    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [field.x, field.y, onChange, onSelect, getScale, pageWidth, pageHeight, totalWPts, totalHPts]);

  // ── Resize: QR size (bottom-left handle) ─────────────────────────────────
  const handleResizeSizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startY    = e.clientY;
    const startSize = field.size;

    const onMove = (ev: MouseEvent) => {
      const { sy } = getScale();
      const dyPts  = (ev.clientY - startY) / sy;
      const newSize = Math.max(30, Math.min(200, startSize + dyPts));
      onChange({ size: newSize });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [field.size, onChange, getScale]);

  // ── Resize: total height (bottom-right handle) ────────────────────────────
  const handleResizeHeightMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startH = totalHPts;

    const onMove = (ev: MouseEvent) => {
      const { sy } = getScale();
      const dyPts  = (ev.clientY - startY) / sy;
      onChange({ height: Math.max(30, Math.min(400, startH + dyPts)) });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [totalHPts, onChange, getScale]);

  // ── Resize: total width / instruction panel (right-edge handle) ───────────
  const handleResizeWidthMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startW = totalWPts;

    const onMove = (ev: MouseEvent) => {
      const { sx } = getScale();
      const dxPts  = (ev.clientX - startX) / sx;
      // Minimum width = QR size + 20pts for the text panel
      onChange({ width: Math.max(field.size + 20, Math.min(600, startW + dxPts)) });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [totalWPts, field.size, onChange, getScale]);

  if (!field.visible || !bcertNumber) return null;

  const { left, top, displayW, displayH, displayQrSz } = toDisplay();

  return (
    <div
      ref={fieldRef}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{
        position:   'absolute',
        left,
        top,
        width:      displayW,
        height:     displayH,
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

      {/* Invisible full-surface drag target when NOT selected */}
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

      {/* Main content: QR on left, instruction panel on right */}
      <div style={{
        width:        '100%',
        height:       '100%',
        background:   '#fff',
        borderRadius: 4,
        overflow:     'hidden',
        display:      'flex',
        flexDirection: 'row',
        boxShadow:    isSelected
          ? '0 4px 20px rgba(0,0,0,0.15)'
          : '0 1px 6px rgba(0,0,0,0.12)',
        transition:   'box-shadow 0.15s',
      }}>
        {/* Left: QR code */}
        <div style={{
          width:    displayQrSz,
          height:   '100%',
          flexShrink: 0,
          overflow: 'hidden',
          display:  'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
        }}>
          <QRCanvas value={bcertNumber} size={Math.round(displayQrSz * 2)} />
        </div>

        {/* Divider */}
        <div style={{
          width:      1,
          background: '#e5e7eb',
          flexShrink: 0,
          margin:     '6px 0',
        }} />

        {/* Right: instruction text */}
        <div style={{
          flex:       1,
          padding:    '6px 8px',
          display:    'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap:        3,
          overflow:   'hidden',
          minWidth:   0,
        }}>
          <div style={{
            fontSize:    Math.max(7, displayH * 0.09),
            fontWeight:  800,
            color:       '#1e3a5f',
            lineHeight:  1.1,
            letterSpacing: '0.04em',
          }}>
            VERIFY
          </div>
          <div style={{
            fontSize:    Math.max(6, displayH * 0.08),
            fontWeight:  700,
            color:       '#1e40af',
            lineHeight:  1.1,
            borderBottom: '1px solid #1e40af',
            paddingBottom: 3,
            marginBottom: 2,
          }}>
            DOCUMENT
          </div>
          <div style={{
            fontSize:   Math.max(5.5, displayH * 0.07),
            color:      '#374151',
            lineHeight: 1.35,
            overflow:   'hidden',
          }}>
            This document is authenticated by the Barangay. Scan the QR code to verify its authenticity online.
          </div>
        </div>
      </div>

      {/* bcert label under the box when selected */}
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

          {/* ── Resize handle: QR size — bottom-left (blue) ── */}
          <div
            onMouseDown={handleResizeSizeMouseDown}
            title="Drag to resize QR size"
            style={{
              position:       'absolute',
              bottom:         -6,
              left:           -6,
              width:          16,
              height:         16,
              background:     '#3b82f6',
              borderRadius:   '0 0 0 4px',
              cursor:         'nesw-resize',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              zIndex:         20,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
              <path d="M7 1L1 7M4 1L1 4M1 7L1 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* ── Resize handle: total height — bottom-right (blue) ── */}
          <div
            onMouseDown={handleResizeHeightMouseDown}
            title="Drag to resize height"
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
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
              <path d="M1 7L7 1M4 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* ── Resize handle: total width / instruction panel — right-center (purple) ── */}
          <div
            onMouseDown={handleResizeWidthMouseDown}
            title="Drag to resize instruction panel width"
            style={{
              position:        'absolute',
              top:             '50%',
              right:           -7,
              transform:       'translateY(-50%)',
              width:           14,
              height:          28,
              background:      '#6366f1',
              borderRadius:    4,
              cursor:          'ew-resize',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              zIndex:          20,
            }}
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="white">
              <path d="M1 2L1 8M5 2L5 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* ── Size labels for guidance ── */}
          <div style={{
            position:   'absolute',
            top:        -22,
            left:       0,
            fontSize:   8,
            color:      '#fff',
            fontWeight: 600,
            pointerEvents: 'none',
          }}>
            {Math.round(totalWPts)}×{Math.round(totalHPts)} pts
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
        display:      'inline-flex',
        alignItems:   'center',
        gap:          6,
        height:       32,
        padding:      '0 12px',
        borderRadius: 6,
        border:       hasQR ? '1px solid #3b82f6' : '1px solid hsl(var(--border))',
        background:   hasQR ? '#eff6ff' : 'hsl(var(--card))',
        color:        hasQR ? '#1d4ed8' : 'hsl(var(--muted-foreground))',
        fontSize:     12,
        fontWeight:   600,
        cursor:       bcertNumber ? 'pointer' : 'not-allowed',
        opacity:      bcertNumber ? 1 : 0.4,
        transition:   'all 0.15s',
        whiteSpace:   'nowrap',
      }}
    >
      <QrCode style={{ width: 14, height: 14 }} />
      {hasQR ? 'QR Added ✓' : 'Add QR Code'}
    </button>
  );
}