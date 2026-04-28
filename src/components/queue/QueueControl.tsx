import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceItem {
  id: number;
  bcert_number?: string;
  brgy_business_no?: string;
  first_name: string;
  middle_name?: string | null;
  surname: string;
  status: string;
  schedule_date?: string | null;
  schedule_time?: string | null;
  street?: string | null;
  zone?: string | null;
  pob?: string | null;
  contact_no?: string | null;
  dob?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  establishment?: string | null;
  // Injected fields
  _serviceType: string;
  _serviceColor: string;
  _serviceBg: string;
  _refNumber: string;
}

interface RawItem {
  id: number;
  bcert_number?: string;
  brgy_business_no?: string;
  first_name: string;
  middle_name?: string | null;
  surname: string;
  status: string;
  schedule_date?: string | null;
  schedule_time?: string | null;
  [key: string]: unknown;
}

export interface NowServing {
  id: number;
  ticket_number: string;
  service_type: string;
  status: string;
  scheduled_time?: string | null;
  priority?: string;
  missed_attempts?: number;
  schedule_id?: number;
}

interface DashboardData {
  now_serving: NowServing | null;
  barangay_clearances_list: RawItem[];
  barangay_certificates_list: RawItem[];
  building_clearances_list: RawItem[];
  business_clearances_list: RawItem[];
  total_released_today: number;
  pending_counts: Record<string, number>;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_MS = 10_000;

const SERVICE_CONFIG = [
  { key: "barangay_clearances_list",   label: "Barangay Clearance",   color: "#0C447C", bg: "#E6F1FB" },
  { key: "barangay_certificates_list", label: "Barangay Certificate",  color: "#085041", bg: "#E1F5EE" },
  { key: "building_clearances_list",   label: "Building Clearance",   color: "#633806", bg: "#FAEEDA" },
  { key: "business_clearances_list",   label: "Business Clearance",   color: "#712B13", bg: "#FAECE7" },
] as const;

// Backend sends UPPERCASE statuses — always normalize before comparing
const normalizeStatus = (s: string) => s.toLowerCase().replace(/[\s-]+/g, "_");

// Active = still needs to be served
const ACTIVE_NS = new Set(["pending", "waiting", "for_release", "processing", "approved", "rescheduled"]);
const DONE_NS   = new Set(["released", "completed", "rejected", "no_show", "cancelled"]);

const isActiveStatus = (s: string) => ACTIVE_NS.has(normalizeStatus(s));
const isDoneStatus   = (s: string) => DONE_NS.has(normalizeStatus(s));

// ─── Status style map ─────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  waiting:     { bg: "#E6F1FB", color: "#0C447C" },
  pending:     { bg: "#FAEEDA", color: "#633806" },
  processing:  { bg: "#FAEEDA", color: "#633806" },
  for_release: { bg: "#E1F5EE", color: "#085041" },
  released:    { bg: "#EAF3DE", color: "#27500A" },
  approved:    { bg: "#E1F5EE", color: "#085041" },
  rejected:    { bg: "#FCEBEB", color: "#791F1F" },
  no_show:     { bg: "#FCEBEB", color: "#791F1F" },
  rescheduled: { bg: "#FAEEDA", color: "#633806" },
  cancelled:   { bg: "#FCEBEB", color: "#791F1F" },
};

const statusStyle = (s: string) =>
  STATUS_STYLE[normalizeStatus(s)] ?? { bg: "#F1EFE8", color: "#5F5E5A" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "HH:MM:SS" or "HH:MM" → "9:30 AM" */
const fmtTime = (t: string | null | undefined): string => {
  if (!t) return "—";
  const parts = t.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const getRefNumber = (item: RawItem): string =>
  item.bcert_number ?? item.brgy_business_no ?? `#${item.id}`;

const getFullName = (item: RawItem | ServiceItem): string =>
  [item.first_name, (item as any).middle_name, item.surname].filter(Boolean).join(" ");

// ─── Build merged queue ───────────────────────────────────────────────────────

function buildQueue(data: DashboardData): ServiceItem[] {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const result: ServiceItem[] = [];

  for (const cfg of SERVICE_CONFIG) {
    const list: RawItem[] = (data as any)[cfg.key] ?? [];
    for (const item of list) {
      // Keep items scheduled today (backend may already filter, but be safe)
      if (item.schedule_date && item.schedule_date !== today) continue;
      result.push({
        ...(item as any),
        _serviceType:  cfg.label,
        _serviceColor: cfg.color,
        _serviceBg:    cfg.bg,
        _refNumber:    getRefNumber(item),
      });
    }
  }

  // Active first, then by schedule_time asc
  result.sort((a, b) => {
    const aDone = isDoneStatus(a.status) ? 1 : 0;
    const bDone = isDoneStatus(b.status) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return (a.schedule_time ?? "99:99").localeCompare(b.schedule_time ?? "99:99");
  });

  return result;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const getDashboard = async (): Promise<DashboardData> => {
  const res = await api.get("api/dashboard");
  // Response shape: { data: { barangay_clearances_list: [...], now_serving: {...}, ... } }
  const raw = res.data?.data ?? res.data ?? {};
  return {
    now_serving:                raw.now_serving                ?? null,
    barangay_clearances_list:   Array.isArray(raw.barangay_clearances_list)   ? raw.barangay_clearances_list   : [],
    barangay_certificates_list: Array.isArray(raw.barangay_certificates_list) ? raw.barangay_certificates_list : [],
    building_clearances_list:   Array.isArray(raw.building_clearances_list)   ? raw.building_clearances_list   : [],
    business_clearances_list:   Array.isArray(raw.business_clearances_list)   ? raw.business_clearances_list   : [],
    total_released_today:       raw.total_released_today ?? 0,
    pending_counts:             raw.pending_counts        ?? {},
  };
};

const postCallNext = async () => (await api.post("api/tickets/call-next")).data;

const patchServiceStatus = async (item: ServiceItem, newStatus: string) => {
  const endpointMap: Record<string, string> = {
    "Barangay Clearance":  `api/barangay-clearances/${item.id}/status`,
    "Barangay Certificate":`api/barangay-certificates/${item.id}/status`,
    "Building Clearance":  `api/building-clearances/${item.id}/status`,
    "Business Clearance":  `api/business-clearances/${item.id}/status`,
  };
  const url = endpointMap[item._serviceType] ?? `api/services/${item.id}/status`;
  return (await api.patch(url, { status: newStatus })).data;
};

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Item Detail Panel ────────────────────────────────────────────────────────

function ItemDetail({ item, onClose, onAct, busy }: {
  item: ServiceItem;
  onClose: () => void;
  onAct: (item: ServiceItem, action: string) => void;
  busy: string | null;
}) {
  const active = isActiveStatus(item.status);

  return (
    <div style={{ ...cardStyle, border: "0.5px solid #378ADD" }}>
      <div style={{ ...sectionDivider, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>{item._refNumber}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <Pill label={item.status} style={statusStyle(item.status)} />
            <Pill label={item._serviceType} style={{ bg: item._serviceBg, color: item._serviceColor }} />
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 18, color: "var(--color-text-tertiary)", padding: 4,
        }}>✕</button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 6 }}>Applicant</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{getFullName(item)}</div>
        {item.contact_no && (
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{item.contact_no}</div>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 6 }}>Schedule</div>
        {[
          { label: "Date", value: item.schedule_date ?? "—" },
          { label: "Time", value: fmtTime(item.schedule_time) },
        ].map(row => (
          <div key={row.label} style={metaRow}>
            <span style={{ color: "var(--color-text-secondary)" }}>{row.label}</span>
            <span style={{ fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 6 }}>Details</div>
        {[
          { label: "Service",       value: item._serviceType },
          { label: "Address",       value: [item.street, item.zone].filter(Boolean).join(", ") || null },
          { label: "Business",      value: item.business_name ?? item.establishment ?? null },
          { label: "Business Type", value: item.business_type ?? null },
        ].filter(r => r.value).map(row => (
          <div key={row.label} style={metaRow}>
            <span style={{ color: "var(--color-text-secondary)" }}>{row.label}</span>
            <span style={{ fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </div>

      {active && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <ActionBtn label="✓ Complete" variant="success" disabled={!!busy} onClick={() => onAct(item, "completed")} />
            <ActionBtn label="✕ No Show"  variant="danger"  disabled={!!busy} onClick={() => onAct(item, "no_show")} />
          </div>
          <ActionBtn label="↩ Move to Back" variant="warning" disabled={!!busy} onClick={() => onAct(item, "move_back")} />
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function QueueControl() {
  const [allItems,      setAllItems]      = useState<ServiceItem[]>([]);
  const [nowServing,    setNowServing]    = useState<NowServing | null>(null);
  const [releasedToday, setReleasedToday] = useState(0);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [busy,          setBusy]          = useState<string | null>(null);
  const [filter,        setFilter]        = useState("all");
  const [search,        setSearch]        = useState("");
  const [selected,      setSelected]      = useState<ServiceItem | null>(null);
  const [log,           setLog]           = useState<{ msg: string; type: string; time: string }[]>([]);
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [calling,       setCalling]       = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeItems = allItems.filter(t => isActiveStatus(t.status));

  // Match serving item from active list — fall back to first active
  const servingItem: ServiceItem | null = (() => {
    if (!nowServing) return null;
    const byRef = activeItems.find(t =>
      t._refNumber === nowServing.ticket_number ||
      t.bcert_number === nowServing.ticket_number ||
      t.brgy_business_no === nowServing.ticket_number
    );
    return byRef ?? activeItems[0] ?? null;
  })();

  const upNext = activeItems.filter(t =>
    !(t.id === servingItem?.id && t._serviceType === servingItem?._serviceType)
  );

  const breakdown: Record<string, number> = {};
  activeItems.forEach(t => { breakdown[t._serviceType] = (breakdown[t._serviceType] ?? 0) + 1; });
  const bTotal = Math.max(Object.values(breakdown).reduce((a, b) => a + b, 0), 1);

  const allStatuses = Array.from(new Set(allItems.map(t => normalizeStatus(t.status))));

  const filtered = allItems.filter(t => {
    const ns = normalizeStatus(t.status);
    const mf = filter === "all" || ns === filter;
    const q  = search.toLowerCase();
    const ms = !search
      || t._refNumber.toLowerCase().includes(q)
      || t._serviceType.toLowerCase().includes(q)
      || getFullName(t).toLowerCase().includes(q)
      || (t.business_name ?? "").toLowerCase().includes(q)
      || (t.establishment ?? "").toLowerCase().includes(q);
    return mf && ms;
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const addLog = useCallback((msg: string, type = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLog(prev => [{ msg, type, time }, ...prev].slice(0, 60));
  }, []);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  }, []);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const data = await getDashboard();
      setNowServing(data.now_serving);
      setReleasedToday(data.total_released_today);
      setPendingCounts(data.pending_counts);
      setAllItems(buildQueue(data));
    } catch (e) {
      console.error("Dashboard load failed", e);
    }
  }, []);

  useEffect(() => {
    load();
    addLog("Admin panel ready", "info");
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load, addLog]);

  // Keep selected fresh
  useEffect(() => {
    if (selected) {
      const fresh = allItems.find(t => t.id === selected.id && t._serviceType === selected._serviceType);
      if (fresh) setSelected(fresh);
    }
  }, [allItems]);

  // ── Act ────────────────────────────────────────────────────────────────────
  async function act(item: ServiceItem, action: string) {
    const key = `${item.id}-${item._serviceType}-${action}`;
    setBusy(key);
    const ACTION_LABELS: Record<string, string> = {
      completed: "Completed", no_show: "Marked No Show",
      move_back: "Moved to Back", released: "Released",
      approved: "Approved", rejected: "Rejected",
    };
    try {
      const newStatus = action === "move_back" ? "pending" : action;
      await patchServiceStatus(item, newStatus);
      const msg = `${item._refNumber} → ${ACTION_LABELS[action] ?? action}`;
      showToast(msg, true);
      addLog(msg, "success");
      await load();
    } catch {
      showToast("Action failed", false);
      addLog(`Failed: ${action} on ${item._refNumber}`, "error");
    } finally {
      setBusy(null);
    }
  }

  // ── Call Next ──────────────────────────────────────────────────────────────
  async function handleCallNext() {
    setCalling(true);
    try {
      await postCallNext();
      addLog("Called next", "success");
      showToast("Next called", true);
      await load();
    } catch {
      showToast("Failed to call next", false);
      addLog("Failed to call next", "error");
    } finally {
      setCalling(false);
    }
  }

  const logColor: Record<string, string> = {
    info: "var(--color-text-secondary)", success: "#3B6D11", error: "#A32D2D", warn: "#854F0B",
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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

      <div style={{
        display: "grid",
        gridTemplateColumns: selected ? "1fr 320px 300px" : "1fr 300px",
        gap: 16, padding: 16,
      }}>

        {/* ══ LEFT ══════════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={cardStyle}>
            {/* Title row */}
            <div style={{ ...sectionDivider, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 500 }}>Queue Admin</span>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3B6D11", display: "inline-block" }} />
              </div>
              <ActionBtn
                label={calling ? "Calling…" : "▶  Call Next"}
                variant="primary"
                disabled={calling || activeItems.length === 0}
                onClick={handleCallNext}
              />
            </div>

            {/* Metrics */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Active",     value: activeItems.length },
                { label: "Done Today", value: releasedToday },
                { label: "Total",      value: allItems.length },
              ].map(m => (
                <div key={m.label} style={{
                  flex: 1, borderRadius: 8, padding: "10px 12px",
                  background: "var(--color-background-secondary,#f5f5f3)",
                }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 500 }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Pending counts per service type */}
            {Object.keys(pendingCounts).filter(k => pendingCounts[k] > 0).length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {Object.entries(pendingCounts)
                  .filter(([, count]) => count > 0)
                  .map(([svc, count]) => {
                    const cfg = SERVICE_CONFIG.find(c => c.label === svc);
                    return (
                      <div key={svc} style={{
                        padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 500,
                        background: cfg?.bg ?? "#F1EFE8",
                        color: cfg?.color ?? "#5F5E5A",
                      }}>
                        {svc}: <strong>{count}</strong>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Now Serving display */}
            <div style={{
              background: "var(--color-background-secondary,#f5f5f3)",
              border: "0.5px solid var(--color-border-secondary,rgba(0,0,0,0.18))",
              borderRadius: 10, padding: "20px 16px", textAlign: "center", marginBottom: 14,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 500, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 10,
              }}>
                Now Serving
              </div>
              <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1, letterSpacing: -3 }}>
                {nowServing?.ticket_number ?? "---"}
              </div>
              {nowServing ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
                    <Pill label={nowServing.service_type} style={{ bg: "#E6F1FB", color: "#0C447C" }} />
                    {nowServing.scheduled_time && (
                      <Pill label={`🕐 ${fmtTime(nowServing.scheduled_time)}`} style={{ bg: "#F1EFE8", color: "#5F5E5A" }} />
                    )}
                    {nowServing.priority && normalizeStatus(nowServing.priority) !== "normal" && (
                      <Pill label={nowServing.priority} style={{ bg: "#FBEAF0", color: "#72243E" }} />
                    )}
                    {(nowServing.missed_attempts ?? 0) > 0 && (
                      <Pill label={`${nowServing.missed_attempts}× missed`} style={{ bg: "#FCEBEB", color: "#791F1F" }} />
                    )}
                  </div>
                  {servingItem && (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{servingItem._refNumber}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>{servingItem._serviceType}</div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 10, fontSize: 13, color: "var(--color-text-tertiary)" }}>
                  No appointment currently being served
                </div>
              )}
            </div>

            {/* Actions */}
            {servingItem ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <ActionBtn label="✓  Complete" variant="success" disabled={!!busy} onClick={() => act(servingItem, "completed")} />
                  <ActionBtn label="✕  No Show"  variant="danger"  disabled={!!busy} onClick={() => act(servingItem, "no_show")} />
                </div>
                <ActionBtn label="↩  Move to Back (missed attempt)" variant="warning" disabled={!!busy} onClick={() => act(servingItem, "move_back")} />
              </div>
            ) : (
              <div style={{
                textAlign: "center", fontSize: 13, color: "var(--color-text-tertiary)",
                padding: "10px 0",
                border: "0.5px dashed var(--color-border-tertiary,rgba(0,0,0,0.12))",
                borderRadius: 8,
              }}>
                No appointments in queue
              </div>
            )}
          </div>

          {/* Queue List */}
          <div style={cardStyle}>
            <div style={{ ...sectionDivider, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Today's Queue</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search ref, name, service…"
                style={{
                  padding: "5px 10px", fontSize: 12, width: 180,
                  border: "0.5px solid var(--color-border-secondary,rgba(0,0,0,0.2))",
                  borderRadius: 8,
                  background: "var(--color-background-primary,#fff)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {["all", ...allStatuses].map(f => (
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

            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 480, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 32, fontSize: 13, color: "var(--color-text-tertiary)" }}>
                  No appointments found
                </div>
              )}
              {filtered.map((item, i) => {
                const isSelected = selected?.id === item.id && selected?._serviceType === item._serviceType;
                const isServing  = servingItem?.id === item.id && servingItem?._serviceType === item._serviceType;
                const active     = isActiveStatus(item.status);
                const done       = isDoneStatus(item.status);

                return (
                  <div
                    key={`${item._serviceType}-${item.id}`}
                    onClick={() => setSelected(isSelected ? null : item)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                      opacity: done ? 0.55 : 1,
                      border: `0.5px solid ${isSelected ? "#185FA5" : isServing ? "#378ADD" : "var(--color-border-tertiary,rgba(0,0,0,0.12))"}`,
                      background: isSelected ? "#EBF3FC" : isServing ? "#E6F1FB" : "var(--color-background-primary,#fff)",
                      transition: "background 0.12s",
                    }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: isServing ? "#378ADD" : "var(--color-background-secondary,#f5f5f3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 500,
                      color: isServing ? "#fff" : "var(--color-text-secondary)",
                    }}>
                      {isServing ? "▶" : done ? "✓" : i + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{item._refNumber}</span>
                        <Pill label={item.status} style={statusStyle(item.status)} />
                        <Pill label={item._serviceType} style={{ bg: item._serviceBg, color: item._serviceColor }} />
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                        {item.schedule_time ? `🕐 ${fmtTime(item.schedule_time)}` : "No schedule time"}
                      </div>
                      {(item.business_name ?? item.establishment) && (
                        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 1 }}>
                          {item.business_name ?? item.establishment}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                      {active && (
                        <>
                          <IconBtn label="✓" title="Complete"     onClick={() => act(item, "completed")} color="#3B6D11" />
                          <IconBtn label="✕" title="No Show"      onClick={() => act(item, "no_show")}   color="#A32D2D" />
                          <IconBtn label="↩" title="Move to back" onClick={() => act(item, "move_back")} color="#854F0B" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ MIDDLE — Detail ═══════════════════════════════════════════════ */}
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ItemDetail
              item={allItems.find(t => t.id === selected.id && t._serviceType === selected._serviceType) ?? selected}
              onClose={() => setSelected(null)}
              onAct={act}
              busy={busy}
            />
          </div>
        )}

        {/* ══ RIGHT ═════════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Active by Service */}
          <div style={cardStyle}>
            <div style={sectionDivider}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Active by Service</span>
            </div>
            {Object.keys(breakdown).length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, fontSize: 13, color: "var(--color-text-tertiary)" }}>
                No active appointments
              </div>
            ) : (
              SERVICE_CONFIG.filter(cfg => breakdown[cfg.label] != null).map(cfg => (
                <div key={cfg.label} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
                  borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.08))",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 99,
                    background: cfg.bg, color: cfg.color,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110,
                  }}>
                    {cfg.label}
                  </span>
                  <div style={{ flex: 1, height: 4, background: "rgba(0,0,0,0.08)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.round(((breakdown[cfg.label] ?? 0) / bTotal) * 100)}%`,
                      background: cfg.color, borderRadius: 2,
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, minWidth: 18, textAlign: "right" }}>
                    {breakdown[cfg.label] ?? 0}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Up Next */}
          <div style={cardStyle}>
            <div style={sectionDivider}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Up Next</span>
            </div>
            {upNext.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, fontSize: 13, color: "var(--color-text-tertiary)" }}>
                Queue is empty
              </div>
            ) : (
              upNext.slice(0, 6).map((item, i) => (
                <div key={`${item._serviceType}-${item.id}`} style={{
                  padding: "8px 0",
                  borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.08))",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", width: 16 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{item._refNumber}</span>
                    <Pill label={item._serviceType} style={{ bg: item._serviceBg, color: item._serviceColor }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginLeft: 24, marginTop: 2 }}>
                    {item.schedule_time ? `🕐 ${fmtTime(item.schedule_time)}` : "No time set"}
                    {(item.business_name ?? item.establishment) ? ` · ${item.business_name ?? item.establishment}` : ""}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Activity Log */}
          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ ...sectionDivider, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Activity</span>
              <button onClick={() => setLog([])} style={{
                fontSize: 11, cursor: "pointer",
                border: "0.5px solid rgba(0,0,0,0.14)", borderRadius: 6,
                background: "none", padding: "3px 8px", color: "var(--color-text-secondary)",
              }}>
                Clear
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
              {log.length === 0 && (
                <div style={{ textAlign: "center", padding: 20, fontSize: 13, color: "var(--color-text-tertiary)" }}>
                  No activity yet
                </div>
              )}
              {log.map((e, i) => (
                <div key={i} style={{
                  display: "flex", gap: 7, alignItems: "flex-start",
                  fontSize: 12, padding: "5px 0",
                  borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.08))",
                }}>
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
}

export default QueueControl;