import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "../services/api";
import RequestCard from "./RequestCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Loader2 } from "lucide-react";
import type { RequestStatus } from "@/types/types";
import { useState } from "react";
import Header from "../forms/Header";
import Footer from "../forms/Footer";

const FILTERS: { label: string; value: RequestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Incomplete", value: "incomplete" },
  { label: "Rejected", value: "rejected" },
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
        <div className="animate-fade-in w-full max-w-4xl">

          {/* Page Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
              <span
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: "#d45ea3" }}
              >
                Document Requests
              </span>
              <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
            </div>
            <h1
              className="text-3xl sm:text-4xl font-bold text-foreground mb-3"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              My{" "}
              <span style={{ color: "#fa43ae" }}>Requests</span>
            </h1>
            <div
              className="mx-auto mt-3 rounded-full"
              style={{ width: 56, height: 3, backgroundColor: "#d45ea3" }}
            />
            <p className="text-muted-foreground text-sm mt-4">
              Track and manage your document requests
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
                  className="px-4 py-1.5 rounded-full text-sm font-semibold shrink-0 transition-all duration-200"
                  style={
                    filter === f.value
                      ? {
                          backgroundColor: "#d45ea3",
                          color: "#fff",
                          boxShadow: "0 4px 14px rgba(212,94,163,0.28)",
                          transform: "scale(1.05)",
                        }
                      : {
                          backgroundColor: "#fff",
                          color: "#607a86",
                          border: "1px solid #e8eff2",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (filter !== f.value) {
                      (e.currentTarget as HTMLElement).style.borderColor = "#f9a8d4";
                      (e.currentTarget as HTMLElement).style.color = "#d45ea3";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== f.value) {
                      (e.currentTarget as HTMLElement).style.borderColor = "#e8eff2";
                      (e.currentTarget as HTMLElement).style.color = "#607a86";
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
                style={{
                  backgroundColor: "#d45ea3",
                  boxShadow: "0 4px 16px rgba(212,94,163,0.28)",
                }}
              >
                <PlusCircle className="h-4 w-4" />
                New Request
              </button>
            </Link>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2
                className="h-8 w-8 animate-spin"
                style={{ color: "#d45ea3" }}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-20 rounded-2xl border border-dashed"
              style={{ borderColor: "#f9a8d4", backgroundColor: "#fdf2f8" }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#fce7f3" }}
              >
                <FileText className="h-8 w-8" style={{ color: "#d45ea3" }} />
              </div>
              <p className="font-semibold text-foreground mb-1">No requests found</p>
              <p className="text-sm text-muted-foreground mb-6">
                {filter === "all"
                  ? "You haven't submitted any requests yet."
                  : `No ${filter} requests at the moment.`}
              </p>
              <Link to="/new-request">
                <button
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: "#d45ea3", boxShadow: "0 4px 14px rgba(212,94,163,0.25)" }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Submit your first request
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}