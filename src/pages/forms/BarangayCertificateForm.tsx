import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import FormProgress from "./FormProgress";
import FormNavigation from "./FormNavigation";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  NAVY, PINK,
  FieldLabel, FieldInput, FieldTextarea,
  SectionDivider, ReviewRow, ReviewCard, ReviewHeader, FormCard,
} from "./LguFormPrimitives";
import { PrefixCombobox } from "./PrefixCombobox";
import { toUpperCase, PREFIX_OPTIONS } from "./formUtils";
import { CheckCircle, Copy, Check } from "lucide-react";

interface BarangayCertificateFormProps { onBack: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }

const stepLabels = ["Personal Info", "Contact", "Address", "Certificate Details", "Review"];

const ST = {
  className: "border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 text-sm px-0 h-9 bg-transparent shadow-none",
  style: { borderBottomWidth: 1, borderColor: "#d1d5db" } as React.CSSProperties,
};

// ── Validation helpers ────────────────────────────────────────────────────────
const MIN_AGE = 15;

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
  if (date > maxDob()) return `You must be at least ${MIN_AGE} years old.`;
  return "";
};

const validateName = (name: string, fieldName: string): string => {
  if (!name || name.trim() === "") return `${fieldName} is required.`;
  if (!/^[A-Za-z\s\-']+$/.test(name)) return `${fieldName} must contain only letters.`;
  if (name.trim().length === 1) return `${fieldName} must be at least 2 characters.`;
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

const validateRequired = (value: string, fieldName: string): string => {
  if (!value || value.trim() === "") return `${fieldName} is required.`;
  return "";
};

const validatePeriodOfResidency = (value: string): string => {
  if (!value || value.trim() === "") return "Period of residency is required.";
  if (!/^\d+\s*(year|years|month|months)?$/i.test(value.trim()))
    return "Please enter a valid period (e.g., 5 years, 6 months).";
  return "";
};

const validatePurpose = (value: string): string => {
  if (!value || value.trim() === "") return "Purpose is required.";
  return "";
};

const validateStreet = (value: string): string => {
  if (!value || value.trim() === "") return "Street is required.";
  return "";
};

const validateZone = (value: string): string => {
  if (!value || value.trim() === "") return "Zone/Purok is required.";
  return "";
};

const toInputMax = (d: Date) => d.toISOString().split("T")[0];

// ── Age calculation helper (accurate) ────────────────────────────────────────
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

// ── Address parser helper ────────────────────────────────────────────────────
const parseAddress = (address: string) => {
  if (!address) {
    return {
      house_block_lot_no: "",
      street: "",
      zone: "",
    };
  }

  const parts = address.split(",").map((p) => p.trim());

  return {
    house_block_lot_no: parts[0] || "",
    street: parts[1] || "",
    zone: parts[2] || "",
  };
};

// ─────────────────────────────────────────────────────────────────────────────

const BarangayCertificateForm = ({ onBack }: BarangayCertificateFormProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [dobError, setDobError] = useState("");
  const [successData, setSuccessData] = useState<{ id: number; refNo: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);

  const [errors, setErrors] = useState({
    surname: "",
    first_name: "",
    dob: "",
    pob: "",
    contact_no: "",
    email: "",
    house_block_lot_no: "",
    street: "",
    zone: "",
    period_of_residency: "",
    purpose: "",
  });

  const { toast } = useToast();

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

  const [formData, setFormData] = useState({
    requester_type: "Online",
    prefix: "", first_name: "", middle_name: "", surname: "", extension: "",
    age: "", dob: "", pob: "",
    contact_no: "", email: "",
    house_block_lot_no: "", street: "", zone: "",
    house_owner: "", relationship_to_owner: "",
    bcert_number: "Example", issued_date: "",
    period_of_residency: "", registered_voter: "",
    purpose: "", purpose_details: "",
    punong_barangay: "", for_the_punong_barangay: "",
  });

  const upd = (f: string, v: string) => {
    const textFields = [
      "first_name", "middle_name", "surname", "extension", "pob",
      "house_block_lot_no", "street", "zone", "house_owner",
      "relationship_to_owner", "bcert_number", "purpose_details",
      "punong_barangay", "for_the_punong_barangay",
    ];
    const value = textFields.includes(f) ? toUpperCase(v) : v;
    setFormData((p) => ({ ...p, [f]: value }));
    if (errors[f as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [f]: "" }));
    }
  };

  const handleDobChange = (val: string) => {
    upd("dob", val);
    const err = validateDob(val);
    setDobError(err);
    setErrors((prev) => ({ ...prev, dob: err }));
    if (!err && val) {
      const age = calculateAge(val);
      upd("age", String(age));
    } else if (err) {
      upd("age", "");
    }
  };

  const validateCurrentStep = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    switch (currentStep) {
      case 0: {
        const surnameError = validateName(formData.surname, "Surname");
        const firstNameError = validateName(formData.first_name, "First name");
        const pobError = validateRequired(formData.pob, "Place of birth");
        const dobValidationError = validateDob(formData.dob);
        newErrors.surname = surnameError;
        newErrors.first_name = firstNameError;
        newErrors.pob = pobError;
        newErrors.dob = dobValidationError;
        setDobError(dobValidationError);
        if (surnameError || firstNameError || pobError || dobValidationError) isValid = false;
        break;
      }
      case 1: {
        const contactError = validateContact(formData.contact_no);
        const emailError = validateEmail(formData.email);
        newErrors.contact_no = contactError;
        newErrors.email = emailError;
        if (contactError || emailError) isValid = false;
        break;
      }
      case 2: {
        const houseError = validateRequired(formData.house_block_lot_no, "House/Block/Lot number");
        const streetError = validateStreet(formData.street);
        const zoneError = validateZone(formData.zone);
        newErrors.house_block_lot_no = houseError;
        newErrors.street = streetError;
        newErrors.zone = zoneError;
        if (houseError || streetError || zoneError) isValid = false;
        break;
      }
      case 3: {
        const periodError = validatePeriodOfResidency(formData.period_of_residency);
        const purposeError = validatePurpose(formData.purpose);
        newErrors.period_of_residency = periodError;
        newErrors.purpose = purposeError;
        if (periodError || purposeError) isValid = false;
        break;
      }
    }

    setErrors(newErrors);
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding.",
        variant: "destructive",
      });
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < stepLabels.length - 1) setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else onBack();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/barangay-certificates",
        { ...formData, age: formData.age ? Number(formData.age) : null },
        { withCredentials: true }
      );
      if (res.status === 201 || res.status === 200) {
        const newId = res.data?.data?.service?.id;
        
        setSuccessData({
          id: newId,
          refNo: `REF-${String(newId).padStart(4, "0")}`,
        });
      }
    } catch (error: any) {
      toast({
        title: error.response?.status === 422 ? "Validation Error" : "Submission Error",
        description:
          error.response?.status === 422
            ? "Please check the form. Some fields are invalid."
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/details", { withCredentials: true });
        const user = res.data.data;

        const filledFields: string[] = [];

        // Normalize date
        const normalizedDob = user.date_of_birth
          ? user.date_of_birth.split("T")[0]
          : "";

        // Parse address from user.address string
        const addressParts = parseAddress(user.address || "");

        // Match street with available options and NORMALIZE to UPPERCASE
        let matchedStreet = "";
        if (addressParts.street && streets.length > 0) {
          const foundStreet = streets.find(s =>
            addressParts.street.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(addressParts.street.toLowerCase())
          );
          matchedStreet = foundStreet
            ? toUpperCase(foundStreet.name)
            : toUpperCase(addressParts.street);
        } else {
          matchedStreet = toUpperCase(addressParts.street);
        }

        // Normalize zone to UPPERCASE
        const normalizedZone = toUpperCase(addressParts.zone);

        const newData = {
          prefix: user.prefix ?? "",
          first_name: user.first_name ?? "",
          middle_name: user.middle_name ?? "",
          surname: user.surname ?? "",
          extension: user.extension_name ?? "",
          dob: normalizedDob,
          pob: user.place_of_birth ?? "",
          contact_no: user.contact_number ?? "",
          email: user.email ?? "",
          house_block_lot_no: toUpperCase(addressParts.house_block_lot_no),
          street: matchedStreet,
          zone: normalizedZone,
          house_owner: toUpperCase(user.house_owner ?? ""),
          relationship_to_owner: user.relationship_to_owner ?? "",
          period_of_residency: user.period_of_residency ?? "",
        };

        // Detect which fields are auto-filled
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
              k === "dob"
                ? (v ? v : "")
                : typeof v === "string"
                ? toUpperCase(v)
                : v
            ])
          ),
          age: user.date_of_birth ? String(calculateAge(normalizedDob)) : "",
          registered_voter: user.voter_status ? "Yes" : "No",
        }));

        setAutoFilledFields(filledFields);
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
      }
    };
    loadUser();
  }, [streets]);

  const isFieldDisabled = (fieldName: string) => {
    // Don't disable DOB - user should be able to edit it if needed
    // Also don't disable street and zone if they might need correction
    if (fieldName === "dob") return false;
    if (fieldName === "street") return false;
    if (fieldName === "zone") return false;
    return autoFilledFields.includes(fieldName);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <SectionDivider title="Personal Information" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="prefix">Prefix</FieldLabel>
                <PrefixCombobox
                  options={PREFIX_OPTIONS}
                  value={formData.prefix}
                  onChange={(v) => upd("prefix", v)}
                  placeholder="Select prefix"
                  disabled={isFieldDisabled("prefix")}
                />
              </div>
              <div>
                <FieldLabel htmlFor="surname" required>Surname</FieldLabel>
                <FieldInput
                  id="surname"
                  value={formData.surname}
                  onChange={(e) => upd("surname", e.target.value)}
                  style={{ borderColor: errors.surname ? "#ef4444" : undefined }}
                  disabled={isFieldDisabled("surname")}
                  className={isFieldDisabled("surname") ? "cursor-not-allowed opacity-60" : ""}
                />
                {errors.surname && <p className="mt-1 text-xs text-red-500">{errors.surname}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="first_name" required>First Name</FieldLabel>
                <FieldInput
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => upd("first_name", e.target.value)}
                  style={{ borderColor: errors.first_name ? "#ef4444" : undefined }}
                  disabled={isFieldDisabled("first_name")}
                  className={isFieldDisabled("first_name") ? "cursor-not-allowed opacity-60" : ""}
                />
                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="middle_name">Middle Name</FieldLabel>
                <FieldInput
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => upd("middle_name", e.target.value)}
                  disabled={isFieldDisabled("middle_name")}
                  className={isFieldDisabled("middle_name") ? "cursor-not-allowed opacity-60" : ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="extension">Extension</FieldLabel>
                <FieldInput
                  id="extension"
                  placeholder="Jr., Sr., III"
                  value={formData.extension}
                  onChange={(e) => upd("extension", e.target.value)}
                  disabled={isFieldDisabled("extension")}
                  className={isFieldDisabled("extension") ? "cursor-not-allowed opacity-60" : ""}
                />
              </div>
              <div>
                <FieldLabel htmlFor="age" required>Age</FieldLabel>
                <FieldInput
                  id="age"
                  type="number"
                  value={formData.age}
                  readOnly
                  disabled
                  className="cursor-not-allowed opacity-60 bg-gray-100"
                />
              </div>
              <div>
                <FieldLabel htmlFor="dob" required>Date of Birth</FieldLabel>
                <FieldInput
                  id="dob"
                  type="date"
                  value={formData.dob}
                  max={toInputMax(maxDob())}
                  onChange={(e) => handleDobChange(e.target.value)}
                  style={{ borderColor: errors.dob ? "#ef4444" : undefined }}
                  disabled={false}
                />
                {errors.dob && <p className="mt-1 text-xs text-red-500">{errors.dob}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="pob" required>Place of Birth</FieldLabel>
                <FieldInput
                  id="pob"
                  value={formData.pob}
                  onChange={(e) => upd("pob", e.target.value)}
                  style={{ borderColor: errors.pob ? "#ef4444" : undefined }}
                  disabled={isFieldDisabled("pob")}
                  className={isFieldDisabled("pob") ? "cursor-not-allowed opacity-60" : ""}
                />
                {errors.pob && <p className="mt-1 text-xs text-red-500">{errors.pob}</p>}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <SectionDivider title="Contact Information" />
            <div className="max-w-sm">
              <FieldLabel htmlFor="contact_no" required>Contact Number</FieldLabel>
              <FieldInput
                id="contact_no"
                type="tel"
                placeholder="09XX XXX XXXX"
                value={formData.contact_no}
                onChange={(e) => upd("contact_no", e.target.value)}
                style={{ borderColor: errors.contact_no ? "#ef4444" : undefined }}
                disabled={isFieldDisabled("contact_no")}
                className={isFieldDisabled("contact_no") ? "cursor-not-allowed opacity-60" : ""}
              />
              {errors.contact_no && <p className="mt-1 text-xs text-red-500">{errors.contact_no}</p>}
            </div>
            <div className="max-w-sm">
              <FieldLabel htmlFor="email" required>Email Address</FieldLabel>
              <FieldInput
                id="email"
                type="email"
                placeholder="example@domain.com"
                value={formData.email}
                onChange={(e) => upd("email", e.target.value)}
                style={{ borderColor: errors.email ? "#ef4444" : undefined }}
                disabled={isFieldDisabled("email")}
                className={isFieldDisabled("email") ? "cursor-not-allowed opacity-60" : ""}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <SectionDivider title="Address Information" />
            <div>
              <FieldLabel htmlFor="house_block_lot_no" required>House / Block / Lot No.</FieldLabel>
              <FieldInput
                id="house_block_lot_no"
                value={formData.house_block_lot_no}
                onChange={(e) => upd("house_block_lot_no", e.target.value)}
                style={{ borderColor: errors.house_block_lot_no ? "#ef4444" : undefined }}
                disabled={isFieldDisabled("house_block_lot_no")}
                className={isFieldDisabled("house_block_lot_no") ? "cursor-not-allowed opacity-60" : ""}
              />
              {errors.house_block_lot_no && (
                <p className="mt-1 text-xs text-red-500">{errors.house_block_lot_no}</p>
              )}
            </div>

            <div>
              <FieldLabel htmlFor="street" required>Street</FieldLabel>
              {streets.length > 0 ? (
                <>
                  <Select
                    value={formData.street}
                    onValueChange={(v) => {
                      setFormData((p) => ({ ...p, street: toUpperCase(v) }));
                      setErrors((prev) => ({ ...prev, street: "" }));
                    }}
                    disabled={false}
                  >
                    <SelectTrigger {...ST} style={{ borderColor: errors.street ? "#ef4444" : undefined }}>
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
                  {errors.street && <p className="mt-1 text-xs text-red-500">{errors.street}</p>}
                </>
              ) : (
                <>
                  <FieldInput
                    id="street"
                    value={formData.street}
                    onChange={(e) => upd("street", e.target.value)}
                    placeholder="Enter street name"
                    style={{ borderColor: errors.street ? "#ef4444" : undefined }}
                    disabled={false}
                  />
                  {errors.street && <p className="mt-1 text-xs text-red-500">{errors.street}</p>}
                </>
              )}
            </div>

            <div>
              <FieldLabel htmlFor="zone" required>Zone / Purok</FieldLabel>
              {uniqueZones.length > 0 ? (
                <>
                  <Select
                    value={formData.zone}
                    onValueChange={(v) => {
                      setFormData((p) => ({ ...p, zone: toUpperCase(v) }));
                      setErrors((prev) => ({ ...prev, zone: "" }));
                    }}
                    disabled={false}
                  >
                    <SelectTrigger {...ST} style={{ borderColor: errors.zone ? "#ef4444" : undefined }}>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {uniqueZones.map((z) => (
                        <SelectItem key={z} value={toUpperCase(z)}>
                          {z}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.zone && <p className="mt-1 text-xs text-red-500">{errors.zone}</p>}
                </>
              ) : (
                <>
                  <FieldInput
                    id="zone"
                    value={formData.zone}
                    onChange={(e) => upd("zone", e.target.value)}
                    placeholder="Enter zone / purok"
                    style={{ borderColor: errors.zone ? "#ef4444" : undefined }}
                    disabled={false}
                  />
                  {errors.zone && <p className="mt-1 text-xs text-red-500">{errors.zone}</p>}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="house_owner">House Owner</FieldLabel>
                <FieldInput
                  id="house_owner"
                  value={formData.house_owner}
                  onChange={(e) => upd("house_owner", e.target.value)}
                  disabled={isFieldDisabled("house_owner")}
                  className={isFieldDisabled("house_owner") ? "cursor-not-allowed opacity-60" : ""}
                />
              </div>
              <div>
                <FieldLabel htmlFor="relationship_to_owner">Relationship to Owner</FieldLabel>
                <Select
                  value={formData.relationship_to_owner}
                  onValueChange={(v) => {
                    setFormData((p) => ({ ...p, relationship_to_owner: v }));
                    setErrors((prev) => ({ ...prev, relationship_to_owner: "" }));
                  }}
                  disabled={isFieldDisabled("relationship_to_owner")}
                >
                  <SelectTrigger {...ST}>
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
        );

      case 3:
        return (
          <div className="space-y-6">
            <SectionDivider title="Certificate Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="period_of_residency" required>Period of Residency</FieldLabel>
                <FieldInput
                  id="period_of_residency"
                  placeholder="e.g., 5 years"
                  value={formData.period_of_residency}
                  onChange={(e) => upd("period_of_residency", e.target.value)}
                  style={{ borderColor: errors.period_of_residency ? "#ef4444" : undefined }}
                  disabled={isFieldDisabled("period_of_residency")}
                  className={isFieldDisabled("period_of_residency") ? "cursor-not-allowed opacity-60" : ""}
                />
                {errors.period_of_residency && (
                  <p className="mt-1 text-xs text-red-500">{errors.period_of_residency}</p>
                )}
              </div>
              <div>
                <FieldLabel>Registered Voter</FieldLabel>
                <RadioGroup
                  value={formData.registered_voter}
                  onValueChange={(v) => upd("registered_voter", v)}
                  className="flex gap-6 mt-2.5"
                  disabled={false}
                >
                  {["Yes", "No"].map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`cert-voter-${opt}`} />
                      <label htmlFor={`cert-voter-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="purpose" required>Purpose</FieldLabel>
              <Select 
                value={formData.purpose} 
                onValueChange={(v) => upd("purpose", v)} 
                disabled={false}
              >
                <SelectTrigger {...ST} style={{ borderColor: errors.purpose ? "#ef4444" : undefined }}>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {["Residency", "Employment", "School", "Travel", "Legal", "Bank", "Other"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.purpose && <p className="mt-1 text-xs text-red-500">{errors.purpose}</p>}
            </div>

            <div>
              <FieldLabel htmlFor="purpose_details">Purpose Details</FieldLabel>
              <FieldTextarea
                id="purpose_details"
                rows={3}
                placeholder="Additional details about the purpose..."
                value={formData.purpose_details}
                onChange={(e) => upd("purpose_details", e.target.value)}
                disabled={false}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <ReviewHeader current={5} total={5} />
            <ReviewCard title="Personal Information">
              <ReviewRow
                label="Full Name"
                value={`${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.extension}`.trim()}
              />
              <ReviewRow label="Age" value={formData.age} />
              <ReviewRow label="Date of Birth" value={formData.dob} />
              <ReviewRow label="Place of Birth" value={formData.pob} />
            </ReviewCard>
            <ReviewCard title="Contact Information">
              <ReviewRow label="Contact No." value={formData.contact_no} />
              <ReviewRow label="Email" value={formData.email} />
            </ReviewCard>
            <ReviewCard title="Address">
              <ReviewRow label="House / Block / Lot" value={formData.house_block_lot_no} />
              <ReviewRow label="Street" value={formData.street} />
              <ReviewRow label="Zone / Purok" value={formData.zone} />
            </ReviewCard>
            <ReviewCard title="Certificate Details">
              <ReviewRow label="Purpose" value={formData.purpose} />
              <ReviewRow label="Period of Residency" value={formData.period_of_residency} />
              <ReviewRow label="Registered Voter" value={formData.registered_voter} />
            </ReviewCard>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Success Modal (Larger) ───────────────────────────────────────────────────────────
  if (successData) {
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
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}
        >
          {/* ── Modal Header (navy) ── */}
          <div
            className="relative overflow-hidden px-6 pt-8 pb-6 text-center"
            style={{ backgroundColor: NAVY }}
          >
            {/* Decorative circles */}
            <div
              className="absolute right-[-24px] bottom-[-24px] w-24 h-24 rounded-full opacity-10"
              style={{ backgroundColor: "white" }}
            />
            <div
              className="absolute left-[-16px] top-[-16px] w-16 h-16 rounded-full opacity-10"
              style={{ backgroundColor: "white" }}
            />

            {/* Check icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <CheckCircle className="h-8 w-8 text-white" />
            </div>

            <p className="text-white font-bold text-xl relative z-10 mb-1">
              Request Submitted!
            </p>
            <p className="text-sm relative z-10" style={{ color: "rgba(255,255,255,0.65)" }}>
              Barangay Certificate
            </p>
          </div>

          {/* ── Modal Body ── */}
          <div className="px-6 py-6">
            {/* Reference number */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
              style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}
            >
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: "#9ca3af" }}
                >
                  Reference Number
                </p>
                <p className="text-lg font-black font-mono" style={{ color: NAVY }}>
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
                style={{
                  backgroundColor: "#f3f4f6",
                  color: copied ? "#16a34a" : "#9ca3af",
                }}
                title="Copy reference number"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>

            <p
              className="text-sm text-center mb-6 leading-relaxed"
              style={{ color: "#6b7280" }}
            >
              Your request is being reviewed by the barangay office. You'll be notified
              once it's processed.
            </p>

            {/* Primary CTA — go to request detail */}
            <button
              onClick={() => navigate(`/request/barangay_certificate/${successData.id}`)}
              className="w-full py-3 text-sm font-bold text-white rounded-lg mb-3 transition-opacity hover:opacity-90"
              style={{ backgroundColor: NAVY }}
            >
              View My Request
            </button>

            {/* Secondary CTA — back to list */}
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
  }

  // ── Main Form ───────────────────────────────────────────────────────────────
  return (
    <FormCard title="Barangay Certificate" subtitle="Online Application">
      <FormProgress
        currentStep={currentStep}
        totalSteps={stepLabels.length}
        stepLabels={stepLabels}
      />
      <div className="mt-6">{renderStep()}</div>
      <FormNavigation
        currentStep={currentStep}
        totalSteps={stepLabels.length}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </FormCard>
  );
};

export default BarangayCertificateForm;