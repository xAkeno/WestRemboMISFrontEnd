import { useRef, useState, useEffect, useCallback } from 'react';
import type { TextField, PDFTemplateInfo } from '@/types/certificate';
import { DraggableTextField } from './DraggableTextField';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
}: PDFPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const pageInfo = templateInfo?.pages[currentPage];

  // ✅ UPDATED: Hidden fields will NOT render in preview
  const pageFields = fields.filter(
    (f) => f.page === currentPage && !f.hidden
  );

  const updateScale = useCallback(() => {
    if (!containerRef.current || !pageInfo) return;

    const containerWidth = containerRef.current.clientWidth - 32;
    const containerHeight = containerRef.current.clientHeight - 32;

    const s = Math.min(
      containerWidth / pageInfo.width,
      containerHeight / pageInfo.height
    );

    setScale(s);
  }, [pageInfo]);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  if (!blobUrl || !templateInfo || !pageInfo) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/30">
        <p className="text-muted-foreground text-sm">
          Upload a PDF template to get started
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 flex-col bg-muted/30 overflow-auto"
      ref={containerRef}
    >
      {/* PDF + overlay */}
      <div className="flex flex-1 items-center justify-center p-4 overflow-hidden">
        <div
          className="relative shadow-lg origin-top-left"
          style={{
            width: pageInfo.width,
            height: pageInfo.height,
            transform: `scale(${scale})`,
          }}
          onClick={onDeselect}
        >
          <iframe
            src={`${blobUrl}#page=${currentPage + 1}&toolbar=0`}
            className="absolute inset-0 w-full h-full border-0"
            title="PDF Preview"
          />

          {/* Draggable overlay */}
          <div
            className="absolute inset-0"
            style={{ pointerEvents: 'none' }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              {pageFields.map((f) => (
                <DraggableTextField
                  key={f.id}
                  field={f}
                  isSelected={f.id === selectedId}
                  scale={scale}
                  onSelect={onSelectField}
                  onDrag={onDragField}
                  onDelete={onDeleteField}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}