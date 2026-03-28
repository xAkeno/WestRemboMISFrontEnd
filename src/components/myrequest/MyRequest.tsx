import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "../services/api";
import RequestCard from "./RequestCard";
import { Link } from "react-router-dom";
import { PlusCircle, FileText, Loader2 } from "lucide-react";
import type { RequestStatus } from "@/types/types";
import { useState } from "react";
import Header from "../forms/Header";
import Footer from "../forms/Footer";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

const FILTERS: { label: string; value: RequestStatus | "all" }[] = [
  { label: "All",        value: "all" },
  { label: "Pending",    value: "pending" },
  { label: "Released",   value: "released" },
  { label: "Incomplete", value: "incomplete" },
  { label: "Rejected",   value: "rejected" },
];

export default function MyRequest() {
  const [filter, setFilter] = useState<RequestStatus | "all">("all");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: fetchRequests,
  });

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex justify-center pt-32 pb-16 px-4">
        <div className="w-full max-w-4xl">

          {/* Page Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <div style={{ width: 32, height: 1, backgroundColor: PINK }} />
              <span className="text-xs font-bold uppercase tracking-[0.20em]" style={{ color: PINK }}>
                Document Requests
              </span>
              <div style={{ width: 32, height: 1, backgroundColor: PINK }} />
            </div>
            <h1
              className="font-bold text-foreground mb-3"
              style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.6rem,3.5vw,2.25rem)" }}
            >
              My{" "}
              <span style={{ color: PINK }}>Requests</span>
            </h1>
            <div style={{ width: 48, height: 2, backgroundColor: PINK, margin: "10px auto 12px" }} />
            <p className="text-muted-foreground text-xs uppercase tracking-wider">
              Track and view your document requests
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider shrink-0 transition-all duration-200"
                  style={
                    filter === f.value
                      ? { backgroundColor: NAVY, color: "#fff", borderRadius: 1 }
                      : { backgroundColor: "transparent", color: "#6b7280", border: "1px solid #dde3ed", borderRadius: 1 }
                  }
                  onMouseEnter={(e) => {
                    if (filter !== f.value) {
                      (e.currentTarget as HTMLElement).style.borderColor = PINK;
                      (e.currentTarget as HTMLElement).style.color = PINK;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== f.value) {
                      (e.currentTarget as HTMLElement).style.borderColor = "#dde3ed";
                      (e.currentTarget as HTMLElement).style.color = "#6b7280";
                    }
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* New Request button */}
            <Link to="/services" className="shrink-0">
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200"
                style={{ backgroundColor: NAVY, borderRadius: 1 }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = NAVY}
              >
                <PlusCircle className="h-4 w-4" />
                New Request
              </button>
            </Link>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: NAVY }} />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-20 border"
              style={{ borderRadius: 2, borderColor: "#dde3ed", backgroundColor: "#f8faff", borderStyle: "dashed" }}
            >
              <div
                className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#f0f4ff", borderRadius: 2 }}
              >
                <FileText className="h-7 w-7" style={{ color: NAVY }} />
              </div>
              <p className="font-semibold text-foreground mb-1" style={{ fontFamily: "'Georgia', serif" }}>
                No Requests Found
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {filter === "all"
                  ? "You haven't submitted any requests yet."
                  : `No ${filter} requests at the moment.`}
              </p>
              <Link to="/services">
                <button
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200"
                  style={{ backgroundColor: NAVY, borderRadius: 1 }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = NAVY}
                >
                  <PlusCircle className="h-4 w-4" />
                  Submit Your First Request
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((req) => (
                <RequestCard
                  key={`${req.document_type}-${req.id}`}
                  request={req}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}