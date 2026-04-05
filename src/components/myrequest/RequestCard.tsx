import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, AlertTriangle, ChevronRight, FileCheck, Download, Loader2 } from "lucide-react";
import type { DocumentRequest } from "@/types/types";
import { DOCUMENT_LABELS, STATUS_CONFIG } from "@/types/types";
import { useDownloadReleasedDoc } from "./useDownloadReleasedDoc";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  approved:   { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  pending:    { bg: "#fefce8", text: "#ca8a04", border: "#fde68a" },
  processing: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  incomplete: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  rejected:   { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
  released:   { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
};

interface Props {
  request: DocumentRequest;
}

export default function RequestCard({ request }: Props) {
  const { download, isLoading } = useDownloadReleasedDoc();

  const normalizedStatus = request.raw.status?.toLowerCase();
  const isReleased = normalizedStatus === "released";
  const badge = statusStyle[normalizedStatus] ?? { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
  const downloading = isLoading(request.document_type, request.id);

  return (
    <Link to={`/request/${request.document_type}/${request.id}`} state={{ request }} className="block group">
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
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3
                  className="font-bold text-sm sm:text-base truncate text-foreground"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {DOCUMENT_LABELS[request.document_type]}
                </h3>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 border shrink-0"
                  style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border, borderRadius: 1 }}
                >
                  {normalizedStatus}
                </span>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: PINK }}>
                {request.bcert_number}
              </p>
            </div>

            <ChevronRight
              className="h-5 w-5 flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:translate-x-0.5"
              style={{ color: "#9ca3af" }}
            />
          </div>

          {/* Released download banner */}
          {isReleased && (
            <div
              className="mt-3 flex items-center justify-between gap-3 p-3"
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #86efac",
                borderLeftWidth: 3,
                borderLeftColor: "#16a34a",
                borderRadius: 2,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className="h-4 w-4 shrink-0" style={{ color: "#16a34a" }} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#15803d" }}>
                    Document Ready
                  </p>
                  <p className="text-xs truncate" style={{ color: "#166534" }}>
                    Your document has been officially released.
                  </p>
                </div>
              </div>

              {/* Download button — stops Link propagation */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  download(request.document_type, request.id);
                }}
                disabled={downloading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shrink-0 disabled:opacity-60 transition-colors"
                style={{ backgroundColor: "#16a34a", borderRadius: 2 }}
                onMouseEnter={(e) => !downloading && ((e.currentTarget as HTMLElement).style.backgroundColor = "#15803d")}
                onMouseLeave={(e) => !downloading && ((e.currentTarget as HTMLElement).style.backgroundColor = "#16a34a")}
              >
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {downloading ? "Loading..." : "Download"}
              </button>
            </div>
          )}

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

          {/* Footer row */}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <p className="text-sm text-muted-foreground truncate">{request.purpose}</p>

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

        {/* Bottom pink accent line */}
        <div
          className="h-px transition-all duration-300 group-hover:opacity-100 opacity-0"
          style={{ backgroundColor: PINK }}
        />
      </div>
    </Link>
  );
}