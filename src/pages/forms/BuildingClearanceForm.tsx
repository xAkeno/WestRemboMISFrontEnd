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

interface BuildingClearanceFormProps { onBack: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }

const stepLabels = ["Applicant Info", "Building Details", "Location", "Review"];

const ST = {
  className: "border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 text-sm px-0 h-9 bg-transparent shadow-none",
  style: { borderBottomWidth: 1, borderColor: "#d1d5db" } as React.CSSProperties,
};

const BuildingClearanceForm = ({ onBack }: BuildingClearanceFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
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
    establishment: "", purpose: "", purpose_details: "",
    house_block_lot_no: "", street: "", zone: "",
    bcert_number: "", issued_date: "", or_no: "", remarks: "",
    punong_barangay: "", for_the_punong_barangay: "", barangay_position: "",
  });

  console.log("Form data:", formData);

  const upd = (f: string, v: string) => setFormData((p) => ({ ...p, [f]: v }));
  const handleNext = () => { if (currentStep < stepLabels.length - 1) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); else onBack(); };
  

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      requester_type: formData.requester_type, prefix: formData.prefix,
      surname: formData.surname, first_name: formData.first_name,
      middle_name: formData.middle_name, ext_name: formData.ext_name,
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
        console.log("Created building clearance record:", res.data);
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

  const renderStep = () => {
    switch (currentStep) {
      // ── Step 0: Applicant Info ──────────────────────────────────────────────
      case 0: return (
        <div className="space-y-6">
          <SectionDivider title="Applicant Information" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="prefix">Prefix</FieldLabel>
              <Select value={formData.prefix} onValueChange={(v) => upd("prefix", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Mr.","Mrs.","Ms.","Dr.","Engr.","Arch."].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
              <FieldLabel htmlFor="middle_name" required>Middle Name</FieldLabel>
              <FieldInput id="middle_name" value={formData.middle_name} onChange={(e) => upd("middle_name", e.target.value)} />
            </div>
          </div>
          <div className="max-w-xs">
            <FieldLabel htmlFor="ext_name">Extension</FieldLabel>
            <FieldInput id="ext_name" placeholder="Jr., Sr., III" value={formData.ext_name} onChange={(e) => upd("ext_name", e.target.value)} />
          </div>
        </div>
      );

      // ── Step 1: Building Details ────────────────────────────────────────────
      case 1: return (
        <div className="space-y-6">
          <SectionDivider title="Building Details" />
          <div>
            <FieldLabel htmlFor="establishment" required>Establishment / Project Name</FieldLabel>
            <FieldInput id="establishment" placeholder="e.g., Residential Building, Commercial Complex" value={formData.establishment} onChange={(e) => upd("establishment", e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="purpose" required>Purpose</FieldLabel>
            <Select value={formData.purpose} onValueChange={(v) => upd("purpose", v)}>
              <SelectTrigger {...ST}><SelectValue placeholder="Select purpose" /></SelectTrigger>
              <SelectContent>
                {["New Construction","Renovation","Addition","Demolition","Fence","Other"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="purposeDetails" required>Purpose Details</FieldLabel>
            <FieldTextarea id="purposeDetails" rows={4} placeholder="Describe the building / construction project in detail..." value={formData.purpose_details} onChange={(e) => upd("purpose_details", e.target.value)} />
          </div>
        </div>
      );

      // ── Step 2: Location ────────────────────────────────────────────────────
      case 2: return (
        <div className="space-y-6">
          <SectionDivider title="Project Location" />
          <div>
            <FieldLabel htmlFor="houseBlockLot" required>House / Block / Lot No.</FieldLabel>
            <FieldInput id="houseBlockLot" value={formData.house_block_lot_no} onChange={(e) => upd("house_block_lot_no", e.target.value)} />
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

      // ── Step 3: Clearance Info ──────────────────────────────────────────────
      // case 3: return (
      //   <div className="space-y-6">
      //     <SectionDivider title="Clearance Information" />
      //     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      //       <div>
      //         <FieldLabel htmlFor="bcert_number">Clearance Number</FieldLabel>
      //         <FieldInput id="bcert_number" placeholder="Auto-generated" disabled style={{ opacity: 0.45, cursor: "not-allowed" }} />
      //       </div>
      //       <div>
      //         <FieldLabel htmlFor="issuedDate">Issued Date</FieldLabel>
      //         <FieldInput id="issuedDate" type="date" value={formData.issuedDate} onChange={(e) => upd("issuedDate", e.target.value)} />
      //       </div>
      //       <div>
      //         <FieldLabel htmlFor="orNo">O.R. Number</FieldLabel>
      //         <FieldInput id="orNo" value={formData.orNo} onChange={(e) => upd("orNo", e.target.value)} />
      //       </div>
      //     </div>
      //     <div>
      //       <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
      //       <FieldTextarea id="remarks" rows={3} value={formData.remarks} onChange={(e) => upd("remarks", e.target.value)} />
      //     </div>

      //     <SectionDivider title="Authorization" />
      //     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      //       <div>
      //         <FieldLabel htmlFor="punongBarangay">Punong Barangay</FieldLabel>
      //         <FieldInput id="punongBarangay" value={formData.punongBarangay} onChange={(e) => upd("punongBarangay", e.target.value)} />
      //       </div>
      //       <div>
      //         <FieldLabel htmlFor="forThePunongBarangay">For the Punong Barangay</FieldLabel>
      //         <FieldInput id="forThePunongBarangay" value={formData.forThePunongBarangay} onChange={(e) => upd("forThePunongBarangay", e.target.value)} />
      //       </div>
      //     </div>
      //     <div className="max-w-sm">
      //       <FieldLabel htmlFor="barangayPosition">Barangay Position</FieldLabel>
      //       <FieldInput id="barangayPosition" value={formData.barangayPosition} onChange={(e) => upd("barangayPosition", e.target.value)} />
      //     </div>
      //   </div>
      // );

      // ── Step 3: Review ──────────────────────────────────────────────────────
      case 3: return (
        <div className="space-y-5">
          <ReviewHeader current={5} total={5} />
          <ReviewCard title="Applicant Information">
            <ReviewRow label="Full Name" value={`${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.ext_name}`.trim()} />
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
          {/* <ReviewCard title="Clearance Info">
            <ReviewRow label="O.R. Number" value={formData.or_no} />
            <ReviewRow label="Remarks" value={formData.remarks} />
            <ReviewRow label="Punong Barangay" value={formData.punong_barangay} />
          </ReviewCard> */}
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