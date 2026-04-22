import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import FormProgress from "./FormProgress";
import FormNavigation from "./FormNavigation";
import { useToast } from "@/hooks/use-toast";
import api from "@/components/services/clearanceApi";
import { CheckCircle, Copy, Check } from "lucide-react";
import {
  NAVY, PINK,
  FieldLabel, FieldInput, FieldTextarea,
  SectionDivider, ReviewRow, ReviewCard, ReviewHeader, FormCard,
} from "./LguFormPrimitives";
import { PrefixCombobox } from "./PrefixCombobox";
import { toUpperCase, PREFIX_OPTIONS } from "./formUtils";

interface BusinessClearanceFormProps { onBack: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }

const stepLabels = ["Owner Info", "Business Info", "Address", "Review"];

const ST = {
  className: "border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 text-sm px-0 h-9 bg-transparent shadow-none",
  style: { borderBottomWidth: 1, borderColor: "#d1d5db" } as React.CSSProperties,
};

const MIN_AGE = 18;
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const maxDob = () => { const d = today(); d.setFullYear(d.getFullYear() - MIN_AGE); return d; };
const toInputMax = (d: Date) => d.toISOString().split("T")[0];

const validateDob = (dob: string) => {
  if (!dob) return "Date of birth is required.";
  const date = new Date(dob);
  if (isNaN(date.getTime())) return "Invalid date.";
  if (date > today()) return "Date of birth cannot be a future date.";
  if (date > maxDob()) return `You must be at least ${MIN_AGE} years old to apply for a Business Clearance.`;
  return "";
};
const validateName = (name: string, fieldName: string) => {
  if (!name?.trim()) return `${fieldName} is required.`;
  if (!/^[A-Za-z\s\-']+$/.test(name)) return `${fieldName} must contain only letters.`;
  if (name.trim().length === 1) return `${fieldName} must be at least 2 characters.`;
  return "";
};
const validateRequired = (value: string, fieldName: string) =>
  (!value?.trim()) ? `${fieldName} is required.` : "";
const validateBusinessDetails = (value: string) => {
  if (!value?.trim()) return "Business details are required.";
  if (value.trim().length < 10) return "Please provide more details (at least 10 characters).";
  return "";
};
const validateCapital = (value: string) => {
  if (!value?.trim()) return "Capital amount is required.";
  const num = parseFloat(value);
  if (isNaN(num)) return "Please enter a valid number.";
  if (num < 0) return "Capital cannot be negative.";
  return "";
};
const parseAddress = (address: string) => {
  if (!address) return { house_block_lot_no: "", street: "", zone: "" };
  const parts = address.split(",").map((p) => p.trim());
  return { house_block_lot_no: parts[0] || "", street: parts[1] || "", zone: parts[2] || "" };
};

const BusinessClearanceForm = ({ onBack }: BusinessClearanceFormProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [dobError, setDobError] = useState("");
  const [successData, setSuccessData] = useState<{ id: number; refNo: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);

  const [errors, setErrors] = useState({
    surname: "", first_name: "", dob: "",
    business_name: "", business_details: "", capital: "",
    house_block_lot_no: "", street: "", zone: "",
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

  const uniqueZones = Array.from(new Set(streets.map((s) => s.sitio).filter(Boolean)));

  const [formData, setFormData] = useState({
    requester_type: "ONLINE",
    prefix: "", surname: "", first_name: "", middle_name: "", ext_name: "",
    dob: "",
    business_name: "", business_type: "", business_details: "", capital: "",
    house_block_lot_no: "", street: "", zone: "",
    brgy_business_no: "", issued_date: "", or_no: "",
    inspected_by: "", date_of_inspection: "", inspection_remarks: "",
    inspected_remarks: "", date_inspected: "", inspected_note: "",
  });

  const upd = (f: string, v: string) => {
    const textFields = [
      "surname","first_name","middle_name","ext_name","business_name",
      "business_details","house_block_lot_no","brgy_business_no","or_no",
      "inspected_by","inspection_remarks","inspected_remarks","inspected_note",
    ];
    const value = textFields.includes(f) ? toUpperCase(v) : v;
    setFormData((p) => ({ ...p, [f]: value }));
    if (errors[f as keyof typeof errors]) setErrors((prev) => ({ ...prev, [f]: "" }));
  };

  const handleDobChange = (val: string) => {
    upd("dob", val);
    const err = validateDob(val);
    setDobError(err);
    setErrors((prev) => ({ ...prev, dob: err }));
  };

  // ── Auto-fill from authenticated user ────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/details", { withCredentials: true });
        const user = res.data.data;
        const filledFields: string[] = [];

        const normalizedDob = user.date_of_birth
          ? user.date_of_birth.split("T")[0]
          : (user.dob ? user.dob.split("T")[0] : "");

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
          dob: normalizedDob,
          house_block_lot_no: toUpperCase(addressParts.house_block_lot_no),
          street: matchedStreet,
          zone: toUpperCase(addressParts.zone),
        };

        Object.entries(newData).forEach(([key, value]) => {
          if (value && value !== "") filledFields.push(key);
        });

        setFormData((prev) => ({ ...prev, ...newData }));
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

  const validateCurrentStep = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };
    switch (currentStep) {
      case 0: {
        newErrors.surname = validateName(formData.surname, "Surname");
        newErrors.first_name = validateName(formData.first_name, "First name");
        newErrors.dob = validateDob(formData.dob);
        setDobError(newErrors.dob);
        if (newErrors.surname || newErrors.first_name || newErrors.dob) isValid = false;
        break;
      }
      case 1: {
        newErrors.business_name = validateRequired(formData.business_name, "Business name");
        newErrors.business_details = validateBusinessDetails(formData.business_details);
        newErrors.capital = validateCapital(formData.capital);
        if (newErrors.business_name || newErrors.business_details || newErrors.capital) isValid = false;
        break;
      }
      case 2: {
        newErrors.house_block_lot_no = validateRequired(formData.house_block_lot_no, "House/Block/Lot number");
        newErrors.street = validateRequired(formData.street, "Street");
        newErrors.zone = validateRequired(formData.zone, "Zone/Purok");
        if (newErrors.house_block_lot_no || newErrors.street || newErrors.zone) isValid = false;
        break;
      }
    }
    setErrors(newErrors);
    if (!isValid) toast({ title: "Validation Error", description: "Please fix the errors before proceeding.", variant: "destructive" });
    return isValid;
  };

  const handleNext = () => { if (validateCurrentStep() && currentStep < stepLabels.length - 1) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); else onBack(); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      requester_type: formData.requester_type, prefix: formData.prefix,
      surname: formData.surname, first_name: formData.first_name,
      middle_name: formData.middle_name, ext: formData.ext_name,
      dob: formData.dob, business_name: formData.business_name,
      business_type: formData.business_type, business_details: formData.business_details,
      capital: formData.capital ? Number(formData.capital) : null,
      house_block_lot_no: formData.house_block_lot_no, street: formData.street, zone: formData.zone,
      brgy_business_no: formData.brgy_business_no, issued_date: formData.issued_date,
      or_no: formData.or_no, inspected_by: formData.inspected_by,
      date_of_inspection: formData.date_of_inspection, inspection_remarks: formData.inspection_remarks,
      inspected_remarks: formData.inspected_remarks, date_inspected: formData.date_inspected,
      inspected_note: formData.inspected_note,
    };
    try {
      const res = await api.post("/business-clearances", payload, { withCredentials: true });
      if (res.status === 200 || res.status === 201) {
        const newId = res.data?.data?.service?.id ?? res.data?.data?.id ?? res.data?.id;
        setSuccessData({ id: newId, refNo: `REF-${String(newId).padStart(4, "0")}` });
      }
    } catch (error: any) {
      toast({
        title: error.response?.status === 422 ? "Validation Error" : "Error",
        description: error.response?.status === 422
          ? "Please check required fields and try again."
          : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally { setIsSubmitting(false); }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <SectionDivider title="Business Owner Information" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="prefix">Prefix</FieldLabel>
                <PrefixCombobox options={PREFIX_OPTIONS} value={formData.prefix} onChange={(v) => upd("prefix", v)} placeholder="Select prefix" disabled={isFieldDisabled("prefix")} />
              </div>
              <div>
                <FieldLabel htmlFor="surname" required>Surname</FieldLabel>
                <FieldInput id="surname" value={formData.surname} onChange={(e) => upd("surname", e.target.value)} style={{ borderColor: errors.surname ? "#ef4444" : undefined }} disabled={isFieldDisabled("surname")} className={isFieldDisabled("surname") ? "cursor-not-allowed opacity-60" : ""} />
                {errors.surname && <p className="mt-1 text-xs text-red-500">{errors.surname}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="first_name" required>First Name</FieldLabel>
                <FieldInput id="first_name" value={formData.first_name} onChange={(e) => upd("first_name", e.target.value)} style={{ borderColor: errors.first_name ? "#ef4444" : undefined }} disabled={isFieldDisabled("first_name")} className={isFieldDisabled("first_name") ? "cursor-not-allowed opacity-60" : ""} />
                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="middle_name">Middle Name</FieldLabel>
                <FieldInput id="middle_name" value={formData.middle_name} onChange={(e) => upd("middle_name", e.target.value)} disabled={isFieldDisabled("middle_name")} className={isFieldDisabled("middle_name") ? "cursor-not-allowed opacity-60" : ""} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <FieldLabel htmlFor="ext">Extension</FieldLabel>
                <FieldInput id="ext" placeholder="Jr., Sr., III" value={formData.ext_name} onChange={(e) => upd("ext_name", e.target.value)} disabled={isFieldDisabled("ext_name")} className={isFieldDisabled("ext_name") ? "cursor-not-allowed opacity-60" : ""} />
              </div>
              <div>
                <FieldLabel htmlFor="dob" required>Date of Birth</FieldLabel>
                <FieldInput id="dob" type="date" value={formData.dob} max={toInputMax(maxDob())} onChange={(e) => handleDobChange(e.target.value)} style={{ borderColor: errors.dob ? "#ef4444" : undefined }} />
                {errors.dob && <p className="mt-1 text-xs text-red-500">{errors.dob}</p>}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <SectionDivider title="Business Information" />
            <div>
              <FieldLabel htmlFor="businessName" required>Business Name</FieldLabel>
              <FieldInput id="businessName" value={formData.business_name} onChange={(e) => upd("business_name", e.target.value)} style={{ borderColor: errors.business_name ? "#ef4444" : undefined }} />
              {errors.business_name && <p className="mt-1 text-xs text-red-500">{errors.business_name}</p>}
            </div>
            <div>
              <FieldLabel htmlFor="businessType" required>Business Type</FieldLabel>
              <Select value={formData.business_type} onValueChange={(v) => upd("business_type", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select business type" /></SelectTrigger>
                <SelectContent>
                  {["Retail","Food & Beverage","Services","Manufacturing","Construction","Transportation","Other"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="businessDetails" required>Business Details</FieldLabel>
              <FieldTextarea id="businessDetails" rows={3} placeholder="Describe your business activities..." value={formData.business_details} onChange={(e) => upd("business_details", e.target.value)} style={{ borderColor: errors.business_details ? "#ef4444" : undefined }} />
              {errors.business_details && <p className="mt-1 text-xs text-red-500">{errors.business_details}</p>}
            </div>
            <div className="max-w-sm">
              <FieldLabel htmlFor="capital" required>Capital (PHP)</FieldLabel>
              <FieldInput id="capital" type="number" placeholder="0.00" value={formData.capital} onChange={(e) => upd("capital", e.target.value)} style={{ borderColor: errors.capital ? "#ef4444" : undefined }} />
              {errors.capital && <p className="mt-1 text-xs text-red-500">{errors.capital}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <SectionDivider title="Business Address" />
            <div>
              <FieldLabel htmlFor="houseBlockLotNo" required>House / Block / Lot No.</FieldLabel>
              <FieldInput id="houseBlockLotNo" value={formData.house_block_lot_no} onChange={(e) => upd("house_block_lot_no", e.target.value)} style={{ borderColor: errors.house_block_lot_no ? "#ef4444" : undefined }} disabled={isFieldDisabled("house_block_lot_no")} className={isFieldDisabled("house_block_lot_no") ? "cursor-not-allowed opacity-60" : ""} />
              {errors.house_block_lot_no && <p className="mt-1 text-xs text-red-500">{errors.house_block_lot_no}</p>}
            </div>
            <div>
              <FieldLabel htmlFor="street" required>Street</FieldLabel>
              {streets.length > 0 ? (
                <div className="relative">
                  <Select value={formData.street} onValueChange={(v) => { setFormData((p) => ({ ...p, street: toUpperCase(v) })); setErrors((prev) => ({ ...prev, street: "" })); }}>
                    <SelectTrigger {...ST} style={{ borderColor: errors.street ? "#ef4444" : undefined }}><SelectValue placeholder="Select street" /></SelectTrigger>
                    <SelectContent className="max-h-60 z-50">
                      {streets.map((s) => (
                        <SelectItem key={s.id} value={toUpperCase(s.name)}>{s.name}{s.formerly ? ` (formerly ${s.formerly})` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.street && <p className="mt-1 text-xs text-red-500">{errors.street}</p>}
                </div>
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
                <div className="relative">
                  <Select value={formData.zone} onValueChange={(v) => { setFormData((p) => ({ ...p, zone: toUpperCase(v) })); setErrors((prev) => ({ ...prev, zone: "" })); }}>
                    <SelectTrigger {...ST} style={{ borderColor: errors.zone ? "#ef4444" : undefined }}><SelectValue placeholder="Select zone" /></SelectTrigger>
                    <SelectContent className="max-h-60 z-50">
                      {uniqueZones.map((z) => (<SelectItem key={z} value={toUpperCase(z)}>{z}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {errors.zone && <p className="mt-1 text-xs text-red-500">{errors.zone}</p>}
                </div>
              ) : (
                <>
                  <FieldInput id="zone" value={formData.zone} onChange={(e) => upd("zone", e.target.value)} placeholder="Enter zone / purok" style={{ borderColor: errors.zone ? "#ef4444" : undefined }} />
                  {errors.zone && <p className="mt-1 text-xs text-red-500">{errors.zone}</p>}
                </>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <ReviewHeader current={5} total={5} />
            <ReviewCard title="Owner Information">
              <ReviewRow label="Full Name" value={`${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.ext_name}`.trim()} />
              <ReviewRow label="Date of Birth" value={formData.dob} />
            </ReviewCard>
            <ReviewCard title="Business Information">
              <ReviewRow label="Business Name" value={formData.business_name} />
              <ReviewRow label="Business Type" value={formData.business_type} />
              <ReviewRow label="Capital" value={formData.capital ? `₱${formData.capital}` : ""} />
              <ReviewRow label="Details" value={formData.business_details} />
            </ReviewCard>
            <ReviewCard title="Business Address">
              <ReviewRow label="House / Block / Lot" value={formData.house_block_lot_no} />
              <ReviewRow label="Street" value={formData.street} />
              <ReviewRow label="Zone / Purok" value={formData.zone} />
            </ReviewCard>
          </div>
        );

      default: return null;
    }
  };

  if (successData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
        <div className="w-full sm:max-w-lg md:max-w-xl overflow-hidden" style={{ borderRadius: "20px", backgroundColor: "white", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
          <div className="relative overflow-hidden px-6 pt-8 pb-6 text-center" style={{ backgroundColor: NAVY }}>
            <div className="absolute right-[-24px] bottom-[-24px] w-24 h-24 rounded-full opacity-10 bg-white" />
            <div className="absolute left-[-16px] top-[-16px] w-16 h-16 rounded-full opacity-10 bg-white" />
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <p className="text-white font-bold text-xl relative z-10 mb-1">Request Submitted!</p>
            <p className="text-sm relative z-10" style={{ color: "rgba(255,255,255,0.65)" }}>Business Clearance</p>
          </div>
          <div className="px-6 py-6">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af" }}>Reference Number</p>
                <p className="text-lg font-black font-mono" style={{ color: NAVY }}>{successData.refNo}</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(successData.refNo); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: "#f3f4f6", color: copied ? "#16a34a" : "#9ca3af" }}>
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: "#6b7280" }}>Your business clearance request is being reviewed by the barangay office.</p>
            <button onClick={() => navigate(`/request/business_clearance/${successData.id}`)} className="w-full py-3 text-sm font-bold text-white rounded-lg mb-3" style={{ backgroundColor: NAVY }}>View My Request</button>
            <button onClick={onBack} className="w-full py-3 text-sm font-semibold rounded-lg" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>Back to Requests</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormCard title="Business Clearance" subtitle="Online Application">
      <FormProgress currentStep={currentStep} totalSteps={stepLabels.length} stepLabels={stepLabels} />
      <div className="mt-6">{renderStep()}</div>
      <FormNavigation currentStep={currentStep} totalSteps={stepLabels.length} onBack={handleBack} onNext={handleNext} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </FormCard>
  );
};

export default BusinessClearanceForm;