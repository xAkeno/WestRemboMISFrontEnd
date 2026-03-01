import { useState, useEffect } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import FormProgress from "./FormProgress";
import FormNavigation from "./FormNavigation";
import { useToast } from "@/hooks/use-toast";
import api from "@/components/services/clearanceApi";
import {
  NAVY, PINK,
  FieldLabel, FieldInput, FieldTextarea,
  SectionDivider, ReviewRow, ReviewCard, ReviewHeader, FormCard,
} from "./LguFormPrimitives";

interface BarangayClearanceFormProps { onBack: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }

const stepLabels = ["Personal Info", "Contact", "Address", "Clearance Details", "Review"];

const ST = {
  className: "border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 text-sm px-0 h-9 bg-transparent shadow-none",
  style: { borderBottomWidth: 1, borderColor: "#d1d5db" } as React.CSSProperties,
};

const BarangayClearanceForm = ({ onBack }: BarangayClearanceFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const { toast } = useToast();

  // Fetch streets from API on mount
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
    dob: "", pob: "",
    contact_no: "", email: "",
    house_block_lot_no: "", street: "", zone: "",
    house_owner: "", relationship_to_owner: "",
    bcert_number: "", issued_date: "",
    period_of_residency: "", registered_voter: "",
    purpose: "", purpose_details: "",
    ctc_vrr_no: "", issued_at: "", issued_on: "", or_no: "", remarks: "",
  });

  const upd = (f: string, v: string) => setFormData((p) => ({ ...p, [f]: v }));
  const handleNext = () => { if (currentStep < stepLabels.length - 1) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); else onBack(); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      requester_type: formData.requester_type, prefix: formData.prefix,
      surname: formData.surname, first_name: formData.first_name,
      middle_name: formData.middle_name, ext_name: formData.ext_name,
      house_block_lot_no: formData.house_block_lot_no, street: formData.street,
      zone: formData.zone, dob: formData.dob, pob: formData.pob,
      contact_no: formData.contact_no, period_of_residency: formData.period_of_residency,
      email: formData.email,
      registered_voter: formData.registered_voter, house_owner: formData.house_owner,
      relationship_to_owner: formData.relationship_to_owner,
      bcert_number: formData.bcert_number, issued_date: formData.issued_date,
      purpose: formData.purpose, purpose_details: formData.purpose_details,
      ctc_vrr_no: formData.ctc_vrr_no, issued_at: formData.issued_at,
      issued_on: formData.issued_on, or_no: formData.or_no,
      bomarke: formData.remarks,
    };
    try {
      const res = await api.post("/barangay-clearances", payload, { withCredentials: true });
      if (res.status === 200 || res.status === 201) {
        toast({ title: "Request Submitted", description: "Your barangay clearance request has been submitted successfully." });
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
        console.log("Authenticated user details:", user);

        setFormData(prev => ({
          ...prev,
          // Owner Info
          prefix: user.prefix ?? "",
          surname: user.surname ?? "",
          first_name: user.first_name ?? "",
          middle_name: user.middle_name ?? "",
          ext_name: user.extension_name ?? "",

          dob: user.date_of_birth ?? "",
          pob: user.place_of_birth ?? "",
          contact_no: user.contact_number ?? "",
          email: user.email ?? "",

          // Address
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
            {/* Prefix */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="ext_name">Extension</FieldLabel>
              <FieldInput id="ext_name" placeholder="Jr., Sr., III" value={formData.ext_name} onChange={(e) => upd("ext_name", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="dob" required>Date of Birth</FieldLabel>
              <FieldInput id="dob" type="date" value={formData.dob} onChange={(e) => upd("dob", e.target.value)} />
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

          {/* Street — fetched dropdown, fallback to text input */}
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

          {/* Zone — derived from fetched streets' sitio field */}
          <div>
            <FieldLabel htmlFor="zone" required>Zone / Purok</FieldLabel>
            {uniqueZones.length > 0 ? (
              <Select value={formData.zone} onValueChange={(v) => upd("zone", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select zone" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {uniqueZones.map((z) => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
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

      // ── Step 3: Clearance Details ───────────────────────────────────────────
      case 3: return (
        <div className="space-y-6">
          <SectionDivider title="Clearance Details" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* <div>
              <FieldLabel htmlFor="bcert_number">Clearance Number</FieldLabel>
              <FieldInput id="bcert_number" placeholder="Auto-generated" disabled style={{ opacity: 0.45, cursor: "not-allowed" }} />
            </div>
            <div>
              <FieldLabel htmlFor="issued_date">Issued Date</FieldLabel>
              <FieldInput id="issued_date" type="date" value={formData.issued_date} onChange={(e) => upd("issued_date", e.target.value)} />
            </div> */}
            <div>
              <FieldLabel htmlFor="period_of_residency" required>Period of Residency</FieldLabel>
              <FieldInput id="period_of_residency" placeholder="e.g., 5 years" value={formData.period_of_residency} onChange={(e) => upd("period_of_residency", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Registered Voter</FieldLabel>
              <RadioGroup value={formData.registered_voter} onValueChange={(v) => upd("registered_voter", v)} className="flex gap-6 mt-2.5">
                {["Yes","No"].map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`voter-${opt}`} />
                    <label htmlFor={`voter-${opt}`} className="text-sm cursor-pointer">{opt}</label>
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
                {["Employment","Business","Travel","Legal Purposes","School Requirement","Bank Transaction","Other"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <FieldLabel htmlFor="purpose_details">Purpose Details</FieldLabel>
            <FieldTextarea id="purpose_details" rows={3} placeholder="Additional details about the purpose..." value={formData.purpose_details} onChange={(e) => upd("purpose_details", e.target.value)} />
          </div>

          {/* <SectionDivider title="Official Use Only" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="ctc_vrr_no">CTC / VRR No.</FieldLabel>
              <FieldInput id="ctc_vrr_no" value={formData.ctc_vrr_no} onChange={(e) => upd("ctc_vrr_no", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="issued_at">Issued At</FieldLabel>
              <FieldInput id="issued_at" value={formData.issued_at} onChange={(e) => upd("issued_at", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="issued_on">Issued On</FieldLabel>
              <FieldInput id="issued_on" type="date" value={formData.issued_on} onChange={(e) => upd("issued_on", e.target.value)} />
            </div>
          </div>

          <div className="max-w-xs">
            <FieldLabel htmlFor="or_no">O.R. Number</FieldLabel>
            <FieldInput id="or_no" value={formData.or_no} onChange={(e) => upd("or_no", e.target.value)} />
          </div>

          <div>
            <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
            <FieldTextarea id="remarks" rows={3} value={formData.remarks} onChange={(e) => upd("remarks", e.target.value)} />
          </div> */}
        </div>
      );

      // ── Step 4: Review ──────────────────────────────────────────────────────
      case 4: return (
        <div className="space-y-5">
          <ReviewHeader current={5} total={5} />
          <ReviewCard title="Personal Information">
            <ReviewRow label="Full Name" value={`${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.ext_name}`.trim()} />
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
            <ReviewRow label="House Owner" value={formData.house_owner} />
            <ReviewRow label="Relationship" value={formData.relationship_to_owner} />
          </ReviewCard>
          <ReviewCard title="Clearance Details">
            <ReviewRow label="Purpose" value={formData.purpose} />
            <ReviewRow label="Period of Residency" value={formData.period_of_residency} />
            <ReviewRow label="Registered Voter" value={formData.registered_voter} />
            <ReviewRow label="Purpose Details" value={formData.purpose_details} />
          </ReviewCard>
        </div>
      );

      default: return null;
    }
  };

  return (
    <FormCard title="Barangay Clearance" subtitle="Online Application">
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

export default BarangayClearanceForm;