import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  X, FileText, FileImage, File, CheckCircle2, XCircle,
  AlertTriangle, Calendar, Clock, Loader2, Eye,
  ShieldCheck, ZoomIn, MessageSquare, Send, Info,
  AlertCircle, FileX, BadgeCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true,
  headers: { Accept: "application/json" },
});

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
function isPdf(filename: string) {
  return filename?.toLowerCase().endsWith(".pdf");
}

function DocTypeIcon({ filename }: { filename: string }) {
  if (!filename) return <File className="h-5 w-5" style={{ color: NAVY }} />;
  if (isPdf(filename)) return <FileText className="h-5 w-5" style={{ color: NAVY }} />;
  return <FileImage className="h-5 w-5" style={{ color: NAVY }} />;
}

// ─── Reply status config ───────────────────────────────────────────────────────
const REPLY_STATUS_CONFIG = {
  info: {
    label: "Info",
    icon: Info,
    bg: "#eff6ff",
    border: "#bfdbfe",
    color: "#1d4ed8",
    badgeBg: "#dbeafe",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    bg: "#fffbeb",
    border: "#fde68a",
    color: "#b45309",
    badgeBg: "#fef3c7",
  },
  missing: {
    label: "Missing Doc",
    icon: FileX,
    bg: "#fff1f2",
    border: "#fecdd3",
    color: "#be123c",
    badgeBg: "#ffe4e6",
  },
  approved: {
    label: "Approved",
    icon: BadgeCheck,
    bg: "#f0fdf4",
    border: "#bbf7d0",
    color: "#15803d",
    badgeBg: "#dcfce7",
  },
} as const;

// ─── Image lightbox ────────────────────────────────────────────────────────────
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={url}
        alt="Document preview"
        className="max-h-[90vh] max-w-[90vw] object-contain rounded"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Single document card ──────────────────────────────────────────────────────
function DocCard({
  doc,
  status,
  onApprove,
  onFlag,
  onZoom,
}: {
  doc: UploadedDoc;
  status: "approved" | "flagged" | null;
  onApprove: () => void;
  onFlag: () => void;
  onZoom: () => void;
}) {
  const isImg = !isPdf(doc.original_filename);

  const borderColor =
    status === "approved" ? "#bbf7d0" :
    status === "flagged"  ? "#fecdd3" :
    "#dde3ed";

  const bgColor =
    status === "approved" ? "#f0fdf4" :
    status === "flagged"  ? "#fff1f2" :
    "#f8faff";

  return (
    <div
      className="rounded-sm border overflow-hidden flex flex-col"
      style={{ borderColor, backgroundColor: bgColor, transition: "border-color 0.2s" }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: "#f0f4ff", borderBottom: "1px solid #dde3ed" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <DocTypeIcon filename={doc.original_filename} />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: NAVY }}>
              {doc.label}
            </p>
            <p className="text-[9px] text-gray-400 truncate">{doc.original_filename}</p>
          </div>
        </div>
        {status === "approved" && (
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 flex-shrink-0"
            style={{ backgroundColor: "#dcfce7", color: "#15803d", borderRadius: 2 }}>
            ✓ OK
          </span>
        )}
        {status === "flagged" && (
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 flex-shrink-0"
            style={{ backgroundColor: "#fecdd3", color: "#9f1239", borderRadius: 2 }}>
            ✗ Flagged
          </span>
        )}
      </div>

      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: 160, backgroundColor: "#e8eef8", cursor: isImg ? "zoom-in" : "default" }}
        onClick={isImg ? onZoom : undefined}
      >
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
              onClick={(e) => e.stopPropagation()}>
              Open PDF
            </a>
          </div>
        )}
      </div>

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

// ─── Reply bubble ──────────────────────────────────────────────────────────────
function ReplyBubble({ reply }: { reply: DocReply }) {
  const cfg = REPLY_STATUS_CONFIG[reply.status];
  const Icon = cfg.icon;
  const date = new Date(reply.created_at).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <div
      className="flex flex-col gap-1 rounded-sm px-3 py-2.5"
      style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: cfg.color }} />
          <span
            className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5"
            style={{ backgroundColor: cfg.badgeBg, color: cfg.color, borderRadius: 2 }}
          >
            {cfg.label}
          </span>
          {reply.user?.name && (
            <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
              {reply.user.name}
            </span>
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
  record,
  onClose,
  onScheduled,
}: DocumentInspectModalProps) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docStatus, setDocStatus] = useState<DocInspectStatus>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Replies state
  const [replies, setReplies] = useState<DocReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState<DocReply["status"]>("info");
  const [sendingReply, setSendingReply] = useState(false);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  // Schedule fields
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const requesterName =
    record.requester_name ??
    `${record.first_name ?? ""} ${record.surname ?? ""}`.trim();

  // ── Derive the document type slug and id for the replies endpoint ─────────────
  // Assumes record.document_type is like "barangay_certificate" and record.id is the doc id
  const docTypeSlug = record.document_type ?? "barangay_certificate";
  const docRecordId = record.id;

  // ── Fetch submitted documents ──────────────────────────────────────────────
  useEffect(() => {
    const fetchExistingDocuments = async () => {
      setLoadingDocs(true);
      try {
        const params: Record<string, any> = {};
        if (record.user_id) params.user_id = record.user_id;
        const { data } = await api.get("/api/mydocuments", { params });
        const flatDocs: UploadedDoc[] = [];
        const documents = data.data?.documents || {};
        Object.values(documents).forEach((categoryDocs: any) => {
          (categoryDocs as any[]).forEach((doc) => {
            flatDocs.push({
              id: doc.id,
              category: doc.category,
              type: doc.type,
              label: doc.label,
              original_filename: doc.original_filename,
              url:     doc.url     ?? `http://127.0.0.1:8000/uploads/${doc.original_filename}`,
              preview: doc.url     ?? `http://127.0.0.1:8000/uploads/${doc.original_filename}`,
            });
          });
        });
        setDocs(flatDocs);
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Could not load documents.", variant: "destructive" });
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchExistingDocuments();
  }, [record.user_id]);

  // ── Fetch replies ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchReplies = async () => {
      setLoadingReplies(true);
      try {
        const { data } = await api.get(`/api/documents/${docTypeSlug}/${docRecordId}/replies`);
        setReplies(data.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingReplies(false);
      }
    };
    fetchReplies();
  }, [docTypeSlug, docRecordId]);

  // Auto-scroll replies to bottom when new ones arrive
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  // ── Generate fixed hourly slots (8am-12pm, 1pm-5pm) whenever date changes ─────
  // No API call needed — slots are fixed office hours excluding lunch (12-1pm).
  // Taken slots are fetched from the backend and filtered out client-side.
  useEffect(() => {
    if (!schedDate) return;
    const ALL_SLOTS = [
      "08:00", "09:00", "10:00", "11:00",
      "13:00", "14:00", "15:00", "16:00",
    ];
    const fetchTaken = async () => {
      setLoadingSlots(true);
      setSchedTime("");
      try {
        const { data } = await api.get("/api/schedules/available-slots", {
          params: { document_type: docTypeSlug, date: schedDate },
        });
        // Backend returns available slots — intersect with our fixed set
        // If backend returns empty or errors, fall back to all slots
        const backendSlots: string[] = data.data ?? [];
        const filtered = backendSlots.length > 0
          ? ALL_SLOTS.filter((s) => backendSlots.includes(s))
          : ALL_SLOTS;
        setAvailableSlots(filtered);
      } catch {
        // On error just show all fixed slots
        setAvailableSlots(ALL_SLOTS);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchTaken();
  }, [schedDate, docTypeSlug]);

  // ── Send reply ─────────────────────────────────────────────────────────────
  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    setSendingReply(true);
    try {
      const { data } = await api.post(`/api/documents/${docTypeSlug}/${docRecordId}/replies`, {
        message: replyMessage.trim(),
        status: replyStatus,
      });
      setReplies((prev) => [...prev, data.data]);
      setReplyMessage("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Could not send remark.",
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  };

  // ── Inspect helpers ──────────────────────────────────────────────────────────
  const setStatus = (id: number, s: "approved" | "flagged") => {
    setDocStatus((prev) => ({ ...prev, [id]: prev[id] === s ? null : s }));
  };

  const allApproved   = docs.length > 0 && docs.every((d) => docStatus[d.id] === "approved");
  const anyFlagged    = docs.some((d) => docStatus[d.id] === "flagged");
  const reviewedCount = docs.filter((d) => docStatus[d.id] != null).length;

  // ── Save schedule ─────────────────────────────────────────────────────────────
  // POST /api/schedules → ScheduleController@store
  // Required: document_type, document_number, schedule_date, schedule_time
  // user_id is resolved server-side via auth(); do NOT send it from the frontend
  const handleSaveSchedule = async () => {
    if (!schedDate) {
      toast({ title: "Required", description: "Please pick a date.", variant: "destructive" });
      return;
    }
    if (!schedTime) {
      toast({ title: "Required", description: "Please select an available time slot.", variant: "destructive" });
      return;
    }
    if (anyFlagged) {
      toast({ title: "Flagged documents", description: "Resolve flagged documents before scheduling.", variant: "destructive" });
      return;
    }
    if (!record.bcert_number) {
      toast({ title: "Error", description: "Missing document number (BCert No.).", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/schedules", {
        document_type:   docTypeSlug,
        document_number: record.bcert_number,
        schedule_date:   schedDate,
        schedule_time:   schedTime,
      });
      const friendlyTime = new Date(`1970-01-01T${schedTime}:00`).toLocaleTimeString(undefined, {
        hour: "numeric", minute: "2-digit",
      });
      const friendlyDate = new Date(schedDate).toLocaleDateString(undefined, {
        month: "long", day: "numeric", year: "numeric",
      });
      toast({ title: "Schedule confirmed!", description: `Pickup set for ${friendlyDate} at ${friendlyTime}.` });
      onScheduled?.();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to save schedule.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: "rgba(10,20,50,0.6)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl overflow-hidden"
        style={{ width: "min(680px, 100vw)", borderLeft: `3px solid ${PINK}` }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-start justify-between px-6 py-4 flex-shrink-0"
          style={{ backgroundColor: "#f8faff", borderBottom: "1px solid #dde3ed" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div style={{ width: 14, height: 2, backgroundColor: PINK }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: PINK }}>
                Document Inspection
              </p>
            </div>
            <h2 className="font-bold text-lg" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>
              {requesterName || "—"}
            </h2>
            {record.bcert_number && (
              <p className="text-xs text-gray-500 mt-0.5">
                <span className="font-bold" style={{ color: PINK }}>BCert No.: </span>
                {record.bcert_number}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-sm transition-colors mt-0.5"
            style={{ color: "#9ca3af" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = NAVY)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9ca3af")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Section: Document Review ── */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#f0f4ff", borderRadius: 1 }}>
                <Eye className="h-3.5 w-3.5" style={{ color: NAVY }} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: NAVY }}>
                Submitted Documents
              </p>
              <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              {docs.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 flex-shrink-0"
                  style={{
                    backgroundColor: allApproved ? "#dcfce7" : "#fefce8",
                    color: allApproved ? "#15803d" : "#92400e",
                    borderRadius: 2,
                    border: `1px solid ${allApproved ? "#86efac" : "#fde68a"}`,
                  }}>
                  {reviewedCount}/{docs.length} reviewed
                </span>
              )}
            </div>

            {loadingDocs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: NAVY }} />
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 rounded-sm"
                style={{ backgroundColor: "#f8faff", border: "1px dashed #c8d4ed" }}>
                <AlertTriangle className="h-8 w-8 mb-2" style={{ color: "#ca8a04" }} />
                <p className="text-sm font-semibold" style={{ color: NAVY }}>No documents uploaded</p>
                <p className="text-xs text-gray-400 mt-1">
                  This applicant has not submitted any supporting documents yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {docs.map((doc) => (
                  <DocCard
                    key={doc.id}
                    doc={doc}
                    status={docStatus[doc.id] ?? null}
                    onApprove={() => setStatus(doc.id, "approved")}
                    onFlag={() => setStatus(doc.id, "flagged")}
                    onZoom={() => setLightboxUrl(doc.preview)}
                  />
                ))}
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

            {allApproved && (
              <div className="mt-3 px-3 py-2.5 flex items-center gap-2 rounded-sm"
                style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: "#16a34a" }} />
                <p className="text-xs font-semibold" style={{ color: "#15803d" }}>
                  All documents verified. Ready to schedule.
                </p>
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, backgroundColor: "#e5e7eb", margin: "0 24px" }} />

          {/* ── Section: Replies / Remarks ── */}
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

            {/* Replies list */}
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
                replies.map((reply) => <ReplyBubble key={reply.id} reply={reply} />)
              )}
              <div ref={repliesEndRef} />
            </div>

            {/* Compose reply */}
            <div
              className="rounded-sm overflow-hidden"
              style={{ border: "1px solid #dde3ed", backgroundColor: "#f8faff" }}
            >
              {/* Status type selector */}
              <div
                className="flex items-center gap-1 px-3 py-2"
                style={{ borderBottom: "1px solid #dde3ed", backgroundColor: "#f0f4ff" }}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider mr-1" style={{ color: "#9ca3af" }}>
                  Type:
                </span>
                {(Object.keys(REPLY_STATUS_CONFIG) as DocReply["status"][]).map((s) => {
                  const cfg = REPLY_STATUS_CONFIG[s];
                  const isActive = replyStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setReplyStatus(s)}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        backgroundColor: isActive ? cfg.badgeBg : "transparent",
                        color: isActive ? cfg.color : "#9ca3af",
                        border: `1px solid ${isActive ? cfg.border : "transparent"}`,
                        borderRadius: 2,
                      }}
                    >
                      <cfg.icon className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Message input row */}
              <div className="flex items-end gap-2 p-2.5">
                <textarea
                  rows={2}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendReply();
                  }}
                  placeholder={
                    replyStatus === "missing"
                      ? "e.g. Please resubmit your valid government-issued ID."
                      : replyStatus === "warning"
                      ? "e.g. Your barangay clearance appears expired."
                      : replyStatus === "approved"
                      ? "e.g. All documents have been verified and accepted."
                      : "Add a remark or instruction for the applicant…"
                  }
                  className="flex-1 px-3 py-2 text-sm border rounded-sm outline-none resize-none transition-all"
                  style={{ borderColor: "#dde3ed", backgroundColor: "#fff", color: NAVY, minHeight: 56 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = NAVY)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#dde3ed")}
                />
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  style={{ backgroundColor: NAVY, borderRadius: 2, height: 56 }}
                  title="Send (Ctrl+Enter)"
                >
                  {sendingReply
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                </button>
              </div>

              <p className="px-3 pb-2 text-[9px] text-gray-400">
                Ctrl+Enter to send · The applicant will be notified of this remark.
              </p>
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, backgroundColor: "#e5e7eb", margin: "0 24px" }} />

          {/* ── Section: Set Schedule ── */}
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#f0f4ff", borderRadius: 1 }}>
                <Calendar className="h-3.5 w-3.5" style={{ color: NAVY }} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: NAVY }}>
                Set Pickup Schedule
              </p>
              <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
            </div>

            {/* Existing schedule notice */}
            {record.scheduled_date && (
              <div className="mb-4 px-3 py-2.5 flex items-center gap-2 rounded-sm"
                style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <Clock className="h-4 w-4 shrink-0" style={{ color: "#2563eb" }} />
                <p className="text-xs" style={{ color: "#1e40af" }}>
                  <span className="font-bold">Current schedule: </span>
                  {new Date(record.scheduled_date).toLocaleString(undefined, {
                    dateStyle: "long", timeStyle: "short",
                  })}
                </p>
              </div>
            )}

            <div className="space-y-4">

              {/* Step 1 — Pick date */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: PINK }}>
                  Pickup Date <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <input
                  type="date"
                  min={today}
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-sm outline-none transition-all"
                  style={{ borderColor: "#dde3ed", backgroundColor: "#f8faff", color: NAVY }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = NAVY)}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#dde3ed")}
                />
              </div>

              {/* Step 2 — Hourly slots, lunch excluded (shown after date is picked) */}
              {schedDate && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: PINK }}>
                      Available Time Slots <span style={{ color: "#e11d48" }}>*</span>
                    </label>
                    {loadingSlots && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: NAVY }} />
                    )}
                  </div>
                  <p className="text-[9px] text-gray-400 mb-3">
                    Office hours 8:00 AM – 5:00 PM · Lunch break 12:00 – 1:00 PM excluded
                  </p>

                  {!loadingSlots && availableSlots.length === 0 && (
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 rounded-sm"
                      style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#ea580c" }} />
                      <p className="text-xs font-medium" style={{ color: "#9a3412" }}>
                        No available slots for this date. Please pick another day.
                      </p>
                    </div>
                  )}

                  {!loadingSlots && availableSlots.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {availableSlots.map((t) => {
                        const isSelected = schedTime === t;
                        // Build "8:00 – 9:00 AM" range label
                        const [hStr, mStr] = t.split(":");
                        const startH = parseInt(hStr, 10);
                        const endH   = startH + 1;
                        const fmt = (h: number) =>
                          `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${mStr}`;
                        const period = endH >= 12 ? "PM" : "AM";
                        const rangeLabel = `${fmt(startH)} – ${fmt(endH)} ${period}`;
                        return (
                          <button
                            key={t}
                            onClick={() => setSchedTime(t)}
                            className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-bold transition-all"
                            style={{
                              backgroundColor: isSelected ? NAVY : "#f0f4ff",
                              color: isSelected ? "#fff" : NAVY,
                              border: `1px solid ${isSelected ? NAVY : "#c8d4ed"}`,
                              borderRadius: 2,
                            }}
                          >
                            <Clock className="h-3.5 w-3.5 mb-0.5" style={{ opacity: isSelected ? 0.8 : 0.5 }} />
                            {rangeLabel}
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
                          const fmt = (h: number) => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${mStr}`;
                          return `${fmt(startH)} – ${fmt(endH)} ${endH >= 12 ? "PM" : "AM"}`;
                        })()}
                      </span>{" "}
                      · {new Date(schedDate + "T12:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid #e5e7eb", backgroundColor: "#f8faff" }}
        >
          <button onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
            style={{ color: "#6b7280", backgroundColor: "transparent", border: "1px solid #d1d5db", borderRadius: 2 }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = NAVY)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#d1d5db")}
          >
            Cancel
          </button>

          <button onClick={handleSaveSchedule}
            disabled={saving || !schedDate || !schedTime}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: NAVY, borderRadius: 2 }}
            onMouseEnter={(e) => {
              if (!(e.currentTarget as HTMLButtonElement).disabled)
                (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c";
            }}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = NAVY)}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : "Confirm Schedule"}
          </button>
        </div>
      </div>

      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  );
}