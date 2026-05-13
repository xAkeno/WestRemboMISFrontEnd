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
const REPRINT_API_BASE = "https://westrembomis.onrender.com/api";

type ReprintStatus = "PENDING" | "APPROVED" | "REJECTED" | "PRINTED" | "CLAIMED";

const reprintStatusStyle: Record<ReprintStatus, { bg: string; text: string; border: string; dot: string; label: string }> = {
  PENDING:  { bg: "#fefce8", text: "#ca8a04", border: "#fde68a", dot: "#ca8a04", label: "Pending Review"  },
  APPROVED: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", dot: "#16a34a", label: "Approved"        },
  REJECTED: { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3", dot: "#e11d48", label: "Rejected"        },
  PRINTED:  { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", dot: "#2563eb", label: "Printed"         },
  CLAIMED:  { bg: "#f0fdf4", text: "#15803d", border: "#86efac", dot: "#15803d", label: "Claimed"         },
};

interface ReprintRequestData {
  id: number;
  document_type: string;
  document_number: string;
  reason: string;
  status: ReprintStatus;
  rejection_reason?: string | null;
  schedule_date?: string | null;
  schedule_time?: string | null;
}

interface ReprintRequestSectionProps {
  documentType: string;
  documentNumber: string;
}

const statusStyle: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  approved:        { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", dot: "#16a34a" },
  pending:         { bg: "#fefce8", text: "#ca8a04", border: "#fde68a", dot: "#ca8a04" },
  processing:      { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", dot: "#2563eb" },
  encoded:         { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", dot: "#2563eb" },
  incomplete:      { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa", dot: "#ea580c" },
  rejected:        { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3", dot: "#e11d48" },
  released:        { bg: "#dcfce7", text: "#15803d", border: "#86efac", dot: "#15803d" },
  scheduled:       { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#1d4ed8" },
  rescheduled:     { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#1d4ed8" },
  to_pay:          { bg: "#fefce8", text: "#ca8a04", border: "#fde68a", dot: "#ca8a04" },
  inspecting:      { bg: "#faf5ff", text: "#7c3aed", border: "#ddd6fe", dot: "#7c3aed" },
  no_show:         { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa", dot: "#ea580c" },
  reprint:         { bg: "#fdf4ff", text: "#7e22ce", border: "#e9d5ff", dot: "#7e22ce" },
  reprint_process: { bg: "#fdf4ff", text: "#6b21a8", border: "#d8b4fe", dot: "#6b21a8" },
  reprint_released:{ bg: "#f0fdf4", text: "#15803d", border: "#86efac", dot: "#15803d" },
};

// ─── Progress Steps ────────────────────────────────────────────────────────────
const BASE_PROCESS_STEPS = [
  { key: "scheduled",  label: "Scheduled"  },
  { key: "review",     label: "Review"     },
  { key: "On-Process", label: "On-Process" },
  { key: "payment",    label: "Payment"    },
  { key: "released",   label: "Released"   },
];

const REPRINT_EXTRA_STEPS = [
  { key: "reprint",          label: "Reprint"    },
  { key: "reprint_process",  label: "Processing" },
  { key: "reprint_released", label: "Released"   },
];

const BASE_STATUS_TO_STEP: Record<string, number> = {
  pending: 0, incomplete: 0, processing: 0, encoded: 0,
  approved: 0, inspecting: 0,
  scheduled:   1,
  rescheduled: 1,
  no_show:     1,
  to_pay:      3,
  released:    5,
  review:      2,
  process:     3,
  paid:        4,
};

const REPRINT_STATUS_TO_EXTRA_STEP: Record<string, number> = {
  reprint:          0,
  reprint_process:  1,
  reprint_released: 2,
};

const REPRINT_STATUSES = new Set(["reprint", "reprint_process", "reprint_released"]);

const STATUS_MESSAGES: Record<string, { message: string; nextStep: string | null }> = {
  encoded:          { message: "Your request has been received and is currently being processed.", nextStep: "Scheduled" },
  pending:          { message: "Your request has been received and is currently being processed.", nextStep: "Scheduled" },
  processing:       { message: "Your request is being reviewed by the barangay office.", nextStep: "Scheduled" },
  incomplete:       { message: "Action required — please upload missing documents to continue.", nextStep: null },
  approved:         { message: "Your request has been approved!", nextStep: "To Pay" },
  scheduled:        { message: "Your pickup date is confirmed. Visit the barangay at your scheduled time.", nextStep: "Visit Barangay" },
  rescheduled:      { message: "Your pickup date has been rescheduled. Visit the barangay at your new scheduled time.", nextStep: "Visit Barangay" },
  no_show:          { message: "You missed your scheduled pickup. Please reschedule to continue.", nextStep: "Reschedule" },
  to_pay:           { message: "Please proceed to the barangay hall to settle the payment.", nextStep: "Released" },
  released:         { message: "Your document has been sent to your registered email address.", nextStep: null },
  rejected:         { message: "Your request was not approved. See details for more information.", nextStep: null },
  inspecting:       { message: "A barangay officer is currently inspecting your submitted documents.", nextStep: null },
  reprint:          { message: "Your reprint request is scheduled. Proceed to the barangay at your assigned time.", nextStep: "Processing" },
  reprint_process:  { message: "Your document is currently being reprinted by the barangay office.", nextStep: "Released" },
  reprint_released: { message: "Your reprinted document has been officially released.", nextStep: null },
};

const WHAT_NEXT: Record<string, string> = {
  encoded:          "Your documents are currently being validated by the Barangay Secretary. Please wait for the notification to settle the fee.",
  pending:          "Your documents are currently being validated by the Barangay Secretary. Please wait for the notification to settle the fee.",
  processing:       "Your request is under review. You will be notified once a pickup date is assigned.",
  incomplete:       "Please upload the missing documents so we can continue processing your request.",
  approved:         "Your request has been approved. Proceed to the barangay hall to settle the payment.",
  scheduled:        "Go to the barangay hall at your scheduled time. Bring the required documents listed above and present your reference number to the officer.",
  rescheduled:      "Go to the barangay hall at your new scheduled time. Bring the required documents listed above and present your reference number to the officer.",
  no_show:          "You did not appear on your scheduled pickup date. Please reschedule your pickup as soon as possible to avoid further delays.",
  to_pay:           "Proceed to the barangay hall cashier and present your reference number to pay the fee.",
  released:         "Your document has been officially released and sent to your registered email.",
  rejected:         "Your request was not approved. Please contact the barangay office for more information.",
  inspecting:       "A barangay officer is currently reviewing and inspecting your submitted documents. You will be notified once the inspection is complete.",
  reprint:          "Go to the barangay hall at your scheduled reprint pickup time. Bring your reference number and a valid ID.",
  reprint_process:  "Your document is currently being processed for reprint. Please wait for further notification.",
  reprint_released: "Your reprinted document has been officially released.",
};

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

const reprintFormatTime = (t: string): string => {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
};

interface ReprintSlot {
  id: number;
  schedule_time: string;
  max_slots: number;
}

// ─── Printer Icon ──────────────────────────────────────────────────────────────
function PrinterIcon({ stroke = "#2563eb" }: { stroke?: string }) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

// ─── Slot Card ─────────────────────────────────────────────────────────────────
function ReprintSlotCard({
  slot, selected, onSelect,
}: {
  slot: ReprintSlot; selected: boolean; onSelect: (time: string) => void;
}) {
  const remaining = slot.max_slots ?? 0;
  const isDisabled = remaining <= 0;
  const isLow = remaining > 0 && remaining <= 3;

  const pill = isDisabled
    ? { bg: "#FCEBEB", color: "#A32D2D", border: "#F7C1C1", label: "Full" }
    : isLow
    ? { bg: "#FAEEDA", color: "#854F0B", border: "#FAC775", label: `${remaining} left` }
    : { bg: "#EAF3DE", color: "#3B6D11", border: "#C0DD97", label: `${remaining} left` };

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => !isDisabled && onSelect(slot.schedule_time)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 5, padding: "12px 8px 10px",
        borderRadius: 10,
        border: selected ? "2px solid #185FA5" : "1.5px solid #e5e7eb",
        backgroundColor: selected ? "#E6F1FB" : isDisabled ? "#f9fafb" : "#ffffff",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.45 : 1,
        position: "relative", transition: "border-color 0.15s, background 0.15s",
        textAlign: "center", width: "100%",
      }}
    >
      {selected && (
        <span style={{
          position: "absolute", top: 6, right: 7, width: 16, height: 16,
          borderRadius: "50%", backgroundColor: "#185FA5",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check style={{ width: 10, height: 10, color: "#E6F1FB" }} />
        </span>
      )}
      <Clock style={{ width: 16, height: 16, color: selected ? "#185FA5" : isDisabled ? "#9ca3af" : "#6b7280" }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: selected ? "#0C447C" : isDisabled ? "#9ca3af" : "#111827", lineHeight: 1.2 }}>
        {reprintFormatTime(slot.schedule_time)}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 99,
        backgroundColor: pill.bg, color: pill.color, border: `0.5px solid ${pill.border}`, marginTop: 1,
      }}>
        {pill.label}
      </span>
    </button>
  );
}

function ReprintSlotDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 10px" }}>
      <div style={{ flex: 1, height: "0.5px", backgroundColor: "#e5e7eb" }} />
      <span style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", padding: "2px 12px", borderRadius: 99, backgroundColor: "#f3f4f6", border: "0.5px solid #e5e7eb", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "0.5px", backgroundColor: "#e5e7eb" }} />
    </div>
  );
}

// ─── Reprint QR Card ───────────────────────────────────────────────────────────
function ReprintQRCard({
  refNumber, docLabel, scheduleDate, scheduleTime,
}: {
  refNumber: string; docLabel: string; scheduleDate: string; scheduleTime: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !refNumber) return;
    QRCodeLib.toCanvas(canvasRef.current, `REPRINT:${refNumber}`, {
      width: 152, margin: 1,
      color: { dark: "#0f2a5e", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).catch(console.error);
  }, [refNumber]);

  const friendlyDate = (() => {
    try {
      return new Date(scheduleDate + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      });
    } catch { return scheduleDate; }
  })();

  const dateObj = new Date(scheduleDate + "T12:00:00");

  return (
    <div className="rounded-2xl overflow-hidden mb-4"
      style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a7a 100%)`, boxShadow: "0 4px 20px rgba(15,42,94,0.2)" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(194,70,125,0.25)" }}>
          <QrCode className="h-4 w-4" style={{ color: "#f9a8d4" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Present this for Reprint Pickup</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>Show this QR code to barangay staff when you arrive.</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 px-5 py-5">
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(194,70,125,0.2)", color: "#f9a8d4", border: "1px solid rgba(194,70,125,0.35)" }}>
          {docLabel} — Reprint
        </span>
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: "#fff", border: `2px dashed ${NAVY}` }}>
          <canvas ref={canvasRef} width={152} height={152} style={{ display: "block", borderRadius: 4 }} />
        </div>
        <p className="font-mono text-lg font-black text-white tracking-widest">{refNumber}</p>
      </div>
      <div className="flex items-center gap-4 mx-4 mb-3 px-4 py-3 rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
        <div className="flex flex-col items-center justify-center rounded-xl flex-shrink-0"
          style={{ backgroundColor: PINK, padding: "8px 10px", minWidth: 44, textAlign: "center" }}>
          <span className="text-[9px] font-bold text-white" style={{ opacity: 0.8 }}>
            {dateObj.toLocaleDateString(undefined, { month: "short" }).toUpperCase()}
          </span>
          <span className="text-xl font-black text-white leading-none">{dateObj.getDate()}</span>
        </div>
        <div>
          <p className="text-xs font-bold text-white">{friendlyDate}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3 w-3" style={{ color: "#f9a8d4" }} />
            <p className="text-xs font-semibold" style={{ color: "#f9a8d4" }}>{reprintFormatTime(scheduleTime)}</p>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3 mx-4 mb-4 px-4 py-3 rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
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

// ─── Reprint Request Section ───────────────────────────────────────────────────
function ReprintRequestSection({ documentType, documentNumber }: ReprintRequestSectionProps) {
  type Step = "idle" | "step1" | "step2" | "done";

  const [step, setStep]                       = useState<Step>("idle");
  const [existingRequest, setExistingRequest] = useState<ReprintRequestData | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const [reason, setReason]           = useState("");
  const [reasonError, setReasonError] = useState("");

  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const minDate = new Date(today); minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const [schedDate, setSchedDate]           = useState("");
  const [dateError, setDateError]           = useState("");
  const [availableSlots, setAvailableSlots] = useState<ReprintSlot[] | null>(null);
  const [loadingSlots, setLoadingSlots]     = useState(false);
  const [selectedTime, setSelectedTime]     = useState("");
  const [timeError, setTimeError]           = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState("");

  // ── Fetch existing reprint + schedule ──────────────────────────────────────
  const [lastFetched, setLastFetched] = useState<number>(Date.now());

  const refreshStatus = () => setLastFetched(Date.now());

  useEffect(() => {
      if (step === "step1" || step === "step2") return;

      const fetchExisting = async () => {
      setLoadingExisting(true);
      try {
        const res  = await fetch(`${REPRINT_API_BASE}/reprint-requests`, {
          credentials: "include", headers: { Accept: "application/json" },
        });
        const json = await res.json();
        const all: ReprintRequestData[] = json?.data ?? [];
        const matched = all.find(
          (r) => r.document_number === documentNumber && r.document_type === documentType
        );

        if (matched) {
          // Always fetch the real schedule to get schedule_date/schedule_time
          try {
            const schedRes  = await fetch(
              `${REPRINT_API_BASE}/schedules/${documentNumber}`,
              { credentials: "include", headers: { Accept: "application/json" } }
            );
            if (schedRes.ok) {
              const schedJson = await schedRes.json();
              const sched     = schedJson?.data ?? null;
              setExistingRequest({
                ...matched,
                schedule_date: sched?.schedule_date ?? matched.schedule_date ?? null,
                schedule_time: sched?.schedule_time ?? matched.schedule_time ?? null,
              });
            } else {
              setExistingRequest(matched);
            }
          } catch {
            setExistingRequest(matched);
          }
        } else {
          setExistingRequest(null);
        }
      } catch {
        setExistingRequest(null);
      } finally {
        setLoadingExisting(false);
      }
    };
    fetchExisting();
  }, [documentType, documentNumber, step, lastFetched]);

  // ── Fetch slots ────────────────────────────────────────────────────────────
  const fetchSlots = async (date: string) => {
    setLoadingSlots(true);
    setAvailableSlots(null);
    setSelectedTime("");
    try {
      const res  = await fetch(
        `${REPRINT_API_BASE}/schedules/available-slots?document_type=${documentType}&date=${date}`,
        { credentials: "include", headers: { Accept: "application/json" } }
      );
      const json = await res.json();
      const raw: any[] = json?.data ?? [];
      const mapped: ReprintSlot[] = raw.map((s, i) => ({
        id:            i,
        schedule_time: s.time,
        max_slots:     s.remaining_slots ?? s.max_slots ?? 0,
      }));
      setAvailableSlots(mapped);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (value: string) => {
    const err = validateScheduleDate(value);
    setDateError(err);
    setSchedDate(err ? "" : value);
    setSelectedTime("");
    setTimeError("");
    setAvailableSlots(null);
    if (!err && value) fetchSlots(value);
  };

  const handleStep1Next = () => {
    if (!reason.trim()) { setReasonError("Please provide a reason for your reprint request."); return; }
    if (reason.trim().length < 10) { setReasonError("Reason must be at least 10 characters."); return; }
    setReasonError("");
    setStep("step2");
  };

  // ── Final submit ───────────────────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    if (!schedDate) { setDateError("Schedule date is required."); return; }
    if (!selectedTime) { setTimeError("Please select a time slot."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      // Step 1: Submit the reprint request
      const reprintRes  = await fetch(`${REPRINT_API_BASE}/reprint-requests`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          document_type:   documentType,
          document_number: documentNumber,
          reason:          reason.trim(),
          schedule_date:   schedDate,
          schedule_time:   selectedTime,
        }),
      });
      const reprintJson = await reprintRes.json();
      if (!reprintRes.ok) {
        setSubmitError(reprintJson?.message ?? "Failed to submit reprint request.");
        return;
      }

      // Step 2: Check if schedule exists, then update-only or create-reprint
      const checkRes = await fetch(
        `${REPRINT_API_BASE}/schedules/${documentNumber}`,
        { credentials: "include", headers: { Accept: "application/json" } }
      );

      if (checkRes.ok) {
        // Update schedule date/time only — no status change
        await fetch(`${REPRINT_API_BASE}/schedules/${documentNumber}/update-only`, {
          method: "PUT", credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ schedule_date: schedDate, schedule_time: selectedTime }),
        }).catch(() => {});
      } else {
        // Create new schedule without changing document status
        await fetch(`${REPRINT_API_BASE}/schedules/reprint`, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            document_type:   documentType,
            document_number: documentNumber,
            schedule_date:   schedDate,
            schedule_time:   selectedTime,
          }),
        }).catch(() => {});
      }

      // Step 3: Set document status to REPRINT
      await fetch(`${REPRINT_API_BASE}/schedules/${documentNumber}/set-status`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status: "REPRINT" }),
      }).catch(() => {});

      // Step 4: Optimistic state
      const optimistic: ReprintRequestData = {
        id:              reprintJson.data?.id ?? 0,
        document_type:   documentType,
        document_number: documentNumber,
        reason:          reason.trim(),
        status:          "PENDING",
        schedule_date:   schedDate,
        schedule_time:   selectedTime,
      };
      setExistingRequest(optimistic);
      setStep("done");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const morningSlots   = (availableSlots ?? []).filter((s) => parseInt(s.schedule_time.split(":")[0], 10) < 12);
  const afternoonSlots = (availableSlots ?? []).filter((s) => parseInt(s.schedule_time.split(":")[0], 10) >= 12);
  const selectedSlot   = (availableSlots ?? []).find((s) => s.schedule_time === selectedTime);

  const ReprintBadge = ({ status }: { status: ReprintStatus }) => {
    const s = reprintStatusStyle[status] ?? reprintStatusStyle.PENDING;
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
        style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
        {s.label}
      </span>
    );
  };

  const CardShell = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) => (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)", borderBottom: "1px solid #e5e7eb" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#dbeafe" }}>
          <PrinterIcon />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "#111827" }}>{title}</p>
          <p className="text-[11px]" style={{ color: "#9ca3af" }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );

  if (loadingExisting) {
    return (
      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: NAVY }} />
          <span className="text-xs text-gray-400">Checking reprint status…</span>
        </div>
      </div>
    );
  }

  // ── Existing request display ───────────────────────────────────────────────
  if (existingRequest && step !== "step1" && step !== "step2") {
    const hasSchedule = !!(existingRequest.schedule_date && existingRequest.schedule_time);
    const docLabel    = DOC_TYPE_LABELS[documentType] ?? documentType.replace(/_/g, " ");
    const showQR      = hasSchedule && ["PENDING", "APPROVED", "PRINTED"].includes(existingRequest.status);

    if (existingRequest.status === "PRINTED") {
      return (
        <div className="rounded-2xl overflow-hidden mb-4"
          style={{ background: "linear-gradient(135deg, #0f2a5e 0%, #1a3a7a 100%)", boxShadow: "0 4px 20px rgba(15,42,94,0.2)" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(34,197,94,0.2)" }}>
              <PrinterIcon stroke="#86efac" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Document Successfully Printed!</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                Ref: {existingRequest.document_number}
              </p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex-shrink-0"
              style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#86efac", border: "1px solid rgba(134,239,172,0.3)" }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#86efac" }} />
              Printed
            </span>
          </div>

          {/* Body */}
          <div className="px-5 py-5 flex flex-col gap-4">
            {/* Big checkmark */}
            {/* <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(34,197,94,0.15)", border: "2px solid rgba(134,239,172,0.4)" }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#86efac" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-black text-white text-center leading-snug">
                Your document is ready<br />for pickup!
              </p>
              <p className="text-xs text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.65)", maxWidth: 280 }}>
                Your reprinted barangay document has been successfully printed and is now waiting for you at the barangay office.
              </p>
            </div> */}

            {/* Schedule */}
            {existingRequest.schedule_date && existingRequest.schedule_time && existingRequest.status !== "PRINTED" && (
              <div className="flex items-center gap-4 px-4 py-4 rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="flex flex-col items-center justify-center rounded-xl flex-shrink-0"
                  style={{ backgroundColor: PINK, padding: "8px 12px", minWidth: 52, textAlign: "center" }}>
                  <span className="text-[9px] font-bold text-white" style={{ opacity: 0.8 }}>
                    {new Date(existingRequest.schedule_date + "T12:00:00").toLocaleDateString(undefined, { month: "short" }).toUpperCase()}
                  </span>
                  <span className="text-2xl font-black text-white leading-none">
                    {new Date(existingRequest.schedule_date + "T12:00:00").getDate()}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Pickup Schedule</p>
                  <p className="text-sm font-bold text-white">
                    {new Date(existingRequest.schedule_date + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "#f9a8d4" }}>
                    {reprintFormatTime(existingRequest.schedule_time)}
                  </p>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="flex flex-col gap-2">
              {[
                { icon: "🔒", tip: "Keep your document in a safe place once claimed. Reprints are limited." },
                { icon: "📂", tip: "Store it in a folder or sleeve to prevent damage." },
                { icon: "🚫", tip: "Do not share sensitive document details publicly or online." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>{item.tip}</p>
                </div>
              ))}
            </div>

            {/* Ref number */}
            {existingRequest.status !== "PRINTED" && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Reference Number</p>
                  <p className="font-mono text-base font-black text-white tracking-widest">{existingRequest.document_number}</p>
                </div>
                <BadgeCheck className="h-5 w-5 flex-shrink-0" style={{ color: "#86efac" }} />
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <CardShell title="Reprint Request" subtitle={`Ref: ${existingRequest.document_number}`}>
          <div className="px-5 py-5 flex flex-col gap-4">
            
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Request Status</p>
              <ReprintBadge status={existingRequest.status} />
            </div>
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Reason Provided</p>
              <p className="text-sm" style={{ color: NAVY }}>{existingRequest.reason}</p>
            </div>
            {hasSchedule && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: "#2563eb" }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#2563eb" }}>Pickup Schedule</p>
                  <p className="text-sm font-bold" style={{ color: NAVY }}>
                    {new Date(existingRequest.schedule_date! + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs font-semibold" style={{ color: "#2563eb" }}>{reprintFormatTime(existingRequest.schedule_time!)}</p>
                </div>
              </div>
            )}
            {existingRequest.status === "REJECTED" && existingRequest.rejection_reason && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
                <FileX className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#e11d48" }}>Rejection Reason</p>
                  <p className="text-sm" style={{ color: "#9f1239" }}>{existingRequest.rejection_reason}</p>
                </div>
              </div>
            )}
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Status Update</p>
              <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
                {existingRequest.status === "PENDING"  && "Your reprint request is being reviewed by the barangay office. You will be notified once a decision is made."}
                {existingRequest.status === "APPROVED" && "Your reprint request has been approved. Proceed to the barangay on your scheduled date to claim your document."}
                {existingRequest.status === "REJECTED" && "Your reprint request was not approved. Please visit the barangay office for further assistance."}
                {existingRequest.status === "PRINTED"  && "Your document has been printed and is ready for pickup at the barangay office on your scheduled date."}
                {existingRequest.status === "CLAIMED"  && "Your reprinted document has been successfully claimed. Thank you!"}
              </p>
            </div>
          </div>
        </CardShell>
        {showQR && (
          <ReprintQRCard
            refNumber={existingRequest.document_number}
            docLabel={docLabel}
            scheduleDate={existingRequest.schedule_date!}
            scheduleTime={existingRequest.schedule_time!}
          />
        )}
      </>
    );
  }

  // ── Idle ───────────────────────────────────────────────────────────────────
  if (step === "idle") {
    return (
      <CardShell title="Request a Reprint" subtitle="Lost or damaged your document?">
        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
            <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
              If you have lost or damaged your original document, you can request a reprint. You will provide a reason and choose a pickup date and time slot. The barangay office will review and prepare your document.
            </p>
          </div>
          <div className="flex items-center gap-1">
            {["Reason", "Schedule", "QR Code"].map((label, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: "#f0f4ff", color: NAVY }}>
                    {i + 1}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-center" style={{ color: "#9ca3af" }}>{label}</span>
                </div>
                {i < 2 && <div className="h-px flex-1 mb-4" style={{ backgroundColor: "#e5e7eb" }} />}
              </div>
            ))}
          </div>
          <button onClick={() => setStep("step1")}
            className="w-full py-3 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ backgroundColor: NAVY }}>
            <PrinterIcon stroke="white" />
            Request a Reprint
          </button>
        </div>
      </CardShell>
    );
  }

  // ── Step 1: Reason ─────────────────────────────────────────────────────────
  if (step === "step1") {
    return (
      <CardShell title="Step 1 of 2 — Reason" subtitle="Why do you need a reprint?">
        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="flex gap-1">
            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: NAVY }} />
            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#e5e7eb" }} />
          </div>
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#fefce8", border: "1px solid #fde68a" }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#ca8a04" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#854d0e" }}>
              Only submit a reprint if you have lost or damaged your original document. Reprint requests are subject to approval and may require a fee.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>
              Reason for Reprint <span style={{ color: "#ef4444" }}>*</span>
            </p>
            <textarea rows={3}
              placeholder="e.g. Lost original copy, document was damaged..."
              value={reason}
              onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
              style={{
                border: `2px solid ${reasonError ? "#e11d48" : reason.trim() ? NAVY : "#e5e7eb"}`,
                color: NAVY,
                backgroundColor: reasonError ? "#fff1f2" : reason.trim() ? "#f0f4ff" : "#fff",
                fontFamily: "inherit",
              }}
            />
            {reasonError && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#e11d48" }} />
                <p className="text-[11px] font-semibold" style={{ color: "#be123c" }}>{reasonError}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setStep("idle"); setReason(""); setReasonError(""); }}
              className="flex-1 py-3 text-sm font-bold rounded-xl"
              style={{ border: "1px solid #e5e7eb", color: "#6b7280", background: "#fff" }}>
              Cancel
            </button>
            <button onClick={handleStep1Next}
              className="flex-1 py-3 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: NAVY }}>
              Next: Schedule
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardShell>
    );
  }

  // ── Step 2: Schedule ───────────────────────────────────────────────────────
  if (step === "step2") {
    return (
      <CardShell title="Step 2 of 2 — Schedule" subtitle="Choose your reprint pickup date and time">
        <div className="px-5 py-5 flex flex-col gap-5">
          <div className="flex gap-1">
            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#16a34a" }} />
            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: NAVY }} />
          </div>
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d2fe" }}>
            <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#6366f1" }} />
            <p className="text-[11px] leading-relaxed" style={{ color: "#4338ca" }}>
              <span className="font-bold">Reason:</span> {reason}
            </p>
          </div>
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0284c7" }} />
            <div>
              <p className="text-xs font-bold" style={{ color: "#0369a1" }}>Appointments are available Monday – Friday only.</p>
              <p className="text-xs mt-0.5" style={{ color: "#0369a1" }}>Weekends and public holidays are not available.</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>
              Select Pickup Date <span style={{ color: "#ef4444" }}>*</span>
            </p>
            <input type="date" min={minDateStr} max="2026-12-31" value={schedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all"
              style={{
                border: `2px solid ${dateError ? "#e11d48" : schedDate && !dateError ? NAVY : "#e5e7eb"}`,
                color: NAVY,
                backgroundColor: dateError ? "#fff1f2" : schedDate && !dateError ? "#f0f4ff" : "#fff",
              }}
            />
            {dateError && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#e11d48" }} />
                <p className="text-[11px] font-semibold" style={{ color: "#be123c" }}>{dateError}</p>
              </div>
            )}
          </div>

          {schedDate && !dateError && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#9ca3af" }}>
                Select Time Slot <span style={{ color: "#ef4444" }}>*</span>
              </p>
              {loadingSlots ? (
                <div className="flex items-center gap-2 py-4" style={{ color: "#6b7280" }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: NAVY }} />
                  <span className="text-sm">Loading available slots…</span>
                </div>
              ) : availableSlots && availableSlots.length > 0 ? (
                <div>
                  {morningSlots.length > 0 && (
                    <div className="mb-4">
                      <ReprintSlotDivider label="Morning" />
                      <div className="grid grid-cols-3 gap-2">
                        {morningSlots.map((slot) => (
                          <ReprintSlotCard key={slot.id} slot={slot}
                            selected={selectedTime === slot.schedule_time}
                            onSelect={(t) => { setSelectedTime(t); setTimeError(""); }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {afternoonSlots.length > 0 && (
                    <div>
                      <ReprintSlotDivider label="Afternoon" />
                      <div className="grid grid-cols-3 gap-2">
                        {afternoonSlots.map((slot) => (
                          <ReprintSlotCard key={slot.id} slot={slot}
                            selected={selectedTime === slot.schedule_time}
                            onSelect={(t) => { setSelectedTime(t); setTimeError(""); }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: "#E6F1FB", border: "1.5px solid #B5D4F4" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: "#185FA5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Clock style={{ width: 16, height: 16, color: "#E6F1FB" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#0C447C" }}>{reprintFormatTime(selectedTime)} — confirmed</p>
                        <p className="text-xs" style={{ color: "#185FA5" }}>
                          {selectedSlot?.max_slots ?? 0} slot{(selectedSlot?.max_slots ?? 0) !== 1 ? "s" : ""} remaining on this date
                        </p>
                      </div>
                    </div>
                  )}
                  {timeError && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#e11d48" }} />
                      <p className="text-[11px] font-semibold" style={{ color: "#be123c" }}>{timeError}</p>
                    </div>
                  )}
                </div>
              ) : availableSlots && availableSlots.length === 0 ? (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                  No available slots for this date. Please select a different date.
                </div>
              ) : null}
            </div>
          )}

          {submitError && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl" style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
              <p className="text-xs" style={{ color: "#be123c" }}>{submitError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setStep("step1"); setSchedDate(""); setDateError(""); setSelectedTime(""); setTimeError(""); setAvailableSlots(null); setSubmitError(""); }}
              className="flex-1 py-3 text-sm font-bold rounded-xl"
              style={{ border: "1px solid #e5e7eb", color: "#6b7280", background: "#fff" }}>
              ← Back
            </button>
            <button onClick={handleFinalSubmit}
              disabled={submitting || !schedDate || !selectedTime}
              className="flex-1 py-3 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-2"
              style={{
                backgroundColor: (!submitting && schedDate && selectedTime) ? NAVY : "#d1d5db",
                cursor: (!submitting && schedDate && selectedTime) ? "pointer" : "not-allowed",
              }}>
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                : <><PrinterIcon stroke="white" /> Submit &amp; Get QR</>
              }
            </button>
          </div>
        </div>
      </CardShell>
    );
  }

  return null;
}

// ─── Office Hours Modal ────────────────────────────────────────────────────────
function OfficeHoursModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,60,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white overflow-hidden"
        style={{ borderRadius: 4, boxShadow: "0 8px 60px rgba(10,20,60,0.25)", border: "1px solid #dde3ed" }}>
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
                <li>1. <span className="font-semibold">Scheduled</span> – Proceed on your assigned date and time</li>
                <li>2. <span className="font-semibold">Review</span> – Barangay staff will check the application</li>
                <li>3. <span className="font-semibold">Processing</span> – Proceed to secretary office for signature</li>
                <li>4. <span className="font-semibold">Payment</span> – Settle the required fee at the cashier</li>
                <li>5. <span className="font-semibold">Release</span> – Your clearance has been claimed</li>
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
    status === "to_pay"          ? "To Pay" :
    status === "rescheduled"     ? "Rescheduled" :
    status === "no_show"         ? "No Show" :
    status === "reprint"         ? "Reprint" :
    status === "reprint_process" ? "Reprint Processing" :
    status === "reprint_released"? "Reprint Released" :
    status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
      style={{ backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: badge.dot }} />
      {label}
    </span>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ status, onLearnMore }: { status: string; onLearnMore: () => void }) {
  const isBlocked     = BLOCKED_STATUSES.has(status);
  const isReprintFlow = REPRINT_STATUSES.has(status);

  const steps = isReprintFlow
    ? [...BASE_PROCESS_STEPS, ...REPRINT_EXTRA_STEPS]
    : BASE_PROCESS_STEPS;

  const currentStep = (() => {
    if (isBlocked) return -1;
    if (isReprintFlow) {
      const reprintIdx = REPRINT_STATUS_TO_EXTRA_STEP[status] ?? 0;
      return BASE_PROCESS_STEPS.length + reprintIdx;
    }
    return BASE_STATUS_TO_STEP[status] ?? 0;
  })();

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="flex gap-1 mb-2">
            {steps.map((step, i) => {
              const done    = !isBlocked && i <= currentStep;
              const current = !isBlocked && i === currentStep;
              const isReprintStep = i >= BASE_PROCESS_STEPS.length;
              // Show a subtle divider dot between base and reprint sections
              const isJunction = i === BASE_PROCESS_STEPS.length && isReprintFlow;
              return (
                <div key={i} className="flex items-center gap-0.5 flex-1">
                  {isJunction && (
                    <div className="w-1 h-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: done ? "#a855f7" : "#e5e7eb", marginRight: 1 }} />
                  )}
                  <div
                    className="flex-1 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: done
                        ? current
                          ? isReprintStep ? "#7e22ce" : NAVY
                          : isReprintStep ? "#a855f7" : "#16a34a"
                        : "#e5e7eb",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex">
            {steps.map((step, i) => {
              const done    = !isBlocked && i <= currentStep;
              const current = !isBlocked && i === currentStep;
              const isReprintStep = i >= BASE_PROCESS_STEPS.length;
              return (
                <div key={i} className="flex-1">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      color: done
                        ? current
                          ? isReprintStep ? "#7e22ce" : NAVY
                          : isReprintStep ? "#a855f7" : "#16a34a"
                        : "#9ca3af",
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <button type="button" onClick={onLearnMore}
          className="text-xs font-semibold text-white px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ backgroundColor: NAVY }}>
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
    <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-lg transition-colors"
      style={{ backgroundColor: "#f3f4f6", color: copied ? "#16a34a" : "#9ca3af" }} title="Copy">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
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
      const [h, m] = timeStr.split(":").map(Number);
      const period = h >= 12 ? "PM" : "AM";
      const hour   = h % 12 || 12;
      return `${hour}:${String(m).padStart(2, "0")} ${period}`;
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
    <div className="rounded-2xl overflow-hidden mb-4"
      style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a7a 100%)`, boxShadow: "0 4px 20px rgba(15,42,94,0.2)" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(194,70,125,0.25)" }}>
          <QrCode className="h-4 w-4" style={{ color: "#f9a8d4" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Present this at the counter</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>Present this QR code at the counter to be scanned by barangay staff.</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 px-5 py-5">
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(194,70,125,0.2)", color: "#f9a8d4", border: "1px solid rgba(194,70,125,0.35)" }}>
          {docLabel}
        </span>
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: "#fff", border: `2px dashed ${NAVY}` }}>
          <canvas ref={canvasRef} width={152} height={152} style={{ display: "block", borderRadius: 4 }} />
        </div>
        <p className="font-mono text-lg font-black text-white tracking-widest">{refNumber}</p>
      </div>
      <div className="flex items-start gap-3 mx-4 mb-4 px-4 py-3 rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
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

// ─── Details Modal ─────────────────────────────────────────────────────────────
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
          { label: "Punong Barangay", value: r.punong_barangay ?? r.for_the_punong_barangay },
          { label: "Remarks",         value: r.remarks, full: true },
          { label: "Released At",     value: fmtDate(r.released_at) },
        ]},
      ];
    }
    if (docType === "barangay_certificate") {
      return [
        { title: "Personal Information", icon: User, fields: [
          { label: "Full Name",        value: fullName || r.requester_name, full: true },
          { label: "Date of Birth",    value: fmtDate(r.dob ?? r.date_of_birth) },
          { label: "Contact No.",      value: r.contact_no },
          { label: "Email",            value: r.email, full: true },
          { label: "Registered Voter", value: r.registered_voter },
        ]},
        { title: "Certificate Details", icon: ClipboardList, fields: [
          { label: "Certificate No.", value: r.bcert_number },
          { label: "Purpose",         value: r.purpose },
          { label: "OR No.",          value: r.or_no },
          { label: "Issued Date",     value: fmtDate(r.issued_date) },
          { label: "Remarks",         value: r.remarks, full: true },
        ]},
      ];
    }
    if (docType === "business_clearance") {
      return [
        { title: "Applicant Information", icon: User, fields: [
          { label: "Full Name", value: fullName || r.requester_name, full: true },
          { label: "Email",     value: r.email, full: true },
        ]},
        { title: "Business Details", icon: ClipboardList, fields: [
          { label: "Business No.",   value: r.brgy_business_no },
          { label: "Business Name",  value: r.business_name },
          { label: "Business Type",  value: r.business_type },
          { label: "OR No.",         value: r.or_no },
          { label: "Issued Date",    value: fmtDate(r.issued_date) },
          { label: "Remarks",        value: r.remarks, full: true },
        ]},
      ];
    }
    return [];
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: "white", borderRadius: "16px 16px 0 0" }}>
        <div className="flex-shrink-0" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a7a 100%)` }}>
          <div className="flex items-start justify-between px-5 pt-5 pb-4">
            <div className="flex-1 min-w-0 pr-3">
              <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2"
                style={{ backgroundColor: "rgba(194,70,125,0.3)", color: "#f9a8d4", border: "1px solid rgba(194,70,125,0.4)" }}>
                {docLabel}
              </span>
              <p className="text-xl font-black text-white leading-tight truncate">{refNumber}</p>
              {hasValue(r.created_at) && (
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Submitted {format(new Date(r.created_at), "MMMM d, yyyy · hh:mm aa")}
                </p>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <X className="h-4 w-4 text-white" />
            </button>
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
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const minDate = new Date(today); minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const [selectedDate, setSelectedDate]     = useState("");
  const [dateError, setDateError]           = useState("");
  const [availableSlots, setAvailableSlots] = useState<ReprintSlot[] | null>(null);
  const [loadingSlots, setLoadingSlots]     = useState(false);
  const [selectedTime, setSelectedTime]     = useState("");
  const [timeError, setTimeError]           = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState("");

  const fetchSlots = async (date: string) => {
    setLoadingSlots(true);
    setAvailableSlots(null);
    try {
      const res  = await fetch(
        `${import.meta.env.VITE_WEB_URL}/api/schedules/available-slots?document_type=${documentType}&date=${date}`,
        { credentials: "include", headers: { Accept: "application/json" } }
      );
      const json = await res.json();
      const raw: any[] = json?.data ?? [];
      const mapped: ReprintSlot[] = raw.map((s, i) => ({
        id: i, schedule_time: s.time,
        max_slots: s.remaining_slots ?? s.max_slots ?? 0,
      }));
      setAvailableSlots(mapped);
    } catch { setAvailableSlots([]); }
    finally  { setLoadingSlots(false); }
  };

  const handleDateChange = (value: string) => {
    const err = validateScheduleDate(value);
    setDateError(err);
    setSelectedDate(err ? "" : value);
    setSelectedTime(""); setTimeError(""); setAvailableSlots(null);
    if (!err && value) fetchSlots(value);
  };

  const handleSubmit = async () => {
    const validationError = validateScheduleDate(selectedDate);
    if (validationError) { setDateError(validationError); return; }
    if (!selectedTime) { setTimeError("Please select a time slot."); return; }
    setSubmitting(true); setError("");
    try {
      const res  = await fetch(
        `${import.meta.env.VITE_WEB_URL}/api/schedules/${documentNumber}/reschedule`,
        {
          method: "PUT", credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ schedule_date: selectedDate, schedule_time: selectedTime }),
        }
      );
      const json = await res.json();
      if (!res.ok) { setError(json.message ?? "Failed to reschedule. Please try again."); return; }
      onSuccess();
    } catch { setError("Network error. Please try again."); }
    finally  { setSubmitting(false); }
  };

  const morningSlots   = (availableSlots ?? []).filter(s => parseInt(s.schedule_time.split(":")[0], 10) < 12);
  const afternoonSlots = (availableSlots ?? []).filter(s => parseInt(s.schedule_time.split(":")[0], 10) >= 12);
  const selectedSlot   = (availableSlots ?? []).find(s => s.schedule_time === selectedTime);
  const canSubmit      = selectedDate && !dateError && selectedTime && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-md flex flex-col overflow-hidden"
        style={{ backgroundColor: "white", borderRadius: "20px 20px 0 0", maxHeight: "90vh" }}>
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a7a 100%)` }}>
          <div className="flex items-start justify-between px-5 pt-5 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(194,70,125,0.25)" }}>
                  <RefreshCw className="h-4 w-4" style={{ color: "#f9a8d4" }} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(194,70,125,0.2)", color: "#f9a8d4", border: "1px solid rgba(194,70,125,0.3)" }}>
                  No Show – Reschedule
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-2">Reschedule Pickup</h2>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>Choose a new date and time slot for your document pickup.</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#ea580c" }} />
            <div>
              <p className="text-xs font-bold" style={{ color: "#9a3412" }}>No Show Recorded</p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#c2410c" }}>Please select a new date and time slot.</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>
              Select New Date <span style={{ color: "#ef4444" }}>*</span>
            </p>
            <input type="date" min={minDateStr} value={selectedDate}
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
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#9ca3af" }}>
                Select Time Slot <span style={{ color: "#ef4444" }}>*</span>
              </p>
              {loadingSlots ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: NAVY }} />
                  <span className="text-sm text-gray-500">Loading slots…</span>
                </div>
              ) : availableSlots && availableSlots.length > 0 ? (
                <div>
                  {morningSlots.length > 0 && (
                    <div className="mb-4">
                      <ReprintSlotDivider label="Morning" />
                      <div className="grid grid-cols-3 gap-2">
                        {morningSlots.map(slot => (
                          <ReprintSlotCard key={slot.id} slot={slot}
                            selected={selectedTime === slot.schedule_time}
                            onSelect={(t) => { setSelectedTime(t); setTimeError(""); }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {afternoonSlots.length > 0 && (
                    <div>
                      <ReprintSlotDivider label="Afternoon" />
                      <div className="grid grid-cols-3 gap-2">
                        {afternoonSlots.map(slot => (
                          <ReprintSlotCard key={slot.id} slot={slot}
                            selected={selectedTime === slot.schedule_time}
                            onSelect={(t) => { setSelectedTime(t); setTimeError(""); }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: "#E6F1FB", border: "1.5px solid #B5D4F4" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: "#185FA5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Clock style={{ width: 16, height: 16, color: "#E6F1FB" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#0C447C" }}>{reprintFormatTime(selectedTime)} — confirmed</p>
                        <p className="text-xs" style={{ color: "#185FA5" }}>{selectedSlot?.max_slots ?? 0} slots remaining</p>
                      </div>
                    </div>
                  )}
                  {timeError && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#e11d48" }} />
                      <p className="text-[11px] font-semibold" style={{ color: "#be123c" }}>{timeError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                  No available slots for this date. Please select a different date.
                </div>
              )}
            </div>
          )}
          {selectedDate && !dateError && selectedTime && (
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d2fe" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6366f1" }}>New Schedule Summary</p>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: NAVY }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: NAVY }}>
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs" style={{ color: "#6366f1" }}>{reprintFormatTime(selectedTime)}</p>
                </div>
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
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold rounded-xl"
            style={{ border: "1px solid #e5e7eb", color: "#6b7280", background: "#fff" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex-1 py-3 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: canSubmit ? NAVY : "#d1d5db", cursor: canSubmit ? "pointer" : "not-allowed" }}>
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

// ─── No Show Card ──────────────────────────────────────────────────────────────
function NoShowCard({ schedule, onReschedule, onViewDetails }: {
  schedule: ScheduleData; onReschedule: () => void; onViewDetails: () => void;
}) {
  const dateObj       = new Date(schedule.schedule_date + "T12:00:00");
  const fullDateLabel = dateObj.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  return (
    <div className="rounded-2xl overflow-hidden mb-4"
      style={{ background: "#fff", border: "1px solid #fed7aa", boxShadow: "0 1px 8px rgba(234,88,12,0.10)" }}>
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", borderBottom: "1px solid #fed7aa" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#ffedd5" }}>
          <AlertTriangle className="h-5 w-5" style={{ color: "#ea580c" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: "#9a3412" }}>No Show Recorded</p>
          <p className="text-[11px]" style={{ color: "#c2410c" }}>You did not appear on your scheduled pickup date</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: "#ffedd5", color: "#ea580c", border: "1px solid #fed7aa" }}>No Show</span>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
          <p className="text-xs font-semibold leading-relaxed" style={{ color: "#9a3412" }}>
            You missed your scheduled pickup on <strong>{fullDateLabel}</strong>. Please reschedule to continue.
          </p>
        </div>
        <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>What you need to do</p>
          <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>Reschedule your pickup as soon as possible. Repeated no-shows may affect your future requests.</p>
        </div>
        <button onClick={onReschedule}
          className="w-full py-3 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ backgroundColor: NAVY }}>
          <RefreshCw className="h-4 w-4" /> Reschedule Pickup
        </button>
        <button onClick={onViewDetails} className="text-xs font-semibold text-center transition-colors"
          style={{ color: "#9ca3af" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = NAVY)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}>
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Reprint Scheduled Card ────────────────────────────────────────────────────
function ReprintScheduledCard({ schedule, refNumber, onViewDetails }: {
  schedule: ScheduleData | null; refNumber: string; onViewDetails: () => void;
}) {
  const dateObj    = schedule ? new Date(schedule.schedule_date + "T12:00:00") : null;
  const monthLabel = dateObj?.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const dayLabel   = dateObj?.getDate();
  const yearLabel  = dateObj?.getFullYear();
  const fullDate   = dateObj?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const timeLabel = (() => {
    if (!schedule?.schedule_time) return null;
    try {
      const [h, m] = schedule.schedule_time.split(":").map(Number);
      const period = h >= 12 ? "PM" : "AM";
      const hour   = h % 12 || 12;
      return `${hour}:${String(m).padStart(2, "0")} ${period}`;
    } catch { return schedule.schedule_time; }
  })();

  return (
    <div className="rounded-2xl overflow-hidden mb-4"
      style={{ background: "#fff", border: "1px solid #e9d5ff", boxShadow: "0 1px 8px rgba(126,34,206,0.08)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ background: "linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%)", borderBottom: "1px solid #e9d5ff" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f3e8ff" }}>
          <Home className="h-4 w-4" style={{ color: "#7e22ce" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "#111827" }}>
            Proceed on your assigned date and time at the barangay office for reprint
          </p>
          <p className="text-[11px]" style={{ color: "#9ca3af" }}>Your reprint pickup schedule is confirmed</p>
        </div>
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full flex-shrink-0"
          style={{ background: "#f3e8ff", color: "#7e22ce", border: "1px solid #e9d5ff" }}>
          Reprint
        </span>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">
        {/* Reprint notice */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#fdf4ff", border: "1px solid #e9d5ff" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#f3e8ff" }}>
            <RefreshCw className="h-3.5 w-3.5" style={{ color: "#7e22ce" }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#581c87" }}>Reprint Request Scheduled</p>
            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#6b21a8" }}>
              Please bring your reference number and a valid ID when you visit the barangay office.
            </p>
          </div>
        </div>

        {/* Schedule block */}
        {dateObj && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Reprint pickup schedule</p>
            <div className="flex items-center gap-4 rounded-xl px-4 py-4" style={{ background: "#f3e8ff" }}>
              <div className="flex flex-col items-center justify-center rounded-xl flex-shrink-0"
                style={{ backgroundColor: "#7e22ce", padding: "10px 12px", minWidth: 52, textAlign: "center" }}>
                <span className="text-[10px] font-bold text-white" style={{ opacity: 0.75 }}>{monthLabel}</span>
                <span className="text-2xl font-black text-white leading-none">{dayLabel}</span>
                <span className="text-[10px] text-white" style={{ opacity: 0.65 }}>{yearLabel}</span>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#581c87" }}>{fullDate}</p>
                {timeLabel && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="h-3 w-3" style={{ color: "#7e22ce" }} />
                    <p className="text-xs font-semibold" style={{ color: "#7e22ce" }}>{timeLabel}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reference number */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Reference number</p>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
            <span className="font-mono text-lg font-bold" style={{ color: "#111827", letterSpacing: "0.04em" }}>{refNumber}</span>
          </div>
        </div>

        <button onClick={onViewDetails}
          className="w-full py-2.5 text-xs font-bold rounded-xl transition-colors"
          style={{ border: "1px solid #e9d5ff", background: "#fdf4ff", color: "#7e22ce" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f3e8ff"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fdf4ff"; }}>
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Scheduled Visit Card ──────────────────────────────────────────────────────
function ScheduledVisitCard({ schedule, refNumber, dynamicRequirements, onViewDetails, onReschedule, normalizedStatus }: {
  schedule: ScheduleData; refNumber: string; dynamicRequirements: string[];
  onViewDetails: () => void; onReschedule: () => void; normalizedStatus: string;
}) {
  const dateObj       = new Date(schedule.schedule_date + "T12:00:00");
  const monthLabel    = dateObj.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const dayLabel      = dateObj.getDate();
  const yearLabel     = dateObj.getFullYear();
  const fullDateLabel = dateObj.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const timeLabel = (() => {
    try {
      const [h, m] = schedule.schedule_time.split(":").map(Number);
      const period = h >= 12 ? "PM" : "AM";
      const hour   = h % 12 || 12;
      return `${hour}:${String(m).padStart(2, "0")} ${period}`;
    } catch { return schedule.schedule_time; }
  })();

  return (
    <div className="rounded-2xl overflow-hidden mb-4"
      style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#eff6ff" }}>
          <Home className="h-4 w-4" style={{ color: "#2563eb" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "#111827" }}>Next step: Proceed on your assigned date and time at the barangay office</p>
          <p className="text-[11px]" style={{ color: "#9ca3af" }}>Your pickup date is confirmed</p>
        </div>
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full flex-shrink-0"
          style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
          {normalizedStatus === "rescheduled" ? "Rescheduled" : "Scheduled"}
        </span>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        {normalizedStatus === "rescheduled" && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#dcfce7" }}>
              <Check className="h-3.5 w-3.5" style={{ color: "#16a34a" }} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: "#15803d" }}>Rescheduled successfully</p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#166534" }}>Your new pickup date is confirmed below.</p>
            </div>
          </div>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Pickup schedule</p>
          <div className="flex items-center gap-4 rounded-xl px-4 py-4" style={{ background: "#eff6ff" }}>
            <div className="flex flex-col items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: "#1d4ed8", padding: "10px 12px", minWidth: 52, textAlign: "center" }}>
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
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Reference number</p>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
            <span className="font-mono text-lg font-bold" style={{ color: "#111827", letterSpacing: "0.04em" }}>{refNumber}</span>
          </div>
        </div>
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
        <button onClick={onViewDetails} className="w-full py-2.5 text-xs font-bold rounded-xl transition-colors"
          style={{ border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}>
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Rejected / Incomplete / Inspecting Cards ──────────────────────────────────
function RejectedCard({ reason, onViewDetails }: { reason?: string | null; onViewDetails: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#fff", border: "1px solid #fecdd3" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", borderBottom: "1px solid #fecdd3" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fee2e2" }}>
          <XCircle className="h-5 w-5" style={{ color: "#e11d48" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: "#9f1239" }}>Request Rejected</p>
          <p className="text-[11px]" style={{ color: "#be123c" }}>Your document request was not approved</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: "#fee2e2", color: "#e11d48", border: "1px solid #fecdd3" }}>Rejected</span>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        {hasValue(reason) ? (
          <div className="flex items-start gap-3 px-4 py-4 rounded-xl" style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
            <FileX className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
            <p className="text-sm font-semibold leading-relaxed" style={{ color: "#9f1239" }}>{String(reason)}</p>
          </div>
        ) : (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#be123c" }}>No specific reason was provided. Please contact the barangay office.</p>
          </div>
        )}
        <button onClick={onViewDetails} className="w-full py-2.5 text-xs font-bold rounded-xl"
          style={{ border: "1px solid #fecdd3", background: "#fff1f2", color: "#e11d48" }}>
          View Details
        </button>
      </div>
    </div>
  );
}

function IncompleteCard({ reason, onViewDetails }: { reason?: string | null; onViewDetails: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#fff", border: "1px solid #fed7aa" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", borderBottom: "1px solid #fed7aa" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#ffedd5" }}>
          <AlertCircle className="h-5 w-5" style={{ color: "#ea580c" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: "#9a3412" }}>Action Required</p>
          <p className="text-[11px]" style={{ color: "#c2410c" }}>Missing or incomplete documents detected</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: "#ffedd5", color: "#ea580c", border: "1px solid #fed7aa" }}>Incomplete</span>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        {hasValue(reason) ? (
          <div className="flex items-start gap-3 px-4 py-4 rounded-xl" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#ea580c" }} />
            <p className="text-sm font-semibold leading-relaxed" style={{ color: "#9a3412" }}>{String(reason)}</p>
          </div>
        ) : (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#ea580c" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#c2410c" }}>Your submission has missing or incomplete documents.</p>
          </div>
        )}
        <button onClick={onViewDetails} className="w-full py-2.5 text-xs font-bold rounded-xl"
          style={{ border: "1px solid #fed7aa", background: "#fff7ed", color: "#ea580c" }}>
          View Details
        </button>
      </div>
    </div>
  );
}

function InspectingCard({ reason, onViewDetails }: { reason?: string | null; onViewDetails: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#fff", border: "1px solid #ddd6fe" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)", borderBottom: "1px solid #ddd6fe" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#ede9fe" }}>
          <Search className="h-5 w-5" style={{ color: "#7c3aed" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: "#4c1d95" }}>Under Inspection</p>
          <p className="text-[11px]" style={{ color: "#6d28d9" }}>A barangay officer is reviewing your submission.</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: "#ede9fe", color: "#7c3aed", border: "1px solid #ddd6fe" }}>Inspecting</span>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>You will be notified once the inspection is complete. No action is needed at this time.</p>
        </div>
        <button onClick={onViewDetails} className="w-full py-2.5 text-xs font-bold rounded-xl"
          style={{ border: "1px solid #ddd6fe", background: "#faf5ff", color: "#7c3aed" }}>
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Review Required Card ──────────────────────────────────────────────────────
// function ReviewRequiredCard({ onViewDetails }: { onViewDetails: () => void }) {
//   return (
//     <div className="rounded-2xl overflow-hidden mb-4"
//       style={{ background: "#fff", border: "2px solid #f59e0b", boxShadow: "0 2px 16px rgba(245,158,11,0.15)" }}>
//       <div className="flex items-center gap-3 px-5 py-4"
//         style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", borderBottom: "2px solid #f59e0b" }}>
//         <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
//           style={{ backgroundColor: "#fef3c7", border: "1.5px solid #f59e0b" }}>
//           <span className="text-base font-black" style={{ color: "#b45309" }}>1</span>
//         </div>
//         <div className="flex-1">
//           <p className="text-sm font-black" style={{ color: "#78350f" }}>Review Your Application</p>
//           <p className="text-[11px] mt-0.5" style={{ color: "#b45309" }}>Action needed before your request proceeds</p>
//         </div>
//       </div>
//       <div className="px-5 py-5 flex flex-col gap-4">
//         <div className="flex items-start gap-3 px-4 py-4 rounded-xl" style={{ backgroundColor: "#fffbeb", border: "1.5px dashed #f59e0b" }}>
//           <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#d97706" }} />
//           <p className="text-sm font-bold leading-snug" style={{ color: "#78350f" }}>Please review your submitted details and uploaded documents before proceeding.</p>
//         </div>
//         <button onClick={onViewDetails}
//           className="w-full py-3.5 text-sm font-black rounded-xl text-white flex items-center justify-center gap-2"
//           style={{ background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)" }}>
//           <FileCheck className="h-4 w-4" />
//           👉 Click Here to Review
//         </button>
//       </div>
//     </div>
//   );
// }

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
      const res = await fetch(
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

  // Auto mark no-show
  useEffect(() => {
    if (!schedule || !request) return;
    const normalizedStatus = (request.raw?.status ?? "").toLowerCase();
    if (normalizedStatus !== "scheduled") return;
    if (!isMissedSchedule(schedule.schedule_date)) return;
    fetch(
      `${import.meta.env.VITE_WEB_URL}/api/schedules/${schedule.document_type}/${schedule.id}/no-show`,
      { method: "POST", credentials: "include", headers: { Accept: "application/json" } }
    ).then((res) => {
      if (res.ok) queryClient.invalidateQueries({ queryKey: ["request", type, id] });
    }).catch(() => {});
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
          <button className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-xl"
            style={{ backgroundColor: NAVY }} onClick={() => navigate("/myrequest")}>
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  const normalizedStatus  = (request.raw?.status ?? "").toLowerCase();
  const isReleased        = normalizedStatus === "released";
  const isScheduled       = normalizedStatus === "scheduled";
  const isRescheduled     = normalizedStatus === "rescheduled";
  const isNoShow          = normalizedStatus === "no_show";
  const isApproved        = normalizedStatus === "approved";
  const isToPay           = normalizedStatus === "to_pay";
  const isRejected        = normalizedStatus === "rejected";
  const isIncomplete      = normalizedStatus === "incomplete";
  const isInspecting      = normalizedStatus === "inspecting";
  const isBlockedStatus   = BLOCKED_STATUSES.has(normalizedStatus);
  const isReviewStatus    = normalizedStatus === "pending" || normalizedStatus === "encoded" || normalizedStatus === "processing";
  // Reprint flow flags
  const isReprint         = normalizedStatus === "reprint";
  const isReprintProcess  = normalizedStatus === "reprint_process";
  const isReprintReleased = normalizedStatus === "reprint_released";
  const isAnyReprintFlow  = REPRINT_STATUSES.has(normalizedStatus);

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
    normalizedStatus === "to_pay"           ? "To Pay" :
    normalizedStatus === "rescheduled"      ? "Rescheduled" :
    normalizedStatus === "no_show"          ? "No Show" :
    normalizedStatus === "reprint"          ? "Reprint" :
    normalizedStatus === "reprint_process"  ? "Reprint Processing" :
    normalizedStatus === "reprint_released" ? "Reprint Released" :
    normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  // QR shown for standard pickup and reprint pickup
  const showQRCard = isScheduled || isRescheduled || isApproved || isToPay || isReprint;

  const rejectionReason = req.rejection_reason ?? null;

  // Progress bar shown for all except blocked/no_show
  const showProgressBar = !isBlockedStatus && !isNoShow;

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
        <button className="inline-flex items-center gap-1.5 text-xs font-semibold mb-6 transition-colors"
          style={{ color: "#9ca3af" }} onClick={() => navigate("/myrequest")}
          onMouseEnter={(e) => (e.currentTarget.style.color = NAVY)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Requests
        </button>

        {/* Header Card */}
        <div className="mb-4">
          <div className="rounded-2xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a7a 100%)`, boxShadow: "0 4px 20px rgba(15,42,94,0.2)" }}>
            <div className="px-5 py-4">
              <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
                style={{ backgroundColor: "rgba(194,70,125,0.25)", color: "#f9a8d4", border: "1px solid rgba(194,70,125,0.35)" }}>
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
              <div className="flex items-start gap-2.5 px-5 py-3"
                style={{ backgroundColor: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#f9a8d4" }} />
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {[req.house_block_lot_no, req.street, req.zone].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4"
          style={{ boxShadow: "0 2px 16px rgba(15,42,94,0.08)", border: "1px solid #e5e7eb" }}>
          <div className="px-5 pt-5 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#9ca3af" }}>Current Status</p>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="text-2xl font-black" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>{statusLabel}</h1>
              <StatusBadge status={normalizedStatus} />
            </div>

            {showProgressBar ? (
              <ProgressBar status={normalizedStatus} onLearnMore={() => setShowOfficeHours(true)} />
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isRejected ? "#fff1f2" : isIncomplete ? "#fff7ed" : isNoShow ? "#fff7ed" : "#faf5ff",
                    color:           isRejected ? "#e11d48" : isIncomplete ? "#ea580c" : isNoShow ? "#ea580c" : "#7c3aed",
                    border:          `1px solid ${isRejected ? "#fecdd3" : isIncomplete ? "#fed7aa" : isNoShow ? "#fed7aa" : "#ddd6fe"}`,
                  }}>
                  {isRejected ? "Rejected" : isIncomplete ? "Incomplete" : isNoShow ? "No Show" : "Inspecting"}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
            )}

            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e5e7eb" }}>
              <button type="button" onClick={() => setShowOfficeHours(true)}
                className="text-xs font-semibold transition-colors" style={{ color: "#2563eb" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>
                ℹ️ For processing guidelines, required documents, and office hours, please click here.
              </button>
            </div>
          </div>

          {svcMeta && !isReleased && (
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
                    {format(new Date(request.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Review Required */}
        {/* {isReviewStatus && <ReviewRequiredCard onViewDetails={() => setShowDetails(true)} />} */}

        {/* Generic Schedule Card (for non-standard statuses) */}
        {schedule && !isReleased && !isScheduled && !isRescheduled && !isNoShow && !isBlockedStatus && !isAnyReprintFlow && (
          <div className="mb-4"><ScheduleCard schedule={schedule} /></div>
        )}

        {/* Required Documents */}
        {dynamicRequirements.length > 0 && !isScheduled && !isRescheduled && !isNoShow && !isBlockedStatus && !isReleased && !isAnyReprintFlow && (
          <div className="mb-6 rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0f2a5e 0%, #1a3a7a 100%)", border: "2px solid #c2467d" }}>
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
                  <div key={idx} className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(194,70,125,0.3)" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: "#c2467d", color: "white" }}>{idx + 1}</div>
                    <p className="text-sm font-bold leading-snug text-white">{doc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Show Card */}
        {isNoShow && schedule && (
          <NoShowCard schedule={schedule} onReschedule={() => setShowReschedule(true)} onViewDetails={() => setShowDetails(true)} />
        )}

        {/* Scheduled / Rescheduled Visit Card */}
        {(isScheduled || isRescheduled) && schedule && (
          <ScheduledVisitCard
            schedule={schedule} refNumber={refNumber}
            dynamicRequirements={dynamicRequirements}
            onViewDetails={() => setShowDetails(true)}
            onReschedule={() => setShowReschedule(true)}
            normalizedStatus={normalizedStatus}
          />
        )}

        {/* ── Reprint Flow Cards ── */}
        {isReprint && (
          <ReprintScheduledCard
            schedule={schedule ?? null}
            refNumber={refNumber}
            onViewDetails={() => setShowDetails(true)}
          />
        )}

        {isReprintProcess && (
          <div className="rounded-2xl overflow-hidden mb-4"
            style={{ background: "#fff", border: "1px solid #d8b4fe", boxShadow: "0 1px 8px rgba(126,34,206,0.08)" }}>
            <div className="flex items-center gap-3 px-5 py-4"
              style={{ background: "linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%)", borderBottom: "1px solid #d8b4fe" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f3e8ff" }}>
                <RefreshCw className="h-4 w-4" style={{ color: "#6b21a8" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black" style={{ color: "#4c1d95" }}>Reprint In Progress</p>
                <p className="text-[11px]" style={{ color: "#6d28d9" }}>Your document is currently being reprinted.</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: "#f3e8ff", color: "#6b21a8", border: "1px solid #d8b4fe" }}>Processing</span>
            </div>
            <div className="px-5 py-5 flex flex-col gap-4">
              <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>Your reprint is being processed by the barangay office. You will be notified once it is ready for release.</p>
              </div>
              <button onClick={() => setShowDetails(true)} className="w-full py-2.5 text-xs font-bold rounded-xl"
                style={{ border: "1px solid #d8b4fe", background: "#fdf4ff", color: "#6b21a8" }}>
                View Details
              </button>
            </div>
          </div>
        )}

        {isReprintReleased && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-4" style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#dcfce7" }}>
              <FileCheck className="h-5 w-5" style={{ color: "#16a34a" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#15803d" }}>Reprinted Document Released</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#166534" }}>Your reprinted document has been officially released. Please check with the barangay office for pickup details.</p>
            </div>
          </div>
        )}

        {/* Blocked status cards */}
        {isRejected   && <RejectedCard   reason={rejectionReason} onViewDetails={() => setShowDetails(true)} />}
        {isIncomplete && <IncompleteCard  reason={rejectionReason} onViewDetails={() => setShowDetails(true)} />}
        {isInspecting && <InspectingCard  reason={rejectionReason} onViewDetails={() => setShowDetails(true)} />}

        {/* QR Card — standard pickup + reprint pickup */}
        {showQRCard && (
          <QRPresentCard
            refNumber={refNumber}
            docLabel={DOC_TYPE_LABELS[docTypeSlug] ?? docTypeSlug.replace(/_/g, " ")}
          />
        )}

        {/* What's Next */}
        {whatNext && !isReleased && !isScheduled && !isRescheduled && !isNoShow && !isBlockedStatus && !isAnyReprintFlow && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: NAVY }}>
            <div className="px-5 py-5 relative overflow-hidden">
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
              <button onClick={() => setShowDetails(true)}
                className="mt-4 w-full py-2.5 text-xs font-bold rounded-xl text-white transition-opacity hover:opacity-90 relative z-10"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
                View Details
              </button>
            </div>
          </div>
        )}

        {/* What's Next for reprint flow */}
        {isAnyReprintFlow && whatNext && !isReprintReleased && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: "#4c1d95" }}>
            <div className="px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <Info className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">What's next?</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{whatNext}</p>
                  {statusMsg?.nextStep && (
                    <p className="text-[10px] mt-2 font-bold" style={{ color: "#d8b4fe" }}>Next: {statusMsg.nextStep}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reprint Request Section — only shown when RELEASED and not in reprint flow */}
        {isReleased && !isAnyReprintFlow && (
          <ReprintRequestSection documentType={docTypeSlug} documentNumber={refNumber} />
        )}

        {/* View Details button */}
        {(isReleased || isReprintReleased) && (
          <button onClick={() => setShowDetails(true)}
            className="w-full py-3 text-sm font-bold rounded-2xl text-white"
            style={{ backgroundColor: NAVY }}>
            View Details
          </button>
        )}

      </div>
    </div>
  );
}