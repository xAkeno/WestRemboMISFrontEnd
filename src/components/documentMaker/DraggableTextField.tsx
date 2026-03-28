import Draggable from 'react-draggable';
import type { TextField } from '@/types/certificate';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useRef } from 'react';

interface DraggableTextFieldProps {
  field: TextField;
  isSelected: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onDrag: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

export function DraggableTextField({ field, isSelected, scale, onSelect, onDrag, onDelete }: DraggableTextFieldProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  const fontFamilyMap: Record<string, string> = {
    Helvetica: 'Helvetica, Arial, sans-serif',
    TimesRoman: '"Times New Roman", Times, serif',
    Courier: '"Courier New", Courier, monospace',
  };

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      scale={scale}
      position={{ x: field.x, y: field.y }}
      onStop={(_e, data) => {
        onDrag(field.id, data.x, data.y);
      }}
      onStart={() => onSelect(field.id)}
    >
      <div
        ref={nodeRef}
        className={cn(
          'absolute cursor-move select-none group',
          isSelected && 'ring-2 ring-ring ring-offset-1'
        )}
        style={{
          fontSize: field.fontSize,
          fontFamily: fontFamilyMap[field.fontFamily],
          fontWeight: field.fontWeight,
          fontStyle: field.fontStyle,
          color: field.color,
          opacity: field.opacity,
          letterSpacing: field.letterSpacing,
          textAlign: field.alignment,
          whiteSpace: 'nowrap',
        }}
        onClick={(e) => { e.stopPropagation(); onSelect(field.id); }}
      >
        {field.value || field.label}
        {isSelected && (
          <button
            className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onDelete(field.id); }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </Draggable>
  );
}
