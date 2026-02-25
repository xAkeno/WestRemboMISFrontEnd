import { Upload, Plus, Download, Save, SaveAll, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PREDEFINED_FIELD_GROUPS } from '@/types/certificate';

interface ToolbarProps {
  onUpload: (file: File) => void;
  onAddField: (label: string) => void;
  onDownload: () => void;
  onSaveLayout: () => void;
  onLoadLayout: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasTemplate: boolean;
  isAdmin: boolean;
  onSubmit: () => void;
  isUpdate: boolean;
  onPrint: () => void;
}

const GROUP_LABELS: Record<string, string> = {
  personal: 'Personal Information',
  address: 'Address Information',
  business: 'Business Information',
  building: 'Building Information',
  certificate: 'Certificate Information',
  additional: 'Additional Information',
};

export function Toolbar({ onUpload, onAddField, onDownload, onSaveLayout, onLoadLayout, hasTemplate, isAdmin, onSubmit, isUpdate, onPrint }: ToolbarProps) {

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
        <DropdownMenuContent className="max-h-[500px] overflow-y-auto w-64">
          {Object.entries(PREDEFINED_FIELD_GROUPS).map(
            ([groupName, fields], index, array) => (
              <div key={groupName}>
                {/* Group Label */}
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {GROUP_LABELS[groupName] ?? groupName}
                </div>

                {/* Fields */}
                {fields.map((field) => (
                  <DropdownMenuItem
                    key={field}
                    onClick={() => onAddField(field)}
                  >
                    {field}
                  </DropdownMenuItem>
                ))}

                {/* Separator between groups */}
                {index < array.length - 1 && <DropdownMenuSeparator />}
              </div>
            )
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              const name = prompt('Enter custom field name:');
              if (name?.trim()) onAddField(name.trim());
            }}
          >
            + Custom Field
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" disabled={!hasTemplate} onClick={onDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
      <Button variant="outline" size="sm" disabled={!hasTemplate} onClick={onPrint}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>

      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          disabled={!hasTemplate}
          onClick={onSaveLayout}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Layout
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={onSubmit}>
        <SaveAll className="mr-2 h-4 w-4" />
        {isUpdate ? "Update Data" : "Save Data"}
      </Button>



      {/* <label>
        <Button variant="ghost" size="sm" asChild>
          <span className="cursor-pointer text-xs text-muted-foreground">Load Layout</span>
        </Button>
        <input type="file" accept=".json" className="hidden" onChange={onLoadLayout} />
      </label> */}
    </div>
  );
}
