import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackendQueueItem {
  id: number;
  document_type: string;
  document_id: number;
  reference_number: string;
  status: "waiting" | "serving" | "done";
  queue_date: string;
  manual_added: boolean;
  created_by?: number;
  pwd_status?: string;
  date_of_birth?: string;
  is_senior?: boolean;
  is_pwd?: boolean;
}

export interface DisplayItem {
  queueId:        number;
  queueStatus:    string;
  refNumber:      string;
  documentType:   string;
  documentId:     number;
  firstName?:     string;
  middleName?:    string | null;
  surname?:       string;
  businessName?:  string | null;
  businessType?:  string | null;
  establishment?: string | null;
  serviceLabel:   string;
  serviceColor:   string;
  serviceBg:      string;
  releasedDate?:  string;
  queueDate?:     string;
  priorityType?:  "pwd" | "senior" | "both" | null;
}

interface QueueDisplayProps {
  pollInterval?: number;
  enrichDetails?: boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_MS       = 8_000;
const SENIOR_AGE    = 60;
const USER_API_BASE = `${import.meta.env.VITE_WEB_URL}/api/users`;

const DOCUMENT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  barangay_clearance:   { label: "Barangay Clearance",   color: "#0C447C", bg: "#E6F1FB" },
  barangay_certificate: { label: "Barangay Certificate",  color: "#085041", bg: "#E1F5EE" },
  building_clearance:   { label: "Building Clearance",    color: "#633806", bg: "#FAEEDA" },
  business_clearance:   { label: "Business Clearance",    color: "#712B13", bg: "#FAECE7" },
};

const PRIORITY_CONFIG = {
  pwd:    { border: "#93C5FD", dot: "#2563EB", label: "PWD",          textColor: "#1D4ED8" },
  senior: { border: "#F9A8D4", dot: "#BE185D", label: "Senior",       textColor: "#9D174D" },
  both:   { border: "#D8B4FE", dot: "#7C3AED", label: "PWD & Senior", textColor: "#5B21B6" },
} as const;

function getDocumentConfig(type: string) {
  return DOCUMENT_TYPE_CONFIG[type] ?? { label: type, color: "#5F5E5A", bg: "#F1EFE8" };
}

// ─── Priority Storage ─────────────────────────────────────────────────────────

function priorityStorageKey(): string {
  const d = new Date();
  return `queue_priority_v2_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadPriorityMap(): Map<number, string> {
  try {
    const raw = localStorage.getItem(priorityStorageKey());
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, string>;
    return new Map(Object.entries(obj).map(([k, v]) => [Number(k), v]));
  } catch {
    return new Map();
  }
}

function reasonToType(reason: string): "pwd" | "senior" | "both" | null {
  if (reason === "PWD & Senior") return "both";
  if (reason === "PWD")          return "pwd";
  if (reason === "Senior")       return "senior";
  return null;
}

// ─── Priority detection ───────────────────────────────────────────────────────

function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function detectPwdFromStatus(s?: string): boolean {
  if (!s) return false;
  const v = String(s).trim().toLowerCase();
  return !["", "none", "no", "n/a", "not pwd", "false", "0"].includes(v);
}

function detectPriorityType(
  pwdStatus?: string,
  dob?: string,
  isSeniorFlag?: boolean,
  isPwdFlag?: boolean,
): "pwd" | "senior" | "both" | null {
  const pwd    = isPwdFlag    ?? detectPwdFromStatus(pwdStatus);
  const senior = isSeniorFlag ?? (calcAge(dob) !== null && calcAge(dob)! >= SENIOR_AGE);
  if (pwd && senior) return "both";
  if (pwd)           return "pwd";
  if (senior)        return "senior";
  return null;
}

async function fetchUserPriority(userId: number): Promise<"pwd" | "senior" | "both" | null> {
  try {
    const res  = await fetch(`${USER_API_BASE}/${userId}`);
    if (!res.ok) return null;
    const json = await res.json();
    const u    = json?.data ?? json;
    return detectPriorityType(u?.pwd_status, u?.date_of_birth);
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });

const formatQueueDate = (s: string) => {
  const d     = new Date(s);
  const today = new Date();
  const yest  = new Date(today); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString())  return "Yesterday";
  return formatDate(s);
};

function toDisplayItem(qi: BackendQueueItem, priorityMap: Map<number, string>): DisplayItem {
  const cfg          = getDocumentConfig(qi.document_type);
  const storedReason = priorityMap.get(qi.id);
  const priorityType = storedReason
    ? reasonToType(storedReason)
    : detectPriorityType(qi.pwd_status, qi.date_of_birth, qi.is_senior, qi.is_pwd);

  return {
    queueId:      qi.id,
    queueStatus:  qi.status,
    refNumber:    qi.reference_number,
    documentType: qi.document_type,
    documentId:   qi.document_id,
    serviceLabel: cfg.label,
    serviceColor: cfg.color,
    serviceBg:    cfg.bg,
    queueDate:    qi.queue_date,
    priorityType,
  };
}

// ─── Live Clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {time.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

// ─── Priority Dot ─────────────────────────────────────────────────────────────

function PriorityDot({ type }: { type: "pwd" | "senior" | "both" }) {
  const cfg = PRIORITY_CONFIG[type];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: cfg.textColor }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

// ─── Released Badge ───────────────────────────────────────────────────────────

function ReleasedBadge() {
  return (
    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "#EAF3DE", color: "#27500A", whiteSpace: "nowrap" }}>
      RELEASED
    </span>
  );
}

// ─── Release Card ─────────────────────────────────────────────────────────────

function getDisplayName(item: DisplayItem): string {
  return [item.firstName, item.middleName, item.surname].filter(Boolean).join(" ") || "—";
}

function getServiceSubLabel(item: DisplayItem): string {
  return item.businessName ?? item.establishment ?? "";
}

function ReleaseCard({ item, position, isServing }: { item: DisplayItem; position: number; isServing: boolean }) {
  const sub              = getServiceSubLabel(item);
  const queueDateDisplay = item.queueDate ? formatQueueDate(item.queueDate) : "";
  const p                = item.priorityType;
  const priorityCfg      = p ? PRIORITY_CONFIG[p] : null;

  return (
    <div
      style={{
        background:    isServing ? "#fff" : "var(--color-background-secondary,#f5f5f3)",
        border:        isServing ? "1.5px solid #3B6D11" : priorityCfg ? `1.5px solid ${priorityCfg.border}` : "0.5px solid rgba(0,0,0,0.10)",
        borderRadius:  12,
        padding:       "14px 12px",
        textAlign:     "center",
        display:       "flex",
        flexDirection: "column",
        gap:           5,
        alignItems:    "center",
        transition:    "border 0.2s",
      }}
    >
      <div
        style={{
          width: 22, height: 22, borderRadius: "50%",
          background:     isServing ? "#3B6D11" : priorityCfg ? priorityCfg.dot : "var(--color-background-primary,#fff)",
          border:         "0.5px solid rgba(0,0,0,0.12)",
          display:        "flex", alignItems: "center", justifyContent: "center",
          fontSize:       10, fontWeight: 600,
          color:          isServing || priorityCfg ? "#fff" : "var(--color-text-secondary)",
        }}
      >
        {isServing ? "▶" : position}
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>{item.refNumber}</div>

      {(item.firstName || item.surname) && (
        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
          {getDisplayName(item)}
        </div>
      )}

      <div style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: item.serviceBg, color: item.serviceColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
        {item.serviceLabel}
      </div>

      {sub && (
        <div style={{ fontSize: 10, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
          {sub}
        </div>
      )}

      <ReleasedBadge />
      {p && <PriorityDot type={p} />}

      {queueDateDisplay && (
        <div style={{ fontSize: 9, color: isServing ? "#3B6D11" : "var(--color-text-tertiary)", marginTop: 2, fontWeight: isServing ? 500 : 400 }}>
          📅 Queued: {queueDateDisplay}
        </div>
      )}

      {item.releasedDate && (
        <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 2 }}>
          ✓ Released: {item.releasedDate}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QueueDisplay({ pollInterval = POLL_MS, enrichDetails = true }: QueueDisplayProps) {
  const [nowServing, setNowServing] = useState<DisplayItem | null>(null);
  const [upNext,     setUpNext]     = useState<DisplayItem[]>([]);
  const [flash,      setFlash]      = useState(false);
  const prevRefRef     = useRef<string | null>(null);
  const priorityMapRef = useRef<Map<number, string>>(loadPriorityMap());

  const allItems = nowServing ? [nowServing, ...upNext] : upNext;

  const load = useCallback(async () => {
    priorityMapRef.current = loadPriorityMap();
    const priorityMap = priorityMapRef.current;

    try {
      const res = await api.get("/queue");
      const payload = res.data?.data;
      let items: BackendQueueItem[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(res.data)
            ? res.data
            : [];

      // Today only — compare date parts only to avoid UTC timezone issues
      const now = new Date();
      const todayY = now.getFullYear();
      const todayM = now.getMonth();
      const todayD = now.getDate();

      items = items.filter(i => {
        const d = new Date(i.queue_date);
        return d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD;
      });

      const rawServing = items.find(i => i.status === "serving") ?? null;
      const rawWaiting = items.filter(i => i.status === "waiting").sort((a, b) => a.id - b.id);

      let serving: DisplayItem | null = rawServing ? toDisplayItem(rawServing, priorityMap) : null;
      let waiting: DisplayItem[]      = rawWaiting.map(i => toDisplayItem(i, priorityMap));

      if (enrichDetails && (serving || waiting.length > 0)) {
        const all = [...(serving ? [serving] : []), ...waiting];
        const raw = [...(rawServing ? [rawServing] : []), ...rawWaiting];

        const enriched = await Promise.all(
          all.map(async (item, idx) => {
            const qi = raw[idx];
            try {
              // ✅ FIXED: removed duplicate "api/" prefix
              const collection = item.documentType.replace(/_/g, "-") + "s";
              const docRes = await api.get(`/${collection}/${item.documentId}`);
              const doc    = docRes.data?.data ?? docRes.data;

              if (doc) {
                let pt = item.priorityType;
                if (!pt) {
                  pt = detectPriorityType(doc.pwd_status, doc.date_of_birth, doc.is_senior, doc.is_pwd);
                }
                if (!pt && (qi.created_by ?? doc.created_by)) {
                  pt = await fetchUserPriority(qi.created_by ?? doc.created_by);
                }

                return {
                  ...item,
                  firstName:     doc.first_name,
                  middleName:    doc.middle_name,
                  surname:       doc.surname,
                  businessName:  doc.business_name ?? doc.establishment ?? null,
                  businessType:  doc.business_type ?? null,
                  establishment: doc.establishment ?? null,
                  releasedDate:  doc.released_at || doc.updated_at
                    ? formatDate(doc.released_at ?? doc.updated_at)
                    : undefined,
                  priorityType: pt,
                } as DisplayItem;
              }
            } catch {
              // silently keep the base item
            }
            return item;
          })
        );

        if (serving) {
          serving = enriched[0] ?? null;
          waiting = enriched.slice(1);
        } else {
          waiting = enriched;
        }
      }

      const newRef = serving?.refNumber ?? null;
      if (newRef !== prevRefRef.current) {
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
        prevRefRef.current = newRef;
      }

      setNowServing(serving);
      setUpNext(waiting);
    } catch (e) {
      console.error("[QueueDisplay] load error", e);
    }
  }, [enrichDetails]);

  useEffect(() => {
    load();
    const id = setInterval(load, pollInterval);
    return () => clearInterval(id);
  }, [load, pollInterval]);

  const totalInQueue = allItems.length;
  const breakdown: Record<string, number> = {};
  for (const item of allItems) {
    breakdown[item.serviceLabel] = (breakdown[item.serviceLabel] ?? 0) + 1;
  }

  return (
    <div style={{ fontFamily: "var(--font-sans,system-ui)", color: "var(--color-text-primary,#111)", padding: 20, display: "flex", flexDirection: "column", gap: 16, minHeight: "100vh", background: "var(--color-background-tertiary,#f5f5f3)" }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "var(--color-background-primary,#fff)", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B6D11", display: "inline-block" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)" }}>Dry Seal Release · Live</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
            {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)" }}><LiveClock /></span>
        </div>
      </div>

      {/* Priority legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 16px", background: "var(--color-background-primary,#fff)", border: "0.5px solid rgba(0,0,0,0.10)", borderRadius: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-tertiary)" }}>Priority</span>
        {(["pwd", "senior", "both"] as const).map(type => {
          const cfg = PRIORITY_CONFIG[type];
          return (
            <span key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: cfg.textColor, fontWeight: 500 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
              {cfg.label}
            </span>
          );
        })}
      </div>

      {/* Now Serving */}
      <div style={{ background: "var(--color-background-primary,#fff)", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 16, padding: "52px 32px 48px", textAlign: "center", flex: "0 0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 20 }}>
          Now Serving
        </div>
        <div style={{ fontSize: "clamp(96px, 20vw, 180px)", fontWeight: 700, lineHeight: 1, letterSpacing: -6, color: "var(--color-text-primary,#111)", transition: "opacity 0.18s, transform 0.18s", opacity: flash ? 0.15 : 1, transform: flash ? "scale(0.97)" : "scale(1)" }}>
          {nowServing?.refNumber ?? "---"}
        </div>

        {nowServing ? (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ padding: "6px 20px", borderRadius: 99, fontSize: 14, fontWeight: 500, background: nowServing.serviceBg, color: nowServing.serviceColor }}>
                {nowServing.serviceLabel}
              </span>
              <ReleasedBadge />
              {nowServing.priorityType && (
                <span style={{ padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, background: "var(--color-background-secondary,#f5f5f3)", color: PRIORITY_CONFIG[nowServing.priorityType].textColor, border: `1px solid ${PRIORITY_CONFIG[nowServing.priorityType].border}`, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_CONFIG[nowServing.priorityType].dot, display: "inline-block" }} />
                  {PRIORITY_CONFIG[nowServing.priorityType].label}
                </span>
              )}
            </div>
            {(nowServing.firstName || nowServing.surname) && (
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{getDisplayName(nowServing)}</div>
            )}
            {getServiceSubLabel(nowServing) && (
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
                {getServiceSubLabel(nowServing)}{nowServing.businessType ? ` · ${nowServing.businessType}` : ""}
              </div>
            )}
            {nowServing.queueDate && (
              <div style={{ fontSize: 11, color: "#3B6D11", marginTop: 6, fontWeight: 500 }}>
                📅 Queued: {formatQueueDate(nowServing.queueDate)}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 20, fontSize: 15, color: "var(--color-text-tertiary)" }}>
            No documents currently being served
          </div>
        )}
      </div>

      {/* Service breakdown strip */}
      {Object.keys(breakdown).length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.entries(DOCUMENT_TYPE_CONFIG).map(([type, cfg]) =>
            breakdown[cfg.label] ? (
              <div key={type} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "var(--color-background-primary,#fff)", border: "0.5px solid rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ color: "var(--color-text-secondary)" }}>{cfg.label}</span>
                <span style={{ padding: "1px 8px", borderRadius: 99, fontSize: 12, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{breakdown[cfg.label]}</span>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Queue grid */}
      <div style={{ background: "var(--color-background-primary,#fff)", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, marginBottom: 16, borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>Awaiting Dry Seal</span>
          <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500, background: totalInQueue > 0 ? "#EAF3DE" : "var(--color-background-secondary,#f5f5f3)", color: totalInQueue > 0 ? "#27500A" : "var(--color-text-tertiary)" }}>
            {totalInQueue} in queue
          </span>
        </div>

        {allItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontSize: 14, color: "var(--color-text-tertiary)" }}>
            No documents awaiting dry seal for today
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {allItems.map((item, i) => (
              <ReleaseCard key={item.queueId} item={item} position={i + 1} isServing={item.queueStatus === "serving"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueDisplay;