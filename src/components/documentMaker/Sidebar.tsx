import type { TextField } from '@/types/certificate';
import { FieldEditor } from './FieldEditor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface SidebarProps {
  fields: TextField[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (id: string, updates: Partial<TextField>) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
  documentData: object;
  streets?: { id: number; name: string; sitio: string; formerly?: string }[];
  bcertNumber?: string | null;
  qrEnabled: boolean;
  onToggleQR: () => void;
}

function QRPreviewCanvas({ value, size }: { value: string; size: number }) {
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
      style={{ display: 'block', borderRadius: 4 }}
    />
  );
}

export function EditorSidebar({
  fields,
  selectedId,
  onSelect,
  onChange,
  onDelete,
  streets,
  bcertNumber,
  qrEnabled,
  onToggleQR,
}: SidebarProps) {
  const selectedField = fields.find((f) => f.id === selectedId);
  const hasNumber     = !!bcertNumber && bcertNumber !== 'new';

  return (
    <div className="flex h-full w-72 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-3 py-2">
        <h2 className="text-sm font-semibold">Fields ({fields.length})</h2>
      </div>

      <ScrollArea className="flex-1">
        {fields.length === 0 && (
          <p className="p-4 text-xs text-muted-foreground">
            No fields yet. Use "Add Field" to get started.
          </p>
        )}

        <div className="space-y-0.5 p-1">
          {fields.map((f) => {
            const isSelected = selectedId === f.id;

            return (
              <div key={f.id}>
                <button
                  onClick={() => onSelect(f.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent',
                    isSelected && 'bg-sidebar-accent text-sidebar-accent-foreground'
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-xs">{f.label}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {f.value || '(empty)'}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(f.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </button>

                {isSelected && (
                  <div className="mt-1 mb-2 rounded-md border border-sidebar-border bg-muted/40 p-2">
                    <FieldEditor field={f} onChange={onChange} streets={streets} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* ── QR Code Panel ──────────────────────────────────────────────────────── */}
      <div className="border-t border-sidebar-border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <QrCode className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-semibold">QR Code</span>
          </div>

          {hasNumber && (
            <button
              onClick={onToggleQR}
              className={cn(
                'text-xs font-semibold px-2 py-1 rounded transition-colors',
                qrEnabled
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {qrEnabled ? 'QR Active ✓' : 'Add QR'}
            </button>
          )}
        </div>

        {!hasNumber && (
          <p className="text-[11px] text-muted-foreground leading-snug">
            QR code will be generated automatically once you save the document.
          </p>
        )}

        {hasNumber && !qrEnabled && (
          <p className="text-[11px] text-muted-foreground leading-snug">
            Click "Add QR" to place a draggable QR code on the document.
          </p>
        )}

        {hasNumber && qrEnabled && (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-mono truncate">
              {bcertNumber}
            </p>

            <div className="flex justify-center rounded-md border border-blue-200 bg-white p-2">
              <QRPreviewCanvas value={bcertNumber} size={120} />
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Drag the QR code on the preview to reposition it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}