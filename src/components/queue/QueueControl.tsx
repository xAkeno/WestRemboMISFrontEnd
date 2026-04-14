import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Serviceable {
  id: number;
  service_type: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  [key: string]: unknown;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  service_type: string;
  status: string;
  priority: string;
  position?: number;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  released_at: string | null;
  in_progress_at: string | null;
  processed_by: string | null;
  requester_id: number | null;
  serviceable: Serviceable | null;
  missed_attempts?: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_MS       = 10_000;
const GRACE_SECONDS = 5 * 60;
const MAX_MISSED    = 3;

// ─── Normalize ────────────────────────────────────────────────────────────────

const normalizeStatus = (s: string) => s.toLowerCase().replace(/\s+/g, "_");

// ─── Style maps ───────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  waiting:     { bg: "#E6F1FB", color: "#0C447C" },
  pending:     { bg: "#FAEEDA", color: "#633806" },
  processing:  { bg: "#FAEEDA", color: "#633806" },
  completed:   { bg: "#EAF3DE", color: "#27500A" },
  released:    { bg: "#EAF3DE", color: "#085041" },
  approved:    { bg: "#E1F5EE", color: "#085041" },
  rejected:    { bg: "#FCEBEB", color: "#791F1F" },
  no_show:     { bg: "#FCEBEB", color: "#791F1F" },
  in_progress: { bg: "#FBEAF0", color: "#72243E" },
  late:        { bg: "#FCEBEB", color: "#501313" },
};

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  normal:   { bg: "#F1EFE8", color: "#5F5E5A" },
  priority: { bg: "#FBEAF0", color: "#72243E" },
  senior:   { bg: "#E1F5EE", color: "#085041" },
  pwd:      { bg: "#FAECE7", color: "#712B13" },
};

const statusStyle   = (s: string) => STATUS_STYLE[normalizeStatus(s)]   ?? { bg: "#F1EFE8", color: "#5F5E5A" };
const priorityStyle = (p: string) => PRIORITY_STYLE[p.toLowerCase()]    ?? { bg: "#F1EFE8", color: "#5F5E5A" };

// ─── Requester type ───────────────────────────────────────────────────────────

const getRequesterType = (t: Ticket): { label: string; bg: string; color: string } => {
  if (t.serviceable !== null && t.requester_id === null)
    return { label: "Walk-in", bg: "#E1F5EE", color: "#085041" };
  if (t.requester_id !== null && t.serviceable === null)
    return { label: "Online", bg: "#E6F1FB", color: "#0C447C" };
  return { label: "Unknown", bg: "#F1EFE8", color: "#5F5E5A" };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtTime = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
};

const getApplicantName = (t: Ticket) => {
  if (t.serviceable) {
    const { first_name, middle_name, last_name } = t.serviceable;
    return [first_name, middle_name, last_name].filter(Boolean).join(" ");
  }
  return "—";
};

// FIX: "late" moved out of DONE and into ACTIVE so late tickets appear in the queue
const DONE_STATUSES   = ["released", "completed", "rejected", "no_show"];
const ACTIVE_STATUSES = ["pending", "waiting", "called", "processing", "in_progress", "late"];

const isDone       = (t: Ticket) => DONE_STATUSES.includes(normalizeStatus(t.status));
const isActive     = (t: Ticket) => ACTIVE_STATUSES.includes(normalizeStatus(t.status));
const isLate       = (t: Ticket) => normalizeStatus(t.status) === "late";
const isProcessing = (t: Ticket) =>
  ["called", "processing", "in_progress"].includes(normalizeStatus(t.status));

// ─── Sort queue ───────────────────────────────────────────────────────────────

const getSortedQueueWithDisplayStatus = (tickets: Ticket[]) => {
  const queueTickets = tickets.filter(t => !isDone(t));
  const sorted = [...queueTickets].sort((a, b) => {
    // Late tickets always sort to the bottom
    const aLate = isLate(a) ? 1 : 0;
    const bLate = isLate(b) ? 1 : 0;
    if (aLate !== bLate) return aLate - bLate;

    // Currently being served goes first
    const ap = isProcessing(a) ? 0 : 1;
    const bp = isProcessing(b) ? 0 : 1;
    if (ap !== bp) return ap - bp;

    // Sort by position — backend updates this on every move-to-back and re-admit
    const aPos = a.position ?? 999999;
    const bPos = b.position ?? 999999;
    return aPos - bPos;
  });
  // Find the first non-late, non-processing ticket to label as "Pending"
  let pendingAssigned = false;
  return sorted.map((t) => {
    if (isLate(t))       return { ...t, _displayStatus: "Late" };
    if (isProcessing(t)) return { ...t, _displayStatus: t.status };
    if (!pendingAssigned) {
      pendingAssigned = true;
      return { ...t, _displayStatus: "Pending" };
    }
    return { ...t, _displayStatus: "Waiting" };
  });
};

// ─── API ──────────────────────────────────────────────────────────────────────

const getQueue      = async () => { const res = await api.get("api/tickets/pending", { params: { per_page: 50 } }); return res.data; };
const patchStatus   = async (id: number, status: string) => { const res = await api.patch(`api/tickets/${id}/status`, { status }); return res.data; };
const postMoveBack  = async (id: number) => { const res = await api.post(`api/tickets/${id}/move-back`); return res.data; };
const postCallNext  = async () => { const res = await api.post(`api/tickets/call-next`); return res.data; };
const postRequeue   = async (id: number) => { const res = await api.post(`api/tickets/${id}/requeue-late`); return res.data; };

// ─── Shared styles ────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "var(--color-background-primary,#fff)",
  border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
  borderRadius: 12, padding: 16,
};

const sectionDivider: React.CSSProperties = {
  paddingBottom: 12, marginBottom: 12,
  borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.10))",
};

const metaRow: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  fontSize: 12, padding: "5px 0",
  borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.07))",
};

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500,
      background: style.bg, color: style.color, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ─── Grace Timer ──────────────────────────────────────────────────────────────

function GraceTimer({ secondsLeft, missedAttempts }: { secondsLeft: number; missedAttempts: number }) {
  const pct     = Math.max(0, secondsLeft / GRACE_SECONDS);
  const mins    = Math.floor(secondsLeft / 60);
  const secs    = secondsLeft % 60;
  const urgent  = secondsLeft <= 60;
  const warning = secondsLeft <= 120 && !urgent;
  const color   = urgent ? "#A32D2D" : warning ? "#854F0B" : "#185FA5";
  const bgColor = urgent ? "#FCEBEB" : warning ? "#FAEEDA" : "#E6F1FB";

  return (
    <div style={{
      background: bgColor, border: `0.5px solid ${color}`,
      borderRadius: 10, padding: "12px 16px", marginBottom: 14, textAlign: "center",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color, marginBottom: 8 }}>
        Grace Period{missedAttempts > 0 ? ` · Attempt ${missedAttempts + 1}/${MAX_MISSED}` : ""}
      </div>
      <div style={{ fontSize: 40, fontWeight: 700, color, lineHeight: 1, marginBottom: 10, fontVariantNumeric: "tabular-nums" }}>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
      <div style={{ height: 5, background: "rgba(0,0,0,0.1)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct * 100}%`,
          background: color, borderRadius: 99,
          transition: "width 1s linear",
        }} />
      </div>
      {urgent && (
        <div style={{ fontSize: 11, color, marginTop: 6, fontWeight: 500 }}>
          {secondsLeft <= 0 ? "⚠ Time's up — auto action firing…" : "⚠ Almost out of time"}
        </div>
      )}
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({ label, onClick, disabled, variant }: {
  label: string; onClick: () => void; disabled?: boolean;
  variant: "success" | "danger" | "warning" | "primary" | "outline" | "info";
}) {
  const V = {
    success: { bg: "#3B6D11", color: "#EAF3DE", border: "#3B6D11" },
    danger:  { bg: "#A32D2D", color: "#FCEBEB", border: "#A32D2D" },
    warning: { bg: "#854F0B", color: "#FAEEDA", border: "#854F0B" },
    primary: { bg: "#185FA5", color: "#E6F1FB", border: "#185FA5" },
    outline: { bg: "transparent", color: "var(--color-text-primary)", border: "rgba(0,0,0,0.18)" },
    info:    { bg: "#534AB7", color: "#EEEDFE", border: "#534AB7" },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "10px 0", borderRadius: 8,
      fontSize: 13, fontWeight: 500,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      background: V.bg, color: V.color, border: `0.5px solid ${V.border}`,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      transition: "opacity 0.15s",
    }}>
      {label}
    </button>
  );
}

// ─── Icon button ──────────────────────────────────────────────────────────────

function IconBtn({ label, title, onClick, color }: {
  label: string; title: string; onClick: () => void; color?: string;
}) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 28, height: 28, borderRadius: 6, cursor: "pointer",
      border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
      background: "none", fontSize: 13,
      color: color ?? "var(--color-text-secondary)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {label}
    </button>
  );
}

// ─── Late Banner ──────────────────────────────────────────────────────────────

function LateBanner({ ticket, onRequeue, busy }: {
  ticket: Ticket; onRequeue: (t: Ticket) => void; busy: string | null;
}) {
  return (
    <div style={{
      background: "#FCEBEB",
      border: "0.5px solid #A32D2D",
      borderRadius: 10, padding: "12px 16px", marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#791F1F" }}>
            {ticket.ticket_number} — Late
          </div>
          <div style={{ fontSize: 12, color: "#A32D2D", marginTop: 2 }}>
            {getApplicantName(ticket)} · {ticket.missed_attempts}× missed
          </div>
        </div>
        <button
          disabled={!!busy}
          onClick={() => onRequeue(ticket)}
          style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.5 : 1,
            background: "#534AB7", color: "#EEEDFE",
            border: "0.5px solid #534AB7", whiteSpace: "nowrap",
          }}
        >
          ↺ Re-admit
        </button>
      </div>
    </div>
  );
}

// ─── Ticket Detail ────────────────────────────────────────────────────────────

function TicketDetail({ ticket, onClose, onAct, onRequeue, busy }: {
  ticket: Ticket & { _displayStatus?: string };
  onClose: () => void;
  onAct: (t: Ticket, action: string) => void;
  onRequeue: (t: Ticket) => void;
  busy: string | null;
}) {
  const ns            = normalizeStatus(ticket.status);
  const rt            = getRequesterType(ticket);
  const displayStatus = (ticket as any)._displayStatus ?? ticket.status;
  const ticketIsLate  = ns === "late";

  return (
    <div style={{ ...cardStyle, border: "0.5px solid #378ADD" }}>
      <div style={{ ...sectionDivider, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>{ticket.ticket_number}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <Pill label={displayStatus}   style={statusStyle(displayStatus)} />
            <Pill label={ticket.priority} style={priorityStyle(ticket.priority)} />
            <Pill label={rt.label}        style={{ bg: rt.bg, color: rt.color }} />
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-tertiary)", padding: 4 }}>✕</button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 6 }}>Applicant</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{getApplicantName(ticket)}</div>
        {ticket.serviceable && <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{ticket.serviceable.service_type}</div>}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 6 }}>Timeline</div>
        {[
          { label: "Submitted",   value: fmtDate(ticket.submitted_at) },
          { label: "In Progress", value: fmtDate(ticket.in_progress_at) },
          { label: "Approved",    value: fmtDate(ticket.approved_at) },
          { label: "Released",    value: fmtDate(ticket.released_at) },
          { label: "Rejected",    value: fmtDate(ticket.rejected_at) },
        ].map(row => (
          <div key={row.label} style={metaRow}>
            <span style={{ color: "var(--color-text-secondary)" }}>{row.label}</span>
            <span style={{ fontWeight: row.value !== "—" ? 500 : 400, color: row.value !== "—" ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>{row.value}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 6 }}>Details</div>
        {[
          { label: "Type",         value: rt.label },
          { label: "Service Type", value: ticket.service_type },
          { label: "Processed By", value: ticket.processed_by ?? "—" },
          { label: "Last Updated", value: fmtDate(ticket.updated_at) },
        ].map(row => (
          <div key={row.label} style={metaRow}>
            <span style={{ color: "var(--color-text-secondary)" }}>{row.label}</span>
            <span style={{ fontWeight: 500 }}>{String(row.value)}</span>
          </div>
        ))}
        {(ticket.missed_attempts ?? 0) > 0 && (
          <div style={metaRow}>
            <span style={{ color: "#A32D2D" }}>Missed Attempts</span>
            <span style={{ fontWeight: 600, color: "#A32D2D" }}>{ticket.missed_attempts}×</span>
          </div>
        )}
      </div>

      {/* Late ticket — show re-admit button */}
      {ticketIsLate && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: "#A32D2D", marginBottom: 8, padding: "8px 12px", background: "#FCEBEB", borderRadius: 8, border: "0.5px solid #F09595" }}>
            This ticket was marked late after {ticket.missed_attempts} missed calls. Re-admit if the applicant has arrived.
          </div>
          <ActionBtn label="↺ Re-admit to Queue" variant="info" disabled={!!busy} onClick={() => onRequeue(ticket)} />
        </div>
      )}

      {/* Active (non-late) ticket actions */}
      {(isProcessing(ticket) || ns === "waiting" || ns === "pending") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <ActionBtn label="✓ Complete" variant="success" disabled={!!busy} onClick={() => onAct(ticket, "completed")} />
            <ActionBtn label="✕ No Show"  variant="danger"  disabled={!!busy} onClick={() => onAct(ticket, "no_show")} />
          </div>
          <ActionBtn label="↩ Move to Back (missed)" variant="warning" disabled={!!busy} onClick={() => onAct(ticket, "move_back")} />
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function QueueControl() {
  const [tickets,       setTickets]       = useState<Ticket[]>([]);
  const [busy,          setBusy]          = useState<string | null>(null);
  const [filter,        setFilter]        = useState("all");
  const [search,        setSearch]        = useState("");
  const [selected,      setSelected]      = useState<Ticket | null>(null);
  const [log,           setLog]           = useState<{ msg: string; type: string; time: string }[]>([]);
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [calling,       setCalling]       = useState(false);
  const [graceSeconds,  setGraceSeconds]  = useState<number>(GRACE_SECONDS);
  const [graceTicketId, setGraceTicketId] = useState<number | null>(null);
  const graceRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoActFired = useRef<boolean>(false);

  const sortedQueueWithDisplay = getSortedQueueWithDisplayStatus(tickets);
  const activeQueue            = sortedQueueWithDisplay.filter(t => !isLate(t));
  const lateTickets            = sortedQueueWithDisplay.filter(t => isLate(t));
  const calledTicket           = activeQueue[0] ?? null;
  const waitingCount           = activeQueue.filter(t => (t as any)._displayStatus === "Waiting").length;
  const processingCount        = activeQueue.filter(t => isProcessing(t)).length;
  const doneCount              = tickets.filter(t => isDone(t)).length;

  const breakdown: Record<string, number> = {};
  activeQueue.forEach(t => { breakdown[t.service_type] = (breakdown[t.service_type] ?? 0) + 1; });
  const bTotal = Math.max(Object.values(breakdown).reduce((a, b) => a + b, 0), 1);

  const addLog = useCallback((msg: string, type = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLog(prev => [{ msg, type, time }, ...prev].slice(0, 60));
  }, []);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await getQueue();
      console.log("Fetched queue data:", res);
      setTickets(res.data ?? res);
    } catch { /* keep last state */ }
  }, []);

  useEffect(() => {
    load();
    addLog("Admin panel ready", "info");
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load, addLog]);

  useEffect(() => {
    if (selected) {
      const fresh = tickets.find(t => t.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }, [tickets]);

  // ── Grace timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!calledTicket) {
      if (graceRef.current) clearInterval(graceRef.current);
      setGraceTicketId(null);
      setGraceSeconds(GRACE_SECONDS);
      autoActFired.current = false;
      return;
    }

    // ✅ NEW: If the ticket is already being processed, stop/clear the timer
    if (isProcessing(calledTicket)) {
      if (graceRef.current) clearInterval(graceRef.current);
      setGraceTicketId(null);
      setGraceSeconds(GRACE_SECONDS);
      autoActFired.current = false;
      return;
    }

    if (calledTicket.id === graceTicketId) return;

    if (graceRef.current) clearInterval(graceRef.current);
    autoActFired.current = false;
    setGraceTicketId(calledTicket.id);
    setGraceSeconds(GRACE_SECONDS);

    graceRef.current = setInterval(() => {
      setGraceSeconds(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => { if (graceRef.current) clearInterval(graceRef.current); };
  }, [calledTicket?.id, calledTicket?.status]); // ✅ Also watch status changes

  // ── Auto-call next when nothing is being served and queue has pending ─────
  const autoCallFired = useRef<boolean>(false);

  useEffect(() => {
    // Already serving someone — reset guard
    if (calledTicket) {
      autoCallFired.current = false;
      return;
    }

    const hasPending = activeQueue.some(t => {
      const ns = normalizeStatus(t.status);
      return ns === "pending" || ns === "waiting";
    });

    if (!hasPending || autoCallFired.current) return;

    autoCallFired.current = true;
    addLog("No active ticket — auto-calling next", "info");

    postCallNext()
      .then(load)
      .catch(() => {
        autoCallFired.current = false;
        addLog("Auto-call failed", "error");
      });
  }, [calledTicket?.id, activeQueue.length]);

  // ── Auto-act when timer hits 0 ────────────────────────────────────────────
  useEffect(() => {
    if (graceSeconds !== 0) return;
    if (!graceTicketId) return;
    if (autoActFired.current) return;
    if (calledTicket?.id !== graceTicketId) return;

    autoActFired.current = true;
    if (graceRef.current) clearInterval(graceRef.current);

    // Always move to back — backend decides if this becomes 'late' after MAX_MISSED
    const missedAttempts = (calledTicket.missed_attempts ?? 0) + 1;
    addLog(`${calledTicket.ticket_number} → Grace expired, moving to back (miss #${missedAttempts})`, "warn");
    showToast(`${calledTicket.ticket_number} missed grace — moved to back`, false);
    postMoveBack(calledTicket.id).then(load).catch(() => showToast("Failed", false));
  }, [graceSeconds]);

  // ── Act ───────────────────────────────────────────────────────────────────
  async function act(ticket: Ticket, action: string) {
    setBusy(ticket.id + action);
    const labels: Record<string, string> = {
      completed: "Completed", no_show: "Marked no show",
      move_back: "Moved to back", released: "Released",
      approved: "Approved", rejected: "Rejected",
    };
    try {
      if (action === "move_back") await postMoveBack(ticket.id);
      else await patchStatus(ticket.id, action);

      const msg = `${ticket.ticket_number} → ${labels[action] ?? action}`;
      showToast(msg, true);
      addLog(msg, "success");

      if (ticket.id === graceTicketId) {
        if (graceRef.current) clearInterval(graceRef.current);
        setGraceSeconds(GRACE_SECONDS);
        setGraceTicketId(null);
        autoActFired.current = false;
      }

      await load();
    } catch {
      showToast("Action failed", false);
      addLog(`Failed: ${action} on ${ticket.ticket_number}`, "error");
    } finally {
      setBusy(null);
    }
  }

  // ── Re-admit late ticket ──────────────────────────────────────────────────
  async function requeue(ticket: Ticket) {
    setBusy(ticket.id + "requeue");
    try {
      await postRequeue(ticket.id);
      const msg = `${ticket.ticket_number} → Re-admitted to queue`;
      showToast(msg, true);
      addLog(msg, "success");
      await load();
    } catch {
      showToast("Re-admit failed", false);
      addLog(`Failed: requeue on ${ticket.ticket_number}`, "error");
    } finally {
      setBusy(null);
    }
  }

  const allDisplayStatuses = Array.from(new Set(
    sortedQueueWithDisplay.map(t => normalizeStatus((t as any)._displayStatus ?? t.status))
  ));

  const filtered = sortedQueueWithDisplay.filter(t => {
    const ds = normalizeStatus((t as any)._displayStatus ?? t.status);
    const mf = filter === "all" || ds === filter;
    const ms = !search
      || t.ticket_number.toLowerCase().includes(search.toLowerCase())
      || t.service_type.toLowerCase().includes(search.toLowerCase())
      || getApplicantName(t).toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const logColor: Record<string, string> = {
    info: "var(--color-text-secondary)", success: "#3B6D11", error: "#A32D2D", warn: "#854F0B",
  };

  return (
    <div style={{ fontFamily: "var(--font-sans,system-ui)", color: "var(--color-text-primary,#111)", position: "relative" }}>

      {toast && (
        <div style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 9999,
          background: "var(--color-background-primary,#fff)",
          border: `0.5px solid ${toast.ok ? "#3B6D11" : "#A32D2D"}`,
          borderRadius: 8, padding: "10px 16px", fontSize: 13,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 320px 300px" : "1fr 300px", gap: 16, padding: 16 }}>

        {/* ══ LEFT ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={cardStyle}>
            <div style={{ ...sectionDivider, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 500 }}>Queue Admin</span>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3B6D11", display: "inline-block" }} />
              </div>
              <ActionBtn
                label={calling ? "Calling…" : "▶  Call Next"}
                variant="primary"
                disabled={calling || activeQueue.length === 0}
                onClick={handleCallNext}
              />
            </div>

            {/* Metrics */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Waiting",    value: waitingCount },
                { label: "Processing", value: processingCount },
                { label: "Done Today", value: doneCount },
                { label: "Late",       value: lateTickets.length },
              ].map(m => (
                <div key={m.label} style={{
                  flex: 1,
                  background: m.label === "Late" && m.value > 0 ? "#FCEBEB" : "var(--color-background-secondary,#f5f5f3)",
                  borderRadius: 8, padding: "10px 12px",
                }}>
                  <div style={{ fontSize: 11, color: m.label === "Late" && m.value > 0 ? "#A32D2D" : "var(--color-text-secondary)", marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 500, color: m.label === "Late" && m.value > 0 ? "#A32D2D" : "inherit" }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Grace timer */}
            {calledTicket && graceTicketId === calledTicket.id && (
              <GraceTimer secondsLeft={graceSeconds} missedAttempts={calledTicket.missed_attempts ?? 0} />
            )}

            {/* Now Serving */}
            <div style={{
              background: "var(--color-background-secondary,#f5f5f3)",
              border: "0.5px solid var(--color-border-secondary,rgba(0,0,0,0.18))",
              borderRadius: 10, padding: "20px 16px", textAlign: "center", marginBottom: 14,
            }}>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 10 }}>
                Now Serving
              </div>
              <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1, letterSpacing: -3 }}>
                {calledTicket?.ticket_number ?? "---"}
              </div>
              {calledTicket ? (() => {
                const rt            = getRequesterType(calledTicket);
                const displayStatus = (calledTicket as any)._displayStatus ?? calledTicket.status;
                return (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
                      <Pill label={displayStatus}         style={statusStyle(displayStatus)} />
                      <Pill label={calledTicket.priority} style={priorityStyle(calledTicket.priority)} />
                      <Pill label={rt.label}              style={{ bg: rt.bg, color: rt.color }} />
                      {(calledTicket.missed_attempts ?? 0) > 0 && (
                        <Pill label={`${calledTicket.missed_attempts}× missed`} style={{ bg: "#FCEBEB", color: "#791F1F" }} />
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{getApplicantName(calledTicket)}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>{calledTicket.service_type}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>Submitted {fmtTime(calledTicket.submitted_at)}</div>
                  </div>
                );
              })() : (
                <div style={{ marginTop: 10, fontSize: 13, color: "var(--color-text-tertiary)" }}>No ticket currently being served</div>
              )}
            </div>

            {calledTicket ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <ActionBtn label="✓  Complete" variant="success" disabled={!!busy} onClick={() => act(calledTicket, "completed")} />
                  <ActionBtn label="✕  No Show"  variant="danger"  disabled={!!busy} onClick={() => act(calledTicket, "no_show")} />
                </div>
                <ActionBtn label="↩  Move to Back (missed attempt)" variant="warning" disabled={!!busy} onClick={() => act(calledTicket, "move_back")} />
              </div>
            ) : (
              <div style={{ textAlign: "center", fontSize: 13, color: "var(--color-text-tertiary)", padding: "10px 0", border: "0.5px dashed var(--color-border-tertiary,rgba(0,0,0,0.12))", borderRadius: 8 }}>
                No tickets in queue
              </div>
            )}
          </div>

          {/* Late Tickets Section */}
          {lateTickets.length > 0 && (
            <div style={{ ...cardStyle, border: "0.5px solid #F09595" }}>
              <div style={{ ...sectionDivider, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: "#791F1F" }}>Late Arrivals</span>
                <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#FCEBEB", color: "#A32D2D", fontWeight: 500 }}>
                  {lateTickets.length}
                </span>
                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginLeft: 4 }}>
                  — Re-admit if the applicant has arrived
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lateTickets.map(t => (
                  <LateBanner key={t.id} ticket={t} onRequeue={requeue} busy={busy} />
                ))}
              </div>
            </div>
          )}

          {/* Queue List */}
          <div style={cardStyle}>
            <div style={{ ...sectionDivider, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Queue List</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search ticket, name, type…"
                style={{
                  padding: "5px 10px", fontSize: 12, width: 180,
                  border: "0.5px solid var(--color-border-secondary,rgba(0,0,0,0.2))",
                  borderRadius: 8, background: "var(--color-background-primary,#fff)", color: "var(--color-text-primary)",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {["all", ...allDisplayStatuses].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  border: `0.5px solid ${filter === f ? "#185FA5" : "rgba(0,0,0,0.14)"}`,
                  background: filter === f ? "#E6F1FB" : "transparent",
                  color: filter === f ? "#0C447C" : "var(--color-text-secondary)",
                }}>
                  {f.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 420, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 32, fontSize: 13, color: "var(--color-text-tertiary)" }}>No tickets found</div>
              )}
              {filtered.map((t, i) => {
                const isSelected         = selected?.id === t.id;
                const rt                 = getRequesterType(t);
                const displayStatus      = (t as any)._displayStatus ?? t.status;
                const isCurrentlyServing = calledTicket?.id === t.id;
                const isTimerTicket      = graceTicketId === t.id;
                const ticketIsLate       = isLate(t);

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelected(isSelected ? null : t)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                      border: `0.5px solid ${isSelected ? "#185FA5" : ticketIsLate ? "#F09595" : isCurrentlyServing ? "#378ADD" : "var(--color-border-tertiary,rgba(0,0,0,0.12))"}`,
                      background: isSelected ? "#EBF3FC" : ticketIsLate ? "#FEF5F5" : isCurrentlyServing ? "#E6F1FB" : "var(--color-background-primary,#fff)",
                      transition: "background 0.12s",
                    }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: ticketIsLate ? "#FCEBEB" : isCurrentlyServing ? "#378ADD" : "var(--color-background-secondary,#f5f5f3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 500,
                      color: ticketIsLate ? "#A32D2D" : isCurrentlyServing ? "#fff" : "var(--color-text-secondary)",
                    }}>
                      {ticketIsLate ? "!" : isCurrentlyServing ? "▶" : i + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t.ticket_number}</span>
                        <Pill label={displayStatus} style={statusStyle(displayStatus)} />
                        <Pill label={rt.label} style={{ bg: rt.bg, color: rt.color }} />
                        {(t.missed_attempts ?? 0) > 0 && (
                          <span style={{ fontSize: 11, color: "#A32D2D" }}>{t.missed_attempts}× missed</span>
                        )}
                        {isTimerTicket && graceSeconds > 0 && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                            background: graceSeconds <= 60 ? "#FCEBEB" : "#FAEEDA",
                            color: graceSeconds <= 60 ? "#A32D2D" : "#854F0B",
                          }}>
                            ⏱ {String(Math.floor(graceSeconds / 60)).padStart(2, "0")}:{String(graceSeconds % 60).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span>{getApplicantName(t)}</span>
                        <span style={{ color: "var(--color-text-tertiary)" }}>·</span>
                        <span>{t.service_type}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                        Submitted {fmtTime(t.submitted_at)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                      {ticketIsLate ? (
                        <IconBtn label="↺" title="Re-admit to queue" onClick={() => requeue(t)} color="#534AB7" />
                      ) : isActive(t) ? (
                        <>
                          <IconBtn label="✓" title="Complete"     onClick={() => act(t, "completed")} color="#3B6D11" />
                          <IconBtn label="✕" title="No Show"      onClick={() => act(t, "no_show")}   color="#A32D2D" />
                          <IconBtn label="↩" title="Move to back" onClick={() => act(t, "move_back")} color="#854F0B" />
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ MIDDLE — Detail ══ */}
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TicketDetail
              ticket={sortedQueueWithDisplay.find(t => t.id === selected.id) as any ?? selected}
              onClose={() => setSelected(null)}
              onAct={act}
              onRequeue={requeue}
              busy={busy}
            />
          </div>
        )}

        {/* ══ RIGHT ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={cardStyle}>
            <div style={sectionDivider}><span style={{ fontSize: 15, fontWeight: 500 }}>Active by Service</span></div>
            {Object.keys(breakdown).length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, fontSize: 13, color: "var(--color-text-tertiary)" }}>No active tickets</div>
            ) : (
              Object.entries(breakdown).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.08))" }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: "#E6F1FB", color: "#0C447C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>{type}</span>
                  <div style={{ flex: 1, height: 4, background: "rgba(0,0,0,0.08)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round((count / bTotal) * 100)}%`, background: "#378ADD", borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, minWidth: 18, textAlign: "right" }}>{count}</span>
                </div>
              ))
            )}
          </div>

          <div style={cardStyle}>
            <div style={sectionDivider}><span style={{ fontSize: 15, fontWeight: 500 }}>Up Next</span></div>
            {activeQueue.filter((_, i) => i > 0).slice(0, 6).map((t, i) => {
              const rt = getRequesterType(t);
              return (
                <div key={t.id} style={{ padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.08))" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", width: 16 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{t.ticket_number}</span>
                    <Pill label={rt.label} style={{ bg: rt.bg, color: rt.color }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginLeft: 24, marginTop: 2 }}>
                    {getApplicantName(t)} · {fmtTime(t.submitted_at)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: 24 }}>{t.service_type}</div>
                </div>
              );
            })}
            {activeQueue.filter((_, i) => i > 0).length === 0 && (
              <div style={{ textAlign: "center", padding: 20, fontSize: 13, color: "var(--color-text-tertiary)" }}>Queue is empty</div>
            )}
          </div>

          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ ...sectionDivider, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Activity</span>
              <button onClick={() => setLog([])} style={{ fontSize: 11, cursor: "pointer", border: "0.5px solid rgba(0,0,0,0.14)", borderRadius: 6, background: "none", padding: "3px 8px", color: "var(--color-text-secondary)" }}>Clear</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
              {log.length === 0 && <div style={{ textAlign: "center", padding: 20, fontSize: 13, color: "var(--color-text-tertiary)" }}>No activity yet</div>}
              {log.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12, padding: "5px 0", borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.08))" }}>
                  <span style={{ color: logColor[e.type] ?? "var(--color-text-secondary)", flexShrink: 0, marginTop: 1 }}>●</span>
                  <span style={{ flex: 1 }}>{e.msg}</span>
                  <span style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}>{e.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  async function handleCallNext() {
    setCalling(true);
    try {
      await postCallNext();
      addLog("Called next ticket", "success");
      showToast("Next ticket called", true);
      await load();
    } catch {
      showToast("Failed to call next", false);
      addLog("Failed to call next ticket", "error");
    } finally {
      setCalling(false);
    }
  }
}

export default QueueControl;