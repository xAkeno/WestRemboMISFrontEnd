import type { TextField } from '@/types/certificate';
import { FONT_FAMILIES } from '@/types/certificate';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ColorPicker } from './ColorPicker';

interface FieldEditorProps {
  field: TextField;
  onChange: (id: string, updates: Partial<TextField>) => void;
}

export function FieldEditor({ field, onChange }: FieldEditorProps) {
  const update = (u: Partial<TextField>) => onChange(field.id, u);

  return (
    <div className="space-y-4 p-3">
      <div>
        <Label className="text-xs text-muted-foreground">Value</Label>
        <Input
          value={field.value}
          onChange={(e) => update({ value: e.target.value })}
          className="mt-1 h-8 text-sm"
        />
      </div>

      {/* Typography row */}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[100px]">
          <Label className="text-xs text-muted-foreground">Font</Label>
          <Select value={field.fontFamily} onValueChange={(v) => update({ fontFamily: v as TextField['fontFamily'] })}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-16">
          <Label className="text-xs text-muted-foreground">Size</Label>
          <Input
            type="number"
            min={6}
            max={120}
            value={field.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            className="mt-1 h-8 text-xs"
          />
        </div>
        <ColorPicker color={field.color} onChange={(c) => update({ color: c })} />
      </div>

      {/* Style toggles */}
      <div className="flex items-center gap-1">
        <Button
          variant={field.fontWeight === 'bold' ? 'default' : 'outline'}
          size="icon"
          className="h-7 w-7"
          onClick={() => update({ fontWeight: field.fontWeight === 'bold' ? 'normal' : 'bold' })}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={field.fontStyle === 'italic' ? 'default' : 'outline'}
          size="icon"
          className="h-7 w-7"
          onClick={() => update({ fontStyle: field.fontStyle === 'italic' ? 'normal' : 'italic' })}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        {(['left', 'center', 'right'] as const).map((a) => {
          const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight;
          return (
            <Button
              key={a}
              variant={field.alignment === a ? 'default' : 'outline'}
              size="icon"
              className="h-7 w-7"
              onClick={() => update({ alignment: a })}
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          );
        })}
      </div>

      {/* Position */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">X</Label>
          <Input
            type="number"
            value={Math.round(field.x)}
            onChange={(e) => update({ x: Number(e.target.value) })}
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Y</Label>
          <Input
            type="number"
            value={Math.round(field.y)}
            onChange={(e) => update({ y: Number(e.target.value) })}
            className="mt-1 h-8 text-xs"
          />
        </div>
      </div>

      {/* Opacity */}
      <div>
        <Label className="text-xs text-muted-foreground">Opacity: {Math.round(field.opacity * 100)}%</Label>
        <Slider
          value={[field.opacity]}
          onValueChange={([v]) => update({ opacity: v })}
          min={0}
          max={1}
          step={0.05}
          className="mt-1"
        />
      </div>

      {/* Letter spacing */}
      <div>
        <Label className="text-xs text-muted-foreground">Letter Spacing</Label>
        <Input
          type="number"
          value={field.letterSpacing}
          onChange={(e) => update({ letterSpacing: Number(e.target.value) })}
          className="mt-1 h-8 text-xs"
          min={0}
          max={20}
          step={0.5}
        />
      </div>
    </div>
  );
}
