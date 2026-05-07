import { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  FileUp,
  QrCode,
  Camera,
  X,
  History,
  Clock,
  Eye,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import Header from "@/components/forms/Header";
import Footer from "@/components/forms/Footer";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";
const API  = import.meta.env.VITE_WEB_URL;

type ScanState = "idle" | "loading" | "valid" | "invalid" | "error";

type VerifyResult = {
  record_id:       number;
  type:            string;
  cid:             string;
  name:            string;
  issued_date:     string;
  expires_at:      string;
  is_expired:      boolean;
  status?:         string;
  purpose?:        string;
  address?:        string;
  contact_number?: string;
  email?:          string;
};

type ActivityLog = {
  id:          number;
  user_name:   string;
  user_email:  string;
  action:      string;
  type:        string;
  description: string;
  document_id: number;
  created_at:  string;
};

// ─── Extract ref + key from scanned URL ──────────────────────────────────────
function extractFromUrl(raw: string): { ref: string; key: string | null } {
  try {
    const url   = new URL(raw);
    const match = url.pathname.match(/\/verify\/(.+)$/);
    const ref   = match?.[1] ?? raw;
    const key   = url.searchParams.get("key");
    return { ref, key };
  } catch {
    return { ref: raw, key: null };
  }
}

// ─── QR Scanner Modal ─────────────────────────────────────────────────────────
function QRScannerModal({
  onClose,
  onScanSuccess,
}: {
  onClose: () => void;
  onScanSuccess: (ref: string, key: string | null) => void;
}) {
  const scannerRef  = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-scanner-container";
  const [error,   setError]   = useState<string | null>(null);
  const [scanned, setScanned] = useState<string | null>(null);

  const startScanner = async () => {
    try {
      if (!scannerRef.current)
        scannerRef.current = new Html5Qrcode(containerId);
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => setScanned(decodedText),
        undefined,
      );
    } catch (err: any) {
      setError(err?.message ?? "Camera access denied or not available.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning)
      await scannerRef.current.stop().catch(() => {});
  };

  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, []);

  // Auto-fire as soon as a QR is detected
  useEffect(() => {
    if (!scanned) return;
    stopScanner();
    const { ref, key } = extractFromUrl(scanned);
    onScanSuccess(ref, key);
    onClose();
  }, [scanned]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: NAVY }}
            >
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-900">Scan QR Code</span>
          </div>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="relative bg-black" style={{ minHeight: 350 }}>
          <div id={containerId} className="w-full" />
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 px-6">
              <Camera className="h-10 w-10 text-gray-500" />
              <p className="text-sm text-gray-300 text-center">{error}</p>
              <button
                onClick={startScanner}
                className="px-4 py-2 text-xs font-semibold rounded-lg"
                style={{ backgroundColor: NAVY, color: "white" }}
              >
                Retry
              </button>
            </div>
          )}
          {scanned && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-green-900/90 p-4">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm font-bold text-white uppercase tracking-wider">QR Code Detected</p>
              <p className="text-xs text-green-300 animate-pulse">Verifying…</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            {error
              ? "Unable to access camera. Please ensure camera permissions are granted."
              : scanned
              ? "Document found — verifying automatically…"
              : "Position the QR code within the frame. Detection is automatic."}
          </p>
        </div>
      </div>
    </div>
  );
}

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
        <Loader2 className="animate-spin h-6 w-6" style={{ color: NAVY }} />
      </div>
    );

  if (!logs || logs.length === 0)
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 mx-auto mb-3" style={{ color: "#d1d5db" }} />
        <p className="text-sm text-gray-500">No audit history available for this document</p>
      </div>
    );

  const getActionColor = (action: string) => {
    if (action.includes("create"))
      return { bg: "#D1FAE5", text: "#065F46", icon: CheckCircle };
    if (action.includes("update") || action.includes("status_update"))
      return { bg: "#DBEAFE", text: "#1E40AF", icon: Eye };
    if (action.includes("delete"))
      return { bg: "#FEE2E2", text: "#991B1B", icon: XCircle };
    if (action.includes("release"))
      return { bg: "#D1FAE5", text: "#065F46", icon: CheckCircle };
    return { bg: "#FEF3C7", text: "#854F0D", icon: History };
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, idx) => {
          const actionColor = getActionColor(log.action);
          const ActionIcon  = actionColor.icon;
          const isExpanded  = expandedLog === log.id;
          return (
            <li key={log.id}>
              <div className="relative pb-8">
                {idx !== logs.length - 1 && (
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                )}
                <div className="relative flex space-x-3">
                  <span
                    className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: actionColor.bg }}
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    <ActionIcon className="w-4 h-4" style={{ color: actionColor.text }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {log.action.replace(/_/g, " ").toUpperCase()}
                      </div>
                      <button
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      By: {log.user_name || log.user_email || "System"}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: "#f9fafb" }}>
                        <p className="text-xs text-gray-600">
                          <strong>Description:</strong> {log.description || "No additional details"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Document ID:</strong> {log.document_id}
                        </p>
                        <p className="text-xs text-gray-500">
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DocumentVerifier() {
  const [scanState,     setScanState]     = useState<ScanState>("idle");
  const [result,        setResult]        = useState<VerifyResult | null>(null);
  const [errorMsg,      setErrorMsg]      = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrVerifying,   setQrVerifying]   = useState(false);
  const [activityLogs,  setActivityLogs]  = useState<ActivityLog[]>([]);
  const [loadingLogs,   setLoadingLogs]   = useState(false);
  const [showAudit,     setShowAudit]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auto-verify from URL on mount ─────────────────────────────────────────
  useEffect(() => {
    const match = window.location.pathname.match(/\/verify\/(.+)$/);
    if (match?.[1]) {
      const ref = match[1];
      const key = new URLSearchParams(window.location.search).get("key") ?? null;
      handleQRVerify(ref, key);
    }
  }, []);

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
    return t.replace("App\\Models\\", "").replace(/([A-Z])/g, " $1").trim();
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

  // ── Upload PDF verify ─────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      if (res.data.valid) {
        setScanState("valid");
        setResult(res.data.data);
        if (res.data.data?.record_id) await fetchActivityLogs(res.data.data.record_id);
      } else {
        setScanState("invalid");
        setErrorMsg(res.data.message);
      }
    } catch (err: any) {
      setScanState("error");
      setErrorMsg(err.response?.data?.message || "Verification failed.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── QR / URL verify (shared) ──────────────────────────────────────────────
  const handleQRVerify = async (referenceNumber: string, key: string | null) => {
    setQrVerifying(true);
    setScanState("loading");
    setErrorMsg("");
    setResult(null);
    setActivityLogs([]);
    setShowAudit(false);

    try {
      // ── Step 1: Require a key — no key = invalid, stop immediately ──────
      if (!key) {
        setScanState("invalid");
        setErrorMsg("This QR code is missing a security signature and cannot be verified.");
        return;
      }

      // ── Step 2: Validate HMAC signature ──────────────────────────────────
      try {
        const sigCheck = await axios.get(`${API}/api/verify-qr`, {
          params: { ref: referenceNumber, key },
          withCredentials: true,
        });
        if (!sigCheck.data.valid) {
          setScanState("invalid");
          setErrorMsg("This QR code is invalid or has been tampered with.");
          return;
        }
      } catch (sigErr: any) {
        if (sigErr.response?.status === 403) {
          setScanState("invalid");
          setErrorMsg("This QR code is invalid or has been tampered with.");
          return;
        }
        // Any other error (network/server down) — surface it, don't skip
        setScanState("error");
        setErrorMsg("Could not reach the signature verification service. Please try again.");
        return;
      }

      // ── Step 3: Build endpoint + params ──────────────────────────────────
      let endpoint = "";
      let params: Record<string, any> = {};
      const upperRef = referenceNumber.toUpperCase();

      if (upperRef.startsWith("BC-")) {
        endpoint = "/api/barangay-clearances";
        params   = { bcert_number: referenceNumber, per_page: 100 };
      } else if (upperRef.startsWith("BCERT-")) {
        endpoint = "/api/barangay-certificates";
        params   = { bcert_number: referenceNumber, per_page: 100 };
      } else if (upperRef.startsWith("BDC-")) {
        endpoint = "/api/building-clearances";
        params   = { bcert_number: referenceNumber, per_page: 100 };
      } else if (upperRef.startsWith("BBC-")) {
        endpoint = "/api/business-clearances";
        params   = { brgy_business_no: referenceNumber, per_page: 100 };
      } else {
        throw new Error(`Unrecognized reference number: "${referenceNumber}".`);
      }

      // ── Step 4: Fetch document list ───────────────────────────────────────
      const response = await axios.get(`${API}${endpoint}`, {
        params,
        withCredentials: true,
      });

      const records = response.data.data?.data ?? response.data.data ?? response.data ?? [];
      const found   = Array.isArray(records)
        ? records.find((r: any) => {
            const ref = r.bcert_number || r.brgy_business_no;
            return ref?.toUpperCase() === referenceNumber.toUpperCase();
          })
        : null;

      if (found) {
        const verifyResult: VerifyResult = {
          record_id:      found.id,
          type:           endpoint.replace("/api/", "").replace(/s$/, ""),
          cid:            found.bcert_number || found.brgy_business_no,
          name:           `${found.first_name} ${found.surname}${found.extension ? ` ${found.extension}` : ""}`,
          issued_date:    found.issued_date || found.created_at,
          expires_at:     found.expires_at,
          is_expired:     found.status === "EXPIRED",
          status:         found.status,
          purpose:        found.purpose,
          address:        found.street && found.zone
                            ? `${found.street}, Zone ${found.zone}`
                            : found.address || undefined,
          contact_number: found.contact_number,
          email:          found.email,
        };
        setScanState("valid");
        setResult(verifyResult);
        await fetchActivityLogs(found.id);
      } else {
        setScanState("invalid");
        setErrorMsg(`Document not found: ${referenceNumber}`);
      }
    } catch (err: any) {
      console.error("Verification failed:", err);
      setScanState("error");
      setErrorMsg(err.response?.data?.message || err.message || "Verification failed.");
    } finally {
      setQrVerifying(false);
    }
  };

  const reset = () => {
    setScanState("idle");
    setResult(null);
    setErrorMsg("");
    setActivityLogs([]);
    setShowAudit(false);
    window.history.replaceState(null, "", "/verify");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex justify-center pt-32 pb-16 px-4">
        <div className="w-full max-w-2xl">

          <div className="text-center mb-10">
            <h1 className="font-bold text-2xl">
              Document <span style={{ color: PINK }}>Verifier</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-2 uppercase">
              Scan QR code or upload PDF to verify authenticity
            </p>
          </div>

          {scanState === "idle" && (
            <div className="mb-6">
              <button
                onClick={() => setShowQRScanner(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg hover:opacity-90 transition-all"
                style={{ backgroundColor: NAVY, color: "white" }}
              >
                <QrCode className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase">Scan QR Code</span>
              </button>
            </div>
          )}

          {scanState === "idle" && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          <div className="border rounded-sm overflow-hidden">
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{ backgroundColor: NAVY }}
            >
              <ShieldCheck className="h-4 w-4 text-white" />
              <span className="text-xs text-white uppercase">
                {scanState === "loading"
                  ? "Verifying Document…"
                  : scanState === "valid"
                  ? "Verification Result"
                  : "Upload PDF Document"}
              </span>
            </div>

            <div className="p-6 space-y-6">

              {/* ── IDLE ── */}
              {scanState === "idle" && (
                <label className="w-full flex items-center justify-center gap-3 py-4 border cursor-pointer hover:bg-gray-50 transition-colors rounded">
                  <FileUp className="h-5 w-5" />
                  <span className="text-sm">Upload PDF Document</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              )}

              {/* ── LOADING ── */}
              {scanState === "loading" && (
                <div className="flex flex-col items-center gap-4 py-10">
                  <Loader2 className="animate-spin h-8 w-8" style={{ color: NAVY }} />
                  <p className="text-xs uppercase text-gray-500">
                    {qrVerifying ? "Searching for document…" : "Verifying document…"}
                  </p>
                </div>
              )}

              {/* ── VALID ── */}
              {scanState === "valid" && result && (
                <div className="space-y-4">
                  <div className="text-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
                    <p className="font-bold text-green-600 mt-2">Document Verified</p>
                  </div>

                  <div className="text-xs border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 gap-0">
                      <div className="p-3 border-b border-r" style={{ backgroundColor: "#f9fafb" }}>
                        <span className="text-gray-500">Record ID</span>
                        <p className="font-medium mt-1">{result.record_id}</p>
                      </div>
                      <div className="p-3 border-b" style={{ backgroundColor: "#f9fafb" }}>
                        <span className="text-gray-500">Document Type</span>
                        <p className="font-medium mt-1">{formatType(result.type)}</p>
                      </div>
                      <div className="p-3 border-r">
                        <span className="text-gray-500">Reference Number</span>
                        <p className="font-mono font-medium mt-1">{result.cid}</p>
                      </div>
                      <div className="p-3">
                        <span className="text-gray-500">Status</span>
                        <p className="mt-1">
                          {result.is_expired
                            ? <span className="text-red-600 font-bold">EXPIRED</span>
                            : <span className="text-green-600 font-bold">VALID</span>}
                        </p>
                      </div>
                      <div className="p-3 border-r border-t">
                        <span className="text-gray-500">Applicant Name</span>
                        <p className="font-medium mt-1">{result.name}</p>
                      </div>
                      <div className="p-3 border-t">
                        <span className="text-gray-500">Issued Date</span>
                        <p className="mt-1">{formatDate(result.issued_date)}</p>
                      </div>
                      {result.expires_at && (
                        <div className="p-3 border-r border-t">
                          <span className="text-gray-500">Expires At</span>
                          <p className="mt-1">{formatDate(result.expires_at)}</p>
                        </div>
                      )}
                      {result.purpose && (
                        <div className="p-3 border-t">
                          <span className="text-gray-500">Purpose</span>
                          <p className="mt-1">{result.purpose}</p>
                        </div>
                      )}
                      {result.address && (
                        <div className="p-3 border-r border-t">
                          <span className="text-gray-500">Address</span>
                          <p className="mt-1">{result.address}</p>
                        </div>
                      )}
                      {result.contact_number && (
                        <div className="p-3 border-t">
                          <span className="text-gray-500">Contact</span>
                          <p className="mt-1">{result.contact_number}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="p-4 text-center rounded-lg border-2"
                    style={{ borderColor: "#D1FAE5", backgroundColor: "#ECFDF5" }}
                  >
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "#065F46" }} />
                    <p className="font-semibold" style={{ color: "#065F46" }}>✓ Official Document</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Verified on {new Date().toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAudit(!showAudit)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-all"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" style={{ color: NAVY }} />
                      <span className="text-sm font-medium">Audit Trail History</span>
                      <span className="text-xs text-gray-400">({activityLogs.length} records)</span>
                    </div>
                    {showAudit
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {showAudit && (
                    <div className="border rounded-lg p-4" style={{ backgroundColor: "#fafbfc" }}>
                      <ActivityLogTimeline logs={activityLogs} isLoading={loadingLogs} />
                    </div>
                  )}

                  <button
                    onClick={reset}
                    className="w-full py-2 text-white text-xs rounded"
                    style={{ backgroundColor: NAVY }}
                  >
                    Verify Another
                  </button>
                </div>
              )}

              {/* ── INVALID ── */}
              {scanState === "invalid" && (
                <div className="space-y-4 text-center">
                  <XCircle className="h-10 w-10 text-red-600 mx-auto" />
                  <p className="font-bold text-red-600">Invalid Document</p>
                  <p className="text-xs text-gray-600">{errorMsg}</p>
                  <button
                    onClick={reset}
                    className="w-full py-2 text-white text-xs rounded"
                    style={{ backgroundColor: NAVY }}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* ── ERROR ── */}
              {scanState === "error" && (
                <div className="space-y-4 text-center">
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
                  <p className="font-bold text-gray-800">Error</p>
                  <p className="text-xs text-gray-600">{errorMsg}</p>
                  <button
                    onClick={reset}
                    className="w-full py-2 text-white text-xs rounded"
                    style={{ backgroundColor: NAVY }}
                  >
                    Retry
                  </button>
                </div>
              )}

            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Supported: BCLEAR-XXX · BCERT-XXX · BBUILDINGCLE-XXX · BBUSINESS-XXX
            </p>
          </div>
        </div>
      </main>

      {showQRScanner && (
        <QRScannerModal
          onClose={() => setShowQRScanner(false)}
          onScanSuccess={(ref, key) => handleQRVerify(ref, key)}
        />
      )}

      <Footer />
    </div>
  );
}