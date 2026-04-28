import { useState, useEffect, useCallback, useRef } from "react";
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
  service_type?: string;
  // Clearance-specific
  pob?: string | null;
  street?: string | null;
  zone?: string | null;
  // Business-specific
  business_name?: string | null;
  business_type?: string | null;
  // Building-specific
  establishment?: string | null;
  // Computed
  _serviceLabel?: string;
  _refNumber?: string;
}

export interface NowServingTicket {
  id: number;
  ticket_number: string;
  service_type: string;
  status: string;
  scheduled_time?: string | null;
  priority?: string;
  missed_attempts?: number;
}

interface DashboardData {
  now_serving: NowServingTicket | null;
  barangay_clearances_list?: ServiceItem[];
  barangay_certificates_list?: ServiceItem[];
  building_clearances_list?: ServiceItem[];
  business_clearances_list?: ServiceItem[];
}

interface QueueDisplayProps {
  pollInterval?: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_MS = 8_000;

const ACTIVE_STATUSES = ["pending", "waiting", "for release", "processing", "approved", "rescheduled"];

const SERVICE_CONFIG: { key: keyof DashboardData; label: string; color: string; bg: string }[] = [
  { key: "barangay_clearances_list",  label: "Barangay Clearance",  color: "#0C447C", bg: "#E6F1FB" },
  { key: "barangay_certificates_list", label: "Barangay Certificate", color: "#085041", bg: "#E1F5EE" },
  { key: "building_clearances_list",  label: "Building Clearance",  color: "#633806", bg: "#FAEEDA" },
  { key: "business_clearances_list",  label: "Business Clearance",  color: "#712B13", bg: "#FAECE7" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeStatus = (s: string) => s.toLowerCase().replace(/\s+/g, "_");

const isActiveStatus = (status: string) =>
  ACTIVE_STATUSES.some(a => normalizeStatus(status) === normalizeStatus(a));

const fmtTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return "—";
  // Handle "HH:MM:SS" or "HH:MM" format
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
};

const fmtDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const getRefNumber = (item: ServiceItem): string =>
  item.bcert_number ?? item.brgy_business_no ?? `#${item.id}`;

const getServiceLabel = (item: ServiceItem, fallback: string): string =>
  item.business_name ?? item.establishment ?? fallback;

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchDashboard(): Promise<DashboardData> {
  const res = await api.get("api/dashboard"); // adjust endpoint if needed
  const d   = res.data?.data ?? res.data;
  return {
    now_serving:               d.now_serving               ?? null,
    barangay_clearances_list:  d.barangay_clearances_list  ?? [],
    barangay_certificates_list:d.barangay_certificates_list?? [],
    building_clearances_list:  d.building_clearances_list  ?? [],
    business_clearances_list:  d.business_clearances_list  ?? [],
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
      {time.toLocaleTimeString("en-PH", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      })}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:      { bg: "#FAEEDA", color: "#633806" },
  waiting:      { bg: "#E6F1FB", color: "#0C447C" },
  for_release:  { bg: "#E1F5EE", color: "#085041" },
  released:     { bg: "#EAF3DE", color: "#27500A" },
  approved:     { bg: "#E1F5EE", color: "#085041" },
  rejected:     { bg: "#FCEBEB", color: "#791F1F" },
  processing:   { bg: "#FBEAF0", color: "#72243E" },
  rescheduled:  { bg: "#FAEEDA", color: "#633806" },
};

function StatusBadge({ status }: { status: string }) {
  const key   = normalizeStatus(status).replace(/\s+/g, "_");
  const style = STATUS_STYLE[key] ?? { bg: "#F1EFE8", color: "#5F5E5A" };
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500,
      background: style.bg, color: style.color, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

// ─── Schedule Card (Up Next grid item) ───────────────────────────────────────

function ScheduleCard({
  item, position, serviceLabel, serviceColor, serviceBg,
}: {
  item: ServiceItem;
  position: number;
  serviceLabel: string;
  serviceColor: string;
  serviceBg: string;
}) {
  const ref = getRefNumber(item);
  const sub = getServiceLabel(item, "");

  return (
    <div style={{
      background: "var(--color-background-secondary,#f5f5f3)",
      border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.10))",
      borderRadius: 12, padding: "14px 12px", textAlign: "center",
      display: "flex", flexDirection: "column", gap: 6, alignItems: "center",
    }}>
      {/* Position badge */}
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "var(--color-background-primary,#fff)",
        border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)",
      }}>
        {position}
      </div>

      {/* Reference number */}
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>
        {ref}
      </div>

      {/* Schedule time */}
      {item.schedule_time && (
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: "var(--color-text-primary)",
        }}>
          🕐 {fmtTime(item.schedule_time)}
        </div>
      )}

      {/* Service type badge */}
      <div style={{
        fontSize: 10, fontWeight: 500, padding: "2px 8px",
        borderRadius: 99, background: serviceBg, color: serviceColor,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        maxWidth: "100%",
      }}>
        {serviceLabel}
      </div>

      {/* Sub-label (business name / establishment) */}
      {sub && (
        <div style={{
          fontSize: 10, color: "var(--color-text-secondary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: "100%",
        }}>
          {sub}
        </div>
      )}

      <StatusBadge status={item.status} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QueueDisplay({ pollInterval = POLL_MS }: QueueDisplayProps) {
  const [nowServing,  setNowServing]  = useState<NowServingTicket | null>(null);
  const [queueItems,  setQueueItems]  = useState<(ServiceItem & { _serviceLabel: string; _serviceColor: string; _serviceBg: string })[]>([]);
  const [flash,       setFlash]       = useState(false);
  const prevTicketRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchDashboard();

      // Flash on ticket change
      const incoming = data.now_serving ?? null;
      if (incoming?.ticket_number !== prevTicketRef.current) {
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
        prevTicketRef.current = incoming?.ticket_number ?? null;
      }
      setNowServing(incoming);

      // Merge all service lists, tag with service metadata, filter active today
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      const merged: (ServiceItem & { _serviceLabel: string; _serviceColor: string; _serviceBg: string })[] = [];

      for (const cfg of SERVICE_CONFIG) {
        const list = (data[cfg.key] as ServiceItem[] | undefined) ?? [];
        for (const item of list) {
          // Only show today's scheduled or active items
          const scheduledToday = item.schedule_date === today;
          const active         = isActiveStatus(item.status);
          if (scheduledToday && active) {
            merged.push({
              ...item,
              _serviceLabel: cfg.label,
              _serviceColor: cfg.color,
              _serviceBg:    cfg.bg,
            });
          }
        }
      }

      // Sort by schedule_time ascending
      merged.sort((a, b) => {
        const ta = a.schedule_time ?? "99:99";
        const tb = b.schedule_time ?? "99:99";
        return ta.localeCompare(tb);
      });

      setQueueItems(merged);
    } catch { /* keep last state */ }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, pollInterval);
    return () => clearInterval(id);
  }, [load, pollInterval]);

  const totalWaiting = queueItems.length;

  // Count by service type for the summary row
  const breakdown: Record<string, number> = {};
  for (const item of queueItems) {
    breakdown[item._serviceLabel] = (breakdown[item._serviceLabel] ?? 0) + 1;
  }

  return (
    <div style={{
      fontFamily: "var(--font-sans,system-ui)",
      color: "var(--color-text-primary,#111)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      minHeight: "100vh",
      background: "var(--color-background-tertiary,#f5f5f3)",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px",
        background: "var(--color-background-primary,#fff)",
        border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
        borderRadius: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B6D11", display: "inline-block" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)" }}>
            Queue Display · Live
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
            {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)" }}>
            <LiveClock />
          </span>
        </div>
      </div>

      {/* ── Now Serving ── */}
      <div style={{
        background: "var(--color-background-primary,#fff)",
        border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
        borderRadius: 16,
        padding: "52px 32px 48px",
        textAlign: "center",
        flex: "0 0 auto",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 20,
        }}>
          Now Serving
        </div>

        <div style={{
          fontSize: "clamp(96px, 20vw, 180px)",
          fontWeight: 700, lineHeight: 1, letterSpacing: -6,
          color: "var(--color-text-primary,#111)",
          transition: "opacity 0.18s, transform 0.18s",
          opacity: flash ? 0.15 : 1,
          transform: flash ? "scale(0.97)" : "scale(1)",
        }}>
          {nowServing?.ticket_number ?? "---"}
        </div>

        {nowServing ? (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <span style={{
                padding: "6px 20px", borderRadius: 99, fontSize: 14, fontWeight: 500,
                background: "#E6F1FB", color: "#0C447C",
              }}>
                {nowServing.service_type}
              </span>
              {nowServing.scheduled_time && (
                <span style={{
                  padding: "6px 20px", borderRadius: 99, fontSize: 14, fontWeight: 500,
                  background: "#F1EFE8", color: "#5F5E5A",
                }}>
                  🕐 {fmtTime(nowServing.scheduled_time)}
                </span>
              )}
              {nowServing.priority && nowServing.priority.toLowerCase() !== "normal" && (
                <span style={{
                  padding: "6px 20px", borderRadius: 99, fontSize: 14, fontWeight: 500,
                  background: "#FBEAF0", color: "#72243E",
                }}>
                  {nowServing.priority}
                </span>
              )}
              {(nowServing.missed_attempts ?? 0) > 0 && (
                <span style={{
                  padding: "6px 20px", borderRadius: 99, fontSize: 14, fontWeight: 500,
                  background: "#FCEBEB", color: "#791F1F",
                }}>
                  {nowServing.missed_attempts}× missed
                </span>
              )}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 20, fontSize: 15, color: "var(--color-text-tertiary)" }}>
            Waiting for next ticket…
          </div>
        )}
      </div>

      {/* ── Service type summary ── */}
      {Object.keys(breakdown).length > 0 && (
        <div style={{
          display: "flex", gap: 10, flexWrap: "wrap",
        }}>
          {SERVICE_CONFIG.filter(cfg => breakdown[cfg.label]).map(cfg => (
            <div key={cfg.label} style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: "var(--color-background-primary,#fff)",
              border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: cfg.color, display: "inline-block", flexShrink: 0,
              }} />
              <span style={{ color: "var(--color-text-secondary)" }}>{cfg.label}</span>
              <span style={{
                padding: "1px 8px", borderRadius: 99, fontSize: 12,
                background: cfg.bg, color: cfg.color, fontWeight: 600,
              }}>
                {breakdown[cfg.label]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Scheduled Queue ── */}
      <div style={{
        background: "var(--color-background-primary,#fff)",
        border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
        borderRadius: 16, padding: 20,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingBottom: 14, marginBottom: 16,
          borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.10))",
        }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>Today's Schedule</span>
          <span style={{
            padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500,
            background: totalWaiting > 0 ? "#E6F1FB" : "var(--color-background-secondary,#f5f5f3)",
            color: totalWaiting > 0 ? "#0C447C" : "var(--color-text-tertiary)",
          }}>
            {totalWaiting} scheduled
          </span>
        </div>

        {queueItems.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px 0",
            fontSize: 14, color: "var(--color-text-tertiary)",
          }}>
            No scheduled appointments for today
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 10,
          }}>
            {queueItems.map((item, i) => (
              <ScheduleCard
                key={`${item._serviceLabel}-${item.id}`}
                item={item}
                position={i + 1}
                serviceLabel={item._serviceLabel}
                serviceColor={item._serviceColor}
                serviceBg={item._serviceBg}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default QueueDisplay;