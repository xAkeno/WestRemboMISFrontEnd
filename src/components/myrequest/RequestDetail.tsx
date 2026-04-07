import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchRequestById } from "../services/api";
import { DOCUMENT_LABELS, STATUS_CONFIG } from "@/types/types";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  ArrowLeft, Calendar, AlertTriangle, FileCheck,
  FileText, Upload, Loader2, MessageSquare,
  User, MapPin, Phone, Building2, Briefcase,
  ClipboardList, ShieldCheck, Hash, BadgeInfo,
  CheckCircle, Clock, Banknote, Users, Hammer,
  Info, FileX, BadgeCheck, Download, FileDown,
  ChevronRight, ListChecks,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import Header from "../forms/Header";
import { useDownloadReleasedDoc } from "./useDownloadReleasedDoc";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

// ─── Status badge colors ───────────────────────────────────────────────────────
const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  approved:   { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  pending:    { bg: "#fefce8", text: "#ca8a04", border: "#fde68a" },
  processing: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  incomplete: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  rejected:   { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
  released:   { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
  scheduled:  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
};

// ─── Reply types ───────────────────────────────────────────────────────────────
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

// ─── Schedule type ─────────────────────────────────────────────────────────────
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
  info: {
    label: "Info",
    icon: Info,
    bg: "#eff6ff",
    border: "#bfdbfe",
    color: "#1d4ed8",
    badgeBg: "#dbeafe",
    leftBorder: "#3b82f6",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    bg: "#fffbeb",
    border: "#fde68a",
    color: "#b45309",
    badgeBg: "#fef3c7",
    leftBorder: "#f59e0b",
  },
  missing: {
    label: "Missing Document",
    icon: FileX,
    bg: "#fff1f2",
    border: "#fecdd3",
    color: "#be123c",
    badgeBg: "#ffe4e6",
    leftBorder: "#e11d48",
  },
  approved: {
    label: "Approved",
    icon: BadgeCheck,
    bg: "#f0fdf4",
    border: "#bbf7d0",
    color: "#15803d",
    badgeBg: "#dcfce7",
    leftBorder: "#16a34a",
  },
} as const;

// ─── Service requirements data ─────────────────────────────────────────────────
const serviceData: Record<string, {
  icon: React.ElementType;
  requirements: string[];
  processingTime: string;
  fee: string;
}> = {
  barangay_certificate: {
    icon: FileText,
    requirements: ["Valid government ID", "Proof of Residency", "Purpose of request"],
    processingTime: "Same day",
    fee: "₱50.00",
  },
  barangay_clearance: {
    icon: ShieldCheck,
    requirements: ["Valid government ID", "Proof of Residency", "Community Tax Certificate (Cedula)", "2x2 ID photo"],
    processingTime: "1-2 business days",
    fee: "₱100.00",
  },
  business_clearance: {
    icon: Building2,
    requirements: ["DTI / SEC Registration", "Mayor's Business Permit", "BIR Certificate of Registration", "Valid government ID"],
    processingTime: "3-5 business days",
    fee: "₱500.00 - ₱2,000.00",
  },
  building_clearance: {
    icon: Hammer,
    requirements: ["Transfer Certificate of Title (TCT)", "Tax Declaration", "Building Permit", "Barangay clearance"],
    processingTime: "5-7 business days",
    fee: "₱300.00 - ₱1,000.00",
  },
  resident_registration: {
    icon: Users,
    requirements: ["Valid government ID", "Proof of Residency", "2x2 ID photos (2 pieces)", "Accomplished registration form"],
    processingTime: "1-2 business days",
    fee: "Free",
  },
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

// ─── Process steps definition ──────────────────────────────────────────────────
// Maps document statuses → which step index is "current"
// Steps: 0=Submitted, 1=Processing, 2=Scheduled, 3=Approved, 4=Released
// rejected/incomplete are error states shown on the current step

const STATUS_TO_STEP: Record<string, number> = {
  pending:    0,
  incomplete: 0, // error at submitted step
  processing: 1,
  approved:   2,
  scheduled:  2,
  released:   3,
};

interface ProcessStep {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  statuses: string[]; // statuses that map to this step being active/done
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    label: "Submitted",
    sublabel: "Request received by barangay",
    icon: FileText,
    statuses: ["pending", "incomplete"],
  },
  {
    label: "Processing",
    sublabel: "Documents under review",
    icon: Loader2,
    statuses: ["processing"],
  },
  {
    label: "Scheduled / Approved",
    sublabel: "Pickup date assigned",
    icon: Calendar,
    statuses: ["approved", "scheduled"],
  },
  {
    label: "Released",
    sublabel: "Document ready for download",
    icon: FileDown,
    statuses: ["released"],
  },
];

// ─── Process Tracker Component ─────────────────────────────────────────────────
function ProcessTracker({
  status,
  schedule,
  trackerRef,
}: {
  status: string;
  schedule?: ScheduleData | null;
  trackerRef?: React.RefObject<HTMLDivElement>;
}) {
  const normalizedStatus = status.toLowerCase();
  const isRejected = normalizedStatus === "rejected";
  const currentStep = isRejected ? -1 : (STATUS_TO_STEP[normalizedStatus] ?? 0);

  return (
    <div
      ref={trackerRef}
      className="rounded-sm overflow-hidden"
      style={{ border: "1px solid #dde3ed" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: "#f0f4ff", borderBottom: "1px solid #dde3ed" }}
      >
        <ListChecks className="h-4 w-4 shrink-0" style={{ color: NAVY }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: NAVY }}>
          Request Progress
        </span>
        {isRejected && (
          <span
            className="ml-auto text-[9px] font-black uppercase tracking-wider px-2 py-0.5"
            style={{ backgroundColor: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3", borderRadius: 2 }}
          >
            Rejected
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="bg-white px-4 py-5">
        <div className="flex items-start justify-between gap-0 relative">
          {/* Connector line behind icons */}
          <div
            className="absolute top-3.5 left-0 right-0 mx-auto"
            style={{
              height: 2,
              zIndex: 0,
              // Calculate left/right insets so line spans icon centers
              left: "calc(14px + 0.5rem)",
              right: "calc(14px + 0.5rem)",
              backgroundColor: "#e5e7eb",
            }}
          />

          {PROCESS_STEPS.map((step, i) => {
            const isDone = !isRejected && i < currentStep;
            const isCurrent = !isRejected && i === currentStep;
            const isFuture = isRejected || i > currentStep;

            // Color logic
            let iconBg = "#f3f4f6";
            let iconColor = "#9ca3af";
            let borderColor = "#e5e7eb";
            let labelColor = "#9ca3af";

            if (isDone) {
              iconBg = "#dcfce7";
              iconColor = "#16a34a";
              borderColor = "#86efac";
              labelColor = "#16a34a";
            } else if (isCurrent && !isRejected) {
              iconBg = "#dbeafe";
              iconColor = "#1d4ed8";
              borderColor = "#93c5fd";
              labelColor = NAVY;
            }

            const Icon = step.icon;
            const isSpinning = isCurrent && normalizedStatus === "processing";

            return (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 flex-1 relative"
                style={{ zIndex: 1 }}
              >
                {/* Circle */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: iconBg,
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  {isDone ? (
                    <CheckCircle className="h-4 w-4" style={{ color: iconColor }} />
                  ) : (
                    <Icon
                      className={`h-3.5 w-3.5 ${isSpinning ? "animate-spin" : ""}`}
                      style={{ color: iconColor }}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="text-center px-1">
                  <p
                    className="text-[10px] font-bold leading-tight"
                    style={{ color: labelColor }}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-[9px] mt-0.5 leading-tight" style={{ color: "#6b7280" }}>
                      {step.sublabel}
                    </p>
                  )}
                </div>

                {/* "Current" pulse indicator */}
                {isCurrent && (
                  <span
                    className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5"
                    style={{
                      backgroundColor: "#dbeafe",
                      color: "#1d4ed8",
                      borderRadius: 2,
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Status note below */}
        {isRejected ? (
          <div
            className="mt-5 flex items-start gap-2 p-3"
            style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3", borderLeftWidth: 3, borderLeftColor: "#e11d48", borderRadius: 2 }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
            <div>
              <p className="text-xs font-bold" style={{ color: "#9f1239" }}>Request Rejected</p>
              <p className="text-xs mt-0.5" style={{ color: "#be123c" }}>
                Your request was not approved. Please check the remarks below for details, then submit a new request if needed.
              </p>
            </div>
          </div>
        ) : normalizedStatus === "incomplete" ? (
          <div
            className="mt-5 flex items-start gap-2 p-3"
            style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderLeftWidth: 3, borderLeftColor: "#ea580c", borderRadius: 2 }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#ea580c" }} />
            <div>
              <p className="text-xs font-bold" style={{ color: "#9a3412" }}>Action Required</p>
              <p className="text-xs mt-0.5" style={{ color: "#c2410c" }}>
                Your submission is incomplete. Please upload any missing documents or fill in required information to continue.
              </p>
            </div>
          </div>
        ) : normalizedStatus === "released" ? (
          <div
            className="mt-5 flex items-center gap-2 p-3"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderLeftWidth: 3, borderLeftColor: "#16a34a", borderRadius: 2 }}
          >
            <FileCheck className="h-4 w-4 shrink-0" style={{ color: "#16a34a" }} />
            <p className="text-xs font-semibold" style={{ color: "#15803d" }}>
              All steps complete — your document is ready to download above.
            </p>
          </div>
        ) : normalizedStatus === "scheduled" || normalizedStatus === "approved" ? (
          <div
            className="mt-5 flex items-start gap-2 p-3"
            style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderLeftWidth: 3, borderLeftColor: "#2563eb", borderRadius: 2 }}
          >
            <Calendar className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#1d4ed8" }} />
            <div>
              <p className="text-xs font-bold" style={{ color: "#1e40af" }}>
                {schedule ? "Pickup Scheduled" : "Awaiting Schedule"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#1d4ed8" }}>
                {schedule
                  ? `Visit the barangay hall on ${new Date(schedule.schedule_date + "T12:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.`
                  : "The barangay will assign a pickup date soon. Check back here for updates."}
              </p>
            </div>
          </div>
        ) : normalizedStatus === "processing" ? (
          <div
            className="mt-5 flex items-center gap-2 p-3"
            style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderLeftWidth: 3, borderLeftColor: "#2563eb", borderRadius: 2 }}
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: "#1d4ed8" }} />
            <p className="text-xs font-semibold" style={{ color: "#1e40af" }}>
              Your documents are currently being reviewed by the barangay office.
            </p>
          </div>
        ) : (
          <div
            className="mt-5 flex items-center gap-2 p-3"
            style={{ backgroundColor: "#fefce8", border: "1px solid #fde68a", borderLeftWidth: 3, borderLeftColor: "#ca8a04", borderRadius: 2 }}
          >
            <Clock className="h-4 w-4 shrink-0" style={{ color: "#ca8a04" }} />
            <p className="text-xs font-semibold" style={{ color: "#92400e" }}>
              Your request has been submitted and is awaiting review by the barangay office.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Released Document Download Banner ────────────────────────────────────────
function ReleasedDownloadBanner({
  documentType,
  recordId,
  releasedAt,
}: {
  documentType: string;
  recordId: number | string;
  releasedAt?: string | null;
}) {
  const { download, isLoading } = useDownloadReleasedDoc();
  const downloading = isLoading(documentType, recordId);

  const releasedDate = releasedAt
    ? new Date(releasedAt).toLocaleDateString(undefined, {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{ border: "1px solid #86efac", borderLeftWidth: 3, borderLeftColor: "#16a34a" }}
    >
      {/* Header strip */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: "#dcfce7", borderBottom: "1px solid #86efac" }}
      >
        <FileDown className="h-4 w-4 shrink-0" style={{ color: "#15803d" }} />
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#15803d" }}>
          Official Document — Ready to Download
        </span>
        {releasedDate && (
          <span className="ml-auto text-[10px] font-semibold" style={{ color: "#166534" }}>
            Released {releasedDate}
          </span>
        )}
      </div>

      {/* Body */}
      <div
        className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ backgroundColor: "#f0fdf4" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 shrink-0"
            style={{ backgroundColor: "#dcfce7", borderRadius: 2, border: "1px solid #86efac" }}
          >
            <FileCheck className="h-6 w-6" style={{ color: "#16a34a" }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#15803d" }}>
              Your document is officially released
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#166534" }}>
              Click the button to download your signed PDF. The link is valid for 15 minutes.
              You can generate a new link anytime by visiting this page.
            </p>
          </div>
        </div>

        <button
          onClick={() => download(documentType, recordId)}
          disabled={downloading}
          className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shrink-0 disabled:opacity-60 transition-colors w-full sm:w-auto"
          style={{ backgroundColor: "#16a34a", borderRadius: 2 }}
          onMouseEnter={(e) => !downloading && ((e.currentTarget as HTMLElement).style.backgroundColor = "#15803d")}
          onMouseLeave={(e) => !downloading && ((e.currentTarget as HTMLElement).style.backgroundColor = "#16a34a")}
        >
          {downloading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating link...</>
          ) : (
            <><Download className="h-4 w-4" />Download Document</>
          )}
        </button>
      </div>

      <div
        className="px-4 py-2 flex items-center gap-1.5"
        style={{ borderTop: "1px solid #86efac", backgroundColor: "#dcfce7" }}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: "#16a34a" }} />
        <p className="text-[10px]" style={{ color: "#166534" }}>
          This is an official document issued by the Barangay. Present this when required by government agencies or employers.
        </p>
      </div>
    </div>
  );
}

// ─── Requirements panel ────────────────────────────────────────────────────────
function RequirementsPanel({
  documentType,
  uploadedTypes,
}: {
  documentType: string;
  uploadedTypes: Set<string>;
}) {
  const key = documentType.replace(/-/g, "_");
  const service = serviceData[key];
  if (!service) return null;

  const Icon = service.icon;
  const requiredSlots = REQUIRED_SLOTS_BY_DOC[key] ?? [];
  const missingSlots = requiredSlots.filter((s) => !uploadedTypes.has(s));
  const allUploaded = missingSlots.length === 0 && requiredSlots.length > 0;

  return (
    <div className="rounded-sm border overflow-hidden" style={{ borderColor: "#dde3ed" }}>
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: "#f0f4ff", borderBottom: "1px solid #dde3ed" }}
      >
        <Icon className="h-4 w-4 shrink-0" style={{ color: NAVY }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: NAVY }}>
          Requirements for this Request
        </span>
      </div>

      <div className="px-4 py-4 grid sm:grid-cols-2 gap-4 bg-white">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: PINK }}>
            Documents Needed
          </p>
          <ul className="space-y-2">
            {service.requirements.map((req, i) => {
              const slotKey = requiredSlots[i];
              const uploaded = slotKey ? uploadedTypes.has(slotKey) : false;
              const isRequired = !!slotKey;
              return (
                <li key={i} className="flex items-start gap-2">
                  {isRequired ? (
                    uploaded ? (
                      <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#16a34a" }} />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#ca8a04" }} />
                    )
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: NAVY }} />
                  )}
                  <span className="text-xs" style={{ color: uploaded ? "#16a34a" : isRequired ? "#92400e" : "#4b5563" }}>
                    {req}
                    {uploaded && (
                      <span className="ml-1.5 text-[10px] font-bold" style={{ color: "#16a34a" }}>✓ Uploaded</span>
                    )}
                    {isRequired && !uploaded && (
                      <span
                        className="ml-1.5 text-[9px] font-black uppercase tracking-wider px-1 py-0.5"
                        style={{ backgroundColor: "#fde68a", color: "#92400e", borderRadius: 2 }}
                      >
                        Missing
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-4 sm:border-l sm:pl-4" style={{ borderColor: "#dde3ed" }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: PINK }}>Processing Time</p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" style={{ color: NAVY }} />
              <span className="text-xs font-semibold text-gray-700">{service.processingTime}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: PINK }}>Fee</p>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 shrink-0" style={{ color: NAVY }} />
              <span className="text-xs font-semibold text-gray-700">{service.fee}</span>
            </div>
          </div>
        </div>
      </div>

      {missingSlots.length > 0 && (
        <div
          className="mx-4 mb-4 p-3"
          style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderLeftWidth: 3, borderLeftColor: "#ca8a04", borderRadius: 2 }}
        >
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#ca8a04" }} />
            <p className="text-xs font-bold" style={{ color: "#92400e" }}>
              You still need to upload the following to proceed:
            </p>
          </div>
          <ul className="ml-6 space-y-1 mb-3">
            {missingSlots.map((s) => (
              <li key={s} className="text-xs flex items-center gap-1.5" style={{ color: "#92400e" }}>
                <span style={{ color: "#ca8a04" }}>—</span>
                {SLOT_LABELS[s] ?? s}
              </li>
            ))}
          </ul>
          <a
            href="/mydocuments"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 text-white transition-colors"
            style={{ backgroundColor: NAVY, borderRadius: 2, textDecoration: "none" }}
          >
            <Upload className="h-3 w-3" />
            Upload Missing Documents
          </a>
        </div>
      )}

      {allUploaded && (
        <div
          className="mx-4 mb-4 p-3 flex items-center gap-2"
          style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderLeftWidth: 3, borderLeftColor: "#16a34a", borderRadius: 2 }}
        >
          <FileCheck className="h-4 w-4 shrink-0" style={{ color: "#16a34a" }} />
          <p className="text-xs font-semibold" style={{ color: "#15803d" }}>
            All required documents have been uploaded. Your request can proceed.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Replies feed ──────────────────────────────────────────────────────────────
function RepliesFeed({ documentType, documentId }: { documentType: string; documentId: string | number }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [replies, setReplies] = useState<DocReply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReplies = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/documents/${documentType}/${documentId}/replies`,
          { credentials: "include", headers: { Accept: "application/json" } }
        );
        if (!res.ok) throw new Error("Failed to fetch replies");
        const json = await res.json();
        setReplies(json.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReplies();
  }, [documentType, documentId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [replies]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  if (replies.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 rounded-sm"
        style={{ backgroundColor: "#f8faff", border: "1px dashed #c8d4ed" }}
      >
        <MessageSquare className="h-6 w-6 mb-2" style={{ color: "#9ca3af" }} />
        <p className="text-xs text-gray-400">No remarks from the barangay office yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {replies.map((reply) => {
        const cfg = REPLY_STATUS_CONFIG[reply.status];
        const Icon = cfg.icon;
        const date = new Date(reply.created_at).toLocaleString(undefined, {
          month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit",
        });
        return (
          <div
            key={reply.id}
            className="rounded-sm px-4 py-3"
            style={{
              backgroundColor: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderLeftWidth: 3,
              borderLeftColor: cfg.leftBorder,
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: cfg.color }} />
                <span
                  className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5"
                  style={{ backgroundColor: cfg.badgeBg, color: cfg.color, borderRadius: 2 }}
                >
                  {cfg.label}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
                  {reply.user?.name ?? "Barangay Office"}
                </span>
              </div>
              <span className="text-[9px] text-gray-400 flex-shrink-0">{date}</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: NAVY }}>{reply.message}</p>
            {reply.status === "missing" && (
              <div className="mt-3">
                <a
                  href="/mydocuments"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 text-white"
                  style={{ backgroundColor: NAVY, borderRadius: 2, textDecoration: "none" }}
                >
                  <Upload className="h-3 w-3" />
                  Upload Required Document
                </a>
              </div>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Schedule card ─────────────────────────────────────────────────────────────
function ScheduleCard({ schedule }: { schedule: ScheduleData }) {
  const dateStr = schedule.schedule_date;
  const timeStr = schedule.schedule_time;

  const friendlyDate = (() => {
    try {
      return new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, {
        month: "long", day: "numeric", year: "numeric",
      });
    } catch { return dateStr; }
  })();

  const friendlyTime = (() => {
    try {
      const [hStr, mStr] = timeStr.split(":");
      const startH = parseInt(hStr, 10);
      const endH   = startH + 1;
      const fmt = (h: number) => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${mStr}`;
      const period = endH >= 12 ? "PM" : "AM";
      return `${fmt(startH)} – ${fmt(endH)} ${period}`;
    } catch { return timeStr; }
  })();

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{ border: "1px solid #bfdbfe", borderLeftWidth: 3, borderLeftColor: "#2563eb", backgroundColor: "#eff6ff" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ backgroundColor: "#dbeafe", borderBottom: "1px solid #bfdbfe" }}
      >
        <Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#1d4ed8" }} />
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#1d4ed8" }}>
          Scheduled Pickup
        </span>
        {schedule.status && (
          <span
            className="ml-auto text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5"
            style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", borderRadius: 2, border: "1px solid #bfdbfe" }}
          >
            {schedule.status}
          </span>
        )}
      </div>

      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="flex flex-col items-center justify-center flex-shrink-0 px-3 py-2"
            style={{ backgroundColor: "#2563eb", borderRadius: 2, minWidth: 56 }}
          >
            <span className="text-[9px] font-black uppercase tracking-wider text-white opacity-80">
              {new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, { month: "short" })}
            </span>
            <span className="text-xl font-black text-white leading-none">
              {new Date(dateStr + "T12:00:00").getDate()}
            </span>
            <span className="text-[9px] font-bold text-white opacity-80">
              {new Date(dateStr + "T12:00:00").getFullYear()}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: NAVY }}>{friendlyDate}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3.5 w-3.5" style={{ color: "#2563eb" }} />
              <p className="text-xs font-semibold" style={{ color: "#1d4ed8" }}>{friendlyTime}</p>
            </div>
          </div>
        </div>
        {schedule.note && (
          <div
            className="flex items-start gap-2 px-3 py-2 rounded-sm sm:max-w-xs"
            style={{ backgroundColor: "#dbeafe", borderRadius: 2 }}
          >
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#1d4ed8" }} />
            <p className="text-xs" style={{ color: "#1e40af" }}>{schedule.note}</p>
          </div>
        )}
      </div>

      <div
        className="px-4 py-2 flex items-center gap-1.5"
        style={{ borderTop: "1px solid #bfdbfe", backgroundColor: "#dbeafe" }}
      >
        <BadgeCheck className="h-3.5 w-3.5" style={{ color: "#1d4ed8" }} />
        <p className="text-[10px] font-semibold" style={{ color: "#1e40af" }}>
          Please visit the barangay hall at the scheduled time and bring your original documents.
        </p>
      </div>
    </div>
  );
}

// ─── Shared primitives ─────────────────────────────────────────────────────────
const DetailLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: PINK }}>{children}</p>
);

const DetailValue = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm font-medium text-foreground">
    {children || <span className="text-gray-400 italic font-normal text-xs">—</span>}
  </p>
);

const DetailGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">{children}</div>
);

const DetailField = ({ label, value }: { label: string; value?: string | number | boolean | null }) => {
  const display =
    value === true  ? "Yes" :
    value === false ? "No"  :
    value != null   ? String(value) : "";
  return (
    <div>
      <DetailLabel>{label}</DetailLabel>
      <DetailValue>{display}</DetailValue>
    </div>
  );
};

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#f0f4ff", borderRadius: 1 }}>
        <Icon className="h-3.5 w-3.5" style={{ color: NAVY }} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: NAVY }}>{title}</p>
      <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
    </div>
    {children}
  </div>
);

const ResidentFields = ({ r }: { r: any }) => (
  <>
    <Section icon={User} title="Personal Information">
      <DetailGrid>
        <DetailField label="Resident ID"         value={r.resident_id} />
        <DetailField label="Prefix"              value={r.prefix} />
        <DetailField label="First Name"          value={r.first_name} />
        <DetailField label="Middle Name"         value={r.middle_name} />
        <DetailField label="Surname"             value={r.surname} />
        <DetailField label="Ext. Name"           value={r.ext_name} />
        <DetailField label="Nickname"            value={r.nick_name} />
        <DetailField label="Sex"                 value={r.sex} />
        <DetailField label="Date of Birth"       value={r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : ""} />
        <DetailField label="Place of Birth"      value={r.place_of_birth} />
        <DetailField label="Blood Type"          value={r.blood_type} />
        <DetailField label="Complexion"          value={r.complexion} />
        <DetailField label="Height (cm)"         value={r.height_cm} />
        <DetailField label="Weight (kg)"         value={r.weight_kg} />
        <DetailField label="Religion"            value={r.religion} />
        <DetailField label="Marital Status"      value={r.marital_status} />
        <DetailField label="Name of Spouse"      value={r.name_of_spouse} />
        <DetailField label="PWD"                 value={r.pwd} />
      </DetailGrid>
    </Section>

    <Section icon={MapPin} title="Address">
      <DetailGrid>
        <DetailField label="House / Block / Lot No." value={r.house_block_lot_no} />
        <DetailField label="Street"              value={r.street} />
        <DetailField label="Zone"                value={r.zone} />
        <DetailField label="House Owner"         value={r.house_owner} />
        <DetailField label="Relationship to Owner" value={r.relationship_to_owner} />
        <DetailField label="Period of Residency" value={r.period_of_residency ? `${r.period_of_residency} year(s)` : ""} />
        <DetailField label="Resident Status"     value={r.resident_status} />
      </DetailGrid>
    </Section>

    <Section icon={Phone} title="Contact & Employment">
      <DetailGrid>
        <DetailField label="Phone Number"        value={r.phone_number} />
        <DetailField label="Email Address"       value={r.email_address} />
        <DetailField label="Occupation"          value={r.occupation} />
        <DetailField label="Employment Status"   value={r.emp_status} />
        <DetailField label="Position"            value={r.position} />
      </DetailGrid>
    </Section>

    <Section icon={ShieldCheck} title="Civil Registration">
      <DetailGrid>
        <DetailField label="Voter Status"        value={r.voter_status} />
        <DetailField label="Precinct No."        value={r.precinct_no} />
      </DetailGrid>
    </Section>

    {r.notes && (
      <Section icon={ClipboardList} title="Notes">
        <p className="text-sm text-muted-foreground">{r.notes}</p>
      </Section>
    )}
  </>
);

// ─── Document-type-specific sections ──────────────────────────────────────────
const CertificateFields = ({ r }: { r: any }) => (
  <>
    <Section icon={User} title="Requester Details">
      <DetailGrid>
        <DetailField label="Full Name"             value={r.requester_name} />
        <DetailField label="Age"                   value={r.age} />
        <DetailField label="Date of Birth"         value={r.date_of_birth} />
        <DetailField label="Place of Birth"        value={r.place_of_birth} />
        <DetailField label="Contact No."           value={r.contact_no} />
      </DetailGrid>
    </Section>
    <Section icon={MapPin} title="Address">
      <DetailGrid>
        <DetailField label="Address"               value={r.address} />
        <DetailField label="House Owner"           value={r.house_owner} />
        <DetailField label="Relationship to Owner" value={r.relationship_to_owner} />
      </DetailGrid>
    </Section>
    <Section icon={ClipboardList} title="Certificate Details">
      <DetailGrid>
        <DetailField label="Certificate No."       value={r.bcert_number} />
        <DetailField label="Purpose"               value={r.purpose} />
        <DetailField label="Purpose Details"       value={r.purpose_details} />
        <DetailField label="Period of Residency"   value={r.period_of_residency} />
        <DetailField label="Registered Voter"      value={r.registered_voter} />
      </DetailGrid>
    </Section>
  </>
);

const ClearanceFields = ({ r }: { r: any }) => (
  <>
    <Section icon={User} title="Requester Details">
      <DetailGrid>
        <DetailField label="Full Name"             value={r.requester_name} />
        <DetailField label="Date of Birth"         value={r.dob} />
        <DetailField label="Place of Birth"        value={r.pob} />
        <DetailField label="Contact No."           value={r.contact_no} />
      </DetailGrid>
    </Section>
    <Section icon={MapPin} title="Address">
      <DetailGrid>
        <DetailField label="Address"               value={r.address} />
        <DetailField label="House Owner"           value={r.house_owner} />
        <DetailField label="Relationship to Owner" value={r.relationship_to_owner} />
      </DetailGrid>
    </Section>
    <Section icon={ClipboardList} title="Clearance Details">
      <DetailGrid>
        <DetailField label="Clearance No."         value={r.bcert_number} />
        <DetailField label="Purpose"               value={r.purpose} />
        <DetailField label="Purpose Details"       value={r.purpose_details} />
        <DetailField label="Period of Residency"   value={r.period_of_residency} />
        <DetailField label="Registered Voter"      value={r.registered_voter} />
      </DetailGrid>
    </Section>
    <Section icon={Hash} title="Official Reference">
      <DetailGrid>
        <DetailField label="CTC / VRR No."         value={r.ctc_vrr_no} />
        <DetailField label="Issued At"             value={r.issued_at} />
        <DetailField label="Issued On"             value={r.issued_on} />
        <DetailField label="O.R. Number"           value={r.or_no} />
      </DetailGrid>
    </Section>
  </>
);

const BuildingFields = ({ r }: { r: any }) => (
  <>
    <Section icon={User} title="Applicant Details">
      <DetailGrid><DetailField label="Full Name" value={r.requester_name} /></DetailGrid>
    </Section>
    <Section icon={Building2} title="Building Details">
      <DetailGrid>
        <DetailField label="Establishment"   value={r.raw?.establishment} />
        <DetailField label="Purpose"         value={r.purpose} />
        <DetailField label="Purpose Details" value={r.purpose_details} />
      </DetailGrid>
    </Section>
    <Section icon={MapPin} title="Project Location">
      <DetailGrid><DetailField label="Address" value={r.address} /></DetailGrid>
    </Section>
    <Section icon={ShieldCheck} title="Clearance Info">
      <DetailGrid>
        <DetailField label="Clearance No."       value={r.bcert_number} />
        <DetailField label="O.R. Number"         value={r.raw?.orNo} />
        <DetailField label="Punong Barangay"     value={r.raw?.punongBarangay} />
        <DetailField label="Barangay Position"   value={r.raw?.barangayPosition} />
        {r.updated_by && <DetailField label="Updated By" value={r.updated_by} />}
      </DetailGrid>
    </Section>
  </>
);

const BusinessFields = ({ r }: { r: any }) => (
  <>
    <Section icon={User} title="Owner Details">
      <DetailGrid><DetailField label="Full Name" value={r.requester_name} /></DetailGrid>
    </Section>
    <Section icon={Briefcase} title="Business Information">
      <DetailGrid>
        <DetailField label="Business Name"    value={r.raw?.businessName ?? r.purpose} />
        <DetailField label="Business Type"    value={r.raw?.businessType} />
        <DetailField label="Business Details" value={r.purpose_details} />
        <DetailField label="Capital (PHP)"    value={r.capital != null ? `₱${r.capital}` : ""} />
      </DetailGrid>
    </Section>
    <Section icon={MapPin} title="Business Address">
      <DetailGrid><DetailField label="Address" value={r.address} /></DetailGrid>
    </Section>
    <Section icon={ClipboardList} title="Clearance Details">
      <DetailGrid>
        <DetailField label="Barangay Business No." value={r.bcert_number} />
        <DetailField label="O.R. Number"           value={r.raw?.orNo} />
        {r.updated_by && <DetailField label="Updated By" value={r.updated_by} />}
      </DetailGrid>
    </Section>
    <Section icon={BadgeInfo} title="Inspection Details">
      <DetailGrid>
        <DetailField label="Inspected By"        value={r.inspected_by} />
        <DetailField label="Date of Inspection"  value={r.date_of_inspection} />
        <DetailField label="Inspection Remarks"  value={r.raw?.inspectionRemarks} />
        <DetailField label="Additional Notes"    value={r.inspected_notes} />
      </DetailGrid>
    </Section>
  </>
);

// ─── Requirements Complete Modal ───────────────────────────────────────────────
function RequirementsCompleteModal({
  documentType,
  uploadedTypes,
  onDismiss,
  onViewProgress,
}: {
  documentType: string;
  uploadedTypes: Set<string>;
  onDismiss: () => void;
  onViewProgress: () => void;
}) {
  const key = documentType.replace(/-/g, "_");
  const service = serviceData[key];
  const requiredSlots = REQUIRED_SLOTS_BY_DOC[key] ?? [];
  if (!service) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.48)" }}
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="w-full max-w-md overflow-hidden" style={{ backgroundColor: "white", borderRadius: 12, border: "0.5px solid #e5e7eb" }}>

        {/* Top */}
        <div className="px-6 py-6 text-center" style={{ backgroundColor: "#f0fdf4", borderBottom: "0.5px solid #bbf7d0" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: "#dcfce7", border: "2px solid #86efac" }}>
            <CheckCircle className="h-8 w-8" style={{ color: "#16a34a" }} />
          </div>
          <p className="font-semibold text-base" style={{ color: "#15803d" }}>Requirements submitted!</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "#166534" }}>
            All required documents have been received.<br />
            The barangay office will take it from here.
          </p>
        </div>

        <div className="px-6 py-5">
          {/* Uploaded docs */}
          <div className="space-y-2 mb-5">
            {requiredSlots.map((slot) => (
              <div key={slot} className="flex items-center gap-3 px-3 py-2"
                style={{ backgroundColor: "#f8faff", border: "0.5px solid #e5e7eb", borderRadius: 8 }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#dcfce7", border: "1.5px solid #86efac" }}>
                  <CheckCircle className="h-3 w-3" style={{ color: "#16a34a" }} />
                </div>
                <span className="text-xs flex-1" style={{ color: NAVY }}>{SLOT_LABELS[slot] ?? slot}</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#dcfce7", color: "#15803d", border: "0.5px solid #86efac" }}>
                  Uploaded
                </span>
              </div>
            ))}
          </div>

          <div style={{ height: "0.5px", backgroundColor: "#e5e7eb", margin: "0 0 18px" }} />

          {/* Awaiting schedule callout */}
          <div className="p-4 mb-5" style={{ backgroundColor: "#eff6ff", border: "0.5px solid #bfdbfe", borderRadius: 8 }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: "#1d4ed8" }} />
              <p className="text-xs font-semibold" style={{ color: "#1d4ed8" }}>Awaiting your pickup schedule</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#1e40af" }}>
              Once the barangay assigns a date, it will appear on this page. You can track the full progress below.
            </p>
          </div>

          <div style={{ height: "0.5px", backgroundColor: "#e5e7eb", margin: "0 0 18px" }} />

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            {/* View Progress button */}
            <button
              onClick={() => { onDismiss(); onViewProgress(); }}
              className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: NAVY, borderRadius: 8, border: "none" }}
            >
              <ListChecks className="h-4 w-4" />
              View Full Progress
            </button>

            {/* Dismiss button */}
            <button
              onClick={onDismiss}
              className="w-full py-2.5 text-xs font-semibold"
              style={{
                backgroundColor: "transparent",
                borderRadius: 8,
                border: `1px solid #e5e7eb`,
                color: "#6b7280",
              }}
            >
              Got it, I'll wait for the schedule
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center gap-2"
          style={{ backgroundColor: "#f8faff", borderTop: "0.5px solid #e5e7eb" }}>
          <Info className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#9ca3af" }} />
          <p className="text-[11px]" style={{ color: "#6b7280" }}>
            Check this page anytime to see your current request status.
          </p>
        </div>

      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function RequestDetail() {
  const navigate = useNavigate();
  const { id, type } = useParams<{ id: string; type: string }>();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const hasShownModal = useRef(false);
  const trackerRef = useRef<HTMLDivElement>(null);

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", type, id],
    queryFn: () => fetchRequestById(type!, id!),
    enabled: !!id && !!type,
  });

  const { data: uploadedTypes = new Set<string>() } = useQuery({
    queryKey: ["mydocuments"],
    queryFn: async (): Promise<Set<string>> => {
      const res = await fetch("http://127.0.0.1:8000/api/mydocuments", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return new Set();
      const json = await res.json();
      const uploaded = new Set<string>();
      const docs: Record<string, any[]> = json?.data?.documents ?? {};
      Object.values(docs).forEach((arr) =>
        arr.forEach((d) => { if (d?.type) uploaded.add(d.type); })
      );
      return uploaded;
    },
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
    if (hasShownModal.current || !request) return;
    const key = (request.document_type ?? "").replace(/-/g, "_");
    const requiredSlots = REQUIRED_SLOTS_BY_DOC[key] ?? [];
    if (requiredSlots.length === 0) return;
    const allUploaded = requiredSlots.every((s) => uploadedTypes.has(s));
    if (allUploaded) {
      setShowCompleteModal(true);
      hasShownModal.current = true;
    }
  }, [uploadedTypes, request]);

  // Scroll the process tracker into view
  const scrollToTracker = () => {
    trackerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

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
          <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#f0f4ff", borderRadius: 2 }}>
            <FileText className="w-7 h-7" style={{ color: NAVY }} />
          </div>
          <p className="text-muted-foreground text-sm mb-4">Request not found.</p>
          <button
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: NAVY, borderRadius: 1 }}
            onClick={() => navigate("/myrequest")}
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  const normalizedStatus = request.raw.status?.toLowerCase();
  const isReleased = normalizedStatus === "released";
  const badge = statusStyle[normalizedStatus] ?? { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
  const docTypeSlug = (request.document_type ?? type ?? "").replace(/-/g, "_");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {showCompleteModal && (
        <RequirementsCompleteModal
          documentType={request.document_type}
          uploadedTypes={uploadedTypes}
          onDismiss={() => setShowCompleteModal(false)}
          onViewProgress={scrollToTracker}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16">

        {/* Back button */}
        <button
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6 transition-colors duration-200 group"
          style={{ color: "#6b7280" }}
          onClick={() => navigate("/myrequest")}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = NAVY)}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b7280")}
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Requests
        </button>

        {/* ── Main card ── */}
        <div
          className="bg-card border border-border overflow-hidden"
          style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: isReleased ? "#16a34a" : PINK }}
        >
          {/* Card header */}
          <div
            className="px-6 py-5"
            style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: isReleased ? "#f0fdf4" : "#f8faff" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 mb-1.5">
                  <div style={{ width: 16, height: 1, backgroundColor: isReleased ? "#16a34a" : PINK }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: isReleased ? "#16a34a" : PINK }}>
                    Service Request
                  </p>
                </div>
                <h2
                  className="font-bold text-foreground flex items-center gap-2"
                  style={{ fontFamily: "'Georgia', serif", fontSize: "1.1rem" }}
                >
                  <FileText className="h-5 w-5 flex-shrink-0" style={{ color: NAVY }} />
                  {DOCUMENT_LABELS[request.document_type]}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-bold" style={{ color: PINK }}>Ref: </span>
                  {request.id}
                  {request.bcert_number && (
                    <span className="ml-3">
                      <span className="font-bold" style={{ color: PINK }}>Doc No.: </span>
                      {request.bcert_number}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className="self-start text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border flex-shrink-0"
                  style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border, borderRadius: 2 }}
                >
                  {normalizedStatus}
                </span>
                {schedule && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 flex-shrink-0"
                    style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 2 }}
                  >
                    <Calendar className="h-3 w-3" />
                    Pickup scheduled
                  </span>
                )}

                {/* Quick-jump to tracker button */}
                <button
                  onClick={scrollToTracker}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 transition-colors flex-shrink-0"
                  style={{
                    backgroundColor: "#f0f4ff",
                    color: NAVY,
                    border: `1px solid #dde3ed`,
                    borderRadius: 2,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#e0e8ff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f4ff"; }}
                >
                  <ListChecks className="h-3 w-3" />
                  View Progress
                </button>
              </div>
            </div>
          </div>

          {/* ── Card body ── */}
          <div className="p-6 space-y-7">

            {/* ── Released download banner — shown FIRST when released ── */}
            {isReleased && (
              <ReleasedDownloadBanner
                documentType={request.document_type}
                recordId={request.id}
                releasedAt={request.raw?.released_at}
              />
            )}

            {/* ── Process Tracker — always visible ── */}
            <ProcessTracker
              status={normalizedStatus}
              schedule={schedule}
              trackerRef={trackerRef}
            />

            {/* Requirements panel — hide when already released */}
            {!isReleased && (
              <RequirementsPanel documentType={request.document_type} uploadedTypes={uploadedTypes} />
            )}

            {/* Submission meta */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm pb-5"
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              <div>
                <DetailLabel>Date Submitted</DetailLabel>
                <DetailValue>{format(new Date(request.created_at), "MMMM d, yyyy")}</DetailValue>
              </div>
              {request.updated_at && (
                <div>
                  <DetailLabel>Last Updated</DetailLabel>
                  <DetailValue>{format(new Date(request.updated_at), "MMMM d, yyyy")}</DetailValue>
                </div>
              )}
              {request.raw?.released_at && (
                <div>
                  <DetailLabel>Released On</DetailLabel>
                  <DetailValue>{format(new Date(request.raw.released_at), "MMMM d, yyyy")}</DetailValue>
                </div>
              )}
            </div>

            {/* Document-type-specific fields */}
            {request.document_type === "barangay_certificate" && <CertificateFields r={request} />}
            {request.document_type === "barangay_clearance"   && <ClearanceFields   r={request} />}
            {request.document_type === "building_clearance"   && <BuildingFields    r={request} />}
            {request.document_type === "business_clearance"   && <BusinessFields    r={request} />}
            {request.document_type === "resident_registration" && <ResidentFields   r={request.raw ?? request} />}
            {/* Schedule card */}
            {schedule && <ScheduleCard schedule={schedule} />}

            {/* Missing items */}
            {request.missing_items && request.missing_items.length > 0 && (
              <div
                className="p-4"
                style={{ backgroundColor: "#fefce8", borderRadius: 2, border: "1px solid #fde68a", borderLeftWidth: 3, borderLeftColor: "#ca8a04" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: "#ca8a04" }} />
                  <p className="font-semibold text-sm" style={{ color: "#92400e" }}>Missing Information Required</p>
                </div>
                <ul className="space-y-1.5 ml-7">
                  {request.missing_items.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span style={{ color: "#ca8a04", flexShrink: 0 }}>—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Replies */}
            <Section icon={MessageSquare} title="Remarks from Barangay Office">
              <RepliesFeed documentType={docTypeSlug} documentId={request.id} />
            </Section>

            {/* Legacy remarks */}
            {request.remarks && (
              <div
                className="p-4"
                style={{ backgroundColor: "#fff1f2", borderRadius: 2, border: "1px solid #fecdd3", borderLeftWidth: 3, borderLeftColor: "#e11d48" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-5 w-5 flex-shrink-0" style={{ color: "#e11d48" }} />
                  <p className="font-semibold text-sm" style={{ color: "#9f1239" }}>Additional Remarks</p>
                </div>
                <p className="text-sm text-muted-foreground ml-7">{request.remarks}</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}