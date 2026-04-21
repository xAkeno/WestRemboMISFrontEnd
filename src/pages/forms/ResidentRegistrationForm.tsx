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
import { UserCircle2, CheckCircle, Copy, Check } from "lucide-react";
import {
  NAVY, PINK,
  FieldLabel, FieldInput, FieldTextarea,
  SectionDivider, ReviewRow, ReviewCard, ReviewHeader, FormCard,
} from "./LguFormPrimitives";
import { PrefixCombobox } from "./PrefixCombobox";
import { toUpperCase, PREFIX_OPTIONS } from "./formUtils";

interface ResidentRegistrationFormProps { onBack: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }

const stepLabels = ["Personal Info", "Contact", "Address", "Residency", "Review"];

const ST = {
  className: "border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 text-sm px-0 h-9 bg-transparent shadow-none",
  style: { borderBottomWidth: 1, borderColor: "#d1d5db" } as React.CSSProperties,
};

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
  if (!/^09\d{9}$/.test(cleanContact)) return "Phone number must start with '09' and contain 11 digits.";
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

// ── Address parser helper (same as Certificate/Clearance) ────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────

const ResidentRegistrationForm = ({ onBack }: ResidentRegistrationFormProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [residentImage, setResidentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ id: number; refNo: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [errors, setErrors] = useState({
    surname: "",
    first_name: "",
    sex: "",
    marital_status: "",
    dob: "",
    pob: "",
    religion: "",
    height_cm: "",
    weight_kg: "",
    blood_type: "",
    complexion: "",
    phone_number: "",
    email_address: "",
    house_block_lot_no: "",
    street: "",
    zone: "",
    resident_status: "",
    period_of_residency: "",
    voter_status: "",
    emp_status: "",
    pwd: "",
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
    period_of_residency: "",
    notes: "",
  });

  const upd = (f: string, v: string | number) => {
    const textFields = [
      "surname", "first_name", "middle_name", "ext_name", "nick_name",
      "pob", "religion", "house_block_lot_no", "street", "zone",
      "house_owner", "relationship_to_owner", "occupation", "position",
      "period_of_residency", "notes", "precinct_no",
    ];
    const value = typeof v === "string" && textFields.includes(f)
      ? toUpperCase(v)
      : v;
    setFormData((p) => ({ ...p, [f]: value }));
    if (errors[f as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [f]: "" }));
    }
  };

  const validateCurrentStep = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    switch (currentStep) {
      case 0:
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
        if (Object.values(newErrors).some((error) => error)) isValid = false;
        break;
      case 1:
        newErrors.phone_number = validateContact(formData.phone_number);
        newErrors.email_address = validateEmail(formData.email_address);
        if (newErrors.phone_number || newErrors.email_address) isValid = false;
        break;
      case 2:
        newErrors.house_block_lot_no = validateRequired(formData.house_block_lot_no, "House/Block/Lot number");
        newErrors.street = validateRequired(formData.street, "Street");
        newErrors.zone = validateRequired(formData.zone, "Zone/Purok");
        if (newErrors.house_block_lot_no || newErrors.street || newErrors.zone) isValid = false;
        break;
      case 3:
        newErrors.resident_status = validateRequired(formData.resident_status, "Resident status");
        newErrors.period_of_residency = validatePeriodOfResidency(formData.period_of_residency);
        newErrors.voter_status = validateRequired(formData.voter_status, "Voter status");
        newErrors.emp_status = validateRequired(formData.emp_status, "Employment status");
        newErrors.pwd = validateRequired(formData.pwd, "PWD status");
        if (
          newErrors.resident_status || newErrors.period_of_residency ||
          newErrors.voter_status || newErrors.emp_status || newErrors.pwd
        ) isValid = false;
        break;
    }

    setErrors(newErrors);
    if (!isValid) {
      toast({ title: "Validation Error", description: "Please fix the errors before proceeding.", variant: "destructive" });
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
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => payload.append(k, String(v)));
      if (residentImage) payload.append("photo", residentImage);

      const res = await axios.post("http://127.0.0.1:8000/api/residents", payload, { withCredentials: true });
      if (res.status === 201 || res.status === 200) {
        const newId = res.data?.data?.service?.id ?? res.data?.data?.id ?? res.data?.id;
        setSuccessData({
          id: newId,
          refNo: `REF-${String(newId).padStart(4, "0")}`,
        });
      }
    } catch {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Auto-fill from authenticated user — depends on [streets] so that
  //    street-matching runs AFTER the streets list has loaded. ────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/details", { withCredentials: true });
        const user = res.data.data;

        // Normalize date
        const normalizedDob = user.date_of_birth
          ? user.date_of_birth.split("T")[0]
          : (user.dob ? user.dob.split("T")[0] : "");

        // Parse address from user.address string
        const addressParts = parseAddress(user.address || "");

        // Match street with available options and NORMALIZE to UPPERCASE
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

        // Normalize zone to UPPERCASE
        const normalizedZone = toUpperCase(addressParts.zone);

        setFormData((prev) => ({
          ...prev,
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
          pob: toUpperCase(user.place_of_birth ?? user.pob ?? ""),
          height_cm: user.height_cm ?? 0,
          weight_kg: user.weight_kg ?? 0,
          blood_type: user.blood_type ?? "",
          complexion: user.complexion ?? "",
          religion: toUpperCase(user.religion ?? ""),
          phone_number: user.contact_number ?? user.phone_number ?? "",
          email_address: user.email ?? user.email_address ?? "",
          house_block_lot_no: toUpperCase(addressParts.house_block_lot_no),
          street: matchedStreet,
          zone: normalizedZone,
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
        }));

        if (user.photo_url) setImagePreview(user.photo_url);
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
      }
    };
    loadUser();
  }, [streets]); // ← depends on streets so street-matching works after streets load

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <SectionDivider title="Personal Information" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="prefix">Prefix</FieldLabel>
                <PrefixCombobox options={PREFIX_OPTIONS} value={formData.prefix} onChange={(v) => upd("prefix", v)} placeholder="Select prefix" />
              </div>
              <div>
                <FieldLabel htmlFor="surname" required>Surname</FieldLabel>
                <FieldInput id="surname" value={formData.surname} onChange={(e) => upd("surname", e.target.value)} style={{ borderColor: errors.surname ? "#ef4444" : undefined }} />
                {errors.surname && <p className="mt-1 text-xs text-red-500">{errors.surname}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="first_name" required>First Name</FieldLabel>
                <FieldInput id="first_name" value={formData.first_name} onChange={(e) => upd("first_name", e.target.value)} style={{ borderColor: errors.first_name ? "#ef4444" : undefined }} />
                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="middle_name">Middle Name</FieldLabel>
                <FieldInput id="middle_name" value={formData.middle_name} onChange={(e) => upd("middle_name", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="ext_name">Extension</FieldLabel>
                <FieldInput id="ext_name" placeholder="Jr., Sr." value={formData.ext_name} onChange={(e) => upd("ext_name", e.target.value)} />
              </div>
              <div>
                <FieldLabel htmlFor="nick_name">Nickname</FieldLabel>
                <FieldInput id="nick_name" value={formData.nick_name} onChange={(e) => upd("nick_name", e.target.value)} />
              </div>
              <div>
                <FieldLabel required>Sex</FieldLabel>
                <RadioGroup value={formData.sex} onValueChange={(v) => upd("sex", v)} className="flex gap-5 mt-2.5">
                  {["Male", "Female"].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <RadioGroupItem value={s} id={`sex-${s}`} />
                      <label htmlFor={`sex-${s}`} className="text-sm cursor-pointer">{s}</label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.sex && <p className="mt-1 text-xs text-red-500">{errors.sex}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="marital_status" required>Marital Status</FieldLabel>
                <Select value={formData.marital_status} onValueChange={(v) => upd("marital_status", v)}>
                  <SelectTrigger {...ST} style={{ borderColor: errors.marital_status ? "#ef4444" : undefined }}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="name_of_spouse">Name of Spouse</FieldLabel>
                <FieldInput id="name_of_spouse" value={formData.name_of_spouse} onChange={(e) => upd("name_of_spouse", e.target.value)} />
              </div>
              <div>
                <FieldLabel htmlFor="dob" required>Date of Birth</FieldLabel>
                <FieldInput
                  id="dob"
                  type="date"
                  value={formData.dob}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => upd("dob", e.target.value)}
                  style={{ borderColor: errors.dob ? "#ef4444" : undefined }}
                />
                {errors.dob && <p className="mt-1 text-xs text-red-500">{errors.dob}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="pob" required>Place of Birth</FieldLabel>
                <FieldInput id="pob" value={formData.pob} onChange={(e) => upd("pob", e.target.value)} style={{ borderColor: errors.pob ? "#ef4444" : undefined }} />
                {errors.pob && <p className="mt-1 text-xs text-red-500">{errors.pob}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="religion" required>Religion</FieldLabel>
                <FieldInput id="religion" value={formData.religion} onChange={(e) => upd("religion", e.target.value)} style={{ borderColor: errors.religion ? "#ef4444" : undefined }} />
                {errors.religion && <p className="mt-1 text-xs text-red-500">{errors.religion}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="height_cm" required>Height (cm)</FieldLabel>
                <FieldInput id="height_cm" type="number" value={formData.height_cm || ""} onChange={(e) => upd("height_cm", e.target.value)} style={{ borderColor: errors.height_cm ? "#ef4444" : undefined }} />
                {errors.height_cm && <p className="mt-1 text-xs text-red-500">{errors.height_cm}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="weight_kg" required>Weight (kg)</FieldLabel>
                <FieldInput id="weight_kg" type="number" value={formData.weight_kg || ""} onChange={(e) => upd("weight_kg", e.target.value)} style={{ borderColor: errors.weight_kg ? "#ef4444" : undefined }} />
                {errors.weight_kg && <p className="mt-1 text-xs text-red-500">{errors.weight_kg}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="blood_type" required>Blood Type</FieldLabel>
                <Select value={formData.blood_type} onValueChange={(v) => upd("blood_type", v)}>
                  <SelectTrigger {...ST} style={{ borderColor: errors.blood_type ? "#ef4444" : undefined }}>
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
              <div>
                <FieldLabel htmlFor="complexion" required>Complexion</FieldLabel>
                <Select value={formData.complexion} onValueChange={(v) => upd("complexion", v)}>
                  <SelectTrigger {...ST} style={{ borderColor: errors.complexion ? "#ef4444" : undefined }}>
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
        );

      case 1:
        return (
          <div className="space-y-6">
            <SectionDivider title="Contact Information" />
            <div className="max-w-sm">
              <FieldLabel htmlFor="phone_number" required>Phone Number</FieldLabel>
              <FieldInput id="phone_number" type="tel" placeholder="09XX XXX XXXX" value={formData.phone_number} onChange={(e) => upd("phone_number", e.target.value)} style={{ borderColor: errors.phone_number ? "#ef4444" : undefined }} />
              {errors.phone_number && <p className="mt-1 text-xs text-red-500">{errors.phone_number}</p>}
            </div>
            <div className="max-w-sm">
              <FieldLabel htmlFor="email_address" required>Email Address</FieldLabel>
              <FieldInput id="email_address" type="email" placeholder="your.email@example.com" value={formData.email_address} onChange={(e) => upd("email_address", e.target.value)} style={{ borderColor: errors.email_address ? "#ef4444" : undefined }} />
              {errors.email_address && <p className="mt-1 text-xs text-red-500">{errors.email_address}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <SectionDivider title="Address Information" />
            <div>
              <FieldLabel htmlFor="house_block_lot_no" required>House / Block / Lot No.</FieldLabel>
              <FieldInput id="house_block_lot_no" value={formData.house_block_lot_no} onChange={(e) => upd("house_block_lot_no", e.target.value)} style={{ borderColor: errors.house_block_lot_no ? "#ef4444" : undefined }} />
              {errors.house_block_lot_no && <p className="mt-1 text-xs text-red-500">{errors.house_block_lot_no}</p>}
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
                  <FieldInput id="street" value={formData.street} onChange={(e) => upd("street", e.target.value)} placeholder="Enter street name" style={{ borderColor: errors.street ? "#ef4444" : undefined }} />
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
                  >
                    <SelectTrigger {...ST} style={{ borderColor: errors.zone ? "#ef4444" : undefined }}>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {uniqueZones.map((z) => (
                        <SelectItem key={z} value={toUpperCase(z)}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.zone && <p className="mt-1 text-xs text-red-500">{errors.zone}</p>}
                </>
              ) : (
                <>
                  <FieldInput id="zone" value={formData.zone} onChange={(e) => upd("zone", e.target.value)} placeholder="Enter zone / purok" style={{ borderColor: errors.zone ? "#ef4444" : undefined }} />
                  {errors.zone && <p className="mt-1 text-xs text-red-500">{errors.zone}</p>}
                </>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="house_owner">House Owner</FieldLabel>
                <FieldInput id="house_owner" value={formData.house_owner} onChange={(e) => upd("house_owner", e.target.value)} />
              </div>
              <div>
                <FieldLabel htmlFor="relationship_to_owner">Relationship to Owner</FieldLabel>
                <Select
                  value={formData.relationship_to_owner}
                  onValueChange={(v) => {
                    setFormData((p) => ({ ...p, relationship_to_owner: v }));
                    setErrors((prev) => ({ ...prev, relationship_to_owner: "" }));
                  }}
                >
                  <SelectTrigger {...ST}><SelectValue placeholder="Select" /></SelectTrigger>
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
            <SectionDivider title="Residency Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="resident_status" required>Resident Status</FieldLabel>
                <Select value={formData.resident_status} onValueChange={(v) => upd("resident_status", v)}>
                  <SelectTrigger {...ST} style={{ borderColor: errors.resident_status ? "#ef4444" : undefined }}>
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
              <div>
                <FieldLabel htmlFor="period_of_residency" required>Period of Residency</FieldLabel>
                <FieldInput id="period_of_residency" placeholder="e.g., 5 years" value={formData.period_of_residency} onChange={(e) => upd("period_of_residency", e.target.value)} style={{ borderColor: errors.period_of_residency ? "#ef4444" : undefined }} />
                {errors.period_of_residency && <p className="mt-1 text-xs text-red-500">{errors.period_of_residency}</p>}
              </div>
            </div>
            <SectionDivider title="Voter & Employment Status" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <FieldLabel required>Voter Status</FieldLabel>
                <RadioGroup value={formData.voter_status} onValueChange={(v) => upd("voter_status", v)} className="flex gap-5 mt-2.5">
                  {["Registered", "Not Registered"].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <RadioGroupItem value={s} id={`voter-${s}`} />
                      <label htmlFor={`voter-${s}`} className="text-sm cursor-pointer">{s}</label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.voter_status && <p className="mt-1 text-xs text-red-500">{errors.voter_status}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="precinct_no">Precinct No.</FieldLabel>
                <FieldInput id="precinct_no" value={formData.precinct_no} onChange={(e) => upd("precinct_no", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="emp_status" required>Employment Status</FieldLabel>
                <Select value={formData.emp_status} onValueChange={(v) => upd("emp_status", v)}>
                  <SelectTrigger {...ST} style={{ borderColor: errors.emp_status ? "#ef4444" : undefined }}>
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
              <div>
                <FieldLabel htmlFor="occupation">Occupation</FieldLabel>
                <FieldInput id="occupation" value={formData.occupation} onChange={(e) => upd("occupation", e.target.value)} />
              </div>
              <div>
                <FieldLabel htmlFor="position">Position</FieldLabel>
                <FieldInput id="position" value={formData.position} onChange={(e) => upd("position", e.target.value)} />
              </div>
            </div>
            <div>
              <FieldLabel required>PWD Status</FieldLabel>
              <RadioGroup value={formData.pwd} onValueChange={(v) => upd("pwd", v)} className="flex gap-6 mt-2.5">
                {["Yes", "No"].map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`pwd-${opt}`} />
                    <label htmlFor={`pwd-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                  </div>
                ))}
              </RadioGroup>
              {errors.pwd && <p className="mt-1 text-xs text-red-500">{errors.pwd}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <ReviewHeader current={5} total={5} />
            {imagePreview && (
              <div
                className="flex items-center gap-4 p-4"
                style={{ backgroundColor: "#f8faff", borderRadius: 2, border: "1px solid #dde3ed" }}
              >
                <img src={imagePreview} alt="Resident" className="w-14 h-14 object-cover flex-shrink-0" style={{ borderRadius: 2, border: `2px solid ${PINK}` }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: PINK }}>Photo</p>
                  <p className="text-sm text-foreground">{residentImage?.name}</p>
                </div>
              </div>
            )}
            <ReviewCard title="Personal Information">
              <ReviewRow label="Full Name" value={`${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.ext_name}`.trim()} />
              <ReviewRow label="Sex" value={formData.sex} />
              <ReviewRow label="Date of Birth" value={formData.dob} />
              <ReviewRow label="Marital Status" value={formData.marital_status} />
              <ReviewRow label="Religion" value={formData.religion} />
            </ReviewCard>
            <ReviewCard title="Contact Information">
              <ReviewRow label="Phone" value={formData.phone_number} />
              <ReviewRow label="Email" value={formData.email_address} />
            </ReviewCard>
            <ReviewCard title="Address Information">
              <ReviewRow label="House / Block / Lot" value={formData.house_block_lot_no} />
              <ReviewRow label="Street" value={formData.street} />
              <ReviewRow label="Zone / Purok" value={formData.zone} />
              <ReviewRow label="House Owner" value={formData.house_owner} />
            </ReviewCard>
            <ReviewCard title="Residency & Status">
              <ReviewRow label="Resident Status" value={formData.resident_status} />
              <ReviewRow label="Voter Status" value={formData.voter_status} />
              <ReviewRow label="Employment" value={formData.emp_status} />
              <ReviewRow label="PWD" value={formData.pwd} />
            </ReviewCard>
            <div>
              <FieldLabel htmlFor="notes">Additional Notes</FieldLabel>
              <FieldTextarea id="notes" rows={3} placeholder="Any additional information..." value={formData.notes} onChange={(e) => upd("notes", e.target.value)} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Success Modal ─────────────────────────────────────────────────────────
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
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="relative overflow-hidden px-6 pt-8 pb-6 text-center"
            style={{ backgroundColor: NAVY }}
          >
            <div className="absolute right-[-24px] bottom-[-24px] w-24 h-24 rounded-full opacity-10 bg-white" />
            <div className="absolute left-[-16px] top-[-16px] w-16 h-16 rounded-full opacity-10 bg-white" />
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

          <div className="px-6 py-6">
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
              style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af" }}>
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
                style={{ backgroundColor: "#f3f4f6", color: copied ? "#16a34a" : "#9ca3af" }}
                title="Copy reference number"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>

            <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: "#6b7280" }}>
              Your resident registration is being reviewed by the barangay office.
              You'll be notified once it's processed.
            </p>

            <button
              onClick={() => navigate(`/request/resident_registration/${successData.id}`)}
              className="w-full py-3 text-sm font-bold text-white rounded-lg mb-3 transition-opacity hover:opacity-90"
              style={{ backgroundColor: NAVY }}
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
  }

  // ── Main Form ─────────────────────────────────────────────────────────────
  return (
    <FormCard title="Resident Registration" subtitle="Online Application">
      <FormProgress currentStep={currentStep} totalSteps={stepLabels.length} stepLabels={stepLabels} />
      <div className="mt-6">{renderStep()}</div>
      <FormNavigation
        currentStep={currentStep} totalSteps={stepLabels.length}
        onBack={handleBack} onNext={handleNext}
        onSubmit={handleSubmit} isSubmitting={isSubmitting}
      />
    </FormCard>
  );
};

export default ResidentRegistrationForm;