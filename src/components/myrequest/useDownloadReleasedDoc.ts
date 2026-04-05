/**
 * useDownloadReleasedDoc.ts
 *
 * Lightweight hook for the user-facing side (RequestCard / RequestDetail).
 * Fetches a 15-min signed URL from the backend and opens it in a new tab.
 *
 * Separate from useReleaseDocument (which is admin-only and also handles upload).
 */

import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

const API = "http://127.0.0.1:8000/api";

const DOCUMENT_TYPE_MAP: Record<string, string> = {
  barangay_certificate:  "barangay-certificates",
  barangay_clearance:    "barangay-clearances",
  building_clearance:    "building-clearances",
  business_clearance:    "business-clearances",
};

export function useDownloadReleasedDoc() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const download = useCallback(async (documentType: string, recordId: number | string) => {
    const key = `${documentType}-${recordId}`;
    const apiType = DOCUMENT_TYPE_MAP[documentType] ?? documentType.replace(/_/g, "-");

    setLoadingId(key);
    try {
      const res = await axios.get(
        `${API}/documents/release/${apiType}/${recordId}/download`,
        { withCredentials: true }
      );

      const url = res.data?.data?.url;
      if (!url) throw new Error("No download URL returned.");

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to get download link.";
      if (err?.response?.status === 404) {
        toast.error("Released document not found. Please contact the barangay office.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoadingId(null);
    }
  }, []);

  const isLoading = (documentType: string, recordId: number | string) =>
    loadingId === `${documentType}-${recordId}`;

  return { download, isLoading };
}
