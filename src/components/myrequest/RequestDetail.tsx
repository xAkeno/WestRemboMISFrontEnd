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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Header from "../forms/Header";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

// ─── Status badge colors ───────────────────────────────────────────────────────
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

const STATUS_TO_STEP: Record<string, number> = {
  pending: 0, incomplete: 0, processing: 0, encoded: 0,
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

const PROCESS_STEPS = ["Encoded", "Scheduled", "To Pay", "Released"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true only if value is non-null, non-undefined, non-empty string */
const hasValue = (v: any): boolean =>
  v !== null && v !== undefined && String(v).trim() !== "";

/** Returns true if at least one value in an object is non-empty */
const sectionHasData = (fields: Record<string, any>): boolean =>
  Object.values(fields).some(hasValue);

// ─── Compact Process Bar ───────────────────────────────────────────────────────
function ProcessBar({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const isRejected = normalized === "rejected";
  const currentStep = isRejected ? -1 : (STATUS_TO_STEP[normalized] ?? 0);

  return (
    <div className="flex items-center gap-1">
      {PROCESS_STEPS.map((step, i) => {
        const isDone    = !isRejected && i < currentStep;
        const isCurrent = !isRejected && i === currentStep;
        return (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className="h-1.5 w-full rounded-full mb-1"
                style={{
                  backgroundColor: isDone
                    ? "#16a34a"
                    : isCurrent
                    ? NAVY
                    : "#e5e7eb",
                }}
              />
              <span
                className="text-[9px] font-semibold truncate w-full text-center"
                style={{
                  color: isDone ? "#16a34a" : isCurrent ? NAVY : "#9ca3af",
                }}
              >
                {step}
              </span>
            </div>
            {i < PROCESS_STEPS.length - 1 && (
              <ChevronRight className="h-3 w-3 flex-shrink-0 mb-4" style={{ color: "#d1d5db" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Full Details Modal ────────────────────────────────────────────────────────
function DetailsModal({ request, onClose }: { request: any; onClose: () => void }) {
  const docType = request.document_type ?? "";

  const DetailLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: PINK }}>{children}</p>
  );
  const DetailValue = ({ children }: { children: React.ReactNode }) => (
    <p className="text-sm font-medium" style={{ color: NAVY }}>{children}</p>
  );

  /** Only renders if value exists */
  const Field = ({ label, value }: { label: string; value?: string | number | boolean | null }) => {
    if (!hasValue(value)) return null;
    const display = value === true ? "Yes" : value === false ? "No" : String(value);
    return (
      <div>
        <DetailLabel>{label}</DetailLabel>
        <DetailValue>{display}</DetailValue>
      </div>
    );
  };

  /** Only renders if at least one field in the group has data */
  const Section = ({ title, icon: Icon, fields }: {
    title: string;
    icon: React.ElementType;
    fields: { label: string; value?: any }[];
  }) => {
    const visible = fields.filter(f => hasValue(f.value));
    if (visible.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4 flex-shrink-0" style={{ color: NAVY }} />
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: NAVY }}>{title}</p>
          <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {visible.map((f, i) => <Field key={i} label={f.label} value={f.value} />)}
        </div>
      </div>
    );
  };

  const r = request;
  const raw = r.raw ?? {};

  // Build sections per document type
  const sections = (() => {
    if (docType === "barangay_certificate" || docType === "barangay_clearance") {
      return [
        {
          title: "Requester Details", icon: User,
          fields: [
            { label: "Full Name",           value: r.requester_name },
            { label: "Age",                 value: r.age },
            { label: "Date of Birth",       value: r.date_of_birth },
            { label: "Place of Birth",      value: r.place_of_birth },
            { label: "Contact No.",         value: r.contact_no },
          ],
        },
        {
          title: "Address", icon: MapPin,
          fields: [
            { label: "Address",                  value: r.address },
            { label: "House Owner",              value: r.house_owner },
            { label: "Relationship to Owner",    value: r.relationship_to_owner },
          ],
        },
        {
          title: docType === "barangay_certificate" ? "Certificate Details" : "Clearance Details", icon: ClipboardList,
          fields: [
            { label: docType === "barangay_certificate" ? "Certificate No." : "Clearance No.", value: r.bcert_number },
            { label: "Purpose",              value: r.purpose },
            { label: "Purpose Details",      value: r.purpose_details },
            { label: "Period of Residency",  value: r.period_of_residency },
            { label: "Registered Voter",     value: r.registered_voter },
          ],
        },
        ...(docType === "barangay_clearance" ? [{
          title: "Official Reference", icon: Hash,
          fields: [
            { label: "CTC / VRR No.",  value: r.ctc_vrr_no },
            { label: "Issued At",      value: r.issued_at },
            { label: "Issued On",      value: r.issued_on },
            { label: "O.R. Number",    value: r.or_no },
          ],
        }] : []),
      ];
    }

    if (docType === "building_clearance") {
      return [
        {
          title: "Applicant Details", icon: User,
          fields: [{ label: "Full Name", value: r.requester_name }],
        },
        {
          title: "Building Details", icon: Building2,
          fields: [
            { label: "Establishment",    value: raw.establishment },
            { label: "Purpose",          value: r.purpose },
            { label: "Purpose Details",  value: r.purpose_details },
          ],
        },
        {
          title: "Project Location", icon: MapPin,
          fields: [{ label: "Address", value: r.address }],
        },
        {
          title: "Clearance Info", icon: ShieldCheck,
          fields: [
            { label: "Clearance No.",       value: r.bcert_number },
            { label: "O.R. Number",         value: raw.orNo },
            { label: "Punong Barangay",     value: raw.punongBarangay },
            { label: "Barangay Position",   value: raw.barangayPosition },
            { label: "Updated By",          value: r.updated_by },
          ],
        },
      ];
    }

    if (docType === "business_clearance") {
      return [
        {
          title: "Owner Details", icon: User,
          fields: [{ label: "Full Name", value: r.requester_name }],
        },
        {
          title: "Business Information", icon: Briefcase,
          fields: [
            { label: "Business Name",    value: raw.businessName ?? r.purpose },
            { label: "Business Type",    value: raw.businessType },
            { label: "Business Details", value: r.purpose_details },
            { label: "Capital (PHP)",    value: r.capital != null ? `₱${r.capital}` : null },
          ],
        },
        {
          title: "Business Address", icon: MapPin,
          fields: [{ label: "Address", value: r.address }],
        },
        {
          title: "Clearance Details", icon: ClipboardList,
          fields: [
            { label: "Barangay Business No.", value: r.bcert_number },
            { label: "O.R. Number",           value: raw.orNo },
            { label: "Updated By",            value: r.updated_by },
          ],
        },
        {
          title: "Inspection Details", icon: BadgeInfo,
          fields: [
            { label: "Inspected By",         value: r.inspected_by },
            { label: "Date of Inspection",   value: r.date_of_inspection },
            { label: "Inspection Remarks",   value: raw.inspectionRemarks },
            { label: "Additional Notes",     value: r.inspected_notes },
          ],
        },
      ];
    }

    if (docType === "resident_registration") {
      const res = raw ?? r;
      return [
        {
          title: "Personal Information", icon: User,
          fields: [
            { label: "Resident ID",       value: res.resident_id },
            { label: "Prefix",            value: res.prefix },
            { label: "First Name",        value: res.first_name },
            { label: "Middle Name",       value: res.middle_name },
            { label: "Surname",           value: res.surname },
            { label: "Ext. Name",         value: res.ext_name },
            { label: "Nickname",          value: res.nick_name },
            { label: "Sex",               value: res.sex },
            { label: "Date of Birth",     value: res.date_of_birth ? new Date(res.date_of_birth).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : null },
            { label: "Place of Birth",    value: res.place_of_birth },
            { label: "Blood Type",        value: res.blood_type },
            { label: "Complexion",        value: res.complexion },
            { label: "Height (cm)",       value: res.height_cm },
            { label: "Weight (kg)",       value: res.weight_kg },
            { label: "Religion",          value: res.religion },
            { label: "Marital Status",    value: res.marital_status },
            { label: "Name of Spouse",    value: res.name_of_spouse },
            { label: "PWD",               value: res.pwd },
          ],
        },
        {
          title: "Address", icon: MapPin,
          fields: [
            { label: "House / Block / Lot No.",  value: res.house_block_lot_no },
            { label: "Street",                   value: res.street },
            { label: "Zone",                     value: res.zone },
            { label: "House Owner",              value: res.house_owner },
            { label: "Relationship to Owner",    value: res.relationship_to_owner },
            { label: "Period of Residency",      value: res.period_of_residency ? `${res.period_of_residency} year(s)` : null },
            { label: "Resident Status",          value: res.resident_status },
          ],
        },
        {
          title: "Contact & Employment", icon: Phone,
          fields: [
            { label: "Phone Number",      value: res.phone_number },
            { label: "Email Address",     value: res.email_address },
            { label: "Occupation",        value: res.occupation },
            { label: "Employment Status", value: res.emp_status },
            { label: "Position",          value: res.position },
          ],
        },
        {
          title: "Civil Registration", icon: ShieldCheck,
          fields: [
            { label: "Voter Status",  value: res.voter_status },
            { label: "Precinct No.", value: res.precinct_no },
          ],
        },
        ...(res.notes ? [{
          title: "Notes", icon: ClipboardList,
          fields: [{ label: "Notes", value: res.notes }],
        }] : []),
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
        style={{ backgroundColor: "white", borderRadius: "12px 12px 0 0", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f8faff" }}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: NAVY }} />
            <p className="text-sm font-bold" style={{ color: NAVY }}>Full Request Details</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: "#f3f4f6" }}
          >
            <X className="h-4 w-4" style={{ color: "#6b7280" }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
          {/* Submission meta */}
          <div
            className="grid grid-cols-2 gap-4 p-4 rounded-lg"
            style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}
          >
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
            {hasValue(request.raw?.released_at) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: PINK }}>Released On</p>
                <p className="text-sm font-medium" style={{ color: NAVY }}>{format(new Date(request.raw.released_at), "MMMM d, yyyy")}</p>
              </div>
            )}
          </div>

          {/* Document-type sections */}
          {sections.map((sec, i) => (
            <Section key={i} title={sec.title} icon={sec.icon} fields={sec.fields} />
          ))}

          {/* Missing items */}
          {request.missing_items && request.missing_items.length > 0 && (
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#fefce8", border: "1px solid #fde68a", borderLeftWidth: 3, borderLeftColor: "#ca8a04" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" style={{ color: "#ca8a04" }} />
                <p className="text-xs font-bold" style={{ color: "#92400e" }}>Missing Information</p>
              </div>
              <ul className="space-y-1 ml-6">
                {request.missing_items.map((item: string, i: number) => (
                  <li key={i} className="text-xs" style={{ color: "#92400e" }}>— {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Legacy remarks */}
          {hasValue(request.remarks) && (
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3", borderLeftWidth: 3, borderLeftColor: "#e11d48" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4" style={{ color: "#e11d48" }} />
                <p className="text-xs font-bold" style={{ color: "#9f1239" }}>Additional Remarks</p>
              </div>
              <p className="text-sm" style={{ color: NAVY }}>{request.remarks}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid #e5e7eb", backgroundColor: "#f8faff" }}
        >
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: NAVY, borderRadius: 8, border: "none" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Replies feed (compact, only shown if there are replies) ───────────────────
function RepliesFeed({ documentType, documentId }: { documentType: string; documentId: string | number }) {
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
        if (!res.ok) throw new Error("Failed");
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: NAVY }} />
        <span className="text-xs text-gray-400">Loading remarks…</span>
      </div>
    );
  }

  if (replies.length === 0) return null; // Hidden when empty

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #dde3ed" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: "#f0f4ff", borderBottom: "1px solid #dde3ed" }}
      >
        <MessageSquare className="h-3.5 w-3.5" style={{ color: NAVY }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>
          Remarks from Barangay Office
        </span>
        <span
          className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full"
          style={{ backgroundColor: NAVY, color: "white" }}
        >
          {replies.length}
        </span>
      </div>
      <div className="p-3 space-y-2 bg-white">
        {replies.map((reply) => {
          const cfg = REPLY_STATUS_CONFIG[reply.status];
          const Icon = cfg.icon;
          const date = new Date(reply.created_at).toLocaleString(undefined, {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
          });
          return (
            <div
              key={reply.id}
              className="rounded-lg px-3 py-2.5"
              style={{
                backgroundColor: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderLeftWidth: 3,
                borderLeftColor: cfg.leftBorder,
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3" style={{ color: cfg.color }} />
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: cfg.badgeBg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
                    {reply.user?.name ?? "Barangay Office"}
                  </span>
                </div>
                <span className="text-[9px] text-gray-400">{date}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: NAVY }}>{reply.message}</p>
              {reply.status === "missing" && (
                <div className="mt-2">
                  <a
                    href="/mydocuments"
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 text-white rounded"
                    style={{ backgroundColor: NAVY, textDecoration: "none" }}
                  >
                    <Upload className="h-3 w-3" />
                    Upload Document
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Schedule card (compact) ───────────────────────────────────────────────────
function ScheduleCard({ schedule }: { schedule: ScheduleData }) {
  const dateStr = schedule.schedule_date;
  const timeStr = schedule.schedule_time;

  const friendlyDate = (() => {
    try { return new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }); }
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
      style={{ border: "1px solid #bfdbfe", borderLeftWidth: 3, borderLeftColor: "#2563eb" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ backgroundColor: "#dbeafe", borderBottom: "1px solid #bfdbfe" }}
      >
        <Calendar className="h-3.5 w-3.5" style={{ color: "#1d4ed8" }} />
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#1d4ed8" }}>
          Scheduled Pickup
        </span>
      </div>
      <div className="px-4 py-3 flex items-center gap-3 bg-white">
        <div
          className="flex flex-col items-center justify-center flex-shrink-0 px-3 py-2 rounded-lg"
          style={{ backgroundColor: "#2563eb", minWidth: 52 }}
        >
          <span className="text-[9px] font-black uppercase text-white opacity-80">
            {new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, { month: "short" })}
          </span>
          <span className="text-lg font-black text-white leading-none">
            {new Date(dateStr + "T12:00:00").getDate()}
          </span>
          <span className="text-[9px] font-bold text-white opacity-80">
            {new Date(dateStr + "T12:00:00").getFullYear()}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: NAVY }}>{friendlyDate}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3 w-3" style={{ color: "#2563eb" }} />
            <p className="text-xs font-semibold" style={{ color: "#1d4ed8" }}>{friendlyTime}</p>
          </div>
          {schedule.note && (
            <p className="text-xs mt-1" style={{ color: "#4b5563" }}>{schedule.note}</p>
          )}
        </div>
      </div>
      <div
        className="px-4 py-2 flex items-center gap-1.5"
        style={{ borderTop: "1px solid #bfdbfe", backgroundColor: "#eff6ff" }}
      >
        <BadgeCheck className="h-3.5 w-3.5" style={{ color: "#1d4ed8" }} />
        <p className="text-[10px] font-semibold" style={{ color: "#1e40af" }}>
          Bring your original documents to the barangay hall.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function RequestDetail() {
  const navigate = useNavigate();
  const { id, type } = useParams<{ id: string; type: string }>();
  const [showDetails, setShowDetails] = useState(false);

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
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: NAVY, borderRadius: 8 }}
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
  const badge = statusStyle[normalizedStatus] ?? { bg: "#f3f4f6", text: "#374151", border: "#d1d5db", dot: "#374151" };
  const docTypeSlug = (request.document_type ?? type ?? "").replace(/-/g, "_");
  const svcMeta = serviceData[docTypeSlug];
  const statusMsg = STATUS_MESSAGES[normalizedStatus];

  // Requirements
  const requiredSlots = REQUIRED_SLOTS_BY_DOC[docTypeSlug] ?? [];
  const allUploaded = requiredSlots.length > 0 && requiredSlots.every((s) => uploadedTypes.has(s));
  const missingSlots = requiredSlots.filter((s) => !uploadedTypes.has(s));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {showDetails && (
        <DetailsModal request={request} onClose={() => setShowDetails(false)} />
      )}

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-28 pb-16">

        {/* Back */}
        <button
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-5 transition-colors"
          style={{ color: "#9ca3af" }}
          onClick={() => navigate("/myrequest")}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = NAVY)}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9ca3af")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Requests
        </button>

        {/* ── Main card ── */}
        <div
          className="bg-white overflow-hidden"
          style={{
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            borderTopWidth: 4,
            borderTopColor: isReleased ? "#16a34a" : isRejected ? "#e11d48" : PINK,
            boxShadow: "0 1px 12px rgba(15,42,94,0.07)",
          }}
        >
          {/* ── Header ── */}
          <div
            className="px-5 pt-5 pb-4"
            style={{ borderBottom: "1px solid #f3f4f6" }}
          >
            {/* Document type label */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: PINK }}>
                  Service Request
                </p>
                <h2 className="text-base font-bold leading-snug" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>
                  {DOCUMENT_LABELS[request.document_type] ?? request.document_type}
                </h2>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Ref: <span className="font-semibold text-gray-500">{request.id}</span>
                  {hasValue(request.bcert_number) && (
                    <> · Doc No.: <span className="font-semibold text-gray-500">{request.bcert_number}</span></>
                  )}
                </p>
              </div>

              {/* Status badge */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: badge.bg, border: `1px solid ${badge.border}` }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: badge.text }}>
                  {normalizedStatus}
                </span>
              </div>
            </div>

            {/* Status message + next step */}
            {statusMsg && (
              <div
                className="mt-3 px-3 py-2.5 rounded-lg flex items-start gap-2"
                style={{
                  backgroundColor: isReleased ? "#f0fdf4" : isRejected ? "#fff1f2" : normalizedStatus === "incomplete" ? "#fff7ed" : "#f0f4ff",
                  border: `1px solid ${isReleased ? "#bbf7d0" : isRejected ? "#fecdd3" : normalizedStatus === "incomplete" ? "#fed7aa" : "#dde3ed"}`,
                }}
              >
                {isReleased ? <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#16a34a" }} />
                  : isRejected ? <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
                  : normalizedStatus === "incomplete" ? <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#ea580c" }} />
                  : <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: NAVY }} />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug" style={{ color: isReleased ? "#15803d" : isRejected ? "#9f1239" : normalizedStatus === "incomplete" ? "#9a3412" : NAVY }}>
                    {statusMsg.message}
                  </p>
                  {statusMsg.nextStep && (
                    <p className="text-[10px] mt-1 font-semibold" style={{ color: PINK }}>
                      Next Step: {statusMsg.nextStep}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Progress ── */}
          <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>Progress</p>
            <ProcessBar status={normalizedStatus} />
          </div>

          {/* ── Key Info ── */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>Key Info</p>
            <div className="grid grid-cols-3 gap-3">
              {hasValue(request.created_at) && (
                <div
                  className="rounded-xl p-3"
                  style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="h-3 w-3" style={{ color: PINK }} />
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: PINK }}>Submitted</p>
                  </div>
                  <p className="text-xs font-bold" style={{ color: NAVY }}>
                    {format(new Date(request.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              )}
              {svcMeta && (
                <div
                  className="rounded-xl p-3"
                  style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3" style={{ color: PINK }} />
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: PINK }}>Processing</p>
                  </div>
                  <p className="text-xs font-bold" style={{ color: NAVY }}>{svcMeta.processingTime}</p>
                </div>
              )}
              {svcMeta && (
                <div
                  className="rounded-xl p-3"
                  style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Banknote className="h-3 w-3" style={{ color: PINK }} />
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: PINK }}>Fee</p>
                  </div>
                  <p className="text-xs font-bold" style={{ color: NAVY }}>{svcMeta.fee}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Requirements ── */}
          {!isReleased && requiredSlots.length > 0 && (
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>Requirements</p>
              {allUploaded ? (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#16a34a" }} />
                  <p className="text-xs font-semibold" style={{ color: "#15803d" }}>
                    All required documents submitted
                  </p>
                </div>
              ) : (
                <div>
                  <div
                    className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-2"
                    style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
                  >
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#ca8a04" }} />
                    <div>
                      <p className="text-xs font-bold" style={{ color: "#92400e" }}>Missing Documents</p>
                      <ul className="mt-1 space-y-0.5">
                        {missingSlots.map((s) => (
                          <li key={s} className="text-xs" style={{ color: "#92400e" }}>— {SLOT_LABELS[s] ?? s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <a
                    href="/mydocuments"
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 text-white rounded-lg"
                    style={{ backgroundColor: NAVY, textDecoration: "none" }}
                  >
                    <Upload className="h-3 w-3" />
                    Upload Missing Documents
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── Released banner ── */}
          {isReleased && (
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <div
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: "#dcfce7" }}
                >
                  <FileCheck className="h-5 w-5" style={{ color: "#16a34a" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#15803d" }}>Document Officially Released</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#166534" }}>
                    Sent to your registered email. Check your inbox and spam folder.
                    {hasValue(request.raw?.released_at) && (
                      <> Released on {format(new Date(request.raw.released_at), "MMMM d, yyyy")}.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Schedule card ── */}
          {schedule && !isReleased && (
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <ScheduleCard schedule={schedule} />
            </div>
          )}

          {/* ── Replies (only shown if there are any) ── */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <RepliesFeed documentType={docTypeSlug} documentId={request.id} />
          </div>

          {/* ── Primary action ── */}
          <div className="px-5 py-4">
            <button
              onClick={() => setShowDetails(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: NAVY, color: "white", border: "none" }}
            >
              <FileText className="h-4 w-4" />
              View Full Details
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}