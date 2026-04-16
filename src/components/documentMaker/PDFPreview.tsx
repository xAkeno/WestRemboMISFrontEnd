import { useRef, useState, useEffect, useCallback } from 'react';
import type { TextField, PDFTemplateInfo } from '@/types/certificate';
import { DraggableTextField } from './DraggableTextField';
import type { QRCodeFieldData } from './QRCodeField';
import { QRCodeField } from './QRCodeField';

interface PDFPreviewProps {
  blobUrl: string | null;
  templateInfo: PDFTemplateInfo | null;
  fields: TextField[];
  selectedId: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectField: (id: string) => void;
  onDragField: (id: string, x: number, y: number) => void;
  onDeleteField: (id: string) => void;
  onDeselect: () => void;
  // QR props
  qrField: QRCodeFieldData | null;
  onQRChange: (updates: Partial<QRCodeFieldData>) => void;
  onQRRemove: () => void;
  bcertNumber?: string | null;
}

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
}: PDFPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  // const [scale, setScale] = useState(1);
  const [qrSelected, setQrSelected] = useState(false);

  const pageInfo = templateInfo?.pages[currentPage];

  const pageFields = fields.filter(
    (f) => f.page === currentPage && !f.hidden
  );

  // const updateScale = useCallback(() => {
  //   if (!containerRef.current || !pageInfo) return;
  //   const containerWidth = containerRef.current.clientWidth - 32;
  //   const containerHeight = containerRef.current.clientHeight - 32;
  //   const s = Math.min(
  //     containerWidth / pageInfo.width,
  //     containerHeight / pageInfo.height
  //   );
  //   setScale(s);
  // }, [pageInfo]);

  // useEffect(() => {
  //   updateScale();
  //   window.addEventListener('resize', updateScale);
  //   return () => window.removeEventListener('resize', updateScale);
  // }, [updateScale]);

  useEffect(() => {
  const preventZoom = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  document.addEventListener("wheel", preventZoom, { passive: false });

  return () => {
    document.removeEventListener("wheel", preventZoom);
  };
}, []);

  if (!blobUrl || !templateInfo || !pageInfo) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/30">
        <p className="text-muted-foreground text-sm">
          Upload a PDF template to get started
        </p>
      </div>
    );
  }

  const showQR =
    qrField?.visible &&
    qrField.page === currentPage &&
    !!bcertNumber &&
    bcertNumber !== 'new';

  return (
    <div
      className="flex flex-1 items-center justify-center bg-muted/30 overflow-hidden"
      ref={containerRef}
      onClick={() => {
        onDeselect();
        setQrSelected(false);
      }}
    >
      <div className="flex flex-1 items-center justify-center p-4 overflow-hidden">
        {/* The scaled canvas wrapper — QR is positioned relative to this */}
        <div
          ref={canvasWrapRef}
          className="relative shadow-lg origin-top-left"
          style={{
            width: pageInfo.width,
            height: pageInfo.height,
            maxWidth: "95%",
            maxHeight: "95%",
          }}
        >
          <iframe
            src={`${blobUrl}#page=${currentPage + 1}&toolbar=0`}
            className="w-full h-full border-0"
            title="PDF Preview"
          />

          {/* Text field overlay */}
          <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
              {pageFields.map((f) => (
                <DraggableTextField
                  key={f.id}
                  field={f}
                  isSelected={f.id === selectedId}
                  onSelect={onSelectField}
                  onDrag={onDragField}
                  onDelete={onDeleteField}
                />
              ))}
            </div>
          </div>

          {/* QR Code drag overlay */}
          {showQR && (
            <QRCodeField
              bcertNumber={bcertNumber}
              field={qrField!}
              onChange={onQRChange}
              onRemove={onQRRemove}
              containerRef={canvasWrapRef}
              isSelected={qrSelected}
              onSelect={() => setQrSelected(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}