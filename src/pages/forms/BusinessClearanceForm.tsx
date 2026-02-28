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

const BusinessClearanceForm = ({ onBack }: BusinessClearanceFormProps) => {
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
    prefix: "",
    surname: "",
    first_name: "",
    middle_name: "",
    ext_name: "",

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

  console.log("Current form data:", formData);

  const upd = (f: string, v: string) => setFormData((p) => ({ ...p, [f]: v }));
  const handleNext = () => { if (currentStep < stepLabels.length - 1) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); else onBack(); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      requester_type: formData.requester_type, prefix: formData.prefix,
      surname: formData.surname, first_name: formData.first_name,
      middle_name: formData.middle_name, ext: formData.ext_name,
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
        console.log("Created business clearance record:", res.data);
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
          <div className="max-w-xs">
            <FieldLabel htmlFor="ext">Extension</FieldLabel>
            <FieldInput id="ext" placeholder="Jr., Sr., III" value={formData.ext_name} onChange={(e) => upd("ext_name", e.target.value)} />
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
            <FieldLabel htmlFor="capital" required >Capital (PHP)</FieldLabel>
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

      // ── Step 3: Clearance Details ───────────────────────────────────────────
      // case 3: return (
      //   <div className="space-y-6">
      //     <SectionDivider title="Clearance Details" />
      //     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      //       <div>
      //         <FieldLabel htmlFor="brgyBusinessNo">Barangay Business No.</FieldLabel>
      //         <FieldInput id="brgyBusinessNo" placeholder="Auto-generated" disabled style={{ opacity: 0.45, cursor: "not-allowed" }} />
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

      //     <SectionDivider title="Inspection Details" />
      //     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      //       <div>
      //         <FieldLabel htmlFor="inspectedBy">Inspected By</FieldLabel>
      //         <FieldInput id="inspectedBy" value={formData.inspectedBy} onChange={(e) => upd("inspectedBy", e.target.value)} />
      //       </div>
      //       <div>
      //         <FieldLabel htmlFor="dateOfInspection">Date of Inspection</FieldLabel>
      //         <FieldInput id="dateOfInspection" type="date" value={formData.dateOfInspection} onChange={(e) => upd("dateOfInspection", e.target.value)} />
      //       </div>
      //     </div>
      //     <div>
      //       <FieldLabel htmlFor="inspectionRemarks">Inspection Remarks</FieldLabel>
      //       <FieldTextarea id="inspectionRemarks" rows={3} value={formData.inspectionRemarks} onChange={(e) => upd("inspectionRemarks", e.target.value)} />
      //     </div>
      //     <div>
      //       <FieldLabel htmlFor="inspectedNote">Additional Notes</FieldLabel>
      //       <FieldTextarea id="inspectedNote" rows={3} value={formData.inspectedNote} onChange={(e) => upd("inspectedNote", e.target.value)} />
      //     </div>
      //   </div>
      // );

      // ── Step 3: Review ──────────────────────────────────────────────────────
      case 3: return (
        <div className="space-y-5">
          <ReviewHeader current={5} total={5} />
          <ReviewCard title="Owner Information">
            <ReviewRow label="Full Name" value={`${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.ext_name}`.trim()} />
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
          <ReviewCard title="Clearance Details">
            <ReviewRow label="O.R. Number" value={formData.or_no} />
            <ReviewRow label="Inspected By" value={formData.inspected_by} />
            <ReviewRow label="Date of Inspection" value={formData.date_of_inspection} />
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