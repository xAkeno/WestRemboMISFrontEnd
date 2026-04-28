import { useState, useEffect, useCallback, useRef } from "react";
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

interface QueueDisplayProps {
  pollInterval?: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_MS = 8_000;

const SERVICE_CONFIG = [
  { endpoint: "api/barangay-clearances",   label: "Barangay Clearance",  color: "#0C447C", bg: "#E6F1FB" },
  { endpoint: "api/barangay-certificates", label: "Barangay Certificate", color: "#085041", bg: "#E1F5EE" },
  { endpoint: "api/building-clearances",   label: "Building Clearance",  color: "#633806", bg: "#FAEEDA" },
  { endpoint: "api/business-clearances",   label: "Business Clearance",  color: "#712B13", bg: "#FAECE7" },
] as const;

const DONE_STATUSES = new Set(["RELEASED", "COMPLETED", "REJECTED", "NO_SHOW", "CANCELLED"]);
const isActiveStatus = (s: string) => !DONE_STATUSES.has(s);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtTime = (t: string | null | undefined): string => {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12) || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const getServiceLabel = (item: ServiceItem, fallback: string): string =>
  item.business_name ?? item.establishment ?? fallback;

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PENDING:     { bg: "#FAEEDA", color: "#633806" },
  WAITING:     { bg: "#E6F1FB", color: "#0C447C" },
  FOR_RELEASE: { bg: "#E1F5EE", color: "#085041" },
  RELEASED:    { bg: "#EAF3DE", color: "#27500A" },
  APPROVED:    { bg: "#E1F5EE", color: "#085041" },
  REJECTED:    { bg: "#FCEBEB", color: "#791F1F" },
  PROCESSING:  { bg: "#FBEAF0", color: "#72243E" },
  RESCHEDULED: { bg: "#FAEEDA", color: "#633806" },
  COMPLETED:   { bg: "#EAF3DE", color: "#27500A" },
  NO_SHOW:     { bg: "#FCEBEB", color: "#791F1F" },
  CANCELLED:   { bg: "#FCEBEB", color: "#791F1F" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? { bg: "#F1EFE8", color: "#5F5E5A" };
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 500,
        background: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

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
    establishment: (item.establishment as string) ?? null,
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

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

// ─── Live Clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {time.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
}

// ─── Schedule Card ────────────────────────────────────────────────────────────

function ScheduleCard({
  item,
  position,
}: {
  item: ServiceItem;
  position: number;
}) {
  const sub = getServiceLabel(item, "");

  return (
    <div
      style={{
        background: "var(--color-background-secondary,#f5f5f3)",
        border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.10))",
        borderRadius: 12,
        padding: "14px 12px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "var(--color-background-primary,#fff)",
          border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 600,
          color: "var(--color-text-secondary)",
        }}
      >
        {position}
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>
        {item._refNumber}
      </div>

      {item.schedule_time && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          🕐 {fmtTime(item.schedule_time)}
        </div>
      )}

      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: 99,
          background: item._serviceBg,
          color: item._serviceColor,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        {item._serviceType}
      </div>

      {sub && (
        <div
          style={{
            fontSize: 10,
            color: "var(--color-text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          {sub}
        </div>
      )}

      <StatusBadge status={item.status} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QueueDisplay({ pollInterval = POLL_MS }: QueueDisplayProps) {
  const [queueItems, setQueueItems] = useState<ServiceItem[]>([]);
  const [flash, setFlash] = useState(false);
  const prevServingRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const allItems = await fetchAllItems();
      const today = new Date().toISOString().slice(0, 10);

      const merged = allItems.filter(
        (item) =>
          (item.schedule_date === today && isActiveStatus(item.status)) ||
          item.status === "RELEASED",
      );

      merged.sort((a, b) => {
        const aActive = isActiveStatus(a.status) ? 0 : 1;
        const bActive = isActiveStatus(b.status) ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return (a.schedule_time ?? "99:99").localeCompare(
          b.schedule_time ?? "99:99",
        );
      });

      const nowServingRef = merged.find((item) =>
        isActiveStatus(item.status),
      )?._refNumber ?? null;

      if (nowServingRef !== prevServingRef.current) {
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
        prevServingRef.current = nowServingRef;
      }

      setQueueItems(merged);
    } catch {
      /* keep last state */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, pollInterval);
    return () => clearInterval(id);
  }, [load, pollInterval]);

  const activeItems = queueItems.filter((item) => isActiveStatus(item.status));
  const nowServing = activeItems[0] ?? null;
  const totalWaiting = activeItems.length;

  const breakdown: Record<string, number> = {};
  for (const item of activeItems) {
    breakdown[item._serviceType] = (breakdown[item._serviceType] ?? 0) + 1;
  }

  return (
    <div
      style={{
        fontFamily: "var(--font-sans,system-ui)",
        color: "var(--color-text-primary,#111)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: "100vh",
        background: "var(--color-background-tertiary,#f5f5f3)",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: "var(--color-background-primary,#fff)",
          border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#3B6D11",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
            }}
          >
            Queue Display · Live
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}
          >
            {new Date().toLocaleDateString("en-PH", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
            }}
          >
            <LiveClock />
          </span>
        </div>
      </div>

      {/* ── Now Serving ── */}
      <div
        style={{
          background: "var(--color-background-primary,#fff)",
          border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
          borderRadius: 16,
          padding: "52px 32px 48px",
          textAlign: "center",
          flex: "0 0 auto",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            marginBottom: 20,
          }}
        >
          Now Serving
        </div>

        <div
          style={{
            fontSize: "clamp(96px, 20vw, 180px)",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -6,
            color: "var(--color-text-primary,#111)",
            transition: "opacity 0.18s, transform 0.18s",
            opacity: flash ? 0.15 : 1,
            transform: flash ? "scale(0.97)" : "scale(1)",
          }}
        >
          {nowServing?._refNumber ?? "---"}
        </div>

        {nowServing ? (
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  padding: "6px 20px",
                  borderRadius: 99,
                  fontSize: 14,
                  fontWeight: 500,
                  background: nowServing._serviceBg,
                  color: nowServing._serviceColor,
                }}
              >
                {nowServing._serviceType}
              </span>
              {nowServing.schedule_time && (
                <span
                  style={{
                    padding: "6px 20px",
                    borderRadius: 99,
                    fontSize: 14,
                    fontWeight: 500,
                    background: "#F1EFE8",
                    color: "#5F5E5A",
                  }}
                >
                  🕐 {fmtTime(nowServing.schedule_time)}
                </span>
              )}
              <StatusBadge status={nowServing.status} />
            </div>
          </div>
        ) : (
          <div
            style={{
              marginTop: 20,
              fontSize: 15,
              color: "var(--color-text-tertiary)",
            }}
          >
            Waiting for next ticket…
          </div>
        )}
      </div>

      {/* ── Service type summary ── */}
      {Object.keys(breakdown).length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {SERVICE_CONFIG.filter((cfg) => breakdown[cfg.label]).map(
            (cfg) => (
              <div
                key={cfg.label}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  background: "var(--color-background-primary,#fff)",
                  border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: cfg.color,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {cfg.label}
                </span>
                <span
                  style={{
                    padding: "1px 8px",
                    borderRadius: 99,
                    fontSize: 12,
                    background: cfg.bg,
                    color: cfg.color,
                    fontWeight: 600,
                  }}
                >
                  {breakdown[cfg.label]}
                </span>
              </div>
            ),
          )}
        </div>
      )}

      {/* ── Scheduled Queue ── */}
      <div
        style={{
          background: "var(--color-background-primary,#fff)",
          border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 14,
            marginBottom: 16,
            borderBottom:
              "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.10))",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            Today's Schedule
          </span>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 500,
              background:
                totalWaiting > 0
                  ? "#E6F1FB"
                  : "var(--color-background-secondary,#f5f5f3)",
              color:
                totalWaiting > 0
                  ? "#0C447C"
                  : "var(--color-text-tertiary)",
            }}
          >
            {totalWaiting} in queue
          </span>
        </div>

        {queueItems.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              fontSize: 14,
              color: "var(--color-text-tertiary)",
            }}
          >
            No scheduled appointments for today
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {queueItems.map((item, i) => (
              <ScheduleCard
                key={`${item._serviceType}-${item.id}`}
                item={item}
                position={i + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueDisplay;
