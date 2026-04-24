import { useState, useEffect, useCallback } from 'react';
import {
  Plus, ArrowUpDown, CalendarCheck, CalendarX, Calendar, RefreshCw, X,
  Filter, ChevronDown, SlidersHorizontal, RotateCcw, Eye, Edit2, Save, CreditCard, Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClearanceSearchBar } from '@/components/clearance/ClearanceSearchBar';
import { ClearancePagination } from '@/components/clearance/ClearancePagination';
import { fetchBuildingClearances, FetchClearanceParams } from '@/components/services/clearanceApi';
import { BuildingClearance as BuildingClearanceType } from '@/types/clearance';
import { useToast } from '@/hooks/use-toast';
import { Layout } from "@/components/Layout";
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ScheduleData {
  id: number;
  document_type: string;
  document_number: string;
  schedule_date: string;
  schedule_time: string;
  note?: string | null;
  status?: string;
}

interface Street {
  id: number;
  name: string;
}

interface FilterState {
  status: string;
  filter_date: string;
  from: string;
  to: string;
  zone: string;
  street: string;
  purpose: string;
  schedule_filter: string;
}

const EMPTY_FILTERS: FilterState = {
  status: '', filter_date: '', from: '', to: '',
  zone: '', street: '', purpose: '', schedule_filter: '',
};

const PURPOSE_OPTIONS = [
  'New Construction',
  'Renovation',
  'Extension',
  'Demolition',
  'Change of Use',
  'Other',
];

// ─── URL param key map ─────────────────────────────────────────────────────────
const FILTER_PARAM_KEYS: Record<keyof FilterState, string> = {
  status:          'status',
  filter_date:     'date',
  from:            'from',
  to:              'to',
  zone:            'zone',
  street:          'street',
  purpose:         'purpose',
  schedule_filter: 'schedule',
};

/** Read all filter state from URLSearchParams */
function filtersFromParams(params: URLSearchParams): FilterState {
  return {
    status:          params.get('status')   ?? '',
    filter_date:     params.get('date')     ?? '',
    from:            params.get('from')     ?? '',
    to:              params.get('to')       ?? '',
    zone:            params.get('zone')     ?? '',
    street:          params.get('street')   ?? '',
    purpose:         params.get('purpose')  ?? '',
    schedule_filter: params.get('schedule') ?? '',
  };
}

/** Write all active filters + search + page to URLSearchParams */
function buildParams(
  filters: FilterState,
  search: string,
  page: number,
): URLSearchParams {
  const p = new URLSearchParams();
  if (search)   p.set('search', search);
  if (page > 1) p.set('page', String(page));
  (Object.keys(FILTER_PARAM_KEYS) as (keyof FilterState)[]).forEach(key => {
    const val = filters[key];
    if (val) p.set(FILTER_PARAM_KEYS[key], val);
  });
  return p;
}

// ─── API instance ──────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatTimeRange(timeStr: string) {
  try {
    const [hStr, mStr] = timeStr.split(':');
    const startH = parseInt(hStr, 10);
    const endH   = startH + 1;
    const fmt = (h: number) => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${mStr}`;
    return `${fmt(startH)}–${fmt(endH)} ${endH >= 12 ? 'PM' : 'AM'}`;
  } catch { return timeStr; }
}

function formatDateShort(dateStr: string) {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return dateStr; }
}

function formatCreatedAt(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    const d    = new Date(raw);
    const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${date} · ${time}`;
  } catch { return raw; }
}

function isNewRequest(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  try { return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000; }
  catch { return false; }
}

function countActiveFilters(f: FilterState): number {
  return [
    f.status, f.filter_date,
    f.filter_date === 'custom' && f.from ? 'from' : '',
    f.zone, f.street, f.purpose, f.schedule_filter,
  ].filter(Boolean).length;
}

// ─── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  incomplete: 'bg-orange-50 text-orange-700 border-orange-200',
  rejected:   'bg-rose-100 text-rose-800 border-rose-200',
  released:   'bg-green-100 text-green-800 border-green-200',
  scheduled:  'bg-blue-100 text-blue-800 border-blue-200',
  encoded:    'bg-emerald-50 text-emerald-800 border-emerald-200',
  to_pay:     'bg-purple-100 text-purple-800 border-purple-200',
  paid:       'bg-teal-100 text-teal-800 border-teal-200',
  approved:   'bg-green-100 text-green-800 border-green-200',
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-gray-500 text-sm">—</span>;
  const key = status.toLowerCase();
  const style = STATUS_STYLES[key] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${style}`}>
      {status === 'to_pay' ? 'TO PAY' : status}
    </span>
  );
}

// ─── Schedule Cell ─────────────────────────────────────────────────────────────
function ScheduleCell({ schedule }: { schedule: ScheduleData | null | undefined }) {
  if (!schedule) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-sm">
        <CalendarX className="h-3 w-3" />
        Not yet scheduled
      </span>
    );
  }

  const isUpcoming = new Date(`${schedule.schedule_date}T${schedule.schedule_time}`) >= new Date();
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border w-fit ${
        isUpcoming ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'
      }`}>
        <CalendarCheck className="h-3 w-3" />
        {formatDateShort(schedule.schedule_date)}
      </span>
      <span className="text-[10px] text-gray-500 pl-0.5">
        {formatTimeRange(schedule.schedule_time)}
      </span>
    </div>
  );
}

// ─── Editable Detail Modal Component ──────────────────────────────────────────
function EditableDetailModal({
  record,
  onClose,
  onUpdate,
  toast,
}: {
  record: BuildingClearanceType | null;
  onClose: () => void;
  onUpdate: () => void;
  toast: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('');

  const [formData, setFormData] = useState<any>({
    first_name: '',
    middle_name: '',
    surname: '',
    ext_name: '',
    prefix: '',
    establishment: '',
    purpose: '',
    purpose_details: '',
    house_block_lot_no: '',
    street: '',
    zone: '',
    or_no: '',
    remarks: '',
    status: '',
    created_by: '',
  });

  useEffect(() => {
    if (!record) return;
    const fetchFullRecord = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/building-clearances?search=${record.bcert_number}`,
          { withCredentials: true }
        );
        const full = response.data.data.data[0];
        setCurrentStatus(full.status ?? '');
        setFormData({
          first_name: full.first_name || '',
          middle_name: full.middle_name || '',
          surname: full.surname || '',
          ext_name: full.ext_name || '',
          prefix: full.prefix || '',
          establishment: full.establishment || '',
          purpose: full.purpose || '',
          purpose_details: full.purpose_details || '',
          house_block_lot_no: full.house_block_lot_no || '',
          street: full.street || '',
          zone: full.zone || '',
          or_no: full.or_no || '',
          remarks: full.remarks || '',
          status: full.status || '',
          created_by: full.created_by || '',
        });
      } catch (error) {
        console.error('Error fetching full record:', error);
        toast({ title: 'Error', description: 'Failed to load record details', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullRecord();
  }, [record, toast]);

  if (!record) return null;

  // ── Derived action visibility ──────────────────────────────────────────────
  const status = currentStatus.toUpperCase();
  const canMarkToPay = status === 'ENCODED' || status === 'SCHEDULED' || status === 'APPROVED';
  const canMarkAsPaid = status === 'TO_PAY';
  const canRelease = status === 'PAID';

  // ── Status action handlers ─────────────────────────────────────────────────
  const handleMarkToPay = async () => {
    setActionLoading('to_pay');
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/building-clearances/${record.id}`,
        { status: 'TO_PAY' },
        { withCredentials: true }
      );
      setCurrentStatus('TO_PAY');
      setFormData((p: any) => ({ ...p, status: 'TO_PAY' }));
      toast({ title: 'Success', description: 'Status set to To Pay successfully.' });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to update status.', variant: 'destructive' });
    } finally { setActionLoading(null); }
  };

  const handleMarkAsPaid = async () => {
    setActionLoading('paid');
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/building-clearances/${record.id}`,
        { status: 'PAID' },
        { withCredentials: true }
      );
      setCurrentStatus('PAID');
      setFormData((p: any) => ({ ...p, status: 'PAID' }));
      toast({ title: 'Success', description: 'Status set to Paid successfully.' });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to update status.', variant: 'destructive' });
    } finally { setActionLoading(null); }
  };

  const handleRelease = async () => {
    setActionLoading('release');
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/building-clearances/${record.id}`,
        { status: 'RELEASED', released_at: new Date().toISOString() },
        { withCredentials: true }
      );
      setCurrentStatus('RELEASED');
      setFormData((p: any) => ({ ...p, status: 'RELEASED' }));
      toast({ title: 'Success', description: 'Document released successfully.' });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to release document.', variant: 'destructive' });
    } finally { setActionLoading(null); }
  };

  // ── Save edits ─────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      let existingId: number | null = null;
      try {
        const checkRes = await axios.get(
          `http://127.0.0.1:8000/api/building-clearances?search=${record.bcert_number}`,
          { withCredentials: true }
        );
        const records = checkRes.data.data.data;
        if (records?.length > 0) existingId = records[0].id;
      } catch (error) { console.error('Check existing failed:', error); }

      if (existingId) {
        await axios.put(
          `http://127.0.0.1:8000/api/building-clearances/${existingId}`,
          { ...formData },
          { withCredentials: true }
        );
        toast({ title: 'Success', description: 'Record updated successfully' });
        setIsEditing(false);
        onUpdate();
      } else {
        toast({ title: 'Error', description: 'Record not found', variant: 'destructive' });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const s = error.response?.status;
        if (s === 422) {
          const errs = error.response?.data?.errors;
          if (errs) Object.values(errs).forEach((m: any) => m[0] && toast({ title: 'Validation Error', description: m[0], variant: 'destructive' }));
        } else if (s === 401) {
          toast({ title: 'Error', description: 'You are not authenticated.', variant: 'destructive' });
        } else if (s === 403) {
          toast({ title: 'Error', description: 'You are not allowed to perform this action.', variant: 'destructive' });
        } else {
          toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Error', description: 'Network error.', variant: 'destructive' });
      }
    } finally { setIsSaving(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // ── Field renderer ─────────────────────────────────────────────────────────
  const Field = ({ label, name, type = 'text', options, isTextArea = false }: any) => {
    const value = formData[name] || '';
    if (isEditing) {
      if (type === 'select' && options) {
        return (
          <select name={name} value={value} onChange={handleInputChange}
            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Select {label}</option>
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      }
      if (isTextArea) {
        return (
          <textarea name={name} value={value} onChange={handleInputChange} rows={3}
            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        );
      }
      return (
        <input type={type} name={name} value={value} onChange={handleInputChange}
          className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      );
    }
    return <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{value || '—'}</p>;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-lg border border-gray-200 max-w-4xl w-full p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* ── Modal Header ── */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Building Clearance Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">Reference: {record.bcert_number}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                  Cancel
                </button>
                <button onClick={handleUpdate} disabled={isSaving}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50">
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>
              {[
                { label: 'First Name', name: 'first_name' },
                { label: 'Middle Name', name: 'middle_name' },
                { label: 'Surname', name: 'surname' },
                { label: 'Extension Name', name: 'ext_name' },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">{f.label}</label>
                  <Field {...f} />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Prefix</label>
                <Field label="Prefix" name="prefix" type="select" options={['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Atty.']} />
              </div>
            </div>

            {/* Property/Establishment Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Property Information</h3>
              {[
                { label: 'Establishment', name: 'establishment' },
                { label: 'House/Block/Lot No.', name: 'house_block_lot_no' },
                { label: 'Street', name: 'street' },
                { label: 'Zone', name: 'zone' },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">{f.label}</label>
                  <Field {...f} />
                </div>
              ))}
            </div>

            {/* Document Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Document Information</h3>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Purpose</label>
                <Field label="Purpose" name="purpose" type="select" options={PURPOSE_OPTIONS} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Purpose Details</label>
                <Field label="Purpose Details" name="purpose_details" isTextArea />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">OR No.</label>
                <Field label="OR No." name="or_no" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Status</label>
                <div className="mt-1"><StatusBadge status={currentStatus} /></div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Created By</label>
                <p className="text-sm text-gray-700 mt-1">{formData.created_by || '—'}</p>
              </div>
            </div>

            {/* Schedule & Remarks */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Schedule & Remarks</h3>
              {(record as any).schedule && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule Date</label>
                    <p className="text-sm text-gray-700 mt-1">{new Date((record as any).schedule.schedule_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule Time</label>
                    <p className="text-sm text-gray-700 mt-1">{(record as any).schedule.schedule_time}</p>
                  </div>
                  {(record as any).schedule.note && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule Note</label>
                      <p className="text-sm text-gray-700 mt-1">{(record as any).schedule.note}</p>
                    </div>
                  )}
                </>
              )}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Remarks</label>
                <Field label="Remarks" name="remarks" isTextArea />
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer — action buttons live here ── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-3">

            {/* Status action buttons (left side) */}
            <div className="flex items-center gap-2">
              {canMarkToPay && (
                <button
                  onClick={handleMarkToPay}
                  disabled={actionLoading === 'to_pay'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  {actionLoading === 'to_pay' ? 'Updating...' : 'Mark as To Pay'}
                </button>
              )}
              {canMarkAsPaid && (
                <button
                  onClick={handleMarkAsPaid}
                  disabled={actionLoading === 'paid'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  {actionLoading === 'paid' ? 'Updating...' : 'Mark as Paid'}
                </button>
              )}
              {canRelease && (
                <button
                  onClick={handleRelease}
                  disabled={actionLoading === 'release'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  {actionLoading === 'release' ? 'Releasing...' : 'Release Document'}
                </button>
              )}
              {!canMarkToPay && !canMarkAsPaid && !canRelease && (
                <p className="text-xs text-gray-400 italic">No actions available for current status.</p>
              )}
            </div>

            {/* Close button (right side) */}
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────
const DATE_PERIOD_LABELS: Record<string, string> = {
  this_week: 'This week', this_month: 'This month', this_year: 'This year',
};

function FilterBar({
  filters, onChange, onReset, activeCount, streets,
}: {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  activeCount: number;
  streets: Street[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border ${
            activeCount > 0 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          } text-sm font-medium transition-all`}
          onClick={() => setOpen(v => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="bg-blue-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full inline-flex items-center justify-center px-1">
              {activeCount}
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {filters.status && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Status: <strong>{filters.status}</strong>
            <button onClick={() => onChange({ status: '' })} className="text-blue-400 hover:text-blue-600">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        {filters.schedule_filter && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Schedule: <strong>{filters.schedule_filter === 'scheduled' ? 'Scheduled' : 'Not yet scheduled'}</strong>
            <button onClick={() => onChange({ schedule_filter: '' })} className="text-blue-400 hover:text-blue-600">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        {filters.filter_date && filters.filter_date !== 'custom' && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Created: <strong>{DATE_PERIOD_LABELS[filters.filter_date]}</strong>
            <button onClick={() => onChange({ filter_date: '', from: '', to: '' })} className="text-blue-400 hover:text-blue-600">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        {filters.filter_date === 'custom' && (filters.from || filters.to) && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Created: <strong>{filters.from || '…'} → {filters.to || '…'}</strong>
            <button onClick={() => onChange({ filter_date: '', from: '', to: '' })} className="text-blue-400 hover:text-blue-600">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        {filters.zone && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Zone: <strong>{filters.zone}</strong>
            <button onClick={() => onChange({ zone: '' })} className="text-blue-400 hover:text-blue-600">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        {filters.street && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Street: <strong>{filters.street}</strong>
            <button onClick={() => onChange({ street: '' })} className="text-blue-400 hover:text-blue-600">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        {filters.purpose && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Purpose: <strong>{filters.purpose}</strong>
            <button onClick={() => onChange({ purpose: '' })} className="text-blue-400 hover:text-blue-600">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        {activeCount > 0 && (
          <button className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1" onClick={onReset}>
            <RotateCcw className="h-3 w-3" /> Reset all
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full right-0 mt-2 min-w-[600px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="grid grid-cols-2">
            <div className="p-4 border-r border-b border-gray-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {(['', 'PENDING', 'SCHEDULED', 'ENCODED', 'TO_PAY', 'PAID', 'RELEASED', 'REJECTED', 'INCOMPLETE', 'APPROVED'] as const).map(v => (
                  <button
                    key={v}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                      filters.status === v
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => onChange({ status: v })}
                  >
                    {v === '' ? 'All' : v === 'TO_PAY' ? 'TO PAY' : v.charAt(0) + v.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-l border-b border-gray-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Schedule</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { v: '', label: 'All' },
                  { v: 'scheduled', label: 'Scheduled', icon: <CalendarCheck className="h-3 w-3" /> },
                  { v: 'not_scheduled', label: 'Not yet scheduled', icon: <CalendarX className="h-3 w-3" /> },
                ].map(opt => (
                  <button
                    key={opt.v}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                      filters.schedule_filter === opt.v
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => onChange({ schedule_filter: opt.v })}
                  >
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-r border-b border-gray-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Created At</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { v: '', label: 'Any time' },
                  { v: 'this_week', label: 'This week' },
                  { v: 'this_month', label: 'This month' },
                  { v: 'this_year', label: 'This year' },
                  { v: 'custom', label: 'Custom range' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                      filters.filter_date === opt.v
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => onChange({ filter_date: opt.v, from: '', to: '' })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {filters.filter_date === 'custom' && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="date" className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded-md" value={filters.from}
                    onChange={e => onChange({ from: e.target.value })} />
                  <span className="text-xs text-gray-500">to</span>
                  <input type="date" className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded-md" value={filters.to}
                    onChange={e => onChange({ to: e.target.value })} />
                </div>
              )}
            </div>

            <div className="p-4 border-l border-b border-gray-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Zone</label>
              <input
                type="text"
                placeholder="e.g. Zone 1, Zone 2…"
                className="w-full h-8 px-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400"
                value={filters.zone}
                onChange={e => onChange({ zone: e.target.value })}
              />
            </div>

            <div className="p-4 border-r border-gray-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Street</label>
              <select
                className="w-full h-8 px-2 text-sm border border-gray-200 rounded-md bg-white cursor-pointer focus:outline-none focus:border-blue-400"
                value={filters.street}
                onChange={e => onChange({ street: e.target.value })}
              >
                <option value="">All streets</option>
                {streets.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div className="p-4 border-l border-gray-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Purpose</label>
              <select
                className="w-full h-8 px-2 text-sm border border-gray-200 rounded-md bg-white cursor-pointer focus:outline-none focus:border-blue-400"
                value={filters.purpose}
                onChange={e => onChange({ purpose: e.target.value })}
              >
                <option value="">All purposes</option>
                {PURPOSE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-3 bg-gray-50 border-t border-gray-200">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-100" onClick={onReset}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset filters
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700" onClick={() => setOpen(false)}>
              Apply & close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const BuildingClearance = () => {
  const { toast }         = useToast();
  const navigate          = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchValue, setSearchValueRaw] = useState(() => searchParams.get('search') ?? '');
  const [currentPage, setCurrentPageRaw] = useState(() => Number(searchParams.get('page') ?? '1'));
  const [filters, setFiltersRaw]         = useState<FilterState>(() => filtersFromParams(searchParams));

  const [data, setData]               = useState<BuildingClearanceType[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [sortField, setSortField]     = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [streets, setStreets]         = useState<Street[]>([]);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<BuildingClearanceType | null>(null);

  const syncToUrl = useCallback((
    nextSearch: string,
    nextPage: number,
    nextFilters: FilterState,
  ) => {
    const p = buildParams(nextFilters, nextSearch, nextPage);
    setSearchParams(p, { replace: true });
  }, [setSearchParams]);

  const setSearchValue = (val: string) => {
    setSearchValueRaw(val);
    setCurrentPageRaw(1);
    syncToUrl(val, 1, filters);
  };

  const setCurrentPage = (page: number) => {
    setCurrentPageRaw(page);
    syncToUrl(searchValue, page, filters);
  };

  const setFilters = (next: FilterState | ((prev: FilterState) => FilterState)) => {
    setFiltersRaw(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      setCurrentPageRaw(1);
      syncToUrl(searchValue, 1, resolved);
      return resolved;
    });
  };

  useEffect(() => {
    setSearchValueRaw(searchParams.get('search') ?? '');
    setCurrentPageRaw(Number(searchParams.get('page') ?? '1'));
    setFiltersRaw(filtersFromParams(searchParams));
  }, [searchParams.toString()]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('api/streets', { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) { console.error('Failed to fetch streets:', e); }
    };
    load();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchClearanceParams & Record<string, any> = {
        page:         currentPage,
        pageSize:     15,
        search:       searchValue || undefined,
        sortField,
        sortDirection,
        ...(filters.status                                           ? { status:      filters.status }      : {}),
        ...(filters.filter_date && filters.filter_date !== 'custom' ? { filter_date: filters.filter_date } : {}),
        ...(filters.filter_date === 'custom' && filters.from        ? { from:        filters.from }        : {}),
        ...(filters.filter_date === 'custom' && filters.to          ? { to:          filters.to }          : {}),
        ...(filters.zone                                            ? { zone:        filters.zone }        : {}),
        ...(filters.street                                          ? { street:      filters.street }      : {}),
        ...(filters.purpose                                         ? { purpose:     filters.purpose }     : {}),
        ...(filters.schedule_filter                                 ? { schedule_filter: filters.schedule_filter } : {}),
      };

      const response = await fetchBuildingClearances(params);
      const rows = response.data as any[];
      setData(rows);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchValue, sortField, sortDirection, filters, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this building clearance?')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/building-clearances/${id}`, { withCredentials: true });
      toast({ title: 'Deleted', description: 'Building clearance deleted successfully.' });
      loadData();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete building clearance.', variant: 'destructive' });
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const handleRefresh = () => {
    loadData();
    toast({ title: 'Refreshed', description: 'Data has been refreshed' });
  };

  const activeFilterCount = countActiveFilters(filters);

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-blue-600' : 'opacity-40'}`} />
      </div>
    </th>
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Building Clearance</h1>
              <p className="text-sm text-gray-500 mt-1">Manage building clearance records</p>
            </div>
            <div className="flex items-center gap-2">
              <Button className="gap-2" onClick={() => navigate('/document-edit/3')}>
                <Plus className="h-4 w-4" />
                New Clearance
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-2 flex-wrap" style={{ position: 'relative', zIndex: 40 }}>
            <div className="flex-1 min-w-[200px]">
              <ClearanceSearchBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onRefresh={handleRefresh}
              />
            </div>
            <FilterBar
              filters={filters}
              onChange={patch => setFilters(prev => ({ ...prev, ...patch }))}
              onReset={() => setFilters(EMPTY_FILTERS)}
              activeCount={activeFilterCount}
              streets={streets}
            />
          </div>

          {(activeFilterCount > 0 || searchValue) && !isLoading && (
            <p className="text-xs text-gray-500 mb-3 mt-1">
              Showing <strong className="text-gray-900">{total}</strong> result{total !== 1 ? 's' : ''}
              {activeFilterCount > 0 && <> with <strong className="text-gray-900">{activeFilterCount}</strong> active filter{activeFilterCount !== 1 ? 's' : ''}</>}
              {searchValue && <> for <strong className="text-gray-900">"{searchValue}"</strong></>}
            </p>
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
                <Filter className="h-9 w-9 opacity-25" />
                <p className="text-sm font-medium">No records match your filters.</p>
                {(activeFilterCount > 0 || searchValue) && (
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => { setFilters(EMPTY_FILTERS); setSearchValue(''); }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="w-5 py-3 pl-3" />
                      <SortHeader field="surname">Full Name</SortHeader>
                      <SortHeader field="bcert_number">BCert No.</SortHeader>
                      <SortHeader field="created_at">Issue Date</SortHeader>
                      <SortHeader field="establishment">Establishment</SortHeader>
                      <SortHeader field="status">Status</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Schedule
                        </div>
                      </th>
                      <SortHeader field="purpose">Purpose</SortHeader>
                      <SortHeader field="street">Address</SortHeader>
                      <SortHeader field="or_no">OR No.</SortHeader>
                      <SortHeader field="created_by">Created By</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map(item => {
                      const isNew = isNewRequest((item as any).created_at);
                      return (
                        <tr key={item.id} className={`${isNew ? 'bg-blue-50/30' : ''} hover:bg-gray-50 transition-colors`}>
                          <td className="pl-3 pr-0 py-3">
                            {isNew && <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" title="New request (< 24h)" />}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-blue-600 whitespace-nowrap">
                            {`${item.first_name} ${item.middle_name ?? ''} ${item.surname}`.trim()}
                          </td>
                          <td className="py-3 px-4 text-sm font-mono text-blue-600">{item.bcert_number}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span>{formatCreatedAt((item as any).created_at)}</span>
                              {isNew && <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">New</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">{item.establishment ?? '—'}</td>
                          <td className="py-3 px-4"><StatusBadge status={item.status} /></td>
                          <td className="py-3 px-4"><ScheduleCell schedule={(item as any).schedule ?? null} /></td>
                          <td className="py-3 px-4 text-sm text-gray-600">{item.purpose ?? '—'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {[item.house_block_lot_no, item.street, item.zone].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{item.or_no ?? '—'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{item.created_by ?? '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => setSelectedDetailRecord(item)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap"
                              >
                                <Eye className="h-3 w-3" /> View/Edit
                              </button>
                              <button
                                onClick={() => navigate(`/document-edit/3/${item.bcert_number}`)}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap"
                              >
                                Preview
                              </button>
                              <button
                                onClick={() => navigate(`/document-edit/3/${item.bcert_number}`, { state: { autoPrint: true } })}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap"
                              >
                                Print
                              </button>
                              <button
                                onClick={() => handleDelete(Number(item.id))}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors whitespace-nowrap"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ClearancePagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {selectedDetailRecord && (
        <EditableDetailModal
          record={selectedDetailRecord}
          onClose={() => setSelectedDetailRecord(null)}
          onUpdate={loadData}
          toast={toast}
        />
      )}
    </Layout>
  );
};

export default BuildingClearance;