import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, AlertTriangle, ChevronRight, FileCheck } from "lucide-react";
import type { DocumentRequest } from "@/types/types";
import { DOCUMENT_LABELS, STATUS_CONFIG } from "@/types/types";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

// Status color map — semantic colors per status
const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  approved:   { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  pending:    { bg: "#fefce8", text: "#ca8a04", border: "#fde68a" },
  processing: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  incomplete: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  rejected:   { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
};

interface Props {
  request: DocumentRequest;
}

export default function RequestCard({ request }: Props) {
  const status = STATUS_CONFIG[request.status];
  const badge = statusStyle[request.status] ?? { bg: "#f0f4ff", text: NAVY, border: "#c8d5f0" };

  return (
    <Link to={`/request/${request.id}`} className="block group">
      <div
        className="bg-card border border-border transition-all duration-200"
        style={{ borderRadius: 2 }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderTopColor = PINK;
          (e.currentTarget as HTMLElement).style.borderTopWidth = "2px";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(10,20,60,0.08)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderTopColor = "";
          (e.currentTarget as HTMLElement).style.borderTopWidth = "";
          (e.currentTarget as HTMLElement).style.boxShadow = "";
          (e.currentTarget as HTMLElement).style.transform = "";
        }}
      >
        <div className="p-4 sm:p-5">

          {/* Top row — title + status + chevron */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">

              {/* Document type + status badge */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3
                  className="font-bold text-sm sm:text-base truncate text-foreground"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {DOCUMENT_LABELS[request.document_type]}
                </h3>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 border shrink-0"
                  style={{
                    backgroundColor: badge.bg,
                    color: badge.text,
                    borderColor: badge.border,
                    borderRadius: 1,
                  }}
                >
                  {status?.label || request.status}
                </span>
              </div>

              {/* Ref ID */}
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: PINK }}>
                Ref: {request.id}
              </p>

              {/* Purpose */}
              <p className="text-sm text-muted-foreground truncate">{request.purpose}</p>
            </div>

            {/* Chevron */}
            <ChevronRight
              className="h-5 w-5 flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:translate-x-0.5"
              style={{ color: "#9ca3af" }}
            />
          </div>

          {/* Missing items alert */}
          {request.missing_items && request.missing_items.length > 0 && (
            <div
              className="mt-3 flex items-start gap-2 p-2.5"
              style={{
                backgroundColor: "#fefce8",
                borderRadius: 1,
                border: "1px solid #fde68a",
                borderLeftWidth: 2,
                borderLeftColor: "#ca8a04",
              }}
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#ca8a04" }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#92400e" }}>
                  Missing Information
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {request.missing_items.join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Footer row — schedule + files + date */}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {request.scheduled_date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color: NAVY }} />
                <span>
                  Pickup: {format(new Date(request.scheduled_date), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            )}

            {request.uploaded_files && request.uploaded_files.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileCheck className="h-3.5 w-3.5 flex-shrink-0" style={{ color: NAVY }} />
                <span>{request.uploaded_files.length} file(s) uploaded</span>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground ml-auto">
              Submitted {format(new Date(request.created_at), "MMM d, yyyy")}
            </p>
          </div>

        </div>

        {/* Bottom pink accent line — grows in on hover */}
        <div
          className="h-px transition-all duration-300 group-hover:opacity-100 opacity-0"
          style={{ backgroundColor: PINK }}
        />
      </div>
    </Link>
  );
}