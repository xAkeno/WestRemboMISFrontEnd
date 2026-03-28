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
    <div>
      <Header/>
        <div className="flex w-full  justify-center pt-32 mb-12 min-h-screen bg-background">
          <div className="animate-fade-in flex w-[50%] flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">My Requests</h2>
                <p className="text-sm text-muted-foreground">Track and manage your document requests</p>
              </div>
              <Link to="/services">
                <Button className="gap-2 w-full sm:w-auto">
                  <PlusCircle className="h-4 w-4" />
                  New Request
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {FILTERS.map((f) => (
                <Button
                  key={f.value}
                  variant={filter === f.value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(f.value)}
                  className="shrink-0"
                >
                  {f.label}
                </Button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No requests found</p>
                <Link to="/new-request">
                  <Button variant="outline" className="mt-4 gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Submit your first request
                  </Button>
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
        </div>
      <Footer/>
    </div>
  );
}
