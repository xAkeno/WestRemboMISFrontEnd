import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  X, FileText, FileImage, File, CheckCircle2, XCircle,
  AlertTriangle, Calendar, Clock, Loader2, Eye,
  ShieldCheck, ZoomIn, MessageSquare, Send, Info,
  FileX, BadgeCheck, RefreshCw, FileQuestion,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true,
  headers: { Accept: "application/json" },
});

// ─── Required documents per document type ─────────────────────────────────────
// Keys match the `document_type` prop passed into the modal.
// Values are the exact `label` strings returned by the API (case-insensitive matched).
const REQUIRED_DOCS: Record<string, string[]> = {
  "resident": [
    "Valid government ID",
    "Proof of Residency",
    // "2x2 ID photo",
    // "Accomplished registration form",
  ],
  "barangay_certificate": [
    "Valid government ID",
    // "Barangay residency certificate",
    // "Purpose of request",
  ],
  "barangay_clearance": [
    "Valid government ID",
    // "Barangay residency certificate",
    // "Community Tax Certificate (Cedula)",
    // "2x2 ID photo",
  ],
  "business_clearance": [
    "DTI / SEC Registration",
    "Mayor's Business Permit",
    "BIR Certificate of Registration",
    "Valid government ID",
  ],
  "building_clearance": [
    "Transfer Certificate of Title (TCT)",
    "Tax Declaration",
    "Barangay clearance",
  ],
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface UploadedDoc {
  id: number;
  category: string;
  type: string;
  label: string;
  original_filename: string;
  url: string;
  preview: string;
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

interface DocInspectStatus {
  [docId: number]: "approved" | "flagged" | null;
}

interface DocumentInspectModalProps {
  /**
   * 'inspect'    — full panel: docs + remarks + schedule  (POST /api/schedules)
   * 'reschedule' — schedule only, calls PUT /api/schedules/{bcert_number}/reschedule
   */
  mode?: "inspect" | "reschedule";
  record: {
    id: number | string;
    bcert_number?: string;
    requester_name?: string;
    first_name?: string;
    surname?: string;
    document_type?: string;
    scheduled_date?: string | null;
    user_id?: number | string;
  };
  onClose: () => void;
  onScheduled?: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function isPdf(filename: string) { return filename?.toLowerCase().endsWith(".pdf"); }

function DocTypeIcon({ filename }: { filename: string }) {
  if (!filename) return <File className="h-5 w-5" style={{ color: NAVY }} />;
  if (isPdf(filename)) return <FileText className="h-5 w-5" style={{ color: NAVY }} />;
  return <FileImage className="h-5 w-5" style={{ color: NAVY }} />;
}

/**
 * Given the full list of uploaded docs and the required labels for this
 * document type, returns:
 *  - `matched`  — uploaded docs that satisfy a required label (one per requirement)
 *  - `missing`  — required labels that have NO uploaded doc
 *  - `extra`    — uploaded docs that don't match any requirement (shown collapsed)
 */
function partitionDocs(
  docs: UploadedDoc[],
  requiredLabels: string[],
): {
  matched: Array<{ requirement: string; doc: UploadedDoc }>;
  missing: string[];
  extra: UploadedDoc[];
} {
  const usedDocIds = new Set<number>();
  const matched: Array<{ requirement: string; doc: UploadedDoc }> = [];
  const missing: string[] = [];

  for (const req of requiredLabels) {
    const reqLower = req.toLowerCase();
    // Find the best-matching uploaded doc not yet consumed
    const found = docs.find(
      d =>
        !usedDocIds.has(d.id) &&
        (d.label.toLowerCase().includes(reqLower) ||
          reqLower.includes(d.label.toLowerCase()) ||
          d.type.toLowerCase().includes(reqLower) ||
          reqLower.includes(d.type.toLowerCase())),
    );
    if (found) {
      usedDocIds.add(found.id);
      matched.push({ requirement: req, doc: found });
    } else {
      missing.push(req);
    }
  }

  const extra = docs.filter(d => !usedDocIds.has(d.id));
  return { matched, missing, extra };
}

// ─── Reply status config ───────────────────────────────────────────────────────
const REPLY_STATUS_CONFIG = {
  info:     { label: "Info",        icon: Info,        bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", badgeBg: "#dbeafe" },
  warning:  { label: "Warning",     icon: AlertTriangle, bg: "#fffbeb", border: "#fde68a", color: "#b45309", badgeBg: "#fef3c7" },
  missing:  { label: "Missing Doc", icon: FileX,       bg: "#fff1f2", border: "#fecdd3", color: "#be123c", badgeBg: "#ffe4e6" },
  approved: { label: "Approved",    icon: BadgeCheck,  bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", badgeBg: "#dcfce7" },
} as const;

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }} onClick={onClose}>
      <button className="absolute top-4 right-4 p-2 rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }} onClick={onClose}>
        <X className="h-5 w-5" />
      </button>
      <img src={url} alt="Document preview" className="max-h-[90vh] max-w-[90vw] object-contain rounded"
        onClick={e => e.stopPropagation()} />
    </div>
  );
}

// ─── Matched doc card (requirement satisfied) ─────────────────────────────────
function DocCard({
  doc, requirement, status, onApprove, onFlag, onZoom,
}: {
  doc: UploadedDoc;
  requirement: string;
  status: "approved" | "flagged" | null;
  onApprove: () => void;
  onFlag: () => void;
  onZoom: () => void;
}) {
  const isImg = !isPdf(doc.original_filename);
  const borderColor = status === "approved" ? "#bbf7d0" : status === "flagged" ? "#fecdd3" : "#dde3ed";
  const bgColor     = status === "approved" ? "#f0fdf4" : status === "flagged" ? "#fff1f2" : "#f8faff";

  return (
    <div className="rounded-sm border overflow-hidden flex flex-col"
      style={{ borderColor, backgroundColor: bgColor, transition: "border-color 0.2s" }}>
      {/* Requirement label strip */}
      <div className="px-3 pt-2 pb-1" style={{ backgroundColor: "#eef2ff" }}>
        <p className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: "#6366f1" }}>
          Required: {requirement}
        </p>
      </div>
      {/* File header */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: "#f0f4ff", borderBottom: "1px solid #dde3ed" }}>
        <div className="flex items-center gap-2 min-w-0">
          <DocTypeIcon filename={doc.original_filename} />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: NAVY }}>{doc.label}</p>
            <p className="text-[9px] text-gray-400 truncate">{doc.original_filename}</p>
          </div>
        </div>
        {status === "approved" && (
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 flex-shrink-0"
            style={{ backgroundColor: "#dcfce7", color: "#15803d", borderRadius: 2 }}>✓ OK</span>
        )}
        {status === "flagged" && (
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 flex-shrink-0"
            style={{ backgroundColor: "#fecdd3", color: "#9f1239", borderRadius: 2 }}>✗ Flagged</span>
        )}
      </div>
      {/* Preview */}
      <div className="relative flex items-center justify-center overflow-hidden"
        style={{ height: 148, backgroundColor: "#e8eef8", cursor: isImg ? "zoom-in" : "default" }}
        onClick={isImg ? onZoom : undefined}>
        {isImg ? (
          <>
            <img src={doc.preview} alt={doc.label} className="w-full h-full object-cover" style={{ opacity: 0.95 }} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{ backgroundColor: "rgba(15,42,94,0.45)" }}>
              <ZoomIn className="h-7 w-7 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-10 w-10" style={{ color: NAVY, opacity: 0.5 }} />
            <a href={doc.url} target="_blank" rel="noopener noreferrer"
              className="text-[11px] font-semibold underline" style={{ color: NAVY }}
              onClick={e => e.stopPropagation()}>Open PDF</a>
          </div>
        )}
      </div>
      {/* Actions */}
      <div className="flex gap-2 p-2.5" style={{ borderTop: "1px solid #dde3ed" }}>
        <button onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all"
          style={{
            backgroundColor: status === "approved" ? "#16a34a" : "#f0fdf4",
            color: status === "approved" ? "#fff" : "#16a34a",
            border: `1px solid ${status === "approved" ? "#16a34a" : "#bbf7d0"}`,
            borderRadius: 2,
          }}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          {status === "approved" ? "Approved" : "Approve"}
        </button>
        <button onClick={onFlag}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all"
          style={{
            backgroundColor: status === "flagged" ? "#e11d48" : "#fff1f2",
            color: status === "flagged" ? "#fff" : "#e11d48",
            border: `1px solid ${status === "flagged" ? "#e11d48" : "#fecdd3"}`,
            borderRadius: 2,
          }}>
          <XCircle className="h-3.5 w-3.5" />
          {status === "flagged" ? "Flagged" : "Flag"}
        </button>
      </div>
    </div>
  );
}

// ─── Missing doc placeholder card ────────────────────────────────────────────
function MissingDocCard({ requirement }: { requirement: string }) {
  return (
    <div className="rounded-sm border overflow-hidden flex flex-col"
      style={{ borderColor: "#fecdd3", backgroundColor: "#fff1f2" }}>
      <div className="px-3 pt-2 pb-1" style={{ backgroundColor: "#ffe4e6" }}>
        <p className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: "#be123c" }}>
          Required: {requirement}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 py-8 px-4"
        style={{ backgroundColor: "#fff5f5" }}>
        <FileQuestion className="h-8 w-8" style={{ color: "#fca5a5" }} />
        <p className="text-[11px] font-bold text-center" style={{ color: "#9f1239" }}>
          Not yet submitted
        </p>
        <p className="text-[10px] text-center" style={{ color: "#f87171" }}>
          Applicant has not uploaded this document.
        </p>
      </div>
      <div className="px-3 py-2.5 flex items-center gap-1.5"
        style={{ borderTop: "1px solid #fecdd3", backgroundColor: "#fff1f2" }}>
        <FileX className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#e11d48" }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#be123c" }}>
          Missing
        </span>
      </div>
    </div>
  );
}

// ─── Reply bubble ──────────────────────────────────────────────────────────────
function ReplyBubble({ reply }: { reply: DocReply }) {
  const cfg  = REPLY_STATUS_CONFIG[reply.status];
  const Icon = cfg.icon;
  const date = new Date(reply.created_at).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  return (
    <div className="flex flex-col gap-1 rounded-sm px-3 py-2.5"
      style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: cfg.color }} />
          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5"
            style={{ backgroundColor: cfg.badgeBg, color: cfg.color, borderRadius: 2 }}>{cfg.label}</span>
          {reply.user?.name && (
            <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>{reply.user.name}</span>
          )}
        </div>
        <span className="text-[9px] text-gray-400 flex-shrink-0">{date}</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: NAVY }}>{reply.message}</p>
    </div>
  );
}

// ─── Main modal ────────────────────────────────────────────────────────────────
export default function DocumentInspectModal({
  mode = "inspect",
  record,
  onClose,
  onScheduled,
  
}: DocumentInspectModalProps) {
  const { toast } = useToast();
  const isReschedule = mode === "reschedule";

  const [docs, setDocs]               = useState<UploadedDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docStatus, setDocStatus]     = useState<DocInspectStatus>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showExtra, setShowExtra]     = useState(false);

  const [replies, setReplies]               = useState<DocReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [replyMessage, setReplyMessage]     = useState("");
  const [replyStatus, setReplyStatus]       = useState<DocReply["status"]>("info");
  const [sendingReply, setSendingReply]     = useState(false);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const [schedDate, setSchedDate]           = useState("");
  const [schedTime, setSchedTime]           = useState("");
  const [saving, setSaving]                 = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots]     = useState(false);
  const [fetchedScheduledDate, setFetchedScheduledDate] = useState<string | null>(
    record.scheduled_date ?? null,
  );

  const requesterName = record.requester_name ?? `${record.first_name ?? ""} ${record.surname ?? ""}`.trim();
  const docTypeSlug   = record.document_type ?? "barangay_certificate";
  const docRecordId   = record.id;

  // Resolve required labels for this document type
  const requiredLabels: string[] = REQUIRED_DOCS[docTypeSlug] ?? [];

  // Fetch documents
  useEffect(() => {
    if (isReschedule) { setLoadingDocs(false); return; }
    const run = async () => {
      setLoadingDocs(true);
      try {
        console.log("Fetching documents for user_id:", record);
        if (!record.user_id) {
          console.warn("DocumentInspectModal: no user_id on record, skipping fetch.");
          setDocs([]);
          setLoadingDocs(false);
          return;
        }
        const params: Record<string, any> = { user_id: record.user_id };
        const { data } = await api.get("/api/mydocuments", { params });
        console.log("Fetched documents for user_id:", data);
        const flatDocs: UploadedDoc[] = [];
        const documents = data.data?.documents || {};
        Object.values(documents).forEach((categoryDocs: any) => {
          (categoryDocs as any[]).forEach(doc => {
            flatDocs.push({
              id: doc.id, category: doc.category, type: doc.type, label: doc.label,
              original_filename: doc.original_filename,
              url:     doc.url ?? `http://127.0.0.1:8000/uploads/${doc.original_filename}`,
              preview: doc.url ?? `http://127.0.0.1:8000/uploads/${doc.original_filename}`,
            });
          });
        });
        setDocs(flatDocs);
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Could not load documents.", variant: "destructive" });
      } finally { setLoadingDocs(false); }
    };
    run();
  }, [record.user_id, isReschedule]);

  // Fetch replies
  useEffect(() => {
    if (isReschedule) { setLoadingReplies(false); return; }
    const run = async () => {
      setLoadingReplies(true);
      try {
        const { data } = await api.get(`/api/documents/${docTypeSlug}/${docRecordId}/replies`);
        setReplies(data.data ?? []);
      } catch (err) { console.error(err); }
      finally { setLoadingReplies(false); }
    };
    run();
  }, [docTypeSlug, docRecordId, isReschedule]);

  // Fetch existing schedule
  useEffect(() => {
    if (!record.bcert_number) return;
    const run = async () => {
      try {
        const { data } = await api.get("/api/schedules", {
          params: { document_type: docTypeSlug, document_number: record.bcert_number },
        });
        const schedule = data.data ?? null;
        if (schedule?.schedule_date && schedule?.schedule_time)
          setFetchedScheduledDate(`${schedule.schedule_date}T${schedule.schedule_time}`);
      } catch { /* no schedule yet */ }
    };
    run();
  }, [record.bcert_number, docTypeSlug]);

  useEffect(() => { repliesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [replies]);

  // Time slots
  useEffect(() => {
    if (!schedDate) return;
    const ALL_SLOTS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
    const run = async () => {
      setLoadingSlots(true); setSchedTime("");
      try {
        const { data } = await api.get("/api/schedules/available-slots", {
          params: { document_type: docTypeSlug, date: schedDate },
        });
        const backendSlots: string[] = data.data ?? [];
        setAvailableSlots(backendSlots.length > 0 ? ALL_SLOTS.filter(s => backendSlots.includes(s)) : ALL_SLOTS);
      } catch { setAvailableSlots(ALL_SLOTS); }
      finally { setLoadingSlots(false); }
    };
    run();
  }, [schedDate, docTypeSlug]);

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    setSendingReply(true);
    try {
      const { data } = await api.post(`/api/documents/${docTypeSlug}/${docRecordId}/replies`, {
        message: replyMessage.trim(), status: replyStatus,
      });
      setReplies(prev => [...prev, data.data]);
      setReplyMessage("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Could not send remark.", variant: "destructive" });
    } finally { setSendingReply(false); }
  };

  const setStatus = (id: number, s: "approved" | "flagged") => {
    setDocStatus(prev => ({ ...prev, [id]: prev[id] === s ? null : s }));
  };

  // Partition docs into matched / missing / extra based on requirements
  const { matched, missing, extra } = partitionDocs(docs, requiredLabels);

  const submittedRequiredCount = matched.length;
  const totalRequiredCount     = requiredLabels.length;
  const allRequiredApproved    = matched.length > 0 &&
    matched.every(({ doc }) => docStatus[doc.id] === "approved") &&
    missing.length === 0;
  const anyFlagged             = matched.some(({ doc }) => docStatus[doc.id] === "flagged");

  const handleSaveSchedule = async () => {
    if (!schedDate) { toast({ title: "Required", description: "Please pick a date.", variant: "destructive" }); return; }
    if (!schedTime) { toast({ title: "Required", description: "Please select a time slot.", variant: "destructive" }); return; }
    if (!isReschedule && anyFlagged) {
      toast({ title: "Flagged documents", description: "Resolve flagged documents before scheduling.", variant: "destructive" }); return;
    }
    if (!isReschedule && missing.length > 0) {
      toast({ title: "Missing documents", description: `${missing.length} required document${missing.length > 1 ? "s are" : " is"} not yet submitted.`, variant: "destructive" }); return;
    }
    if (!record.bcert_number) {
      toast({ title: "Error", description: "Missing BCert No.", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      if (isReschedule) {
        await api.put(`/api/schedules/${record.bcert_number}/reschedule`, {
          schedule_date: schedDate, schedule_time: schedTime,
        });
      } else {
        await api.post("/api/schedules", {
          document_type: docTypeSlug, document_number: record.bcert_number,
          schedule_date: schedDate, schedule_time: schedTime,
        });
      }
      const friendlyTime = new Date(`1970-01-01T${schedTime}:00`).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      const friendlyDate = new Date(schedDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
      setFetchedScheduledDate(`${schedDate}T${schedTime}`);
      toast({ title: isReschedule ? "Rescheduled!" : "Schedule confirmed!", description: `Pickup set for ${friendlyDate} at ${friendlyTime}.` });
      onScheduled?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to save schedule.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const today         = new Date().toISOString().split("T")[0];
  const accentColor   = isReschedule ? "#b45309" : PINK;
  const accentBtnBg   = isReschedule ? "#b45309" : NAVY;
  const accentHoverBg = isReschedule ? "#92400e" : "#1a3d7c";
  const panelBorder   = isReschedule ? "#f59e0b" : PINK;

  return (
    <>
      <div className="fixed inset-0 z-50"
        style={{ backgroundColor: "rgba(10,20,50,0.6)", backdropFilter: "blur(2px)" }}
        onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl overflow-hidden"
        style={{ width: "min(680px, 100vw)", borderLeft: `3px solid ${panelBorder}` }}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-4 flex-shrink-0"
          style={{ backgroundColor: "#f8faff", borderBottom: "1px solid #dde3ed" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div style={{ width: 14, height: 2, backgroundColor: accentColor }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accentColor }}>
                {isReschedule ? "Reschedule Pickup" : "Document Inspection"}
              </p>
              {isReschedule && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5"
                  style={{ backgroundColor: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", borderRadius: 2 }}>
                  <RefreshCw className="h-2.5 w-2.5" /> Reschedule
                </span>
              )}
            </div>
            <h2 className="font-bold text-lg" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>
              {requesterName || "—"}
            </h2>
            {record.bcert_number && (
              <p className="text-xs text-gray-500 mt-0.5">
                <span className="font-bold" style={{ color: accentColor }}>BCert No.: </span>
                {record.bcert_number}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-sm transition-colors mt-0.5"
            style={{ color: "#9ca3af" }}
            onMouseEnter={e => (e.currentTarget.style.color = NAVY)}
            onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Reschedule notice */}
          {isReschedule && (
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-start gap-3 px-4 py-3 rounded-sm"
                style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
                <RefreshCw className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#b45309" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#92400e" }}>
                    You are rescheduling an existing appointment.
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Selecting a new date and time below will replace the current schedule via{" "}
                    <code className="text-[10px] bg-amber-100 px-1 rounded">
                      PUT /api/schedules/{record.bcert_number}/reschedule
                    </code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Document Review — inspect mode only ── */}
          {!isReschedule && (
            <>
              <div className="px-6 pt-5 pb-4">
                {/* Section header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#f0f4ff", borderRadius: 1 }}>
                    <Eye className="h-3.5 w-3.5" style={{ color: NAVY }} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: NAVY }}>
                    Required Documents
                  </p>
                  <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                  {/* Progress pill */}
                  {requiredLabels.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 flex-shrink-0"
                      style={{
                        backgroundColor: missing.length === 0 ? "#dcfce7" : "#fefce8",
                        color:           missing.length === 0 ? "#15803d" : "#92400e",
                        borderRadius: 2,
                        border: `1px solid ${missing.length === 0 ? "#86efac" : "#fde68a"}`,
                      }}>
                      {submittedRequiredCount}/{totalRequiredCount} submitted
                    </span>
                  )}
                </div>

                {/* No requirements configured */}
                {requiredLabels.length === 0 && !loadingDocs && (
                  <div className="flex flex-col items-center justify-center py-8 rounded-sm"
                    style={{ backgroundColor: "#f8faff", border: "1px dashed #c8d4ed" }}>
                    <Info className="h-6 w-6 mb-2" style={{ color: "#9ca3af" }} />
                    <p className="text-xs text-gray-400">No document requirements configured for this document type.</p>
                  </div>
                )}

                {/* Loading */}
                {loadingDocs && requiredLabels.length > 0 && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: NAVY }} />
                  </div>
                )}

                {/* Required doc grid: matched + missing placeholders interleaved in requirement order */}
                {!loadingDocs && requiredLabels.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {requiredLabels.map(req => {
                        const entry = matched.find(m => m.requirement === req);
                        if (entry) {
                          return (
                            <DocCard
                              key={`doc-${entry.doc.id}`}
                              doc={entry.doc}
                              requirement={req}
                              status={docStatus[entry.doc.id] ?? null}
                              onApprove={() => setStatus(entry.doc.id, "approved")}
                              onFlag={() => setStatus(entry.doc.id, "flagged")}
                              onZoom={() => setLightboxUrl(entry.doc.preview)}
                            />
                          );
                        }
                        return <MissingDocCard key={`missing-${req}`} requirement={req} />;
                      })}
                    </div>

                    {/* Status banners */}
                    {missing.length > 0 && (
                      <div className="mt-3 px-3 py-2.5 flex items-start gap-2 rounded-sm"
                        style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
                        <FileX className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
                        <p className="text-xs font-medium" style={{ color: "#9f1239" }}>
                          <strong>{missing.length}</strong> required document{missing.length > 1 ? "s have" : " has"} not been submitted yet.
                          Scheduling is blocked until all requirements are met.
                        </p>
                      </div>
                    )}
                    {anyFlagged && (
                      <div className="mt-3 px-3 py-2.5 flex items-start gap-2 rounded-sm"
                        style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
                        <p className="text-xs font-medium" style={{ color: "#9f1239" }}>
                          One or more documents are flagged. Resolve them before confirming the schedule.
                        </p>
                      </div>
                    )}
                    {allRequiredApproved && (
                      <div className="mt-3 px-3 py-2.5 flex items-center gap-2 rounded-sm"
                        style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                        <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: "#16a34a" }} />
                        <p className="text-xs font-semibold" style={{ color: "#15803d" }}>
                          All required documents verified. Ready to schedule.
                        </p>
                      </div>
                    )}

                    {/* Extra / unrecognised docs — collapsed by default */}
                    {extra.length > 0 && (
                      <div className="mt-4">
                        <button
                          onClick={() => setShowExtra(v => !v)}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-2 transition-colors"
                          style={{ color: "#9ca3af" }}
                          onMouseEnter={e => (e.currentTarget.style.color = NAVY)}
                          onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
                        >
                          <span>{showExtra ? "▾" : "▸"}</span>
                          {extra.length} additional uploaded document{extra.length > 1 ? "s" : ""} (not required)
                        </button>
                        {showExtra && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-70">
                            {extra.map(doc => (
                              <DocCard
                                key={`extra-${doc.id}`}
                                doc={doc}
                                requirement=""
                                status={docStatus[doc.id] ?? null}
                                onApprove={() => setStatus(doc.id, "approved")}
                                onFlag={() => setStatus(doc.id, "flagged")}
                                onZoom={() => setLightboxUrl(doc.preview)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ height: 1, backgroundColor: "#e5e7eb", margin: "0 24px" }} />

              {/* ── Remarks ── */}
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#f0f4ff", borderRadius: 1 }}>
                    <MessageSquare className="h-3.5 w-3.5" style={{ color: NAVY }} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: NAVY }}>
                    Remarks &amp; Replies
                  </p>
                  <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                  {replies.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 flex-shrink-0"
                      style={{ backgroundColor: "#f0f4ff", color: NAVY, borderRadius: 2, border: "1px solid #c8d4ed" }}>
                      {replies.length} remark{replies.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 mb-4" style={{ maxHeight: 260, overflowY: "auto" }}>
                  {loadingReplies ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin" style={{ color: NAVY }} />
                    </div>
                  ) : replies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 rounded-sm"
                      style={{ backgroundColor: "#f8faff", border: "1px dashed #c8d4ed" }}>
                      <MessageSquare className="h-6 w-6 mb-2" style={{ color: "#9ca3af" }} />
                      <p className="text-xs text-gray-400">No remarks yet. Add one below.</p>
                    </div>
                  ) : (
                    replies.map(reply => <ReplyBubble key={reply.id} reply={reply} />)
                  )}
                  <div ref={repliesEndRef} />
                </div>

                <div className="rounded-sm overflow-hidden" style={{ border: "1px solid #dde3ed", backgroundColor: "#f8faff" }}>
                  <div className="flex items-center gap-1 px-3 py-2"
                    style={{ borderBottom: "1px solid #dde3ed", backgroundColor: "#f0f4ff" }}>
                    <span className="text-[9px] font-bold uppercase tracking-wider mr-1" style={{ color: "#9ca3af" }}>Type:</span>
                    {(Object.keys(REPLY_STATUS_CONFIG) as DocReply["status"][]).map(s => {
                      const cfg = REPLY_STATUS_CONFIG[s];
                      const isActive = replyStatus === s;
                      return (
                        <button key={s} onClick={() => setReplyStatus(s)}
                          className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                          style={{
                            backgroundColor: isActive ? cfg.badgeBg : "transparent",
                            color: isActive ? cfg.color : "#9ca3af",
                            border: `1px solid ${isActive ? cfg.border : "transparent"}`,
                            borderRadius: 2,
                          }}>
                          <cfg.icon className="h-3 w-3" />{cfg.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-end gap-2 p-2.5">
                    <textarea rows={2} value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendReply(); }}
                      placeholder={
                        replyStatus === "missing"  ? "e.g. Please resubmit your valid government-issued ID." :
                        replyStatus === "warning"  ? "e.g. Your barangay clearance appears expired." :
                        replyStatus === "approved" ? "e.g. All documents have been verified and accepted." :
                        "Add a remark or instruction for the applicant…"
                      }
                      className="flex-1 px-3 py-2 text-sm border rounded-sm outline-none resize-none transition-all"
                      style={{ borderColor: "#dde3ed", backgroundColor: "#fff", color: NAVY, minHeight: 56 }}
                      onFocus={e => (e.currentTarget.style.borderColor = NAVY)}
                      onBlur={e  => (e.currentTarget.style.borderColor = "#dde3ed")} />
                    <button onClick={handleSendReply} disabled={sendingReply || !replyMessage.trim()}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                      style={{ backgroundColor: NAVY, borderRadius: 2, height: 56 }} title="Send (Ctrl+Enter)">
                      {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="px-3 pb-2 text-[9px] text-gray-400">
                    Ctrl+Enter to send · The applicant will be notified of this remark.
                  </p>
                </div>
              </div>

              <div style={{ height: 1, backgroundColor: "#e5e7eb", margin: "0 24px" }} />
            </>
          )}

          {/* ── Schedule section ── */}
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: isReschedule ? "#fef3c7" : "#f0f4ff", borderRadius: 1 }}>
                {isReschedule
                  ? <RefreshCw className="h-3.5 w-3.5" style={{ color: "#b45309" }} />
                  : <Calendar className="h-3.5 w-3.5" style={{ color: NAVY }} />}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em]"
                style={{ color: isReschedule ? "#b45309" : NAVY }}>
                {isReschedule ? "New Pickup Schedule" : "Set Pickup Schedule"}
              </p>
              <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
            </div>

            {/* Blocked notice when docs are missing */}
            {!isReschedule && missing.length > 0 && (
              <div className="mb-4 px-3 py-2.5 flex items-center gap-2 rounded-sm"
                style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
                <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#ea580c" }} />
                <p className="text-xs font-medium" style={{ color: "#9a3412" }}>
                  Scheduling is unavailable until all required documents are submitted.
                </p>
              </div>
            )}

            {/* Existing schedule notice */}
            {(fetchedScheduledDate ?? record.scheduled_date) && (
              <div className="mb-4 px-3 py-2.5 flex items-center gap-2 rounded-sm"
                style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <Clock className="h-4 w-4 shrink-0" style={{ color: "#2563eb" }} />
                <p className="text-xs" style={{ color: "#1e40af" }}>
                  <span className="font-bold">
                    {isReschedule ? "Current schedule (will be replaced): " : "Current schedule: "}
                  </span>
                  {new Date(fetchedScheduledDate ?? record.scheduled_date!).toLocaleString(undefined, {
                    dateStyle: "long", timeStyle: "short",
                  })}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: accentColor }}>
                  {isReschedule ? "New Pickup Date" : "Pickup Date"}{" "}
                  <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <input type="date" min={today} value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  disabled={!isReschedule && missing.length > 0}
                  className="w-full px-3 py-2 text-sm border rounded-sm outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: "#dde3ed", backgroundColor: "#f8faff", color: NAVY }}
                  onFocus={e => (e.currentTarget.style.borderColor = NAVY)}
                  onBlur={e  => (e.currentTarget.style.borderColor = "#dde3ed")} />
              </div>

              {schedDate && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: accentColor }}>
                      Available Time Slots <span style={{ color: "#e11d48" }}>*</span>
                    </label>
                    {loadingSlots && <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: NAVY }} />}
                  </div>
                  <p className="text-[9px] text-gray-400 mb-3">
                    Office hours 8:00 AM – 5:00 PM · Lunch break 12:00 – 1:00 PM excluded
                  </p>

                  {!loadingSlots && availableSlots.length === 0 && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-sm"
                      style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
                      <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#ea580c" }} />
                      <p className="text-xs font-medium" style={{ color: "#9a3412" }}>
                        No available slots for this date. Please pick another day.
                      </p>
                    </div>
                  )}

                  {!loadingSlots && availableSlots.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {availableSlots.map(t => {
                        const isSelected = schedTime === t;
                        const [hStr, mStr] = t.split(":");
                        const startH = parseInt(hStr, 10);
                        const endH   = startH + 1;
                        const fmt = (h: number) =>
                          `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${mStr}`;
                        return (
                          <button key={t} onClick={() => setSchedTime(t)}
                            className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-bold transition-all"
                            style={{
                              backgroundColor: isSelected ? accentBtnBg : (isReschedule ? "#fef3c7" : "#f0f4ff"),
                              color: isSelected ? "#fff" : (isReschedule ? "#92400e" : NAVY),
                              border: `1px solid ${isSelected ? accentBtnBg : (isReschedule ? "#fde68a" : "#c8d4ed")}`,
                              borderRadius: 2,
                            }}>
                            <Clock className="h-3.5 w-3.5 mb-0.5" style={{ opacity: isSelected ? 0.8 : 0.5 }} />
                            {`${fmt(startH)} – ${fmt(endH)} ${endH >= 12 ? "PM" : "AM"}`}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {schedTime && (
                    <p className="mt-3 text-[10px]" style={{ color: "#16a34a" }}>
                      ✓ Selected:{" "}
                      <span className="font-bold">
                        {(() => {
                          const [hStr, mStr] = schedTime.split(":");
                          const startH = parseInt(hStr, 10);
                          const endH   = startH + 1;
                          const fmt = (h: number) =>
                            `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${mStr}`;
                          return `${fmt(startH)} – ${fmt(endH)} ${endH >= 12 ? "PM" : "AM"}`;
                        })()}
                      </span>{" "}
                      · {new Date(schedDate + "T12:00:00").toLocaleDateString(undefined, {
                        month: "long", day: "numeric", year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid #e5e7eb", backgroundColor: "#f8faff" }}>
          <button onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
            style={{ color: "#6b7280", backgroundColor: "transparent", border: "1px solid #d1d5db", borderRadius: 2 }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = NAVY)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#d1d5db")}>
            Cancel
          </button>
          <button onClick={handleSaveSchedule}
            disabled={saving || !schedDate || !schedTime || (!isReschedule && missing.length > 0)}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: accentBtnBg, borderRadius: 2 }}
            onMouseEnter={e => {
              if (!(e.currentTarget as HTMLButtonElement).disabled)
                (e.currentTarget as HTMLElement).style.backgroundColor = accentHoverBg;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = accentBtnBg;
            }}>
            {saving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : isReschedule
                ? <RefreshCw className="h-3.5 w-3.5" />
                : <Calendar className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : isReschedule ? "Confirm Reschedule" : "Confirm Schedule"}
          </button>
        </div>
      </div>

      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  );
}