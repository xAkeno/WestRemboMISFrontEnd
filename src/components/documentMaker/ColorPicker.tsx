import { useState } from 'react';
import { COLOR_PALETTE } from '@/types/certificate';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [custom, setCustom] = useState(color);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="h-7 w-7 rounded border border-border"
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-6 gap-1.5 mb-2">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
              onClick={() => { onChange(c); setCustom(c); }}
            />
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onBlur={() => { if (/^#[0-9A-Fa-f]{6}$/.test(custom)) onChange(custom); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && /^#[0-9A-Fa-f]{6}$/.test(custom)) onChange(custom); }}
            className="h-7 w-24 text-xs"
            placeholder="#000000"
          />
          <div className="h-6 w-6 rounded border border-border" style={{ backgroundColor: custom }} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
