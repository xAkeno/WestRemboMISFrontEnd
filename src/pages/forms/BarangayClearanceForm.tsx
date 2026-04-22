import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/components/services/clearanceApi";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Copy, Check, X } from "lucide-react";
import { PrefixCombobox } from "./PrefixCombobox";
import { toUpperCase, PREFIX_OPTIONS } from "./formUtils";
import Header from "@/components/forms/Header";

interface BuildingClearanceFormProps { onBack: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }

// ── Validation helpers ────────────────────────────────────────────────────────
const MIN_AGE = 18;

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const maxDob = () => {
  const d = today();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d;
};

const validateDob = (dob: string): string => {
  if (!dob) return "Date of birth is required.";
  const date = new Date(dob);
  if (isNaN(date.getTime())) return "Invalid date.";
  if (date > today()) return "Date of birth cannot be a future date.";
  if (date > maxDob()) return `You must be at least ${MIN_AGE} years old to apply for a Building Clearance.`;
  return "";
};

const validateName = (name: string, fieldName: string): string => {
  if (!name || name.trim() === "") return `${fieldName} is required.`;
  if (!/^[A-Za-z\s\-']+$/.test(name)) return `${fieldName} must contain only letters.`;
  if (name.trim().length === 1) return `${fieldName} must be at least 2 characters.`;
  return "";
};

const validateRequired = (value: string, fieldName: string): string => {
  if (!value || value.trim() === "") return `${fieldName} is required.`;
  return "";
};

const validatePurposeDetails = (value: string): string => {
  if (!value || value.trim() === "") return "Purpose details are required.";
  if (value.trim().length < 10) return "Please provide more details (at least 10 characters).";
  return "";
};

const validateContact = (contact: string): string => {
  if (!contact || contact.trim() === "") return "Contact number is required.";
  const cleanContact = contact.replace(/\D/g, "");
  if (cleanContact.length !== 11) return "Contact number must be exactly 11 digits.";
  if (!/^09\d{9}$/.test(cleanContact)) return "Contact number must start with '09' and contain 11 digits.";
  return "";
};

const validateEmail = (email: string): string => {
  if (!email || email.trim() === "") return "Email address is required.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address (e.g., name@domain.com).";
  return "";
};

const toInputMax = (d: Date) => d.toISOString().split("T")[0];

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
          <p className="text-white font-bold text-xl relative z-10 mb-1">Request Submitted!</p>
          <p className="text-sm relative z-10" style={{ color: "rgba(255,255,255,0.65)" }}>
            Building Clearance Application
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
            Your building clearance request is being reviewed by the barangay office.
            You'll be notified once it's processed.
          </p>

          <button
            onClick={() => navigate(`/request/building_clearance/${successData.id}`)}
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
const BuildingClearanceForm = ({ onBack }: BuildingClearanceFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [successData, setSuccessData] = useState<{ id: number; refNo: string } | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [errors, setErrors] = useState({
    surname: "",
    first_name: "",
    middle_name: "",
    dob: "",
    contact_no: "",
    email: "",
    establishment: "",
    purpose_details: "",
    house_block_lot_no: "",
    street: "",
    zone: "",
  });

  const { toast } = useToast();

  // ── Fetch streets ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) {
        console.error("Failed to fetch streets:", e);
      }
    };
    load();
  }, []);

  const uniqueZones = Array.from(new Set(streets.map((s) => s.sitio).filter(Boolean)));

  const [formData, setFormData] = useState({
    requester_type: "Online",
    prefix: "", surname: "", first_name: "", middle_name: "", ext_name: "",
    age: "", dob: "",
    contact_no: "", email: "",
    establishment: "", purpose: "", purpose_details: "",
    house_block_lot_no: "", street: "", zone: "",
    bcert_number: "", issued_date: "", or_no: "", remarks: "",
    punong_barangay: "", for_the_punong_barangay: "", barangay_position: "",
  });

  const upd = (f: string, v: string) => {
    const textFields = [
      "surname", "first_name", "middle_name", "ext_name",
      "establishment", "purpose_details", "house_block_lot_no",
      "bcert_number", "or_no", "remarks", "punong_barangay",
      "for_the_punong_barangay", "barangay_position", "contact_no", "email",
    ];
    const value = textFields.includes(f) ? toUpperCase(v) : v;
    setFormData((p) => ({ ...p, [f]: value }));
    if (errors[f as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [f]: "" }));
    }
  };

  const calculateAge = (dob: string): number => {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleDobChange = (val: string) => {
    upd("dob", val);
    const err = validateDob(val);
    setErrors((prev) => ({ ...prev, dob: err }));
    if (!err && val) {
      const age = calculateAge(val);
      upd("age", String(age));
    } else if (err) {
      upd("age", "");
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    newErrors.surname = validateName(formData.surname, "Surname");
    newErrors.first_name = validateName(formData.first_name, "First name");
    newErrors.middle_name = validateRequired(formData.middle_name, "Middle name");
    newErrors.dob = validateDob(formData.dob);
    newErrors.contact_no = validateContact(formData.contact_no);
    newErrors.email = validateEmail(formData.email);
    newErrors.establishment = validateRequired(formData.establishment, "Establishment/Project name");
    newErrors.purpose_details = validatePurposeDetails(formData.purpose_details);
    newErrors.house_block_lot_no = validateRequired(formData.house_block_lot_no, "House/Block/Lot number");
    newErrors.street = validateRequired(formData.street, "Street");
    newErrors.zone = validateRequired(formData.zone, "Zone/Purok");

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
    const payload = {
      requester_type: formData.requester_type,
      prefix: formData.prefix,
      surname: formData.surname,
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      ext_name: formData.ext_name,
      age: formData.age ? Number(formData.age) : null,
      dob: formData.dob,
      contact_no: formData.contact_no,
      email: formData.email,
      establishment: formData.establishment,
      house_block_lot_no: formData.house_block_lot_no,
      street: formData.street,
      zone: formData.zone,
      purpose: formData.purpose,
      purpose_details: formData.purpose_details,
      bcert_number: formData.bcert_number,
      issued_date: formData.issued_date,
      or_no: formData.or_no,
      remarks: formData.remarks,
      punong_barangay: formData.punong_barangay,
      for_the_punong_barangay: formData.for_the_punong_barangay,
      barangay_position: formData.barangay_position,
    };

    try {
      const res = await api.post("/building-clearances", payload, { withCredentials: true });
      if (res.status === 200 || res.status === 201) {
        const newId = res.data?.data?.service?.id ?? res.data?.data?.id ?? res.data?.id;
        setSuccessData({
          id: newId,
          refNo: `REF-${String(newId).padStart(4, "0")}`,
        });
      }
    } catch (error: any) {
      toast({
        title: error.response?.status === 422 ? "Validation Error" : "Error",
        description: error.response?.status === 422
          ? "Please check required fields and try again."
          : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
          const foundStreet = streets.find((s) =>
            addressParts.street.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(addressParts.street.toLowerCase())
          );
          matchedStreet = foundStreet
            ? toUpperCase(foundStreet.name)
            : toUpperCase(addressParts.street);
        } else {
          matchedStreet = toUpperCase(addressParts.street);
        }

        const normalizedZone = toUpperCase(addressParts.zone);

        const newData = {
          prefix: user.prefix ?? "",
          surname: user.surname ?? "",
          first_name: user.first_name ?? "",
          middle_name: user.middle_name ?? "",
          ext_name: user.extension_name ?? "",
          dob: normalizedDob,
          contact_no: user.contact_number ?? "",
          email: user.email ?? "",
          house_block_lot_no: toUpperCase(addressParts.house_block_lot_no),
          street: matchedStreet,
          zone: normalizedZone,
        };

        Object.entries(newData).forEach(([key, value]) => {
          if (value && value !== "") {
            filledFields.push(key);
          }
        });

        setFormData((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(newData).map(([k, v]) => [
              k,
              k === "dob" ? (v ? v : "") : typeof v === "string" ? toUpperCase(v) : v,
            ])
          ),
          age: user.date_of_birth ? String(calculateAge(normalizedDob)) : "",
        }));

        setAutoFilledFields(filledFields);
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
              Building Clearance Application
            </h1>
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
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Middle Name *</Label>
                  <Input
                    type="text"
                    placeholder="Reyes"
                    value={formData.middle_name}
                    onChange={(e) => upd("middle_name", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.middle_name ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("middle_name") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("middle_name")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.middle_name ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("middle_name")}
                  />
                  {errors.middle_name && <p className="mt-1 text-xs text-red-500">{errors.middle_name}</p>}
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
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    readOnly
                    disabled
                    className={`${underlineInput} cursor-not-allowed opacity-60`}
                    style={{ borderBottomColor: "#dde3ed", backgroundColor: "#f3f4f6" }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={formData.dob}
                    max={toInputMax(maxDob())}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: errors.dob ? "#ef4444" : "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.dob ? "#ef4444" : "#dde3ed")}
                  />
                  {errors.dob && <p className="mt-1 text-xs text-red-500">{errors.dob}</p>}
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
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Contact Number *</Label>
                  <Input
                    type="tel"
                    placeholder="09XX XXX XXXX"
                    value={formData.contact_no}
                    onChange={(e) => upd("contact_no", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.contact_no ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("contact_no") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("contact_no")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.contact_no ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("contact_no")}
                  />
                  {errors.contact_no && <p className="mt-1 text-xs text-red-500">{errors.contact_no}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="juan@email.com"
                    value={formData.email}
                    onChange={(e) => upd("email", e.target.value)}
                    className={underlineInput}
                    style={{ 
                      borderBottomColor: errors.email ? "#ef4444" : "#dde3ed",
                      opacity: isFieldDisabled("email") ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!isFieldDisabled("email")) e.currentTarget.style.borderBottomColor = "#c2467d"; }}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.email ? "#ef4444" : "#dde3ed")}
                    disabled={isFieldDisabled("email")}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Section 3 — Building Details */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>3</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Building Details</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Establishment / Project Name *</Label>
                  <Input
                    placeholder="e.g., Residential Building, Commercial Complex"
                    value={formData.establishment}
                    onChange={(e) => upd("establishment", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: errors.establishment ? "#ef4444" : "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.establishment ? "#ef4444" : "#dde3ed")}
                  />
                  {errors.establishment && <p className="mt-1 text-xs text-red-500">{errors.establishment}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Purpose</Label>
                  <Select value={formData.purpose} onValueChange={(v) => upd("purpose", v)}>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: "#dde3ed" }}>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {["New Construction", "Renovation", "Addition", "Demolition", "Fence", "Other"].map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Purpose Details *</Label>
                  <textarea
                    rows={4}
                    placeholder="Describe the building / construction project in detail..."
                    value={formData.purpose_details}
                    onChange={(e) => upd("purpose_details", e.target.value)}
                    className="rounded-none border-0 border-b-2 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm w-full"
                    style={{ borderBottomColor: errors.purpose_details ? "#ef4444" : "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.purpose_details ? "#ef4444" : "#dde3ed")}
                  />
                  {errors.purpose_details && <p className="mt-1 text-xs text-red-500">{errors.purpose_details}</p>}
                </div>
              </div>
            </div>

            {/* Section 4 — Project Location */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>4</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Project Location</h3>
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
                  Your personal information will be collected and processed solely for the purpose of this building clearance application, in accordance with the{" "}
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
                ) : "Submit Application"}
              </button>
            </div>

          </form>
        </div>
      </div>

      {successData && <SuccessModal successData={successData} onBack={onBack} />}
    </>
  );
};

export default BuildingClearanceForm;