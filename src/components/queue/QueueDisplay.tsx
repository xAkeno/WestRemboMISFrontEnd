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
  scheduled_time?: string | null;
  type?: string;
  missed_attempts?: number;
  requester_id: number | null;
  serviceable: Serviceable | null;
}

interface QueueDisplayProps {
  pollInterval?: number; // ms, default 8000
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_MS = 8_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeStatus = (s: string) => s.toLowerCase().replace(/\s+/g, "_");

const getApplicantName = (t: Ticket) => {
  if (t.serviceable) {
    const { first_name, middle_name, last_name } = t.serviceable;
    return [first_name, middle_name, last_name].filter(Boolean).join(" ");
  }
  return null;
};

// ─── Style maps ───────────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  normal:   { bg: "#F1EFE8", color: "#5F5E5A" },
  priority: { bg: "#FBEAF0", color: "#72243E" },
  senior:   { bg: "#E1F5EE", color: "#085041" },
  pwd:      { bg: "#FAECE7", color: "#712B13" },
};

const priorityStyle = (p: string) =>
  PRIORITY_STYLE[p?.toLowerCase()] ?? { bg: "#F1EFE8", color: "#5F5E5A" };

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchNowServing() {
  const res  = await api.get("api/tickets/now-serving");
  const data = res.data;
  console.log("Now serving response:", data);
  // Backend returns two shapes:
  // • Active:   { now_serving: Ticket, upcoming: Ticket[] }
  // • Inactive: { message: string,     upcoming: Ticket[] }
  return {
    now_serving: data.now_serving ?? null,
    upcoming:    data.upcoming    ?? [],
  } as { now_serving: Ticket | null; upcoming: Ticket[] };
}

async function fetchPending() {
  const res = await api.get("api/tickets/pending", { params: { per_page: 100 } });
  return (res.data.data ?? res.data) as Ticket[];
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function QueueDisplay({ pollInterval = POLL_MS }: QueueDisplayProps) {
  const [nowServing,  setNowServing]  = useState<Ticket | null>(null);
  const [upcoming,    setUpcoming]    = useState<Ticket[]>([]);
  const [flash,       setFlash]       = useState(false);
  const prevNumberRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data     = await fetchNowServing();
      const incoming = data.now_serving ?? null;

      // Flash animation when ticket changes
      if (incoming?.ticket_number !== prevNumberRef.current) {
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
        prevNumberRef.current = incoming?.ticket_number ?? null;
      }

      setNowServing(incoming);

      // Always fetch full pending list — now-serving upcoming is minimal (no serviceable/priority)
      // Filter out the currently served ticket and only keep pending/waiting
      const pending = await fetchPending();
      const queue   = pending.filter(t => {
        const ns = normalizeStatus(t.status);
        return (ns === "pending" || ns === "waiting") && t.id !== incoming?.id;
      });
      setUpcoming(queue);
    } catch { /* keep last state */ }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, pollInterval);
    return () => clearInterval(id);
  }, [load, pollInterval]);

  // Sort upcoming by position
  const sortedUpcoming = [...upcoming].sort((a, b) => (a.position ?? 99999) - (b.position ?? 99999));
  const totalWaiting   = sortedUpcoming.length;

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
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)" }}>
          <LiveClock />
        </span>
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
            {/* Applicant name */}
            {getApplicantName(nowServing) && (
              <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 14, color: "var(--color-text-primary)" }}>
                {getApplicantName(nowServing)}
              </div>
            )}
            {/* Badges */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <span style={{
                padding: "6px 20px", borderRadius: 99, fontSize: 14, fontWeight: 500,
                background: "#E6F1FB", color: "#0C447C",
              }}>
                {nowServing.service_type}
              </span>
              {nowServing.priority && (
                <span style={{
                  padding: "6px 20px", borderRadius: 99, fontSize: 14, fontWeight: 500,
                  background: priorityStyle(nowServing.priority).bg,
                  color: priorityStyle(nowServing.priority).color,
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

      {/* ── Up Next ── */}
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
          <span style={{ fontSize: 16, fontWeight: 500 }}>Up Next</span>
          <span style={{
            padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500,
            background: totalWaiting > 0 ? "#E6F1FB" : "var(--color-background-secondary,#f5f5f3)",
            color: totalWaiting > 0 ? "#0C447C" : "var(--color-text-tertiary)",
          }}>
            {totalWaiting} waiting
          </span>
        </div>

        {sortedUpcoming.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontSize: 14, color: "var(--color-text-tertiary)" }}>
            Queue is empty
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 10,
          }}>
            {sortedUpcoming.map((t, i) => {
              const name = getApplicantName(t);
              const ps   = priorityStyle(t.priority ?? "normal");
              return (
                <div key={t.id} style={{
                  background: "var(--color-background-secondary,#f5f5f3)",
                  border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.10))",
                  borderRadius: 12, padding: "16px 12px", textAlign: "center",
                }}>
                  {/* Position badge */}
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "var(--color-background-primary,#fff)",
                    border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)",
                    margin: "0 auto 12px",
                  }}>
                    {i + 2}
                  </div>

                  {/* Ticket number */}
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 8 }}>
                    {t.ticket_number}
                  </div>

                  {/* Name if available */}
                  {name && (
                    <div style={{
                      fontSize: 11, color: "var(--color-text-secondary)",
                      marginBottom: 6, overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {name}
                    </div>
                  )}

                  {/* Service type */}
                  <div style={{
                    fontSize: 11, fontWeight: 500, padding: "2px 8px",
                    borderRadius: 99, display: "inline-block",
                    background: "#E6F1FB", color: "#0C447C",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}>
                    {t.service_type}
                  </div>

                  {/* Priority badge if not normal */}
                  {t.priority && t.priority.toLowerCase() !== "normal" && (
                    <div style={{
                      marginTop: 4, fontSize: 11, fontWeight: 500,
                      padding: "2px 8px", borderRadius: 99, display: "inline-block",
                      background: ps.bg, color: ps.color,
                    }}>
                      {t.priority}
                    </div>
                  )}

                  {/* Missed attempts warning */}
                  {(t.missed_attempts ?? 0) > 0 && (
                    <div style={{
                      marginTop: 4, fontSize: 11, fontWeight: 500,
                      padding: "2px 8px", borderRadius: 99, display: "inline-block",
                      background: "#FCEBEB", color: "#A32D2D",
                    }}>
                      {t.missed_attempts}× missed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default QueueDisplay;