import Draggable from 'react-draggable';
import type { TextField } from '@/types/certificate';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useRef } from 'react';

interface DraggableTextFieldProps {
  field: TextField;
  isSelected: boolean;
  onSelect: (id: string) => void;
  /** x/y here are in SCREEN PIXELS. PDFPreview.handleDrag divides by scale. */
  onDrag: (id: string, x: number, y: number) => void;
  onDelete?: (id: string) => void;
  canvasWidth?: number;
}

export function DraggableTextField({
  field,
  isSelected,
  onSelect,
  onDrag,
  onDelete,
  canvasWidth,
}: DraggableTextFieldProps) {
  const nodeRef    = useRef<HTMLDivElement>(null);
  const dragState  = useRef<{
    startMouseX: number;
    startMouseY: number;
    startFieldX: number;
    startFieldY: number;
  } | null>(null);

  const fontFamilyMap: Record<string, string> = {
    Helvetica:  'Helvetica, Arial, sans-serif',
    TimesRoman: '"Times New Roman", Times, serif',
    Courier:    '"Courier New", Courier, monospace',
  };

  const shouldWrap =
    field.fieldType === 'ADDRESS' ||
    field.fieldType === 'ZONE'    ||
    field.fieldType === 'TEXT';

  const maxWidth = canvasWidth
    ? Math.max(80, canvasWidth - field.x - 8)
    : 420;

  // ── AUTO-CENTER MODE ───────────────────────────────────────────────────────
  //
  // WHY NOT USE <Draggable> HERE:
  // PDFPreview's toScreen() has already multiplied field.x by scale before
  // passing it down. Draggable applies its own CSS transform: translate(x,y)
  // on top of whatever CSS `left`/`top` we set — resulting in a double-offset.
  //
  // Instead we use raw window mousemove/mouseup events (same approach as
  // QRCodeField.tsx in this codebase) so we have full control.
  //
  // CONTRACT:
  //   field.x (received here) = center anchor in SCREEN PIXELS
  //                             (PDFPreview.toScreen() already applied scale)
  //   onDrag reports screen pixels → PDFPreview.handleDrag divides by scale
  //                                   before storing PDF-point value.
  //
  if (field.autoCenter) {
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect(field.id);

      dragState.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startFieldX: field.x,   // screen px center anchor at drag start
        startFieldY: field.y,
      };

      const onMove = (ev: MouseEvent) => {
        if (!dragState.current) return;
        const newX = dragState.current.startFieldX + (ev.clientX - dragState.current.startMouseX);
        const newY = dragState.current.startFieldY + (ev.clientY - dragState.current.startMouseY);
        onDrag(field.id, newX, newY);
      };

      const onUp = () => {
        dragState.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup',   onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup',   onUp);
    };

    return (
      <div
        ref={nodeRef}
        onMouseDown={handleMouseDown}
        onClick={(e) => { e.stopPropagation(); onSelect(field.id); }}
        className={cn('absolute cursor-move select-none group')}
        style={{
          // field.x is the center anchor in px. translateX(-50%) shifts the
          // element left by half its own width → visual centre sits at field.x.
          left:          field.x,
          top:           field.y,
          transform:     'translateX(-50%)',

          outline:       isSelected ? '2px solid hsl(var(--ring))' : 'none',
          outlineOffset: '2px',
          fontSize:      field.fontSize,
          fontFamily:    fontFamilyMap[field.fontFamily] ?? field.fontFamily,
          fontWeight:    field.fontWeight,
          fontStyle:     field.fontStyle,
          color:         field.color,
          opacity:       field.opacity,
          letterSpacing: field.letterSpacing,
          textAlign:     'center',
          whiteSpace:    'nowrap',
          padding:       0,
          margin:        0,
          lineHeight:    1.3,
        }}
      >
        {field.value || field.label}

        {onDelete && isSelected && (
          <button
            className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => { e.stopPropagation(); onDelete(field.id); }}
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Subtle centre-line when selected */}
        {isSelected && (
          <div style={{
            position:      'absolute',
            top:           0,
            bottom:        0,
            left:          '50%',
            width:         1,
            background:    'hsl(var(--ring))',
            opacity:       0.3,
            pointerEvents: 'none',
            transform:     'translateX(-50%)',
          }} />
        )}
      </div>
    );
  }

  // ── NORMAL MODE (react-draggable, position controlled) ────────────────────
  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      position={{ x: field.x, y: field.y }}
      onStart={() => { onSelect(field.id); }}
      onStop={(_e, data) => { onDrag(field.id, data.x, data.y); }}
    >
      <div
        ref={nodeRef}
        className={cn('absolute cursor-move select-none group')}
        style={{
          outline:       isSelected ? '2px solid hsl(var(--ring))' : 'none',
          outlineOffset: '1px',
          fontSize:      field.fontSize,
          fontFamily:    fontFamilyMap[field.fontFamily] ?? field.fontFamily,
          fontWeight:    field.fontWeight,
          fontStyle:     field.fontStyle,
          color:         field.color,
          opacity:       field.opacity,
          letterSpacing: field.letterSpacing,
          textAlign:     field.alignment,
          whiteSpace:    shouldWrap ? 'pre-wrap' : 'nowrap',
          wordBreak:     shouldWrap ? 'break-word' : 'normal',
          overflowWrap:  shouldWrap ? 'break-word' : 'normal',
          maxWidth:      shouldWrap ? maxWidth : undefined,
          padding:       0,
          margin:        0,
          lineHeight:    1.3,
        }}
        onClick={(e) => { e.stopPropagation(); onSelect(field.id); }}
      >
        {field.value || field.label}

        {onDelete && isSelected && (
          <button
            className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => { e.stopPropagation(); onDelete(field.id); }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </Draggable>
  );
}