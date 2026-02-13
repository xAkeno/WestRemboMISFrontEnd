import { Upload, Plus, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PREDEFINED_FIELDS } from '@/types/certificate';

interface ToolbarProps {
  onUpload: (file: File) => void;
  onAddField: (label: string) => void;
  onDownload: () => void;
  onSaveLayout: () => void;
  onLoadLayout: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasTemplate: boolean;
}

export function Toolbar({ onUpload, onAddField, onDownload, onSaveLayout, onLoadLayout, hasTemplate }: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
      <label>
        <Button variant="outline" size="sm" asChild>
          <span className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Upload Template
          </span>
        </Button>
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = '';
          }}
        />
      </label>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={!hasTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {PREDEFINED_FIELDS.map((f) => (
            <DropdownMenuItem key={f} onClick={() => onAddField(f)}>
              {f}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={() => {
            const name = prompt('Enter custom field name:');
            if (name?.trim()) onAddField(name.trim());
          }}>
            + Custom Field
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" disabled={!hasTemplate} onClick={onDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>

      <Button variant="outline" size="sm" disabled={!hasTemplate} onClick={onSaveLayout}>
        <Save className="mr-2 h-4 w-4" />
        Save Layout
      </Button>

      <label>
        <Button variant="ghost" size="sm" asChild>
          <span className="cursor-pointer text-xs text-muted-foreground">Load Layout</span>
        </Button>
        <input type="file" accept=".json" className="hidden" onChange={onLoadLayout} />
      </label>
    </div>
  );
}
