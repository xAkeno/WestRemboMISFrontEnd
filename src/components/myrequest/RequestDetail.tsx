import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRequestById } from "../services/api";
import { format } from "date-fns";
import {
  ArrowLeft, Calendar, AlertTriangle, FileCheck,
  FileText, Loader2,
  User, MapPin, ClipboardList,
  Info, FileX, BadgeCheck,
  X, Copy, Check, Clock, Home, RefreshCw, ChevronRight,
  QrCode, XCircle, AlertCircle, Search,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "../forms/Header";
import QRCodeLib from "qrcode";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_WEB_URL}/api`,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Service {
  id: number;
  name: string;
  description: string;
  requirements: string;
  processing_time: string;
  fee: string;
}

interface ScheduleData {
  id: number;
  document_type: string;
  document_number: string;
  schedule_date: string;
  schedule_time: string;
  note?: string | null;
  status?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const SERVICE_NAME_TO_SLUG: Record<string, string> = {
  "Barangay Certificate":  "barangay_certificate",
  "Barangay Clearance":    "barangay_clearance",
  "Business Clearance":    "business_clearance",
  "Building Clearance":    "building_clearance",
  "Resident Registration": "resident_registration",
};

const statusStyle: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  approved:    { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", dot: "#16a34a" },
  pending:     { bg: "#fefce8", text: "#ca8a04", border: "#fde68a", dot: "#ca8a04" },
  processing:  { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", dot: "#2563eb" },
  encoded:     { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", dot: "#2563eb" },
  incomplete:  { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa", dot: "#ea580c" },
  rejected:    { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3", dot: "#e11d48" },
  released:    { bg: "#dcfce7", text: "#15803d", border: "#86efac", dot: "#15803d" },
  scheduled:   { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#1d4ed8" },
  rescheduled: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#1d4ed8" },
  to_pay:      { bg: "#fefce8", text: "#ca8a04", border: "#fde68a", dot: "#ca8a04" },
  inspecting:  { bg: "#faf5ff", text: "#7c3aed", border: "#ddd6fe", dot: "#7c3aed" },
  // ✅ NEW: no_show status style
  no_show:     { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa", dot: "#ea580c" },
};

const PROCESS_STEPS = [
  { key: "scheduled",  label: "Scheduled"  },
  { key: "review",     label: "Review"     },
  { key: "On-Process", label: "On-Process" },
  { key: "payment",    label: "Payment"    },
  { key: "released",   label: "Released"   },
];

const STATUS_TO_STEP: Record<string, number> = {
  pending: 0, incomplete: 0, processing: 0, encoded: 0,
  approved: 0, inspecting: 0,
  scheduled:   1,
  rescheduled: 1,
  no_show:     1, // ✅ no_show stays at scheduled step
  to_pay:  3,
  released: 5,
  review: 2,
  process: 3,
  paid: 4,
};

const STATUS_MESSAGES: Record<string, { message: string; nextStep: string | null }> = {
  encoded:     { message: "Your request has been received and is currently being processed.", nextStep: "Scheduled" },
  pending:     { message: "Your request has been received and is currently being processed.", nextStep: "Scheduled" },
  processing:  { message: "Your request is being reviewed by the barangay office.", nextStep: "Scheduled" },
  incomplete:  { message: "Action required — please upload missing documents to continue.", nextStep: null },
  approved:    { message: "Your request has been approved!", nextStep: "To Pay" },
  scheduled:   { message: "Your pickup date is confirmed. Visit the barangay at your scheduled time.", nextStep: "Visit Barangay" },
  rescheduled: { message: "Your pickup date has been rescheduled. Visit the barangay at your new scheduled time.", nextStep: "Visit Barangay" },
  // ✅ NEW
  no_show:     { message: "You missed your scheduled pickup. Please reschedule to continue.", nextStep: "Reschedule" },
  to_pay:      { message: "Please proceed to the barangay hall to settle the payment.", nextStep: "Released" },
  released:    { message: "Your document has been sent to your registered email address.", nextStep: null },
  rejected:    { message: "Your request was not approved. See details for more information.", nextStep: null },
  inspecting:  { message: "A barangay officer is currently inspecting your submitted documents.", nextStep: null },
};

const WHAT_NEXT: Record<string, string> = {
  encoded:     "Your documents are currently being validated by the Barangay Secretary. Please wait for the notification to settle the fee.",
  pending:     "Your documents are currently being validated by the Barangay Secretary. Please wait for the notification to settle the fee.",
  processing:  "Your request is under review. You will be notified once a pickup date is assigned.",
  incomplete:  "Please upload the missing documents so we can continue processing your request.",
  approved:    "Your request has been approved. Proceed to the barangay hall to settle the payment.",
  scheduled:   "Go to the barangay hall at your scheduled time. Bring the required documents listed above and present your reference number to the officer.",
  rescheduled: "Go to the barangay hall at your new scheduled time. Bring the required documents listed above and present your reference number to the officer.",
  // ✅ NEW
  no_show:     "You did not appear on your scheduled pickup date. Please reschedule your pickup as soon as possible to avoid further delays.",
  to_pay:      "Proceed to the barangay hall cashier and present your reference number to pay the fee.",
  released:    "Your document has been officially released and sent to your registered email.",
  rejected:    "Your request was not approved. Please contact the barangay office for more information.",
  inspecting:  "A barangay officer is currently reviewing and inspecting your submitted documents. You will be notified once the inspection is complete.",
};

// ✅ UPDATED: no_show is now a blocked-style status (shows its own card, no progress bar)
const BLOCKED_STATUSES = new Set(["rejected", "incomplete", "inspecting"]);

const hasValue = (v: any): boolean =>
  v !== null && v !== undefined && String(v).trim() !== "";

function isMissedSchedule(scheduleDateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const schedDate = new Date(scheduleDateStr + "T00:00:00");
  return schedDate < today;
}

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const PH_HOLIDAYS_2026: string[] = [
  "2026-01-01", "2026-04-09", "2026-05-01", "2026-06-12",
  "2026-08-25", "2026-11-30", "2026-12-25", "2026-12-30",
];

const isHoliday = (dateStr: string): boolean => PH_HOLIDAYS_2026.includes(dateStr);

const validateScheduleDate = (value: string): string => {
  if (!value) return "Schedule date is required.";
  const date = new Date(value + "T12:00:00");
  if (isWeekend(date)) return "Weekends (Saturday/Sunday) are not allowed.";
  if (isHoliday(value)) return "Selected date is a Philippine holiday. Please choose another date.";
  return "";
};

// ─── Office Hours Modal ────────────────────────────────────────────────────────
function OfficeHoursModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,60,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md bg-white overflow-hidden"
        style={{ borderRadius: 4, boxShadow: "0 8px 60px rgba(10,20,60,0.25)", border: "1px solid #dde3ed" }}
      >
        <div style={{ backgroundColor: "#0f2a5e", padding: "16px 24px" }} className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#e8a0bf" }}>Service Hours</p>
            <h2 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1rem" }}>Office Hours & Guidelines</h2>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#0284c7" }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#0369a1" }}>Office Hours</p>
              <p className="text-sm font-semibold" style={{ color: "#0c4a6e" }}>Monday – Friday: 8:00 AM – 5:00 PM</p>
              <p className="text-xs mt-1" style={{ color: "#0369a1" }}>Lunch Break: 12:00 PM – 1:00 PM</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#16a34a" }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#15803d" }}>Processing Guidelines</p>
              <p className="text-sm font-semibold" style={{ color: "#14532d" }}>Follow the steps:</p>
              <ol className="text-xs mt-2 space-y-1" style={{ color: "#15803d" }}>
                <li>1. <span className="font-semibold">Scheduled</span> – Proceed on your assigned date and time at the barangay office and fall in line for processing</li>
                <li>2. <span className="font-semibold">Review</span> – Barangay staff will double check the application along with the requirement</li>
                <li>3. <span className="font-semibold">Processing</span> – Proceed to secretary office for assessment and signature</li>
                <li>4. <span className="font-semibold">Payment</span> – Settle the required fee at the cashier</li>
                <li>5. <span className="font-semibold">Release</span> – Your clearance has been successfully claimed</li>
              </ol>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#ea580c" }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#c2410c" }}>Important Note</p>
              <p className="text-xs" style={{ color: "#c2410c" }}>Requests submitted outside office hours will be processed on the next working day.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-full py-2.5 text-white text-xs font-semibold uppercase tracking-wider" style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const badge = statusStyle[status] ?? { bg: "#f3f4f6", text: "#374151", border: "#d1d5db", dot: "#374151" };
  const label =
    status === "to_pay"      ? "To Pay" :
    status === "rescheduled" ? "Rescheduled" :
    status === "no_show"     ? "No Show" :
    status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
      style={{ backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: badge.dot }} />
      {label}
    </span>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ status, isFreeService, onLearnMore }: { status: string; isFreeService: boolean; onLearnMore: () => void }) {
  const isBlocked   = BLOCKED_STATUSES.has(status);
  const currentStep = isBlocked ? -1 : (STATUS_TO_STEP[status] ?? 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="flex gap-1 mb-2">
            {PROCESS_STEPS.map((step, i) => {
              const done    = !isBlocked && i <= currentStep;
              const current = !isBlocked && i === currentStep;
              return (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full transition-all duration-500"
                  style={{ backgroundColor: done ? (current ? NAVY : "#16a34a") : "#e5e7eb" }}
                />
              );
            })}
          </div>
          <div className="flex">
            {PROCESS_STEPS.map((step, i) => {
              const done    = !isBlocked && i <= currentStep;
              const current = !isBlocked && i === currentStep;
              return (
                <div key={i} className="flex-1">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: done ? (current ? NAVY : "#16a34a") : "#9ca3af" }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={onLearnMore}
          className="text-xs font-semibold text-white px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ backgroundColor: NAVY }}
        >
          Learn More
        </button>
      </div>
    </div>
  );
}

// ─── Copy Buttons ──────────────────────────────────────────────────────────────
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-lg transition-colors"
      style={{ backgroundColor: "#f3f4f6", color: copied ? "#16a34a" : "#9ca3af" }}
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CopyButtonLight({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1.5 transition-colors flex-shrink-0"
      style={{
        fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: copied ? "#f0fdf4" : "#fff",
        color: copied ? "#16a34a" : "#6b7280",
        cursor: "pointer",
      }}
    >
      {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
    </button>
  );
}

// ─── Schedule Card ─────────────────────────────────────────────────────────────
function ScheduleCard({ schedule }: { schedule: ScheduleData }) {
  const dateStr = schedule.schedule_date;
  const timeStr = schedule.schedule_time;

  const friendlyDate = (() => {
    try { return new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }); }
    catch { return dateStr; }
  })();

  const friendlyTime = (() => {
    try {
      const hour = parseInt(timeStr.split(":")[0], 10);
      return hour >= 7 && hour < 12 ? "Morning" : "Afternoon";
    } catch { return timeStr; }
  })();

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #bfdbfe" }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "#dbeafe", borderBottom: "1px solid #bfdbfe" }}>
        <Calendar className="h-3.5 w-3.5" style={{ color: "#1d4ed8" }} />
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#1d4ed8" }}>Scheduled Pickup</span>
      </div>
      <div className="flex items-center gap-4 px-4 py-4 bg-white">
        <div className="flex flex-col items-center justify-center px-3 py-3 rounded-xl flex-shrink-0" style={{ backgroundColor: NAVY, minWidth: 56 }}>
          <span className="text-[9px] font-black uppercase text-white opacity-75">
            {new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, { month: "short" })}
          </span>
          <span className="text-2xl font-black text-white leading-none">{new Date(dateStr + "T12:00:00").getDate()}</span>
          <span className="text-[9px] font-bold text-white opacity-75">{new Date(dateStr + "T12:00:00").getFullYear()}</span>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: NAVY }}>{friendlyDate}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="h-3 w-3" style={{ color: "#2563eb" }} />
            <p className="text-xs font-semibold" style={{ color: "#1d4ed8" }}>{friendlyTime}</p>
          </div>
          {schedule.note && <p className="text-xs mt-1.5 text-gray-500">{schedule.note}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Doc Type Labels ───────────────────────────────────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
  barangay_certificate:  "Barangay Certificate",
  barangay_clearance:    "Barangay Clearance",
  business_clearance:    "Business Clearance",
  building_clearance:    "Building Clearance",
  resident_registration: "Resident Registration",
};

// ─── QR Present Card ──────────────────────────────────────────────────────────
function QRPresentCard({ refNumber, docLabel }: { refNumber: string; docLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !refNumber) return;
    QRCodeLib.toCanvas(canvasRef.current, refNumber, {
      width: 152, margin: 1,
      color: { dark: "#0f2a5e", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).catch(console.error);
  }, [refNumber]);

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a7a 100%)`, boxShadow: "0 4px 20px rgba(15,42,94,0.2)" }}
    >
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(194,70,125,0.25)" }}>
          <QrCode className="h-4 w-4" style={{ color: "#f9a8d4" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Present this at the counter</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Present this QR code at the counter to be scanned by barangay staff and included in the processing queue.
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 px-5 py-5">
        <span
          className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(194,70,125,0.2)", color: "#f9a8d4", border: "1px solid rgba(194,70,125,0.35)" }}
        >
          {docLabel}
        </span>
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: "#fff", border: `2px dashed ${NAVY}` }}>
          <canvas ref={canvasRef} width={152} height={152} style={{ display: "block", borderRadius: 4 }} />
        </div>
        <p className="font-mono text-lg font-black text-white tracking-widest">{refNumber}</p>
      </div>
      <div
        className="flex items-start gap-3 mx-4 mb-4 px-4 py-3 rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: PINK }}>
          <BadgeCheck className="h-3.5 w-3.5 text-white" />
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
          <span className="font-bold text-white">Screenshot or keep this page open</span> — no printing needed. Just show your screen to the staff.
        </p>
      </div>
    </div>
  );
}

// ─── Full Details Modal ────────────────────────────────────────────────────────
function DetailsModal({ request, onClose }: { request: any; onClose: () => void }) {
  const docType = (request.document_type ?? "").replace(/-/g, "_");
  const r = { ...request, ...(request.raw ?? {}) };

  const fmtDate = (d?: string | null) => {
    if (!d) return null;
    try { return format(new Date(d), "MMMM d, yyyy"); } catch { return d; }
  };

  const refNumber = r.bcert_number ?? r.brgy_business_no ?? `REF-${String(r.id).padStart(4, "0")}`;
  const docLabel  = DOC_TYPE_LABELS[docType] ?? docType.replace(/_/g, " ");
  const fullName  = [r.prefix, r.first_name, r.middle_name, r.surname, r.ext_name].filter(Boolean).join(" ");

  const sections = (() => {
    if (docType === "barangay_certificate") {
      return [
        { title: "Personal Information", icon: User, fields: [
          { label: "Full Name",        value: fullName || r.requester_name, full: true },
          { label: "Age",              value: r.age },
          { label: "Date of Birth",    value: fmtDate(r.dob ?? r.date_of_birth) },
          { label: "Place of Birth",   value: r.pob ?? r.place_of_birth },
          { label: "Contact No.",      value: r.contact_no },
          { label: "Email",            value: r.email, full: true },
          { label: "Registered Voter", value: r.registered_voter },
        ]},
        { title: "Address", icon: MapPin, fields: [
          { label: "House / Block / Lot No.", value: r.house_block_lot_no },
          { label: "Street",                  value: r.street },
          { label: "Zone / Sitio",            value: r.zone },
          { label: "House Owner",             value: r.house_owner },
          { label: "Relationship to Owner",   value: r.relationship_to_owner },
          { label: "Period of Residency",     value: r.period_of_residency ? `${r.period_of_residency} year(s)` : null },
        ]},
        { title: "Certificate Details", icon: ClipboardList, fields: [
          { label: "Certificate No.",   value: r.bcert_number },
          { label: "Purpose",           value: r.purpose },
          { label: "Purpose Details",   value: r.purpose_details, full: true },
          { label: "Issued Date",       value: fmtDate(r.issued_date) },
          { label: "Expires At",        value: fmtDate(r.expires_at) },
          { label: "OR No.",            value: r.or_no },
          { label: "Punong Barangay",   value: r.punong_barangay ?? r.for_the_punong_barangay },
          { label: "Barangay Position", value: r.barangay_position },
          { label: "Remarks",           value: r.remarks, full: true },
          { label: "Released At",       value: fmtDate(r.released_at) },
        ]},
      ];
    }
    if (docType === "barangay_clearance") {
      return [
        { title: "Personal Information", icon: User, fields: [
          { label: "Full Name",        value: fullName || r.requester_name, full: true },
          { label: "Date of Birth",    value: fmtDate(r.dob ?? r.date_of_birth) },
          { label: "Place of Birth",   value: r.pob ?? r.place_of_birth },
          { label: "Contact No.",      value: r.contact_no },
          { label: "Email",            value: r.email, full: true },
          { label: "Registered Voter", value: r.registered_voter },
          { label: "CTC / VRR No.",    value: r.ctc_vrr_no },
        ]},
        { title: "Address", icon: MapPin, fields: [
          { label: "House / Block / Lot No.", value: r.house_block_lot_no },
          { label: "Street",                  value: r.street },
          { label: "Zone / Sitio",            value: r.zone },
          { label: "House Owner",             value: r.house_owner },
          { label: "Relationship to Owner",   value: r.relationship_to_owner },
          { label: "Period of Residency",     value: r.period_of_residency ? `${r.period_of_residency} year(s)` : null },
        ]},
        { title: "Clearance Details", icon: ClipboardList, fields: [
          { label: "Clearance No.",   value: r.bcert_number },
          { label: "Purpose",         value: r.purpose },
          { label: "Purpose Details", value: r.purpose_details, full: true },
          { label: "OR No.",          value: r.or_no },
          { label: "Issued Date",     value: fmtDate(r.issued_date ?? r.issued_on ?? r.issued_at) },
          { label: "Expires At",      value: fmtDate(r.expires_at) },
          { label: "Punong Barangay", value: r.punong_barangay ?? r.for_the_punong_barangay },
          { label: "Remarks",         value: r.remarks, full: true },
          { label: "Released At",     value: fmtDate(r.released_at) },
        ]},
      ];
    }
    if (docType === "business_clearance") {
      return [
        { title: "Applicant Information", icon: User, fields: [
          { label: "Full Name", value: fullName || r.requester_name, full: true },
          { label: "Email",     value: r.email, full: true },
        ]},
        { title: "Address", icon: MapPin, fields: [
          { label: "House / Block / Lot No.", value: r.house_block_lot_no },
          { label: "Street",                  value: r.street },
          { label: "Zone / Sitio",            value: r.zone },
        ]},
        { title: "Business Details", icon: ClipboardList, fields: [
          { label: "Business No.",       value: r.brgy_business_no },
          { label: "Business Name",      value: r.business_name },
          { label: "Business Type",      value: r.business_type },
          { label: "Capital",            value: r.capital ? `\u20b1${Number(r.capital).toLocaleString()}` : null },
          { label: "Business Details",   value: r.business_details, full: true },
          { label: "OR No.",             value: r.or_no },
          { label: "Issued Date",        value: fmtDate(r.issued_date) },
          { label: "Expires At",         value: fmtDate(r.expires_at) },
          { label: "Date of Inspection", value: fmtDate(r.date_of_inspection ?? r.date_inspected) },
          { label: "Inspected By",       value: r.inspected_by },
          { label: "Inspection Remarks", value: r.inspection_remarks ?? r.inspected_remarks ?? r.inspected_note, full: true },
          { label: "Remarks",            value: r.remarks, full: true },
          { label: "Released At",        value: fmtDate(r.released_at) },
        ]},
      ];
    }
    if (docType === "building_clearance") {
      return [
        { title: "Applicant Information", icon: User, fields: [
          { label: "Full Name", value: fullName || r.requester_name, full: true },
          { label: "Email",     value: r.email, full: true },
        ]},
        { title: "Address", icon: MapPin, fields: [
          { label: "House / Block / Lot No.", value: r.house_block_lot_no },
          { label: "Street",                  value: r.street },
          { label: "Zone / Sitio",            value: r.zone },
        ]},
        { title: "Building / Project Details", icon: ClipboardList, fields: [
          { label: "Building Clearance No.", value: r.bcert_number },
          { label: "Establishment",          value: r.establishment },
          { label: "Purpose",                value: r.purpose },
          { label: "Purpose Details",        value: r.purpose_details, full: true },
          { label: "OR No.",                 value: r.or_no },
          { label: "Issued Date",            value: fmtDate(r.issued_date) },
          { label: "Expires At",             value: fmtDate(r.expires_at) },
          { label: "Punong Barangay",        value: r.punong_barangay ?? r.for_the_punong_barangay },
          { label: "Barangay Position",      value: r.barangay_position },
          { label: "Remarks",                value: r.remarks, full: true },
          { label: "Released At",            value: fmtDate(r.released_at) },
        ]},
      ];
    }
    if (docType === "resident_registration") {
      return [
        { title: "Personal Information", icon: User, fields: [
          { label: "Full Name",        value: fullName || r.requester_name, full: true },
          { label: "Date of Birth",    value: fmtDate(r.dob ?? r.date_of_birth) },
          { label: "Place of Birth",   value: r.pob ?? r.place_of_birth },
          { label: "Contact No.",      value: r.contact_no },
          { label: "Email",            value: r.email, full: true },
          { label: "Registered Voter", value: r.registered_voter },
        ]},
        { title: "Address", icon: MapPin, fields: [
          { label: "House / Block / Lot No.", value: r.house_block_lot_no },
          { label: "Street",                  value: r.street },
          { label: "Zone / Sitio",            value: r.zone },
          { label: "House Owner",             value: r.house_owner },
          { label: "Relationship to Owner",   value: r.relationship_to_owner },
          { label: "Period of Residency",     value: r.period_of_residency ? `${r.period_of_residency} year(s)` : null },
        ]},
        { title: "Registration Details", icon: ClipboardList, fields: [
          { label: "Registration No.", value: r.bcert_number },
          { label: "OR No.",           value: r.or_no },
          { label: "Issued Date",      value: fmtDate(r.issued_date) },
          { label: "Expires At",       value: fmtDate(r.expires_at) },
          { label: "Remarks",          value: r.remarks, full: true },
          { label: "Released At",      value: fmtDate(r.released_at) },
        ]},
      ];
    }
    return [];
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: "white", borderRadius: "16px 16px 0 0" }}
      >
        <div className="flex-shrink-0" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a7a 100%)` }}>
          <div className="flex items-start justify-between px-5 pt-5 pb-4">
            <div className="flex-1 min-w-0 pr-3">
              <span
                className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2"
                style={{ backgroundColor: "rgba(194,70,125,0.3)", color: "#f9a8d4", border: "1px solid rgba(194,70,125,0.4)" }}
              >
                {docLabel}
              </span>
              <p className="text-xl font-black text-white leading-tight truncate">{refNumber}</p>
              {hasValue(r.created_at) && (
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Submitted {format(new Date(r.created_at), "MMMM d, yyyy · hh:mm aa")}
                </p>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
          <div className="flex items-center justify-between px-5 py-2" style={{ backgroundColor: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Status</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(194,70,125,0.25)", color: "#f9a8d4" }}>
                {r.status ?? "—"}
              </span>
            </div>
            {hasValue(r.updated_at) && (
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                Updated {format(new Date(r.updated_at), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
          {sections.map((sec, i) => {
            const visible = sec.fields.filter((f: any) => hasValue(f.value));
            if (!visible.length) return null;
            const Icon = sec.icon;
            return (
              <div key={i}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f0f4ff" }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: NAVY }} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: NAVY }}>{sec.title}</p>
                  <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {visible.map((f: any, j: number) => (
                    <div key={j} className={f.full ? "col-span-2" : ""}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: PINK }}>{f.label}</p>
                      <p className="text-sm font-medium break-words" style={{ color: NAVY }}>
                        {f.value === true ? "Yes" : f.value === false ? "No" : String(f.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {sections.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: NAVY }} />
              <p className="text-xs text-gray-400">No additional details available.</p>
            </div>
          )}
        </div>
        <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid #f3f4f6" }}>
          <button onClick={onClose} className="w-full py-3 text-sm font-bold text-white rounded-xl" style={{ backgroundColor: NAVY }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reschedule Modal ──────────────────────────────────────────────────────────
interface RescheduleModalProps {
  documentNumber: string;
  documentType: string;
  onClose: () => void;
  onSuccess: () => void;
}

function RescheduleModal({ documentNumber, documentType, onClose, onSuccess }: RescheduleModalProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState("");
  const [dateError, setDateError]       = useState("");
  const [timeGroup, setTimeGroup]       = useState<"morning" | "afternoon" | "">("");
  const [slots, setSlots]               = useState<{ morning: { available: boolean; remaining: number }; afternoon: { available: boolean; remaining: number } } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState("");

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setTimeGroup("");
    setSlots(null);
    setDateError(validateScheduleDate(value));
  };

  useEffect(() => {
    if (!selectedDate || dateError) { setSlots(null); return; }
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlots(null);
      try {
        const res  = await fetch(
          `${import.meta.env.VITE_WEB_URL}/api/schedules/available-slots?document_type=${documentType}&date=${selectedDate}`,
          { credentials: "include", headers: { Accept: "application/json" } }
        );
        const json = await res.json();
        setSlots(json.data ?? null);
      } catch { setSlots(null); }
      finally  { setLoadingSlots(false); }
    };
    fetchSlots();
  }, [selectedDate, dateError, documentType]);

  const handleSubmit = async () => {
    const validationError = validateScheduleDate(selectedDate);
    if (validationError) { setDateError(validationError); return; }
    if (!timeGroup) return;
    setSubmitting(true);
    setError("");
    try {
      const res  = await fetch(
        `${import.meta.env.VITE_WEB_URL}/api/schedules/${documentNumber}/reschedule`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ schedule_date: selectedDate, time_group: timeGroup }),
        }
      );
      const json = await res.json();
      if (!res.ok) { setError(json.message ?? "Failed to reschedule. Please try again."); return; }
      onSuccess();
    } catch { setError("Network error. Please try again."); }
    finally  { setSubmitting(false); }
  };

  const canSubmit = selectedDate && !dateError && timeGroup && !submitting;

  const TimeGroupBtn = ({ group, label, icon, timeRange }: { group: "morning" | "afternoon"; label: string; icon: string; timeRange: string }) => {
    const slot        = slots?.[group];
    const isAvailable = slot?.available ?? false;
    const isSelected  = timeGroup === group;
    return (
      <button
        disabled={!isAvailable}
        onClick={() => isAvailable && setTimeGroup(group)}
        className="flex-1 flex flex-col items-start gap-1 px-4 py-3 rounded-xl transition-all"
        style={{
          border:     isSelected ? `2px solid ${NAVY}` : "2px solid #e5e7eb",
          background: isSelected ? "#f0f4ff" : isAvailable ? "#fff" : "#f9fafb",
          opacity:    isAvailable ? 1 : 0.5,
          cursor:     isAvailable ? "pointer" : "not-allowed",
        }}
      >
        <div className="flex items-center gap-2 w-full">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-bold" style={{ color: isSelected ? NAVY : "#374151" }}>{label}</span>
          {isSelected && <span className="ml-auto"><Check className="h-3.5 w-3.5" style={{ color: NAVY }} /></span>}
        </div>
        <span className="text-[11px]" style={{ color: "#6b7280" }}>{timeRange}</span>
        {slot && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5"
            style={{ background: isAvailable ? "#f0fdf4" : "#fff1f2", color: isAvailable ? "#15803d" : "#be123c" }}
          >
            {isAvailable ? `${slot.remaining} slots left` : "Full"}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-md flex flex-col overflow-hidden"
        style={{ backgroundColor: "white", borderRadius: "20px 20px 0 0", maxHeight: "90vh" }}
      >
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a7a 100%)` }}>
          <div className="flex items-start justify-between px-5 pt-5 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(194,70,125,0.25)" }}>
                  <RefreshCw className="h-4 w-4" style={{ color: "#f9a8d4" }} />
                </div>
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(194,70,125,0.2)", color: "#f9a8d4", border: "1px solid rgba(194,70,125,0.3)" }}
                >
                  No Show – Reschedule
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-2">Reschedule Pickup</h2>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Choose a new date and time slot for your document pickup.
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#ea580c" }} />
            <div>
              <p className="text-xs font-bold" style={{ color: "#9a3412" }}>No Show Recorded</p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#c2410c" }}>
                You were marked as no show for your previous pickup date. Please select a new date to reschedule your document pickup.
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Select New Date</p>
            <input
              type="date"
              min={minDateStr}
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all"
              style={{
                border: `2px solid ${dateError ? "#e11d48" : selectedDate && !dateError ? NAVY : "#e5e7eb"}`,
                color: NAVY,
                backgroundColor: dateError ? "#fff1f2" : selectedDate && !dateError ? "#f0f4ff" : "#fff",
              }}
            />
            {dateError && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#e11d48" }} />
                <p className="text-[11px] font-semibold" style={{ color: "#be123c" }}>{dateError}</p>
              </div>
            )}
          </div>

          {selectedDate && !dateError && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Select Time Slot</p>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-6 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: NAVY }} />
                  <span className="text-xs text-gray-400">Checking availability…</span>
                </div>
              ) : slots ? (
                <div className="flex gap-3">
                  <TimeGroupBtn group="morning"   label="Morning"   icon="🌅" timeRange="8:00 AM – 12:00 PM" />
                  <TimeGroupBtn group="afternoon" label="Afternoon" icon="☀️" timeRange="1:00 PM – 5:00 PM"  />
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">Could not load slots. Try another date.</p>
              )}
            </div>
          )}

          {selectedDate && !dateError && timeGroup && (
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d2fe" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6366f1" }}>New Schedule Summary</p>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: NAVY }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: NAVY }}>
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs" style={{ color: "#6366f1" }}>{timeGroup === "morning" ? "Morning" : "Afternoon"}</p>
                </div>
                <ChevronRight className="h-4 w-4 ml-auto" style={{ color: "#a5b4fc" }} />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl" style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
              <p className="text-xs" style={{ color: "#be123c" }}>{error}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 flex gap-3 flex-shrink-0" style={{ borderTop: "1px solid #f3f4f6" }}>
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold rounded-xl transition-colors" style={{ border: "1px solid #e5e7eb", color: "#6b7280", background: "#fff" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-3 text-sm font-bold rounded-xl text-white transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: canSubmit ? NAVY : "#d1d5db", cursor: canSubmit ? "pointer" : "not-allowed" }}
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Rescheduling…</>
              : <><RefreshCw className="h-4 w-4" /> Confirm Reschedule</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ✅ NEW: No Show Card ──────────────────────────────────────────────────────
function NoShowCard({
  schedule,
  onReschedule,
  onViewDetails,
}: {
  schedule: ScheduleData;
  onReschedule: () => void;
  onViewDetails: () => void;
}) {
  const dateObj      = new Date(schedule.schedule_date + "T12:00:00");
  const fullDateLabel = dateObj.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: "#fff", border: "1px solid #fed7aa", boxShadow: "0 1px 8px rgba(234,88,12,0.10)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", borderBottom: "1px solid #fed7aa" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#ffedd5" }}>
          <AlertTriangle className="h-5 w-5" style={{ color: "#ea580c" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: "#9a3412" }}>No Show Recorded</p>
          <p className="text-[11px]" style={{ color: "#c2410c" }}>
            You did not appear on your scheduled pickup date
          </p>
        </div>
        <span
          className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: "#ffedd5", color: "#ea580c", border: "1px solid #fed7aa" }}
        >
          No Show
        </span>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">
        {/* Missed date info */}
        <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
          <p className="text-xs font-semibold leading-relaxed" style={{ color: "#9a3412" }}>
            You missed your scheduled pickup on <strong>{fullDateLabel}</strong>.
            Your status has been updated to <strong>No Show</strong>. Please reschedule to continue processing your document.
          </p>
        </div>

        {/* What to do */}
        <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>What you need to do</p>
          <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
            Reschedule your pickup as soon as possible. Repeated no-shows may affect your future requests at the barangay office.
          </p>
        </div>

        {/* Reschedule CTA */}
        <button
          onClick={onReschedule}
          className="w-full py-3 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ backgroundColor: NAVY }}
        >
          <RefreshCw className="h-4 w-4" />
          Reschedule Pickup
        </button>

        {/* View Details link */}
        <button
          onClick={onViewDetails}
          className="text-xs font-semibold text-center transition-colors"
          style={{ color: "#9ca3af" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = NAVY)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Scheduled Visit Card ──────────────────────────────────────────────────────
function ScheduledVisitCard({
  schedule,
  refNumber,
  dynamicRequirements,
  onViewDetails,
  onReschedule,
  normalizedStatus,
}: {
  schedule: ScheduleData;
  refNumber: string;
  dynamicRequirements: string[];
  onViewDetails: () => void;
  onReschedule: () => void;
  normalizedStatus: string;
}) {
  const dateObj       = new Date(schedule.schedule_date + "T12:00:00");
  const monthLabel    = dateObj.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const dayLabel      = dateObj.getDate();
  const yearLabel     = dateObj.getFullYear();
  const fullDateLabel = dateObj.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const timeLabel = (() => {
    try {
      const hour = parseInt(schedule.schedule_time.split(":")[0], 10);
      return hour >= 7 && hour < 12 ? "Morning" : "Afternoon";
    } catch { return schedule.schedule_time; }
  })();

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{
        background: "#fff",
        border:     "1px solid #e5e7eb",
        boxShadow:  "0 1px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#eff6ff" }}>
          <Home className="h-4 w-4" style={{ color: "#2563eb" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "#111827" }}>
            Next step: Proceed on your assigned date and time at the barangay office
          </p>
          <p className="text-[11px]" style={{ color: "#9ca3af" }}>Your pickup date is confirmed</p>
        </div>
        <span
          className="text-[11px] font-semibold px-3 py-1 rounded-full flex-shrink-0"
          style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
        >
          {normalizedStatus === "rescheduled" ? "Rescheduled" : "Scheduled"}
        </span>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">

        {/* Rescheduled success banner */}
        {normalizedStatus === "rescheduled" && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#dcfce7" }}>
              <Check className="h-3.5 w-3.5" style={{ color: "#16a34a" }} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: "#15803d" }}>Rescheduled successfully</p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#166534" }}>
                Your new pickup date is confirmed below. Please arrive on time at the barangay office.
              </p>
            </div>
          </div>
        )}

        {/* Schedule Block */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Pickup schedule</p>
          <div className="flex items-center gap-4 rounded-xl px-4 py-4" style={{ background: "#eff6ff" }}>
            <div
              className="flex flex-col items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: "#1d4ed8", padding: "10px 12px", minWidth: 52, textAlign: "center" }}
            >
              <span className="text-[10px] font-bold text-white" style={{ opacity: 0.75 }}>{monthLabel}</span>
              <span className="text-2xl font-black text-white leading-none">{dayLabel}</span>
              <span className="text-[10px] text-white" style={{ opacity: 0.65 }}>{yearLabel}</span>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#1e3a8a" }}>{fullDateLabel}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="h-3 w-3" style={{ color: "#3b82f6" }} />
                <p className="text-xs font-semibold" style={{ color: "#2563eb" }}>{timeLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reference Number */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Reference number</p>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
            <span className="font-mono text-lg font-bold" style={{ color: "#111827", letterSpacing: "0.04em" }}>{refNumber}</span>
          </div>
        </div>

        {/* Documents Checklist */}
        {dynamicRequirements.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Bring these documents</p>
            <div className="flex flex-col gap-1.5">
              {dynamicRequirements.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ border: "1px solid #f3f4f6", background: "#fff" }}>
                  <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 22, height: 22, background: "#eff6ff" }}>
                    <span className="text-[11px] font-bold" style={{ color: "#2563eb" }}>{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="h-3 w-3 flex-shrink-0" style={{ color: "#d1d5db" }} />
                    <p className="text-xs leading-snug" style={{ color: "#374151" }}>{doc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Details */}
        <button
          onClick={onViewDetails}
          className="w-full py-2.5 text-xs font-bold rounded-xl transition-colors"
          style={{ border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff";    (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Rejected Card ─────────────────────────────────────────────────────────────
function RejectedCard({ reason, onViewDetails }: { reason?: string | null; onViewDetails: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#fff", border: "1px solid #fecdd3", boxShadow: "0 1px 8px rgba(225,29,72,0.08)" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", borderBottom: "1px solid #fecdd3" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fee2e2" }}>
          <XCircle className="h-5 w-5" style={{ color: "#e11d48" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: "#9f1239" }}>Request Rejected</p>
          <p className="text-[11px]" style={{ color: "#be123c" }}>Your document request was not approved</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "#fee2e2", color: "#e11d48", border: "1px solid #fecdd3" }}>Rejected</span>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        {hasValue(reason) ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Reason for Rejection</p>
            <div className="flex items-start gap-3 px-4 py-4 rounded-xl" style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#fee2e2" }}>
                <FileX className="h-3.5 w-3.5" style={{ color: "#e11d48" }} />
              </div>
              <p className="text-sm font-semibold leading-relaxed" style={{ color: "#9f1239" }}>{String(reason)}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#be123c" }}>No specific reason was provided. Please contact the barangay office for more information.</p>
          </div>
        )}
        <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>What you can do</p>
          <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>Visit the barangay hall for assistance or to clarify the grounds of rejection. You may resubmit a new request once the issue has been resolved.</p>
        </div>
        <button
          onClick={onViewDetails}
          className="w-full py-2.5 text-xs font-bold rounded-xl transition-colors"
          style={{ border: "1px solid #fecdd3", background: "#fff1f2", color: "#e11d48" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#ffe4e6"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff1f2"; }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Incomplete Card ───────────────────────────────────────────────────────────
function IncompleteCard({ reason, onViewDetails }: { reason?: string | null; onViewDetails: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#fff", border: "1px solid #fed7aa", boxShadow: "0 1px 8px rgba(234,88,12,0.08)" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", borderBottom: "1px solid #fed7aa" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#ffedd5" }}>
          <AlertCircle className="h-5 w-5" style={{ color: "#ea580c" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: "#9a3412" }}>Action Required</p>
          <p className="text-[11px]" style={{ color: "#c2410c" }}>Missing or incomplete documents detected</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "#ffedd5", color: "#ea580c", border: "1px solid #fed7aa" }}>Incomplete</span>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        {hasValue(reason) ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>What Needs Attention</p>
            <div className="flex items-start gap-3 px-4 py-4 rounded-xl" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#ffedd5" }}>
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#ea580c" }} />
              </div>
              <p className="text-sm font-semibold leading-relaxed" style={{ color: "#9a3412" }}>{String(reason)}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#ea580c" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#c2410c" }}>Your submission has missing or incomplete documents. Please check the requirements and resubmit.</p>
          </div>
        )}
        <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>Next step</p>
          <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>Please upload or provide the missing documents as soon as possible so the barangay office can continue processing your request.</p>
        </div>
        <button
          onClick={onViewDetails}
          className="w-full py-2.5 text-xs font-bold rounded-xl transition-colors"
          style={{ border: "1px solid #fed7aa", background: "#fff7ed", color: "#ea580c" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#ffedd5"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff7ed"; }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Inspecting Card ───────────────────────────────────────────────────────────
function InspectingCard({ reason, onViewDetails }: { reason?: string | null; onViewDetails: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#fff", border: "1px solid #ddd6fe", boxShadow: "0 1px 8px rgba(124,58,237,0.08)" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)", borderBottom: "1px solid #ddd6fe" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#ede9fe" }}>
          <Search className="h-5 w-5" style={{ color: "#7c3aed" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: "#4c1d95" }}>Under Inspection</p>
          <p className="text-[11px]" style={{ color: "#6d28d9" }}>A barangay officer is reviewing your business or establishment.</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "#ede9fe", color: "#7c3aed", border: "1px solid #ddd6fe" }}>Inspecting</span>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-4 py-4 rounded-xl" style={{ backgroundColor: "#faf5ff", border: "1px solid #ddd6fe" }}>
          <div className="flex gap-1 flex-shrink-0">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7c3aed", animation: `inspectPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <p className="text-xs font-semibold leading-relaxed" style={{ color: "#4c1d95" }}>The inspection may take a few days to complete.</p>
        </div>
        {hasValue(reason) && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Inspection Note</p>
            <div className="flex items-start gap-3 px-4 py-4 rounded-xl" style={{ backgroundColor: "#faf5ff", border: "1px solid #ddd6fe" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#ede9fe" }}>
                <Info className="h-3.5 w-3.5" style={{ color: "#7c3aed" }} />
              </div>
              <p className="text-sm font-semibold leading-relaxed" style={{ color: "#4c1d95" }}>{String(reason)}</p>
            </div>
          </div>
        )}
        <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>What to expect</p>
          <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>You will be notified once the inspection is complete. No action is needed at this time.</p>
        </div>
        <button
          onClick={onViewDetails}
          className="w-full py-2.5 text-xs font-bold rounded-xl transition-colors"
          style={{ border: "1px solid #ddd6fe", background: "#faf5ff", color: "#7c3aed" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#ede9fe"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#faf5ff"; }}
        >
          View Details
        </button>
      </div>
      <style>{`
        @keyframes inspectPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Review Required Card ──────────────────────────────────────────────────────
function ReviewRequiredCard({ onViewDetails }: { onViewDetails: () => void }) {
  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: "#fff", border: "2px solid #f59e0b", boxShadow: "0 2px 16px rgba(245,158,11,0.15), 0 0 0 4px rgba(245,158,11,0.08)" }}
    >
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", borderBottom: "2px solid #f59e0b" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fef3c7", border: "1.5px solid #f59e0b" }}>
          <span className="text-base font-black" style={{ color: "#b45309" }}>1</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black" style={{ color: "#78350f" }}>Review Your Application</p>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "#f59e0b", color: "#fff", animation: "reviewPulse 2s ease-in-out infinite" }}>
              Required
            </span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "#b45309" }}>Action needed before your request proceeds</p>
        </div>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        <div className="flex items-start gap-3 px-4 py-4 rounded-xl" style={{ backgroundColor: "#fffbeb", border: "1.5px dashed #f59e0b" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#fef3c7" }}>
            <AlertTriangle className="h-4 w-4" style={{ color: "#d97706" }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-snug" style={{ color: "#78350f" }}>Please review your submitted details and uploaded documents before proceeding.</p>
            <p className="text-xs mt-1.5 font-semibold leading-relaxed" style={{ color: "#b45309" }}>⚠️ You must complete this step to continue your request.</p>
          </div>
        </div>
        <button
          onClick={onViewDetails}
          className="w-full py-3.5 text-sm font-black rounded-xl text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)", boxShadow: "0 4px 14px rgba(245,158,11,0.35)" }}
        >
          <FileCheck className="h-4 w-4" />
          👉 Click Here to Review
        </button>
      </div>
      <style>{`
        @keyframes reviewPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RequestDetail() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const { id, type } = useParams<{ id: string; type: string }>();

  const [showDetails,     setShowDetails]     = useState(false);
  const [showReschedule,  setShowReschedule]  = useState(false);
  const [showOfficeHours, setShowOfficeHours] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", type, id],
    queryFn:  () => fetchRequestById(type!, id!),
    enabled:  !!id && !!type,
  });

  const { data: schedule, refetch: refetchSchedule } = useQuery({
    queryKey: ["schedule", request?.bcert_number],
    queryFn: async (): Promise<ScheduleData | null> => {
      const res  = await fetch(
        `${import.meta.env.VITE_WEB_URL}/api/schedules/${request!.bcert_number}`,
        { credentials: "include", headers: { Accept: "application/json" } }
      );
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data ?? null;
    },
    enabled: !!request?.bcert_number,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get("/services");
      const raw: Service[] = res.data?.data ?? res.data ?? [];
      const latestMap = new Map<number, Service>();
      raw.forEach((item) => latestMap.set(item.id, item));
      return Array.from(latestMap.values());
    },
    staleTime: 5 * 60 * 1000,
  });

  // ✅ Detect missed schedule and automatically call markNoShow API
  useEffect(() => {
    if (!schedule || !request) return;

    const normalizedStatus = (request.raw?.status ?? "").toLowerCase();

    if (normalizedStatus !== "scheduled") return;
    if (!isMissedSchedule(schedule.schedule_date)) return;

    // Use both document_type + id to avoid ID collisions across document types
    fetch(
      `${import.meta.env.VITE_WEB_URL}/api/schedules/${schedule.document_type}/${schedule.id}/no-show`,
      {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      }
    )
      .then((res) => {
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: ["request", type, id] });
        }
      })
      .catch(() => {});
  }, [schedule, request, queryClient, type, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: NAVY, opacity: 0.4 }} />
          <p className="text-sm text-gray-500 mb-4">Request not found.</p>
          <button
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-xl"
            style={{ backgroundColor: NAVY }}
            onClick={() => navigate("/myrequest")}
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  const normalizedStatus = (request.raw?.status ?? "").toLowerCase();
  const isReleased      = normalizedStatus === "released";
  const isScheduled     = normalizedStatus === "scheduled";
  const isRescheduled   = normalizedStatus === "rescheduled";
  const isNoShow        = normalizedStatus === "no_show"; // ✅ NEW
  const isApproved      = normalizedStatus === "approved";
  const isToPay         = normalizedStatus === "to_pay";
  const isRejected      = normalizedStatus === "rejected";
  const isIncomplete    = normalizedStatus === "incomplete";
  const isInspecting    = normalizedStatus === "inspecting";
  const isBlockedStatus = BLOCKED_STATUSES.has(normalizedStatus);
  const isReviewStatus  = normalizedStatus === "pending" || normalizedStatus === "encoded" || normalizedStatus === "processing";

  const docTypeSlug = (request.document_type ?? type ?? "").replace(/-/g, "_");
  const req         = { ...request, ...(request.raw ?? {}) };

  const matchedService = services.find((s) => SERVICE_NAME_TO_SLUG[s.name] === docTypeSlug);

  const dynamicRequirements: string[] = matchedService
    ? matchedService.requirements.split("\n").map((r) => r.trim()).filter(Boolean)
    : [];

  const svcMeta = matchedService
    ? { fee: matchedService.fee, processingTime: matchedService.processing_time }
    : undefined;

  const isFreeService = svcMeta?.fee === "Free" || String(svcMeta?.fee).toLowerCase() === "free";

  const statusMsg = STATUS_MESSAGES[normalizedStatus];
  const whatNext  = WHAT_NEXT[normalizedStatus];

  const refNumber =
    req.bcert_number ??
    req.brgy_business_no ??
    `REF-${String(request.id).padStart(4, "0")}`;

  const statusLabel =
    normalizedStatus === "to_pay"      ? "To Pay" :
    normalizedStatus === "rescheduled" ? "Rescheduled" :
    normalizedStatus === "no_show"     ? "No Show" :
    normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  const showQRCard = isScheduled || isRescheduled || isApproved || isToPay;
  const rejectionReason = req.rejection_reason ?? null;

  const handleRescheduleSuccess = () => {
    setShowReschedule(false);
    queryClient.invalidateQueries({ queryKey: ["schedule", request?.bcert_number] });
    queryClient.invalidateQueries({ queryKey: ["request", type, id] });
    refetchSchedule();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f6fb" }}>
      <Header />

      {showDetails && <DetailsModal request={request} onClose={() => setShowDetails(false)} />}

      {showReschedule && schedule && (
        <RescheduleModal
          documentNumber={schedule.document_number}
          documentType={docTypeSlug}
          onClose={() => setShowReschedule(false)}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      <OfficeHoursModal open={showOfficeHours} onClose={() => setShowOfficeHours(false)} />

      <div className="max-w-2xl mx-auto px-4 pt-28 pb-16">

        {/* Back */}
        <button
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-6 transition-colors"
          style={{ color: "#9ca3af" }}
          onClick={() => navigate("/myrequest")}
          onMouseEnter={(e) => (e.currentTarget.style.color = NAVY)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Requests
        </button>

        {/* Header Card */}
        <div className="mb-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a7a 100%)`, boxShadow: "0 4px 20px rgba(15,42,94,0.2)" }}>
            <div className="px-5 py-4">
              <span
                className="inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
                style={{ backgroundColor: "rgba(194,70,125,0.25)", color: "#f9a8d4", border: "1px solid rgba(194,70,125,0.35)" }}
              >
                {DOC_TYPE_LABELS[docTypeSlug] ?? docTypeSlug.replace(/_/g, " ")}
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {req.brgy_business_no ? "Business No." : "Reference No."}
                  </p>
                  <p className="text-2xl font-black font-mono text-white">{refNumber}</p>
                </div>
              </div>
            </div>
            {(hasValue(req.house_block_lot_no) || hasValue(req.street) || hasValue(req.zone)) && (
              <div className="flex items-start gap-2.5 px-5 py-3" style={{ backgroundColor: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#f9a8d4" }} />
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {[req.house_block_lot_no, req.street, req.zone].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 2px 16px rgba(15,42,94,0.08)", border: "1px solid #e5e7eb" }}>
          <div className="px-5 pt-5 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#9ca3af" }}>Current Status</p>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="text-2xl font-black" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>{statusLabel}</h1>
              <StatusBadge status={normalizedStatus} />
            </div>

            {/* Progress bar: show for normal statuses, no_show shows a flat blocked line */}
            {!isBlockedStatus && !isNoShow ? (
              <ProgressBar status={normalizedStatus} isFreeService={isFreeService} onLearnMore={() => setShowOfficeHours(true)} />
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isRejected ? "#fff1f2" : isIncomplete ? "#fff7ed" : isNoShow ? "#fff7ed" : "#faf5ff",
                    color:           isRejected ? "#e11d48" : isIncomplete ? "#ea580c" : isNoShow ? "#ea580c" : "#7c3aed",
                    border:          `1px solid ${isRejected ? "#fecdd3" : isIncomplete ? "#fed7aa" : isNoShow ? "#fed7aa" : "#ddd6fe"}`,
                  }}
                >
                  {isRejected ? "Rejected" : isIncomplete ? "Incomplete" : isNoShow ? "No Show" : "Inspecting"}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
            )}

            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e5e7eb" }}>
              <button
                type="button"
                onClick={() => setShowOfficeHours(true)}
                className="text-xs font-semibold transition-colors"
                style={{ color: "#2563eb" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                ℹ️ For processing guidelines, required documents, and office hours, please click here.
              </button>
            </div>
          </div>

          {svcMeta && (
            <div className="grid grid-cols-2 gap-3 mx-5 mb-5">
              <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af" }}>Fee Amount</p>
                <p className="text-base font-black" style={{ color: NAVY }}>{svcMeta.fee}</p>
              </div>
              <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af" }}>Est. Time</p>
                <p className="text-base font-black" style={{ color: NAVY }}>{svcMeta.processingTime}</p>
              </div>
            </div>
          )}

          {hasValue(request.created_at) && (
            <div className="mx-5 mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>Submission Timeline</p>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#dbeafe" }}>
                  <Calendar className="h-4 w-4" style={{ color: "#2563eb" }} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Submitted on</p>
                  <p className="text-sm font-bold" style={{ color: NAVY }}>
                    {format(new Date(request.created_at), "MMM d, yyyy")} &bull;{" "}
                    {format(new Date(request.created_at), "hh:mm aa")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Review Required Card */}
        {isReviewStatus && <ReviewRequiredCard onViewDetails={() => setShowDetails(true)} />}

        {/* Generic Schedule Card (non-scheduled/rescheduled/no_show statuses) */}
        {schedule && !isReleased && !isScheduled && !isRescheduled && !isNoShow && !isBlockedStatus && (
          <div className="mb-4"><ScheduleCard schedule={schedule} /></div>
        )}

        {/* Required Documents (not shown for scheduled/rescheduled/blocked/no_show — checklist is inside ScheduledVisitCard) */}
        {dynamicRequirements.length > 0 && !isScheduled && !isRescheduled && !isNoShow && !isBlockedStatus && !isReleased && (
        <div
          className="mb-6 rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f2a5e 0%, #1a3a7a 100%)", border: "2px solid #c2467d", boxShadow: "0 8px 24px rgba(15,42,94,0.2), 0 0 40px rgba(194,70,125,0.15)" }}
        >
          <div className="px-6 py-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(194,70,125,0.2)" }}>
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-black text-white">Bring These Documents</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>Required documents for your barangay visit</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {dynamicRequirements.map((doc, idx) => (
                <div key={idx} className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(194,70,125,0.3)", backdropFilter: "blur(10px)" }}>
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: "#c2467d", color: "white" }}>{idx + 1}</div>
                  </div>
                  <p className="text-sm font-bold leading-snug text-white">{doc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

        {/* Released Banner */}
        {/* {isReleased && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-4" style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#dcfce7" }}>
              <FileCheck className="h-5 w-5" style={{ color: "#16a34a" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#15803d" }}>Document Officially Released</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#166534" }}>
                Sent to your registered email. Check your inbox and spam folder.
                {hasValue(request.raw?.released_at) && <> Released on {format(new Date(request.raw.released_at), "MMMM d, yyyy")}.</>}
              </p>
            </div>
          </div>
        )} */}

        {/* ✅ No Show Card */}
        {isNoShow && schedule && (
          <NoShowCard
            schedule={schedule}
            onReschedule={() => setShowReschedule(true)}
            onViewDetails={() => setShowDetails(true)}
          />
        )}

        {/* Scheduled / Rescheduled Visit Card */}
        {(isScheduled || isRescheduled) && schedule && (
          <ScheduledVisitCard
            schedule={schedule}
            refNumber={refNumber}
            dynamicRequirements={dynamicRequirements}
            onViewDetails={() => setShowDetails(true)}
            onReschedule={() => setShowReschedule(true)}
            normalizedStatus={normalizedStatus}
          />
        )}

        {isRejected   && <RejectedCard   reason={rejectionReason} onViewDetails={() => setShowDetails(true)} />}
        {isIncomplete && <IncompleteCard  reason={rejectionReason} onViewDetails={() => setShowDetails(true)} />}
        {isInspecting && <InspectingCard  reason={rejectionReason} onViewDetails={() => setShowDetails(true)} />}

        {/* QR Card */}
        {showQRCard && (
          <QRPresentCard
            refNumber={refNumber}
            docLabel={DOC_TYPE_LABELS[docTypeSlug] ?? docTypeSlug.replace(/_/g, " ")}
          />
        )}

        {/* What's Next */}
        {whatNext && !isReleased && !isScheduled && !isRescheduled && !isNoShow && !isBlockedStatus && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: NAVY }}>
            <div className="px-5 py-5 relative overflow-hidden">
              <div className="absolute right-4 bottom-4 w-20 h-20 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
              <div className="absolute right-10 bottom-8 w-10 h-10 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <Info className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">What's next?</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{whatNext}</p>
                  {statusMsg?.nextStep && (
                    <p className="text-[10px] mt-2 font-bold" style={{ color: PINK }}>Next: {statusMsg.nextStep}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowDetails(true)}
                className="mt-4 w-full py-2.5 text-xs font-bold rounded-xl text-white transition-opacity hover:opacity-90 relative z-10"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                View Details
              </button>
            </div>
          </div>
        )}

        {/* Released: View Details */}
        {isReleased && (
          <button
            onClick={() => setShowDetails(true)}
            className="w-full py-3 text-sm font-bold rounded-2xl text-white"
            style={{ backgroundColor: NAVY }}
          >
            View Details
          </button>
        )}

      </div>
    </div>
  );
}