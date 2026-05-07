import { useState, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  FileUp,
  History,
  Clock,
  Eye,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  FileSearch,
  Hash,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";
const API = import.meta.env.VITE_WEB_URL;

type ScanState = "idle" | "loading" | "valid" | "invalid" | "error";

type VerifyResult = {
  record_id: number;
  type: string;
  cid: string;
  name: string;
  issued_date: string;
  expires_at: string;
  is_expired: boolean;
  source?: "released" | "downloaded";
};

type ActivityLog = {
  id: number;
  user_name: string;
  user_email: string;
  action: string;
  type: string;
  description: string;
  document_id: number;
  created_at: string;
};

// ─── Activity Log Timeline ────────────────────────────────────────────────────
function ActivityLogTimeline({
  logs,
  isLoading,
}: {
  logs: ActivityLog[];
  isLoading: boolean;
}) {
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  if (isLoading)
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );

  if (!logs || logs.length === 0)
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No audit history available for this document</p>
      </div>
    );

  const getActionColor = (action: string) => {
    if (action.includes("create"))
      return { bg: "bg-green-50", text: "text-green-700", icon: CheckCircle };
    if (action.includes("update") || action.includes("status_update"))
      return { bg: "bg-blue-50", text: "text-blue-700", icon: Eye };
    if (action.includes("delete"))
      return { bg: "bg-red-50", text: "text-red-700", icon: XCircle };
    if (action.includes("release"))
      return { bg: "bg-green-50", text: "text-green-700", icon: CheckCircle };
    return { bg: "bg-amber-50", text: "text-amber-700", icon: History };
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, idx) => {
          const actionColor = getActionColor(log.action);
          const ActionIcon = actionColor.icon;
          const isExpanded = expandedLog === log.id;
          return (
            <li key={log.id}>
              <div className="relative pb-8">
                {idx !== logs.length - 1 && (
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" />
                )}
                <div className="relative flex space-x-3">
                  <button
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-background cursor-pointer hover:scale-110 transition-transform ${actionColor.bg} ${actionColor.text}`}
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    <ActionIcon className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-foreground">
                        {log.action.replace(/_/g, " ").toUpperCase()}
                      </div>
                      <button
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      By: {log.user_name || log.user_email || "System"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">
                          <strong>Description:</strong> {log.description || "No additional details"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>Document ID:</strong> {log.document_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Log Type:</strong> {log.type}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Admin PDF Verifier ───────────────────────────────────────────────────────
export default function AdminDocumentVerifier() {
  const { toast } = useToast();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (d?: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatType = (t?: string) => {
    if (!t) return "N/A";
    return t
      .replace("App\\Models\\", "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const fetchActivityLogs = async (documentId: number) => {
    setLoadingLogs(true);
    try {
      const res = await axios.get(`${API}/api/activity-logs`, {
        params: { document_id: documentId, per_page: 50 },
        withCredentials: true,
      });
      setActivityLogs(res.data.data || res.data || []);
    } catch {
      setActivityLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileHash(null);
    setScanState("loading");
    setErrorMsg("");
    setResult(null);
    setActivityLogs([]);
    setShowAudit(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API}/api/documents/verify`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data.data?.hash) setFileHash(res.data.data.hash);

      if (res.data.valid) {
        setScanState("valid");
        setResult(res.data.data);
        if (res.data.data?.record_id) await fetchActivityLogs(res.data.data.record_id);
        toast({
          title: "Document Verified",
          description: "Document hash matches and is authentic.",
        });
      } else {
        setScanState("invalid");
        setErrorMsg(res.data.message || "Document hash not found in the database.");
        toast({
          title: "Verification Failed",
          description: res.data.message || "Document hash not found in the database.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setScanState("error");
      const errorMessage = err.response?.data?.message || "Verification failed. Please try again.";
      setErrorMsg(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const reset = () => {
    setScanState("idle");
    setResult(null);
    setErrorMsg("");
    setActivityLogs([]);
    setShowAudit(false);
    setFileName(null);
    setFileHash(null);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[900px] mx-auto">
          {/* ── Header ── */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Document Verifier</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verify PDF authenticity 
            </p>
          </div>

          {/* ── Info Banner ── */}
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <FileSearch className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
              <div className="text-xs text-blue-900">
                <strong>Admin Tool:</strong> Upload a PDF to verify its SHA-256 hash against both
                released documents (<code className="bg-blue-100 px-1 rounded">document_hash</code>) and downloaded documents
                (<code className="bg-blue-100 px-1 rounded">downloaded_document_hash</code>) in the database.
              </div>
            </div>
          </div> */}

          {/* ── Main Card ── */}
          <div className="bg-card rounded-lg border border-border shadow-sm">
            {/* Card Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-muted/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSearch className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Upload PDF to Verify</span>
            </div>

            {/* Card Content */}
            <div className="p-6">
              {/* ── IDLE/INVALID/ERROR STATE ── */}
              {(scanState === "idle" || scanState === "invalid" || scanState === "error") && (
                <label className="w-full flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileUp className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Click to upload PDF</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF files only · Max 20MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              )}

              {/* ── LOADING STATE ── */}
              {scanState === "loading" && (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Verifying document…</p>
                    {fileName && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{fileName}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Computing SHA-256 hash and checking database…
                    </p>
                  </div>
                </div>
              )}

              {/* ── VALID STATE ── */}
              {scanState === "valid" && result && (
                <div className="space-y-4">
                  {/* Success Header */}
                  <div className="text-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
                    <p className="font-bold text-green-600 mt-2">Document Authentic</p>
                    {result.source && (
                      <span
                        className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          backgroundColor:
                            result.source === "released" ? "#d1fae5" : "#dbeafe",
                          color: result.source === "released" ? "#065f46" : "#1e40af",
                        }}
                      >
                        Matched:{" "}
                        {result.source === "released"
                          ? "Released Document"
                          : "Downloaded Document"}
                      </span>
                    )}
                  </div>

                  {/* Hash Display */}
                  {fileHash && (
                    <div className="p-3 rounded-lg border border-border bg-muted/50">
                      <div className="flex items-start gap-2">
                        <Hash className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-0.5">SHA-256 Hash</p>
                          <p className="text-xs font-mono text-foreground break-all">{fileHash}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Result Grid */}
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="grid grid-cols-2 gap-0">
                      <div className="p-3 border-b border-r border-border bg-muted/30">
                        <span className="text-xs text-muted-foreground">Record ID</span>
                        <p className="font-medium mt-1 text-sm">{result.record_id}</p>
                      </div>
                      <div className="p-3 border-b border-border bg-muted/30">
                        <span className="text-xs text-muted-foreground">Document Type</span>
                        <p className="font-medium mt-1 text-sm">{formatType(result.type)}</p>
                      </div>
                      <div className="p-3 border-r border-border">
                        <span className="text-xs text-muted-foreground">IPFS CID</span>
                        <div className="flex items-center gap-1 mt-1">
                          <p className="font-mono text-xs text-foreground truncate">
                            {result.cid}
                          </p>
                          {result.cid && (
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${result.cid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0"
                            >
                              <ExternalLink className="h-3 w-3 text-blue-500 hover:text-blue-700" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="p-3">
                        <span className="text-xs text-muted-foreground">Validity</span>
                        <p className="mt-1">
                          {result.is_expired
                            ? <span className="text-red-600 font-bold text-sm">EXPIRED</span>
                            : <span className="text-green-600 font-bold text-sm">VALID</span>}
                        </p>
                      </div>
                      <div className="p-3 border-r border-t border-border bg-muted/30">
                        <span className="text-xs text-muted-foreground">Applicant Name</span>
                        <p className="font-medium mt-1 text-sm">{result.name}</p>
                      </div>
                      <div className="p-3 border-t border-border bg-muted/30">
                        <span className="text-xs text-muted-foreground">Issued Date</span>
                        <p className="mt-1 text-sm">{formatDate(result.issued_date)}</p>
                      </div>
                      {result.expires_at && (
                        <div className="p-3 border-r border-t border-border">
                          <span className="text-xs text-muted-foreground">Expires At</span>
                          <p className="mt-1 text-sm">{formatDate(result.expires_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audit Trail Toggle */}
                  <button
                    onClick={() => setShowAudit(!showAudit)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Audit Trail</span>
                      <span className="text-xs text-muted-foreground">
                        ({activityLogs.length} records)
                      </span>
                    </div>
                    {showAudit
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {/* Audit Timeline */}
                  {showAudit && (
                    <div className="border border-border rounded-lg p-4 bg-muted/20">
                      <ActivityLogTimeline logs={activityLogs} isLoading={loadingLogs} />
                    </div>
                  )}

                  {/* Reset Button */}
                  <Button onClick={reset} className="w-full" size="sm">
                    Verify Another Document
                  </Button>
                </div>
              )}

              {/* ── INVALID STATE ── */}
              {scanState === "invalid" && (
                <div className="space-y-4 text-center pt-4">
                  <XCircle className="h-10 w-10 text-red-600 mx-auto" />
                  <div>
                    <p className="font-bold text-red-600">Not Authentic</p>
                    <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
                    {fileName && (
                      <p className="text-xs text-muted-foreground mt-2 font-mono">{fileName}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg text-xs text-left bg-red-50 border border-red-200">
                    <p className="font-semibold text-red-700 mb-1">Possible reasons:</p>
                    <ul className="text-red-600 space-y-0.5 list-disc list-inside text-xs">
                      <li>The document was not issued by this barangay</li>
                      <li>The document has been altered or tampered with</li>
                      <li>The document was re-generated (hash changed)</li>
                      <li>The document has not been registered yet</li>
                    </ul>
                  </div>
                  <Button onClick={reset} className="w-full" size="sm" variant="outline">
                    Try Another File
                  </Button>
                </div>
              )}

              {/* ── ERROR STATE ── */}
              {scanState === "error" && (
                <div className="space-y-4 text-center pt-4">
                  <AlertTriangle className="h-10 w-10 text-yellow-600 mx-auto" />
                  <div>
                    <p className="font-bold text-foreground">Verification Error</p>
                    <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
                  </div>
                  <Button onClick={reset} className="w-full" size="sm" variant="outline">
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}