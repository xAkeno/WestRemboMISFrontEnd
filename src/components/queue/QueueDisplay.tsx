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
}

interface QueueDisplayProps {
  pollInterval?: number;
  enrichDetails?: boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_MS = 8_000;

// Map document types to display labels (no API endpoints needed)
const DOCUMENT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'barangay_clearance':   { label: 'Barangay Clearance',  color: '#0C447C', bg: '#E6F1FB' },
  'barangay_certificate': { label: 'Barangay Certificate', color: '#085041', bg: '#E1F5EE' },
  'building_clearance':   { label: 'Building Clearance',  color: '#633806', bg: '#FAEEDA' },
  'business_clearance':   { label: 'Business Clearance',  color: '#712B13', bg: '#FAECE7' },
};

function getDocumentConfig(type: string) {
  return DOCUMENT_TYPE_CONFIG[type] || { 
    label: type, 
    color: "#5F5E5A", 
    bg: "#F1EFE8" 
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-PH", {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatQueueDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return formatDate(dateStr);
  }
};

function toDisplayItem(qi: BackendQueueItem): DisplayItem {
  const cfg = getDocumentConfig(qi.document_type);
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
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function ReleasedBadge() {
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 500,
        background: "#EAF3DE",
        color: "#27500A",
        whiteSpace: "nowrap",
      }}
    >
      RELEASED
    </span>
  );
}

// ─── Release Card ─────────────────────────────────────────────────────────────

function getDisplayName(item: DisplayItem): string {
  return (
    [item.firstName, item.middleName, item.surname].filter(Boolean).join(" ") ||
    "—"
  );
}

function getServiceSubLabel(item: DisplayItem): string {
  return item.businessName ?? item.establishment ?? "";
}

function ReleaseCard({
  item,
  position,
  isServing,
}: {
  item: DisplayItem;
  position: number;
  isServing: boolean;
}) {
  const sub = getServiceSubLabel(item);
  const queueDateDisplay = item.queueDate ? formatQueueDate(item.queueDate) : "";

  return (
    <div
      style={{
        background: isServing
          ? "var(--color-background-primary,#fff)"
          : "var(--color-background-secondary,#f5f5f3)",
        border: isServing
          ? "1.5px solid #3B6D11"
          : "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.10))",
        borderRadius: 12,
        padding: "14px 12px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "center",
        transition: "border 0.2s, background 0.2s",
      }}
    >
      {/* Position bubble */}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: isServing
            ? "#3B6D11"
            : "var(--color-background-primary,#fff)",
          border:
            "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 600,
          color: isServing ? "#fff" : "var(--color-text-secondary)",
        }}
      >
        {isServing ? "▶" : position}
      </div>

      {/* Ref number */}
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>
        {item.refNumber}
      </div>

      {/* Applicant name */}
      {(item.firstName || item.surname) && (
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          {getDisplayName(item)}
        </div>
      )}

      {/* Service type pill */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: 99,
          background: item.serviceBg,
          color: item.serviceColor,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        {item.serviceLabel}
      </div>

      {/* Business / establishment */}
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

      <ReleasedBadge />
      
      {/* Queue Date - when it was added to queue */}
      {queueDateDisplay && (
        <div
          style={{
            fontSize: 9,
            color: isServing ? "#3B6D11" : "var(--color-text-tertiary)",
            marginTop: 2,
            fontWeight: isServing ? 500 : 400,
          }}
        >
          📅 Queued: {queueDateDisplay}
        </div>
      )}
      
      {/* Released Date - when document was released */}
      {item.releasedDate && (
        <div
          style={{
            fontSize: 9,
            color: "var(--color-text-tertiary)",
            marginTop: 2,
          }}
        >
          ✓ Released: {item.releasedDate}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QueueDisplay({
  pollInterval = POLL_MS,
  enrichDetails = true,
}: QueueDisplayProps) {
  const [nowServing, setNowServing] = useState<DisplayItem | null>(null);
  const [upNext,     setUpNext]     = useState<DisplayItem[]>([]);
  const [flash,      setFlash]      = useState(false);
  const [todayDate,  setTodayDate]  = useState(new Date().toDateString());
  const prevRefRef = useRef<string | null>(null);

  const allItems = nowServing ? [nowServing, ...upNext] : upNext;

  const load = useCallback(async () => {
    try {
      // STEP 1: Fetch all queue items (NO auto-add)
      const res = await api.get("api/queue");

      // Support both paginated and flat responses
      const payload = res.data?.data;
      let items: BackendQueueItem[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(res.data)
            ? res.data
            : [];

      // STEP 2: Filter only today's queue items
      const today = new Date().toDateString();
      items = items.filter(item => {
        const queueDate = new Date(item.queue_date).toDateString();
        return queueDate === today;
      });

      console.log(`[QueueDisplay] Found ${items.length} queue items for ${today}`);

      // STEP 3: Split into "serving" and "waiting"
      const rawServing = items.find((i) => i.status === "serving") ?? null;
      const rawWaiting = items
        .filter((i) => i.status === "waiting")
        .sort((a, b) => a.id - b.id);

      // STEP 4: Map to display items
      let serving: DisplayItem | null = rawServing
        ? toDisplayItem(rawServing)
        : null;
      let waiting: DisplayItem[] = rawWaiting.map(toDisplayItem);

      // STEP 5: Optionally hydrate applicant / business details
      if (enrichDetails && (serving || waiting.length > 0)) {
        const allItemsToEnrich = [...(serving ? [serving] : []), ...waiting];
        
        // Fetch details for each item from their respective endpoints
        const enrichedItems = await Promise.all(
          allItemsToEnrich.map(async (item) => {
            try {
              const endpoint = getDocumentConfig(item.documentType).endpoint || 
                `api/${item.documentType}s`;
              
              // Try to fetch the actual document details
              const docRes = await api.get(`${endpoint}/${item.documentId}`);
              const doc = docRes.data?.data;
              
              if (doc) {
                return {
                  ...item,
                  firstName: doc.first_name,
                  middleName: doc.middle_name,
                  surname: doc.surname,
                  businessName: doc.business_name ?? doc.establishment ?? null,
                  businessType: doc.business_type ?? null,
                  establishment: doc.establishment ?? null,
                  releasedDate: doc.released_at || doc.updated_at 
                    ? formatDate(doc.released_at || doc.updated_at) 
                    : undefined,
                };
              }
            } catch (err) {
              console.warn(`Could not fetch details for ${item.documentType} #${item.documentId}`);
            }
            return item;
          })
        );
        
        if (serving) {
          serving = enrichedItems[0] ?? null;
          waiting = enrichedItems.slice(1);
        } else {
          waiting = enrichedItems;
        }
      }

      // STEP 6: Flash animation when "now serving" changes
      const newRef = serving?.refNumber ?? null;
      if (newRef !== prevRefRef.current) {
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
        prevRefRef.current = newRef;
      }

      setNowServing(serving);
      setUpNext(waiting);
      setTodayDate(today);
      
      console.log(`[QueueDisplay] Loaded ${items.length} items for ${today}`);
    } catch (e) {
      console.error("[QueueDisplay] load error", e);
    }
  }, [enrichDetails]);

  useEffect(() => {
    load();
    const id = setInterval(load, pollInterval);
    return () => clearInterval(id);
  }, [load, pollInterval]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalInQueue = allItems.length;

  const breakdown: Record<string, number> = {};
  for (const item of allItems) {
    breakdown[item.serviceLabel] = (breakdown[item.serviceLabel] ?? 0) + 1;
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
            Dry Seal Release · Live
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
          border:
            "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
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
          {nowServing?.refNumber ?? "---"}
        </div>

        {nowServing ? (
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  padding: "6px 20px",
                  borderRadius: 99,
                  fontSize: 14,
                  fontWeight: 500,
                  background: nowServing.serviceBg,
                  color: nowServing.serviceColor,
                }}
              >
                {nowServing.serviceLabel}
              </span>
              <ReleasedBadge />
            </div>
            {(nowServing.firstName || nowServing.surname) && (
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
                {getDisplayName(nowServing)}
              </div>
            )}
            {getServiceSubLabel(nowServing) && (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  marginTop: 4,
                }}
              >
                {getServiceSubLabel(nowServing)}
                {nowServing.businessType
                  ? ` · ${nowServing.businessType}`
                  : ""}
              </div>
            )}
            {nowServing.queueDate && (
              <div
                style={{
                  fontSize: 11,
                  color: "#3B6D11",
                  marginTop: 6,
                  fontWeight: 500,
                }}
              >
                📅 Queued: {formatQueueDate(nowServing.queueDate)}
              </div>
            )}
            {nowServing.releasedDate && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-text-tertiary)",
                  marginTop: 2,
                }}
              >
                ✓ Released: {nowServing.releasedDate}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              marginTop: 20,
              fontSize: 15,
              color: "var(--color-text-tertiary)",
            }}
          >
            No documents currently being served
          </div>
        )}
      </div>

      {/* ── Per-service breakdown strip ── */}
      {Object.keys(breakdown).length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.entries(DOCUMENT_TYPE_CONFIG).map(([type, cfg]) => {
            if (breakdown[cfg.label]) {
              return (
                <div
                  key={type}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    background: "var(--color-background-primary,#fff)",
                    border:
                      "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
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
              );
            }
            return null;
          })}
        </div>
      )}

      {/* ── Queue grid ── */}
      <div
        style={{
          background: "var(--color-background-primary,#fff)",
          border:
            "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
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
            Awaiting Dry Seal ({todayDate})
          </span>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 500,
              background:
                totalInQueue > 0
                  ? "#EAF3DE"
                  : "var(--color-background-secondary,#f5f5f3)",
              color:
                totalInQueue > 0
                  ? "#27500A"
                  : "var(--color-text-tertiary)",
            }}
          >
            {totalInQueue} in queue
          </span>
        </div>

        {allItems.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              fontSize: 14,
              color: "var(--color-text-tertiary)",
            }}
          >
            No documents awaiting dry seal for today
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {allItems.map((item, i) => (
              <ReleaseCard
                key={item.queueId}
                item={item}
                position={i + 1}
                isServing={item.queueStatus === "serving"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueDisplay;