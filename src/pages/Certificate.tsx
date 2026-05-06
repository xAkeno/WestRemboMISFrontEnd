import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Plus, ArrowUpDown, CalendarCheck, CalendarX, Calendar, RefreshCw, X,
  Filter, ChevronDown, SlidersHorizontal, RotateCcw, Eye, Edit2, Save, CreditCard, Download,
  IdCard, ZoomIn, FileQuestion, Loader2, QrCode, Camera, Ban, Archive,
  CalendarClock, AlertTriangle, History, Lock, Sun, Moon,
} from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";
import { Button } from '@/components/ui/button';
import { ClearanceSearchBar } from '@/components/clearance/ClearanceSearchBar';
import { ClearancePagination } from '@/components/clearance/ClearancePagination';
import { fetchCertificates, FetchClearanceParams } from '@/components/services/clearanceApi';
import { Certificate as CertificateType } from '@/types/clearance';
import { useToast } from '@/hooks/use-toast';
import { Layout } from "@/components/Layout";
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { certificatePurposes } from '@/components/purpose/purpose';
import { fetchUserById, getUserFullName } from '@/components/services/userApi';

interface StreetOption {
  id: number;
  name: string;
  zone?: string;
  formerly?: string;
}

const ZONE_OPTIONS = [
  'Zone 1','Zone 2','Zone 3','Zone 4','Zone 5',
  'Zone 6','Zone 7','Zone 8','Zone 9','Zone 10',
];

// ─── Schedule History Entry ────────────────────────────────────────────────────
interface ScheduleHistoryEntry {
  schedule_date: string;
  schedule_time: string;
  missed_at: string; // ISO timestamp when it was logged as no-show
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
  // history of missed schedules (stored as JSON in the API or derived client-side)
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
  purpose: string;
  schedule_filter: string;
}

const EMPTY_FILTERS: FilterState = {
  status: '', filter_date: '', from: '', to: '',
  purpose: '', schedule_filter: '',
};

const PURPOSE_OPTIONS = certificatePurposes;

const FILTER_PARAM_KEYS: Record<keyof FilterState, string> = {
  status: 'status', filter_date: 'date', from: 'from', to: 'to',
  purpose: 'purpose', schedule_filter: 'schedule',
};

function filtersFromParams(params: URLSearchParams): FilterState {
  return {
    status:          params.get('status')   ?? '',
    filter_date:     params.get('date')     ?? '',
    from:            params.get('from')     ?? '',
    to:              params.get('to')       ?? '',
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
// AM session is considered booked from its slot until 12:00 (noon).
// PM session is considered booked from its slot until 17:00 (5 PM).
// A record is only flagged "No Show" AFTER the entire session window has passed —
// not the moment the exact appointment time elapses.
const AM_SESSION_END_HOUR = 12; // noon
const PM_SESSION_END_HOUR = 17; // 5 PM

/** Returns 'AM' if the schedule slot is before noon, 'PM' otherwise. */
function getScheduleSession(schedule: ScheduleData | null | undefined): 'AM' | 'PM' | null {
  if (!schedule) return null;
  try {
    const [hStr] = schedule.schedule_time.split(':');
    const hour = parseInt(hStr, 10);
    return hour < 12 ? 'AM' : 'PM';
  } catch { return null; }
}

/** Returns a human-readable label for the schedule's session. */
function getScheduleSessionLabel(schedule: ScheduleData | null | undefined): string {
  const s = getScheduleSession(schedule);
  if (s === 'AM') return 'Morning Session (until 12:00 NN)';
  if (s === 'PM') return 'Afternoon Session (until 5:00 PM)';
  return '';
}

/** Returns the Date when this schedule's session window ends (noon or 5 PM of schedule_date). */
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

/**
 * Returns true ONLY when the entire AM/PM session window has fully ended.
 * (e.g. 9:00 AM appointment is NOT flagged at 9:30 AM — only after 12:00 NN.)
 */
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
    f.purpose, f.schedule_filter,
  ].filter(Boolean).length;
}

// ─── Status ordering ───────────────────────────────────────────────────────────
const STATUS_ORDER: Record<string, number> = {
  'PENDING':      0,
  'RESCHEDULED':  0, // same priority level as PENDING — awaiting applicant to rebook
  'SCHEDULED':    1,
  'ENCODED':      2,
  'INSPECTING':   3,
  'REVIEWED':     4,
  'PAID':         5,
  'RELEASED':     6,
  'INCOMPLETE':  -1,
  'REJECTED':    -1,
};

/**
 * Returns true when a transition from `current` to `next` is a legal forward move.
 * Hardened to refuse ANY transition out of a terminal/blocked/frozen state.
 */
function isForwardTransition(current: string, next: string): boolean {
  const currentUpper = (current ?? '').toUpperCase();
  const nextUpper    = (next ?? '').toUpperCase();
  if (TERMINAL_STATUSES.has(currentUpper)) return false;
  const cur = STATUS_ORDER[currentUpper] ?? -1;
  const nxt = STATUS_ORDER[nextUpper] ?? -1;
  if (nxt === -1) return true; // dispositions allowed from active records
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
  reviewed:     'bg-purple-100 text-purple-800 border-purple-200',
  paid:         'bg-teal-100 text-teal-800 border-teal-200',
  inspecting:   'bg-indigo-100 text-indigo-800 border-indigo-200',
  archived:     'bg-gray-200 text-gray-600 border-gray-300',
  disabled:     'bg-gray-200 text-gray-600 border-gray-300',
};

function normaliseStatus(raw: string | null | undefined, requesterType?: string): string {
  if (!raw) return '';
  if (raw.toUpperCase() === 'TO_PAY') return 'REVIEWED';
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
  const reqType = requesterType?.toLowerCase();
  return (
    <div className="flex flex-col gap-1 w-fit">
      {reqType === 'walk-in' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border bg-slate-100 text-slate-600 border-slate-300 w-fit">
           Walk-in
        </span>
      )}
      {reqType === 'online' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border bg-cyan-50 text-cyan-700 border-cyan-200 w-fit">
           Online
        </span>
      )}
      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border w-fit ${style}`}>
        {display}
      </span>
    </div>
  );
}

// ─── ScheduleCell — handles walk-in, no-show, awaiting-reschedule, and normal states ─────
function ScheduleCell({
  schedule, requesterType, status,
}: {
  schedule: ScheduleData | null | undefined;
  requesterType?: string;
  status?: string;
}) {
  const statusUpper = (status ?? '').toUpperCase();

  // Walk-in: no schedule needed
  if (requesterType?.toLowerCase() === 'walk-in') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-sm italic">
        No schedule required (Walk-in)
      </span>
    );
  }

  // Status RESCHEDULED — admin already requested a new slot from the applicant
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

  const isPast    = isSchedulePast(schedule);
  const session   = getScheduleSession(schedule);
  const isTerminal = TERMINAL_STATUSES.has(statusUpper);

  // No-Show: ENTIRE session window has passed AND record is not terminal/rescheduled
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
  const containerId  = "qr-scanner-container-certificate";
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
  record: CertificateType | null;
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
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleData | null>(null);

  // Archive confirmation state
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving]               = useState(false);
  
  // Created By name state (lazy loaded when modal opens)
  const [createdByName, setCreatedByName] = useState<string>('');
  const [loadingCreatedBy, setLoadingCreatedBy] = useState(false);

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
    bcert_number: '', first_name: '', middle_name: '', surname: '', extension: '',
    prefix: '', ext_name: '', age: '', dob: '', registered_voter: '',
    period_of_residency: '', house_block_lot_no: '', street: '', zone: '',
    purpose: '', status: '', created_by: '',
    issued_date: '', issued_at: '', issued_on: '',
    or_no: '', ctc_vrr_no: '',
    punong_barangay: '', for_the_punong_barangay: '', barangay_position: '',
    requester_type: '', email: '', remarks: '', rejection_reason: '', created_at: '',
  });

  // Fetch user name when modal opens (lazy loading)
  useEffect(() => {
    const loadCreatorName = async () => {
      const userId = formData.created_by;
      if (!userId) {
        setCreatedByName('—');
        return;
      }
      
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      if (isNaN(userIdNum)) {
        setCreatedByName('—');
        return;
      }
      
      setLoadingCreatedBy(true);
      try {
        const user = await fetchUserById(userIdNum);
        const fullName = getUserFullName(user);
        setCreatedByName(fullName);
      } catch (error) {
        console.error('Failed to load creator name:', error);
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
        `https://westrembomis.onrender.com/api/barangay-certificates?search=${record.bcert_number}`,
        { withCredentials: true }
      );
      const full = response.data.data.data[0];
      const normalisedStatus = normaliseStatus(full.status ?? '', full.requester_type ?? '');
      setCurrentStatus(normalisedStatus);
      setInitialReleasedPath(full.released_document_path ?? null);
      setCurrentSchedule(full.schedule ?? null);

      // Auto-fix: walk-in records should never be RESCHEDULED or SCHEDULED
      if (
        full.requester_type?.toLowerCase() === 'walk-in' &&
        (full.status?.toUpperCase() === 'RESCHEDULED' || full.status?.toUpperCase() === 'SCHEDULED')
      ) {
        axios.put(
          `https://westrembomis.onrender.com/api/barangay-certificates/${full.id}`,
          { status: 'PENDING' },
          { withCredentials: true }
        ).catch(() => {});
      }

      setFormData({
        bcert_number:             full.bcert_number             || '',
        first_name:               full.first_name               || '',
        middle_name:              full.middle_name              || '',
        surname:                  full.surname                  || '',
        extension:                full.extension                || '',
        prefix:                   full.prefix                   || '',
        ext_name:                 full.ext_name                 || '',
        age:                      full.age                      || '',
        dob:                      full.dob ? full.dob.split('T')[0] : '',
        registered_voter:         full.registered_voter         || '',
        period_of_residency:      full.period_of_residency      || '',
        house_block_lot_no:       full.house_block_lot_no       || '',
        street:                   full.street                   || '',
        zone:                     full.zone                     || '',
        purpose:                  full.purpose                  || '',
        status:                   normalisedStatus,
        created_by:               full.created_by               || '',
        issued_date:              full.issued_date ? full.issued_date.split('T')[0] : '',
        issued_at:                full.issued_at                || '',
        issued_on:                full.issued_on                || '',
        or_no:                    full.or_no                    || '',
        ctc_vrr_no:               full.ctc_vrr_no               || '',
        punong_barangay:          full.punong_barangay          || '',
        for_the_punong_barangay:  full.for_the_punong_barangay  || '',
        barangay_position:        full.barangay_position        || '',
        requester_type:           full.requester_type           || '',
        email:                    full.email                    || '',
        remarks:                  full.remarks                  || '',
        rejection_reason:         full.rejection_reason         || '',
        created_at:               full.created_at               || '',
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

  // ─── Derived capability flags ──────────────────────────────────────────────
  const isReleased       = status === 'RELEASED';
  const isArchived       = FROZEN_STATUSES.has(status);
  const isBlocked        = BLOCKED_STATUSES.has(status);
  const isNonEditable    = isArchived || isBlocked;
  const isWorkflowFrozen = isReleased || isArchived || isBlocked;

  // Cashier-exclusive actions — these MUST NOT appear here:
  //   • "Mark as Paid"  (cashier records the payment)
  //   • "Release Document" (cashier issues / releases the document after payment)
  // We expose only the workflow stages that belong to the admin role.
  const canMarkReviewed = !isWorkflowFrozen &&
    isForwardTransition(status, 'REVIEWED') &&
    (status === 'ENCODED' || status === 'SCHEDULED' || status === 'INSPECTING' || status === 'RESCHEDULED');
  const canMarkToInspection = !isWorkflowFrozen &&
    isForwardTransition(status, 'INSPECTING') &&
    (status === 'ENCODED' || status === 'SCHEDULED' || status === 'RESCHEDULED');
  const canDispose = !isWorkflowFrozen && !TERMINAL_STATUSES.has(status);
  const canArchive = isReleased && !isArchived;

  // ─── No-Show / Reschedule logic ────────────────────────────────────────────
  // A record is "no-show" when:
  //   • it has a schedule
  //   • the AM/PM SESSION WINDOW has fully passed (not just the exact slot time)
  //   • status is not terminal AND not already RESCHEDULED
  //   • it's an Online request
  // Admins do NOT send reschedule requests — the applicant rebooks via their portal.
  const isAwaitingReschedule = status === 'RESCHEDULED';
  const isNoShow =
    currentSchedule !== null &&
    isSchedulePast(currentSchedule) &&
    !TERMINAL_STATUSES.has(status) &&
    !isAwaitingReschedule &&
    formData.requester_type?.toLowerCase() !== 'walk-in';

  // Missed schedule history
  const missedHistory: ScheduleHistoryEntry[] = currentSchedule?.missed_history ?? [];

  // ─── handleMarkReviewed ────────────────────────────────────────────────────
  const handleMarkReviewed = async () => {
    if (isWorkflowFrozen || !isForwardTransition(status, 'REVIEWED')) {
      toast({ title: 'Not allowed', description: 'This record cannot be advanced from its current state.', variant: 'destructive' });
      return;
    }
    setActionLoading('reviewed');
    try {
      await axios.put(
        `https://westrembomis.onrender.com/api/barangay-certificates/${record.id}`,
        { status: 'TO_PAY' },
        { withCredentials: true }
      );
      setCurrentStatus('REVIEWED');
      setFormData((p: any) => ({ ...p, status: 'REVIEWED' }));
      try {
        await axios.put(
          `https://westrembomis.onrender.com/api/barangay-certificates/status/${record.id}`,
          { status: 'TO_PAY' },
          { withCredentials: true }
        );
      } catch { /* silent */ }
      toast({
        title: 'Forwarded to Cashier',
        description: 'Record marked as Reviewed. Payment AND release are handled by the cashier from this point.',
      });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to update status.', variant: 'destructive' });
    } finally { setActionLoading(null); }
  };

  const handleMarkToInspection = async () => {
    if (isWorkflowFrozen || !isForwardTransition(status, 'INSPECTING')) {
      toast({ title: 'Not allowed', description: 'This record cannot be advanced from its current state.', variant: 'destructive' });
      return;
    }
    setActionLoading('inspection');
    try {
      await axios.put(
        `https://westrembomis.onrender.com/api/barangay-certificates/${record.id}`,
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
        `https://westrembomis.onrender.com/api/barangay-certificates/${record.id}/disposition`,
        { status: dispositionType, reason: dispositionReason.trim() },
        { withCredentials: true }
      );
      const label = dispositionType === 'REJECTED' ? 'Rejected' : 'Marked as Incomplete';
      setCurrentStatus(dispositionType);
      setFormData((p: any) => ({ ...p, status: dispositionType }));
      toast({ title: 'Success', description: `Record ${label} successfully. No further actions are available.` });
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
        `https://westrembomis.onrender.com/api/barangay-certificates/${record.id}`,
        { status: 'ARCHIVED' },
        { withCredentials: true }
      );
      setCurrentStatus('ARCHIVED');
      setFormData((p: any) => ({ ...p, status: 'ARCHIVED' }));
      toast({ title: 'Archived', description: 'Record archived. It is now read-only and non-interactive.' });
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

  // NOTE: Document release is handled by the cashier role.
  // The admin only downloads an already-released document or archives it.
  const downloadReleased = async () => {
    if (!record?.id) {
      toast({ title: 'Error', description: 'No record to download.', variant: 'destructive' });
      return;
    }
    setIsDownloading(true);
    try {
      const res = await axios.get(
        `https://westrembomis.onrender.com/api/documents/release/barangay-certificates/${record.id}/download`,
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
    if (isNonEditable) {
      toast({ title: 'Not allowed', description: 'This record is read-only and cannot be edited.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      let existingId: number | null = null;
      try {
        const checkRes = await axios.get(
          `https://westrembomis.onrender.com/api/barangay-certificates?search=${record.bcert_number}`,
          { withCredentials: true }
        );
        const records = checkRes.data.data.data;
        if (records?.length > 0) existingId = records[0].id;
      } catch (error) { console.error('Check existing failed:', error); }

      if (existingId) {
        // Strip status from the payload — status only flows through dedicated workflow handlers.
        const { status: _ignoredStatus, ...payload } = formData;
        await axios.put(
          `https://westrembomis.onrender.com/api/barangay-certificates/${existingId}`,
          { ...payload, requester_type: formData.requester_type || 'Online' },
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
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-lg border border-gray-200 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          {/* Archived banner */}
          {isArchived && (
            <div className="bg-gray-100 border-b border-gray-300 px-6 py-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Archived Record</span>
              <span className="text-xs text-gray-500 ml-1">— This record is locked. All actions, edits, and status updates are disabled.</span>
            </div>
          )}

          {/* Blocked banner */}
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

          {/* Awaiting reschedule banner — admin already sent the request */}
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

          {/* No-Show alert banner — entire AM/PM session has passed (informational only) */}
          {isNoShow && !isArchived && !isReleased && !isBlocked && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-red-700">
                No Show — {session === 'AM' ? 'Morning' : 'Afternoon'} session was missed
              </span>
              <span className="text-xs text-red-500">
                ({formatDateShort(currentSchedule!.schedule_date)} · {session === 'AM' ? 'until 12:00 NN' : 'until 5:00 PM'})
              </span>
            </div>
          )}

          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Certificate Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Reference: {record.bcert_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              {!isNonEditable && (
                !isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                    <Edit2 className="h-4 w-4" /> Edit
                  </button>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
                    <button onClick={handleUpdate} disabled={isSaving}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )
              )}
              {isNonEditable && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border bg-gray-100 text-gray-600 border-gray-300">
                  <Lock className="h-3 w-3" /> Read-only
                </span>
              )}
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className={`p-6 ${
            isArchived ? 'opacity-70 pointer-events-none select-none' :
            isBlocked  ? 'opacity-90' : ''
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.requester_type === 'Online' && (
                <UserIdViewer userId={record?.schedule?.user_id} onZoom={url => setLightboxUrl(url)} />
              )}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>
                {[
                  { label: 'BCert Number',  name: 'bcert_number', readOnly: true },
                  { label: 'Prefix',        name: 'prefix', type: 'select', options: ['Mr.','Ms.','Mrs.','Dr.','Atty.'] },
                  { label: 'First Name',    name: 'first_name' },
                  { label: 'Middle Name',   name: 'middle_name' },
                  { label: 'Surname',       name: 'surname' },
                  { label: 'Ext Name',      name: 'ext_name' },
                  { label: 'Extension',     name: 'extension' },
                  { label: 'Age',           name: 'age', type: 'number' },
                ].map(f => (
                  <FormField key={f.name} name={f.name} value={formData[f.name] || ''} onChange={handleInputChange}
                    type={f.type || 'text'} options={f.options} isEditing={isEditing && !f.readOnly && !isNonEditable} label={f.label} />
                ))}
                <FormField name="dob" value={formData.dob || ''} onChange={handleInputChange} type="date" isEditing={isEditing && !isNonEditable} label="Date of Birth" />
                <FormField name="email" value={formData.email || ''} onChange={handleInputChange} type="email" isEditing={isEditing && !isNonEditable} label="Email" />
                <FormField name="requester_type" value={formData.requester_type || ''} onChange={handleInputChange}
                  type="select" options={['Online','Walk-in']} isEditing={isEditing && !isNonEditable} label="Requester Type" />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Address Information</h3>
                <FormField name="house_block_lot_no" value={formData.house_block_lot_no || ''} onChange={handleInputChange} isEditing={isEditing && !isNonEditable} label="House/Block/Lot No." />
                <FormField name="street" value={formData.street || ''} onChange={handleInputChange} type="select" options={streets.map(s => s.name)} isEditing={isEditing && !isNonEditable} label="Street" />
                <FormField name="zone" value={formData.zone || ''} onChange={handleInputChange} type="select" options={ZONE_OPTIONS} isEditing={isEditing && !isNonEditable} label="Zone" />
                <FormField name="period_of_residency" value={formData.period_of_residency || ''} onChange={handleInputChange} isEditing={isEditing && !isNonEditable} label="Period of Residency" />
                <FormField name="registered_voter" value={formData.registered_voter || ''} onChange={handleInputChange}
                  type="select" options={['Yes','No']} isEditing={isEditing && !isNonEditable} label="Registered Voter" />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Document Information</h3>
                <FormField name="purpose" value={formData.purpose || ''} onChange={handleInputChange}
                  type="select" options={PURPOSE_OPTIONS} isEditing={isEditing && !isNonEditable} label="Purpose" />
                <FormField name="issued_date" value={formData.issued_date || ''} onChange={handleInputChange} type="date" isEditing={isEditing && !isNonEditable} label="Issued Date" />
                <FormField name="ctc_vrr_no" value={formData.ctc_vrr_no || ''} onChange={handleInputChange} isEditing={isEditing && !isNonEditable} label="CTC/VRR No." />
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
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Created At</label>
                  <p className="text-sm text-gray-700 mt-1">{formatCreatedAt(formData.created_at)}</p>
                </div>
                
                {/* Created By - Shows NAME instead of ID (lazy loaded when modal opens) */}
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Created By</label>
                  <div className="mt-1">
                    {loadingCreatedBy ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">
                        {createdByName || (formData.created_by ? `ID: ${formData.created_by}` : '—')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Schedule & Remarks</h3>
                {/* Schedule display */}
                {formData.requester_type?.toLowerCase() === 'walk-in' ? (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule</label>
                    <p className="text-sm text-gray-400 italic mt-1">No schedule required (Walk-in)</p>
                  </div>
                ) : isAwaitingReschedule ? (
                  /* RESCHEDULED — admin sent the request, awaiting applicant to rebook */
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
                          {' '}({formatTimeRange(currentSchedule.schedule_time)})
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
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Session</label>
                      <p className="text-sm text-gray-700 mt-1 inline-flex items-center gap-1.5">
                        {getScheduleSession(currentSchedule) === 'AM' ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-indigo-500" />}
                        {getScheduleSessionLabel(currentSchedule)}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Booked slot: {formatTimeRange(currentSchedule.schedule_time)}</p>
                    </div>
                    {/* No-Show informational panel — no action button */}
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
                <FormField name="remarks" value={formData.remarks || ''} onChange={handleInputChange} isTextArea={true} isEditing={isEditing && !isNonEditable} label="Remarks" />
              </div>
            </div>
          </div>

          {/* Disposition panel */}
          {showDispositionModal && canDispose && (
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
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    dispositionType === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-orange-500 hover:bg-orange-600'
                  }`}>
                  {isDisposing ? 'Submitting…' : dispositionType === 'REJECTED' ? 'Confirm Rejection' : 'Confirm Incomplete'}
                </button>
              </div>
            </div>
          )}

          {/* Archive confirmation panel */}
          {showArchiveConfirm && canArchive && (
            <div className="mx-6 mb-4 rounded-lg border border-gray-300 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-800">Confirm Archive</span>
              </div>
              <p className="text-sm text-gray-600">
                This will lock the record as <strong>Archived</strong>. Archived records are completely
                non-interactive — no edits, no actions, no status changes. Continue?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowArchiveConfirm(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button onClick={handleArchive} disabled={isArchiving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md text-white bg-gray-700 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Archive className="h-3.5 w-3.5" />
                  {isArchiving ? 'Archiving…' : 'Yes, Archive Record'}
                </button>
              </div>
            </div>
          )}

          {/* Footer action bar */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {isArchived ? (
                  /* ── ARCHIVED: completely non-interactive ─────────────────── */
                  <p className="text-xs text-gray-500 italic flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    This record is archived. All actions are disabled.
                  </p>
                ) : isBlocked ? (
                  /* ── REJECTED / INCOMPLETE: no progression allowed ────────── */
                  <p className={`text-xs italic flex items-center gap-1.5 ${
                    status === 'REJECTED' ? 'text-rose-600' : 'text-orange-600'
                  }`}>
                    <Ban className="h-3.5 w-3.5" />
                    Workflow halted — this record was marked <strong>{blockedLabel}</strong>. No further status changes allowed.
                  </p>
                ) : isReleased ? (
                  /* ── RELEASED: download + archive (release was done by cashier) ─ */
                  <>
                    {hasReleasedDocument && (
                      <button onClick={downloadReleased} disabled={isDownloading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
                  /* ── ACTIVE: admin-side workflow buttons only ─────────────── */
                  <>
                    {canMarkReviewed && (
                      <button onClick={handleMarkReviewed} disabled={actionLoading === 'reviewed'}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <CreditCard className="h-4 w-4" />
                        {actionLoading === 'reviewed' ? 'Updating...' : 'Mark as Reviewed'}
                      </button>
                    )}
                    {canDispose && (
                      <>
                        <div className="w-px h-6 bg-gray-200 mx-1" />
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
                      </>
                    )}
                    {canMarkToInspection && (
                      <button onClick={handleMarkToInspection} disabled={actionLoading === 'inspection'}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Eye className="h-4 w-4" />
                        {actionLoading === 'inspection' ? 'Updating...' : 'Mark as Inspection'}
                      </button>
                    )}
                    {/* Reviewed → Cashier handoff notice */}
                    {status === 'REVIEWED' && (
                      <p className="text-xs text-purple-600 italic flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        Forwarded to Cashier. Payment AND release are handled in the cashier portal.
                      </p>
                    )}
                    {/* PAID → cashier still owns release; admin only waits */}
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
    </>
  );
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────
const DATE_PERIOD_LABELS: Record<string, string> = {
  this_week: 'This week', this_month: 'This month', this_year: 'This year',
};

function FilterBar({
  filters, onChange, onReset, activeCount,
}: {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  activeCount: number;
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
        <div className="absolute top-full right-0 mt-2 min-w-[560px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="grid grid-cols-2">
            <div className="p-4 border-r border-b border-gray-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {(['', 'PENDING', 'RESCHEDULED', 'SCHEDULED', 'ENCODED', 'INSPECTING', 'REVIEWED', 'PAID', 'RELEASED', 'REJECTED', 'INCOMPLETE', 'ARCHIVED'] as const).map(v => (
                  <button key={v}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                      filters.status === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => onChange({ status: v })}
                  >
                    {v === '' ? 'All' : v.charAt(0) + v.slice(1).toLowerCase()}
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Purpose</label>
              <select className="w-full h-8 px-2 text-sm border border-gray-200 rounded-md bg-white cursor-pointer focus:outline-none focus:border-blue-400"
                value={filters.purpose} onChange={e => onChange({ purpose: e.target.value })}>
                <option value="">All purposes</option>
                {PURPOSE_OPTIONS.map((p: string) => <option key={p} value={p}>{p}</option>)}
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
const Certificate = () => {
  const { toast }       = useToast();
  const navigate        = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValueRaw] = useState(() => searchParams.get('search') ?? '');
  const [currentPage, setCurrentPageRaw] = useState(() => Number(searchParams.get('page') ?? '1'));
  const [filters, setFiltersRaw]         = useState<FilterState>(() => filtersFromParams(searchParams));
  const [data, setData]             = useState<CertificateType[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField]   = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<CertificateType | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

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
        ...(filters.purpose                                         ? { purpose:         filters.purpose }         : {}),
        ...(filters.schedule_filter                                 ? { schedule_filter: filters.schedule_filter } : {}),
      };
      const response = await fetchCertificates(params);
      setData(response.data as any[]);
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
              <h1 className="text-2xl font-semibold text-gray-900">Certificate</h1>
              <p className="text-sm text-gray-500 mt-1">Manage certificate records</p>
            </div>
            {/* <Button className="gap-2" onClick={() => navigate('/document-edit/1')}>
              <Plus className="h-4 w-4" /> New Certificate
            </Button> */}
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
                      <SortHeader field="bcert_number">BCert No.</SortHeader>
                      <SortHeader field="surname">Full Name</SortHeader>
                      <SortHeader field="issued_date">Issue Date</SortHeader>
                      <SortHeader field="age">Age</SortHeader>
                      <SortHeader field="purpose">Purpose</SortHeader>
                      <SortHeader field="status">Status</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />Schedule</div>
                      </th>
                      <SortHeader field="created_at">Date Created</SortHeader>
                      <SortHeader field="created_by">Created By</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map(item => {
                      const isNew = isNewRequest((item as any).created_at);
                      const itemStatus     = normaliseStatus(item.status, (item as any).requester_type);
                      const isItemArchived = FROZEN_STATUSES.has(itemStatus);
                      const isItemBlocked  = BLOCKED_STATUSES.has(itemStatus);
                      const isItemReleased = itemStatus === 'RELEASED';

                      // Schedule context for the row
                      const itemSchedule: ScheduleData | null = (item as any).schedule ?? null;
                      const itemRequesterType: string = (item as any).requester_type ?? '';
                      const isItemAwaitingReschedule = itemStatus === 'RESCHEDULED';

                      const rowClass = [
                        isNew ? 'bg-blue-50/30' : '',
                        isItemArchived ? 'opacity-50 bg-gray-50' : '',
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
                          <td className="py-3 px-4 text-sm font-mono text-blue-600">{item.bcert_number}</td>
                          <td className="py-3 px-4 text-sm font-medium whitespace-nowrap">
                            {`${item.prefix ? item.prefix + ' ' : ''}${item.first_name} ${item.middle_name ?? ''} ${item.surname}${item.ext_name ? ' ' + item.ext_name : ''}${item.extension ? ' ' + item.extension : ''}`.trim()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                            {item.issued_date ? new Date(item.issued_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{item.age ?? '—'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{item.purpose ?? '—'}</td>
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
                          <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span>{formatCreatedAt((item as any).created_at)}</span>
                              {isNew && <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">New</span>}
                            </div>
                          </td>
                          {/* Table shows only the ID - no API call here for performance */}
                          <td className="py-3 px-4 text-sm text-gray-600">{item.created_by ? `ID: ${item.created_by}` : '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isItemArchived ? (
                                /* ── ARCHIVED ROW: completely non-interactive ─────────── */
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none whitespace-nowrap"
                                  title="This record is archived and locked"
                                  aria-disabled="true"
                                >
                                  <Lock className="h-3 w-3" /> Archived · Locked
                                </span>
                              ) : isItemBlocked ? (
                                /* ── REJECTED / INCOMPLETE: view + print only ─────────── */
                                <>
                                  <button
                                    onClick={() => setSelectedDetailRecord(item)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap"
                                    title={`View ${itemStatus.toLowerCase()} record (read-only workflow)`}
                                  >
                                    <Eye className="h-3 w-3" /> View
                                  </button>
                                  <button
                                    onClick={() => navigate(`/document-edit/1/${item.bcert_number}`, { state: { autoPrint: true, previewMode: true } })}
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
                                    title="Workflow halted — no further actions allowed"
                                    aria-disabled="true"
                                  >
                                    <Ban className="h-3 w-3" /> No actions
                                  </span>
                                </>
                              ) : (
                                /* ── ACTIVE ROW: normal action buttons ─────────────────── */
                                <>
                                  <button
                                    onClick={() => setSelectedDetailRecord(item)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap"
                                  >
                                    <Eye className="h-3 w-3" /> View/Edit
                                  </button>
                                  {/* <button                                    onClick={() => navigate(`/document-edit/1/${item.bcert_number}`, { state: { previewMode: true } })}
                                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap"
                                  >
                                    Preview
                                  </button> */}
                                  <button
                                    onClick={() => navigate(`/document-edit/1/${item.bcert_number}`, { state: { autoPrint: true, previewMode: true } })}
                                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap"
                                  >
                                    Print
                                  </button>
                                  {isItemReleased && (
                                    <button
                                      onClick={() => setSelectedDetailRecord(item)}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors whitespace-nowrap"
                                      title="Archive this released record"
                                    >
                                      <Archive className="h-3 w-3" /> Archive
                                    </button>
                                  )}
                                  {/* Awaiting applicant rebook — read-only badge */}
                                  {isItemAwaitingReschedule && (
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border bg-sky-50 text-sky-600 border-sky-200 cursor-default select-none whitespace-nowrap"
                                      title="Awaiting applicant to book a new slot via their portal"
                                    >
                                      <CalendarClock className="h-3 w-3" /> Awaiting Applicant
                                    </span>
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

export default Certificate;