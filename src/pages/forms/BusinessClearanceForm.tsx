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

interface BusinessClearanceFormProps { onBack: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }

const stepLabels = ["Owner Info", "Business Info", "Address", "Review"];

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
  if (!dob) return "";
  const date = new Date(dob);
  if (isNaN(date.getTime())) return "Invalid date.";
  if (date > today()) return "Date of birth cannot be a future date.";
  if (date > maxDob()) return `You must be at least ${MIN_AGE} years old to apply for a Business Clearance.`;
  return "";
};

const toInputMax = (d: Date) => d.toISOString().split("T")[0];

// ─────────────────────────────────────────────────────────────────────────────

const BusinessClearanceForm = ({ onBack }: BusinessClearanceFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [dobError, setDobError] = useState("");
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
    requester_type: "ONLINE",
    prefix: "",
    surname: "",
    first_name: "",
    middle_name: "",
    ext_name: "",
    dob: "",

    business_name: "",
    business_type: "",
    business_details: "",
    capital: "",

    house_block_lot_no: "",
    street: "",
    zone: "",

    brgy_business_no: "",
    issued_date: "",
    or_no: "",

    inspected_by: "",
    date_of_inspection: "",

    inspection_remarks: "",
    inspected_remarks: "",
    date_inspected: "",
    inspected_note: "",
  });

  const upd = (f: string, v: string) => setFormData((p) => ({ ...p, [f]: v }));

  const handleDobChange = (val: string) => {
    upd("dob", val);
    setDobError(validateDob(val));
  };

  const handleNext = () => {
    if (currentStep === 0 && formData.dob && dobError) return;
    if (currentStep < stepLabels.length - 1) setCurrentStep(currentStep + 1);
  };
  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); else onBack(); };

  const handleSubmit = async () => {
    const err = validateDob(formData.dob);
    if (err) { setDobError(err); toast({ title: "Validation Error", description: err, variant: "destructive" }); return; }

    setIsSubmitting(true);
    const payload = {
      requester_type: formData.requester_type, prefix: formData.prefix,
      surname: formData.surname, first_name: formData.first_name,
      middle_name: formData.middle_name, ext: formData.ext_name,
      dob: formData.dob,
      business_name: formData.business_name, business_type: formData.business_type,
      business_details: formData.business_details,
      capital: formData.capital ? Number(formData.capital) : null,
      house_block_lot_no: formData.house_block_lot_no, street: formData.street, zone: formData.zone,
      brgy_business_no: formData.brgy_business_no, issued_date: formData.issued_date,
      or_no: formData.or_no, inspected_by: formData.inspected_by,
      date_of_inspection: formData.date_of_inspection,
      inspection_remarks: formData.inspection_remarks,
      inspected_remarks: formData.inspected_remarks,
      date_inspected: formData.date_inspected, inspected_note: formData.inspected_note,
    };
    try {
      const res = await api.post("/business-clearances", payload, { withCredentials: true });
      if (res.status === 200 || res.status === 201) {
        toast({ title: "Request Submitted", description: "Your business clearance request has been submitted successfully." });
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
          surname: user.surname || "",
          first_name: user.first_name || "",
          middle_name: user.middle_name || "",
          ext_name: user.extension_name || "",
          dob: user.dob || user.date_of_birth || "",
          house_block_lot_no: user.house_block_lot_no || "",
          street: user.street || "",
          zone: user.zone_purok || "",
        }));
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
      }
    };
    loadUser();
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      // ── Step 0: Owner Info ──────────────────────────────────────────────────
      case 0: return (
        <div className="space-y-6">
          <SectionDivider title="Business Owner Information" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="prefix">Prefix</FieldLabel>
              <Select value={formData.prefix} onValueChange={(v) => upd("prefix", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Mr.","Mrs.","Ms.","Dr."].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="surname" required>Surname</FieldLabel>
              <FieldInput id="surname" value={formData.surname} onChange={(e) => upd("surname", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="first_name" required>First Name</FieldLabel>
              <FieldInput id="first_name" value={formData.first_name} onChange={(e) => upd("first_name", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="middle_name">Middle Name</FieldLabel>
              <FieldInput id="middle_name" value={formData.middle_name} onChange={(e) => upd("middle_name", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="ext">Extension</FieldLabel>
              <FieldInput id="ext" placeholder="Jr., Sr., III" value={formData.ext_name} onChange={(e) => upd("ext_name", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="dob" required>Date of Birth</FieldLabel>
              <FieldInput
                id="dob"
                type="date"
                value={formData.dob}
                max={toInputMax(maxDob())}
                onChange={(e) => handleDobChange(e.target.value)}
                style={{ borderColor: dobError ? "#ef4444" : undefined }}
              />
              {dobError && (
                <p className="mt-1 text-xs text-red-500">{dobError}</p>
              )}
            </div>
          </div>
        </div>
      );

      // ── Step 1: Business Info ───────────────────────────────────────────────
      case 1: return (
        <div className="space-y-6">
          <SectionDivider title="Business Information" />
          <div>
            <FieldLabel htmlFor="businessName" required>Business Name</FieldLabel>
            <FieldInput id="businessName" value={formData.business_name} onChange={(e) => upd("business_name", e.target.value)} />
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
            <FieldTextarea id="businessDetails" rows={3} placeholder="Describe your business activities..." value={formData.business_details} onChange={(e) => upd("business_details", e.target.value)} />
          </div>
          <div className="max-w-sm">
            <FieldLabel htmlFor="capital" required>Capital (PHP)</FieldLabel>
            <FieldInput id="capital" type="number" placeholder="0.00" value={formData.capital} onChange={(e) => upd("capital", e.target.value)} />
          </div>
        </div>
      );

      // ── Step 2: Address ─────────────────────────────────────────────────────
      case 2: return (
        <div className="space-y-6">
          <SectionDivider title="Business Address" />
          <div>
            <FieldLabel htmlFor="houseBlockLotNo" required>House / Block / Lot No.</FieldLabel>
            <FieldInput id="houseBlockLotNo" value={formData.house_block_lot_no} onChange={(e) => upd("house_block_lot_no", e.target.value)} />
          </div>

          <div>
            <FieldLabel htmlFor="street" required>Street</FieldLabel>
            {streets.length > 0 ? (
              <Select value={formData.street} onValueChange={(v) => upd("street", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select street" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {streets.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}{s.formerly ? ` (formerly ${s.formerly})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <FieldInput id="street" value={formData.street} onChange={(e) => upd("street", e.target.value)} placeholder="Enter street name" />
            )}
          </div>

          <div>
            <FieldLabel htmlFor="zone" required>Zone / Purok</FieldLabel>
            {uniqueZones.length > 0 ? (
              <Select value={formData.zone} onValueChange={(v) => upd("zone", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select zone" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {uniqueZones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <FieldInput id="zone" value={formData.zone} onChange={(e) => upd("zone", e.target.value)} placeholder="Enter zone / purok" />
            )}
          </div>
        </div>
      );

      // ── Step 3: Review ──────────────────────────────────────────────────────
      case 3: return (
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

  return (
    <FormCard title="Business Clearance" subtitle="Online Application">
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

export default BusinessClearanceForm;