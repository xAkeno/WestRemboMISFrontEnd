import type { TextField } from '@/types/certificate';
import { FieldEditor } from './FieldEditor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  fields: TextField[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (id: string, updates: Partial<TextField>) => void;
  onDelete: (id: string) => void;
}

export function EditorSidebar({ fields, selectedId, onSelect, onChange, onDelete }: SidebarProps) {
  const selectedField = fields.find((f) => f.id === selectedId);

  return (
    <div className="flex h-full w-72 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-3 py-2">
        <h2 className="text-sm font-semibold">Fields ({fields.length})</h2>
      </div>

      <ScrollArea className="flex-1">
        {fields.length === 0 && (
          <p className="p-4 text-xs text-muted-foreground">No fields yet. Use "Add Field" to get started.</p>
        )}

        {/* Field list */}
        <div className="space-y-0.5 p-1">
          {fields.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelect(f.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent',
                selectedId === f.id && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-xs">{f.label}</div>
                <div className="truncate text-xs text-muted-foreground">{f.value || '(empty)'}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(f.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </button>
          ))}
        </div>

        {/* Selected field editor */}
        {selectedField && (
          <div className="border-t border-sidebar-border mt-2">
            <div className="px-3 pt-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Edit: {selectedField.label}</h3>
            </div>
            <FieldEditor field={selectedField} onChange={onChange} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
