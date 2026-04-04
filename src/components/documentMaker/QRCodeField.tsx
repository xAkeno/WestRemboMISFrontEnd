/**
 * QRCodeField.tsx
 * 
 * Draggable QR code field for the CertificateEditor.
 * Generates a QR code from the bcert_number and renders it as a draggable,
 * resizable overlay on top of the PDF preview canvas.
 * 
 * USAGE:
 * 1. Add the QRCodeField component inside <PDFPreview> overlay area
 * 2. Pass bcertNumber (from URL params) and the field state
 * 3. The QR code can be dragged and resized, then embedded into the PDF on download
 * 
 * INSTALLATION:
 *   npm install qrcode react-draggable
 *   npm install --save-dev @types/qrcode
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { QrCode, GripHorizontal, X, Minimize2, Maximize2, Move } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface QRCodeFieldData {
  x: number;         // position as % of container width
  y: number;         // position as % of container height
  size: number;      // size in px (square)
  page: number;      // which PDF page it belongs to
  visible: boolean;
}

interface QRCodeFieldProps {
  bcertNumber: string | undefined | null;
  field: QRCodeFieldData;
  onChange: (updates: Partial<QRCodeFieldData>) => void;
  onRemove: () => void;
  containerRef: React.RefObject<HTMLDivElement>; // the PDF preview container
  isSelected: boolean;
  onSelect: () => void;
}

// ─── QR Code Canvas ─────────────────────────────────────────────────────────────

function QRCanvas({ value, size }: { value: string; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
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

// ─── Main Component ─────────────────────────────────────────────────────────────

export function QRCodeField({
  bcertNumber,
  field,
  onChange,
  onRemove,
  containerRef,
  isSelected,
  onSelect,
}: QRCodeFieldProps) {
  const fieldRef   = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStart  = useRef({ mouseX: 0, mouseY: 0, fieldX: 0, fieldY: 0 });
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, size: 0 });

  const getContainerRect = () => containerRef.current?.getBoundingClientRect();

  // ── Drag ────────────────────────────────────────────────────────────────────
  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const rect = getContainerRect();
    if (!rect) return;

    isDragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      fieldX: field.x,
      fieldY: field.y,
    };

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const r = getContainerRect();
      if (!r) return;
      const dx = ((ev.clientX - dragStart.current.mouseX) / r.width) * 100;
      const dy = ((ev.clientY - dragStart.current.mouseY) / r.height) * 100;
      const newX = Math.max(0, Math.min(dragStart.current.fieldX + dx, 100 - (field.size / r.width) * 100));
      const newY = Math.max(0, Math.min(dragStart.current.fieldY + dy, 100 - (field.size / r.height) * 100));
      onChange({ x: newX, y: newY });
    };

    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [field, onChange, onSelect]);

  // ── Resize ───────────────────────────────────────────────────────────────────
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    isResizing.current = true;
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, size: field.size };

    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const dx = ev.clientX - resizeStart.current.mouseX;
      const dy = ev.clientY - resizeStart.current.mouseY;
      const delta = (Math.abs(dx) > Math.abs(dy) ? dx : dy);
      const newSize = Math.max(48, Math.min(240, resizeStart.current.size + delta));
      onChange({ size: newSize });
    };

    const onUp = () => {
      isResizing.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [field.size, onChange]);

  if (!field.visible || !bcertNumber) return null;

  const rect = getContainerRect();
  const containerW = rect?.width ?? 800;
  const containerH = rect?.height ?? 1000;

  return (
    <div
      ref={fieldRef}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{
        position:  'absolute',
        left:      `${field.x}%`,
        top:       `${field.y}%`,
        width:     field.size,
        height:    field.size,
        zIndex:    isSelected ? 50 : 30,
        cursor:    'move',
        userSelect: 'none',
      }}
    >
      {/* Selection border + glow */}
      <div
        style={{
          position:     'absolute',
          inset:        isSelected ? -3 : 0,
          borderRadius: 6,
          border:       isSelected ? '2px dashed #3b82f6' : '1px solid transparent',
          boxShadow:    isSelected ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
          transition:   'all 0.12s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Drag handle — top bar */}
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

      {/* QR Code canvas */}
      <div
        style={{
          width:        '100%',
          height:       '100%',
          background:   '#fff',
          borderRadius: 4,
          overflow:     'hidden',
          boxShadow:    isSelected
            ? '0 4px 20px rgba(0,0,0,0.15)'
            : '0 1px 6px rgba(0,0,0,0.12)',
          transition:   'box-shadow 0.15s',
        }}
      >
        <QRCanvas value={bcertNumber} size={field.size} />
      </div>

      {/* Label under QR */}
      {isSelected && (
        <div style={{
          position:   'absolute',
          bottom:     -20,
          left:       0,
          right:      0,
          textAlign:  'center',
          fontSize:   9,
          fontWeight: 700,
          color:      '#6b7280',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
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

          {/* Resize handle — bottom-right corner */}
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

// ─── Toolbar Button ─────────────────────────────────────────────────────────────

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
      title={bcertNumber ? (hasQR ? 'Remove QR code from canvas' : 'Add draggable QR code to certificate') : 'No BCert number available'}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            6,
        height:         32,
        padding:        '0 12px',
        borderRadius:   6,
        border:         hasQR ? '1px solid #3b82f6' : '1px solid hsl(var(--border))',
        background:     hasQR ? '#eff6ff' : 'hsl(var(--card))',
        color:          hasQR ? '#1d4ed8' : 'hsl(var(--muted-foreground))',
        fontSize:       12,
        fontWeight:     600,
        cursor:         bcertNumber ? 'pointer' : 'not-allowed',
        opacity:        bcertNumber ? 1 : 0.4,
        transition:     'all 0.15s',
        whiteSpace:     'nowrap',
      }}
    >
      <QrCode style={{ width: 14, height: 14 }} />
      {hasQR ? 'QR Added ✓' : 'Add QR Code'}
    </button>
  );
}


/**
 * ─── INTEGRATION GUIDE ─────────────────────────────────────────────────────────
 * 
 * 1. INSTALL DEPENDENCY
 *    npm install qrcode
 *    npm install --save-dev @types/qrcode
 * 
 * 2. IN CertificateEditor.tsx — add state:
 * 
 *    import { QRCodeField, QRCodeFieldData, QRToolbarButton } from './QRCodeField';
 * 
 *    const pdfPreviewContainerRef = useRef<HTMLDivElement>(null);
 *    const [qrField, setQrField] = useState<QRCodeFieldData | null>(null);
 *    const [qrSelected, setQrSelected] = useState(false);
 * 
 *    const handleToggleQR = () => {
 *      if (qrField?.visible) {
 *        setQrField(null);
 *      } else {
 *        setQrField({
 *          x: 5, y: 5,        // initial position (% of container)
 *          size: 96,           // initial size in px
 *          page: currentPage,
 *          visible: true,
 *        });
 *      }
 *    };
 * 
 * 3. IN <Toolbar> — add the QRToolbarButton:
 * 
 *    <QRToolbarButton
 *      bcertNumber={bcertNumber}
 *      qrField={qrField}
 *      onToggle={handleToggleQR}
 *    />
 * 
 * 4. IN <PDFPreview> — wrap it with a relative container and add QRCodeField:
 * 
 *    <div ref={pdfPreviewContainerRef} style={{ position: 'relative' }}>
 *      <PDFPreview ... />
 *      {qrField && qrField.page === currentPage && (
 *        <QRCodeField
 *          bcertNumber={bcertNumber ?? existingRecord?.bcert_number}
 *          field={qrField}
 *          onChange={(updates) => setQrField(prev => prev ? { ...prev, ...updates } : null)}
 *          onRemove={() => setQrField(null)}
 *          containerRef={pdfPreviewContainerRef}
 *          isSelected={qrSelected}
 *          onSelect={() => setQrSelected(true)}
 *        />
 *      )}
 *    </div>
 * 
 *    // Deselect when clicking outside:
 *    <div onClick={() => setQrSelected(false)}>
 *      ...
 *    </div>
 * 
 * 5. TO EMBED QR IN PDF (optional — for download/print):
 *    When generating the PDF, draw the QR canvas onto the pdf-lib page at the
 *    qrField.x/y position (convert % back to pts using page dimensions).
 *    Use pdfDoc.embedPng(canvas.toDataURL()) → page.drawImage().
 */
