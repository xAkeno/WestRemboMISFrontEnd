import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchRequestById } from "../services/api";
import { DOCUMENT_LABELS } from "@/types/types";
import { format } from "date-fns";
import {
  ArrowLeft, Calendar, AlertTriangle, FileCheck,
  FileText, Upload, Loader2, MessageSquare,
  User, MapPin, Phone, Building2, Briefcase,
  ClipboardList, ShieldCheck, Hash, BadgeInfo,
  CheckCircle, Clock, Banknote, Users, Hammer,
  Info, FileX, BadgeCheck, Mail,
  ChevronRight, ListChecks, X, ExternalLink,
  ImagePlus, Eye, CheckCircle2, AlertCircle,
  Copy, Check,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Header from "../forms/Header";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true,
  headers: { Accept: "application/json" },
});

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadedFile {
  id: string;
  dbId?: number;
  file: File | null;
  preview: string | null;
  status: UploadStatus;
  progress: number;
  error?: string;
  url?: string;
  filename?: string;
}

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

const REPLY_STATUS_CONFIG = {
  info:     { label: "Info",             icon: Info,          bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", badgeBg: "#dbeafe", leftBorder: "#3b82f6" },
  warning:  { label: "Warning",          icon: AlertTriangle, bg: "#fffbeb", border: "#fde68a", color: "#b45309", badgeBg: "#fef3c7", leftBorder: "#f59e0b" },
  missing:  { label: "Missing Document", icon: FileX,         bg: "#fff1f2", border: "#fecdd3", color: "#be123c", badgeBg: "#ffe4e6", leftBorder: "#e11d48" },
  approved: { label: "Approved",         icon: BadgeCheck,    bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", badgeBg: "#dcfce7", leftBorder: "#16a34a" },
} as const;

const serviceData: Record<string, { processingTime: string; fee: string }> = {
  barangay_certificate:  { processingTime: "Same day",          fee: "₱50.00" },
  barangay_clearance:    { processingTime: "1–2 business days", fee: "₱100.00" },
  business_clearance:    { processingTime: "3–5 business days", fee: "₱500.00 – ₱2,000.00" },
  building_clearance:    { processingTime: "5–7 business days", fee: "₱300.00 – ₱1,000.00" },
  resident_registration: { processingTime: "1–2 business days", fee: "Free" },
};

const REQUIRED_SLOTS_BY_DOC: Record<string, string[]> = {
  barangay_certificate:  ["valid_id_front", "proof_of_residency"],
  barangay_clearance:    ["valid_id_front", "proof_of_residency"],
  business_clearance:    ["dti_sec_registration", "mayors_permit", "bir_certificate"],
  building_clearance:    ["title_or_tct", "tax_declaration"],
  resident_registration: ["valid_id_front", "proof_of_residency"],
};

const SLOT_LABELS: Record<string, string> = {
  valid_id_front:        "Valid Government ID (Front)",
  valid_id_back:         "Valid Government ID (Back)",
  proof_of_residency:    "Proof of Residency",
  dti_sec_registration:  "DTI / SEC Registration",
  mayors_permit:         "Mayor's Business Permit",
  bir_certificate:       "BIR Certificate of Registration",
  title_or_tct:          "Transfer Certificate of Title (TCT)",
  tax_declaration:       "Tax Declaration",
  building_permit:       "Building Permit",
  supporting_document:   "Supporting Document",
};

// Steps matching the screenshots: Applied → Review → Payment → Release
const PROCESS_STEPS = [
  { key: "applied",  label: "Applied" },
  { key: "review",   label: "Review" },
  { key: "payment",  label: "Payment" },
  { key: "release",  label: "Release" },
];

// Map statuses to which step index is "active" (current or past)
const STATUS_TO_STEP: Record<string, number> = {
  pending: 1, incomplete: 1, processing: 1, encoded: 1,
  approved: 1, scheduled: 1,
  to_pay: 2,
  released: 3,
};

const STATUS_MESSAGES: Record<string, { message: string; nextStep: string | null }> = {
  encoded:    { message: "Your request has been received and is currently being processed.", nextStep: "Scheduled" },
  pending:    { message: "Your request has been received and is currently being processed.", nextStep: "Scheduled" },
  processing: { message: "Your request is being reviewed by the barangay office.", nextStep: "Scheduled" },
  incomplete: { message: "Action required — please upload missing documents to continue.", nextStep: null },
  approved:   { message: "Your request has been approved!", nextStep: "To Pay" },
  scheduled:  { message: "A pickup date has been assigned for your document.", nextStep: "To Pay" },
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
  scheduled:  "Your pickup date is set. Bring your original documents and a valid ID to the barangay hall.",
  to_pay:     "Proceed to the barangay hall cashier and present your reference number to pay the fee.",
  released:   "Your document has been officially released and sent to your registered email.",
  rejected:   "Your request was not approved. Please contact the barangay office for more information.",
};

const hasValue = (v: any): boolean =>
  v !== null && v !== undefined && String(v).trim() !== "";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}

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

// ─── Progress Bar (screenshot-style) ──────────────────────────────────────────
function ProgressBar({ status }: { status: string }) {
  const isRejected = status === "rejected";
  const currentStep = isRejected ? -1 : (STATUS_TO_STEP[status] ?? 0);

  return (
    <div>
      {/* Bar segments */}
      <div className="flex gap-1 mb-2">
        {PROCESS_STEPS.map((step, i) => {
          const done    = !isRejected && i <= currentStep;
          const current = !isRejected && i === currentStep;
          return (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-all duration-500"
              style={{
                backgroundColor: done
                  ? (current ? NAVY : "#16a34a")
                  : "#e5e7eb",
              }}
            />
          );
        })}
      </div>
      {/* Labels */}
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

// ─── Requirement Row ──────────────────────────────────────────────────────────
function RequirementRow({
  label,
  uploaded,
  required,
  onDrop,
  onRemove,
}: {
  label: string;
  uploaded: UploadedFile | null;
  required: boolean;
  onDrop: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isSuccess = uploaded?.status === "success";
  const isUploading = uploaded?.status === "uploading";
  const isError = uploaded?.status === "error";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors"
      style={{
        backgroundColor: isSuccess ? "#f0fdf4" : isError ? "#fff1f2" : "#f8faff",
        border: `1px solid ${isSuccess ? "#bbf7d0" : isError ? "#fecdd3" : "#e5e7eb"}`,
      }}
    >
      {/* Status circle */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isSuccess ? "#16a34a" : isUploading ? NAVY : "#e5e7eb",
        }}
      >
        {isSuccess && <Check className="h-4 w-4 text-white" />}
        {isUploading && <Loader2 className="h-4 w-4 text-white animate-spin" />}
        {!isSuccess && !isUploading && (
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isError ? "#e11d48" : "#d1d5db" }} />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: NAVY }}>{label}</p>
        {isSuccess && uploaded?.file && (
          <p className="text-[10px] text-gray-400 truncate">{uploaded.file.name}</p>
        )}
        {isSuccess && !uploaded?.file && uploaded?.filename && (
          <p className="text-[10px] text-gray-400 truncate">{uploaded.filename}</p>
        )}
        {isUploading && (
          <div className="mt-1 h-1 rounded-full bg-gray-200 overflow-hidden w-24">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${uploaded?.progress ?? 0}%`, backgroundColor: NAVY }}
            />
          </div>
        )}
        {isError && (
          <p className="text-[10px] text-red-500 truncate">{uploaded?.error ?? "Upload failed"}</p>
        )}
      </div>

      {/* Right action */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {isSuccess ? (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#16a34a" }}>Verified</span>
            <button
              onClick={onRemove}
              className="ml-2 p-1 rounded transition-colors"
              style={{ color: "#9ca3af" }}
              title="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            {required && !isSuccess && (
              <span className="text-[9px] font-bold uppercase tracking-wider mr-1" style={{ color: "#ea580c" }}>
                {isError ? "Retry" : "Pending"}
              </span>
            )}
            <button
              onClick={() => inputRef.current?.click()}
              className="p-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: NAVY, color: "white" }}
              title="Upload"
            >
              <ImagePlus className="h-3.5 w-3.5" />
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onDrop(f);
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>
    </div>
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
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #bfdbfe" }}
    >
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
            <Clock className="h-3 w-3" style={{ color: "#2563eb" }} />
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

// ─── Full Details Modal ────────────────────────────────────────────────────────
function DetailsModal({ request, onClose }: { request: any; onClose: () => void }) {
  const docType = request.document_type ?? "";
  const r = request;

  const Field = ({ label, value }: { label: string; value?: any }) => {
    if (!hasValue(value)) return null;
    const display = value === true ? "Yes" : value === false ? "No" : String(value);
    return (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: PINK }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: NAVY }}>{display}</p>
      </div>
    );
  };

  const sections = (() => {
    if (docType === "barangay_certificate" || docType === "barangay_clearance") {
      return [
        { title: "Requester Details", icon: User, fields: [
          { label: "Full Name", value: r.requester_name },
          { label: "Age", value: r.age },
          { label: "Date of Birth", value: r.date_of_birth },
          { label: "Place of Birth", value: r.place_of_birth },
          { label: "Contact No.", value: r.contact_no },
        ]},
        { title: "Address", icon: MapPin, fields: [
          { label: "Address", value: r.address },
          { label: "House Owner", value: r.house_owner },
          { label: "Relationship to Owner", value: r.relationship_to_owner },
        ]},
        { title: docType === "barangay_certificate" ? "Certificate Details" : "Clearance Details", icon: ClipboardList, fields: [
          { label: docType === "barangay_certificate" ? "Certificate No." : "Clearance No.", value: r.bcert_number },
          { label: "Purpose", value: r.purpose },
          { label: "Purpose Details", value: r.purpose_details },
          { label: "Period of Residency", value: r.period_of_residency },
          { label: "Registered Voter", value: r.registered_voter },
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
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #f3f4f6" }}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: NAVY }} />
            <p className="text-sm font-bold" style={{ color: NAVY }}>Full Request Details</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "#f3f4f6" }}
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}>
            {hasValue(request.created_at) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: PINK }}>Date Submitted</p>
                <p className="text-sm font-medium" style={{ color: NAVY }}>{format(new Date(request.created_at), "MMMM d, yyyy")}</p>
              </div>
            )}
            {hasValue(request.updated_at) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: PINK }}>Last Updated</p>
                <p className="text-sm font-medium" style={{ color: NAVY }}>{format(new Date(request.updated_at), "MMMM d, yyyy")}</p>
              </div>
            )}
          </div>

          {sections.map((sec, i) => {
            const visible = sec.fields.filter(f => hasValue(f.value));
            if (!visible.length) return null;
            const Icon = sec.icon;
            return (
              <div key={i}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4 flex-shrink-0" style={{ color: NAVY }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: NAVY }}>{sec.title}</p>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {visible.map((f, j) => <Field key={j} label={f.label} value={f.value} />)}
                </div>
              </div>
            );
          })}
        </div>

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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RequestDetail() {
  const navigate = useNavigate();
  const { id, type } = useParams<{ id: string; type: string }>();
  const [showDetails, setShowDetails] = useState(false);
  const [files, setFiles] = useState<Record<string, UploadedFile>>({});
  const [loadingExisting, setLoadingExisting] = useState(true);

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

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const { data } = await api.get("/api/mydocuments");
        const loaded: Record<string, UploadedFile> = {};
        const docs = data.data?.documents || {};
        Object.values(docs).forEach((categoryDocs: any[]) => {
          categoryDocs.forEach((doc) => {
            loaded[doc.type] = {
              id: `existing-${doc.id}`,
              dbId: doc.id,
              file: null,
              preview: doc.url ?? `http://127.0.0.1:8000/uploads/${doc.original_filename}`,
              status: "success",
              progress: 100,
              url: doc.url,
              filename: doc.original_filename,
            };
          });
        });
        setFiles(loaded);
      } catch { /* silent */ }
      finally { setLoadingExisting(false); }
    };
    fetchExisting();
  }, []);

  const handleUpload = useCallback(async (slotKey: string, file: File) => {
    const existing = files[slotKey];
    if (existing?.dbId && existing.status === "success") {
      try { await api.delete(`/api/documents/${existing.dbId}`); } catch {}
    }

    let preview: string | null = null;
    if (isImage(file)) {
      preview = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    setFiles(prev => ({ ...prev, [slotKey]: { id: `${slotKey}-${Date.now()}`, file, preview, status: "uploading", progress: 0 } }));

    const formData = new FormData();
    formData.append("type", slotKey);
    formData.append("file", file);

    try {
      const { data } = await api.post("/api/mydocuments/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / (e.total ?? 1));
          setFiles(prev => ({ ...prev, [slotKey]: { ...prev[slotKey], progress: pct } }));
        },
      });
      setFiles(prev => ({ ...prev, [slotKey]: { ...prev[slotKey], dbId: data.data.id, preview: preview ?? data.data.url, status: "success", progress: 100 } }));
    } catch (err: any) {
      const message = err?.response?.data?.errors?.file?.[0] ?? err?.response?.data?.message ?? "Upload failed.";
      setFiles(prev => ({ ...prev, [slotKey]: { ...prev[slotKey], status: "error", error: message } }));
    }
  }, [files]);

  const handleRemove = useCallback(async (slotKey: string) => {
    const entry = files[slotKey];
    if (!entry) return;
    if (entry.dbId && entry.status === "success") {
      try { await api.delete(`/api/documents/${entry.dbId}`); } catch {}
    }
    setFiles(prev => { const next = { ...prev }; delete next[slotKey]; return next; });
  }, [files]);

  if (isLoading || loadingExisting) {
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
  const isReleased = normalizedStatus === "released";
  const isRejected = normalizedStatus === "rejected";
  const docTypeSlug = (request.document_type ?? type ?? "").replace(/-/g, "_");
  const svcMeta = serviceData[docTypeSlug];
  const statusMsg = STATUS_MESSAGES[normalizedStatus];
  const whatNext = WHAT_NEXT[normalizedStatus];

  const requiredSlots = REQUIRED_SLOTS_BY_DOC[docTypeSlug] ?? [];
  const allUploaded = requiredSlots.length > 0 && requiredSlots.every(s => files[s]?.status === "success");
  const uploadedCount = requiredSlots.filter(s => files[s]?.status === "success").length;

  const statusLabel =
    normalizedStatus === "to_pay" ? "To Pay" :
    normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f6fb" }}>
      <Header />

      {showDetails && <DetailsModal request={request} onClose={() => setShowDetails(false)} />}

      <div className="max-w-2xl mx-auto px-4 pt-28 pb-16">

        {/* Back */}
        <button
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-6 transition-colors"
          style={{ color: "#9ca3af" }}
          onClick={() => navigate("/myrequest")}
          onMouseEnter={e => (e.currentTarget.style.color = NAVY)}
          onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Requests
        </button>

        {/* ── Top Status Card ─────────────────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl overflow-hidden mb-4"
          style={{ boxShadow: "0 2px 16px rgba(15,42,94,0.08)", border: "1px solid #e5e7eb" }}
        >
          <div className="px-5 pt-5 pb-4">
            {/* Title row */}
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#9ca3af" }}>
              Current Status
            </p>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="text-2xl font-black" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>
                {statusMsg ? (normalizedStatus === "to_pay" ? "To Pay" : statusLabel) : "In Progress"}
              </h1>
              <StatusBadge status={normalizedStatus} />
            </div>

            {/* Progress bar */}
            <ProgressBar status={normalizedStatus} />
          </div>

          {/* Reference Number */}
          <div className="mx-5 mb-5">
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}
            >
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af" }}>
                  Reference Number
                </p>
                <p className="text-base font-black font-mono" style={{ color: NAVY }}>
                  REF-{String(request.id).padStart(4, "0")}
                </p>
              </div>
              <CopyButton value={`REF-${String(request.id).padStart(4, "0")}`} />
            </div>
          </div>

          {/* Fee + Est Time */}
          <div className="grid grid-cols-2 gap-3 mx-5 mb-5">
            {svcMeta && (
              <>
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
              </>
            )}
          </div>

          {/* Submission timeline */}
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

        {/* ── Schedule Card ──────────────────────────────────────────────────── */}
        {schedule && !isReleased && (
          <div className="mb-4">
            <ScheduleCard schedule={schedule} />
          </div>
        )}

        {/* ── Released Banner ────────────────────────────────────────────────── */}
        {isReleased && (
          <div
            className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-4"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#dcfce7" }}>
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

        {/* ── Requirements Status ────────────────────────────────────────────── */}
        {requiredSlots.length > 0 && (
          <div
            className="bg-white rounded-2xl overflow-hidden mb-4"
            style={{ boxShadow: "0 2px 16px rgba(15,42,94,0.08)", border: "1px solid #e5e7eb" }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>
                Requirements Status
              </p>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: allUploaded ? "#dcfce7" : "#fef3c7",
                  color: allUploaded ? "#15803d" : "#92400e",
                }}
              >
                {uploadedCount}/{requiredSlots.length} Submitted
              </span>
            </div>
            <div className="p-4 space-y-2.5">
              {requiredSlots.map((slotKey) => (
                <RequirementRow
                  key={slotKey}
                  label={SLOT_LABELS[slotKey] ?? slotKey}
                  uploaded={files[slotKey] ?? null}
                  required={true}
                  onDrop={(file) => handleUpload(slotKey, file)}
                  onRemove={() => handleRemove(slotKey)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Remarks from Barangay ──────────────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl overflow-hidden mb-4 px-5 py-4"
          style={{ boxShadow: "0 2px 16px rgba(15,42,94,0.08)", border: "1px solid #e5e7eb" }}
        >
          <RepliesFeed documentType={docTypeSlug} documentId={request.id} />
        </div>

        {/* ── What's Next Card ───────────────────────────────────────────────── */}
        {whatNext && !isReleased && (
          <div
            className="rounded-2xl overflow-hidden mb-4"
            style={{ backgroundColor: NAVY }}
          >
            <div className="px-5 py-5 relative overflow-hidden">
              {/* Decorative circle */}
              <div
                className="absolute right-4 bottom-4 w-20 h-20 rounded-full opacity-10"
                style={{ backgroundColor: "white" }}
              />
              <div
                className="absolute right-10 bottom-8 w-10 h-10 rounded-full opacity-10"
                style={{ backgroundColor: "white" }}
              />

              <div className="flex items-start gap-3 relative z-10">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <Info className="h-4.5 w-4.5 text-white" />
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

        {/* If released, still show a details button */}
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