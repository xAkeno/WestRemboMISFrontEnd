import { useRef, useState, useEffect, useCallback } from 'react';
import type { TextField, PDFTemplateInfo } from '@/types/certificate';
import { DraggableTextField } from './DraggableTextField';
import type { QRCodeFieldData } from './QRCodeField';
import { QRCodeField } from './QRCodeField';

// ─── Concat groups ─────────────────────────────────────────────────────────────

export interface ConcatGroup {
  label: string;
  members: string[];
  separator: string;
}

export const CONCAT_GROUPS: ConcatGroup[] = [
  {
    label: 'Full Name',
    members: ['Prefix', 'First Name', 'M.I.', 'Last Name', 'Ext Name'],
    separator: ' ',
  },
  {
    label: 'Full Address',
    members: ['House Block Lot No', 'Street', 'Zone'],
    separator: ', ',
  },
];

const norm = (s: string) => s.trim().toLowerCase();

export function getConcatValue(
  members: string[],
  separator: string,
  fields: TextField[]
): string {
  return members
    .map((label) =>
      fields.find((f) => norm(f.label) === norm(label))?.value?.toString().trim() ?? ''
    )
    .filter(Boolean)
    .join(separator);
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface PDFPreviewProps {
  blobUrl: string | null;
  templateInfo: PDFTemplateInfo | null;
  fields: TextField[];
  selectedId: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectField: (id: string) => void;
  /** x/y passed here are already in PDF points (scale-corrected by this component) */
  onDragField: (id: string, x: number, y: number) => void;
  onDeleteField: (id: string) => void;
  onDeselect: () => void;
  qrField: QRCodeFieldData | null;
  onQRChange: (updates: Partial<QRCodeFieldData>) => void;
  onQRRemove: () => void;
  bcertNumber?: string | null;
  isAdmin?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function PDFPreview({
  blobUrl,
  templateInfo,
  fields,
  selectedId,
  currentPage,
  onPageChange,
  onSelectField,
  onDragField,
  onDeleteField,
  onDeselect,
  qrField,
  onQRChange,
  onQRRemove,
  bcertNumber,
  isAdmin = false,
}: PDFPreviewProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [qrSelected, setQrSelected] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(0);

  // ── STEP 1: pageRef ────────────────────────────────────────────────────────
  // Points at the element whose bounding rect matches the rendered PDF surface.
  // Because we use <iframe> (can't ref inside), we target the canvasWrap div,
  // which is sized to the PDF page dimensions — so its origin IS the page origin.
  const pageRef = useRef<HTMLElement | null>(null);

  // The ratio of rendered container size to actual PDF page size.
  const [scale, setScale] = useState(1);

  const pageInfo = templateInfo?.pages[currentPage];

  // Track actual rendered scale AND canvas pixel width whenever container or page changes
  const updateScale = useCallback(() => {
    if (!canvasWrapRef.current || !pageInfo) return;
    const renderedW = canvasWrapRef.current.offsetWidth;
    const renderedH = canvasWrapRef.current.offsetHeight;
    const scaleX = renderedW / pageInfo.width;
    const scaleY = renderedH / pageInfo.height;
    setScale(Math.min(scaleX, scaleY));
    setCanvasWidth(renderedW);
  }, [pageInfo]);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (canvasWrapRef.current) ro.observe(canvasWrapRef.current);
    return () => ro.disconnect();
  }, [updateScale]);

  useEffect(() => {
    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey) { e.preventDefault(); e.stopPropagation(); }
    };
    document.addEventListener('wheel', preventZoom, { passive: false });
    return () => document.removeEventListener('wheel', preventZoom);
  }, []);

  if (!blobUrl || !templateInfo || !pageInfo) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/30">
        <p className="text-muted-foreground text-sm">Upload a PDF template to get started</p>
      </div>
    );
  }

  // Scale drag coords → PDF points before passing up
  const handleDrag = (id: string, screenX: number, screenY: number) => {
    onDragField(id, screenX / scale, screenY / scale);
  };

  // Scale stored PDF-point coords → screen pixels for the overlay position
  const toScreen = (field: TextField): TextField => ({
    ...field,
    x: field.x * scale,
    y: field.y * scale,
    fontSize: (field.fontSize ?? 12) * scale,
  });

  // ── Build concat overlays ───────────────────────────────────────────────────

  const suppressedNormLabels = new Set<string>();
  const concatOverlays: TextField[] = [];

  for (const group of CONCAT_GROUPS) {
    const pageMembers = group.members
      .map((label) =>
        fields.find((f) => norm(f.label) === norm(label) && f.page === currentPage)
      )
      .filter((f): f is TextField => !!f);

    if (pageMembers.length === 0) continue;

    const combinedValue = getConcatValue(group.members, group.separator, fields);
    const anchor = pageMembers[0];

    concatOverlays.push({ ...anchor, label: group.label, value: combinedValue });
    group.members.forEach((l) => suppressedNormLabels.add(norm(l)));
  }

  const regularPageFields = fields.filter(
    (f) =>
      f.page === currentPage &&
      !f.hidden &&
      !suppressedNormLabels.has(norm(f.label))
  );

  const showQR =
    qrField?.visible &&
    qrField.page === currentPage &&
    !!bcertNumber &&
    bcertNumber !== 'new';

  return (
    <div
      className="flex flex-1 items-center justify-center bg-muted/30 overflow-hidden"
      ref={containerRef}
      onClick={() => { onDeselect(); setQrSelected(false); }}
    >
      <div className="flex flex-1 items-center justify-center p-4 overflow-hidden">
        {/*
         * STEP 2-C: <iframe> cannot be ref'd inside, so we attach pageRef to
         * this wrapper div. It is already sized to match the PDF page exactly
         * (width/height = pageInfo dimensions, constrained by maxWidth/maxHeight),
         * making its top-left corner the true PDF origin for coordinate math.
         */}
        <div
          ref={(el) => {
            (canvasWrapRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            pageRef.current = el;          // ← STEP 2: wire pageRef here
          }}
          className="relative shadow-lg"
          style={{
            width:     pageInfo.width,
            height:    pageInfo.height,
            maxWidth:  '95%',
            maxHeight: '95%',
          }}
        >
          <iframe
            src={`${blobUrl}#page=${currentPage + 1}&toolbar=0`}
            className="w-full h-full border-0"
            title="PDF Preview"
          />

          {/* Regular fields */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="pointer-events-auto">
              {regularPageFields.map((f) => (
                <DraggableTextField
                  key={f.id}
                  field={toScreen(f)}
                  isSelected={f.id === selectedId}
                  onSelect={onSelectField}
                  onDrag={handleDrag}
                  onDelete={isAdmin ? onDeleteField : undefined}
                  canvasWidth={canvasWidth}
                />
              ))}
            </div>
          </div>

          {/* Concat overlays */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="pointer-events-auto">
              {concatOverlays.map((syntheticField) => (
                <DraggableTextField
                  key={`concat-${syntheticField.id}`}
                  field={toScreen(syntheticField)}
                  isSelected={syntheticField.id === selectedId}
                  onSelect={onSelectField}
                  onDrag={handleDrag}
                  onDelete={undefined}
                  canvasWidth={canvasWidth}
                />
              ))}
            </div>
          </div>

          {showQR && (
            // STEP 3: pass pageRef so QRCodeField uses the correct bounding rect
            <QRCodeField
              bcertNumber={bcertNumber}
              field={qrField}
              onChange={onQRChange}
              onRemove={onQRRemove}
              containerRef={containerRef}
              pageRef={pageRef}                    
              isSelected={qrSelected}
              onSelect={() => setQrSelected(true)}
              pageWidth={templateInfo?.pages[currentPage]?.width   ?? 595}
              pageHeight={templateInfo?.pages[currentPage]?.height ?? 842}
            />
          )}
        </div>
      </div>
    </div>
  );
}