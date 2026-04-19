import Draggable from 'react-draggable';
import type { TextField } from '@/types/certificate';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useRef } from 'react';

interface DraggableTextFieldProps {
  field: TextField;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDrag: (id: string, x: number, y: number) => void;
  /** When undefined the delete button is never rendered (staff view) */
  onDelete?: (id: string) => void;
}

export function DraggableTextField({
  field,
  isSelected,
  onSelect,
  onDrag,
  onDelete,
}: DraggableTextFieldProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  const fontFamilyMap: Record<string, string> = {
    Helvetica:  'Helvetica, Arial, sans-serif',
    TimesRoman: '"Times New Roman", Times, serif',
    Courier:    '"Courier New", Courier, monospace',
  };

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      // Controlled position — always reflects the stored field.x / field.y.
      // We only call onDrag on STOP (not on every move) so the parent state
      // update only happens once per drag, preventing mid-drag re-render snaps.
      position={{ x: field.x, y: field.y }}
      onStart={() => { onSelect(field.id); }}
      onStop={(_e, data) => { onDrag(field.id, data.x, data.y); }}
    >
      <div
        ref={nodeRef}
        className={cn('absolute cursor-move select-none group')}
        style={{
          // Use outline (renders outside box, doesn't affect layout/size)
          // instead of ring which adds box-model offset and shifts position.
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
          whiteSpace:    'nowrap',
          // Zero out any box-model that could skew the perceived position
          padding:       0,
          margin:        0,
          lineHeight:    1,
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