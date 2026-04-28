import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Plus, ArrowUpDown, CalendarCheck, CalendarX, Calendar, RefreshCw, X,
  Filter, ChevronDown, SlidersHorizontal, RotateCcw, Eye, Edit2, Save, CreditCard, Mail, Download,
  IdCard, ZoomIn, FileQuestion, Loader2, QrCode, Camera,
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
import { generatePDF } from '@/utils/pdfGenerator';
import type { TextField } from '@/types/certificate';
import type { SavedLayout } from '@/components/documentMaker/CertificateEditor';
import type { QRCodeFieldData } from '@/components/documentMaker/QRCodeField';

interface StreetOption {
  id: number;
  name: string;
  zone?: string;
  formerly?: string;
}

// Zone options for dropdown
const ZONE_OPTIONS = [
  'Zone 1',
  'Zone 2',
  'Zone 3',
  'Zone 4',
  'Zone 5',
  'Zone 6',
  'Zone 7',
  'Zone 8',
  'Zone 9',
  'Zone 10',
];

// ─── CONCAT GROUPS ─────────────────────────────────────────────────────────────
interface ConcatGroup {
  label: string;
  members: string[];
  separator: string;
}

const RELEASE_CONCAT_GROUPS: ConcatGroup[] = [
  {
    label: 'Full Name',
    members: ['Prefix', 'First Name', 'Middle Name', 'Last Name', 'Ext Name', 'Extension'],
    separator: ' ',
  },
  {
    label: 'Full Address',
    members: ['House Block Lot No', 'Street', 'Zone'],
    separator: ', ',
  },
];

// ─── Robust label normaliser ───────────────────────────────────────────────────
const normLabel = (s: string) =>
  s.trim()
   .toLowerCase()
   .replace(/[.\-_]/g, ' ')
   .replace(/\s+/g, ' ')
   .trim();

// ─── LABEL_TO_KEY map ─────────────────────────────────────────────────────────
const LABEL_TO_KEY: Record<string, string> = {
  'First Name': 'first_name',
  'Middle Name': 'middle_name',
  'M.I.': 'middle_name',
  'Last Name': 'surname',
  'Prefix': 'prefix',
  'Ext Name': 'ext_name',
  'Extension': 'extension',
  'Nickname': 'nick_name',
  'Sex': 'sex',
  'Marital Status': 'marital_status',
  'Name of Spouse': 'name_of_spouse',
  'Age': 'age',
  'Date of Birth': 'dob',
  'Place of Birth': 'pob',
  'Date': 'created_at',
  'House Block Lot No': 'house_block_lot_no',
  'Street': 'street',
  'Zone': 'zone',
  'Resident Status': 'resident_status',
  'Period of Residency': 'period_of_residency',
  'House Owner': 'house_owner',
  'Relationship to House Owner': 'relationship_to_owner',
  'Contact No': 'contact_no',
  'Phone Number': 'phone_number',
  'Email Address': 'email_address',
  'Business Name': 'business_name',
  'Business Type': 'business_type',
  'Business Details': 'business_details',
  'Capital': 'capital',
  'Establishment': 'establishment',
  'Inspected By': 'inspected_by',
  'Date of Inspection': 'date_of_inspection',
  'Inspection Remarks': 'inspection_remarks',
  'Inspected Remarks': 'inspected_remarks',
  'Date Inspected': 'date_inspected',
  'Inspected Note': 'inspected_note',
  'OR No': 'or_no',
  'OR No Alt': 'orNo',
  'CTC/VRR No': 'ctc_vrr_no',
  'Issued At': 'issued_at',
  'Issued On': 'issued_on',
  'Issued Date': 'issued_date',
  'Purpose': 'purpose',
  'Purpose Details': 'purpose_details',
  'Remarks': 'remarks',
  'Barangay Clearance No': 'bcert_number',
  'Brgy Business No': 'brgy_business_no',
  'Punong Barangay': 'punong_barangay',
  'For The Punong Barangay': 'for_the_punong_barangay',
  'Barangay Position': 'barangay_position',
  'Status': 'status',
  'Registered Voter': 'registered_voter',
  'Photo': 'photo',
  'Notes': 'notes',
  'Position': 'position',
  'Occupation': 'occupation',
  'Employment Status': 'emp_status',
  'Blood Type': 'blood_type',
  'Complexion': 'complexion',
  'PWD': 'pwd',
  'Precinct No': 'precinct_no',
  'Religion': 'religion',
  'Voter Status': 'voter_status',
  'Height (cm)': 'height_cm',
  'Weight (kg)': 'weight_kg',
  'ID': 'id',
  'Resident ID': 'resident_id',
  'Requester ID': 'requester_id',
  'Requester Type': 'requester_type',
  'Created At': 'created_at',
  'Updated At': 'updated_at',
  'Created By': 'created_by',
};

const NON_DATE_KEYS = new Set([
  'zone', 'house_block_lot_no', 'street', 'houseBlockLot', 'houseBlockLotNo',
  'resident_status', 'period_of_residency', 'house_owner', 'relationship_to_owner',
  'contact_no', 'phone_number', 'email_address', 'business_name', 'business_type',
  'business_details', 'establishment', 'inspection_remarks', 'inspected_remarks',
  'inspected_note', 'or_no', 'orNo', 'ctc_vrr_no', 'issued_at', 'purpose',
  'purpose_details', 'remarks', 'bcert_number', 'brgy_business_no',
  'punong_barangay', 'for_the_punong_barangay', 'barangay_position', 'status',
  'registered_voter', 'notes', 'position', 'occupation', 'emp_status',
  'blood_type', 'complexion', 'pwd', 'precinct_no', 'religion', 'voter_status',
  'resident_id', 'prefix', 'ext_name', 'nick_name', 'sex', 'marital_status',
  'name_of_spouse', 'place_of_birth', 'pob', 'first_name', 'middle_name',
  'surname', 'capital', 'inspected_by', 'height_cm', 'weight_kg', 'created_by',
  'extension',
]);

const FIELD_WRAP_CONFIG: Record<string, number> = {
  'Full Address': 50,
  'Address': 50,
  'House Block Lot No': 40,
  'Street': 35,
  'Zone': 20,
  'Full Name': 40,
  'Purpose': 45,
  'Purpose Details': 55,
  'Remarks': 60,
};

function wrapTextFieldToLines(fieldLabel: string, value: string): string[] {
  if (!value) return [''];
  
  const configKey = Object.keys(FIELD_WRAP_CONFIG).find(
    key => fieldLabel?.toLowerCase().includes(key.toLowerCase())
  );
  
  const maxChars = configKey ? FIELD_WRAP_CONFIG[configKey] : 60;
  
  if (value.length <= maxChars) return [value];
  
  const words = value.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines;
}

function cleanZoneNumber(value: string): string {
  if (!value) return '';
  
  // Handle "SITIO 7" -> "Zone 7"
  const sitioMatch = value.match(/SITIO\s*(\d+)/i);
  if (sitioMatch) {
    return `Zone ${sitioMatch[1]}`;
  }
  
  const zoneMatch = value.match(/Zone\s*(\d+)/i);
  if (zoneMatch) {
    return `Zone ${zoneMatch[1]}`;
  }
  
  const numberMatch = value.match(/^\d+$/);
  if (numberMatch) {
    return `Zone ${numberMatch[0]}`;
  }
  
  const anyNumberMatch = value.match(/\d+/);
  if (anyNumberMatch) {
    return `Zone ${anyNumberMatch[0]}`;
  }
  
  return value.trim();
}

// ─── buildLabelValueMap ────────────────────────────────────────────────────────
function buildLabelValueMap(formData: any): Record<string, string> {
  const prefix = formData.prefix ?? '';
  const firstName = formData.first_name ?? '';
  const middleName = formData.middle_name ?? '';
  const lastName = formData.surname ?? '';
  const extName = formData.ext_name ?? '';
  const extension = formData.extension ?? '';
  
  const nameParts = [];
  if (prefix) nameParts.push(prefix);
  if (firstName) nameParts.push(firstName);
  if (middleName) nameParts.push(middleName);
  if (lastName) nameParts.push(lastName);
  if (extName) nameParts.push(extName);
  if (extension) nameParts.push(extension);
  const fullName = nameParts.join(' ');
  
  const houseBlockLot = formData.house_block_lot_no ?? '';
  const street = formData.street ?? '';
  let zone = formData.zone ?? '';
  zone = cleanZoneNumber(zone);
  
  const addressParts = [];
  if (houseBlockLot) addressParts.push(houseBlockLot);
  if (street) addressParts.push(street);
  if (zone) addressParts.push(zone);
  const fullAddress = addressParts.join(', ');
  
  return {
    'Prefix':       prefix,
    'First Name':   firstName,
    'Middle Name':  middleName,
    'Last Name':    lastName,
    'Ext Name':     extName,
    'Extension':    extension,
    'Full Name':    fullName,
    'House Block Lot No': houseBlockLot,
    'Street':       street,
    'Zone':         zone,
    'Full Address': fullAddress,
    'Age':          formData.age                  ?? '',
    'Date of Birth': formData.dob                 ?? '',
    'Period of Residency': formData.period_of_residency ?? '',
    'Registered Voter':    formData.registered_voter    ?? '',
    'Purpose':             formData.purpose             ?? '',
    'BCert Number':        formData.bcert_number        ?? '',
    'Issued Date':         formData.issued_date         ?? '',
    'Issued At':           formData.issued_at           ?? '',
    'Issued On':           formData.issued_on           ?? '',
    'OR No':               formData.or_no               ?? '',
    'CTC/VRR No':          formData.ctc_vrr_no          ?? '',
    'Remarks':             formData.remarks             ?? '',
    'Status':              formData.status              ?? '',
    'Created By':          formData.created_by          ?? '',
    'Date':                formData.created_at          ?? '',
    'Email Address':       formData.email               ?? '',
    'Requester Type':      formData.requester_type      ?? '',
  };
}

// ─── buildReleasePDFFields ─────────────────────────────────────────────────────
function buildReleasePDFFields(
  fields: TextField[],
  labelValueMap: Record<string, string>
): TextField[] {
  const suppressedNorm = new Set<string>();
  const extras: TextField[] = [];

  const fieldsToSuppress = [
    'first name', 'middle name', 'm i', 'mi', 'last name', 'surname',
    'prefix', 'ext name', 'extension', 'house block lot no', 'street', 'zone'
  ];

  for (const group of RELEASE_CONCAT_GROUPS) {
    const anchor = group.members
      .map(m => fields.find(f => normLabel(f.label) === normLabel(m)))
      .find(Boolean);

    if (!anchor) continue;

    let combinedValue = '';
    if (group.label === 'Full Name') {
      combinedValue = labelValueMap['Full Name'] || '';
    } else if (group.label === 'Full Address') {
      combinedValue = labelValueMap['Full Address'] || '';
    }

    if (combinedValue) {
      extras.push({ ...anchor, label: group.label, value: combinedValue });
    }

    group.members.forEach(m => suppressedNorm.add(normLabel(m)));
  }

  const base = fields.filter(f => {
    const normalizedLabel = normLabel(f.label);
    if (fieldsToSuppress.some(suppress => normalizedLabel === suppress)) {
      return false;
    }
    return !suppressedNorm.has(normalizedLabel);
  });

  return [...base, ...extras];
}

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

const PURPOSE_OPTIONS = [
  'Employment',
  'Business',
  'Travel',
  'Legal Purposes',
  'School Requirement',
  'Bank Transaction',
  'Other',
];

const FILTER_PARAM_KEYS: Record<keyof FilterState, string> = {
  status: 'status',
  filter_date: 'date',
  from: 'from',
  to: 'to',
  purpose: 'purpose',
  schedule_filter: 'schedule',
};

function filtersFromParams(params: URLSearchParams): FilterState {
  return {
    status: params.get('status') ?? '',
    filter_date: params.get('date') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    purpose: params.get('purpose') ?? '',
    schedule_filter: params.get('schedule') ?? '',
  };
}

function buildParams(filters: FilterState, search: string, page: number): URLSearchParams {
  const p = new URLSearchParams();
  if (search) p.set('search', search);
  if (page > 1) p.set('page', String(page));
  (Object.keys(FILTER_PARAM_KEYS) as (keyof FilterState)[]).forEach(key => {
    const val = filters[key];
    if (val) p.set(FILTER_PARAM_KEYS[key], val);
  });
  return p;
}

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
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

function countActiveFilters(f: FilterState): number {
  return [
    f.status, f.filter_date,
    f.filter_date === 'custom' && f.from ? 'from' : '',
    f.purpose, f.schedule_filter,
  ].filter(Boolean).length;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  incomplete: 'bg-orange-50 text-orange-700 border-orange-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  released: 'bg-green-100 text-green-800 border-green-200',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  encoded: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  to_pay: 'bg-purple-100 text-purple-800 border-purple-200',
  paid: 'bg-teal-100 text-teal-800 border-teal-200',
  inspecting: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-gray-500 text-sm">—</span>;
  const key = status.toLowerCase();
  const style = STATUS_STYLES[key] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${style}`}>
      {status === 'to_pay' || status === 'TO_PAY' ? 'TO PAY' : status}
    </span>
  );
}

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
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border w-fit ${isUpcoming ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
        <CalendarCheck className="h-3 w-3" />
        {formatDateShort(schedule.schedule_date)}
      </span>
      <span className="text-[10px] text-gray-500 pl-0.5">
        {formatTimeRange(schedule.schedule_time)}
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
  const [idBack, setIdBack] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const run = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/mydocuments', { params: { user_id: userId } });
        const documents = data.data?.documents || {};
        let front: string | null = null;
        let back: string | null = null;
        Object.values(documents).forEach((categoryDocs: any) => {
          (categoryDocs as any[]).forEach((doc: any) => {
            const url = doc.url ?? `http://127.0.0.1:8000/uploads/${doc.original_filename}`;
            if (doc.type === 'valid_id_front') front = url;
            if (doc.type === 'valid_id_back') back = url;
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
          <IdImageCard label="Government ID — Back" url={idBack} onZoom={onZoom} />
        </div>
      )}
    </div>
  );
}

function QRScannerModal({ onClose, onScan }: { onClose: () => void; onScan: (result: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-scanner-container-certificate";
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState<string | null>(null);

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

// ─── Memoized Form Field Component ─────────────────────────────────────────────
const FormField = memo(({ 
  name, 
  value, 
  onChange, 
  type = 'text', 
  options, 
  isTextArea = false,
  isEditing,
  label
}: any) => {
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);
  const inputId = `field-${name}`;
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isEditing, name]);
  
  if (type === 'select' && options) {
    return (
      <div>
        <label htmlFor={inputId} className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
        {isEditing ? (
          <select 
            ref={inputRef as any}
            id={inputId}
            name={name} 
            value={value} 
            onChange={onChange} 
            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          >
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
          <textarea 
            ref={inputRef as any}
            id={inputId}
            name={name} 
            value={value} 
            onChange={onChange} 
            rows={3} 
            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
          />
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
          <input 
            ref={inputRef as any}
            id={inputId}
            type="date" 
            name={name} 
            value={value} 
            onChange={onChange} 
            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
            autoComplete="off"
          />
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
          <input 
            ref={inputRef as any}
            id={inputId}
            type="number" 
            name={name} 
            value={value} 
            onChange={onChange} 
            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
            autoComplete="off"
          />
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
        <input 
          ref={inputRef as any}
          id={inputId}
          type={type} 
          name={name} 
          value={value} 
          onChange={onChange} 
          className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
          autoComplete="off"
        />
      ) : (
        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{value || '—'}</p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

// ─── Editable Detail Modal ─────────────────────────────────────────────────────
function EditableDetailModal({
  record,
  onClose,
  onUpdate,
  toast,
}: {
  record: CertificateType | null;
  onClose: () => void;
  onUpdate: () => void;
  toast: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [initialReleasedPath, setInitialReleasedPath] = useState<string | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [releasedPath, setReleasedPath] = useState<string | null>(null);
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [dispositionType, setDispositionType] = useState<'REJECTED' | 'INCOMPLETE' | null>(null);
  const [dispositionReason, setDispositionReason] = useState('');
  const [isDisposing, setIsDisposing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [streets, setStreets] = useState<StreetOption[]>([]);

  useEffect(() => {
    const loadStreets = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) { 
        console.error("Failed to fetch streets:", e); 
      }
    };
    loadStreets();
  }, []);

  const [formData, setFormData] = useState<any>({
    bcert_number: '',
    first_name: '',
    middle_name: '',
    surname: '',
    extension: '',
    prefix: '',
    ext_name: '',
    age: '',
    dob: '',
    registered_voter: '',
    period_of_residency: '',
    house_block_lot_no: '',
    street: '',
    zone: '',
    purpose: '',
    status: '',
    created_by: '',
    issued_date: '',
    issued_at: '',
    issued_on: '',
    or_no: '',
    ctc_vrr_no: '',
    punong_barangay: '',
    for_the_punong_barangay: '',
    barangay_position: '',
    requester_type: '',
    email: '',
    remarks: '',
    rejection_reason: '',
    created_at: '',
  });

  const fetchFullRecord = useCallback(async () => {
    if (!record) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/barangay-certificates?search=${record.bcert_number}`, { withCredentials: true });
      const full = response.data.data.data[0];
      setCurrentStatus(full.status ?? '');
      setInitialReleasedPath(full.released_document_path ?? null);
      setFormData({
        bcert_number: full.bcert_number || '',
        first_name: full.first_name || '',
        middle_name: full.middle_name || '',
        surname: full.surname || '',
        extension: full.extension || '',
        prefix: full.prefix || '',
        ext_name: full.ext_name || '',
        age: full.age || '',
        dob: full.dob ? full.dob.split('T')[0] : '',
        registered_voter: full.registered_voter || '',
        period_of_residency: full.period_of_residency || '',
        house_block_lot_no: full.house_block_lot_no || '',
        street: full.street || '',
        zone: full.zone || '',
        purpose: full.purpose || '',
        status: full.status || '',
        created_by: full.created_by || '',
        issued_date: full.issued_date ? full.issued_date.split('T')[0] : '',
        issued_at: full.issued_at || '',
        issued_on: full.issued_on || '',
        or_no: full.or_no || '',
        ctc_vrr_no: full.ctc_vrr_no || '',
        punong_barangay: full.punong_barangay || '',
        for_the_punong_barangay: full.for_the_punong_barangay || '',
        barangay_position: full.barangay_position || '',
        requester_type: full.requester_type || '',
        email: full.email || '',
        remarks: full.remarks || '',
        rejection_reason: full.rejection_reason || '',
        created_at: full.created_at || '',
      });
    } catch (error) {
      console.error('Error fetching full record:', error);
      toast({ title: 'Error', description: 'Failed to load record details', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [record, toast]);

  useEffect(() => {
    fetchFullRecord();
  }, [fetchFullRecord, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({ title: 'Refreshed', description: 'Record data has been refreshed' });
  };

  useEffect(() => {
    if (initialReleasedPath) setReleasedPath(initialReleasedPath);
  }, [initialReleasedPath]);

  const hasReleasedDocument = !!releasedPath;

  if (!record) return null;

  const status = currentStatus.toUpperCase();
  const canMarkToPay = status === 'ENCODED' || status === 'SCHEDULED' || status === 'RELEASED' || status === 'INCOMPLETE' || status === 'REJECTED' || status === 'INSPECTING';
  const canRelease = status === 'PAID';
  const canMarkToInspection = status === 'ENCODED' || status === 'SCHEDULED';

  const handleMarkToPay = async () => {
    setActionLoading('to_pay');
    try {
      await axios.put(`http://127.0.0.1:8000/api/barangay-certificates/${record.id}`, { status: 'TO_PAY' }, { withCredentials: true });
      setCurrentStatus('TO_PAY');
      setFormData((p: any) => ({ ...p, status: 'TO_PAY' }));
      toast({ title: 'Success', description: 'Status set to To Pay successfully.' });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to update status.', variant: 'destructive' });
    } finally { setActionLoading(null); }
  };

  const handleMarkToInspection = async () => {
    setActionLoading('inspection');
    try {
      await axios.put(`http://127.0.0.1:8000/api/barangay-certificates/${record.id}`, { status: 'INSPECTING' }, { withCredentials: true });
      setCurrentStatus('INSPECTING');
      setFormData((p: any) => ({ ...p, status: 'INSPECTING' }));
      toast({ title: 'Success', description: 'Status set to Inspection successfully.' });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to update status.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisposition = async () => {
    if (!record?.id || !dispositionType) return;
    if (!dispositionReason.trim()) {
      toast({ title: 'Reason required', description: 'Please provide a reason before submitting.', variant: 'destructive' });
      return;
    }
    setIsDisposing(true);
    try {
      await axios.post(`http://127.0.0.1:8000/api/barangay-certificates/${record.id}/disposition`, { status: dispositionType, reason: dispositionReason.trim() }, { withCredentials: true });
      const label = dispositionType === 'REJECTED' ? 'Rejected' : 'Marked as Incomplete';
      setCurrentStatus(dispositionType);
      setFormData((p: any) => ({ ...p, status: dispositionType }));
      toast({ title: 'Success', description: `Record ${label} successfully.` });
      setShowDispositionModal(false);
      setDispositionReason('');
      setDispositionType(null);
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to update disposition.', variant: 'destructive' });
    } finally { setIsDisposing(false); }
  };

  const openDisposition = (type: 'REJECTED' | 'INCOMPLETE') => {
    setDispositionType(type);
    setDispositionReason('');
    setShowDispositionModal(true);
  };

  function truncateText(value: string, maxLength: number = 45): string {
    if (!value) return '';
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength - 3) + '...';
  }

  const handleReleaseAndSave = async () => {
    if (!record?.id) {
      toast({ title: 'Error', description: 'No record to release.', variant: 'destructive' });
      return;
    }
    setIsReleasing(true);
    try {
      const metaRes = await axios.get(`http://127.0.0.1:8000/api/documents/single/1`, { withCredentials: true });
      const fileUrl = metaRes.data?.file_url;
      if (!fileUrl) throw new Error('Template file URL missing.');

      const resolvedUrl = fileUrl.startsWith('http') ? fileUrl : `https://bold-sunset-533d.clarkkentraguhos.workers.dev${fileUrl}`;

      const pdfRes = await axios.get(resolvedUrl, { responseType: 'arraybuffer', withCredentials: true });
      const templateBytes = await new Blob([pdfRes.data], { type: 'application/pdf' }).arrayBuffer();

      let savedFields: TextField[] = [];
      let savedQrField: QRCodeFieldData | null = null;

      if (metaRes.data?.layout) {
        try {
          const parsed = Array.isArray(metaRes.data.layout) ? metaRes.data.layout : JSON.parse(metaRes.data.layout);
          if (Array.isArray(parsed)) {
            savedFields = parsed;
            savedQrField = null;
          } else if (parsed.fields !== undefined) {
            const layout = parsed as SavedLayout;
            savedFields = layout.fields ?? [];
            savedQrField = layout.qrField ?? null;
          }
        } catch {
          console.error('Could not parse template layout JSON');
        }
      }

      const fieldsWithValues: TextField[] = savedFields.map((field: TextField) => {
        const key = LABEL_TO_KEY[field.label];
        if (!key) return { ...field, value: field.value ?? '' };
        let value: any = (formData as any)[key] ?? '';
        if (!NON_DATE_KEYS.has(key) && typeof value === 'string' && value.includes('T')) {
          const d = new Date(value);
          if (!isNaN(d.getTime())) value = d.toISOString().split('T')[0];
        }
        return { ...field, value: value ?? '' };
      });

      const labelValueMap = buildLabelValueMap(formData);
      const finalFields = buildReleasePDFFields(fieldsWithValues, labelValueMap);
      const renderedBytes = await generatePDF(templateBytes, finalFields, savedQrField, record.bcert_number ?? null);
      const filename = `barangay-certificates-${record.id}-${record.bcert_number ?? 'doc'}.pdf`;
      const blob = new Blob([new Uint8Array(renderedBytes).buffer], { type: "application/pdf" });
      const fd = new FormData();
      fd.append('file', blob, filename);

      const res = await axios.post(`http://127.0.0.1:8000/api/documents/release/barangay-certificates/${record.id}`, fd, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });

      const path = res.data?.data?.released_document_path;
      if (path) setReleasedPath(path);
      setCurrentStatus('RELEASED');
      setFormData((p: any) => ({ ...p, status: 'RELEASED' }));
      toast({ title: 'Success', description: 'Document released successfully.' });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to release document.', variant: 'destructive' });
    } finally {
      setIsReleasing(false);
    }
  };

  const downloadReleased = async () => {
    if (!record?.id) {
      toast({ title: 'Error', description: 'No record to download.', variant: 'destructive' });
      return;
    }
    setIsDownloading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/documents/release/barangay-certificates/${record.id}/download`, { withCredentials: true });
      const url = res.data?.data?.url;
      if (!url) throw new Error('No download URL returned.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to get download link.', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      let existingId: number | null = null;
      try {
        const checkRes = await axios.get(`http://127.0.0.1:8000/api/barangay-certificates?search=${record.bcert_number}`, { withCredentials: true });
        const records = checkRes.data.data.data;
        if (records?.length > 0) existingId = records[0].id;
      } catch (error) { console.error('Check existing failed:', error); }

      if (existingId) {
        await axios.put(`http://127.0.0.1:8000/api/barangay-certificates/${existingId}`, formData, { withCredentials: true });
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-lg border border-gray-200 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Certificate Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Reference: {record.bcert_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                  <Edit2 className="h-4 w-4" /> Edit
                </button>
              ) : (
                <>
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
                  <button onClick={handleUpdate} disabled={isSaving} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50">
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

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Only show UserIdViewer if requester_type is 'Online' */}
              {formData.requester_type === 'Online' && (
                <UserIdViewer userId={record?.schedule?.user_id} onZoom={url => setLightboxUrl(url)} />
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>
                {[
                  { label: 'BCert Number', name: 'bcert_number', readOnly: true },
                  { label: 'Prefix', name: 'prefix', type: 'select', options: ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Atty.'] },
                  { label: 'First Name', name: 'first_name' },
                  { label: 'Middle Name', name: 'middle_name' },
                  { label: 'Surname', name: 'surname' },
                  { label: 'Ext Name', name: 'ext_name' },
                  { label: 'Extension', name: 'extension' },
                  { label: 'Age', name: 'age', type: 'number' },
                ].map((f) => (
                  <div key={f.name}>
                    <FormField 
                      name={f.name}
                      value={formData[f.name] || ''}
                      onChange={handleInputChange}
                      type={f.type || 'text'}
                      options={f.options}
                      isEditing={isEditing && !f.readOnly}
                      label={f.label}
                    />
                  </div>
                ))}
                <div>
                  <FormField 
                    name="dob"
                    value={formData.dob || ''}
                    onChange={handleInputChange}
                    type="date"
                    isEditing={isEditing}
                    label="Date of Birth"
                  />
                </div>
                <div>
                  <FormField 
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    type="email"
                    isEditing={isEditing}
                    label="Email"
                  />
                </div>
                <div>
                  <FormField 
                    name="requester_type"
                    value={formData.requester_type || ''}
                    onChange={handleInputChange}
                    type="select"
                    options={['Online', 'Walk-in']}
                    isEditing={isEditing}
                    label="Requester Type"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Address Information</h3>
                {[
                  { label: 'House/Block/Lot No.', name: 'house_block_lot_no' },
                  { label: 'Street', name: 'street', type: 'select', options: streets.map(s => s.name) },
                  { label: 'Zone', name: 'zone', type: 'select', options: ZONE_OPTIONS },
                  { label: 'Period of Residency', name: 'period_of_residency' },
                ].map((f) => (
                  <div key={f.name}>
                    <FormField 
                      name={f.name}
                      value={formData[f.name] || ''}
                      onChange={handleInputChange}
                      type={f.type || 'text'}
                      options={f.options}
                      isEditing={isEditing}
                      label={f.label}
                    />
                  </div>
                ))}
                <div>
                  <FormField 
                    name="registered_voter"
                    value={formData.registered_voter || ''}
                    onChange={handleInputChange}
                    type="select"
                    options={['Yes', 'No']}
                    isEditing={isEditing}
                    label="Registered Voter"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Document Information</h3>
                <div>
                  <FormField 
                    name="purpose"
                    value={formData.purpose || ''}
                    onChange={handleInputChange}
                    type="select"
                    options={PURPOSE_OPTIONS}
                    isEditing={isEditing}
                    label="Purpose"
                  />
                </div>
                <div>
                  <FormField 
                    name="issued_date"
                    value={formData.issued_date || ''}
                    onChange={handleInputChange}
                    type="date"
                    isEditing={isEditing}
                    label="Issued Date"
                  />
                </div>
                <div>
                  <FormField 
                    name="or_no"
                    value={formData.or_no || ''}
                    onChange={handleInputChange}
                    type="text"
                    isEditing={isEditing}
                    label="OR No."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Status</label>
                  <div className="mt-1"><StatusBadge status={currentStatus} /></div>
                </div>
                {formData.rejection_reason && (
                  <div>
                    <FormField 
                      name="rejection_reason"
                      value={formData.rejection_reason || ''}
                      onChange={handleInputChange}
                      type="text"
                      isTextArea={true}
                      isEditing={isEditing}
                      label="Reason of rejection"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Schedule & Remarks</h3>
                {(record as any).schedule ? (
                  <>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule Date</label>
                      <p className="text-sm text-gray-700 mt-1">{new Date((record as any).schedule.schedule_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule Time</label>
                      <p className="text-sm text-gray-700 mt-1">{formatTimeRange((record as any).schedule.schedule_time)}</p>
                    </div>
                    {(record as any).schedule.note && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Schedule Note</label>
                        <p className="text-sm text-gray-700 mt-1">{(record as any).schedule.note}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">No schedule assigned.</p>
                )}
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Created At</label>
                  <p className="text-sm text-gray-700 mt-1">{formatCreatedAt(formData.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {showDispositionModal && (
            <div className="mx-6 mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${dispositionType === 'REJECTED' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                    {dispositionType === 'REJECTED' ? 'Reject' : 'Mark as Incomplete'}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">Provide a reason</span>
                </div>
                <button onClick={() => { setShowDispositionModal(false); setDispositionReason(''); setDispositionType(null); }} className="p-1 hover:bg-gray-200 rounded-md transition-colors">
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <textarea rows={3} placeholder={dispositionType === 'REJECTED' ? 'e.g. Insufficient documents, unverifiable information…' : 'e.g. Missing birth certificate, incomplete address…'} value={dispositionReason} onChange={e => setDispositionReason(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none bg-white" />
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => { setShowDispositionModal(false); setDispositionReason(''); setDispositionType(null); }} className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors">Cancel</button>
                <button onClick={handleDisposition} disabled={isDisposing || !dispositionReason.trim()} className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md text-white transition-colors disabled:opacity-50 ${dispositionType === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                  {isDisposing ? 'Submitting…' : dispositionType === 'REJECTED' ? 'Confirm Rejection' : 'Confirm Incomplete'}
                </button>
              </div>
            </div>
          )}

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {canMarkToPay && (
                  <button onClick={handleMarkToPay} disabled={actionLoading === 'to_pay'} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50">
                    <CreditCard className="h-4 w-4" />
                    {actionLoading === 'to_pay' ? 'Updating...' : 'Mark as To Pay'}
                  </button>
                )}
                {canRelease && (
                  <button onClick={handleReleaseAndSave} disabled={isReleasing} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50">
                    <Mail className="h-4 w-4" />
                    {isReleasing ? 'Releasing...' : 'Release Document'}
                  </button>
                )}
                {hasReleasedDocument && (
                  <button onClick={downloadReleased} disabled={isDownloading} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50">
                    <Download className="h-4 w-4" />
                    {isDownloading ? 'Downloading...' : 'Download Released'}
                  </button>
                )}
                <>
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                  <button onClick={() => openDisposition('INCOMPLETE')} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors">
                    <X className="h-4 w-4" />
                    Mark as Incomplete
                  </button>
                  <button onClick={() => openDisposition('REJECTED')} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors">
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </>
                {canMarkToInspection && (
                  <button onClick={handleMarkToInspection} disabled={actionLoading === 'inspection'} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50">
                    <Eye className="h-4 w-4" />
                    {actionLoading === 'inspection' ? 'Updating...' : 'Mark as Inspection'}
                  </button>
                )}
                {!canMarkToPay && !canRelease && !hasReleasedDocument && (status === 'REJECTED' || status === 'INCOMPLETE') && (
                  <p className="text-xs text-gray-400 italic">This record has been {status === 'REJECTED' ? 'rejected' : 'marked as incomplete'}.</p>
                )}
                {!canMarkToPay && !canRelease && !hasReleasedDocument && (
                  <p className="text-xs text-gray-400 italic">No actions available for current status.</p>
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

function FilterBar({ filters, onChange, onReset, activeCount }: { filters: FilterState; onChange: (patch: Partial<FilterState>) => void; onReset: () => void; activeCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        <button className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border ${activeCount > 0 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'} text-sm font-medium transition-all`} onClick={() => setOpen(v => !v)}>
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {activeCount > 0 && <span className="bg-blue-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full inline-flex items-center justify-center px-1">{activeCount}</span>}
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
                {(['', 'PENDING', 'SCHEDULED', 'ENCODED', 'TO_PAY', 'PAID', 'RELEASED', 'REJECTED', 'INCOMPLETE', 'INSPECTING'] as const).map(v => (
                  <button key={v} className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${filters.status === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`} onClick={() => onChange({ status: v })}>
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
                  <button key={opt.v} className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border transition-all ${filters.schedule_filter === opt.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`} onClick={() => onChange({ schedule_filter: opt.v })}>
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
                  <button key={opt.v} className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${filters.filter_date === opt.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`} onClick={() => onChange({ filter_date: opt.v, from: '', to: '' })}>
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
              <select className="w-full h-8 px-2 text-sm border border-gray-200 rounded-md bg-white cursor-pointer focus:outline-none focus:border-blue-400" value={filters.purpose} onChange={e => onChange({ purpose: e.target.value })}>
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
const Certificate = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchValue, setSearchValueRaw] = useState(() => searchParams.get('search') ?? '');
  const [currentPage, setCurrentPageRaw] = useState(() => Number(searchParams.get('page') ?? '1'));
  const [filters, setFiltersRaw] = useState<FilterState>(() => filtersFromParams(searchParams));

  const [data, setData] = useState<CertificateType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
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
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.filter_date && filters.filter_date !== 'custom' ? { filter_date: filters.filter_date } : {}),
        ...(filters.filter_date === 'custom' && filters.from ? { from: filters.from } : {}),
        ...(filters.filter_date === 'custom' && filters.to ? { to: filters.to } : {}),
        ...(filters.purpose ? { purpose: filters.purpose } : {}),
        ...(filters.schedule_filter ? { schedule_filter: filters.schedule_filter } : {}),
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

  const handleRefresh = () => { loadData(); toast({ title: 'Refreshed', description: 'Data has been refreshed' }); };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/barangay-certificates/${id}`, { withCredentials: true });
      toast({ title: 'Deleted', description: 'Certificate deleted successfully.' });
      loadData();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete certificate.', variant: 'destructive' });
    }
  };

  const handleQRScan = useCallback((scannedValue: string) => {
    const trimmed = scannedValue.trim();
    setSearchValue(trimmed);
    toast({ title: 'QR Scanned', description: `Searching for: ${trimmed}` });
  }, []);

  const activeFilterCount = countActiveFilters(filters);

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors select-none" onClick={() => handleSort(field)}>
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
            <Button className="gap-2" onClick={() => navigate('/document-edit/1')}>
              <Plus className="h-4 w-4" /> New Certificate
            </Button>
          </div>

          <div className="flex items-start gap-3 mb-2 flex-wrap" style={{ position: 'relative', zIndex: 40 }}>
            <div className="flex-1 min-w-[200px] flex items-center gap-2">
              <ClearanceSearchBar searchValue={searchValue} onSearchChange={setSearchValue} onRefresh={handleRefresh} />
              <button onClick={() => setShowQRScanner(true)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all flex-shrink-0" title="Scan QR code to search">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Scan QR</span>
              </button>
            </div>
            <FilterBar filters={filters} onChange={patch => setFilters(prev => ({ ...prev, ...patch }))} onReset={() => setFilters(EMPTY_FILTERS)} activeCount={activeFilterCount} />
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
                  <button className="text-xs text-blue-600 hover:underline" onClick={() => { setFilters(EMPTY_FILTERS); setSearchValue(''); }}>
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
                      return (
                        <tr key={item.id} className={`${isNew ? 'bg-blue-50/30' : ''} hover:bg-gray-50 transition-colors`}>
                          <td className="pl-3 pr-0 py-3">
                            {isNew && <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" title="New request (< 24h)" />}
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
                          <td className="py-3 px-4"><StatusBadge status={item.status} /></td>
                          <td className="py-3 px-4"><ScheduleCell schedule={(item as any).schedule ?? null} /></td>
                          <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span>{formatCreatedAt((item as any).created_at)}</span>
                              {isNew && <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">New</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{item.created_by ?? '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button onClick={() => setSelectedDetailRecord(item)} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap">
                                <Eye className="h-3 w-3" /> View/Edit
                              </button>
                              <button onClick={() => navigate(`/document-edit/1/${item.bcert_number}`)} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap">
                                Preview
                              </button>
                              <button onClick={() => navigate(`/document-edit/1/${item.bcert_number}`, { state: { autoPrint: true } })} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap">
                                Print
                              </button>
                              <button onClick={() => handleDelete(Number(item.id))} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors whitespace-nowrap">
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

          <ClearancePagination currentPage={currentPage} totalPages={totalPages} total={total} onPageChange={setCurrentPage} />
        </div>
      </div>

      {selectedDetailRecord && (
        <EditableDetailModal record={selectedDetailRecord} onClose={() => setSelectedDetailRecord(null)} onUpdate={loadData} toast={toast} />
      )}

      {showQRScanner && (
        <QRScannerModal onClose={() => setShowQRScanner(false)} onScan={handleQRScan} />
      )}
    </Layout>
  );
};

export default Certificate;