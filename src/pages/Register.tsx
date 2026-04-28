import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Eye, EyeOff, Check, X, AlertTriangle, ChevronRight } from "lucide-react";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";

// ─── ID Upload Modal ────────────────────────────────────────────────────────
const IDUploadModal = ({
  open,
  onClose,
  onConfirm,
  idFront,
  idBack,
  setIdFront,
  setIdBack,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  idFront: File | null;
  idBack: File | null;
  setIdFront: (f: File | null) => void;
  setIdBack: (f: File | null) => void;
}) => {
  const [step, setStep] = useState<"requirements" | "upload">("requirements");

  const ACCEPTED = "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif";

  const FileZone = ({
    label,
    file,
    setFile,
    hint,
  }: {
    label: string;
    file: File | null;
    setFile: (f: File | null) => void;
    hint: string;
  }) => (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>{label}</p>
      <label
        className="flex flex-col items-center justify-center cursor-pointer transition-all min-h-[110px]"
        style={{
          border: `1.5px dashed ${file ? "#c2467d" : "#d1d5db"}`,
          backgroundColor: file ? "#fdf5f8" : "#fafafa",
          borderRadius: 2,
          padding: 16,
        }}
        onMouseEnter={(e) => { if (!file) (e.currentTarget as HTMLElement).style.borderColor = "#c2467d"; }}
        onMouseLeave={(e) => { if (!file) (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"; }}
      >
        {file ? (
          <>
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: "#c2467d" }}>
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            <span className="text-xs font-semibold text-center" style={{ color: "#c2467d" }}>{file.name}</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setFile(null); }}
              className="text-xs mt-1 underline"
              style={{ color: "#9ca3af" }}
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mb-1.5" style={{ color: "#9ca3af" }} />
            <span className="text-xs text-center" style={{ color: "#6b7280" }}>
              <span className="font-semibold" style={{ color: "#0f2a5e" }}>Click to upload</span> or drag & drop
            </span>
            <span className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{hint}</span>
          </>
        )}
        <input
          type="file"
          className="hidden"
          accept={ACCEPTED}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,60,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg bg-white overflow-hidden"
        style={{ borderRadius: 4, boxShadow: "0 8px 60px rgba(10,20,60,0.25)", border: "1px solid #dde3ed" }}
      >
        {/* Modal Header */}
        <div style={{ backgroundColor: "#0f2a5e", padding: "16px 24px" }} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#e8a0bf" }}>
              Identity Verification
            </p>
            <h2 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1rem" }}>
              Government-Issued ID Upload
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />

        <div className="p-6">
          {step === "requirements" ? (
            <>
              <div className="flex items-start gap-3 mb-5 p-3" style={{ backgroundColor: "#fff8e1", border: "1px solid #ffd54f", borderRadius: 2 }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                <p className="text-xs" style={{ color: "#78350f" }}>
                  Please read all requirements carefully before uploading your ID. Submissions that do not meet these standards will be rejected.
                </p>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#0f2a5e" }}>
                Photo Requirements
              </p>
              <ul className="space-y-2.5 mb-5">
                {[
                  "You must be visibly holding the government ID in the photo",
                  "All ID details must be clearly readable — no blur, glare, or cropping",
                  "Your face must be fully visible and well-lit",
                  "Take a selfie or have someone take your photo",
                  "Submit both the front and back of your ID",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "#c2467d" }} />
                    <span className="text-xs" style={{ color: "#6b7280" }}>{text}</span>
                  </li>
                ))}
              </ul>

              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#0f2a5e" }}>
                Accepted File Types
              </p>
              <p className="text-xs mb-5" style={{ color: "#6b7280" }}>
                JPG, JPEG, PNG, WEBP, HEIC — <span className="font-semibold" style={{ color: "#ef4444" }}>GIFs and documents (PDF, DOCX, etc.) are not accepted.</span>
              </p>

              <p className="text-xs mb-5" style={{ color: "#9ca3af" }}>
                Accepted IDs: PhilSys ID, Driver's License, Passport, Voter's ID, NBI Clearance, SSS ID, PRC License, Postal ID, etc.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all"
                  style={{ borderRadius: 2, border: "1.5px solid #dde3ed", color: "#6b7280" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep("upload")}
                  className="flex-1 px-4 py-2.5 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}
                >
                  I Understand — Proceed
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-5">
                <FileZone label="Front of ID *" file={idFront} setFile={setIdFront} hint="Clear photo of the front side" />
                <FileZone label="Back of ID *" file={idBack} setFile={setIdBack} hint="Clear photo of the back side" />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("requirements")}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all"
                  style={{ borderRadius: 2, border: "1.5px solid #c2467d", color: "#c2467d" }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!idFront || !idBack}
                  onClick={() => { onConfirm(); onClose(); }}
                  className="flex-1 px-4 py-2.5 text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}
                >
                  Confirm Upload
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Data Privacy Modal ──────────────────────────────────────────────────────
const DataPrivacyModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,60,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg bg-white overflow-hidden"
        style={{ borderRadius: 4, boxShadow: "0 8px 60px rgba(10,20,60,0.25)", border: "1px solid #dde3ed", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
      >
        <div style={{ backgroundColor: "#0f2a5e", padding: "16px 24px" }} className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#e8a0bf" }}>Legal</p>
            <h2 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1rem" }}>
              Data Privacy Notice
            </h2>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d", flexShrink: 0 }} />
        <div className="overflow-y-auto p-6 text-xs space-y-4" style={{ color: "#6b7280", lineHeight: 1.7 }}>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Republic Act No. 10173 — Data Privacy Act of 2012</p>
          <p>Barangay West Rembo, City of Taguig, is committed to protecting and respecting your privacy. This notice explains how we collect, use, and protect your personal data in compliance with the Data Privacy Act of 2012 (RA 10173).</p>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Purpose of Data Collection</p>
          <p>The personal information you provide — including your name, address, date of birth, contact details, and government-issued ID — is collected solely for the purpose of resident registration, verification of identity, and delivery of barangay services.</p>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Data Processing & Storage</p>
          <p>Your data will be stored securely and will only be accessed by authorized barangay personnel. We do not sell, trade, or transfer your personal information to third parties without your consent, except as required by law.</p>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Your Rights</p>
          <ul className="space-y-1 list-disc pl-4">
            <li>Right to be informed of the processing of your personal data</li>
            <li>Right to access your personal data held by the barangay</li>
            <li>Right to object to processing in certain circumstances</li>
            <li>Right to erasure or blocking of unlawfully processed data</li>
            <li>Right to file a complaint with the National Privacy Commission</li>
          </ul>
          <p>For questions or concerns about your data, please contact the Barangay West Rembo office directly.</p>
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            By submitting this registration form, you acknowledge that you have read and understood this Data Privacy Notice and consent to the processing of your personal data for the stated purposes.
          </p>
        </div>
        <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid #e5e7eb" }}>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-white text-xs font-semibold uppercase tracking-wider"
            style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Fallback zones 1–9 ──────────────────────────────────────────────────────
const FALLBACK_ZONES = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Returns a date as "YYYY-MM-DD" in local time (no timezone shift).
const toDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getTodayString = (): string => toDateString(new Date());

// Returns yesterday's date string — used as the max attribute on the DOB input.
const getYesterdayString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateString(d);
};

// Returns true only when the date is strictly in the past (not today, not future).
const isValidDob = (value: string): boolean => {
  if (!value) return false;
  return value < getTodayString();
};

// ─── Main Register Component ─────────────────────────────────────────────────
const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    houseBlockLotNo: "",
    street: "",
    zonePurok: "",
    password: "",
    confirmPassword: "",
  });

  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [showIDModal, setShowIDModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streets, setStreets] = useState<any[]>([]);
  // ── DOB validation state ──
  const [dobError, setDobError] = useState<string | null>(null);

  // ── Google reCAPTCHA state ──
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadStreets = async () => {
      try {
        const res = await axios.get("https://westrembomis.onrender.com/api/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) {
        console.error("Failed to fetch streets:", e);
      }
    };
    loadStreets();
  }, []);

  useEffect(() => {
    // Always start with a clean captcha on page load
    recaptchaRef.current?.reset();
    setCaptchaToken(null);
  }, []);

  const updateField = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ── DOB change handler — validates immediately on change ──
  const handleDobChange = (value: string) => {
    updateField("dateOfBirth", value);
    if (!value) {
      setDobError(null);
      return;
    }
    if (!isValidDob(value)) {
      setDobError("Invalid Date of Birth. Only past dates are allowed.");
    } else {
      setDobError(null);
    }
  };

  const rawZones = Array.from(new Set(streets.map((s) => s.sitio).filter(Boolean)));
  const uniqueZones: string[] =
    rawZones.length > 0
      ? [...rawZones].sort((a, b) => {
          const aNum = Number(a);
          const bNum = Number(b);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          return String(a).localeCompare(String(b));
        })
      : FALLBACK_ZONES;

  const passwordRules = [
    { label: "Maximum 10 characters", valid: formData.password.length >= 1 && formData.password.length <= 10 },
    { label: "Contains an uppercase letter", valid: /[A-Z]/.test(formData.password) },
    { label: "Contains a lowercase letter", valid: /[a-z]/.test(formData.password) },
    { label: "Contains a numeric digit", valid: /\d/.test(formData.password) },
    { label: "Contains a special character (!@#$%^&*...)", valid: /[^A-Za-z0-9]/.test(formData.password) },
  ];

  const passwordValid = formData.password.length > 0 && passwordRules.every((r) => r.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.surname || !formData.email || !formData.password || !formData.confirmPassword || !formData.dateOfBirth || !formData.gender) {
      toast({ title: "Error", description: "Please fill in all required fields including Sex", variant: "destructive" });
      return;
    }

    // ── Guard: reject future dates on submit as a safety net ──
    if (!isValidDob(formData.dateOfBirth)) {
      setDobError("Invalid Date of Birth. Only past dates are allowed.");
      toast({ title: "Invalid Date of Birth", description: "Only past dates are allowed.", variant: "destructive" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (!passwordValid) {
      toast({ title: "Error", description: "Please fix password requirements", variant: "destructive" });
      return;
    }
    if (!idFront || !idBack) {
      toast({ title: "Error", description: "Please upload both the front and back of your government ID", variant: "destructive" });
      return;
    }
    if (!captchaToken) {
      toast({ title: "CAPTCHA Required", description: "Please complete the reCAPTCHA verification.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const tokenToSend = captchaToken ?? "";

      console.log("reCAPTCHA token length:", tokenToSend.length);
      console.log("reCAPTCHA token preview:", tokenToSend.substring(0, 40));

      if (!tokenToSend) {
        toast({ title: "CAPTCHA Required", description: "Please complete the reCAPTCHA verification.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const form = new FormData();
      form.append("first_name", formData.firstName);
      form.append("surname", formData.surname);
      form.append("email", formData.email);
      form.append("contact_number", formData.phone);
      const normalizeSex = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";
      form.append("sex", normalizeSex(formData.gender));
      form.append("date_of_birth", formData.dateOfBirth);
      form.append("house_block_lot_no", formData.houseBlockLotNo);
      form.append("street", formData.street);
      form.append("zone_purok", formData.zonePurok);
      form.append("password", formData.password);
      form.append("password_confirmation", formData.confirmPassword);
      form.append("id_url", idFront as File);
      form.append("id_url_back", idBack as File);
      form.append("recaptcha_token", tokenToSend);

      await api.post("/api/register", form, { headers: { "Content-Type": "multipart/form-data" } });
      toast({ title: "Registration Successful", description: "Please check your email for verification instructions." });
      navigate("/email-verification", { state: { email: formData.email } });
    } catch (error: any) {
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      const message = error.response?.data?.message || "Registration failed.";
      toast({
        title: message.includes("reCAPTCHA") ? "CAPTCHA Failed" : "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ firstName: "", surname: "", email: "", phone: "", gender: "", dateOfBirth: "", houseBlockLotNo: "", street: "", zonePurok: "", password: "", confirmPassword: "" });
    setIdFront(null);
    setIdBack(null);
    setDobError(null);
    recaptchaRef.current?.reset();
    setCaptchaToken(null);
  };

  const underlineInput = "rounded-none border-0 border-b-2 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm";
  const idUploaded = idFront && idBack;
  const yesterdayString = getYesterdayString();

  return (
    <AuthLayout>
      <IDUploadModal
        open={showIDModal}
        onClose={() => setShowIDModal(false)}
        onConfirm={() => {}}
        idFront={idFront}
        idBack={idBack}
        setIdFront={setIdFront}
        setIdBack={setIdBack}
      />
      <DataPrivacyModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      <div
        className="w-full max-w-4xl bg-white overflow-hidden"
        style={{ borderRadius: 4, boxShadow: "0 2px 40px rgba(10,20,60,0.15)", border: "1px solid #dde3ed" }}
      >
        {/* Header */}
        <div style={{ backgroundColor: "#0f2a5e", padding: "20px 40px" }} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-0.5" style={{ color: "#e8a0bf" }}>
              Republic of the Philippines · City of Taguig
            </p>
            <h1 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1.15rem" }}>
              Barangay West Rembo — Resident Registration
            </h1>
          </div>
          <div className="hidden sm:block text-right" style={{ borderLeft: "1px solid rgba(255,255,255,0.12)", paddingLeft: 24 }}>
            <p className="text-white/40 text-xs uppercase tracking-wider">Form No.</p>
            <p className="text-white/70 text-xs font-mono mt-0.5">BWR-REG-001</p>
          </div>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />

        <div className="p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Section 1 — Personal Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>1</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Personal Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "First Name *", field: "firstName", placeholder: "Juan" },
                  { label: "Last Name *", field: "surname", placeholder: "dela Cruz" },
                ].map(({ label, field, placeholder }) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>{label}</Label>
                    <Input
                      type="text"
                      placeholder={placeholder}
                      value={(formData as any)[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                      className={underlineInput}
                      style={{ borderBottomColor: "#dde3ed" }}
                      onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                      onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Sex</Label>
                  <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: "#dde3ed" }}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ── Date of Birth — with future-date guard ── */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    max={yesterdayString}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: dobError ? "#ef4444" : "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = dobError ? "#ef4444" : "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = dobError ? "#ef4444" : "#dde3ed")}
                  />
                  {dobError && (
                    <p className="flex items-center gap-1 text-xs font-medium mt-1" style={{ color: "#ef4444" }}>
                      <X className="w-3 h-3 flex-shrink-0" strokeWidth={3} />
                      {dobError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2 — Contact & Address */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>2</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Contact & Address</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Phone Number</Label>
                  <Input
                    placeholder="09XXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="juan@email.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                  />
                </div>
                <div className="hidden md:block" />
              </div>
            </div>

            {/* Section 3 — Address Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>3</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Address Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>House / Block / Lot No.</Label>
                  <Input
                    placeholder="e.g., 123-A, Blk 5, Lot 12"
                    value={formData.houseBlockLotNo}
                    onChange={(e) => updateField("houseBlockLotNo", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Street Name</Label>
                  {streets.length > 0 ? (
                    <Select value={formData.street} onValueChange={(v) => updateField("street", v)}>
                      <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: "#dde3ed" }}>
                        <SelectValue placeholder="Select street" />
                      </SelectTrigger>
                      <SelectContent>
                        {streets.map((s) => (
                          <SelectItem key={s.id} value={s.name}>
                            {s.name}{s.formerly ? ` (formerly ${s.formerly})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Enter street name"
                      value={formData.street}
                      onChange={(e) => updateField("street", e.target.value)}
                      className={underlineInput}
                      style={{ borderBottomColor: "#dde3ed" }}
                      onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                      onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Zone / Station</Label>
                  <Select value={formData.zonePurok} onValueChange={(v) => updateField("zonePurok", v)}>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: "#dde3ed" }}>
                      <SelectValue placeholder="Select zone / station" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueZones.map((z) => (
                        <SelectItem key={z} value={z}>
                          {/^\d+$/.test(z) ? `Station ${z}` : z}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 4 — Credentials & Documents */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>4</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Credentials & Documents</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: ID Upload */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Government-Issued ID with Address *
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowIDModal(true)}
                    className="w-full flex flex-col items-center justify-center transition-all duration-200 min-h-[180px]"
                    style={{
                      border: `1.5px dashed ${idUploaded ? "#c2467d" : "#d1d5db"}`,
                      backgroundColor: idUploaded ? "#fdf5f8" : "#fafafa",
                      borderRadius: 2,
                      padding: 28,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { if (!idUploaded) (e.currentTarget as HTMLElement).style.borderColor = "#c2467d"; }}
                    onMouseLeave={(e) => { if (!idUploaded) (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"; }}
                  >
                    {idUploaded ? (
                      <>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: "#c2467d" }}>
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "#c2467d" }}>Both IDs uploaded</span>
                        <span className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Front & Back · Click to change</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mb-2" style={{ color: "#9ca3af" }} />
                        <span className="text-sm text-center" style={{ color: "#6b7280" }}>
                          <span className="font-semibold" style={{ color: "#0f2a5e" }}>Click to upload</span> your ID
                        </span>
                        <span className="text-xs mt-1" style={{ color: "#9ca3af" }}>Front & Back · JPG, PNG, WEBP</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    Accepted IDs: PhilSys, Driver's License, Passport, Voter's ID, NBI, SSS, PRC License, etc.
                  </p>
                </div>

                {/* Right: Password fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Password *</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => updateField("password", e.target.value)}
                          maxLength={10}
                          className={`${underlineInput} pr-8`}
                          style={{ borderBottomColor: "#dde3ed" }}
                          onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                          onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => updateField("confirmPassword", e.target.value)}
                          maxLength={10}
                          className={`${underlineInput} pr-8`}
                          style={{ borderBottomColor: "#dde3ed" }}
                          onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                          onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-0 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }}>
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                          <div
                            className="absolute left-0 -bottom-9 z-10 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white shadow-md"
                            style={{ backgroundColor: "#ef4444", borderRadius: 3, whiteSpace: "nowrap" }}
                          >
                            <X className="w-3 h-3 flex-shrink-0" strokeWidth={3} />
                            Passwords do not match
                            <span
                              className="absolute -top-1.5 left-3"
                              style={{
                                width: 0, height: 0,
                                borderLeft: "6px solid transparent",
                                borderRight: "6px solid transparent",
                                borderBottom: "6px solid #ef4444",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Password checklist */}
                  <div className="p-4 space-y-2" style={{ backgroundColor: "#f8f9fb", border: "1px solid #e5e7eb", borderRadius: 2 }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#0f2a5e" }}>
                      Password Requirements
                    </p>
                    {passwordRules.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-2">
                        {formData.password.length > 0 ? (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: rule.valid ? "#d45ea3" : "#fee2e2" }}
                          >
                            {rule.valid
                              ? <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                              : <X className="w-2.5 h-2.5" style={{ color: "#ef4444" }} strokeWidth={3} />
                            }
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border flex-shrink-0" style={{ borderColor: "#d1d5db" }} />
                        )}
                        <span className="text-xs" style={{ color: "#6b7280" }}>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 — Data Privacy */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>5</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Data Privacy</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>

              <div className="p-5 space-y-4" style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d2fe", borderRadius: 2 }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>
                  Data Privacy Notice
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
                  Your personal information will be collected and processed solely for the purpose of this barangay resident registration, in accordance with the{" "}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-60"
                    style={{ color: "#0f2a5e" }}
                  >
                    Data Privacy Act of 2012 (RA 10173)
                  </button>
                  . It will not be shared with unauthorized third parties.
                </p>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 flex-shrink-0"
                    style={{ accentColor: "#c2467d", width: 14, height: 14 }}
                  />
                  <span className="text-xs" style={{ color: "#374151" }}>
                    I have read and understood the{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-60"
                      style={{ color: "#0f2a5e" }}
                    >
                      Data Privacy Notice
                    </button>
                    .
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="space-y-4 pt-6" style={{ borderTop: "1px solid #e5e7eb" }}>
              {/* ── reCAPTCHA — sits above the submit buttons ── */}
              <div className="flex flex-col items-end gap-1">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6LcxosUsAAAAAJpim7cdKsK_GgUJf8GBkPUNHtS1"
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => {
                    setCaptchaToken(null);
                    toast({ title: "CAPTCHA Expired", description: "Please complete the verification again.", variant: "destructive" });
                  }}
                  theme="light"
                />
                {!captchaToken && (
                  <p className="text-xs" style={{ color: "#ef4444" }}>
                    ↑ Please check the box above before submitting
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs" style={{ color: "#9ca3af" }}>
                  Already registered?{" "}
                  <Link to="/login" className="font-semibold hover:underline" style={{ color: "#0f2a5e" }}>Sign in here</Link>
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-6 py-2.5 text-sm font-semibold uppercase tracking-wider transition-all"
                    style={{ borderRadius: 2, border: "1.5px solid #c2467d", color: "#c2467d", backgroundColor: "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#fdf5f8"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !captchaToken || !!dobError}
                    className="px-8 py-2.5 text-white text-sm font-semibold uppercase tracking-wider transition-all disabled:opacity-60"
                    style={{ borderRadius: 2, backgroundColor: "#0f2a5e", letterSpacing: "0.08em" }}
                    onMouseEnter={(e) => { if (!isLoading && captchaToken && !dobError) (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"; }}
                    onMouseLeave={(e) => { if (!isLoading && captchaToken && !dobError) (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2a5e"; }}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Submitting...
                      </span>
                    ) : !captchaToken ? "Complete CAPTCHA to Submit" : "Submit Registration"}
                  </button>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;