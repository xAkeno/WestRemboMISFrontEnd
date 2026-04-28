import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceItem {
  id: number;
  first_name: string;
  middle_name: string | null;
  surname: string;
  status: string;
  schedule_date: string | null;
  schedule_time: string | null;
  business_name: string | null;
  business_type: string | null;
  _serviceType: string;
  _refNumber: string;
  _serviceColor: string;
  _serviceBg: string;
  street?: string | null;
  zone?: string | null;
  pob?: string | null;
  contact_no?: string | null;
  dob?: string | null;
  establishment?: string | null;
}

interface RawItem {
  id: number;
  first_name: string;
  middle_name?: string | null;
  surname: string;
  status: string;
  bcert_number?: string;
  brgy_business_no?: string;
  business_name?: string | null;
  business_type?: string | null;
  schedule?: {
    schedule_date?: string | null;
    schedule_time?: string | null;
  } | null;
  [key: string]: unknown;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_MS = 10_000;

const SERVICE_CONFIG = [
  { endpoint: "api/barangay-clearances",   label: "Barangay Clearance",  color: "#0C447C", bg: "#E6F1FB" },
  { endpoint: "api/barangay-certificates", label: "Barangay Certificate", color: "#085041", bg: "#E1F5EE" },
  { endpoint: "api/building-clearances",   label: "Building Clearance",  color: "#633806", bg: "#FAEEDA" },
  { endpoint: "api/business-clearances",   label: "Business Clearance",  color: "#712B13", bg: "#FAECE7" },
] as const;

const DONE_STATUSES = new Set(["RELEASED", "COMPLETED", "REJECTED", "NO_SHOW", "CANCELLED"]);
const isActiveStatus = (s: string) => !DONE_STATUSES.has(s);
const isDoneStatus = (s: string) => DONE_STATUSES.has(s);

// ─── Status style map ─────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  WAITING:     { bg: "#E6F1FB", color: "#0C447C" },
  PENDING:     { bg: "#FAEEDA", color: "#633806" },
  PROCESSING:  { bg: "#FAEEDA", color: "#633806" },
  FOR_RELEASE: { bg: "#E1F5EE", color: "#085041" },
  RELEASED:    { bg: "#EAF3DE", color: "#27500A" },
  APPROVED:    { bg: "#E1F5EE", color: "#085041" },
  REJECTED:    { bg: "#FCEBEB", color: "#791F1F" },
  NO_SHOW:     { bg: "#FCEBEB", color: "#791F1F" },
  RESCHEDULED: { bg: "#FAEEDA", color: "#633806" },
  CANCELLED:   { bg: "#FCEBEB", color: "#791F1F" },
  COMPLETED:   { bg: "#EAF3DE", color: "#27500A" },
};

const statusStyle = (s: string) =>
  STATUS_STYLE[s] ?? { bg: "#F1EFE8", color: "#5F5E5A" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtTime = (t: string | null | undefined): string => {
  if (!t) return "—";
  const parts = t.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const getFullName = (item: ServiceItem): string =>
  [item.first_name, item.middle_name, item.surname].filter(Boolean).join(" ");

const itemKey = (item: ServiceItem): string => `${item.id}-${item._serviceType}`;

const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── Unified data mapping ─────────────────────────────────────────────────────

function mapRawItem(
  item: RawItem,
  cfg: (typeof SERVICE_CONFIG)[number],
): ServiceItem {
  return {
    id: item.id,
    first_name: item.first_name,
    middle_name: item.middle_name ?? null,
    surname: item.surname,
    status: item.status,
    schedule_date: item.schedule?.schedule_date ?? null,
    schedule_time: item.schedule?.schedule_time ?? null,
    business_name: item.business_name ?? null,
    business_type: item.business_type ?? null,
    _serviceType: cfg.label,
    _refNumber: item.bcert_number ?? item.brgy_business_no ?? `#${item.id}`,
    _serviceColor: cfg.color,
    _serviceBg: cfg.bg,
    street: (item.street as string) ?? null,
    zone: (item.zone as string) ?? null,
    pob: (item.pob as string) ?? null,
    contact_no: (item.contact_no as string) ?? null,
    dob: (item.dob as string) ?? null,
    establishment: (item.establishment as string) ?? null,
  };
}

// ─── Load all items from direct APIs ──────────────────────────────────────────

async function fetchAllItems(): Promise<ServiceItem[]> {
  const responses = await Promise.all(
    SERVICE_CONFIG.map((cfg) => api.get(cfg.endpoint)),
  );
  const items: ServiceItem[] = [];
  responses.forEach((res, i) => {
    const list: RawItem[] = res.data?.data?.data ?? [];
    for (const raw of list) {
      items.push(mapRawItem(raw, SERVICE_CONFIG[i]));
    }
  });
  return items;
}

// ─── Build automatic queue ────────────────────────────────────────────────────

function buildAutoQueue(allItems: ServiceItem[]): ServiceItem[] {
  const today = todayStr();
  return allItems.filter(
    (item) => item.schedule_date === today || item.status === "RELEASED",
  );
}

function sortQueue(queue: ServiceItem[]): ServiceItem[] {
  return [...queue].sort((a, b) => {
    const aDone = isDoneStatus(a.status) ? 1 : 0;
    const bDone = isDoneStatus(b.status) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return (a.schedule_time ?? "99:99").localeCompare(b.schedule_time ?? "99:99");
  });
}

// ─── API actions ──────────────────────────────────────────────────────────────

const patchServiceStatus = async (item: ServiceItem, newStatus: string) => {
  const endpointMap: Record<string, string> = {
    "Barangay Clearance":  `api/barangay-clearances/${item.id}/status`,
    "Barangay Certificate": `api/barangay-certificates/${item.id}/status`,
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
  borderRadius: 12,
  padding: 16,
};

const sectionDivider: React.CSSProperties = {
  paddingBottom: 12,
  marginBottom: 12,
  borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.10))",
};

const metaRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 12,
  padding: "5px 0",
  borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.07))",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Pill({
  label,
  style,
}: {
  label: string;
  style: { bg: string; color: string };
}) {
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 500,
        background: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: "success" | "danger" | "warning" | "primary" | "outline" | "info";
}) {
  const V = {
    success: { bg: "#3B6D11", color: "#EAF3DE", border: "#3B6D11" },
    danger: { bg: "#A32D2D", color: "#FCEBEB", border: "#A32D2D" },
    warning: { bg: "#854F0B", color: "#FAEEDA", border: "#854F0B" },
    primary: { bg: "#185FA5", color: "#E6F1FB", border: "#185FA5" },
    outline: {
      bg: "transparent",
      color: "var(--color-text-primary)",
      border: "rgba(0,0,0,0.18)",
    },
    info: { bg: "#534AB7", color: "#EEEDFE", border: "#534AB7" },
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "10px 0",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        background: V.bg,
        color: V.color,
        border: `0.5px solid ${V.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        transition: "opacity 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function IconBtn({
  label,
  title,
  onClick,
  color,
}: {
  label: string;
  title: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        cursor: "pointer",
        border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
        background: "none",
        fontSize: 13,
        color: color ?? "var(--color-text-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {label}
    </button>
  );
}

// ─── Item Detail Panel ────────────────────────────────────────────────────────

function ItemDetail({
  item,
  onClose,
  onDone,
  busy,
}: {
  item: ServiceItem;
  onClose: () => void;
  onDone: (item: ServiceItem) => void;
  busy: boolean;
}) {
  const active = isActiveStatus(item.status);

  return (
    <div style={{ ...cardStyle, border: "0.5px solid #378ADD" }}>
      <div
        style={{
          ...sectionDivider,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
            {item._refNumber}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <Pill label={item.status} style={statusStyle(item.status)} />
            <Pill
              label={item._serviceType}
              style={{ bg: item._serviceBg, color: item._serviceColor }}
            />
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            color: "var(--color-text-tertiary)",
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            marginBottom: 6,
          }}
        >
          Applicant
        </div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{getFullName(item)}</div>
        {item.contact_no && (
          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginTop: 2,
            }}
          >
            {item.contact_no}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            marginBottom: 6,
          }}
        >
          Schedule
        </div>
        {[
          { label: "Date", value: item.schedule_date ?? "—" },
          { label: "Time", value: fmtTime(item.schedule_time) },
        ].map((row) => (
          <div key={row.label} style={metaRow}>
            <span style={{ color: "var(--color-text-secondary)" }}>
              {row.label}
            </span>
            <span style={{ fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            marginBottom: 6,
          }}
        >
          Details
        </div>
        {[
          { label: "Service", value: item._serviceType },
          {
            label: "Address",
            value:
              [item.street, item.zone].filter(Boolean).join(", ") || null,
          },
          {
            label: "Business",
            value: item.business_name ?? item.establishment ?? null,
          },
          { label: "Business Type", value: item.business_type ?? null },
        ]
          .filter((r) => r.value)
          .map((row) => (
            <div key={row.label} style={metaRow}>
              <span style={{ color: "var(--color-text-secondary)" }}>
                {row.label}
              </span>
              <span style={{ fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
      </div>

      {active && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ActionBtn
            label="✓ Done"
            variant="success"
            disabled={busy}
            onClick={() => onDone(item)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Manual Add Search Panel ──────────────────────────────────────────────────

function ManualAddPanel({
  allItems,
  queueKeys,
  onAdd,
}: {
  allItems: ServiceItem[];
  queueKeys: Set<string>;
  onAdd: (item: ServiceItem) => void;
}) {
  const [query, setQuery] = useState("");

  const q = query.toLowerCase();
  const results = query
    ? allItems.filter((item) => {
        if (queueKeys.has(itemKey(item))) return false;
        return (
          item._refNumber.toLowerCase().includes(q) ||
          item._serviceType.toLowerCase().includes(q) ||
          getFullName(item).toLowerCase().includes(q) ||
          (item.business_name ?? "").toLowerCase().includes(q) ||
          (item.establishment ?? "").toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div style={cardStyle}>
      <div style={sectionDivider}>
        <span style={{ fontSize: 15, fontWeight: 500 }}>Add to Queue</span>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by ref, name, business…"
        style={{
          width: "100%",
          padding: "7px 10px",
          fontSize: 12,
          border: "0.5px solid var(--color-border-secondary,rgba(0,0,0,0.2))",
          borderRadius: 8,
          background: "var(--color-background-primary,#fff)",
          color: "var(--color-text-primary)",
          marginBottom: 8,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          maxHeight: 240,
          overflowY: "auto",
        }}
      >
        {query && results.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 16,
              fontSize: 12,
              color: "var(--color-text-tertiary)",
            }}
          >
            No results
          </div>
        )}
        {results.slice(0, 20).map((item) => (
          <div
            key={itemKey(item)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 8,
              border:
                "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
              background: "var(--color-background-primary,#fff)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {item._refNumber}
                </span>
                <Pill label={item.status} style={statusStyle(item.status)} />
                <Pill
                  label={item._serviceType}
                  style={{ bg: item._serviceBg, color: item._serviceColor }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-text-secondary)",
                  marginTop: 2,
                }}
              >
                {getFullName(item)}
              </div>
            </div>
            <button
              onClick={() => {
                onAdd(item);
                setQuery("");
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                background: "#185FA5",
                color: "#E6F1FB",
                border: "0.5px solid #185FA5",
                whiteSpace: "nowrap",
              }}
            >
              + Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function QueueControl() {
  const [allItems, setAllItems] = useState<ServiceItem[]>([]);
  const [queue, setQueue] = useState<ServiceItem[]>([]);
  const [manualKeys, setManualKeys] = useState<Set<string>>(new Set());
  const [servingKey, setServingKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ServiceItem | null>(null);
  const [log, setLog] = useState<
    { msg: string; type: string; time: string }[]
  >([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(
    null,
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  const addLog = useCallback((msg: string, type = "info") => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLog((prev) => [{ msg, type, time }, ...prev].slice(0, 60));
  }, []);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  }, []);

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      const items = await fetchAllItems();
      setAllItems(items);

      setQueue((prevQueue) => {
        const autoItems = buildAutoQueue(items);
        const autoKeys = new Set(autoItems.map(itemKey));

        const manualItems = items.filter(
          (item) => manualKeys.has(itemKey(item)) && !autoKeys.has(itemKey(item)),
        );

        return sortQueue([...autoItems, ...manualItems]);
      });
    } catch (e) {
      console.error("Load failed", e);
    }
  }, [manualKeys]);

  useEffect(() => {
    load();
    addLog("Queue control ready", "info");
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load, addLog]);

  // Keep selected fresh
  useEffect(() => {
    if (selected) {
      const fresh = queue.find((t) => itemKey(t) === itemKey(selected));
      if (fresh) setSelected(fresh);
    }
  }, [queue, selected]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeQueue = queue.filter((t) => isActiveStatus(t.status));
  const servingItem =
    queue.find((t) => itemKey(t) === servingKey) ?? activeQueue[0] ?? null;

  const upNext = activeQueue.filter(
    (t) => servingItem && itemKey(t) !== itemKey(servingItem),
  );

  const queueKeys = new Set(queue.map(itemKey));

  const allStatuses = Array.from(new Set(queue.map((t) => t.status)));

  const filtered = queue.filter((t) => {
    const mf = filter === "all" || t.status === filter;
    const q = search.toLowerCase();
    const ms =
      !search ||
      t._refNumber.toLowerCase().includes(q) ||
      t._serviceType.toLowerCase().includes(q) ||
      getFullName(t).toLowerCase().includes(q) ||
      (t.business_name ?? "").toLowerCase().includes(q) ||
      (t.establishment ?? "").toLowerCase().includes(q);
    return mf && ms;
  });

  const breakdown: Record<string, number> = {};
  activeQueue.forEach((t) => {
    breakdown[t._serviceType] = (breakdown[t._serviceType] ?? 0) + 1;
  });
  const bTotal = Math.max(
    Object.values(breakdown).reduce((a, b) => a + b, 0),
    1,
  );

  // ── Manual Add ─────────────────────────────────────────────────────────────

  function handleManualAdd(item: ServiceItem) {
    const key = itemKey(item);
    setManualKeys((prev) => new Set(prev).add(key));
    setQueue((prev) => {
      if (prev.some((t) => itemKey(t) === key)) return prev;
      return sortQueue([...prev, item]);
    });
    showToast(`${item._refNumber} added to queue`);
    addLog(`Added ${item._refNumber} to queue`, "info");
  }

  // ── Call Next ──────────────────────────────────────────────────────────────

  function handleCallNext() {
    if (activeQueue.length === 0) return;

    if (!servingItem) {
      const next = activeQueue[0];
      setServingKey(itemKey(next));
      showToast(`Now serving: ${next._refNumber}`);
      addLog(`Now serving: ${next._refNumber}`, "success");
      return;
    }

    const currentIdx = activeQueue.findIndex(
      (t) => itemKey(t) === itemKey(servingItem),
    );
    const nextIdx = currentIdx + 1;
    if (nextIdx < activeQueue.length) {
      const next = activeQueue[nextIdx];
      setServingKey(itemKey(next));
      showToast(`Now serving: ${next._refNumber}`);
      addLog(`Now serving: ${next._refNumber}`, "success");
    } else {
      showToast("No more items in queue", false);
    }
  }

  // ── Done ───────────────────────────────────────────────────────────────────

  async function handleDone(item: ServiceItem) {
    const key = itemKey(item);
    setBusy(true);
    try {
      try {
        await patchServiceStatus(item, "COMPLETED");
      } catch {
        // optional PATCH — continue even if it fails
      }
      setQueue((prev) => prev.filter((t) => itemKey(t) !== key));
      setManualKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });

      if (servingKey === key) {
        const remaining = activeQueue.filter((t) => itemKey(t) !== key);
        setServingKey(remaining.length > 0 ? itemKey(remaining[0]) : null);
      }

      if (selected && itemKey(selected) === key) setSelected(null);

      showToast(`${item._refNumber} done`);
      addLog(`${item._refNumber} completed & removed`, "success");
    } catch {
      showToast("Action failed", false);
      addLog(`Failed: done on ${item._refNumber}`, "error");
    } finally {
      setBusy(false);
    }
  }

  const logColor: Record<string, string> = {
    info: "var(--color-text-secondary)",
    success: "#3B6D11",
    error: "#A32D2D",
    warn: "#854F0B",
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        fontFamily: "var(--font-sans,system-ui)",
        color: "var(--color-text-primary,#111)",
        position: "relative",
      }}
    >
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 9999,
            background: "var(--color-background-primary,#fff)",
            border: `0.5px solid ${toast.ok ? "#3B6D11" : "#A32D2D"}`,
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 13,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selected ? "1fr 320px 300px" : "1fr 300px",
          gap: 16,
          padding: 16,
        }}
      >
        {/* ══ LEFT ══════════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={cardStyle}>
            {/* Title row */}
            <div
              style={{
                ...sectionDivider,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span style={{ fontSize: 17, fontWeight: 500 }}>
                  Queue Admin
                </span>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#3B6D11",
                    display: "inline-block",
                  }}
                />
              </div>
              <ActionBtn
                label={activeQueue.length === 0 ? "No Items" : "▶  Call Next"}
                variant="primary"
                disabled={activeQueue.length === 0}
                onClick={handleCallNext}
              />
            </div>

            {/* Metrics */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Active", value: activeQueue.length },
                { label: "In Queue", value: queue.length },
                { label: "Total Fetched", value: allItems.length },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    padding: "10px 12px",
                    background:
                      "var(--color-background-secondary,#f5f5f3)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-secondary)",
                      marginBottom: 3,
                    }}
                  >
                    {m.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 500 }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Now Serving display */}
            <div
              style={{
                background: "var(--color-background-secondary,#f5f5f3)",
                border: "0.5px solid var(--color-border-secondary,rgba(0,0,0,0.18))",
                borderRadius: 10,
                padding: "20px 16px",
                textAlign: "center",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-text-secondary)",
                  marginBottom: 10,
                }}
              >
                Now Serving
              </div>
              <div
                style={{
                  fontSize: 68,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: -3,
                }}
              >
                {servingItem?._refNumber ?? "---"}
              </div>
              {servingItem ? (
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    <Pill
                      label={servingItem.status}
                      style={statusStyle(servingItem.status)}
                    />
                    <Pill
                      label={servingItem._serviceType}
                      style={{
                        bg: servingItem._serviceBg,
                        color: servingItem._serviceColor,
                      }}
                    />
                    {servingItem.schedule_time && (
                      <Pill
                        label={`🕐 ${fmtTime(servingItem.schedule_time)}`}
                        style={{ bg: "#F1EFE8", color: "#5F5E5A" }}
                      />
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {getFullName(servingItem)}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  No appointment currently being served
                </div>
              )}
            </div>

            {/* Actions */}
            {servingItem ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <ActionBtn
                  label="✓  Done"
                  variant="success"
                  disabled={busy}
                  onClick={() => handleDone(servingItem)}
                />
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--color-text-tertiary)",
                  padding: "10px 0",
                  border: "0.5px dashed var(--color-border-tertiary,rgba(0,0,0,0.12))",
                  borderRadius: 8,
                }}
              >
                No appointments in queue
              </div>
            )}
          </div>

          {/* Queue List */}
          <div style={cardStyle}>
            <div
              style={{
                ...sectionDivider,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 500 }}>
                Today's Queue
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ref, name, service…"
                style={{
                  padding: "5px 10px",
                  fontSize: 12,
                  width: 180,
                  border: "0.5px solid var(--color-border-secondary,rgba(0,0,0,0.2))",
                  borderRadius: 8,
                  background: "var(--color-background-primary,#fff)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            {/* Filter tabs */}
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              {["all", ...allStatuses].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: `0.5px solid ${filter === f ? "#185FA5" : "rgba(0,0,0,0.14)"}`,
                    background: filter === f ? "#E6F1FB" : "transparent",
                    color:
                      filter === f
                        ? "#0C447C"
                        : "var(--color-text-secondary)",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 480,
                overflowY: "auto",
              }}
            >
              {filtered.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 32,
                    fontSize: 13,
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  No appointments found
                </div>
              )}
              {filtered.map((item, i) => {
                const key = itemKey(item);
                const isSelected =
                  selected && itemKey(selected) === key;
                const isServing =
                  servingItem && itemKey(servingItem) === key;
                const done = isDoneStatus(item.status);

                return (
                  <div
                    key={key}
                    onClick={() =>
                      setSelected(isSelected ? null : item)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      opacity: done ? 0.55 : 1,
                      border: `0.5px solid ${isSelected ? "#185FA5" : isServing ? "#378ADD" : "var(--color-border-tertiary,rgba(0,0,0,0.12))"}`,
                      background: isSelected
                        ? "#EBF3FC"
                        : isServing
                          ? "#E6F1FB"
                          : "var(--color-background-primary,#fff)",
                      transition: "background 0.12s",
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: isServing
                          ? "#378ADD"
                          : "var(--color-background-secondary,#f5f5f3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 500,
                        color: isServing
                          ? "#fff"
                          : "var(--color-text-secondary)",
                      }}
                    >
                      {isServing ? "▶" : done ? "✓" : i + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{ fontSize: 14, fontWeight: 600 }}
                        >
                          {item._refNumber}
                        </span>
                        <Pill
                          label={item.status}
                          style={statusStyle(item.status)}
                        />
                        <Pill
                          label={item._serviceType}
                          style={{
                            bg: item._serviceBg,
                            color: item._serviceColor,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-secondary)",
                          marginTop: 2,
                        }}
                      >
                        {item.schedule_time
                          ? `🕐 ${fmtTime(item.schedule_time)}`
                          : "No schedule time"}
                      </div>
                      {(item.business_name ?? item.establishment) && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-tertiary)",
                            marginTop: 1,
                          }}
                        >
                          {item.business_name ?? item.establishment}
                        </div>
                      )}
                    </div>

                    <div
                      style={{ display: "flex", gap: 4 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isActiveStatus(item.status) && (
                        <IconBtn
                          label="✓"
                          title="Done"
                          onClick={() => handleDone(item)}
                          color="#3B6D11"
                        />
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <ItemDetail
              item={
                queue.find((t) => itemKey(t) === itemKey(selected)) ??
                selected
              }
              onClose={() => setSelected(null)}
              onDone={handleDone}
              busy={busy}
            />
          </div>
        )}

        {/* ══ RIGHT ═════════════════════════════════════════════════════════ */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Manual Add */}
          <ManualAddPanel
            allItems={allItems}
            queueKeys={queueKeys}
            onAdd={handleManualAdd}
          />

          {/* Active by Service */}
          <div style={cardStyle}>
            <div style={sectionDivider}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>
                Active by Service
              </span>
            </div>
            {Object.keys(breakdown).length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 24,
                  fontSize: 13,
                  color: "var(--color-text-tertiary)",
                }}
              >
                No active appointments
              </div>
            ) : (
              SERVICE_CONFIG.filter(
                (cfg) => breakdown[cfg.label] != null,
              ).map((cfg) => (
                <div
                  key={cfg.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 0",
                    borderBottom:
                      "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.08))",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      padding: "2px 7px",
                      borderRadius: 99,
                      background: cfg.bg,
                      color: cfg.color,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 110,
                    }}
                  >
                    {cfg.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      background: "rgba(0,0,0,0.08)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round(((breakdown[cfg.label] ?? 0) / bTotal) * 100)}%`,
                        background: cfg.color,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      minWidth: 18,
                      textAlign: "right",
                    }}
                  >
                    {breakdown[cfg.label] ?? 0}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Up Next */}
          <div style={cardStyle}>
            <div style={sectionDivider}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>
                Up Next
              </span>
            </div>
            {upNext.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  fontSize: 13,
                  color: "var(--color-text-tertiary)",
                }}
              >
                Queue is empty
              </div>
            ) : (
              upNext.slice(0, 6).map((item, i) => (
                <div
                  key={itemKey(item)}
                  style={{
                    padding: "8px 0",
                    borderBottom:
                      "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.08))",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-tertiary)",
                        width: 16,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{ flex: 1, fontSize: 14, fontWeight: 600 }}
                    >
                      {item._refNumber}
                    </span>
                    <Pill
                      label={item._serviceType}
                      style={{
                        bg: item._serviceBg,
                        color: item._serviceColor,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-secondary)",
                      marginLeft: 24,
                      marginTop: 2,
                    }}
                  >
                    {item.schedule_time
                      ? `🕐 ${fmtTime(item.schedule_time)}`
                      : "No time set"}
                    {item.business_name ?? item.establishment
                      ? ` · ${item.business_name ?? item.establishment}`
                      : ""}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Activity Log */}
          <div style={{ ...cardStyle, flex: 1 }}>
            <div
              style={{
                ...sectionDivider,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 500 }}>
                Activity
              </span>
              <button
                onClick={() => setLog([])}
                style={{
                  fontSize: 11,
                  cursor: "pointer",
                  border: "0.5px solid rgba(0,0,0,0.14)",
                  borderRadius: 6,
                  background: "none",
                  padding: "3px 8px",
                  color: "var(--color-text-secondary)",
                }}
              >
                Clear
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {log.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 20,
                    fontSize: 13,
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  No activity yet
                </div>
              )}
              {log.map((e, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 7,
                    alignItems: "flex-start",
                    fontSize: 12,
                    padding: "5px 0",
                    borderBottom:
                      "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.08))",
                  }}
                >
                  <span
                    style={{
                      color:
                        logColor[e.type] ??
                        "var(--color-text-secondary)",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    ●
                  </span>
                  <span style={{ flex: 1 }}>{e.msg}</span>
                  <span
                    style={{
                      color: "var(--color-text-tertiary)",
                      flexShrink: 0,
                    }}
                  >
                    {e.time}
                  </span>
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
