import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import {
  Upload, X, FileImage, FileText, File,
  CheckCircle2, AlertCircle, Eye, Loader2,
  ImagePlus, ShieldCheck, IdCard, Briefcase, Building2,
} from "lucide-react";
import Header from "./forms/Header";
import Footer from "./forms/Footer";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true,
  headers: { Accept: "application/json" },
});

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadedFile {
  id: string;
  dbId?: number;
  file: File | null;
  preview: string | null;
  status: UploadStatus;
  progress: number;
  error?: string;
  url?: string;
  filename?: string;
  /** true when the entry was seeded from the registration id_url / id_url_back
   *  and has NOT yet been replaced with a proper documents-API upload */
  fromRegistration?: boolean;
}

interface DocumentSlot {
  key: string;
  label: string;
  description: string;
  required: boolean;
  accept: string;
}

interface DocumentCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  slots: DocumentSlot[];
}

interface DocumentUploadSectionProps {
  categories?: DocumentCategory[];
}

const DEFAULT_CATEGORIES: DocumentCategory[] = [
  {
    key: "personal_id",
    label: "Personal ID",
    icon: IdCard,
    slots: [
      {
        key: "valid_id_front",
        label: "Valid Government ID (Front)",
        description: "Passport, SSS, PhilHealth, Postal ID, Driver's License, etc.",
        required: true,
        accept: "image/*,application/pdf",
      },
      {
        key: "valid_id_back",
        label: "Valid Government ID (Back)",
        description: "Back side of the same ID.",
        required: false,
        accept: "image/*,application/pdf",
      },
      {
        key: "proof_of_residency",
        label: "Proof of Residency",
        description: "Utility bill, lease contract, or any proof of address.",
        required: true,
        accept: "image/*,application/pdf",
      },
      {
        key: "supporting_document",
        label: "Supporting Document",
        description: "Any other required supporting paperwork.",
        required: false,
        accept: "image/*,application/pdf",
      },
    ],
  },
  {
    key: "business",
    label: "Business",
    icon: Briefcase,
    slots: [
      {
        key: "dti_sec_registration",
        label: "DTI / SEC Registration",
        description: "Business name registration from DTI (sole proprietor) or SEC (corporation/partnership).",
        required: true,
        accept: "image/*,application/pdf",
      },
      {
        key: "mayors_permit",
        label: "Mayor's Business Permit",
        description: "Current year's business permit issued by the local government.",
        required: true,
        accept: "image/*,application/pdf",
      },
      {
        key: "bir_certificate",
        label: "BIR Certificate of Registration",
        description: "BIR Form 2303 — Certificate of Registration.",
        required: true,
        accept: "image/*,application/pdf",
      },
      {
        key: "articles_of_incorporation",
        label: "Articles of Incorporation / Partnership",
        description: "Required for corporations and partnerships.",
        required: false,
        accept: "image/*,application/pdf",
      },
      {
        key: "general_information_sheet",
        label: "General Information Sheet (GIS)",
        description: "Latest GIS filed with the SEC.",
        required: false,
        accept: "image/*,application/pdf",
      },
    ],
  },
  {
    key: "building",
    label: "Building / Property",
    icon: Building2,
    slots: [
      {
        key: "title_or_tct",
        label: "Transfer Certificate of Title (TCT)",
        description: "Land title or condominium certificate of title (CCT).",
        required: true,
        accept: "image/*,application/pdf",
      },
      {
        key: "tax_declaration",
        label: "Tax Declaration",
        description: "Latest real property tax declaration from the assessor's office.",
        required: true,
        accept: "image/*,application/pdf",
      },
      {
        key: "building_permit",
        label: "Building Permit",
        description: "Approved building permit from the local government unit.",
        required: false,
        accept: "image/*,application/pdf",
      },
      {
        key: "occupancy_permit",
        label: "Certificate of Occupancy",
        description: "Issued after building inspection confirming the structure is safe to occupy.",
        required: false,
        accept: "image/*,application/pdf",
      },
      {
        key: "lot_plan",
        label: "Lot Plan / Survey Plan",
        description: "Approved survey plan showing lot boundaries and area.",
        required: false,
        accept: "image/*,application/pdf",
      },
    ],
  },
];

function fileIcon(file: File | null) {
  if (!file) return File;
  if (file.type.startsWith("image/")) return FileImage;
  if (file.type === "application/pdf") return FileText;
  return File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}

function SlotDropzone({
  slot,
  uploaded,
  onDrop,
  onRemove,
}: {
  slot: DocumentSlot;
  uploaded: UploadedFile | null;
  onDrop: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onDrop(file);
    },
    [onDrop]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onDrop(file);
      e.target.value = "";
    },
    [onDrop]
  );

  if (uploaded) {
    const Icon = fileIcon(uploaded.file);
    const isFromRegistration = uploaded.fromRegistration === true;

    return (
      <div
        className="rounded-sm border overflow-hidden"
        style={{
          borderColor:
            uploaded.status === "success"
              ? "#bbf7d0"
              : uploaded.status === "error"
              ? "#fecdd3"
              : "#bfdbfe",
          backgroundColor:
            uploaded.status === "success"
              ? "#f0fdf4"
              : uploaded.status === "error"
              ? "#fff1f2"
              : "#f0f6ff",
        }}
      >
        {/* Header row */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f8faff" }}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            {slot.required && (
              <span
                className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
                style={{ backgroundColor: PINK, color: "#fff" }}
              >
                Required
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>
              {slot.label}
            </span>
            {/* Badge: auto-populated from registration */}
            {isFromRegistration && (
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
                style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
              >
                From Registration
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Always allow replacing — for "From Registration" files we just
                re-upload a new one; the old profile URL is just a preview reference */}
            {uploaded.status === "success" && (
              <>
                <button
                  onClick={() => replaceInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest transition-all duration-150"
                  style={{ color: NAVY, backgroundColor: "#e8eef8", border: "1px solid #c8d4ed" }}
                  title="Replace with a different file"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#d4e0f5";
                    (e.currentTarget as HTMLElement).style.borderColor = NAVY;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#e8eef8";
                    (e.currentTarget as HTMLElement).style.borderColor = "#c8d4ed";
                  }}
                >
                  <ImagePlus className="h-3 w-3" />
                  Change
                </button>
                <input ref={replaceInputRef} type="file" accept={slot.accept} className="hidden" onChange={handleChange} />
              </>
            )}
            <button
              onClick={onRemove}
              className="p-1 rounded-sm transition-colors"
              style={{ color: "#9ca3af" }}
              title="Remove file"
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#e11d48")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9ca3af")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* File preview row */}
        <div className="flex items-center gap-3 px-3 py-3">
          <div
            className="flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ width: 48, height: 48, borderRadius: 2, backgroundColor: "#e5e7eb" }}
          >
            {uploaded.preview ? (
              <img src={uploaded.preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <Icon className="h-5 w-5" style={{ color: NAVY }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">
              {uploaded.file?.name ?? uploaded.filename ?? "File"}
            </p>
            <p className="text-[10px] text-gray-500">
              {uploaded.file
                ? formatBytes(uploaded.file.size)
                : isFromRegistration
                ? "Uploaded during registration"
                : "Previously uploaded"}
            </p>
            {uploaded.status === "uploading" && (
              <div className="mt-1.5 h-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploaded.progress}%`, backgroundColor: NAVY }}
                />
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            {uploaded.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" style={{ color: NAVY }} />}
            {uploaded.status === "success" && <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} />}
            {uploaded.status === "error" && <AlertCircle className="h-4 w-4" style={{ color: "#e11d48" }} />}
          </div>
        </div>

        {uploaded.status === "error" && uploaded.error && (
          <p className="text-[10px] text-red-600 px-3 pb-2">{uploaded.error}</p>
        )}

        {uploaded.preview && uploaded.status === "success" && (
          <div className="px-3 pb-2.5">
            <a
              href={uploaded.preview}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-semibold underline"
              style={{ color: NAVY }}
            >
              <Eye className="h-3 w-3" /> View full image
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {slot.required && (
          <span
            className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5"
            style={{ backgroundColor: PINK, color: "#fff", borderRadius: 2 }}
          >
            Required
          </span>
        )}
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>
          {slot.label}
        </span>
      </div>
      <p className="text-[10px] text-gray-500 mb-2">{slot.description}</p>

      <button
        type="button"
        className="w-full relative flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all duration-200 py-6 px-4"
        style={{
          borderColor: dragging ? PINK : "#c8d4ed",
          backgroundColor: dragging ? "#fdf0f6" : "#f8faff",
          borderRadius: 2,
          cursor: "pointer",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = PINK;
          (e.currentTarget as HTMLElement).style.backgroundColor = "#fdf0f6";
        }}
        onMouseLeave={(e) => {
          if (!dragging) {
            (e.currentTarget as HTMLElement).style.borderColor = "#c8d4ed";
            (e.currentTarget as HTMLElement).style.backgroundColor = "#f8faff";
          }
        }}
      >
        <div className="w-9 h-9 flex items-center justify-center" style={{ backgroundColor: "#e8eef8", borderRadius: 2 }}>
          <ImagePlus className="h-4.5 w-4.5" style={{ color: NAVY }} />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold" style={{ color: NAVY }}>
            Drop file here or <span style={{ color: PINK }}>browse</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, PDF — max 10 MB</p>
        </div>
      </button>

      <input ref={inputRef} type="file" accept={slot.accept} className="hidden" onChange={handleChange} />
    </div>
  );
}

function TabBar({
  categories,
  activeKey,
  files,
  onSelect,
}: {
  categories: DocumentCategory[];
  activeKey: string;
  files: Record<string, UploadedFile>;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex border-b" style={{ borderColor: "#dde3ed", backgroundColor: "#f0f4ff" }}>
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = cat.key === activeKey;
        const required = cat.slots.filter((s) => s.required);
        const done = required.filter((s) => files[s.key]?.status === "success");
        const allDone = done.length === required.length && required.length > 0;

        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onSelect(cat.key)}
            className="flex-1 flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-150 relative"
            style={{
              color: isActive ? NAVY : "#6b7280",
              backgroundColor: isActive ? "#fff" : "transparent",
              borderBottom: isActive ? `2px solid ${NAVY}` : "2px solid transparent",
            }}
          >
            <div className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              {allDone && <CheckCircle2 className="h-3 w-3" style={{ color: "#16a34a" }} />}
            </div>
            {required.length > 0 && (
              <span
                className="text-[8px] font-black px-1.5 py-0.5 rounded-sm"
                style={{
                  backgroundColor: allDone ? "#dcfce7" : "#fefce8",
                  color: allDone ? "#15803d" : "#92400e",
                }}
              >
                {done.length}/{required.length} req
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function DocumentUploadSection({
  categories = DEFAULT_CATEGORIES,
}: DocumentUploadSectionProps) {
  const [files, setFiles] = useState<Record<string, UploadedFile>>({});
  const [activeTab, setActiveTab] = useState(categories[0]?.key ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // ── Fetch existing documents on mount ──────────────────────────────────────
  useEffect(() => {
    const fetchExistingDocuments = async () => {
      try {
        const loadedFiles: Record<string, UploadedFile> = {};

        // ── Step 1: Pre-populate ID slots from the user's registration upload ──
        //
        // When a resident registers they upload id_url (front) and id_url_back
        // (back) as part of the registration form. Those are stored on the user
        // profile, not in the documents table. We seed them here so the user
        // immediately sees their IDs on first login without having to re-upload.
        //
        // These entries are flagged { fromRegistration: true } so the UI can
        // show the "From Registration" badge. They are treated as "success" for
        // the progress counter, but uploading a replacement goes through the
        // normal documents API and will clear the flag.
        try {
          const { data: profileResponse } = await api.get("/api/user");
          const user = profileResponse.data ?? profileResponse;

          const idMappings: { field: string; slotKey: string }[] = [
            { field: "id_url",      slotKey: "valid_id_front" },
            { field: "id_url_back", slotKey: "valid_id_back"  },
          ];

          for (const { field, slotKey } of idMappings) {
            const rawUrl: string | null = user[field] ?? null;
            if (!rawUrl) continue;

            // Build the full URL whether the API returns a relative or absolute path
            const fullUrl = rawUrl.startsWith("http")
              ? rawUrl
              : `http://127.0.0.1:8000${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;

            loadedFiles[slotKey] = {
              id: `profile-${field}`,
              dbId: undefined,          // no documents-table row yet
              file: null,
              preview: fullUrl,
              status: "success",
              progress: 100,
              url: fullUrl,
              filename: rawUrl.split("/").pop() ?? field,
              fromRegistration: true,   // ← flag so we know it came from profile
            };
          }
        } catch (profileErr) {
          console.warn("Could not load profile IDs:", profileErr);
        }

        // ── Step 2: Load documents already uploaded via the documents API ──
        //
        // These take precedence over the profile seed above. If the user has
        // already uploaded a proper document for valid_id_front / valid_id_back
        // through this page, we want that version (it will have a dbId and will
        // NOT carry the fromRegistration flag).
        try {
          const { data } = await api.get("/api/documents");
          const docs = data.data?.documents ?? {};

          Object.values(docs).forEach((categoryDocs: any) => {
            (categoryDocs as any[]).forEach((doc: any) => {
              loadedFiles[doc.type] = {
                id: `existing-${doc.id}`,
                dbId: doc.id,
                file: null,
                preview: doc.url ?? `http://127.0.0.1:8000/uploads/${doc.original_filename}`,
                status: "success",
                progress: 100,
                url: doc.url,
                filename: doc.original_filename,
                fromRegistration: false, // explicitly a documents-API record
              };
            });
          });
        } catch (docsErr) {
          console.warn("Could not load documents:", docsErr);
        }

        setFiles(loadedFiles);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExisting(false);
      }
    };

    fetchExistingDocuments();
  }, []);

  // ── Upload (also handles replace) ─────────────────────────────────────────
  const handleUpload = useCallback(
    async (slotKey: string, file: File) => {
      const existing = files[slotKey];

      // Only DELETE from the documents API if there is a real dbId.
      // "From Registration" entries have no dbId — they live on the user profile,
      // not in the documents table — so we skip the delete call for those.
      if (existing?.dbId && existing.status === "success") {
        try {
          await api.delete(`/api/documents/${existing.dbId}`);
        } catch {
          // best-effort; proceed with upload regardless
        }
      }

      let preview: string | null = null;
      if (isImage(file)) {
        preview = await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Immediately show an uploading state (clears fromRegistration flag)
      setFiles((prev) => ({
        ...prev,
        [slotKey]: {
          id: `${slotKey}-${Date.now()}`,
          file,
          preview,
          status: "uploading",
          progress: 0,
          fromRegistration: false,
        },
      }));

      const formData = new FormData();
      formData.append("type", slotKey);
      formData.append("file", file);

      try {
        const { data } = await api.post("/api/documents/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded * 100) / (e.total ?? 1));
            setFiles((prev) => ({
              ...prev,
              [slotKey]: { ...prev[slotKey], progress: pct },
            }));
          },
        });

        setFiles((prev) => ({
          ...prev,
          [slotKey]: {
            ...prev[slotKey],
            dbId: data.data.id,
            preview: preview ?? data.data.url,
            status: "success",
            progress: 100,
            fromRegistration: false,
          },
        }));
      } catch (err: any) {
        const message =
          err?.response?.data?.errors?.file?.[0] ??
          err?.response?.data?.message ??
          "Upload failed. Please try again.";

        setFiles((prev) => ({
          ...prev,
          [slotKey]: { ...prev[slotKey], status: "error", error: message },
        }));
      }
    },
    [files]
  );

  // ── Remove ─────────────────────────────────────────────────────────────────
  const handleRemove = useCallback(
    async (slotKey: string) => {
      const entry = files[slotKey];
      if (!entry) return;

      // Only call the delete API if the entry has a real documents-table row.
      // Profile-sourced entries (fromRegistration) have no dbId.
      if (entry.dbId && entry.status === "success") {
        try {
          await api.delete(`/api/documents/${entry.dbId}`);
        } catch {
          // best-effort
        }
      }

      setFiles((prev) => {
        const next = { ...prev };
        delete next[slotKey];
        return next;
      });
    },
    [files]
  );

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await api.post("/api/documents/submit");
      setSubmitSuccess(true);
    } catch (err: any) {
      const missing: { label: string }[] = err?.response?.data?.data?.missing ?? [];
      const missingLabels = missing.map((m) => m.label).join(", ");
      setSubmitError(
        missingLabels
          ? `Still missing: ${missingLabels}.`
          : err?.response?.data?.message ?? "Submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, []);

  const allRequired = categories.flatMap((c) => c.slots.filter((s) => s.required));
  const allRequiredDone = allRequired.filter((s) => files[s.key]?.status === "success");
  const allComplete = allRequiredDone.length === allRequired.length;
  const activeCategory = categories.find((c) => c.key === activeTab);

  return (
    <div>
      <div className="rounded-sm border overflow-hidden" style={{ borderColor: "#dde3ed" }}>
        <Header />

        {/* Panel header */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ backgroundColor: "#f0f4ff", borderBottom: "1px solid #dde3ed" }}
        >
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 shrink-0" style={{ color: NAVY }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: NAVY }}>
              Upload Supporting Documents
            </span>
          </div>

          <span
            className="text-[10px] font-bold px-2.5 py-1 flex items-center gap-1.5"
            style={{
              backgroundColor: allComplete ? "#dcfce7" : "#fefce8",
              color: allComplete ? "#15803d" : "#92400e",
              borderRadius: 2,
              border: `1px solid ${allComplete ? "#86efac" : "#fde68a"}`,
            }}
          >
            {allComplete ? <ShieldCheck className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {allRequiredDone.length}/{allRequired.length} required uploaded
          </span>
        </div>

        {/* Info banner */}
        <div
          className="px-4 py-2.5 text-[10px] text-gray-600 flex items-center gap-2"
          style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a" }}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "#ca8a04" }} />
          Please upload clear, legible copies. Files must be under 10 MB each (PNG, JPG, or PDF).
        </div>

        {/* Loading state */}
        {loadingExisting && (
          <div className="flex items-center justify-center gap-2 py-6" style={{ backgroundColor: "#f8faff" }}>
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: NAVY }} />
            <span className="text-xs" style={{ color: NAVY }}>Loading your documents...</span>
          </div>
        )}

        {!loadingExisting && (
          <>
            {/* Tab bar */}
            <TabBar categories={categories} activeKey={activeTab} files={files} onSelect={setActiveTab} />

            {/* Active tab slots */}
            <div className="p-4 space-y-5 bg-white">
              {activeCategory?.slots.map((slot) => (
                <SlotDropzone
                  key={slot.key}
                  slot={slot}
                  uploaded={files[slot.key] ?? null}
                  onDrop={(file) => handleUpload(slot.key, file)}
                  onRemove={() => handleRemove(slot.key)}
                />
              ))}
            </div>
          </>
        )}

        {/* Submit feedback */}
        {submitError && (
          <div
            className="mx-4 mb-3 px-3 py-2 text-[10px] text-red-700 flex items-start gap-2 rounded-sm"
            style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
            {submitError}
          </div>
        )}
        {submitSuccess && (
          <div
            className="mx-4 mb-3 px-3 py-2 text-[10px] text-green-700 flex items-center gap-2 rounded-sm"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#16a34a" }} />
            All required documents verified. Submission complete.
          </div>
        )}

        {/* Submit strip */}
        <div
          className="px-4 py-3 flex items-center justify-between gap-4"
          style={{ borderTop: "1px solid #e5e7eb", backgroundColor: "#f8faff" }}
        >
          <p className="text-[10px] text-gray-500">
            {allComplete
              ? "All required documents uploaded. You may submit your request."
              : `${allRequired.length - allRequiredDone.length} required document(s) still missing across all categories.`}
          </p>
          <button
            type="button"
            disabled={submitting || !allComplete}
            onClick={handleSubmit}
            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: 2, backgroundColor: NAVY }}
            onMouseEnter={(e) => { if (allComplete && !submitting) (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"; }}
            onMouseLeave={(e) => { if (allComplete && !submitting) (e.currentTarget as HTMLElement).style.backgroundColor = NAVY; }}
          >
            {submitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Submitting…
              </span>
            ) : "Submit Documents"}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}