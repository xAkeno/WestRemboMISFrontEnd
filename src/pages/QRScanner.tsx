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
  Search,
  History,
  Clock,
  User,
  FileText,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Home,
  Building,
  Eye,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import Header from "@/components/forms/Header";
import Footer from "@/components/forms/Footer";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

type ScanState = "idle" | "loading" | "valid" | "invalid" | "error";

type VerifyResult = {
  record_id: number;
  type: string;
  cid: string;
  name: string;
  issued_date: string;
  expires_at: string;
  is_expired: boolean;
  status?: string;
  purpose?: string;
  address?: string;
  contact_number?: string;
  email?: string;
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

// QR Scanner Modal Component
function QRScannerModal({ onClose, onScanSuccess }: { 
  onClose: () => void;
  onScanSuccess: (referenceNumber: string) => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-scanner-container";
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [scanned, setScanned] = useState<string | null>(null);

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScanned(decodedText);
          setScanning(false);
        },
        undefined
      );
    } catch (err: any) {
      setError(err?.message ?? "Camera access denied or not available.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {});
    }
  };

  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, []);

  const handleScanAgain = async () => {
    setScanned(null);
    setScanning(true);
    setError(null);
    await stopScanner();
    setTimeout(() => startScanner(), 300);
  };

  const handleConfirm = () => {
    if (scanned) {
      stopScanner();
      onScanSuccess(scanned);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: NAVY }}>
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-900">Scan QR Code</span>
          </div>
          <button 
            onClick={() => { stopScanner(); onClose(); }} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-green-900/90 backdrop-blur-sm p-4">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm font-bold text-white uppercase tracking-wider">QR Code Detected</p>
              <div className="text-center bg-white/10 rounded-lg p-3 w-full">
                <p className="text-base font-mono text-green-200 break-all">{scanned}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="px-5 py-4 border-t border-gray-100">
          {scanned ? (
            <div className="flex gap-3">
              <button
                onClick={handleScanAgain}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Scan Again
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: NAVY }}
              >
                Verify Document
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center">
              {error 
                ? "Unable to access camera. Please ensure camera permissions are granted." 
                : "Position the QR code within the frame. Detection is automatic."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Manual Search Modal
function ManualSearchModal({ onClose, onSearch }: { 
  onClose: () => void;
  onSearch: (referenceNumber: string) => void;
}) {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!referenceNumber.trim()) {
      setError("Please enter a reference number");
      return;
    }
    onSearch(referenceNumber.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,60,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4" style={{ backgroundColor: NAVY }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-pink-300">Manual Search</p>
              <h2 className="text-white font-bold text-lg">Enter Reference Number</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
              Reference Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => {
                setReferenceNumber(e.target.value);
                setError(null);
              }}
              placeholder="e.g., BCLEAR-001, BCERT-001, BBUILDINGCLE-001, BBUSINESS-001"
              className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all font-mono"
              style={{ borderColor: "#e5e7eb", focusRingColor: NAVY }}
            />
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!referenceNumber.trim()}
            className="w-full py-2.5 text-white text-sm font-semibold uppercase tracking-wider rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: PINK }}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Verify Document
          </button>
        </div>
      </div>
    </div>
  );
}

// Activity Log Component
function ActivityLogTimeline({ logs, isLoading }: { logs: ActivityLog[]; isLoading: boolean }) {
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6" style={{ color: NAVY }} />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 mx-auto mb-3" style={{ color: "#d1d5db" }} />
        <p className="text-sm text-gray-500">No audit history available for this document</p>
      </div>
    );
  }

  const getActionColor = (action: string) => {
    if (action.includes('create')) return { bg: "#D1FAE5", text: "#065F46", icon: CheckCircle };
    if (action.includes('update') || action.includes('status_update')) return { bg: "#DBEAFE", text: "#1E40AF", icon: Eye };
    if (action.includes('delete')) return { bg: "#FEE2E2", text: "#991B1B", icon: XCircle };
    if (action.includes('release')) return { bg: "#D1FAE5", text: "#065F46", icon: CheckCircle };
    return { bg: "#FEF3C7", text: "#854F0D", icon: History };
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
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: actionColor.bg }}
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    >
                      <ActionIcon className="w-4 h-4" style={{ color: actionColor.text }} />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <button
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      By: {log.user_name || log.user_email || 'System'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    
                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: "#f9fafb" }}>
                        <p className="text-xs text-gray-600">
                          <strong>Description:</strong> {log.description || 'No additional details'}
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

export default function DocumentVerifier() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [qrVerifying, setQrVerifying] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ======================
  // FORMAT HELPERS
  // ======================
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatType = (type?: string) => {
    if (!type) return "N/A";

    return type
      .replace("App\\Models\\", "")
      .replace(/([A-Z])/g, " $1")
      .trim();
  };

  // Fetch activity logs for a document
  const fetchActivityLogs = async (documentId: number) => {
    setLoadingLogs(true);
    try {
      const response = await axios.get(
        `https://westrembomis.onrender.com/api/activity-logs`,
        {
          params: { document_id: documentId, per_page: 50 },
          withCredentials: true,
        }
      );
      
      const logs = response.data.data || response.data || [];
      setActivityLogs(logs);
    } catch (err: any) {
      console.error("Failed to fetch activity logs:", err);
      setActivityLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  // ======================
  // UPLOAD + VERIFY (PDF)
  // ======================
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

      const res = await axios.post(
        "https://westrembomis.onrender.com/api/documents/verify",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (res.data.valid) {
        setScanState("valid");
        setResult(res.data.data);
        // Fetch activity logs for this document
        if (res.data.data?.record_id) {
          await fetchActivityLogs(res.data.data.record_id);
        }
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

  // ======================
  // QR CODE VERIFY
  // ======================
  const handleQRVerify = async (referenceNumber: string) => {
    setQrVerifying(true);
    setScanState("loading");
    setErrorMsg("");
    setResult(null);
    setActivityLogs([]);
    setShowAudit(false);

    try {
      // Detect document type from reference number
      let endpoint = "";
      let params: any = {};

      const upperRef = referenceNumber.toUpperCase();
      
      if (upperRef.startsWith("BCLEAR-")) {
        endpoint = "/api/barangay-clearances";
        params = { bcert_number: referenceNumber };
      } else if (upperRef.startsWith("BCERT-")) {
        endpoint = "/api/barangay-certificates";
        params = { bcert_number: referenceNumber };
      } else if (upperRef.startsWith("BBUILDINGCLE-")) {
        endpoint = "/api/building-clearances";
        params = { bcert_number: referenceNumber };
      } else if (upperRef.startsWith("BBUSINESS-")) {
        endpoint = "/api/business-clearances";
        params = { brgy_business_no: referenceNumber };
      } else {
        throw new Error("Invalid reference number format");
      }

      // Search for the document
      const response = await axios.get(`https://westrembomis.onrender.com${endpoint}`, { 
        params: { search: referenceNumber, per_page: 100 },
        withCredentials: true 
      });
      
      const records = response.data.data?.data || response.data.data || [];
      const found = Array.isArray(records) 
        ? records.find((r: any) => {
            const ref = r.bcert_number || r.brgy_business_no;
            return ref?.toUpperCase() === referenceNumber.toUpperCase();
          })
        : null;

      if (found) {
        // Format result to match the expected VerifyResult structure
        const verifyResult: VerifyResult = {
          record_id: found.id,
          type: endpoint.replace("/api/", "").replace(/s$/, ""),
          cid: found.bcert_number || found.brgy_business_no,
          name: `${found.first_name} ${found.surname}${found.extension ? ` ${found.extension}` : ''}`,
          issued_date: found.issued_date || found.created_at,
          expires_at: found.expires_at,
          is_expired: found.status === "EXPIRED",
          status: found.status,
          purpose: found.purpose,
          address: found.street && found.zone ? `${found.street}, Zone ${found.zone}` : (found.address || undefined),
          contact_number: found.contact_number,
          email: found.email
        };
        
        setScanState("valid");
        setResult(verifyResult);
        // Fetch activity logs for this document
        await fetchActivityLogs(found.id);
      } else {
        setScanState("invalid");
        setErrorMsg(`Document not found: ${referenceNumber}`);
      }
    } catch (err: any) {
      console.error("QR verification failed:", err);
      setScanState("error");
      setErrorMsg(err.response?.data?.message || "Verification failed.");
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
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex justify-center pt-32 pb-16 px-4">
        <div className="w-full max-w-2xl">

          {/* HEADER */}
          <div className="text-center mb-10">
            <h1 className="font-bold text-2xl">
              Document <span style={{ color: PINK }}>Verifier</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-2 uppercase">
              Scan QR code, enter reference number, or upload PDF to verify authenticity
            </p>
          </div>

          {/* QR SCANNER BUTTONS */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            <button
              onClick={() => setShowQRScanner(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-lg transition-all hover:opacity-90"
              style={{ backgroundColor: NAVY, color: "white" }}
            >
              <QrCode className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">Scan QR Code</span>
            </button>
            {/* <button
              onClick={() => setShowManualSearch(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-lg transition-all hover:opacity-90"
              style={{ backgroundColor: PINK, color: "white" }}
            >
              <Search className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">Enter Reference #</span>
            </button> */}
          </div>

          {/* OR DIVIDER */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* CARD */}
          <div className="border rounded-sm overflow-hidden">

            {/* TOP BAR */}
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{ backgroundColor: NAVY }}
            >
              <ShieldCheck className="h-4 w-4 text-white" />
              <span className="text-xs text-white uppercase">
                Upload PDF Document
              </span>
            </div>

            <div className="p-6 space-y-6">

              {/* IDLE */}
              {scanState === "idle" && (
                <label className="w-full flex items-center justify-center gap-3 py-4 border cursor-pointer">
                  <FileUp className="h-5 w-5" />
                  Upload PDF Document
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              )}

              {/* LOADING */}
              {scanState === "loading" && (
                <div className="flex flex-col items-center gap-4 py-10">
                  <Loader2 className="animate-spin h-8 w-8" />
                  <p className="text-xs uppercase">
                    {qrVerifying ? "Searching for document..." : "Verifying document..."}
                  </p>
                </div>
              )}

              {/* VALID */}
              {scanState === "valid" && result && (
                <div className="space-y-4">
                  <div className="text-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
                    <p className="font-bold text-green-600 mt-2">Document Verified</p>
                  </div>

                  {/* DOCUMENT DETAILS */}
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
                          {result.is_expired ? (
                            <span className="text-red-600 font-bold">EXPIRED</span>
                          ) : (
                            <span className="text-green-600 font-bold">VALID</span>
                          )}
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
                          <p className="mt-1 text-xs">{result.address}</p>
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

                  {/* VERIFICATION SEAL */}
                  <div className="p-4 text-center rounded-lg border-2" style={{ borderColor: "#D1FAE5", backgroundColor: "#ECFDF5" }}>
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "#065F46" }} />
                    <p className="font-semibold" style={{ color: "#065F46" }}>✓ Official Document</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Verified on {new Date().toLocaleString()}
                    </p>
                  </div>

                  {/* AUDIT HISTORY TOGGLE BUTTON */}
                  <button
                    onClick={() => setShowAudit(!showAudit)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-gray-50"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" style={{ color: NAVY }} />
                      <span className="text-sm font-medium">Audit Trail History</span>
                      <span className="text-xs text-gray-400">
                        ({activityLogs.length} records)
                      </span>
                    </div>
                    {showAudit ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {/* AUDIT HISTORY CONTENT */}
                  {showAudit && (
                    <div className="border rounded-lg p-4" style={{ backgroundColor: "#fafbfc" }}>
                      <ActivityLogTimeline logs={activityLogs} isLoading={loadingLogs} />
                    </div>
                  )}

                  <button
                    onClick={reset}
                    className="w-full py-2 bg-blue-900 text-white text-xs"
                  >
                    Verify Another
                  </button>
                </div>
              )}

              {/* INVALID */}
              {scanState === "invalid" && (
                <div className="space-y-4 text-center">
                  <XCircle className="h-10 w-10 text-red-600 mx-auto" />
                  <p className="font-bold text-red-600">Invalid Document</p>
                  <p className="text-xs">{errorMsg}</p>
                  <button
                    onClick={reset}
                    className="w-full py-2 bg-blue-900 text-white text-xs"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* ERROR */}
              {scanState === "error" && (
                <div className="space-y-4 text-center">
                  <XCircle className="h-10 w-10 text-yellow-600 mx-auto" />
                  <p className="font-bold">Error</p>
                  <p className="text-xs">{errorMsg}</p>
                  <button
                    onClick={reset}
                    className="w-full py-2 bg-blue-900 text-white text-xs"
                  >
                    Retry
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* VERIFICATION METHODS HELP TEXT */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Supported reference numbers: BCLEAR-XXX, BCERT-XXX, BBUILDINGCLE-XXX, BBUSINESS-XXX
            </p>
          </div>

        </div>
      </main>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScannerModal
          onClose={() => setShowQRScanner(false)}
          onScanSuccess={handleQRVerify}
        />
      )}

      {/* Manual Search Modal */}
      {showManualSearch && (
        <ManualSearchModal
          onClose={() => setShowManualSearch(false)}
          onSearch={handleQRVerify}
        />
      )}

      <Footer />
    </div>
  );
}