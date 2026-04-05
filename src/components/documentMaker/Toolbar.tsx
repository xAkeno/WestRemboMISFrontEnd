import { Upload, Plus, Download, Save, SaveAll, Printer, BadgeDollarSign, FileCheck2, FolderDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DEFAULT_FIELD, PREDEFINED_FIELD_GROUPS } from '@/types/certificate';
import type { TextField } from '@/types/certificate';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ToolbarProps {
  onUpload: (file: File) => void;
  onAddField: (label: string) => void;
  onDownload: () => void;
  onSaveLayout: () => void;
  onLoadLayout: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasTemplate: boolean;
  isAdmin: boolean;
  onSubmit: () => void;
  onMarkToPay: () => void;
  isUpdate: boolean;
  onPrint: () => void;
  selectedClearanceType: string | null;
  onChangeClearanceType: (type: string) => void;
  fields: TextField[];
  selectedId: string | null;
  isMarkingToPay?: boolean;
  // ── Release / Download ───────────────────────────────────────────────────
  onRelease: () => void;
  onDownloadReleased: () => void;
  isReleasing?: boolean;
  isDownloading?: boolean;
  hasReleasedDocument?: boolean;
}

const CLEARANCE_FIELDS: Record<string, string[]> = {
  'Barangay Certificate': ['First Name', 'Last Name', 'Date', 'Purpose'],
  'Barangay Clearance':   ['First Name', 'Last Name', 'Age', 'Purpose', 'Issued On'],
  'Business Clearance':   ['Business Name', 'Business Type', 'Capital', 'Owner Name'],
  'Building Clearance':   ['Owner Name', 'Building Address', 'Inspected By', 'Date of Inspection'],
  'Resident': [
    'Resident ID', 'Prefix', 'First Name', 'M.I.', 'Last Name', 'Ext Name',
    'Nickname', 'Sex', 'Date of Birth', 'Place of Birth', 'Marital Status',
    'Name of Spouse', 'Religion', 'Blood Type', 'Complexion', 'PWD',
    'Height (cm)', 'Weight (kg)', 'Phone Number', 'Email Address',
    'House Block Lot No', 'Street', 'Zone', 'Resident Status',
    'Period of Residency', 'House Owner', 'Relationship to House Owner',
    'Voter Status', 'Precinct No', 'Occupation', 'Position',
    'Employment Status', 'Notes', 'Status',
  ],
};

const GROUP_LABELS: Record<string, string> = {
  personal:    'Personal Information',
  address:     'Address Information',
  business:    'Business Information',
  building:    'Building Information',
  certificate: 'Certificate Information',
  additional:  'Additional Information',
  resident:    'Resident Information',
};

const Spinner = () => (
  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

export function Toolbar({
  onUpload,
  onAddField,
  onDownload,
  onSaveLayout,
  onLoadLayout,
  hasTemplate,
  isAdmin,
  onSubmit,
  onMarkToPay,
  isUpdate,
  onPrint,
  selectedClearanceType,
  onChangeClearanceType,
  fields,
  selectedId,
  isMarkingToPay = false,
  onRelease,
  onDownloadReleased,
  isReleasing = false,
  isDownloading = false,
  hasReleasedDocument = false,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2 flex-wrap">

      {/* Upload template */}
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

      {/* Add field */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={!hasTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[500px] overflow-y-auto w-64">
          {Object.entries(PREDEFINED_FIELD_GROUPS).map(([groupName, fields], index, array) => (
            <div key={groupName}>
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {GROUP_LABELS[groupName] ?? groupName}
              </div>
              {fields.map((field) => (
                <DropdownMenuItem key={field} onClick={() => onAddField(field)}>
                  {field}
                </DropdownMenuItem>
              ))}
              {index < array.length - 1 && <DropdownMenuSeparator />}
            </div>
          ))}
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

      {/* Download PDF (local) */}
      <Button variant="outline" size="sm" disabled={!hasTemplate} onClick={onDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>

      {/* Print */}
      <Button variant="outline" size="sm" disabled={!hasTemplate} onClick={onPrint}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>

      {/* Save layout (admin only) */}
      {isAdmin && (
        <Button variant="outline" size="sm" disabled={!hasTemplate} onClick={onSaveLayout}>
          <Save className="mr-2 h-4 w-4" />
          Save Layout
        </Button>
      )}

      {/* Save / Update data */}
      <Button variant="outline" size="sm" onClick={onSubmit}>
        <SaveAll className="mr-2 h-4 w-4" />
        {isUpdate ? "Update Data" : "Save Data"}
      </Button>

      {/* Mark as To Pay */}
      {isUpdate && (
        <Button
          variant="outline"
          size="sm"
          disabled={isMarkingToPay}
          onClick={onMarkToPay}
          className="border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
        >
          {isMarkingToPay ? (
            <><Spinner />Processing...</>
          ) : (
            <><BadgeDollarSign className="mr-2 h-4 w-4" />Mark as To Pay</>
          )}
        </Button>
      )}

      {/* ── Release & Save to S3 — admin only, existing records only ─── */}
      {isAdmin && isUpdate && (
        <Button
          variant="outline"
          size="sm"
          disabled={isReleasing || !hasTemplate}
          onClick={onRelease}
          className="border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800 disabled:opacity-50"
        >
          {isReleasing ? (
            <><Spinner />Releasing...</>
          ) : (
            <><FileCheck2 className="mr-2 h-4 w-4" />Release & Save</>
          )}
        </Button>
      )}

      {/* ── Download Released Document ─────────────────────────────────── */}
      {hasReleasedDocument && (
        <Button
          variant="outline"
          size="sm"
          disabled={isDownloading}
          onClick={onDownloadReleased}
          className="border-blue-400 text-blue-700 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
        >
          {isDownloading ? (
            <><Spinner />Loading...</>
          ) : (
            <><FolderDown className="mr-2 h-4 w-4" />Download Released</>
          )}
        </Button>
      )}

      {/* Clearance type selector */}
      <Select value={selectedClearanceType ?? ''} onValueChange={onChangeClearanceType}>
        <SelectTrigger className="h-9 text-xs w-56">
          <SelectValue placeholder="Select Clearance Type" />
        </SelectTrigger>
        <SelectContent className="w-56">
          {Object.keys(CLEARANCE_FIELDS).map((type) => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}