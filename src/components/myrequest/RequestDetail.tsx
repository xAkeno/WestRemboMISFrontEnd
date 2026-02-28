import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchRequestById } from "../services/api";
import { DOCUMENT_LABELS, STATUS_CONFIG } from "@/types/types";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  FileCheck,
  FileText,
  Upload,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import Header from "../forms/Header";
const NAVY = "#0f2a5e";
const PINK = "#c2467d";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: () => fetchRequestById(id!),
    enabled: !!id,
  });

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      toast({ title: "File Uploaded", description: "Your document has been uploaded successfully." });
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <div
          className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#f0f4ff", borderRadius: 2 }}
        >
          <FileText className="w-7 h-7" style={{ color: NAVY }} />
        </div>
        <p className="text-muted-foreground text-sm mb-4">Request not found.</p>
        <button
          className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200"
          style={{ backgroundColor: NAVY, borderRadius: 1 }}
          onClick={() => navigate("/")}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = NAVY}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const status = STATUS_CONFIG[request.status];

  return (
    <div className="max-w-2xl mx-auto">
      <Header />
      <div className="mb-24">

      </div>
      {/* Back button */}
      <button
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6 transition-colors duration-200 group"
        style={{ color: "#6b7280" }}
        onClick={() => navigate("/myrequest")}
        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = NAVY}
        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#6b7280"}
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Requests
      </button>

      {/* Main card */}
      <div
        className="bg-card border border-border overflow-hidden"
        style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: PINK }}
      >
        {/* Card header */}
        <div
          className="px-6 py-5"
          style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f8faff" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.16em] mb-1"
                style={{ color: PINK }}
              >
                Service Request
              </p>
              <h2
                className="font-bold text-foreground flex items-center gap-2"
                style={{ fontFamily: "'Georgia', serif", fontSize: "1.1rem" }}
              >
                <FileText className="h-5 w-5 flex-shrink-0" style={{ color: NAVY }} />
                {DOCUMENT_LABELS[request.document_type]}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Ref: {request.id}</p>
            </div>

            {/* Status badge */}
            <span
              className="self-start text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border"
              style={{
                backgroundColor: "#f0f4ff",
                color: NAVY,
                borderColor: "#c8d5f0",
                borderRadius: 1,
              }}
            >
              {status?.label || request.status}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-6 space-y-5">

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: PINK }}
              >
                Purpose
              </p>
              <p className="text-foreground font-medium">{request.purpose}</p>
            </div>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: PINK }}
              >
                Date Submitted
              </p>
              <p className="text-foreground font-medium">
                {format(new Date(request.created_at), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Schedule */}
          {request.scheduled_date && (
            <div
              className="flex items-center gap-3 p-4"
              style={{
                backgroundColor: "#f0fdf4",
                borderRadius: 2,
                border: "1px solid #bbf7d0",
                borderLeftWidth: 3,
                borderLeftColor: "#16a34a",
              }}
            >
              <Calendar className="h-5 w-5 flex-shrink-0" style={{ color: "#16a34a" }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: "#15803d" }}>
                  Scheduled Pickup
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(request.scheduled_date), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          )}

          {/* Missing items */}
          {request.missing_items && request.missing_items.length > 0 && (
            <div
              className="p-4"
              style={{
                backgroundColor: "#fefce8",
                borderRadius: 2,
                border: "1px solid #fde68a",
                borderLeftWidth: 3,
                borderLeftColor: "#ca8a04",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: "#ca8a04" }} />
                <p className="font-semibold text-sm" style={{ color: "#92400e" }}>
                  Missing Information Required
                </p>
              </div>
              <ul className="space-y-1.5 ml-7">
                {request.missing_items.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span style={{ color: "#ca8a04", flexShrink: 0 }}>—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Remarks */}
          {request.remarks && (
            <div
              className="p-4"
              style={{
                backgroundColor: "#fff1f2",
                borderRadius: 2,
                border: "1px solid #fecdd3",
                borderLeftWidth: 3,
                borderLeftColor: "#e11d48",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-5 w-5 flex-shrink-0" style={{ color: "#e11d48" }} />
                <p className="font-semibold text-sm" style={{ color: "#9f1239" }}>Remarks</p>
              </div>
              <p className="text-sm text-muted-foreground ml-7">{request.remarks}</p>
            </div>
          )}

          {/* Uploaded files */}
          {request.uploaded_files && request.uploaded_files.length > 0 && (
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: NAVY }}
              >
                <FileCheck className="h-4 w-4" />
                Uploaded Documents
              </p>
              <div className="space-y-2">
                {request.uploaded_files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm p-3"
                    style={{
                      backgroundColor: "#f8faff",
                      borderRadius: 2,
                      border: "1px solid #dde3ed",
                    }}
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" style={{ color: NAVY }} />
                    <span className="text-foreground">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload section */}
          {(request.status === "incomplete" || request.status === "pending") && (
            <div className="pt-5" style={{ borderTop: "1px solid #e5e7eb" }}>
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-3"
                style={{ color: PINK }}
              >
                Upload Additional Documents
              </p>
              <div className="flex gap-3">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="flex-1 text-sm border-border"
                  style={{ borderRadius: 1 }}
                />
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 disabled:opacity-60 shrink-0"
                  style={{ backgroundColor: NAVY, borderRadius: 1 }}
                  onMouseEnter={(e) => {
                    if (!uploading)
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c";
                  }}
                  onMouseLeave={(e) => {
                    if (!uploading)
                      (e.currentTarget as HTMLElement).style.backgroundColor = NAVY;
                  }}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}