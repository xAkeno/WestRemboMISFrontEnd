import { useState, useEffect, useCallback, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertTriangle, CheckCircle, QrCode, User, ChevronRight, Search } from "lucide-react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueueItem {
  id: number;
  document_type: string;
  document_id: number;
  reference_number: string;
  status: "waiting" | "serving" | "done";
  queue_date: string;
  manual_added: boolean;
  applicant_name?: string;
  business_name?: string | null;
}

export interface DisplayQueueItem {
  queueId: number;
  queueStatus: string;
  refNumber: string;
  documentType: string;
  documentId: number;
  applicantName?: string;
  businessName?: string | null;
  serviceLabel: string;
  queueDate: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_MS = 5000;

const DOCUMENT_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'barangay_clearance': { label: 'Barangay Clearance', color: '#0C447C', bg: '#E6F1FB' },
  'barangay_certificate': { label: 'Barangay Certificate', color: '#085041', bg: '#E1F5EE' },
  'building_clearance': { label: 'Building Clearance', color: '#633806', bg: '#FAEEDA' },
  'business_clearance': { label: 'Business Clearance', color: '#712B13', bg: '#FAECE7' },
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  WAITING:     { bg: "#E6F1FB", color: "#0C447C" },
  SERVING:     { bg: "#EAF3DE", color: "#27500A" },
  DONE:        { bg: "#FCEBEB", color: "#791F1F" },
};

const statusStyle = (s: string) =>
  STATUS_STYLE[s.toUpperCase()] ?? { bg: "#F1EFE8", color: "#5F5E5A" };

// ─── API Functions ────────────────────────────────────────────────────────────

async function fetchQueueItems(): Promise<DisplayQueueItem[]> {
  const queueRes = await api.get("api/queue");
  const rawData = queueRes.data?.data;
  let queueItems: QueueItem[] = Array.isArray(rawData)
    ? rawData
    : (rawData?.data ?? []);
  
  const today = new Date().toDateString();
  queueItems = queueItems.filter(item => {
    const queueDate = new Date(item.queue_date).toDateString();
    return queueDate === today;
  });
  
  return queueItems.map(item => {
    const docConfig = DOCUMENT_TYPE_LABELS[item.document_type] || { 
      label: item.document_type, 
      color: "#5F5E5A", 
      bg: "#F1EFE8" 
    };
    
    return {
      queueId: item.id,
      queueStatus: item.status,
      refNumber: item.reference_number,
      documentType: item.document_type,
      documentId: item.document_id,
      applicantName: item.applicant_name,
      businessName: item.business_name,
      serviceLabel: docConfig.label,
      queueDate: item.queue_date,
    };
  });
}

// ─── QR Scanner Modal Component ───────────────────────────────────────────────

function QRScannerModal({ onClose, onScanSuccess }: { 
  onClose: () => void;
  onScanSuccess: (result: { documentType: string; referenceNumber: string }) => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-scanner-container-queue";
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [scanned, setScanned] = useState<{ type: string; ref: string } | null>(null);

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          let documentType = "";
          let referenceNumber = decodedText;
          
          if (decodedText.includes("|")) {
            const parts = decodedText.split("|");
            documentType = parts[0];
            referenceNumber = parts[1];
          } else if (decodedText.includes(":")) {
            const parts = decodedText.split(":");
            documentType = parts[0];
            referenceNumber = parts[1];
          } else {
            const upperRef = decodedText.toUpperCase();
            if (upperRef.startsWith("BCERT-")) {
              documentType = "barangay_certificate";
              referenceNumber = decodedText;
            } else if (upperRef.startsWith("BCLEAR-")) {
              documentType = "barangay_clearance";
              referenceNumber = decodedText;
            } else if (upperRef.startsWith("BBUILDINGCLE-")) {
              documentType = "building_clearance";
              referenceNumber = decodedText;
            } else if (upperRef.startsWith("BBUSINESS-")) {
              documentType = "business_clearance";
              referenceNumber = decodedText;
            }
          }
          
          setScanned({ type: documentType, ref: referenceNumber });
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
      onScanSuccess({ documentType: scanned.type, referenceNumber: scanned.ref });
      onClose();
    }
  };

  const getTypeLabel = (type: string) => {
    return DOCUMENT_TYPE_LABELS[type]?.label || type || "Unknown";
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Scan QR Code</span>
          </div>
          <button onClick={() => { stopScanner(); onClose(); }} className="p-1 hover:bg-gray-100 rounded-md">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="relative bg-black" style={{ minHeight: 300 }}>
          <div id={containerId} className="w-full" />
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 px-6">
              <Camera className="h-8 w-8 text-gray-400" />
              <p className="text-xs text-gray-300 text-center">{error}</p>
            </div>
          )}
          {scanned && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-green-900/80 p-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">QR Detected</p>
              <div className="text-center">
                <p className="text-sm font-mono text-green-200 break-all">{scanned.ref}</p>
                {scanned.type && (
                  <p className="text-xs text-green-300 mt-1">
                    Type: {getTypeLabel(scanned.type)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
          {scanned ? (
            <div className="flex gap-2">
              <button
                onClick={handleScanAgain}
                className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Scan Again
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 text-sm font-bold text-white rounded-lg transition-colors"
                style={{ backgroundColor: "#0f2a5e" }}
              >
                Add to Queue
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 text-center">
              {error ? "Camera access was denied. Please allow camera permissions and try again." : "Point your camera at the QR code. Detection is automatic — no button needed."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Manual Add Modal Component ───────────────────────────────────────────────

function ManualAddModal({ onClose, onAdd, onRefresh }: { 
  onClose: () => void; 
  onAdd: () => void;
  onRefresh: () => void;
}) {
  const [documentType, setDocumentType] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!documentType || !referenceNumber) {
      setError("Please select document type and enter reference number");
      return;
    }

    setSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const res = await api.get("api/queue/search-bcert", {
        params: { document_type: documentType, bcert_number: referenceNumber }
      });
      
      if (res.data.status === "success") {
        setSearchResult(res.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("No document found with that reference number");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Document is not released today");
      } else {
        setError(err.response?.data?.message || "Search failed");
      }
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!searchResult) return;

    setAdding(true);
    setError(null);

    try {
      await api.post("api/queue/manual-add", {
        document_type: documentType,
        document_id: searchResult.id,
        reference_number: searchResult.reference_number,
        force: searchResult.already_in_queue || searchResult.already_done
      });
      
      onAdd();
      onRefresh();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(err.response?.data?.message || "Document is already in queue");
      } else {
        setError(err.response?.data?.message || "Failed to add to queue");
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,60,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md bg-white overflow-hidden"
        style={{ borderRadius: 4, boxShadow: "0 8px 60px rgba(10,20,60,0.25)", border: "1px solid #dde3ed" }}
      >
        <div style={{ backgroundColor: "#0f2a5e", padding: "16px 24px" }} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#e8a0bf" }}>Manual Entry</p>
            <h2 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1rem" }}>Add Document to Queue</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-white/20"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />

        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Document Type</label>
            <select
              value={documentType}
              onChange={(e) => {
                setDocumentType(e.target.value);
                setSearchResult(null);
                setError(null);
              }}
              className="w-full rounded-none border-0 border-b-2 px-0 text-sm focus:ring-0"
              style={{ borderBottomColor: "#fed7aa", backgroundColor: "#fff7ed" }}
            >
              <option value="">Select type...</option>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, config]) => (
                <option key={type} value={type}>{config.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Reference Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => {
                  setReferenceNumber(e.target.value);
                  setSearchResult(null);
                  setError(null);
                }}
                placeholder="Enter reference number..."
                className="flex-1 rounded-none border-0 border-b-2 px-0 text-sm focus:ring-0"
                style={{ borderBottomColor: "#fed7aa", backgroundColor: "#fff7ed" }}
              />
              <button
                onClick={handleSearch}
                disabled={searching || !documentType || !referenceNumber}
                className="px-4 py-2 text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: "#FCEBEB", border: "1px solid #A32D2D" }}>
              <AlertTriangle className="w-4 h-4" style={{ color: "#A32D2D" }} />
              <span className="text-sm" style={{ color: "#A32D2D" }}>{error}</span>
            </div>
          )}

          {searchResult && (
            <>
              <div className="p-4 rounded-lg space-y-2" style={{ 
                backgroundColor: (searchResult.already_in_queue || searchResult.already_done) ? "#FCEBEB" : "#EAF3DE",
                border: `1px solid ${(searchResult.already_in_queue || searchResult.already_done) ? "#A32D2D" : "#3B6D11"}`
              }}>
                <p className="text-xs font-bold uppercase tracking-wider">Document Found</p>
                <div className="space-y-1 text-sm">
                  <p><strong>Reference:</strong> {searchResult.reference_number}</p>
                  <p><strong>Applicant:</strong> {searchResult.applicant_name}</p>
                  {searchResult.business_name && <p><strong>Business:</strong> {searchResult.business_name}</p>}
                  <p><strong>Released:</strong> {searchResult.released_date}</p>
                </div>
                {(searchResult.already_in_queue || searchResult.already_done) && (
                  <p className="text-xs font-semibold" style={{ color: "#A32D2D" }}>
                    ⚠️ Already in today's queue
                  </p>
                )}
              </div>

              <button
                onClick={handleAdd}
                disabled={adding || searchResult.already_in_queue || searchResult.already_done}
                className="w-full py-2.5 text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}
              >
                {adding ? "Adding..." : (searchResult.already_in_queue || searchResult.already_done) ? "Already in Queue" : "Add to Queue"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QueueControl() {
  const [queue, setQueue] = useState<DisplayQueueItem[]>([]);
  const [servingItem, setServingItem] = useState<DisplayQueueItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [log, setLog] = useState<{ msg: string; type: string; time: string }[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [todayDate, setTodayDate] = useState(new Date().toDateString());

  const addLog = useCallback((msg: string, type = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLog((prev) => [{ msg, type, time }, ...prev].slice(0, 60));
  }, []);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const load = useCallback(async () => {
    try {
      const items = await fetchQueueItems();
      const serving = items.find(item => item.queueStatus === "serving") || null;
      const waiting = items.filter(item => item.queueStatus === "waiting").sort((a, b) => a.queueId - b.queueId);
      
      setQueue(items);
      setServingItem(serving);
      setTodayDate(new Date().toDateString());
    } catch (e) {
      console.error("[QueueControl] load failed", e);
      addLog("Failed to load queue", "error");
    }
  }, [addLog]);

  useEffect(() => {
    load();
    addLog("Queue control ready - Today's date: " + new Date().toDateString(), "info");
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load, addLog]);

  const filtered = search
    ? queue.filter((item) => {
        const q = search.toLowerCase();
        return (
          item.refNumber.toLowerCase().includes(q) ||
          item.serviceLabel.toLowerCase().includes(q) ||
          (item.applicantName?.toLowerCase().includes(q) || false) ||
          (item.businessName?.toLowerCase().includes(q) || false)
        );
      })
    : queue;

  const breakdown: Record<string, number> = {};
  queue.forEach((item) => { 
    breakdown[item.serviceLabel] = (breakdown[item.serviceLabel] ?? 0) + 1; 
  });

  const handleQRScan = async (result: { documentType: string; referenceNumber: string }) => {
    setBusy(true);
    try {
      const { documentType, referenceNumber } = result;
      
      if (!documentType) {
        showToast("Document type not detected in QR code", false);
        addLog(`QR Scan: No document type detected`, "error");
        setBusy(false);
        return;
      }
      
      const searchRes = await api.get("api/queue/search-bcert", {
        params: { 
          document_type: documentType, 
          bcert_number: referenceNumber 
        }
      });
      
      if (searchRes.data.status === "success") {
        const doc = searchRes.data.data;
        
        if (doc.already_in_queue || doc.already_done) {
          showToast(`Document ${doc.reference_number} is already in queue`, false);
          addLog(`QR Scan: ${doc.reference_number} already in queue`, "warn");
        } else {
          await api.post("api/queue/manual-add", {
            document_type: documentType,
            document_id: doc.id,
            reference_number: doc.reference_number,
            force: false
          });
          
          showToast(`Added ${doc.reference_number} to queue`);
          addLog(`QR Scan: Added ${doc.reference_number} (${doc.applicant_name}) to queue`, "success");
          await load();
        }
      }
    } catch (err: any) {
      console.error("QR Scan failed:", err);
      showToast(err.response?.data?.message || "Failed to add document", false);
      addLog("QR Scan failed", "error");
    } finally {
      setBusy(false);
    }
  };

  async function handleCallNext() {
    if (queue.filter(q => q.queueStatus === "waiting").length === 0) {
      showToast("No items waiting in queue", false);
      return;
    }
    
    setBusy(true);
    try {
      const res = await api.post("api/queue/next");

      if (res.data?.status === "empty") {
        showToast("No more items in queue", false);
        addLog("Reached end of queue", "warn");
        return;
      }

      const nextQueueItem = res.data?.data;
      showToast(`Now serving: ${nextQueueItem.reference_number}`);
      addLog(`Now serving: ${nextQueueItem.reference_number}`, "success");
      await load();
    } catch (e) {
      console.error("[QueueControl] next failed", e);
      showToast("Failed to call next", false);
      addLog("Error calling next", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDone(item: DisplayQueueItem) {
    setBusy(true);
    try {
      await api.post(`api/queue/${item.queueId}/done`);

      showToast(`${item.refNumber} — dry seal released`);
      addLog(`${item.refNumber} (${item.serviceLabel}) seal released`, "success");
      await load();
    } catch (e) {
      console.error("[QueueControl] done failed", e);
      showToast("Failed to mark as done", false);
      addLog(`Error marking ${item.refNumber} done`, "error");
    } finally {
      setBusy(false);
    }
  }

  const logColor: Record<string, string> = {
    info:    "#6b7280",
    success: "#3B6D11",
    error:   "#A32D2D",
    warn:    "#854F0B",
  };

  const waitingItems = queue.filter(q => q.queueStatus === "waiting");
  const upNext = waitingItems;

  return (
    <div style={{ fontFamily: "var(--font-sans,system-ui)", color: "var(--color-text-primary,#111)", position: "relative" }}>
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg"
          style={{ 
            backgroundColor: toast.ok ? "#EAF3DE" : "#FCEBEB",
            border: `1px solid ${toast.ok ? "#3B6D11" : "#A32D2D"}`,
            color: toast.ok ? "#27500A" : "#791F1F"
          }}
        >
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {showManualAdd && (
        <ManualAddModal
          onClose={() => setShowManualAdd(false)}
          onAdd={() => {
            showToast("Successfully added to queue");
            addLog("Manual item added to queue", "success");
          }}
          onRefresh={load}
        />
      )}

      {showQRScanner && (
        <QRScannerModal
          onClose={() => setShowQRScanner(false)}
          onScanSuccess={handleQRScan}
        />
      )}

      <div className="w-full max-w-7xl mx-auto my-24 px-4">
        <div className="bg-white overflow-hidden" style={{ borderRadius: 4, boxShadow: "0 2px 40px rgba(10,20,60,0.15)", border: "1px solid #dde3ed" }}>
          {/* Header */}
          <div style={{ backgroundColor: "#0f2a5e", padding: "20px 40px" }} className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-0.5" style={{ color: "#e8a0bf" }}>Barangay West Rembo</p>
              <h1 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1.15rem" }}>Dry Seal Release Queue</h1>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{todayDate}</p>
            </div>
          </div>
          <div style={{ height: 3, backgroundColor: "#c2467d" }} />

          <div className="p-8">
            {/* Control Bar */}
            <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3B6D11" }} />
                <span className="text-sm font-semibold" style={{ color: "#0f2a5e" }}>Live Queue</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowQRScanner(true)}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2 text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                  style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}
                >
                  <QrCode className="w-4 h-4" />
                  Scan QR
                </button>
                <button
                  onClick={() => setShowManualAdd(true)}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2 text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                  style={{ borderRadius: 2, backgroundColor: "#534AB7" }}
                >
                  <User className="w-4 h-4" />
                  Manual Add
                </button>
                <button
                  onClick={handleCallNext}
                  disabled={waitingItems.length === 0 || busy}
                  className="flex items-center gap-2 px-6 py-2 text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                  style={{ borderRadius: 2, backgroundColor: "#c2467d" }}
                >
                  <ChevronRight className="w-4 h-4" />
                  Call Next
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Queue Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Now Serving Card - WITH MARK AS DONE BUTTON */}
                <div className="p-8 text-center" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb", borderRadius: 4 }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#6b7280" }}>Now Serving</p>
                  <p className="text-7xl font-black font-mono mb-4" style={{ color: "#0f2a5e" }}>{servingItem?.refNumber ?? "---"}</p>
                  {servingItem && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: statusStyle(servingItem.queueStatus).bg, color: statusStyle(servingItem.queueStatus).color }}>
                          {servingItem.queueStatus}
                        </span>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: DOCUMENT_TYPE_LABELS[servingItem.documentType]?.bg || "#F1EFE8", color: DOCUMENT_TYPE_LABELS[servingItem.documentType]?.color || "#5F5E5A" }}>
                          {servingItem.serviceLabel}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{servingItem.applicantName || "—"}</p>
                      {servingItem.businessName && (
                        <p className="text-xs" style={{ color: "#6b7280" }}>{servingItem.businessName}</p>
                      )}
                      
                      {/* ✅ MARK AS DONE BUTTON FOR SERVING ITEM */}
                      <button
                        onClick={() => handleDone(servingItem)}
                        disabled={busy}
                        className="mt-4 flex items-center justify-center gap-2 w-full py-3 text-white text-sm font-bold uppercase tracking-wider transition-all hover:opacity-90"
                        style={{ borderRadius: 4, backgroundColor: "#3B6D11" }}
                      >
                        <CheckCircle className="w-5 h-5" />
                        {busy ? "Processing..." : "✓ Mark as Done"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Queue List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Queue ({queue.length})</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1"
                        style={{ borderColor: "#e5e7eb", width: 200 }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filtered.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-sm" style={{ color: "#9ca3af" }}>No documents in queue</p>
                      </div>
                    )}
                    {filtered.map((item, i) => {
                      const isServing = servingItem?.queueId === item.queueId;
                      return (
                        <div
                          key={item.queueId}
                          className="flex items-center justify-between p-4 transition-all hover:shadow-md"
                          style={{ 
                            backgroundColor: isServing ? "#E6F1FB" : "#f9fafb",
                            border: `1px solid ${isServing ? "#378ADD" : "#e5e7eb"}`,
                            borderRadius: 4
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: isServing ? "#378ADD" : "#e5e7eb", color: isServing ? "white" : "#6b7280" }}>
                              {isServing ? "▶" : i + 1}
                            </div>
                            <div>
                              <p className="font-mono font-bold text-sm">{item.refNumber}</p>
                              <p className="text-xs" style={{ color: "#6b7280" }}>{item.applicantName || "—"}</p>
                              {item.businessName && <p className="text-xs" style={{ color: "#9ca3af" }}>{item.businessName}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: DOCUMENT_TYPE_LABELS[item.documentType]?.bg || "#F1EFE8", color: DOCUMENT_TYPE_LABELS[item.documentType]?.color || "#5F5E5A" }}>
                              {item.serviceLabel}
                            </span>
                            {/* Mark as Done button for waiting items (not serving) */}
                            {!isServing && item.queueStatus === "waiting" && (
                              <button
                                onClick={() => handleDone(item)}
                                className="p-2 rounded-full transition-colors hover:bg-white"
                                style={{ color: "#3B6D11" }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="space-y-6">
                {/* Stats */}
                <div className="p-4" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb", borderRadius: 4 }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#0f2a5e" }}>Queue Statistics</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "#6b7280" }}>In Queue</span>
                      <span className="text-xl font-bold" style={{ color: "#0f2a5e" }}>{queue.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "#6b7280" }}>Remaining</span>
                      <span className="text-xl font-bold" style={{ color: "#0f2a5e" }}>{waitingItems.length}</span>
                    </div>
                  </div>
                </div>

                {/* Service Breakdown */}
                <div className="p-4" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb", borderRadius: 4 }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#0f2a5e" }}>By Service</p>
                  <div className="space-y-3">
                    {Object.entries(breakdown).map(([label, count]) => {
                      const cfg = Object.values(DOCUMENT_TYPE_LABELS).find(c => c.label === label);
                      return (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: cfg?.bg, color: cfg?.color }}>{label}</span>
                          <span className="text-sm font-semibold">{count}</span>
                        </div>
                      );
                    })}
                    {Object.keys(breakdown).length === 0 && (
                      <p className="text-sm text-center" style={{ color: "#9ca3af" }}>No data</p>
                    )}
                  </div>
                </div>

                {/* Up Next */}
                <div className="p-4" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb", borderRadius: 4 }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#0f2a5e" }}>Up Next</p>
                  <div className="space-y-2">
                    {upNext.slice(0, 5).map((item, i) => (
                      <div key={item.queueId} className="flex items-center justify-between py-2">
                        <span className="text-xs font-mono" style={{ color: "#6b7280" }}>{i + 1}.</span>
                        <span className="text-sm font-mono font-medium">{item.refNumber}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: DOCUMENT_TYPE_LABELS[item.documentType]?.bg || "#F1EFE8", color: DOCUMENT_TYPE_LABELS[item.documentType]?.color || "#5F5E5A" }}>
                          {item.serviceLabel}
                        </span>
                      </div>
                    ))}
                    {upNext.length === 0 && (
                      <p className="text-sm text-center py-4" style={{ color: "#9ca3af" }}>Queue is empty</p>
                    )}
                  </div>
                </div>

                {/* Activity Log */}
                <div className="p-4" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb", borderRadius: 4 }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Activity</p>
                    <button onClick={() => setLog([])} className="text-xs hover:underline" style={{ color: "#6b7280" }}>Clear</button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {log.length === 0 && (
                      <p className="text-sm text-center py-4" style={{ color: "#9ca3af" }}>No activity yet</p>
                    )}
                    {log.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: logColor[entry.type] }} />
                        <span className="flex-1">{entry.msg}</span>
                        <span className="flex-shrink-0" style={{ color: "#9ca3af" }}>{entry.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueueControl;