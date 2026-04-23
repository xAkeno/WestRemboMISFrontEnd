import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchRequestById } from "../services/api";
import { format } from "date-fns";
import {
  ArrowLeft, Calendar, AlertTriangle, FileCheck,
  FileText, Loader2, MessageSquare,
  User, MapPin, ClipboardList,
  Info, FileX, BadgeCheck,
  X, Copy, Check, Clock, Home,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../forms/Header";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
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

interface DocReply {
  id: number;
  document_type: string;
  document_id: number;
  user_id: number;
  message: string;
  status: "info" | "warning" | "missing" | "approved";
  created_at: string;
  user?: { name: string };
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
  approved:   { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", dot: "#16a34a" },
  pending:    { bg: "#fefce8", text: "#ca8a04", border: "#fde68a", dot: "#ca8a04" },
  processing: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", dot: "#2563eb" },
  encoded:    { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", dot: "#2563eb" },
  incomplete: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa", dot: "#ea580c" },
  rejected:   { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3", dot: "#e11d48" },
  released:   { bg: "#dcfce7", text: "#15803d", border: "#86efac", dot: "#15803d" },
  scheduled:  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#1d4ed8" },
  to_pay:     { bg: "#fefce8", text: "#ca8a04", border: "#fde68a", dot: "#ca8a04" },
};

const REPLY_STATUS_CONFIG = {
  info:     { label: "Info",             icon: Info,          bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", badgeBg: "#dbeafe", leftBorder: "#3b82f6" },
  warning:  { label: "Warning",          icon: AlertTriangle, bg: "#fffbeb", border: "#fde68a", color: "#b45309", badgeBg: "#fef3c7", leftBorder: "#f59e0b" },
  missing:  { label: "Missing Document", icon: FileX,         bg: "#fff1f2", border: "#fecdd3", color: "#be123c", badgeBg: "#ffe4e6", leftBorder: "#e11d48" },
  approved: { label: "Approved",         icon: BadgeCheck,    bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", badgeBg: "#dcfce7", leftBorder: "#16a34a" },
} as const;

const PROCESS_STEPS = [
  { key: "applied",  label: "Applied" },
  { key: "review",   label: "Review" },
  { key: "payment",  label: "Payment" },
  { key: "release",  label: "Release" },
];

const STATUS_TO_STEP: Record<string, number> = {
  pending: 0, incomplete: 0, processing: 0, encoded: 0,
  approved: 0, scheduled: 0,
  to_pay: 2,
  released: 3,
};

const STATUS_MESSAGES: Record<string, { message: string; nextStep: string | null }> = {
  encoded:    { message: "Your request has been received and is currently being processed.", nextStep: "Scheduled" },
  pending:    { message: "Your request has been received and is currently being processed.", nextStep: "Scheduled" },
  processing: { message: "Your request is being reviewed by the barangay office.", nextStep: "Scheduled" },
  incomplete: { message: "Action required — please upload missing documents to continue.", nextStep: null },
  approved:   { message: "Your request has been approved!", nextStep: "To Pay" },
  scheduled:  { message: "Your pickup date is confirmed. Visit the barangay at your scheduled time.", nextStep: "Visit Barangay" },
  to_pay:     { message: "Please proceed to the barangay hall to settle the payment.", nextStep: "Released" },
  released:   { message: "Your document has been sent to your registered email address.", nextStep: null },
  rejected:   { message: "Your request was not approved. See details for more information.", nextStep: null },
};

const WHAT_NEXT: Record<string, string> = {
  encoded:    "Your documents are currently being validated by the Barangay Secretary. Please wait for the notification to settle the fee.",
  pending:    "Your documents are currently being validated by the Barangay Secretary. Please wait for the notification to settle the fee.",
  processing: "Your request is under review. You will be notified once a pickup date is assigned.",
  incomplete: "Please upload the missing documents so we can continue processing your request.",
  approved:   "Your request has been approved. Proceed to the barangay hall to settle the payment.",
  scheduled:  "Go to the barangay hall at your scheduled time. Bring the required documents listed above and present your reference number to the officer.",
  to_pay:     "Proceed to the barangay hall cashier and present your reference number to pay the fee.",
  released:   "Your document has been officially released and sent to your registered email.",
  rejected:   "Your request was not approved. Please contact the barangay office for more information.",
};

const hasValue = (v: any): boolean =>
  v !== null && v !== undefined && String(v).trim() !== "";

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const badge = statusStyle[status] ?? { bg: "#f3f4f6", text: "#374151", border: "#d1d5db", dot: "#374151" };
  const label = status === "to_pay" ? "To Pay" : status.charAt(0).toUpperCase() + status.slice(1);
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
function ProgressBar({ status }: { status: string }) {
  const isRejected = status === "rejected";
  const currentStep = isRejected ? -1 : (STATUS_TO_STEP[status] ?? 0);

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {PROCESS_STEPS.map((step, i) => {
          const done    = !isRejected && i <= currentStep;
          const current = !isRejected && i === currentStep;
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
          const done    = !isRejected && i <= currentStep;
          const current = !isRejected && i === currentStep;
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
  );
}

// ─── Copy Button ───────────────────────────────────────────────────────────────
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1.5 rounded-lg transition-colors"
      style={{ backgroundColor: "#f3f4f6", color: copied ? "#16a34a" : "#9ca3af" }}
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─── Copy Button (white variant for dark backgrounds) ─────────────────────────
function CopyButtonWhite({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1.5 rounded-lg transition-colors flex-shrink-0"
      style={{
        backgroundColor: "rgba(255,255,255,0.15)",
        color: copied ? "#86efac" : "rgba(255,255,255,0.7)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─── Copy Button (light variant for white/gray backgrounds) ───────────────────
function CopyButtonLight({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1.5 transition-colors flex-shrink-0"
      style={{
        fontSize: 12,
        fontWeight: 500,
        padding: "5px 12px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: copied ? "#f0fdf4" : "#fff",
        color: copied ? "#16a34a" : "#6b7280",
        cursor: "pointer",
      }}
    >
      {copied
        ? <><Check className="h-3 w-3" /> Copied</>
        : <><Copy className="h-3 w-3" /> Copy</>
      }
    </button>
  );
}

// ─── Replies Feed ──────────────────────────────────────────────────────────────
function RepliesFeed({ documentType, documentId }: { documentType: string; documentId: string | number }) {
  const [replies, setReplies] = useState<DocReply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/documents/${documentType}/${documentId}/replies`,
          { credentials: "include", headers: { Accept: "application/json" } }
        );
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setReplies(json.data ?? []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetch_();
  }, [documentType, documentId]);

  if (loading || replies.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4" style={{ color: NAVY }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: NAVY }}>
          Remarks
        </span>
        <span
          className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: NAVY }}
        >
          {replies.length}
        </span>
      </div>
      <div className="space-y-2">
        {replies.map((reply) => {
          const cfg = REPLY_STATUS_CONFIG[reply.status];
          const Icon = cfg.icon;
          return (
            <div
              key={reply.id}
              className="rounded-xl px-3 py-2.5"
              style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderLeftWidth: 3, borderLeftColor: cfg.leftBorder }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3 w-3" style={{ color: cfg.color }} />
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: cfg.badgeBg, color: cfg.color }}>
                  {cfg.label}
                </span>
                <span className="text-[9px] text-gray-400 ml-auto">
                  {new Date(reply.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: NAVY }}>{reply.message}</p>
            </div>
          );
        })}
      </div>
    </div>
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
      const [hStr, mStr] = timeStr.split(":");
      const startH = parseInt(hStr, 10);
      const endH = startH + 1;
      const fmt = (h: number) => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${mStr}`;
      const period = endH >= 12 ? "PM" : "AM";
      return `${fmt(startH)} – ${fmt(endH)} ${period}`;
    } catch { return timeStr; }
  })();

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #bfdbfe" }}>
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: "#dbeafe", borderBottom: "1px solid #bfdbfe" }}
      >
        <Calendar className="h-3.5 w-3.5" style={{ color: "#1d4ed8" }} />
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#1d4ed8" }}>
          Scheduled Pickup
        </span>
      </div>
      <div className="flex items-center gap-4 px-4 py-4 bg-white">
        <div
          className="flex flex-col items-center justify-center px-3 py-3 rounded-xl flex-shrink-0"
          style={{ backgroundColor: NAVY, minWidth: 56 }}
        >
          <span className="text-[9px] font-black uppercase text-white opacity-75">
            {new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, { month: "short" })}
          </span>
          <span className="text-2xl font-black text-white leading-none">
            {new Date(dateStr + "T12:00:00").getDate()}
          </span>
          <span className="text-[9px] font-bold text-white opacity-75">
            {new Date(dateStr + "T12:00:00").getFullYear()}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: NAVY }}>{friendlyDate}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="h-3 w-3" style={{ color: "#2563eb" }} />
            <p className="text-xs font-semibold" style={{ color: "#1d4ed8" }}>{friendlyTime}</p>
          </div>
          {schedule.note && (
            <p className="text-xs mt-1.5 text-gray-500">{schedule.note}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Doc Type Label map ────────────────────────────────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
  barangay_certificate:  "Barangay Certificate",
  barangay_clearance:    "Barangay Clearance",
  business_clearance:    "Business Clearance",
  building_clearance:    "Building Clearance",
  resident_registration: "Resident Registration",
};

// ─── Full Details Modal ────────────────────────────────────────────────────────
function DetailsModal({ request, onClose }: { request: any; onClose: () => void }) {
  const docType = (request.document_type ?? "").replace(/-/g, "_");
  const r = { ...request, ...(request.raw ?? {}) };

  const Field = ({ label, value, full = false }: { label: string; value?: any; full?: boolean }) => {
    if (!hasValue(value)) return null;
    const display = value === true ? "Yes" : value === false ? "No" : String(value);
    return (
      <div className={full ? "col-span-2" : ""}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: PINK }}>{label}</p>
        <p className="text-sm font-medium break-words" style={{ color: NAVY }}>{display}</p>
      </div>
    );
  };

  const fullName = [r.prefix, r.first_name, r.middle_name, r.surname, r.ext_name]
    .filter(Boolean).join(" ");

  const fmtDate = (d?: string | null) => {
    if (!d) return null;
    try { return format(new Date(d), "MMMM d, yyyy"); } catch { return d; }
  };

  const refNumber = r.bcert_number ?? r.brgy_business_no ?? `REF-${String(r.id).padStart(4, "0")}`;
  const docLabel  = DOC_TYPE_LABELS[docType] ?? docType.replace(/_/g, " ");

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
          { label: "Remarks",               value: r.remarks, full: true },
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
        {/* Modal Header */}
        <div
          className="flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a7a 100%)` }}
        >
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
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          <div
            className="flex items-center justify-between px-5 py-2"
            style={{ backgroundColor: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Status</span>
              <span
                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(194,70,125,0.25)", color: "#f9a8d4" }}
              >
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

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
          {sections.map((sec, i) => {
            const visible = sec.fields.filter((f: any) => hasValue(f.value));
            if (!visible.length) return null;
            const Icon = sec.icon;
            return (
              <div key={i}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#f0f4ff" }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: NAVY }} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: NAVY }}>{sec.title}</p>
                  <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {visible.map((f: any, j: number) => (
                    <Field key={j} label={f.label} value={f.value} full={f.full} />
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

        {/* Footer */}
        <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid #f3f4f6" }}>
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-bold text-white rounded-xl"
            style={{ backgroundColor: NAVY }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Scheduled Visit Card (light theme) ───────────────────────────────────────
function ScheduledVisitCard({
  schedule,
  refNumber,
  dynamicRequirements,
  onViewDetails,
}: {
  schedule: ScheduleData;
  refNumber: string;
  dynamicRequirements: string[];
  onViewDetails: () => void;
}) {
  const dateObj = new Date(schedule.schedule_date + "T12:00:00");

  const monthLabel = dateObj.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const dayLabel   = dateObj.getDate();
  const yearLabel  = dateObj.getFullYear();
  const fullDateLabel = dateObj.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  const timeLabel = (() => {
    try {
      const [hStr, mStr] = schedule.schedule_time.split(":");
      const startH = parseInt(hStr, 10);
      const endH   = startH + 1;
      const fmt    = (h: number) => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${mStr}`;
      return `${fmt(startH)} – ${fmt(endH)} ${endH >= 12 ? "PM" : "AM"}`;
    } catch { return schedule.schedule_time; }
  })();

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* ── Card Header ── */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid #f3f4f6" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <Home className="h-4 w-4" style={{ color: "#2563eb" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "#111827" }}>
            Next step: Visit the barangay
          </p>
          <p className="text-[11px]" style={{ color: "#9ca3af" }}>
            Your pickup date is confirmed
          </p>
        </div>
        <span
          className="text-[11px] font-semibold px-3 py-1 rounded-full"
          style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
        >
          Scheduled
        </span>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">

        {/* ── Schedule Block ── */}
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-2"
            style={{ color: "#9ca3af" }}
          >
            Pickup schedule
          </p>
          <div
            className="flex items-center gap-4 rounded-xl px-4 py-4"
            style={{ background: "#eff6ff" }}
          >
            {/* Date badge */}
            <div
              className="flex flex-col items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: "#1d4ed8", padding: "10px 12px", minWidth: 52, textAlign: "center" }}
            >
              <span className="text-[10px] font-bold text-white" style={{ opacity: 0.75, letterSpacing: "0.04em" }}>
                {monthLabel}
              </span>
              <span className="text-2xl font-black text-white leading-none">
                {dayLabel}
              </span>
              <span className="text-[10px] text-white" style={{ opacity: 0.65 }}>
                {yearLabel}
              </span>
            </div>

            {/* Date + time info */}
            <div>
              <p className="text-sm font-bold" style={{ color: "#1e3a8a" }}>
                {fullDateLabel}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="h-3 w-3" style={{ color: "#3b82f6" }} />
                <p className="text-xs font-semibold" style={{ color: "#2563eb" }}>
                  {timeLabel}
                </p>
              </div>
              {schedule.note && (
                <p className="text-xs mt-1" style={{ color: "#60a5fa" }}>
                  {schedule.note}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Reference Number ── */}
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-2"
            style={{ color: "#9ca3af" }}
          >
            Reference number
          </p>
          <div
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
          >
            <span
              className="font-mono text-lg font-bold"
              style={{ color: "#111827", letterSpacing: "0.04em" }}
            >
              {refNumber}
            </span>
            <CopyButtonLight value={refNumber} />
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: "#9ca3af" }}>
            Show this to the officer on duty at the barangay hall.
          </p>
        </div>

        {/* ── Documents Checklist ── */}
        {dynamicRequirements.length > 0 && (
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: "#9ca3af" }}
            >
              Bring these documents
            </p>
            <div className="flex flex-col gap-1.5">
              {dynamicRequirements.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-3"
                  style={{ border: "1px solid #f3f4f6", background: "#fff" }}
                >
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      width: 22,
                      height: 22,
                      background: "#eff6ff",
                    }}
                  >
                    <span className="text-[11px] font-bold" style={{ color: "#2563eb" }}>
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="h-3 w-3 flex-shrink-0" style={{ color: "#d1d5db" }} />
                    <p className="text-xs leading-snug" style={{ color: "#374151" }}>
                      {doc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── View Full Details ── */}
        <button
          onClick={onViewDetails}
          className="w-full py-2.5 text-xs font-bold rounded-xl transition-colors"
          style={{
            border: "1px solid #e5e7eb",
            background: "#fff",
            color: "#6b7280",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb";
            (e.currentTarget as HTMLButtonElement).style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fff";
            (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
          }}
        >
          View full details
        </button>

      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RequestDetail() {
  const navigate = useNavigate();
  const { id, type } = useParams<{ id: string; type: string }>();
  const [showDetails, setShowDetails] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", type, id],
    queryFn: () => fetchRequestById(type!, id!),
    enabled: !!id && !!type,
  });

  const { data: schedule } = useQuery({
    queryKey: ["schedule", request?.bcert_number],
    queryFn: async (): Promise<ScheduleData | null> => {
      const res = await fetch(
        `http://127.0.0.1:8000/api/schedules/${request!.bcert_number}`,
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
      const res = await api.get("/api/services");
      const raw: Service[] = res.data?.data ?? res.data ?? [];
      const latestMap = new Map<number, Service>();
      raw.forEach((item) => latestMap.set(item.id, item));
      return Array.from(latestMap.values());
    },
    staleTime: 5 * 60 * 1000,
  });

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
  const isReleased  = normalizedStatus === "released";
  const isScheduled = normalizedStatus === "scheduled";
  const docTypeSlug = (request.document_type ?? type ?? "").replace(/-/g, "_");
  const req = { ...request, ...(request.raw ?? {}) };

  const matchedService = services.find(
    (s) => SERVICE_NAME_TO_SLUG[s.name] === docTypeSlug
  );

  const dynamicRequirements: string[] = matchedService
    ? matchedService.requirements
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  const svcMeta = matchedService
    ? { fee: matchedService.fee, processingTime: matchedService.processing_time }
    : undefined;

  const statusMsg = STATUS_MESSAGES[normalizedStatus];
  const whatNext  = WHAT_NEXT[normalizedStatus];

  const refNumber =
    req.bcert_number ??
    req.brgy_business_no ??
    `REF-${String(request.id).padStart(4, "0")}`;

  const statusLabel =
    normalizedStatus === "to_pay"
      ? "To Pay"
      : normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f6fb" }}>
      <Header />

      {showDetails && (
        <DetailsModal request={request} onClose={() => setShowDetails(false)} />
      )}

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

        {/* ── Required Documents (hidden when scheduled — shown inside ScheduledVisitCard) ── */}
        {dynamicRequirements.length > 0 && !isScheduled && (
          <div
            className="mb-6 rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0f2a5e 0%, #1a3a7a 100%)",
              border: "2px solid #c2467d",
              boxShadow: "0 8px 24px rgba(15,42,94,0.2), 0 0 40px rgba(194,70,125,0.15)",
            }}
          >
            <div className="px-6 py-5">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(194,70,125,0.2)" }}
                >
                  <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-white">Bring These Documents</h2>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Required documents for your barangay visit
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {dynamicRequirements.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(194,70,125,0.3)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                        style={{ backgroundColor: "#c2467d", color: "white" }}
                      >
                        {idx + 1}
                      </div>
                    </div>
                    <p className="text-sm font-bold leading-snug text-white">{doc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Document Type + bcert header ── */}
        <div className="mb-4">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a7a 100%)`,
              boxShadow: "0 4px 20px rgba(15,42,94,0.2)",
            }}
          >
            <div className="px-5 py-4">
              <span
                className="inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
                style={{
                  backgroundColor: "rgba(194,70,125,0.25)",
                  color: "#f9a8d4",
                  border: "1px solid rgba(194,70,125,0.35)",
                }}
              >
                {DOC_TYPE_LABELS[docTypeSlug] ?? docTypeSlug.replace(/_/g, " ")}
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-[9px] font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {req.brgy_business_no ? "Business No." : "Reference No."}
                  </p>
                  <p className="text-2xl font-black font-mono text-white">{refNumber}</p>
                </div>
                <CopyButton value={refNumber} />
              </div>
            </div>

            {(hasValue(req.house_block_lot_no) || hasValue(req.street) || hasValue(req.zone)) && (
              <div
                className="flex items-start gap-2.5 px-5 py-3"
                style={{
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#f9a8d4" }} />
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {[req.house_block_lot_no, req.street, req.zone].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Top Status Card ── */}
        <div
          className="bg-white rounded-2xl overflow-hidden mb-4"
          style={{ boxShadow: "0 2px 16px rgba(15,42,94,0.08)", border: "1px solid #e5e7eb" }}
        >
          <div className="px-5 pt-5 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#9ca3af" }}>
              Current Status
            </p>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="text-2xl font-black" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>
                {statusMsg ? (normalizedStatus === "to_pay" ? "To Pay" : statusLabel) : "In Progress"}
              </h1>
              <StatusBadge status={normalizedStatus} />
            </div>
            <ProgressBar status={normalizedStatus} />
          </div>

          {svcMeta && (
            <div className="grid grid-cols-2 gap-3 mx-5 mb-5">
              <div
                className="px-4 py-3 rounded-xl"
                style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af" }}>Fee Amount</p>
                <p className="text-base font-black" style={{ color: NAVY }}>{svcMeta.fee}</p>
              </div>
              <div
                className="px-4 py-3 rounded-xl"
                style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af" }}>Est. Time</p>
                <p className="text-base font-black" style={{ color: NAVY }}>{svcMeta.processingTime}</p>
              </div>
            </div>
          )}

          {hasValue(request.created_at) && (
            <div className="mx-5 mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>
                Submission Timeline
              </p>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#dbeafe" }}
                >
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

        {/* ── Schedule Card (non-scheduled statuses, not released) ── */}
        {schedule && !isReleased && !isScheduled && (
          <div className="mb-4">
            <ScheduleCard schedule={schedule} />
          </div>
        )}

        {/* ── Released Banner ── */}
        {isReleased && (
          <div
            className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-4"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#dcfce7" }}
            >
              <FileCheck className="h-5 w-5" style={{ color: "#16a34a" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#15803d" }}>Document Officially Released</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#166534" }}>
                Sent to your registered email. Check your inbox and spam folder.
                {hasValue(request.raw?.released_at) && (
                  <> Released on {format(new Date(request.raw.released_at), "MMMM d, yyyy")}.</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── Remarks from Barangay ── */}
        <div
          className="bg-white rounded-2xl overflow-hidden mb-4 px-5 py-4"
          style={{ boxShadow: "0 2px 16px rgba(15,42,94,0.08)", border: "1px solid #e5e7eb" }}
        >
          <RepliesFeed documentType={docTypeSlug} documentId={request.id} />
        </div>

        {/* ── SCHEDULED: Light-theme unified action card ── */}
        {isScheduled && schedule && (
          <ScheduledVisitCard
            schedule={schedule}
            refNumber={refNumber}
            dynamicRequirements={dynamicRequirements}
            onViewDetails={() => setShowDetails(true)}
          />
        )}

        {/* ── What's Next Card (hidden when scheduled or released) ── */}
        {whatNext && !isReleased && !isScheduled && (
          <div
            className="rounded-2xl overflow-hidden mb-4"
            style={{ backgroundColor: NAVY }}
          >
            <div className="px-5 py-5 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute right-4 bottom-4 w-20 h-20 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
              <div className="absolute right-10 bottom-8 w-10 h-10 rounded-full opacity-10" style={{ backgroundColor: "white" }} />

              <div className="flex items-start gap-3 relative z-10">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <Info className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">What's next?</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {whatNext}
                  </p>
                  {statusMsg?.nextStep && (
                    <p className="text-[10px] mt-2 font-bold" style={{ color: PINK }}>
                      Next: {statusMsg.nextStep}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowDetails(true)}
                className="mt-4 w-full py-2.5 text-xs font-bold rounded-xl text-white transition-opacity hover:opacity-90 relative z-10"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                View Full Details
              </button>
            </div>
          </div>
        )}

        {/* If released, show details button */}
        {isReleased && (
          <button
            onClick={() => setShowDetails(true)}
            className="w-full py-3 text-sm font-bold rounded-2xl text-white"
            style={{ backgroundColor: NAVY }}
          >
            View Full Details
          </button>
        )}

      </div>
    </div>
  );
}