import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Plus, ArrowUpDown, CalendarCheck, CalendarX, Calendar, RefreshCw, X,
  Filter, ChevronDown, SlidersHorizontal, RotateCcw, Eye, Edit2, Save, CreditCard, Mail, Download,
  IdCard, ZoomIn, FileQuestion, Loader2, QrCode, Camera, Ban, Archive,
  CalendarClock, Clock, AlertTriangle, History, Lock, Send, Sun, Moon,
  CheckCircle, PlayCircle,
} from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";
import { Button } from '@/components/ui/button';
import { ClearanceSearchBar } from '@/components/clearance/ClearanceSearchBar';
import { ClearancePagination } from '@/components/clearance/ClearancePagination';
import { fetchBarangayClearances, FetchClearanceParams, deleteBarangayClearance } from '@/components/services/clearanceApi';
import { BarangayClearance as BarangayClearanceType } from '@/types/clearance';
import { useToast } from '@/hooks/use-toast';
import { Layout } from "@/components/Layout";
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { fetchUserById, getUserFullName } from '@/components/services/userApi';

interface StreetOption {
  id: number;
  name: string;
  zone?: string;
  formerly?: string;
}

const ZONE_OPTIONS = [
  'Sitio 1','Sitio 2','Sitio 3','Sitio 4','Sitio 5',
  'Sitio 6','Sitio 7','Sitio 8','Sitio 9','Sitio 10',
];

console.log(import.meta.env.VITE_WEB_URL);

// ─── Schedule History Entry ────────────────────────────────────────────────────
interface ScheduleHistoryEntry {
  schedule_date: string;
  schedule_time: string;
  missed_at: string;
  note?: string | null;
}

interface ScheduleData {
  id: number;
  document_type: string;
  document_number: string;
  schedule_date: string;
  schedule_time: string;
  note?: string | null;
  status?: string;
  user_id?: number;
  missed_history?: ScheduleHistoryEntry[];
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
  'Employment','Business','Travel','Legal Purposes',
  'School Requirement','Bank Transaction','Other','Government Transaction',
];

const FILTER_PARAM_KEYS: Record<keyof FilterState, string> = {
  status: 'status', filter_date: 'date', from: 'from', to: 'to',
  zone: 'zone', street: 'street', purpose: 'purpose', schedule_filter: 'schedule',
};

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

function buildParams(filters: FilterState, search: string, page: number): URLSearchParams {
  const p = new URLSearchParams();
  if (search)   p.set('search', search);
  if (page > 1) p.set('page', String(page));
  (Object.keys(FILTER_PARAM_KEYS) as (keyof FilterState)[]).forEach(key => {
    const val = filters[key];
    if (val) p.set(FILTER_PARAM_KEYS[key], val);
  });
  return p;
}

const api = axios.create({
  baseURL: 'https://westrembomis.onrender.com',
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

function formatTimeRange(timeStr: string) {
  try {
    const [hStr, mStr] = timeStr.split(':');
    const startH = parseInt(hStr, 10);
    const endH = startH + 1;
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
    const d = new Date(raw);
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

// ─── Session-based No-Show helpers ─────────────────────────────────────────────
const AM_SESSION_END_HOUR = 12;
const PM_SESSION_END_HOUR = 17;

function getScheduleSession(schedule: ScheduleData | null | undefined): 'AM' | 'PM' | null {
  if (!schedule) return null;
  try {
    const [hStr] = schedule.schedule_time.split(':');
    const hour = parseInt(hStr, 10);
    return hour < 12 ? 'AM' : 'PM';
  } catch { return null; }
}

function getScheduleSessionLabel(schedule: ScheduleData | null | undefined): string {
  const s = getScheduleSession(schedule);
  if (s === 'AM') return 'Morning Session (until 12:00 NN)';
  if (s === 'PM') return 'Afternoon Session (until 5:00 PM)';
  return '';
}

function getScheduleSessionEnd(schedule: ScheduleData | null | undefined): Date | null {
  if (!schedule) return null;
  try {
    const session = getScheduleSession(schedule);
    if (!session) return null;
    const endHour = session === 'AM' ? AM_SESSION_END_HOUR : PM_SESSION_END_HOUR;
    const hh = String(endHour).padStart(2, '0');
    return new Date(`${schedule.schedule_date}T${hh}:00:00`);
  } catch { return null; }
}

function isSchedulePast(schedule: ScheduleData | null | undefined): boolean {
  const sessionEnd = getScheduleSessionEnd(schedule);
  if (!sessionEnd) return false;
  return sessionEnd < new Date();
}

/** Terminal statuses — a record in these states is considered "completed" */
const TERMINAL_STATUSES = new Set(['RELEASED','REJECTED','INCOMPLETE','ARCHIVED','DISABLED','EXPIRED']);
/** Frozen statuses — record is read-only and completely non-interactive (archived) */
const FROZEN_STATUSES = new Set(['ARCHIVED','DISABLED','EXPIRED']);
/** Blocked statuses — record cannot progress further (rejected / incomplete) */
const BLOCKED_STATUSES = new Set(['REJECTED','INCOMPLETE']);

function countActiveFilters(f: FilterState): number {
  return [
    f.status, f.filter_date,
    f.filter_date === 'custom' && f.from ? 'from' : '',
    f.zone, f.street, f.purpose, f.schedule_filter,
  ].filter(Boolean).length;
}

// ─── Status ordering ───────────────────────────────────────────────────────────
// PROCESS is inserted between REVIEW and PAID in the workflow.
const STATUS_ORDER: Record<string, number> = {
  'PENDING':      0,
  'RESCHEDULED':  0,
  'SCHEDULED':    1,
  'ENCODED':      2,
  'INSPECTING':   3,
  'REVIEW':       4,   // backend value
  'PROCESS':      5,   // backend value (between REVIEW and PAID)
  'PAID':         6,
  'RELEASED':     7,
  'INCOMPLETE':  -1,
  'REJECTED':    -1,
};

function isForwardTransition(current: string, next: string): boolean {
  const currentUpper = (current ?? '').toUpperCase();
  const nextUpper    = (next ?? '').toUpperCase();
  if (TERMINAL_STATUSES.has(currentUpper)) return false;
  const cur = STATUS_ORDER[currentUpper] ?? -1;
  const nxt = STATUS_ORDER[nextUpper] ?? -1;
  if (nxt === -1) return true;
  return nxt > cur;
}

const STATUS_STYLES: Record<string, string> = {
  pending:      'bg-yellow-100 text-yellow-800 border-yellow-200',
  rescheduled:  'bg-sky-100 text-sky-800 border-sky-200',
  incomplete:   'bg-orange-50 text-orange-700 border-orange-200',
  rejected:     'bg-rose-100 text-rose-800 border-rose-200',
  released:     'bg-green-100 text-green-800 border-green-200',
  scheduled:    'bg-blue-100 text-blue-800 border-blue-200',
  encoded:      'bg-emerald-50 text-emerald-800 border-emerald-200',
  to_pay:       'bg-purple-100 text-purple-800 border-purple-200',
  review:       'bg-purple-100 text-purple-800 border-purple-200',
  process:      'bg-indigo-100 text-indigo-800 border-indigo-200',
  paid:         'bg-teal-100 text-teal-800 border-teal-200',
  inspecting:   'bg-indigo-100 text-indigo-800 border-indigo-200',
  archived:     'bg-gray-200 text-gray-600 border-gray-300',
  disabled:     'bg-gray-200 text-gray-600 border-gray-300',
};

function normaliseStatus(raw: string | null | undefined, requesterType?: string): string {
  if (!raw) return '';
  if (raw.toUpperCase() === 'TO_PAY') return 'REVIEW';   // map TO_PAY → REVIEW
  if (raw.toUpperCase() === 'DISABLED') return 'ARCHIVED';
  if (
    requesterType?.toLowerCase() === 'walk-in' &&
    (raw.toUpperCase() === 'RESCHEDULED' || raw.toUpperCase() === 'SCHEDULED')
  ) {
    return 'PENDING';
  }
  return raw.toUpperCase();
}

function StatusBadge({ status, requesterType }: {
  status: string | null | undefined;
  requesterType?: string;
}) {
  if (!status) return <span className="text-gray-500 text-sm">—</span>;
  const display = normaliseStatus(status, requesterType);
  const key = display.toLowerCase();
  const style = STATUS_STYLES[key] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border w-fit ${style}`}>
      {display}
    </span>
  );
}

// ─── Smart priority sort ───────────────────────────────────────────────────────
function prioritySortData(items: BarangayClearanceType[]): BarangayClearanceType[] {
  const todayStr = new Date().toISOString().split('T')[0];
  function getRowPriority(item: any): number {
    const status = normaliseStatus(item.status ?? '', item.requester_type ?? '');
    if (FROZEN_STATUSES.has(status)) return 3;
    const schedule: ScheduleData | null = item.schedule ?? null;
    if (schedule && schedule.schedule_date === todayStr) return 0;
    return 1;
  }
  return [...items].sort((a, b) => {
    const pa = getRowPriority(a);
    const pb = getRowPriority(b);
    if (pa !== pb) return pa - pb;
    const ta = new Date((a as any).created_at ?? 0).getTime();
    const tb = new Date((b as any).created_at ?? 0).getTime();
    return tb - ta;
  });
}

// ─── ScheduleCell ──────────────────────────────────────────────────────────────
function ScheduleCell({
  schedule, requesterType, status,
}: {
  schedule: ScheduleData | null | undefined;
  requesterType?: string;
  status?: string;
}) {
  const statusUpper = (status ?? '').toUpperCase();
  if (requesterType?.toLowerCase() === 'walk-in') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-sm italic">
        No schedule required (Walk-in)
      </span>
    );
  }
  if (statusUpper === 'RESCHEDULED') {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border w-fit bg-sky-50 text-sky-700 border-sky-200">
          <CalendarClock className="h-3 w-3" />
          Awaiting Applicant
        </span>
        {schedule && (
          <span className="text-[10px] text-gray-400 pl-0.5 line-through">
            {formatDateShort(schedule.schedule_date)} · {formatTimeRange(schedule.schedule_time)}
          </span>
        )}
      </div>
    );
  }
  if (!schedule) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-sm">
        <CalendarX className="h-3 w-3" />
        Not yet scheduled
      </span>
    );
  }
  const isPast     = isSchedulePast(schedule);
  const session    = getScheduleSession(schedule);
  const isTerminal = TERMINAL_STATUSES.has(statusUpper);
  if (isPast && !isTerminal) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border w-fit bg-red-50 text-red-700 border-red-200">
          <CalendarX className="h-3 w-3" />
          No Show ({session === 'AM' ? 'Morning' : 'Afternoon'})
        </span>
        <span className="text-[10px] text-gray-400 pl-0.5 line-through">
          {formatDateShort(schedule.schedule_date)} · {session === 'AM' ? 'Morning' : 'Afternoon'} session
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border w-fit bg-green-100 text-green-800 border-green-200">
        <CalendarCheck className="h-3 w-3" />
        {formatDateShort(schedule.schedule_date)}
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 pl-0.5">
        {session === 'AM' ? <Sun className="h-2.5 w-2.5" /> : <Moon className="h-2.5 w-2.5" />}
        {session === 'AM' ? 'Morning' : 'Afternoon'} · {formatTimeRange(schedule.schedule_time)}
      </span>
    </div>
  );
}

// ─── Requester Type Label helper ───────────────────────────────────────────────
function getRequesterLabel(requesterType: string | null | undefined): {
  label: string;
  badgeClass: string;
} {
  const t = (requesterType ?? '').toLowerCase();
  if (t === 'walk-in') {
    return {
      label: 'Walk-in Applicant',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    };
  }
  if (t === 'online') {
    return {
      label: 'Online Applicant',
      badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    };
  }
  return {
    label: requesterType ?? '—',
    badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
  };
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.88)' }} onClick={onClose}>
      <button className="absolute top-4 right-4 p-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }} onClick={onClose}>
        <X className="h-5 w-5" />
      </button>
      <img src={url} alt="ID preview" className="max-h-[90vh] max-w-[90vw] object-contain rounded shadow-2xl" onClick={e => e.stopPropagation()} />
    </div>
  );
}

function IdImageCard({ label, url, onZoom }: { label: string; url: string | null; onZoom: (u: string) => void }) {
  if (!url) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 py-8">
        <FileQuestion className="h-7 w-7 text-gray-300" />
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="text-[10px] text-gray-300">Not uploaded</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <IdCard className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">{label}</span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm bg-green-100 text-green-700 border border-green-200">✓ On file</span>
      </div>
      <div className="relative group overflow-hidden bg-gray-100" style={{ height: 160, cursor: 'zoom-in' }} onClick={() => onZoom(url)}>
        <img src={url} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <ZoomIn className="h-6 w-6 text-white" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Click to enlarge</span>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-gray-100">
        <span className="text-[9px] text-gray-400 uppercase tracking-wider">View only · From documents</span>
        <button onClick={() => onZoom(url)} className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
          <Eye className="h-3 w-3" /> View full
        </button>
      </div>
    </div>
  );
}

function UserIdViewer({ userId, onZoom }: { userId?: number | string; onZoom: (url: string) => void }) {
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack,  setIdBack]  = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const run = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/mydocuments', { params: { user_id: userId } });
        const documents = data.data?.documents || {};
        let front: string | null = null;
        let back:  string | null = null;
        Object.values(documents).forEach((categoryDocs: any) => {
          (categoryDocs as any[]).forEach((doc: any) => {
            const url = doc.url ?? `https://westrembomis.onrender.com/uploads/${doc.original_filename}`;
            if (doc.type === 'valid_id_front') front = url;
            if (doc.type === 'valid_id_back')  back  = url;
          });
        });
        setIdFront(front);
        setIdBack(back);
      } catch (err) {
        console.error('Could not load user ID documents:', err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  return (
    <div className="col-span-1 md:col-span-2 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <IdCard className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900">Applicant's Registered ID</h3>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">View Only · From Documents</span>
      </div>
      {loading && (
        <div className="flex items-center gap-2 py-4 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading ID images…</span>
        </div>
      )}
      {!loading && !idFront && !idBack && (
        <div className="flex items-center gap-2 py-4 text-gray-400">
          <FileQuestion className="h-4 w-4" />
          <span className="text-xs">No ID images found for this applicant.</span>
        </div>
      )}
      {!loading && (idFront || idBack) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <IdImageCard label="Government ID — Front" url={idFront} onZoom={onZoom} />
          <IdImageCard label="Government ID — Back"  url={idBack}  onZoom={onZoom} />
        </div>
      )}
    </div>
  );
}

function QRScannerModal({ onClose, onScan }: { onClose: () => void; onScan: (result: string) => void }) {
  const scannerRef   = useRef<Html5Qrcode | null>(null);
  const containerId  = "qr-scanner-container-barangay";
  const [error, setError]       = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [scanned, setScanned]   = useState<string | null>(null);

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          setScanned(decodedText);
          setScanning(false);
        },
        undefined
      );
    } catch (err: any) {
      setError(err?.message ?? "Camera access denied or not available.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {});
    }
  };

  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, []);

  const handleScanAgain = async () => {
    setScanned(null);
    setScanning(true);
    setError(null);
    await stopScanner();
    setTimeout(() => startScanner(), 300);
  };

  const handleConfirm = () => {
    if (scanned) {
      stopScanner();
      onScan(scanned);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Scan QR Code</span>
          </div>
          <button onClick={() => { stopScanner(); onClose(); }} className="p-1 hover:bg-gray-100 rounded-md">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="relative bg-black" style={{ minHeight: 300 }}>
          <div id={containerId} className="w-full" />
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 px-6">
              <Camera className="h-8 w-8 text-gray-400" />
              <p className="text-xs text-gray-300 text-center">{error}</p>
            </div>
          )}
          {scanned && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-green-900/80">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">QR Detected</p>
              <p className="text-sm font-mono text-green-200 px-4 text-center break-all">{scanned}</p>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
          {scanned ? (
            <div className="flex gap-2">
              <button onClick={handleScanAgain} className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Scan Again</button>
              <button onClick={handleConfirm} className="flex-1 py-2 text-sm font-bold text-white rounded-lg transition-colors" style={{ backgroundColor: "#0f2a5e" }}>Search This QR</button>
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 text-center">
              {error ? "Camera access was denied. Please allow camera permissions and try again." : "Point your camera at the resident's QR code."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reschedule Request Modal ──────────────────────────────────────────────────
function RescheduleModal({
  record,
  missedSchedule,
  onClose,
  onSuccess,
  toast,
}: {
  record: BarangayClearanceType;
  missedSchedule: ScheduleData;
  onClose: () => void;
  onSuccess: () => void;
  toast: any;
}) {
  const [note, setNote]                 = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const session = getScheduleSession(missedSchedule);

  const handleSubmit = async () => {
    if (record.requester_type?.toLowerCase() === 'walk-in') {
      toast({ title: 'Not allowed', description: 'Walk-in requests cannot be rescheduled.', variant: 'destructive' });
      return;
    }
    const recordStatus = (record.status ?? '').toUpperCase();
    if (FROZEN_STATUSES.has(recordStatus) || BLOCKED_STATUSES.has(recordStatus) || recordStatus === 'RELEASED') {
      toast({ title: 'Not allowed', description: 'This record can no longer be rescheduled.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const missedEntry: ScheduleHistoryEntry = {
        schedule_date: missedSchedule.schedule_date,
        schedule_time: missedSchedule.schedule_time,
        missed_at:     new Date().toISOString(),
        note:          missedSchedule.note ?? null,
      };
      const existingHistory: ScheduleHistoryEntry[] = missedSchedule.missed_history ?? [];
      const updatedHistory = [...existingHistory, missedEntry];
      await axios.put(
        `https://westrembomis.onrender.com/api/schedules/${missedSchedule.id}`,
        { note: note.trim() || null, missed_history: updatedHistory },
        { withCredentials: true }
      );
      await axios.put(
        `https://westrembomis.onrender.com/api/barangay-clearances/${record.id}`,
        { status: 'RESCHEDULED' },
        { withCredentials: true }
      );
      toast({
        title: 'Reschedule request sent',
        description: 'The applicant has been notified to book a new appointment slot in their portal.',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message ?? 'Failed to send reschedule request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-100 rounded-md">
              <Send className="h-4 w-4 text-sky-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Send Reschedule Request</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Ref: {record.bcert_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="mx-5 mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex gap-3">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-700">Previous appointment was missed (No Show)</p>
            <p className="text-[11px] text-red-500 mt-0.5">
              {formatDateShort(missedSchedule.schedule_date)} · {session === 'AM' ? 'Morning' : 'Afternoon'} session
              ({formatTimeRange(missedSchedule.schedule_time)})
            </p>
            <p className="text-[10px] text-red-400 mt-1">This missed appointment will be logged in the record's history.</p>
          </div>
        </div>
        <div className="mx-5 mt-3 rounded-lg bg-sky-50 border border-sky-200 px-4 py-3">
          <p className="text-xs font-semibold text-sky-700 mb-1">How rescheduling works</p>
          <ul className="text-[11px] text-sky-700 leading-relaxed list-disc pl-4 space-y-0.5">
            <li>The applicant will be notified that their previous appointment was missed.</li>
            <li><strong>The applicant chooses</strong> the new date and session (morning or afternoon) through their own portal.</li>
            <li>Admins do not select the new slot. This request will appear here as <strong>RESCHEDULED</strong> until the applicant rebooks.</li>
          </ul>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Note to applicant <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please bring your original valid ID on your next visit…"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none transition-all"
            />
            <p className="text-[10px] text-gray-400 mt-1">This note will be shown to the applicant when they book a new slot.</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Sending…' : 'Send Reschedule Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Missed Schedule History Panel ─────────────────────────────────────────────
function MissedScheduleHistory({ history }: { history: ScheduleHistoryEntry[] }) {
  if (!history || history.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <History className="h-3.5 w-3.5 text-amber-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
          Missed Appointment History ({history.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {history.map((entry, idx) => {
          const session = getScheduleSession({ schedule_date: entry.schedule_date, schedule_time: entry.schedule_time } as any);
          return (
            <div key={idx} className="flex items-start gap-2 text-[11px] text-amber-800">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-200 text-amber-700 font-bold text-[9px] flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div>
                <span className="font-semibold">
                  {formatDateShort(entry.schedule_date)} · {session === 'AM' ? 'Morning' : 'Afternoon'} session
                </span>
                <span className="text-amber-500 ml-1.5">
                  — No show logged {formatCreatedAt(entry.missed_at)}
                </span>
                {entry.note && (
                  <p className="text-amber-600 mt-0.5 italic">Note: {entry.note}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Memoized Form Field Component ─────────────────────────────────────────────
const FormField = memo(({
  name, value, onChange, type = 'text', options, isTextArea = false, isEditing, label
}: any) => {
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);
  const inputId = `field-${name}`;
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      const timer = setTimeout(() => { inputRef.current?.focus(); }, 50);
      return () => clearTimeout(timer);
    }
  }, [isEditing, name]);

  if (type === 'select' && options) {
    return (
      <div>
        <label htmlFor={inputId} className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
        {isEditing ? (
          <select ref={inputRef as any} id={inputId} name={name} value={value} onChange={onChange}
            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
            <option value="">Select {label}</option>
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{value || '—'}</p>
        )}
      </div>
    );
  }
  if (isTextArea) {
    return (
      <div>
        <label htmlFor={inputId} className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
        {isEditing ? (
          <textarea ref={inputRef as any} id={inputId} name={name} value={value} onChange={onChange}
            rows={3} className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none" />
        ) : (
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{value || '—'}</p>
        )}
      </div>
    );
  }
  if (type === 'date') {
    return (
      <div>
        <label htmlFor={inputId} className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
        {isEditing ? (
          <input ref={inputRef as any} id={inputId} type="date" name={name} value={value} onChange={onChange}
            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" autoComplete="off" />
        ) : (
          <p className="text-sm text-gray-700 mt-1">{value ? new Date(value).toLocaleDateString() : '—'}</p>
        )}
      </div>
    );
  }
  if (type === 'number') {
    return (
      <div>
        <label htmlFor={inputId} className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
        {isEditing ? (
          <input ref={inputRef as any} id={inputId} type="number" name={name} value={value} onChange={onChange}
            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" autoComplete="off" />
        ) : (
          <p className="text-sm text-gray-700 mt-1">{value || '—'}</p>
        )}
      </div>
    );
  }
  return (
    <div>
      <label htmlFor={inputId} className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
      {isEditing ? (
        <input ref={inputRef as any} id={inputId} type={type} name={name} value={value} onChange={onChange}
          className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" autoComplete="off" />
      ) : (
        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{value || '—'}</p>
      )}
    </div>
  );
});
FormField.displayName = 'FormField';

// ─── Editable Detail Modal ─────────────────────────────────────────────────────
function EditableDetailModal({
  record, onClose, onUpdate, toast,
}: {
  record: BarangayClearanceType | null;
  onClose: () => void;
  onUpdate: () => void;
  toast: any;
}) {
  const [isEditing, setIsEditing]         = useState(false);
  const [isSaving, setIsSaving]           = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [lightboxUrl, setLightboxUrl]     = useState<string | null>(null);
  const [initialReleasedPath, setInitialReleasedPath] = useState<string | null>(null);
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [dispositionType, setDispositionType]           = useState<'REJECTED' | 'INCOMPLETE' | null>(null);
  const [dispositionReason, setDispositionReason]       = useState('');
  const [isDisposing, setIsDisposing]                   = useState(false);
  const [streets, setStreets] = useState<Street[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleData | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isArchiving, setIsArchiving]               = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [createdByName, setCreatedByName]     = useState<string>('');
  const [loadingCreatedBy, setLoadingCreatedBy] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string>('');

  useEffect(() => {
    const loadStreets = async () => {
      try {
        const res = await axios.get("https://westrembomis.onrender.com/api/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) { console.error("Failed to fetch streets:", e); }
    };
    loadStreets();
  }, []);

  const [formData, setFormData] = useState<any>({
    first_name: '', middle_name: '', surname: '', ext_name: '',
    dob: '', pob: '', contact_no: '', email: '', prefix: '',
    zone: '', street: '', house_block_lot_no: '',
    period_of_residency: '', house_owner: '', relationship_to_owner: '',
    registered_voter: '', purpose: '', purpose_details: '',
    status: '', requester_type: '', remarks: '',
    bcert_number: '', created_by: '',
    issued_on: '', issued_at: '', issued_date: '',
    ctc_vrr_no: '', or_no: '',
    punong_barangay: '', for_the_punong_barangay: '', barangay_position: '',
    rejection_reason: '', created_at: '', previous_status: '',
  });

  // Lazy-load the creator's full name
  useEffect(() => {
    const loadCreatorName = async () => {
      const userId = formData.created_by;
      if (!userId) { setCreatedByName('—'); return; }
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      if (isNaN(userIdNum)) { setCreatedByName('—'); return; }
      setLoadingCreatedBy(true);
      try {
        const user = await fetchUserById(userIdNum);
        setCreatedByName(getUserFullName(user));
      } catch {
        setCreatedByName('—');
      } finally {
        setLoadingCreatedBy(false);
      }
    };
    loadCreatorName();
  }, [formData.created_by]);

  const fetchFullRecord = useCallback(async () => {
    if (!record) return;
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://westrembomis.onrender.com/api/barangay-clearances?search=${record.bcert_number}`,
        { withCredentials: true }
      );
      const full = response.data.data.data[0];
      const normalisedStatus = normaliseStatus(full.status ?? '', full.requester_type ?? '');
      setCurrentStatus(normalisedStatus);
      setInitialReleasedPath(full.released_document_path ?? null);
      setCurrentSchedule(full.schedule ?? null);
      setPreviousStatus(full.previous_status || normalisedStatus);
      
      if (
        full.requester_type?.toLowerCase() === 'walk-in' &&
        (full.status?.toUpperCase() === 'RESCHEDULED' || full.status?.toUpperCase() === 'SCHEDULED')
      ) {
        axios.put(
          `https://westrembomis.onrender.com/api/barangay-clearances/${full.id}`,
          { status: 'PENDING' },
          { withCredentials: true }
        ).catch(() => {});
      }
      setFormData({
        first_name:               full.first_name               || '',
        middle_name:              full.middle_name              || '',
        surname:                  full.surname                  || '',
        ext_name:                 full.ext_name                 || '',
        dob:                      full.dob ? full.dob.split('T')[0] : '',
        pob:                      full.pob                      || '',
        contact_no:               full.contact_no               || '',
        email:                    full.email                    || '',
        prefix:                   full.prefix                   || '',
        zone:                     full.zone                     || '',
        street:                   full.street                   || '',
        house_block_lot_no:       full.house_block_lot_no       || '',
        period_of_residency:      full.period_of_residency      || '',
        house_owner:              full.house_owner              || '',
        relationship_to_owner:    full.relationship_to_owner    || '',
        registered_voter:         full.registered_voter         || '',
        purpose:                  full.purpose                  || '',
        purpose_details:          full.purpose_details          || '',
        status:                   normalisedStatus,
        requester_type:           full.requester_type           || '',
        remarks:                  full.remarks                  || '',
        bcert_number:             full.bcert_number             || '',
        created_by:               full.created_by               || '',
        issued_on:                full.issued_on                || '',
        issued_at:                full.issued_at                || '',
        issued_date:              full.issued_date              || '',
        ctc_vrr_no:               full.ctc_vrr_no               || '',
        or_no:                    full.or_no                    || '',
        punong_barangay:          full.punong_barangay          || '',
        for_the_punong_barangay:  full.for_the_punong_barangay  || '',
        barangay_position:        full.barangay_position        || '',
        rejection_reason:         full.rejection_reason         || '',
        created_at:               full.created_at               || '',
        previous_status:          full.previous_status          || normalisedStatus,
      });
    } catch (error) {
      console.error('Error fetching full record:', error);
      toast({ title: 'Error', description: 'Failed to load record details', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [record, toast]);

  useEffect(() => { fetchFullRecord(); }, [fetchFullRecord, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({ title: 'Refreshed', description: 'Record data has been refreshed' });
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [releasedPath,  setReleasedPath]  = useState<string | null>(null);
  
  useEffect(() => {
    if (initialReleasedPath) setReleasedPath(initialReleasedPath);
  }, [initialReleasedPath]);

  const hasReleasedDocument = !!releasedPath;

  if (!record) return null;

  const status = currentStatus.toUpperCase();
  const isReleased       = status === 'RELEASED';
  const isArchived       = FROZEN_STATUSES.has(status);
  const isBlocked        = BLOCKED_STATUSES.has(status);
  const isNonEditable    = isArchived || isBlocked;
  const isWorkflowFrozen = isReleased || isArchived || isBlocked;

  // ── Workflow capability flags ──
  const canMarkProcess =
    !isWorkflowFrozen &&
    isForwardTransition(status, 'PROCESS') &&
    (status === 'REVIEW' || status === 'PENDING');
  const canMarkToInspection = !isWorkflowFrozen &&
    isForwardTransition(status, 'INSPECTING') &&
    (status === 'ENCODED' || status === 'SCHEDULED' || status === 'RESCHEDULED');
  const canDispose = !isWorkflowFrozen && !TERMINAL_STATUSES.has(status) && status !== 'PROCESS';
  const canArchive = isReleased && !isArchived;
  const canEdit = !isArchived;
  const isAwaitingReschedule = status === 'RESCHEDULED';
  const isNoShow =
    currentSchedule !== null &&
    isSchedulePast(currentSchedule) &&
    !TERMINAL_STATUSES.has(status) &&
    !isAwaitingReschedule &&
    formData.requester_type?.toLowerCase() !== 'walk-in';
  const canReschedule = isNoShow && !isWorkflowFrozen;
  const missedHistory: ScheduleHistoryEntry[] = currentSchedule?.missed_history ?? [];

  // ── Restore/Unarchive Function ──
  const handleRestore = async () => {
    if (!isArchived) {
      toast({ title: 'Not allowed', description: 'Only archived records can be restored.', variant: 'destructive' });
      return;
    }
    
    setIsArchiving(true);
    try {
      await axios.put(
        `https://westrembomis.onrender.com/api/barangay-clearances/${record.id}`,
        { status: 'RELEASED' },
        { withCredentials: true }
      );
      setCurrentStatus('RELEASED');
      setFormData((p: any) => ({ ...p, status: 'RELEASED' }));
      toast({ title: 'Restored', description: 'Record restored to Released status successfully.' });
      setShowRestoreConfirm(false);
      onUpdate();
      setTimeout(() => onClose(), 500);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message ?? 'Failed to restore record.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  // ── Action: Mark as Process (REVIEW → PROCESS) ──
  const handleMarkProcess = async () => {
    if (!isForwardTransition(status, 'PROCESS')) {
      toast({ title: 'Not allowed', description: 'Cannot skip or revert workflow steps.', variant: 'destructive' });
      return;
    }
    setActionLoading('processing');
    try {
      await axios.put(
        `https://westrembomis.onrender.com/api/barangay-clearances/${record.id}`,
        { status: 'PROCESS' },
        { withCredentials: true }
      );
      setCurrentStatus('PROCESS');
      setFormData((p: any) => ({ ...p, status: 'PROCESS' }));
      toast({ title: 'Success', description: 'Status updated to Process.' });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to update status.', variant: 'destructive' });
    } finally { setActionLoading(null); }
  };

  const handleMarkToInspection = async () => {
    if (!isForwardTransition(status, 'INSPECTING')) {
      toast({ title: 'Not allowed', description: 'Cannot revert status.', variant: 'destructive' });
      return;
    }
    setActionLoading('inspection');
    try {
      await axios.put(
        `https://westrembomis.onrender.com/api/barangay-clearances/${record.id}`,
        { status: 'INSPECTING' },
        { withCredentials: true }
      );
      setCurrentStatus('INSPECTING');
      setFormData((p: any) => ({ ...p, status: 'INSPECTING' }));
      toast({ title: 'Success', description: 'Status set to Inspecting successfully.' });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to update status.', variant: 'destructive' });
    } finally { setActionLoading(null); }
  };

  const handleDisposition = async () => {
    if (!record?.id || !dispositionType) return;
    if (!dispositionReason.trim()) {
      toast({ title: 'Reason required', description: 'Please provide a reason before submitting.', variant: 'destructive' });
      return;
    }
    if (!canDispose) {
      toast({ title: 'Not allowed', description: 'This record can no longer be modified.', variant: 'destructive' });
      return;
    }
    setIsDisposing(true);
    try {
      await axios.post(
        `https://westrembomis.onrender.com/api/barangay-clearances/${record.id}/disposition`,
        { status: dispositionType, reason: dispositionReason.trim() },
        { withCredentials: true }
      );
      const label = dispositionType === 'REJECTED' ? 'Rejected' : 'Marked as Incomplete';
      setCurrentStatus(dispositionType);
      setFormData((p: any) => ({ ...p, status: dispositionType }));
      toast({ title: 'Success', description: `Record ${label} successfully.` });
      setShowDispositionModal(false);
      setDispositionReason('');
      setDispositionType(null);
      onUpdate();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message ?? 'Failed to update disposition.',
        variant: 'destructive',
      });
    } finally { setIsDisposing(false); }
  };

  const openDisposition = (type: 'REJECTED' | 'INCOMPLETE') => {
    if (!canDispose) {
      toast({ title: 'Not allowed', description: 'This record can no longer be modified.', variant: 'destructive' });
      return;
    }
    setDispositionType(type);
    setDispositionReason('');
    setShowDispositionModal(true);
  };

  const handleArchive = async () => {
    if (!isReleased) {
      toast({ title: 'Not allowed', description: 'Only released records can be archived.', variant: 'destructive' });
      return;
    }
    setIsArchiving(true);
    try {
      await axios.put(
        `https://westrembomis.onrender.com/api/barangay-clearances/${record.id}`,
        { 
          status: 'ARCHIVED',
          previous_status: status
        },
        { withCredentials: true }
      );
      setCurrentStatus('ARCHIVED');
      setFormData((p: any) => ({ ...p, status: 'ARCHIVED', previous_status: status }));
      toast({ title: 'Archived', description: 'Record archived successfully.' });
      setShowArchiveConfirm(false);
      onUpdate();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message ?? 'Failed to archive record.',
        variant: 'destructive',
      });
    } finally { setIsArchiving(false); }
  };

  const handleRescheduleSuccess = () => {
    setCurrentStatus('RESCHEDULED');
    setFormData((p: any) => ({ ...p, status: 'RESCHEDULED' }));
    setRefreshKey(prev => prev + 1);
    onUpdate();
  };

  const downloadReleased = async () => {
    if (!record?.id) {
      toast({ title: 'Error', description: 'No record to download.', variant: 'destructive' });
      return;
    }
    setIsDownloading(true);
    try {
      const res = await axios.get(
        `https://westrembomis.onrender.com/api/documents/release/barangay-clearances/${record.id}/download`,
        { withCredentials: true }
      );
      const url = res.data?.data?.url;
      if (!url) throw new Error('No download URL returned.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message ?? 'Failed to get download link.',
        variant: 'destructive',
      });
    } finally { setIsDownloading(false); }
  };

  const handleUpdate = async () => {
    if (isArchived) {
      toast({ title: 'Not allowed', description: 'Archived records cannot be edited.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      let existingId: number | null = null;
      try {
        const checkRes = await axios.get(
          `https://westrembomis.onrender.com/api/barangay-clearances?search=${record.bcert_number}`,
          { withCredentials: true }
        );
        const records = checkRes.data.data.data;
        if (records?.length > 0) existingId = records[0].id;
      } catch (error) { console.error('Check existing failed:', error); }
      if (existingId) {
        await axios.put(
          `https://westrembomis.onrender.com/api/barangay-clearances/${existingId}`,
          { ...formData },
          { withCredentials: true }
        );
        toast({ title: 'Success', description: 'Record updated successfully' });
        setIsEditing(false);
        onUpdate();
        handleRefresh();
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isArchived) return;
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, [isArchived]);

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

  const blockedLabel = status === 'REJECTED' ? 'Rejected' : status === 'INCOMPLETE' ? 'Incomplete' : '';
  const session = getScheduleSession(currentSchedule);
  const requesterInfo = getRequesterLabel(formData.requester_type);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-lg border border-gray-200 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          {isArchived && (
            <div className="bg-gray-100 border-b border-gray-300 px-6 py-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Archived Record</span>
              <span className="text-xs text-gray-500 ml-1">— This record is locked. All actions, edits, and status updates are disabled.</span>
            </div>
          )}
          {isBlocked && !isArchived && (
            <div className={`border-b px-6 py-3 flex items-center gap-2 ${
              status === 'REJECTED' ? 'bg-rose-50 border-rose-200' : 'bg-orange-50 border-orange-200'
            }`}>
              <Ban className={`h-4 w-4 ${status === 'REJECTED' ? 'text-rose-500' : 'text-orange-500'}`} />
              <span className={`text-sm font-semibold uppercase tracking-wide ${
                status === 'REJECTED' ? 'text-rose-700' : 'text-orange-700'
              }`}>
                {blockedLabel} — workflow halted
              </span>
              <span className={`text-xs ml-1 ${status === 'REJECTED' ? 'text-rose-500' : 'text-orange-500'}`}>
                — This request cannot progress to the next step. All workflow actions are disabled.
              </span>
            </div>
          )}
          {isAwaitingReschedule && !isArchived && !isReleased && !isBlocked && (
            <div className="bg-sky-50 border-b border-sky-200 px-6 py-3 flex items-center gap-3">
              <CalendarClock className="h-4 w-4 text-sky-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-sky-700">Awaiting applicant to book a new appointment slot</p>
                <p className="text-[11px] text-sky-600 mt-0.5">
                  The applicant chooses the new date and session through their own portal. The status will return to <strong>SCHEDULED</strong> automatically once they rebook.
                </p>
              </div>
            </div>
          )}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Clearance Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Reference: {record.bcert_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              {canEdit && (
                !isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                    <Edit2 className="h-4 w-4" /> Edit
                  </button>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
                    <button onClick={handleUpdate} disabled={isSaving}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50">
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )
              )}
              {isNonEditable && !isArchived && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border bg-gray-100 text-gray-600 border-gray-300">
                  <Lock className="h-3 w-3" /> Read-only
                </span>
              )}
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* {formData.requester_type === 'Online' && (
                <UserIdViewer userId={record?.schedule?.user_id} onZoom={url => setLightboxUrl(url)} />
              )} */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>
                <FormField name="first_name" value={formData.first_name || ''} onChange={handleInputChange} isEditing={isEditing && canEdit} label="First Name" />
                <FormField name="middle_name" value={formData.middle_name || ''} onChange={handleInputChange} isEditing={isEditing && canEdit} label="Middle Name" />
                <FormField name="surname" value={formData.surname || ''} onChange={handleInputChange} isEditing={isEditing && canEdit} label="Surname" />
                <FormField name="ext_name" value={formData.ext_name || ''} onChange={handleInputChange} isEditing={isEditing && canEdit} label="Extension Name" />
                <FormField name="prefix" value={formData.prefix || ''} onChange={handleInputChange} type="select" options={['Mr.','Ms.','Mrs.','Dr.','Atty.']} isEditing={isEditing && canEdit} label="Prefix" />
                <FormField name="dob" value={formData.dob || ''} onChange={handleInputChange} type="date" isEditing={isEditing && canEdit} label="Date of Birth" />
                <FormField name="pob" value={formData.pob || ''} onChange={handleInputChange} isEditing={isEditing && canEdit} label="Place of Birth" />
                <FormField name="contact_no" value={formData.contact_no || ''} onChange={handleInputChange} type="tel" isEditing={isEditing && canEdit} label="Contact Number" />
                <FormField name="email" value={formData.email || ''} onChange={handleInputChange} type="email" isEditing={isEditing && canEdit} label="Email" />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Address Information</h3>
                <FormField name="zone" value={formData.zone || ''} onChange={handleInputChange} type="select" options={ZONE_OPTIONS} isEditing={isEditing && canEdit} label="Zone" />
                <FormField name="street" value={formData.street || ''} onChange={handleInputChange} type="select" options={streets.map(s => s.name)} isEditing={isEditing && canEdit} label="Street" />
                <FormField name="house_block_lot_no" value={formData.house_block_lot_no || ''} onChange={handleInputChange} isEditing={isEditing && canEdit} label="House/Block/Lot No." />
                <FormField name="period_of_residency" value={formData.period_of_residency || ''} onChange={handleInputChange} isEditing={isEditing && canEdit} label="Period of Residency" />
                <FormField name="house_owner" value={formData.house_owner || ''} onChange={handleInputChange} isEditing={isEditing && canEdit} label="House Owner" />
                <FormField name="relationship_to_owner" value={formData.relationship_to_owner || ''} onChange={handleInputChange} isEditing={isEditing && canEdit} label="Relationship to Owner" />
                <FormField name="registered_voter" value={formData.registered_voter || ''} onChange={handleInputChange} type="select" options={['Yes','No']} isEditing={isEditing && canEdit} label="Registered Voter" />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Document Information</h3>
                <FormField name="purpose" value={formData.purpose || ''} onChange={handleInputChange} type="select" options={PURPOSE_OPTIONS} isEditing={isEditing && canEdit} label="Purpose" />
                <FormField name="purpose_details" value={formData.purpose_details || ''} onChange={handleInputChange} isTextArea={true} isEditing={isEditing && canEdit} label="Purpose Details" />
                <FormField name="issued_on" value={formData.issued_on || ''} onChange={handleInputChange} type="date" isEditing={isEditing && canEdit} label="Issued On" />
                <FormField name="issued_at" value={formData.issued_at || ''} onChange={handleInputChange} isEditing={isEditing && canEdit} label="Issued At" />
                <FormField name="ctc_vrr_no" value={formData.ctc_vrr_no || ''} onChange={handleInputChange} isEditing={isEditing && canEdit} label="CTC/VRR No." />
                <FormField name="bcert_number" value={formData.bcert_number || ''} onChange={handleInputChange} isEditing={false} label="Barangay Clearance No." />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={currentStatus} requesterType={formData.requester_type} />
                  </div>
                </div>
                {formData.rejection_reason && (
                  <FormField name="rejection_reason" value={formData.rejection_reason || ''} onChange={handleInputChange} isTextArea={true} isEditing={false} label="Reason of rejection" />
                )}
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Submission Channel</label>
                  <div className="mt-1.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${requesterInfo.badgeClass}`}>
                      {requesterInfo.label}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Created At</label>
                  <p className="text-sm text-gray-700 mt-1">{formatCreatedAt(formData.created_at)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Processed By</label>
                  <div className="mt-1">
                    {loadingCreatedBy ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading…
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">
                        {createdByName || (formData.created_by ? `Staff ID: ${formData.created_by}` : '—')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Schedule & Remarks</h3>
                {formData.requester_type?.toLowerCase() === 'walk-in' ? (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule</label>
                    <p className="text-sm text-gray-400 italic mt-1">No schedule required (Walk-in)</p>
                  </div>
                ) : isAwaitingReschedule ? (
                  <>
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CalendarClock className="h-3.5 w-3.5 text-sky-600 flex-shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-700">Awaiting Applicant Booking</span>
                      </div>
                      <p className="text-[11px] text-sky-600 leading-relaxed">
                        The applicant has been notified to choose a new appointment slot through their own portal. Admins do not pick the date or session.
                      </p>
                    </div>
                    {currentSchedule && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Last (missed) appointment</label>
                        <p className="text-sm text-gray-500 mt-1 line-through">
                          {formatDateShort(currentSchedule.schedule_date)} · {getScheduleSession(currentSchedule) === 'AM' ? 'Morning' : 'Afternoon'} session
                          ({formatTimeRange(currentSchedule.schedule_time)})
                        </p>
                      </div>
                    )}
                    {currentSchedule?.note && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Note to applicant</label>
                        <p className="text-sm text-gray-700 mt-1">{currentSchedule.note}</p>
                      </div>
                    )}
                    <MissedScheduleHistory history={missedHistory} />
                  </>
                ) : currentSchedule ? (
                  <>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule Date</label>
                      <p className="text-sm text-gray-700 mt-1">{formatDateShort(currentSchedule.schedule_date)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule Time</label>
                      <p className="text-sm text-gray-700 mt-1">{formatTimeRange(currentSchedule.schedule_time)}</p>
                    </div>
                    {isNoShow && !TERMINAL_STATUSES.has(status) && !isBlocked && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <CalendarX className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                          <p className="text-xs font-semibold text-red-700">
                            {session === 'AM' ? 'Morning' : 'Afternoon'} session has fully passed — No Show
                          </p>
                        </div>
                        <p className="text-[11px] text-red-500">
                          {session === 'AM' ? 'AM session ended at 12:00 NN' : 'PM session ended at 5:00 PM'} on {formatDateShort(currentSchedule.schedule_date)}.
                        </p>
                      </div>
                    )}
                    {currentSchedule.note && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule Note</label>
                        <p className="text-sm text-gray-700 mt-1">{currentSchedule.note}</p>
                      </div>
                    )}
                    <MissedScheduleHistory history={missedHistory} />
                  </>
                ) : (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule</label>
                    <p className="text-sm text-gray-400 italic mt-1">Not yet scheduled</p>
                  </div>
                )}
                <FormField name="remarks" value={formData.remarks || ''} onChange={handleInputChange} isTextArea={true} isEditing={isEditing && canEdit} label="Remarks" />
              </div>
            </div>
          </div>
          {showDispositionModal && (
            <div className="mx-6 mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${
                    dispositionType === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    {dispositionType === 'REJECTED' ? 'Reject' : 'Mark as Incomplete'}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">Provide a reason</span>
                </div>
                <button onClick={() => { setShowDispositionModal(false); setDispositionReason(''); setDispositionType(null); }}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors">
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <p className="text-[11px] text-gray-500 italic">
                Heads up: marking the record as <strong>{dispositionType === 'REJECTED' ? 'Rejected' : 'Incomplete'}</strong> halts the workflow.
                After this, no further status updates are allowed on this record.
              </p>
              <textarea rows={3}
                placeholder={dispositionType === 'REJECTED'
                  ? 'e.g. Insufficient documents, unverifiable information…'
                  : 'e.g. Missing birth certificate, incomplete address…'}
                value={dispositionReason}
                onChange={e => setDispositionReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none bg-white"
              />
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => { setShowDispositionModal(false); setDispositionReason(''); setDispositionType(null); }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDisposition} disabled={isDisposing || !dispositionReason.trim()}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md text-white transition-colors disabled:opacity-50 ${
                    dispositionType === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-orange-500 hover:bg-orange-600'
                  }`}>
                  {isDisposing ? 'Submitting…' : dispositionType === 'REJECTED' ? 'Confirm Rejection' : 'Confirm Incomplete'}
                </button>
              </div>
            </div>
          )}
          {showArchiveConfirm && (
            <div className="mx-6 mb-4 rounded-lg border border-gray-300 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-800">Confirm Archive</span>
              </div>
              <p className="text-sm text-gray-600">
                This will mark the record as <strong>Archived</strong>. Archived records are read-only and cannot be edited or updated. Are you sure you want to continue?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowArchiveConfirm(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button onClick={handleArchive} disabled={isArchiving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md text-white bg-gray-700 hover:bg-gray-800 transition-colors disabled:opacity-50">
                  <Archive className="h-3.5 w-3.5" />
                  {isArchiving ? 'Archiving…' : 'Yes, Archive Record'}
                </button>
              </div>
            </div>
          )}
          {showRestoreConfirm && (
            <div className="mx-6 mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-gray-800">Confirm Restore</span>
              </div>
              <p className="text-sm text-gray-600">
                This will restore the archived record back to its previous active status ({previousStatus || 'RELEASED'}).
                The record will become editable and visible in the active records list again.
                Are you sure you want to continue?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button 
                  onClick={() => setShowRestoreConfirm(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRestore} 
                  disabled={isArchiving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {isArchiving ? 'Restoring…' : 'Yes, Restore Record'}
                </button>
              </div>
            </div>
          )}
          {/* ── Bottom Action Bar ── */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {isArchived ? (
                  <>
                    <button 
                      onClick={() => setShowRestoreConfirm(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore / Unarchive
                    </button>
                    <p className="text-xs text-gray-500 italic flex items-center gap-1.5 ml-2">
                      <Lock className="h-3.5 w-3.5" />
                      This record is archived. Click restore to reactivate.
                    </p>
                  </>
                ) : isBlocked ? (
                  <p className={`text-xs italic flex items-center gap-1.5 ${
                    status === 'REJECTED' ? 'text-rose-600' : 'text-orange-600'
                  }`}>
                    <Ban className="h-3.5 w-3.5" />
                    Workflow halted — this record was marked <strong>{blockedLabel}</strong>. No further status changes allowed.
                  </p>
                ) : isReleased ? (
                  <>
                    {hasReleasedDocument && (
                      <button onClick={downloadReleased} disabled={isDownloading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50">
                        <Download className="h-4 w-4" />
                        {isDownloading ? 'Downloading...' : 'Download Released Document'}
                      </button>
                    )}
                    {canArchive && (
                      <>
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <button onClick={() => setShowArchiveConfirm(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors">
                          <Archive className="h-4 w-4" />
                          Archive Record
                        </button>
                      </>
                    )}
                    <p className="text-xs text-gray-400 italic">
                      Released by cashier. Status cannot be changed.
                    </p>
                  </>
                ) : (
                  <>
                    {canMarkProcess && (
                      <>
                        <button
                          onClick={handleMarkProcess}
                          disabled={actionLoading === 'processing'}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                          <PlayCircle className="h-4 w-4" />
                          {actionLoading === 'processing' ? 'Updating...' : 'Mark as Process'}
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                      </>
                    )}
                    {canDispose && (
                      <>
                        <button onClick={() => openDisposition('INCOMPLETE')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors">
                          <X className="h-4 w-4" />
                          Mark as Incomplete
                        </button>
                        <button onClick={() => openDisposition('REJECTED')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors">
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                      </>
                    )}
                    {canMarkToInspection && (
                      <button onClick={handleMarkToInspection} disabled={actionLoading === 'inspection'}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50">
                        <Eye className="h-4 w-4" />
                        {actionLoading === 'inspection' ? 'Updating...' : 'Mark as Inspection'}
                      </button>
                    )}
                    {status === 'PROCESS' && (
                      <p className="text-xs text-indigo-600 italic flex items-center gap-1.5">
                        <PlayCircle className="h-3.5 w-3.5" />
                        Request is now being processed. Awaiting further action from cashier.
                      </p>
                    )}
                    {status === 'PAID' && (
                      <p className="text-xs text-teal-600 italic flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        Payment confirmed by cashier. Awaiting cashier to release the document.
                      </p>
                    )}
                  </>
                )}
              </div>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </div>
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      {showRescheduleModal && currentSchedule && (
        <RescheduleModal
          record={record}
          missedSchedule={currentSchedule}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={handleRescheduleSuccess}
          toast={toast}
        />
      )}
    </>
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
            <button onClick={() => onChange({ status: '' })} className="text-blue-400 hover:text-blue-600"><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.schedule_filter && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Schedule: <strong>{filters.schedule_filter === 'scheduled' ? 'Scheduled' : 'Not yet scheduled'}</strong>
            <button onClick={() => onChange({ schedule_filter: '' })} className="text-blue-400 hover:text-blue-600"><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.filter_date && filters.filter_date !== 'custom' && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Created: <strong>{DATE_PERIOD_LABELS[filters.filter_date]}</strong>
            <button onClick={() => onChange({ filter_date: '', from: '', to: '' })} className="text-blue-400 hover:text-blue-600"><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.filter_date === 'custom' && (filters.from || filters.to) && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Created: <strong>{filters.from || '…'} → {filters.to || '…'}</strong>
            <button onClick={() => onChange({ filter_date: '', from: '', to: '' })} className="text-blue-400 hover:text-blue-600"><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.zone && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Zone: <strong>{filters.zone}</strong>
            <button onClick={() => onChange({ zone: '' })} className="text-blue-400 hover:text-blue-600"><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.street && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Street: <strong>{filters.street}</strong>
            <button onClick={() => onChange({ street: '' })} className="text-blue-400 hover:text-blue-600"><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.purpose && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
            Purpose: <strong>{filters.purpose}</strong>
            <button onClick={() => onChange({ purpose: '' })} className="text-blue-400 hover:text-blue-600"><X className="h-3 w-3" /></button>
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
                {(['', 'PENDING', 'RESCHEDULED', 'SCHEDULED', 'ENCODED', 'INSPECTING', 'REVIEW', 'PROCESS', 'PAID', 'RELEASED', 'REJECTED', 'INCOMPLETE', 'ARCHIVED'] as const).map(v => (
                  <button key={v}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                      filters.status === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => onChange({ status: v })}
                  >
                    {v === '' ? 'All' : v === 'ARCHIVED' ? 'Archived' : v.charAt(0) + v.slice(1).toLowerCase()}
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
                  <button key={opt.v}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                      filters.schedule_filter === opt.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => onChange({ schedule_filter: opt.v })}>
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
                  <button key={opt.v}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                      filters.filter_date === opt.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => onChange({ filter_date: opt.v, from: '', to: '' })}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {filters.filter_date === 'custom' && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="date" className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded-md" value={filters.from} onChange={e => onChange({ from: e.target.value })} />
                  <span className="text-xs text-gray-500">to</span>
                  <input type="date" className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded-md" value={filters.to} onChange={e => onChange({ to: e.target.value })} />
                </div>
              )}
            </div>
            <div className="p-4 border-l border-b border-gray-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Zone</label>
              <input type="text" placeholder="e.g. Zone 1, Zone 2…"
                className="w-full h-8 px-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400"
                value={filters.zone} onChange={e => onChange({ zone: e.target.value })} />
            </div>
            <div className="p-4 border-r border-gray-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Street</label>
              <select className="w-full h-8 px-2 text-sm border border-gray-200 rounded-md bg-white cursor-pointer focus:outline-none focus:border-blue-400"
                value={filters.street} onChange={e => onChange({ street: e.target.value })}>
                <option value="">All streets</option>
                {streets.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="p-4 border-l border-gray-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Purpose</label>
              <select className="w-full h-8 px-2 text-sm border border-gray-200 rounded-md bg-white cursor-pointer focus:outline-none focus:border-blue-400"
                value={filters.purpose} onChange={e => onChange({ purpose: e.target.value })}>
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
const BarangayClearance = () => {
  const { toast }       = useToast();
  const navigate        = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValueRaw] = useState(() => searchParams.get('search') ?? '');
  const [currentPage, setCurrentPageRaw] = useState(() => Number(searchParams.get('page') ?? '1'));
  const [filters, setFiltersRaw]         = useState<FilterState>(() => filtersFromParams(searchParams));
  const [data, setData]             = useState<BarangayClearanceType[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField]   = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [streets, setStreets]       = useState<Street[]>([]);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<BarangayClearanceType | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [reviewingIds, setReviewingIds] = useState<Set<number>>(new Set());

  const syncToUrl = useCallback((nextSearch: string, nextPage: number, nextFilters: FilterState) => {
    setSearchParams(buildParams(nextFilters, nextSearch, nextPage), { replace: true });
  }, [setSearchParams]);

  const setSearchValue = (val: string) => { setSearchValueRaw(val); setCurrentPageRaw(1); syncToUrl(val, 1, filters); };
  const setCurrentPage = (page: number) => { setCurrentPageRaw(page); syncToUrl(searchValue, page, filters); };
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
  }, [searchParams]);

  useEffect(() => {
    api.get('api/streets', { withCredentials: true })
      .then(res => setStreets(res.data?.data ?? res.data ?? []))
      .catch(e => console.error('Failed to fetch streets:', e));
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchClearanceParams & Record<string, any> = {
        page: currentPage, pageSize: 15,
        search: searchValue || undefined,
        sortField, sortDirection,
        ...(filters.status                                           ? { status:         filters.status }          : {}),
        ...(filters.filter_date && filters.filter_date !== 'custom' ? { filter_date:     filters.filter_date }     : {}),
        ...(filters.filter_date === 'custom' && filters.from        ? { from:            filters.from }            : {}),
        ...(filters.filter_date === 'custom' && filters.to          ? { to:              filters.to }              : {}),
        ...(filters.zone                                            ? { zone:            filters.zone }            : {}),
        ...(filters.street                                          ? { street:          filters.street }          : {}),
        ...(filters.purpose                                         ? { purpose:         filters.purpose }         : {}),
        ...(filters.schedule_filter                                 ? { schedule_filter: filters.schedule_filter } : {}),
      };
      const response = await fetchBarangayClearances(params);
      setData(prioritySortData(response.data as any[]));
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchValue, sortField, sortDirection, filters, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const handleRefresh = () => {
    loadData();
    toast({ title: 'Refreshed', description: 'Data has been refreshed' });
  };

  const handleQRScan = useCallback((scannedValue: string) => {
    const trimmed = scannedValue.trim();
    setSearchValue(trimmed);
    toast({ title: 'QR Scanned', description: `Searching for: ${trimmed}` });
  }, []);

  const handleTableReview = useCallback(async (item: BarangayClearanceType) => {
    const itemId = Number(item.id);
    setReviewingIds(prev => new Set(prev).add(itemId));
    try {
      await axios.put(
        `https://westrembomis.onrender.com/api/barangay-clearances/${itemId}`,
        { status: 'REVIEW' },
        { withCredentials: true }
      );
      setData(prev =>
        prev.map(r =>
          Number(r.id) === itemId ? { ...r, status: 'REVIEW' } : r
        )
      );
      toast({ title: 'Reviewed', description: 'Request status updated to Review.' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message ?? 'Failed to mark as reviewed.',
        variant: 'destructive',
      });
    } finally {
      setReviewingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [toast]);

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
              <h1 className="text-2xl font-semibold text-gray-900">Barangay Clearance</h1>
              <p className="text-sm text-gray-500 mt-1">Manage barangay clearance records</p>
            </div>
          </div>
          <div className="flex items-start gap-3 mb-2 flex-wrap" style={{ position: 'relative', zIndex: 40 }}>
            <div className="flex-1 min-w-[200px] flex items-center gap-2">
              <ClearanceSearchBar searchValue={searchValue} onSearchChange={setSearchValue} onRefresh={handleRefresh} />
              <button
                onClick={() => setShowQRScanner(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all flex-shrink-0"
                title="Scan QR code to search"
              >
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Scan QR</span>
              </button>
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
              {activeFilterCount > 0 && (
                <> with <strong className="text-gray-900">{activeFilterCount}</strong> active filter{activeFilterCount !== 1 ? 's' : ''}</>
              )}
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
                  <button className="text-xs text-blue-600 hover:underline"
                    onClick={() => { setFilters(EMPTY_FILTERS); setSearchValue(''); }}>
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
                      <SortHeader field="fullName">Full Name</SortHeader>
                      <SortHeader field="bcertNumber">BCert No.</SortHeader>
                      <SortHeader field="created_at">Created At</SortHeader>
                      <SortHeader field="zone">Zone</SortHeader>
                      <SortHeader field="street">Street</SortHeader>
                      <SortHeader field="dateOfBirth">Date of Birth</SortHeader>
                      <SortHeader field="status">Status</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />Schedule</div>
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request Type
                      </th>
                      <SortHeader field="purpose">Purpose</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map(item => {
                      const isNew = isNewRequest((item as any).created_at);
                      const itemStatus = normaliseStatus(item.status, (item as any).requester_type);
                      const isItemArchived = FROZEN_STATUSES.has(itemStatus);
                      const isItemBlocked = BLOCKED_STATUSES.has(itemStatus);
                      const isItemReleased = itemStatus === 'RELEASED';
                      const itemSchedule: ScheduleData | null = (item as any).schedule ?? null;
                      const itemRequesterType: string = (item as any).requester_type ?? '';
                      const isItemAwaitingReschedule = itemStatus === 'RESCHEDULED';
                      const isItemNoShow =
                        itemSchedule !== null &&
                        isSchedulePast(itemSchedule) &&
                        !TERMINAL_STATUSES.has(itemStatus) &&
                        !isItemAwaitingReschedule &&
                        itemRequesterType.toLowerCase() !== 'walk-in';
                      const isItemScheduled = itemStatus === 'SCHEDULED';
                      const isReviewingThis = reviewingIds.has(Number(item.id));
                      const { label: submittedByLabel, badgeClass: submittedByBadgeClass } =
                        getRequesterLabel(itemRequesterType);
                      const rowClass = [
                        isNew ? 'bg-blue-50/30' : '',
                        isItemArchived ? 'opacity-60 bg-gray-50' : '',
                        isItemBlocked && !isItemArchived ? 'opacity-80 bg-gray-50/40' : '',
                        'hover:bg-gray-50 transition-colors',
                      ].filter(Boolean).join(' ');
                      return (
                        <tr key={item.id} className={rowClass}>
                          <td className="pl-3 pr-0 py-3">
                            {isNew && (
                              <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" title="New request (< 24h)" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-blue-600 whitespace-nowrap">
                            {`${item.first_name} ${item.middle_name ?? ''} ${item.surname}${item.ext_name ? ` ${item.ext_name}` : ''}`.trim()}
                          </td>
                          <td className="py-3 px-4 text-sm font-mono text-blue-600">{item.bcert_number}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span>{formatCreatedAt((item as any).created_at)}</span>
                              {isNew && <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">New</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{(item as any).zone ?? '—'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {`${item.house_block_lot_no ? item.house_block_lot_no + ' ' : ''}${item.street ?? ''}`.trim() || '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                            {new Date(item.dob).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={item.status} requesterType={(item as any).requester_type} />
                          </td>
                          <td className="py-3 px-4">
                            <ScheduleCell
                              schedule={itemSchedule}
                              requesterType={itemRequesterType}
                              status={itemStatus}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${submittedByBadgeClass}`}>
                              {submittedByLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{item.purpose}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isItemArchived ? (
                                <>
                                  <button
                                    onClick={() => setSelectedDetailRecord(item)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                                  >
                                    <RotateCcw className="h-3 w-3" /> Restore
                                  </button>
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border bg-gray-100 text-gray-500 border-gray-200 whitespace-nowrap"
                                  >
                                    <Lock className="h-3 w-3" /> Archived
                                  </span>
                                </>
                              ) : isItemBlocked ? (
                                <>
                                  <button
                                    onClick={() => navigate(`/document-edit/2/${item.bcert_number}`, { state: { autoPrint: true, previewMode: true } })}
                                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap"
                                  >
                                    Print
                                  </button>
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border cursor-not-allowed select-none whitespace-nowrap ${
                                      itemStatus === 'REJECTED'
                                        ? 'bg-rose-50 text-rose-500 border-rose-200'
                                        : 'bg-orange-50 text-orange-500 border-orange-200'
                                    }`}
                                  >
                                    <Ban className="h-3 w-3" /> No actions
                                  </span>
                                </>
                              ) : isItemScheduled ? (
                                <>
                                  <button
                                    onClick={() => handleTableReview(item)}
                                    disabled={isReviewingThis}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    {isReviewingThis ? 'Reviewing…' : 'Review'}
                                  </button>
                                  <button
                                    onClick={() => navigate(`/document-edit/2/${item.bcert_number}`, { state: { autoPrint: true, previewMode: true } })}
                                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap"
                                  >
                                    Print
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setSelectedDetailRecord(item)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap"
                                  >
                                    <Eye className="h-3 w-3" /> View/Edit
                                  </button>
                                  <button
                                    onClick={() => navigate(`/document-edit/2/${item.bcert_number}`, { state: { autoPrint: true, previewMode: true } })}
                                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap"
                                  >
                                    Print
                                  </button>
                                  {isItemReleased && (
                                    <button
                                      onClick={() => setSelectedDetailRecord(item)}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors whitespace-nowrap"
                                    >
                                      <Archive className="h-3 w-3" /> Archive
                                    </button>
                                  )}
                                </>
                              )}
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
      {showQRScanner && (
        <QRScannerModal
          onClose={() => setShowQRScanner(false)}
          onScan={handleQRScan}
        />
      )}
    </Layout>
  );
};

export default BarangayClearance;