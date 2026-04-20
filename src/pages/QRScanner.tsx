import { useState, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  FileUp,
} from "lucide-react";
import Header from "@/components/forms/Header";
import Footer from "@/components/forms/Footer";
import axios from "axios";

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
};

export default function DocumentVerifier() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
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

  // ======================
  // UPLOAD + VERIFY
  // ======================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanState("loading");
    setErrorMsg("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        "http://127.0.0.1:8000/api/documents/verify",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (res.data.valid) {
        setScanState("valid");
        setResult(res.data.data);
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

  const reset = () => {
    setScanState("idle");
    setResult(null);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex justify-center pt-32 pb-16 px-4">
        <div className="w-full max-w-lg">

          {/* HEADER */}
          <div className="text-center mb-10">
            <h1 className="font-bold text-2xl">
              Document <span style={{ color: PINK }}>Verifier</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-2 uppercase">
              Upload a PDF to verify authenticity
            </p>
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
                Verification System
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
                    Verifying document...
                  </p>
                </div>
              )}

              {/* VALID */}
              {scanState === "valid" && (
                <div className="space-y-4 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />

                  <p className="font-bold text-green-600">
                    Document Verified
                  </p>

                  {/* CLEAN OUTPUT */}
                  <div className="text-xs text-left border p-3 space-y-1">
                    <p><b>Record ID:</b> {result?.record_id}</p>

                    <p><b>Type:</b> {formatType(result?.type)}</p>

                    <p><b>CID:</b> {result?.cid}</p>

                    <hr className="my-2" />

                    <p><b>Name:</b> {result?.name}</p>

                    <p><b>Issued Date:</b> {formatDate(result?.issued_date)}</p>

                    <p><b>Expires At:</b> {formatDate(result?.expires_at)}</p>

                    <p>
                      <b>Status:</b>{" "}
                      {result?.is_expired ? (
                        <span className="text-red-600 font-bold">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="text-green-600 font-bold">
                          VALID
                        </span>
                      )}
                    </p>
                  </div>

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
                  <p className="font-bold text-red-600">
                    Invalid Document
                  </p>
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

        </div>
      </main>

      <Footer />
    </div>
  );
}