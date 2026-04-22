import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Copy, Check, X, DollarSign, FileText, IdCard, Timer } from "lucide-react";
import { PrefixCombobox } from "./PrefixCombobox";
import { toUpperCase, PREFIX_OPTIONS } from "./formUtils";
import Header from "@/components/forms/Header";

interface ResidentRegistrationFormProps { onBack: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }

// ── Validation helpers ────────────────────────────────────────────────────────
const validateName = (name: string, fieldName: string): string => {
  if (!name || name.trim() === "") return `${fieldName} is required.`;
  if (!/^[A-Za-z\s\-']+$/.test(name)) return `${fieldName} must contain only letters.`;
  if (name.trim().length === 1) return `${fieldName} must be at least 2 characters.`;
  return "";
};

const validateContact = (contact: string): string => {
  if (!contact || contact.trim() === "") return "Phone number is required.";
  const cleanContact = contact.replace(/\D/g, "");
  if (cleanContact.length !== 11) return "Phone number must be exactly 11 digits.";
  if (!/^09\d{9}$/.test(cleanContact)) return "Phone number must start with '09'.";
  return "";
};

const validateEmail = (email: string): string => {
  if (!email || email.trim() === "") return "Email address is required.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address.";
  return "";
};

const validateRequired = (value: string, fieldName: string): string => {
  if (!value || value.trim() === "") return `${fieldName} is required.`;
  return "";
};

const validateNumber = (value: number, fieldName: string): string => {
  if (!value || value <= 0) return `${fieldName} is required and must be greater than 0.`;
  return "";
};

const validatePeriodOfResidency = (value: string): string => {
  if (!value || value.trim() === "") return "Period of residency is required.";
  if (!/^\d+\s*(year|years|month|months)?$/i.test(value.trim()))
    return "Please enter a valid period (e.g., 5 years, 6 months).";
  return "";
};

const validateDob = (dob: string): string => {
  if (!dob) return "Date of birth is required.";
  const date = new Date(dob);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(date.getTime())) return "Invalid date.";
  if (date > today) return "Date of birth cannot be a future date.";
  return "";
};

// ── Address parser helper ────────────────────────────────────────────────────
const parseAddress = (address: string) => {
  if (!address) {
    return { house_block_lot_no: "", street: "", zone: "" };
  }
  const parts = address.split(",").map((p) => p.trim());
  return {
    house_block_lot_no: parts[0] || "",
    street: parts[1] || "",
    zone: parts[2] || "",
  };
};

// ── Data Privacy Modal ──────────────────────────────────────────────────────
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
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>
            Republic Act No. 10173 — Data Privacy Act of 2012
          </p>
          <p>
            Barangay West Rembo, City of Taguig, is committed to protecting and respecting your privacy. This notice explains how we collect, use, and protect your personal data in compliance with the Data Privacy Act of 2012 (RA 10173).
          </p>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Purpose of Data Collection</p>
          <p>
            The personal information you provide — including your name, address, date of birth, contact details, and government-issued ID — is collected solely for the purpose of resident registration, verification of identity, and delivery of barangay services.
          </p>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Data Processing & Storage</p>
          <p>
            Your data will be stored securely and will only be accessed by authorized barangay personnel. We do not sell, trade, or transfer your personal information to third parties without your consent, except as required by law.
          </p>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Your Rights</p>
          <ul className="space-y-1 list-disc pl-4">
            <li>Right to be informed of the processing of your personal data</li>
            <li>Right to access your personal data held by the barangay</li>
            <li>Right to object to processing in certain circumstances</li>
            <li>Right to erasure or blocking of unlawfully processed data</li>
            <li>Right to file a complaint with the National Privacy Commission</li>
          </ul>
          <p>
            For questions or concerns about your data, please contact the Barangay West Rembo office directly.
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

// ── Success Modal ──────────────────────────────────────────────────────────
const SuccessModal = ({
  successData,
  onBack,
}: {
  successData: { id: number; refNo: string } | null;
  onBack: () => void;
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!successData) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <div
        className="w-full sm:max-w-lg md:max-w-xl overflow-hidden"
        style={{
          borderRadius: "20px",
          backgroundColor: "white",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
        }}
      >
        <div
          className="relative overflow-hidden px-6 pt-8 pb-6 text-center"
          style={{ backgroundColor: "#0f2a5e" }}
        >
          <div className="absolute right-[-24px] bottom-[-24px] w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
          <div className="absolute left-[-16px] top-[-16px] w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <p className="text-white font-bold text-xl relative z-10 mb-1">Registration Submitted!</p>
          <p className="text-sm relative z-10" style={{ color: "rgba(255,255,255,0.65)" }}>
            Resident Registration
          </p>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af" }}>
                Reference Number
              </p>
              <p className="text-lg font-black font-mono" style={{ color: "#0f2a5e" }}>
                {successData.refNo}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(successData.refNo);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: "#f3f4f6", color: copied ? "#16a34a" : "#9ca3af" }}
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>

          <p className="text-sm text-center leading-relaxed" style={{ color: "#6b7280" }}>
            Your resident registration is being reviewed by the barangay office.
          </p>

          <button
            onClick={() => navigate(`/request/resident_registration/${successData.id}`)}
            className="w-full py-3 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0f2a5e" }}
          >
            View My Request
          </button>

          <button
            onClick={onBack}
            className="w-full py-3 text-sm font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
          >
            Back to Requests
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────
const ResidentRegistrationForm = ({ onBack }: ResidentRegistrationFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [residentImage, setResidentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ id: number; refNo: string } | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [errors, setErrors] = useState({
    surname: "", first_name: "", sex: "", marital_status: "", dob: "", pob: "",
    religion: "", height_cm: "", weight_kg: "", blood_type: "", complexion: "",
    phone_number: "", email_address: "",
    house_block_lot_no: "", street: "", zone: "",
    resident_status: "", period_of_residency: "", voter_status: "", emp_status: "", pwd: "",
  });

  const { toast } = useToast();

  // ── Fetch streets ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) {
        console.error("Failed to fetch streets:", e);
      }
    };
    load();
  }, []);

  const uniqueZones = Array.from(new Set(streets.map((s) => s.sitio).filter(Boolean)));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResidentImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const [formData, setFormData] = useState({
    requester_type: "Online",
    prefix: "", surname: "", first_name: "", middle_name: "", ext_name: "",
    nick_name: "", sex: "", marital_status: "", name_of_spouse: "",
    dob: "", pob: "",
    height_cm: 0, weight_kg: 0, blood_type: "", complexion: "", religion: "",
    phone_number: "", email_address: "",
    house_block_lot_no: "", street: "", zone: "",
    house_owner: "", relationship_to_owner: "",
    resident_status: "", voter_status: "", precinct_no: "",
    emp_status: "", occupation: "", position: "", pwd: "",
    period_of_residency: "", notes: "",
  });

  const upd = (f: string, v: string | number) => {
    const textFields = [
      "surname", "first_name", "middle_name", "ext_name", "nick_name",
      "pob", "religion", "house_block_lot_no", "street", "zone",
      "house_owner", "relationship_to_owner", "occupation", "position",
      "period_of_residency", "notes", "precinct_no", "name_of_spouse",
    ];
    const value = typeof v === "string" && textFields.includes(f) ? toUpperCase(v) : v;
    setFormData((p) => ({ ...p, [f]: value }));
    if (errors[f as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [f]: "" }));
    }
  };

  // ── Auto-fill from authenticated user ─────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/details", { withCredentials: true });
        const user = res.data.data;
        const filledFields: string[] = [];

        const normalizedDob = user.date_of_birth
          ? user.date_of_birth.split("T")[0]
          : "";

        const addressParts = parseAddress(user.address || "");

        let matchedStreet = "";
        if (addressParts.street && streets.length > 0) {
          const found = streets.find((s) =>
            addressParts.street.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(addressParts.street.toLowerCase())
          );
          matchedStreet = found ? toUpperCase(found.name) : toUpperCase(addressParts.street);
        } else {
          matchedStreet = toUpperCase(addressParts.street);
        }

        const newData = {
          prefix: user.prefix ?? "",
          surname: toUpperCase(user.surname ?? ""),
          first_name: toUpperCase(user.first_name ?? ""),
          middle_name: toUpperCase(user.middle_name ?? ""),
          ext_name: toUpperCase(user.extension_name ?? ""),
          nick_name: toUpperCase(user.nick_name ?? ""),
          sex: user.sex ?? "",
          marital_status: user.marital_status ?? "",
          name_of_spouse: toUpperCase(user.name_of_spouse ?? ""),
          dob: normalizedDob,
          pob: toUpperCase(user.place_of_birth ?? ""),
          height_cm: user.height_cm ?? 0,
          weight_kg: user.weight_kg ?? 0,
          blood_type: user.blood_type ?? "",
          complexion: user.complexion ?? "",
          religion: toUpperCase(user.religion ?? ""),
          phone_number: user.contact_number ?? "",
          email_address: user.email ?? "",
          house_block_lot_no: toUpperCase(addressParts.house_block_lot_no),
          street: matchedStreet,
          zone: toUpperCase(addressParts.zone),
          house_owner: toUpperCase(user.house_owner ?? ""),
          relationship_to_owner: user.relationship_to_owner ?? "",
          resident_status: user.resident_status ?? "",
          voter_status: user.voter_status ? "Registered" : "Not Registered",
          precinct_no: user.precinct_no ?? "",
          emp_status: user.emp_status ?? "",
          occupation: toUpperCase(user.occupation ?? ""),
          position: toUpperCase(user.position ?? ""),
          pwd: user.pwd ? "Yes" : "No",
          period_of_residency: user.period_of_residency ?? "",
          notes: toUpperCase(user.notes ?? ""),
        };

        Object.entries(newData).forEach(([key, value]) => {
          if (value && value !== "" && value !== 0) filledFields.push(key);
        });

        setFormData((prev) => ({ ...prev, ...newData }));
        setAutoFilledFields(filledFields);

        if (user.photo_url) setImagePreview(user.photo_url);
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
      }
    };
    loadUser();
  }, [streets]);

  const isFieldDisabled = (fieldName: string) => {
    if (fieldName === "dob") return false;
    if (fieldName === "street") return false;
    if (fieldName === "zone") return false;
    return autoFilledFields.includes(fieldName);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    newErrors.surname = validateName(formData.surname, "Surname");
    newErrors.first_name = validateName(formData.first_name, "First name");
    newErrors.sex = validateRequired(formData.sex, "Sex");
    newErrors.marital_status = validateRequired(formData.marital_status, "Marital status");
    newErrors.dob = validateDob(formData.dob);
    newErrors.pob = validateRequired(formData.pob, "Place of birth");
    newErrors.religion = validateRequired(formData.religion, "Religion");
    newErrors.height_cm = validateNumber(formData.height_cm, "Height");
    newErrors.weight_kg = validateNumber(formData.weight_kg, "Weight");
    newErrors.blood_type = validateRequired(formData.blood_type, "Blood type");
    newErrors.complexion = validateRequired(formData.complexion, "Complexion");
    newErrors.phone_number = validateContact(formData.phone_number);
    newErrors.email_address = validateEmail(formData.email_address);
    newErrors.house_block_lot_no = validateRequired(formData.house_block_lot_no, "House/Block/Lot number");
    newErrors.street = validateRequired(formData.street, "Street");
    newErrors.zone = validateRequired(formData.zone, "Zone/Purok");
    newErrors.resident_status = validateRequired(formData.resident_status, "Resident status");
    newErrors.period_of_residency = validatePeriodOfResidency(formData.period_of_residency);
    newErrors.voter_status = validateRequired(formData.voter_status, "Voter status");
    newErrors.emp_status = validateRequired(formData.emp_status, "Employment status");
    newErrors.pwd = validateRequired(formData.pwd, "PWD status");

    if (Object.values(newErrors).some((e) => e !== "")) isValid = false;

    setErrors(newErrors);
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting.",
        variant: "destructive",
      });
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => payload.append(k, String(v)));
      if (residentImage) payload.append("photo", residentImage);
      const res = await axios.post("http://127.0.0.1:8000/api/residents", payload, { withCredentials: true });
      if (res.status === 201 || res.status === 200) {
        const newId = res.data?.data?.service?.id ?? res.data?.data?.id ?? res.data?.id;
        setSuccessData({ id: newId, refNo: `REF-${String(newId).padStart(4, "0")}` });
      }
    } catch (error: any) {
      toast({
        title: error.response?.status === 422 ? "Validation Error" : "Submission Failed",
        description: error.response?.status === 422
          ? "Please check required fields and try again."
          : "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const underlineInput = "rounded-none border-0 border-b-2 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm";

  return (
    <>
      <Header />
      <DataPrivacyModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      <div
        className="w-full max-w-4xl bg-white overflow-hidden items-start mx-auto my-24"
        style={{ borderRadius: 4, boxShadow: "0 2px 40px rgba(10,20,60,0.15)", border: "1px solid #dde3ed" }}
      >
        {/* Header */}
        <div style={{ backgroundColor: "#0f2a5e", padding: "20px 40px" }} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-0.5" style={{ color: "#e8a0bf" }}>
              Republic of the Philippines · City of Taguig
            </p>
            <h1 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1.15rem" }}>
              Resident Registration
            </h1>
          </div>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />

        <div className="p-8 md:p-10">
          <div
            className="mb-8 p-6 rounded-lg border"
            style={{ backgroundColor: "#fefce8", borderColor: "#fde047" }}
          >
            <h3
              className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2"
              style={{ color: "#854d0e" }}
            >
              📌 Before You Apply
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Requirements */}
              <div>
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                  style={{ color: "#854d0e" }}
                >
                  <FileText className="w-4 h-4" />
                  Requirements
                </h4>

                <ul className="space-y-2 text-sm" style={{ color: "#713f12" }}>
                  <li className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 opacity-80" />
                    Valid Government ID
                  </li>
                  <li className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 opacity-80" />
                    Proof of residence (utility bill, lease contract)
                  </li>
                  <li className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 opacity-80" />
                    2x2 ID photos (2 pieces)
                  </li>
                </ul>
              </div>

              {/* Processing & Fee */}
              <div className="space-y-5">
                
                <div>
                  <h4
                    className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"
                    style={{ color: "#854d0e" }}
                  >
                    <Timer className="w-4 h-4" />
                    Processing Time
                  </h4>
                  <p className="text-sm font-medium pl-2" style={{ color: "#713f12" }}>
                    1–2 business days
                  </p>
                </div>

                <div>
                  <h4
                    className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"
                    style={{ color: "#854d0e" }}
                  >
                    <DollarSign className="w-4 h-4" />
                    Service Fee
                  </h4>
                  <p className="text-base font-bold pl-2" style={{ color: "#713f12" }}>
                    Free
                  </p>
                </div>

              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Section 1 — Personal Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>1</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Personal Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Prefix</Label>
                  <PrefixCombobox
                    options={PREFIX_OPTIONS}
                    value={formData.prefix}
                    onChange={(v) => upd("prefix", v)}
                    placeholder="Select prefix"
                    disabled={isFieldDisabled("prefix")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Surname *</Label>
                  <Input
                    type="text"
                    placeholder="de la Cruz"
                    value={formData.surname}
                    onChange={(e) => upd("surname", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.surname ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("surname") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("surname")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.surname ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("surname")}
                  />
                  {errors.surname && <p className="mt-1 text-xs text-red-500">{errors.surname}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>First Name *</Label>
                  <Input
                    type="text"
                    placeholder="Juan"
                    value={formData.first_name}
                    onChange={(e) => upd("first_name", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.first_name ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("first_name") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("first_name")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.first_name ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("first_name")}
                  />
                  {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Middle Name</Label>
                  <Input
                    type="text"
                    placeholder="Reyes"
                    value={formData.middle_name}
                    onChange={(e) => upd("middle_name", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: "#dde3ed",
                      opacity: isFieldDisabled("middle_name") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("middle_name")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    disabled={isFieldDisabled("middle_name")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Extension</Label>
                  <Input
                    placeholder="Jr., Sr., III"
                    value={formData.ext_name}
                    onChange={(e) => upd("ext_name", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: "#dde3ed",
                      opacity: isFieldDisabled("ext_name") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("ext_name")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    disabled={isFieldDisabled("ext_name")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Nickname</Label>
                  <Input
                    placeholder="Nickname"
                    value={formData.nick_name}
                    onChange={(e) => upd("nick_name", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: "#dde3ed",
                      opacity: isFieldDisabled("nick_name") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("nick_name")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    disabled={isFieldDisabled("nick_name")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Sex *</Label>
                  <RadioGroup
                    value={formData.sex}
                    onValueChange={(v) => upd("sex", v)}
                    className="flex gap-6 mt-2.5"
                    disabled={isFieldDisabled("sex")}
                  >
                    {["Male", "Female"].map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <RadioGroupItem value={s} id={`sex-${s}`} disabled={isFieldDisabled("sex")} />
                        <label htmlFor={`sex-${s}`} className={`text-sm ${isFieldDisabled("sex") ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>{s}</label>
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.sex && <p className="mt-1 text-xs text-red-500">{errors.sex}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Marital Status *</Label>
                  <Select value={formData.marital_status} onValueChange={(v) => upd("marital_status", v)} disabled={isFieldDisabled("marital_status")}>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: errors.marital_status ? "#ef4444" : "#dde3ed" }}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Single", "Married", "Widowed", "Separated"].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.marital_status && <p className="mt-1 text-xs text-red-500">{errors.marital_status}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Name of Spouse</Label>
                  <Input
                    placeholder="Name of spouse"
                    value={formData.name_of_spouse}
                    onChange={(e) => upd("name_of_spouse", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    disabled={isFieldDisabled("name_of_spouse")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={formData.dob}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => upd("dob", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: errors.dob ? "#ef4444" : "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.dob ? "#ef4444" : "#dde3ed")}
                  />
                  {errors.dob && <p className="mt-1 text-xs text-red-500">{errors.dob}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Place of Birth *</Label>
                  <Input
                    placeholder="Manila"
                    value={formData.pob}
                    onChange={(e) => upd("pob", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.pob ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("pob") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("pob")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.pob ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("pob")}
                  />
                  {errors.pob && <p className="mt-1 text-xs text-red-500">{errors.pob}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Religion *</Label>
                  <Input
                    placeholder="Religion"
                    value={formData.religion}
                    onChange={(e) => upd("religion", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.religion ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("religion") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("religion")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.religion ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("religion")}
                  />
                  {errors.religion && <p className="mt-1 text-xs text-red-500">{errors.religion}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Height (cm) *</Label>
                  <Input
                    type="number"
                    placeholder="165"
                    value={formData.height_cm || ""}
                    onChange={(e) => upd("height_cm", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.height_cm ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("height_cm") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("height_cm")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.height_cm ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("height_cm")}
                  />
                  {errors.height_cm && <p className="mt-1 text-xs text-red-500">{errors.height_cm}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Weight (kg) *</Label>
                  <Input
                    type="number"
                    placeholder="65"
                    value={formData.weight_kg || ""}
                    onChange={(e) => upd("weight_kg", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.weight_kg ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("weight_kg") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("weight_kg")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.weight_kg ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("weight_kg")}
                  />
                  {errors.weight_kg && <p className="mt-1 text-xs text-red-500">{errors.weight_kg}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Blood Type *</Label>
                  <Select value={formData.blood_type} onValueChange={(v) => upd("blood_type", v)} disabled={isFieldDisabled("blood_type")}>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: errors.blood_type ? "#ef4444" : "#dde3ed" }}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "N/A"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.blood_type && <p className="mt-1 text-xs text-red-500">{errors.blood_type}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Complexion *</Label>
                  <Select value={formData.complexion} onValueChange={(v) => upd("complexion", v)} disabled={isFieldDisabled("complexion")}>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: errors.complexion ? "#ef4444" : "#dde3ed" }}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Fair", "Light", "Medium", "Tan", "Dark"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.complexion && <p className="mt-1 text-xs text-red-500">{errors.complexion}</p>}
                </div>
              </div>
            </div>

            {/* Section 2 — Contact Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>2</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Contact Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="09XX XXX XXXX"
                    value={formData.phone_number}
                    onChange={(e) => upd("phone_number", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.phone_number ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("phone_number") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("phone_number")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.phone_number ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("phone_number")}
                  />
                  {errors.phone_number && <p className="mt-1 text-xs text-red-500">{errors.phone_number}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="juan@email.com"
                    value={formData.email_address}
                    onChange={(e) => upd("email_address", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.email_address ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("email_address") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("email_address")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.email_address ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("email_address")}
                  />
                  {errors.email_address && <p className="mt-1 text-xs text-red-500">{errors.email_address}</p>}
                </div>
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
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>House / Block / Lot No. *</Label>
                  <Input
                    placeholder="e.g., 123-A, Blk 5"
                    value={formData.house_block_lot_no}
                    onChange={(e) => upd("house_block_lot_no", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.house_block_lot_no ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("house_block_lot_no") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("house_block_lot_no")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.house_block_lot_no ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("house_block_lot_no")}
                  />
                  {errors.house_block_lot_no && <p className="mt-1 text-xs text-red-500">{errors.house_block_lot_no}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Street *</Label>
                  {streets.length > 0 ? (
                    <Select
                      value={formData.street}
                      onValueChange={(v) => {
                        setFormData((p) => ({ ...p, street: toUpperCase(v) }));
                        setErrors((prev) => ({ ...prev, street: "" }));
                      }}
                    >
                      <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: errors.street ? "#ef4444" : "#dde3ed" }}>
                        <SelectValue placeholder="Select street" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {streets.map((s) => (
                          <SelectItem key={s.id} value={toUpperCase(s.name)}>
                            {s.name}{s.formerly ? ` (formerly ${s.formerly})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Enter street name"
                      value={formData.street}
                      onChange={(e) => upd("street", e.target.value)}
                      className={underlineInput}
                      style={{ borderBottomColor: errors.street ? "#ef4444" : "#dde3ed" }}
                      onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                      onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.street ? "#ef4444" : "#dde3ed")}
                    />
                  )}
                  {errors.street && <p className="mt-1 text-xs text-red-500">{errors.street}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Zone / Purok *</Label>
                  {uniqueZones.length > 0 ? (
                    <Select
                      value={formData.zone}
                      onValueChange={(v) => {
                        setFormData((p) => ({ ...p, zone: toUpperCase(v) }));
                        setErrors((prev) => ({ ...prev, zone: "" }));
                      }}
                    >
                      <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: errors.zone ? "#ef4444" : "#dde3ed" }}>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {uniqueZones.map((z) => (
                          <SelectItem key={z} value={toUpperCase(z)}>{z}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Enter zone / purok"
                      value={formData.zone}
                      onChange={(e) => upd("zone", e.target.value)}
                      className={underlineInput}
                      style={{ borderBottomColor: errors.zone ? "#ef4444" : "#dde3ed" }}
                      onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                      onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.zone ? "#ef4444" : "#dde3ed")}
                    />
                  )}
                  {errors.zone && <p className="mt-1 text-xs text-red-500">{errors.zone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>House Owner</Label>
                  <Input
                    placeholder="Name of house owner"
                    value={formData.house_owner}
                    onChange={(e) => upd("house_owner", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    disabled={isFieldDisabled("house_owner")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Relationship to Owner</Label>
                  <Select value={formData.relationship_to_owner} onValueChange={(v) => setFormData((p) => ({ ...p, relationship_to_owner: v }))} disabled={isFieldDisabled("relationship_to_owner")}>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Owner", "Spouse", "Child", "Parent", "Sibling", "Relative", "Tenant", "Boarder"].map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 4 — Residency & Status Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>4</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Residency & Status Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Resident Status *</Label>
                  <Select value={formData.resident_status} onValueChange={(v) => upd("resident_status", v)} disabled={isFieldDisabled("resident_status")}>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: errors.resident_status ? "#ef4444" : "#dde3ed" }}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Permanent", "Temporary", "Transient"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.resident_status && <p className="mt-1 text-xs text-red-500">{errors.resident_status}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Period of Residency *</Label>
                  <Input
                    placeholder="e.g., 5 years"
                    value={formData.period_of_residency}
                    onChange={(e) => upd("period_of_residency", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.period_of_residency ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("period_of_residency") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("period_of_residency")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.period_of_residency ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("period_of_residency")}
                  />
                  {errors.period_of_residency && <p className="mt-1 text-xs text-red-500">{errors.period_of_residency}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Voter Status *</Label>
                  <RadioGroup
                    value={formData.voter_status}
                    onValueChange={(v) => upd("voter_status", v)}
                    className="flex gap-6 mt-2.5"
                    disabled={isFieldDisabled("voter_status")}
                  >
                    {["Registered", "Not Registered"].map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <RadioGroupItem value={s} id={`voter-${s}`} disabled={isFieldDisabled("voter_status")} />
                        <label htmlFor={`voter-${s}`} className={`text-sm ${isFieldDisabled("voter_status") ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>{s}</label>
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.voter_status && <p className="mt-1 text-xs text-red-500">{errors.voter_status}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Precinct No.</Label>
                  <Input
                    placeholder="Precinct number"
                    value={formData.precinct_no}
                    onChange={(e) => upd("precinct_no", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    disabled={isFieldDisabled("precinct_no")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Employment Status *</Label>
                  <Select value={formData.emp_status} onValueChange={(v) => upd("emp_status", v)} disabled={isFieldDisabled("emp_status")}>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: errors.emp_status ? "#ef4444" : "#dde3ed" }}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Employed", "Self-Employed", "Unemployed", "Student", "Retired"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.emp_status && <p className="mt-1 text-xs text-red-500">{errors.emp_status}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Occupation</Label>
                  <Input
                    placeholder="Occupation"
                    value={formData.occupation}
                    onChange={(e) => upd("occupation", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    disabled={isFieldDisabled("occupation")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Position</Label>
                  <Input
                    placeholder="Position"
                    value={formData.position}
                    onChange={(e) => upd("position", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    disabled={isFieldDisabled("position")}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>PWD Status *</Label>
                <RadioGroup
                  value={formData.pwd}
                  onValueChange={(v) => upd("pwd", v)}
                  className="flex gap-6 mt-2.5"
                  disabled={isFieldDisabled("pwd")}
                >
                  {["Yes", "No"].map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`pwd-${opt}`} disabled={isFieldDisabled("pwd")} />
                      <label htmlFor={`pwd-${opt}`} className={`text-sm ${isFieldDisabled("pwd") ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>{opt}</label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.pwd && <p className="mt-1 text-xs text-red-500">{errors.pwd}</p>}
              </div>

              <div className="mt-6 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Additional Notes</Label>
                <textarea
                  rows={3}
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={(e) => upd("notes", e.target.value)}
                  className="rounded-none border-0 border-b-2 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm w-full"
                  style={{ borderBottomColor: "#dde3ed" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                />
              </div>

              {/* Resident Photo Upload */}
              <div className="mt-6 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Resident Photo</Label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img src={imagePreview} alt="Resident" className="w-16 h-16 object-cover rounded" />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
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

              <div className="p-5 space-y-3" style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d2fe", borderRadius: 2 }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>
                  Data Privacy Notice
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
                  Your personal information will be collected and processed solely for the purpose of this resident registration, in accordance with the{" "}
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

            {/* Form Actions */}
            <div className="flex flex-wrap items-center justify-end gap-4 pt-6" style={{ borderTop: "1px solid #e5e7eb" }}>
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2.5 text-sm font-semibold uppercase tracking-wider transition-all"
                style={{ borderRadius: 2, border: "1.5px solid #c2467d", color: "#c2467d", backgroundColor: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#fdf5f8"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 text-white text-sm font-semibold uppercase tracking-wider transition-all disabled:opacity-60"
                style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}
                onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"; }}
                onMouseLeave={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2a5e"; }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : "Submit Registration"}
              </button>
            </div>

          </form>
        </div>
      </div>

      {successData && <SuccessModal successData={successData} onBack={onBack} />}
    </>
  );
};

export default ResidentRegistrationForm;