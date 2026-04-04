import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ScanLine, RotateCcw, ShieldCheck, ImageUp } from "lucide-react";
import Header from "@/components/forms/Header";
import Footer from "@/components/forms/Footer";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

type ScanState = "idle" | "scanning" | "loading" | "valid" | "invalid" | "error";

interface DocumentResult {
  bcert_number: string;
  document_type: string;
  full_name: string;
  purpose: string;
  status: string;
  issued_at?: string;
  issued_on?: string;
  created_at: string;
}

export default function QRScanner() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<DocumentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [manualInput, setManualInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopScanner = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      isScanningRef.current = false;
    }
  };

  const startScanner = async () => {
    setScanState("scanning");
    setResult(null);
    setErrorMsg("");
    setImagePreview(null);

    await stopScanner();

    const qr = new Html5Qrcode("qr-reader");
    scannerRef.current = qr;

    try {
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => { handleQRResult(decodedText); },
        () => {}
      );
      isScanningRef.current = true;
    } catch {
      setScanState("error");
      setErrorMsg("Camera access denied or not available.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setScanState("loading");
    setResult(null);
    setErrorMsg("");

    await stopScanner();

    try {
      const qr = new Html5Qrcode("qr-image-reader");
      scannerRef.current = qr;

      const decoded = await qr.scanFile(file, false);
      await qr.clear();
      handleQRResult(decoded);
    } catch {
      setScanState("error");
      setErrorMsg("No QR code found in the image. Please try a clearer photo.");
      setImagePreview(null);
    }

    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleQRResult = async (bcertNumber: string) => {
    await stopScanner();
    setScanState("loading");

    try {
      const endpoints = [
        `http://127.0.0.1:8000/api/barangay-certificates?search=${bcertNumber}`,
        `http://127.0.0.1:8000/api/barangay-clearances?search=${bcertNumber}`,
        `http://127.0.0.1:8000/api/building-clearances?search=${bcertNumber}`,
        `http://127.0.0.1:8000/api/business-clearances?search=${bcertNumber}`,
      ];

      let found: DocumentResult | null = null;

      for (const url of endpoints) {
        try {
          const res = await axios.get(url, { withCredentials: true });
          const records = res.data?.data?.data;
          if (records && records.length > 0) {
            const rec = records[0];
            found = {
              bcert_number: rec.bcert_number ?? rec.brgy_business_no ?? bcertNumber,
              document_type: url.includes("certificate")
                ? "Barangay Certificate"
                : url.includes("building")
                ? "Building Clearance"
                : url.includes("business")
                ? "Business Clearance"
                : "Barangay Clearance",
              full_name: [rec.prefix, rec.first_name, rec.middle_name, rec.surname, rec.ext_name]
                .filter(Boolean)
                .join(" "),
              purpose: rec.purpose ?? rec.purpose_details ?? "—",
              status: rec.status ?? "unknown",
              issued_at: rec.issued_at,
              issued_on: rec.issued_on,
              created_at: rec.created_at,
            };
            break;
          }
        } catch (_) {}
      }

      if (found) {
        setResult(found);
        setScanState(found.status?.toLowerCase() === "released" ? "valid" : "invalid");
      } else {
        setScanState("invalid");
        setErrorMsg("Document not found in the system.");
      }
    } catch {
      setScanState("error");
      setErrorMsg("Network error. Please try again.");
    }
  };

  const handleManualCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) handleQRResult(manualInput.trim());
  };

  const reset = async () => {
    await stopScanner();
    setScanState("idle");
    setResult(null);
    setErrorMsg("");
    setManualInput("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => { return () => { stopScanner(); }; }, []);

  const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "released") return { bg: "#f0faf4", text: "#1a7a3f", border: "#6dbb8a" };
    if (s === "pending")  return { bg: "#fffbeb", text: "#92600a", border: "#f59e0b" };
    if (s === "rejected") return { bg: "#fef2f2", text: "#991b1b", border: "#f87171" };
    return { bg: "#f5f5f5", text: "#555", border: "#ccc" };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex justify-center pt-32 pb-16 px-4">
        <div className="w-full max-w-lg">

          {/* Page Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <div style={{ width: 32, height: 1, backgroundColor: PINK }} />
              <span className="text-xs font-bold uppercase tracking-[0.20em]" style={{ color: PINK }}>
                Document Verification
              </span>
              <div style={{ width: 32, height: 1, backgroundColor: PINK }} />
            </div>
            <h1
              className="font-bold text-foreground mb-3"
              style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.6rem,3.5vw,2.25rem)" }}
            >
              QR Code{" "}
              <span style={{ color: PINK }}>Verifier</span>
            </h1>
            <div style={{ width: 48, height: 2, backgroundColor: PINK, margin: "10px auto 12px" }} />
            <p className="text-muted-foreground text-xs uppercase tracking-wider">
              Scan, upload, or enter a document number to verify authenticity
            </p>
          </div>

          {/* Scanner card */}
          <div className="rounded-sm border bg-background overflow-hidden" style={{ borderColor: "#dde3ed" }}>

            {/* Card header bar */}
            <div className="flex items-center gap-3 px-5 py-3" style={{ backgroundColor: NAVY }}>
              <ShieldCheck className="h-4 w-4 text-white opacity-80" />
              <span className="text-xs font-bold uppercase tracking-widest text-white">
                Barangay Document Verification System
              </span>
            </div>

            {/* Hidden div needed by html5-qrcode for image scanning */}
            <div id="qr-image-reader" style={{ display: "none" }} />

            <div className="p-6 space-y-6">

              {/* ── IDLE ─────────────────────────────────────────────────── */}
              {scanState === "idle" && (
                <div className="space-y-4">

                  {/* Primary action: camera */}
                  <button
                    onClick={startScanner}
                    className="w-full flex items-center justify-center gap-3 py-4 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200"
                    style={{ backgroundColor: NAVY, borderRadius: 1 }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a3d7c")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = NAVY)}
                  >
                    <ScanLine className="h-5 w-5" />
                    Scan QR with Camera
                  </button>

                  {/* Upload from image */}
                  <label
                    className="w-full flex items-center justify-center gap-3 py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 border"
                    style={{ borderColor: NAVY, color: NAVY, borderRadius: 1 }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f4ff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }}
                  >
                    <ImageUp className="h-4 w-4" />
                    Upload Image with QR Code
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div style={{ flex: 1, height: 1, backgroundColor: "#dde3ed" }} />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">or enter manually</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: "#dde3ed" }} />
                  </div>

                  {/* Manual entry */}
                  <form onSubmit={handleManualCheck} className="flex gap-2">
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="BCert / Clearance number..."
                      className="flex-1 border px-3 py-2 text-sm bg-background text-foreground"
                      style={{ borderColor: "#dde3ed", borderRadius: 1, outline: "none" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = NAVY)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#dde3ed")}
                    />
                    <button
                      type="submit"
                      disabled={!manualInput.trim()}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40"
                      style={{ backgroundColor: PINK, borderRadius: 1 }}
                    >
                      Check
                    </button>
                  </form>
                </div>
              )}

              {/* ── SCANNING (camera live) ────────────────────────────────── */}
              {scanState === "scanning" && (
                <div className="space-y-4">
                  <div
                    id="qr-reader"
                    className="w-full overflow-hidden"
                    style={{ borderRadius: 2, border: `2px solid ${NAVY}` }}
                  />
                  <p className="text-center text-xs text-muted-foreground uppercase tracking-wider">
                    Position the QR code within the frame
                  </p>
                  <button
                    onClick={reset}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all"
                    style={{ borderColor: "#dde3ed", borderRadius: 1, color: "#6b7280" }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              )}

              {/* ── LOADING ───────────────────────────────────────────────── */}
              {scanState === "loading" && (
                <div className="flex flex-col items-center justify-center py-10 gap-5">
                  {imagePreview && (
                    <div
                      className="w-40 h-40 overflow-hidden rounded-sm"
                      style={{ border: `2px solid ${NAVY}` }}
                    >
                      <img
                        src={imagePreview}
                        alt="Uploaded QR"
                        className="w-full h-full object-contain bg-white"
                      />
                    </div>
                  )}
                  <Loader2 className="h-9 w-9 animate-spin" style={{ color: NAVY }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: NAVY }}>
                    {imagePreview ? "Reading QR from image..." : "Verifying document..."}
                  </p>
                </div>
              )}

              {/* ── VALID ─────────────────────────────────────────────────── */}
              {scanState === "valid" && result && (
                <div className="space-y-5">
                  <div
                    className="flex items-center gap-3 p-4"
                    style={{ backgroundColor: "#f0faf4", border: "1px solid #6dbb8a", borderRadius: 2 }}
                  >
                    <CheckCircle2 className="h-6 w-6 shrink-0" style={{ color: "#1a7a3f" }} />
                    <div>
                      <p className="font-bold text-sm uppercase tracking-wide" style={{ color: "#1a7a3f" }}>
                        Document Verified
                      </p>
                      <p className="text-xs" style={{ color: "#2d6a4a" }}>
                        This document is valid and registered in the system.
                      </p>
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="flex justify-center">
                      <div
                        className="w-28 h-28 overflow-hidden rounded-sm"
                        style={{ border: "1px solid #6dbb8a" }}
                      >
                        <img src={imagePreview} alt="Scanned QR" className="w-full h-full object-contain bg-white" />
                      </div>
                    </div>
                  )}

                  <ResultCard result={result} statusColor={statusColor} />

                  <button
                    onClick={reset}
                    className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: NAVY, borderRadius: 1 }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a3d7c")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = NAVY)}
                  >
                    <ScanLine className="h-4 w-4" />
                    Scan Another
                  </button>
                </div>
              )}

              {/* ── INVALID ───────────────────────────────────────────────── */}
              {scanState === "invalid" && (
                <div className="space-y-5">
                  <div
                    className="flex items-center gap-3 p-4"
                    style={{ backgroundColor: "#fef2f2", border: "1px solid #f87171", borderRadius: 2 }}
                  >
                    <XCircle className="h-6 w-6 shrink-0" style={{ color: "#991b1b" }} />
                    <div>
                      <p className="font-bold text-sm uppercase tracking-wide" style={{ color: "#991b1b" }}>
                        {result ? "Document Not Released" : "Not Found"}
                      </p>
                      <p className="text-xs" style={{ color: "#7f1d1d" }}>
                        {errorMsg || (result
                          ? `Status is "${result.status}" — document has not been officially released.`
                          : "This document number is not registered in the system.")}
                      </p>
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="flex justify-center">
                      <div
                        className="w-28 h-28 overflow-hidden rounded-sm"
                        style={{ border: "1px solid #f87171" }}
                      >
                        <img src={imagePreview} alt="Scanned QR" className="w-full h-full object-contain bg-white" />
                      </div>
                    </div>
                  )}

                  {result && <ResultCard result={result} statusColor={statusColor} />}

                  <button
                    onClick={reset}
                    className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: NAVY, borderRadius: 1 }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a3d7c")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = NAVY)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              )}

              {/* ── ERROR ─────────────────────────────────────────────────── */}
              {scanState === "error" && (
                <div className="space-y-5">
                  <div
                    className="flex items-center gap-3 p-4"
                    style={{ backgroundColor: "#fffbeb", border: "1px solid #f59e0b", borderRadius: 2 }}
                  >
                    <XCircle className="h-6 w-6 shrink-0" style={{ color: "#92600a" }} />
                    <div>
                      <p className="font-bold text-sm uppercase tracking-wide" style={{ color: "#92600a" }}>Error</p>
                      <p className="text-xs" style={{ color: "#78350f" }}>{errorMsg}</p>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: NAVY, borderRadius: 1 }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              )}
            </div>

            {/* Footer bar */}
            <div
              className="px-5 py-2.5 flex items-center justify-between"
              style={{ backgroundColor: "#f5f7fb", borderTop: "1px solid #dde3ed" }}
            >
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Official Verification Portal
              </span>
              {/* <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: PINK }}>
                LGU System
              </span> */}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

function ResultCard({
  result,
  statusColor,
}: {
  result: DocumentResult;
  statusColor: (s: string) => { bg: string; text: string; border: string };
}) {
  const sc = statusColor(result.status);
  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <div className="rounded-sm overflow-hidden" style={{ border: "1px solid #dde3ed" }}>
      <div className="px-4 py-2.5" style={{ backgroundColor: "#f5f7fb", borderBottom: "1px solid #dde3ed" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {result.document_type}
        </p>
        <p className="text-xs font-mono font-bold" style={{ color: "#0f2a5e" }}>
          {result.bcert_number}
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: "#f0f2f7" }}>
        {[
          { label: "Full Name",   value: result.full_name || "—" },
          { label: "Purpose",     value: result.purpose },
          { label: "Date Issued", value: fmt(result.issued_on ?? result.issued_at ?? result.created_at) },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-start px-4 py-2.5 gap-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider shrink-0">{label}</span>
            <span className="text-xs font-medium text-right text-foreground">{value}</span>
          </div>
        ))}

        <div className="flex justify-between items-center px-4 py-2.5 gap-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
          <span
            className="text-[11px] font-bold uppercase tracking-wider px-3 py-1"
            style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 2 }}
          >
            {result.status}
          </span>
        </div>
      </div>
    </div>
  );
}