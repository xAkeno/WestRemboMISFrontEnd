import { useState, useEffect } from "react";
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

/** Returns an error string or "" if valid */
const validateDob = (dob: string): string => {
  if (!dob) return "";
  const date = new Date(dob);
  if (isNaN(date.getTime())) return "Invalid date.";
  if (date > today()) return "Date of birth cannot be a future date.";
  if (date > maxDob()) return `You must be at least ${MIN_AGE} years old.`;
  return "";
};

const toInputMax = (d: Date) => d.toISOString().split("T")[0];

// ─────────────────────────────────────────────────────────────────────────────

const BarangayCertificateForm = ({ onBack }: BarangayCertificateFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [dobError, setDobError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/streets", { withCredentials: true });
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

  const upd = (f: string, v: string) => setFormData((p) => ({ ...p, [f]: v }));

  const handleDobChange = (val: string) => {
    upd("dob", val);
    const err = validateDob(val);
    setDobError(err);

    // Auto-compute age if valid
    if (!err && val) {
      const age = today().getFullYear() - new Date(val).getFullYear();
      upd("age", String(age));
    }
  };

  const handleNext = () => {
    // Block step 0 advance if DOB has an error
    if (currentStep === 0 && formData.dob && dobError) return;
    if (currentStep < stepLabels.length - 1) setCurrentStep(currentStep + 1);
  };
  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); else onBack(); };

  const handleSubmit = async () => {
    const err = validateDob(formData.dob);
    if (err) { setDobError(err); toast({ title: "Validation Error", description: err, variant: "destructive" }); return; }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/barangay-certificates",
        { ...formData, age: formData.age ? Number(formData.age) : null },
        { withCredentials: true }
      );
      if (res.status === 201 || res.status === 200) {
        toast({ title: "Success", description: "Barangay certificate request submitted successfully." });
        onBack();
      }
    } catch (error: any) {
      toast({
        title: error.response?.status === 422 ? "Validation Error" : "Submission Error",
        description: error.response?.status === 422
          ? "Please check the form. Some fields are invalid."
          : "Something went wrong. Please try again.",
      });
    } finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/details", { withCredentials: true });
        const user = res.data.data;

        setFormData(prev => ({
          ...prev,
          prefix: user.prefix ?? "",
          first_name: user.first_name ?? "",
          middle_name: user.middle_name ?? "",
          surname: user.surname ?? "",
          extension: user.extension_name ?? "",
          dob: user.dob ?? "",
          pob: user.pob ?? "",
          age: user.dob ? String(today().getFullYear() - new Date(user.dob).getFullYear()) : "",
          contact_no: user.contact_number ?? "",
          email: user.email ?? "",
          house_block_lot_no: user.house_block_lot_no ?? "",
          street: user.street ?? "",
          zone: user.zone_purok ?? "",
          house_owner: user.house_owner ?? "",
          relationship_to_owner: user.relationship_to_owner ?? "",
          period_of_residency: user.period_of_residency ?? "",
          registered_voter: user.voter_status ? "Yes" : "No",
        }));
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
      }
    };
    loadUser();
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      // ── Step 0: Personal Info ───────────────────────────────────────────────
      case 0: return (
        <div className="space-y-6">
          <SectionDivider title="Personal Information" />

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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="extension">Extension</FieldLabel>
              <FieldInput id="extension" placeholder="Jr., Sr., III" value={formData.extension} onChange={(e) => upd("extension", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="age" required>Age</FieldLabel>
              <FieldInput id="age" type="number" value={formData.age} readOnly style={{ opacity: 0.6, cursor: "not-allowed" }} />
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
            <div>
              <FieldLabel htmlFor="pob" required>Place of Birth</FieldLabel>
              <FieldInput id="pob" value={formData.pob} onChange={(e) => upd("pob", e.target.value)} />
            </div>
          </div>
        </div>
      );

      // ── Step 1: Contact ─────────────────────────────────────────────────────
      case 1: return (
        <div className="space-y-6">
          <SectionDivider title="Contact Information" />
          <div className="max-w-sm">
            <FieldLabel htmlFor="contact_no" required>Contact Number</FieldLabel>
            <FieldInput id="contact_no" type="tel" placeholder="09XX XXX XXXX" value={formData.contact_no} onChange={(e) => upd("contact_no", e.target.value)} />
          </div>
          <div className="max-w-sm">
            <FieldLabel htmlFor="email" required>Email Address</FieldLabel>
            <FieldInput id="email" type="email" placeholder="example@domain.com" value={formData.email} onChange={(e) => upd("email", e.target.value)} />
          </div>
        </div>
      );

      // ── Step 2: Address ─────────────────────────────────────────────────────
      case 2: return (
        <div className="space-y-6">
          <SectionDivider title="Address Information" />
          <div>
            <FieldLabel htmlFor="house_block_lot_no" required>House / Block / Lot No.</FieldLabel>
            <FieldInput id="house_block_lot_no" value={formData.house_block_lot_no} onChange={(e) => upd("house_block_lot_no", e.target.value)} />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="house_owner">House Owner</FieldLabel>
              <FieldInput id="house_owner" value={formData.house_owner} onChange={(e) => upd("house_owner", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="relationship_to_owner">Relationship to Owner</FieldLabel>
              <Select value={formData.relationship_to_owner} onValueChange={(v) => upd("relationship_to_owner", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Owner","Spouse","Child","Parent","Sibling","Relative","Tenant","Boarder"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

      // ── Step 3: Certificate Details ─────────────────────────────────────────
      case 3: return (
        <div className="space-y-6">
          <SectionDivider title="Certificate Details" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="period_of_residency" required>Period of Residency</FieldLabel>
              <FieldInput id="period_of_residency" placeholder="e.g., 5 years" value={formData.period_of_residency} onChange={(e) => upd("period_of_residency", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Registered Voter</FieldLabel>
              <RadioGroup value={formData.registered_voter} onValueChange={(v) => upd("registered_voter", v)} className="flex gap-6 mt-2.5">
                {["Yes","No"].map((opt) => (
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
            <Select value={formData.purpose} onValueChange={(v) => upd("purpose", v)}>
              <SelectTrigger {...ST}><SelectValue placeholder="Select purpose" /></SelectTrigger>
              <SelectContent>
                {["Residency","Employment","School","Travel","Legal","Bank","Other"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <FieldLabel htmlFor="purpose_details">Purpose Details</FieldLabel>
            <FieldTextarea id="purpose_details" rows={3} placeholder="Additional details about the purpose..." value={formData.purpose_details} onChange={(e) => upd("purpose_details", e.target.value)} />
          </div>
        </div>
      );

      // ── Step 4: Review ──────────────────────────────────────────────────────
      case 4: return (
        <div className="space-y-5">
          <ReviewHeader current={5} total={5} />
          <ReviewCard title="Personal Information">
            <ReviewRow label="Full Name" value={`${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.extension}`.trim()} />
            <ReviewRow label="Age" value={formData.age} />
            <ReviewRow label="Date of Birth" value={formData.dob} />
            <ReviewRow label="Place of Birth" value={formData.pob} />
          </ReviewCard>
          <ReviewCard title="Contact Information">
            <ReviewRow label="Contact No." value={formData.contact_no} />
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

      default: return null;
    }
  };

  return (
    <FormCard title="Barangay Certificate" subtitle="Online Application">
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

export default BarangayCertificateForm;