import { useState, useEffect } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import FormProgress from "./FormProgress";
import FormNavigation from "./FormNavigation";
import { useToast } from "@/hooks/use-toast";
import api from "@/components/services/clearanceApi";
import {
  NAVY, PINK,
  FieldLabel, FieldInput, FieldTextarea,
  SectionDivider, ReviewRow, ReviewCard, ReviewHeader, FormCard,
} from "./LguFormPrimitives";
import { PrefixCombobox } from "./PrefixCombobox";
import { toUpperCase, PREFIX_OPTIONS } from "./formUtils";

interface BuildingClearanceFormProps { onBack: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }

const stepLabels = ["Applicant Info", "Building Details", "Location", "Review"];

const ST = {
  className: "border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 text-sm px-0 h-9 bg-transparent shadow-none",
  style: { borderBottomWidth: 1, borderColor: "#d1d5db" } as React.CSSProperties,
};

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

const toInputMax = (d: Date) => d.toISOString().split("T")[0];

// ─────────────────────────────────────────────────────────────────────────────

const BuildingClearanceForm = ({ onBack }: BuildingClearanceFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [dobError, setDobError] = useState("");

  const [errors, setErrors] = useState({
    surname: "",
    first_name: "",
    middle_name: "",
    dob: "",
    establishment: "",
    purpose_details: "",
    house_block_lot_no: "",
    street: "",
    zone: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) { console.error("Failed to fetch streets:", e); }
    };
    load();
  }, []);

  const uniqueZones = Array.from(new Set(
    streets.map((s) => s.sitio).filter(Boolean)
  ));

  const [formData, setFormData] = useState({
    requester_type: "Online",
    prefix: "", surname: "", first_name: "", middle_name: "", ext_name: "",
    dob: "",
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
      "for_the_punong_barangay", "barangay_position",
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
  };

  const validateCurrentStep = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    switch (currentStep) {
      case 0: {
        const surnameError = validateName(formData.surname, "Surname");
        const firstNameError = validateName(formData.first_name, "First name");
        const dobValidationError = validateDob(formData.dob);
        newErrors.surname = surnameError;
        newErrors.first_name = firstNameError;
        newErrors.dob = dobValidationError;
        setDobError(dobValidationError);
        if (surnameError || firstNameError || dobValidationError) isValid = false;
        break;
      }
      case 1: {
        const establishmentError = validateRequired(formData.establishment, "Establishment/Project name");
        const purposeDetailsError = validatePurposeDetails(formData.purpose_details);
        newErrors.establishment = establishmentError;
        newErrors.purpose_details = purposeDetailsError;
        if (establishmentError || purposeDetailsError) isValid = false;
        break;
      }
      case 2: {
        const houseError = validateRequired(formData.house_block_lot_no, "House/Block/Lot number");
        const streetError = validateRequired(formData.street, "Street");
        const zoneError = validateRequired(formData.zone, "Zone/Purok");
        newErrors.house_block_lot_no = houseError;
        newErrors.street = streetError;
        newErrors.zone = zoneError;
        if (houseError || streetError || zoneError) isValid = false;
        break;
      }
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

  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); else onBack(); };

  const handleSubmit = async () => {
    const allStepsValid = [0, 1, 2].every(step => {
      setCurrentStep(step);
      return validateCurrentStep();
    });
    if (!allStepsValid) {
      setCurrentStep(0);
      toast({ title: "Validation Error", description: "Please complete all required fields correctly.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const payload = {
      requester_type: formData.requester_type, prefix: formData.prefix,
      surname: formData.surname, first_name: formData.first_name,
      middle_name: formData.middle_name, ext_name: formData.ext_name,
      dob: formData.dob,
      establishment: formData.establishment, house_block_lot_no: formData.house_block_lot_no,
      street: formData.street, zone: formData.zone,
      purpose: formData.purpose, purpose_details: formData.purpose_details,
      bcert_number: formData.bcert_number, issued_date: formData.issued_date,
      or_no: formData.or_no, remarks: formData.remarks,
      punong_barangay: formData.punong_barangay,
      for_the_punong_barangay: formData.for_the_punong_barangay,
      barangay_position: formData.barangay_position,
    };
    try {
      const res = await api.post("/building-clearances", payload, { withCredentials: true });
      if (res.status === 200 || res.status === 201) {
        toast({ title: "Request Submitted", description: "Your building clearance request has been submitted successfully." });
        onBack();
      }
    } catch (error: any) {
      toast({
        title: error.response?.status === 422 ? "Validation Error" : "Error",
        description: error.response?.status === 422 ? "Please check required fields and try again." : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/details", { withCredentials: true });
        const user = res.data.data;
        setFormData((prev) => ({
          ...prev,
          prefix: user.prefix || "",
          surname: toUpperCase(user.surname || ""),
          first_name: toUpperCase(user.first_name || ""),
          middle_name: toUpperCase(user.middle_name || ""),
          ext_name: toUpperCase(user.extension_name || ""),
          dob: user.dob || user.date_of_birth || "",
          house_block_lot_no: toUpperCase(user.house_block_lot_no || ""),
          // FIX: store as uppercase so it matches SelectItem value={toUpperCase(s.name / z)}
          street: toUpperCase(user.street || ""),
          zone: toUpperCase(user.zone_purok || ""),
        }));
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
      }
    };
    loadUser();
  }, []);

  const renderStep = () => {
    switch (currentStep) {

      // ── Step 0: Applicant Info ──────────────────────────────────────────────
      case 0: return (
        <div className="space-y-6">
          <SectionDivider title="Applicant Information" />
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
              <FieldLabel htmlFor="middle_name" required>Middle Name</FieldLabel>
              <FieldInput id="middle_name" value={formData.middle_name} onChange={(e) => upd("middle_name", e.target.value)} style={{ borderColor: errors.middle_name ? "#ef4444" : undefined }} />
              {errors.middle_name && <p className="mt-1 text-xs text-red-500">{errors.middle_name}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="ext_name">Extension</FieldLabel>
              <FieldInput id="ext_name" placeholder="Jr., Sr., III" value={formData.ext_name} onChange={(e) => upd("ext_name", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="dob" required>Date of Birth</FieldLabel>
              <FieldInput id="dob" type="date" value={formData.dob} max={toInputMax(maxDob())} onChange={(e) => handleDobChange(e.target.value)} style={{ borderColor: errors.dob ? "#ef4444" : undefined }} />
              {errors.dob && <p className="mt-1 text-xs text-red-500">{errors.dob}</p>}
            </div>
          </div>
        </div>
      );

      // ── Step 1: Building Details ────────────────────────────────────────────
      case 1: return (
        <div className="space-y-6">
          <SectionDivider title="Building Details" />
          <div>
            <FieldLabel htmlFor="establishment" required>Establishment / Project Name</FieldLabel>
            <FieldInput id="establishment" placeholder="e.g., Residential Building, Commercial Complex" value={formData.establishment} onChange={(e) => upd("establishment", e.target.value)} style={{ borderColor: errors.establishment ? "#ef4444" : undefined }} />
            {errors.establishment && <p className="mt-1 text-xs text-red-500">{errors.establishment}</p>}
          </div>
          <div>
            <FieldLabel htmlFor="purpose" required>Purpose</FieldLabel>
            <Select value={formData.purpose} onValueChange={(v) => upd("purpose", v)}>
              <SelectTrigger {...ST}><SelectValue placeholder="Select purpose" /></SelectTrigger>
              <SelectContent>
                {["New Construction", "Renovation", "Addition", "Demolition", "Fence", "Other"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="purposeDetails" required>Purpose Details</FieldLabel>
            <FieldTextarea id="purposeDetails" rows={4} placeholder="Describe the building / construction project in detail..." value={formData.purpose_details} onChange={(e) => upd("purpose_details", e.target.value)} style={{ borderColor: errors.purpose_details ? "#ef4444" : undefined }} />
            {errors.purpose_details && <p className="mt-1 text-xs text-red-500">{errors.purpose_details}</p>}
          </div>
        </div>
      );

      // ── Step 2: Location ────────────────────────────────────────────────────
      case 2: return (
        <div className="space-y-6">
          <SectionDivider title="Project Location" />
          <div>
            <FieldLabel htmlFor="houseBlockLot" required>House / Block / Lot No.</FieldLabel>
            <FieldInput id="houseBlockLot" value={formData.house_block_lot_no} onChange={(e) => upd("house_block_lot_no", e.target.value)} style={{ borderColor: errors.house_block_lot_no ? "#ef4444" : undefined }} />
            {errors.house_block_lot_no && <p className="mt-1 text-xs text-red-500">{errors.house_block_lot_no}</p>}
          </div>

          <div>
            <FieldLabel htmlFor="street" required>Street</FieldLabel>
            {streets.length > 0 ? (
              <>
                {/* FIX: value={toUpperCase(s.name)} matches stored formData.street (uppercase) */}
                <Select value={formData.street} onValueChange={(v) => {
                  setFormData((p) => ({ ...p, street: toUpperCase(v) }));
                  setErrors((prev) => ({ ...prev, street: "" }));
                }}>
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
                {/* FIX: value={toUpperCase(z)} matches stored formData.zone (uppercase) */}
                <Select value={formData.zone} onValueChange={(v) => {
                  setFormData((p) => ({ ...p, zone: toUpperCase(v) }));
                  setErrors((prev) => ({ ...prev, zone: "" }));
                }}>
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
        </div>
      );

      // ── Step 3: Review ──────────────────────────────────────────────────────
      case 3: return (
        <div className="space-y-5">
          <ReviewHeader current={5} total={5} />
          <ReviewCard title="Applicant Information">
            <ReviewRow label="Full Name" value={`${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.ext_name}`.trim()} />
            <ReviewRow label="Date of Birth" value={formData.dob} />
          </ReviewCard>
          <ReviewCard title="Building Details">
            <ReviewRow label="Establishment" value={formData.establishment} />
            <ReviewRow label="Purpose" value={formData.purpose} />
            <ReviewRow label="Details" value={formData.purpose_details} />
          </ReviewCard>
          <ReviewCard title="Location">
            <ReviewRow label="House / Block / Lot" value={formData.house_block_lot_no} />
            <ReviewRow label="Street" value={formData.street} />
            <ReviewRow label="Zone / Purok" value={formData.zone} />
          </ReviewCard>
        </div>
      );

      default: return null;
    }
  };

  return (
    <FormCard title="Building Clearance" subtitle="Online Application">
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

export default BuildingClearanceForm;