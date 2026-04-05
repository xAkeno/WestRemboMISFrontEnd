import { useCallback, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { generatePDF } from "@/utils/pdfGenerator";
import type { TextField } from "@/types/certificate";
import type { QRCodeFieldData } from "@/components/documentMaker/QRCodeField";

const API = "http://127.0.0.1:8000/api";

const DOCUMENT_TYPE_MAP: Record<string, string> = {
  "1": "barangay-certificates",
  "2": "barangay-clearances",
  "3": "building-clearances",
  "4": "business-clearances",
};

interface UseReleaseDocumentOptions {
  documentId:          string | undefined;
  recordId:            number | undefined;
  templateBytes:       ArrayBuffer | null;
  fields:              TextField[];
  qrField?:            QRCodeFieldData | null;
  bcertNumber?:        string | null;
  /** Seed from the DB record so the download button shows on page load */
  initialReleasedPath?: string | null;
}

export function useReleaseDocument({
  documentId,
  recordId,
  templateBytes,
  fields,
  qrField,
  bcertNumber,
  initialReleasedPath,
}: UseReleaseDocumentOptions) {
  const [isReleasing,   setIsReleasing]   = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [releasedPath,  setReleasedPath]  = useState<string | null>(initialReleasedPath ?? null);

  const documentType = DOCUMENT_TYPE_MAP[documentId ?? ""] ?? null;

  // ── Release: generate PDF → upload to backend → S3 ───────────────────────
  const releaseDocument = useCallback(async () => {
    if (!templateBytes || !recordId || !documentType) {
      toast.error("Missing template, record, or document type.");
      return;
    }

    setIsReleasing(true);
    try {
      const pdfBytes = await generatePDF(templateBytes, fields, qrField ?? null, bcertNumber ?? null);

      const blob     = new Blob([pdfBytes], { type: "application/pdf" });
      const filename = `${documentType}-${recordId}-${bcertNumber ?? "doc"}.pdf`;
      const formData = new FormData();
      formData.append("file", blob, filename);

      const res = await axios.post(
        `${API}/documents/release/${documentType}/${recordId}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const path = res.data?.data?.released_document_path;
      if (path) setReleasedPath(path);

      toast.success("Document released and saved to storage.");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.errors?.file?.[0] ??
        "Failed to release document.";
      toast.error(msg);
    } finally {
      setIsReleasing(false);
    }
  }, [templateBytes, fields, qrField, bcertNumber, recordId, documentType]);

  // ── Download: fetch signed S3 URL → open in new tab ──────────────────────
  const downloadReleased = useCallback(async () => {
    if (!recordId || !documentType) {
      toast.error("No record to download.");
      return;
    }

    setIsDownloading(true);
    try {
      const res = await axios.get(
        `${API}/documents/release/${documentType}/${recordId}/download`,
        { withCredentials: true }
      );

      const url = res.data?.data?.url;
      if (!url) throw new Error("No download URL returned.");

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to get download link.");
    } finally {
      setIsDownloading(false);
    }
  }, [recordId, documentType]);

  return {
    releaseDocument,
    downloadReleased,
    isReleasing,
    isDownloading,
    releasedPath,
    hasReleasedDocument: !!releasedPath,
    canRelease: !!templateBytes && !!recordId && !!documentType,
  };
}