import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormProgress from "./FormProgress";
import FormNavigation from "./FormNavigation";
import { useToast } from "@/hooks/use-toast";
import api from "@/components/services/clearanceApi";

interface BuildingClearanceFormProps {
  onBack: () => void;
}

const stepLabels = [
  "Applicant Info",
  "Building Details",
  "Location",
  "Clearance Info",
  "Review",
];

const BuildingClearanceForm = ({ onBack }: BuildingClearanceFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Applicant Information
    requester_type: "Online",
    prefix: "",
    surname: "",
    firstname: "",
    middlename: "",
    extension: "",
    // Building Details
    establishment: "",
    purpose: "",
    purposeDetails: "",
    // Location
    houseBlockLot: "",
    street: "",
    zone: "",
    // Clearance Info
    bcert_number: "",
    issuedDate: "",
    orNo: "",
    remarks: "",
    punongBarangay: "",
    forThePunongBarangay: "",
    barangayPosition: "",
  });

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < stepLabels.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const payload = {
    requester_type: formData.requester_type,
    prefix: formData.prefix,
    surname: formData.surname,
    firstname: formData.firstname,
    middlename: formData.middlename,
    extension: formData.extension,
    establishment: formData.establishment,
    houseBlockLot: formData.houseBlockLot,
    street: formData.street,
    zone: formData.zone,
    purpose: formData.purpose,
    purpose_details: formData.purposeDetails, // map React key
    bcert_number: formData.bcert_number,
    issuedDate: formData.issuedDate,
    orNo: formData.orNo,
    remarks: formData.remarks,
    punongBarangay: formData.punongBarangay,
    forThePunongBarangay: formData.forThePunongBarangay,
    barangayPosition: formData.barangayPosition,
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    console.log("Submitting payload:", payload); // Debug

    try {
      const response = await api.post("/building-clearances", payload, {
        withCredentials: true,
      });

      if (response.status === 200 || response.status === 201) {
        toast({
          title: "Request Submitted",
          description:
            "Your building clearance request has been submitted successfully.",
        });

        console.log("Created building clearance record:", response.data);
        const savedRecordId = response.data?.data?.service?.id;
        console.log("Saved Record ID:", savedRecordId);

        onBack();
      }
    } catch (error: any) {
      if (error.response?.status === 422) {
        console.error("Validation errors:", error.response.data.errors);
        toast({
          title: "Validation Error",
          description: "Please check required fields and try again.",
          variant: "destructive",
        });
      } else {
        console.error("Submission error:", error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid gap-4">
            <h3 className="font-medium text-muted-foreground">Applicant Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="prefix">Prefix</Label>
                <Select value={formData.prefix} onValueChange={(v) => updateFormData("prefix", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                    <SelectItem value="Ms.">Ms.</SelectItem>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="Engr.">Engr.</SelectItem>
                    <SelectItem value="Arch.">Arch.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="surname">Surname *</Label>
                <Input id="surname" value={formData.surname} onChange={(e) => updateFormData("surname", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="firstname">First Name *</Label>
                <Input id="firstname" value={formData.firstname} onChange={(e) => updateFormData("firstname", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="middlename">Middle Name</Label>
                <Input id="middlename" value={formData.middlename} onChange={(e) => updateFormData("middlename", e.target.value)} />
              </div>
            </div>
            
            <div>
              <Label htmlFor="extension">Extension</Label>
              <Input id="extension" placeholder="Jr., Sr., III" value={formData.extension} onChange={(e) => updateFormData("extension", e.target.value)} className="max-w-xs" />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid gap-4">
            <div>
              <Label htmlFor="establishment">Establishment/Project Name *</Label>
              <Input id="establishment" placeholder="e.g., Residential Building, Commercial Complex" value={formData.establishment} onChange={(e) => updateFormData("establishment", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="purpose">Purpose *</Label>
              <Select value={formData.purpose} onValueChange={(v) => updateFormData("purpose", v)}>
                <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="New Construction">New Construction</SelectItem>
                  <SelectItem value="Renovation">Renovation</SelectItem>
                  <SelectItem value="Addition">Addition/Extension</SelectItem>
                  <SelectItem value="Demolition">Demolition</SelectItem>
                  <SelectItem value="Fence">Fence Construction</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="purposeDetails">Purpose Details</Label>
              <Textarea id="purposeDetails" placeholder="Describe the building/construction project in detail..." value={formData.purposeDetails} onChange={(e) => updateFormData("purposeDetails", e.target.value)} />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid gap-4">
            <h3 className="font-medium text-muted-foreground">Project Location</h3>
            <div>
              <Label htmlFor="houseBlockLot">House/Block/Lot No. *</Label>
              <Input id="houseBlockLot" value={formData.houseBlockLot} onChange={(e) => updateFormData("houseBlockLot", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="street">Street *</Label>
              <Input id="street" value={formData.street} onChange={(e) => updateFormData("street", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="zone">Zone/Purok *</Label>
              <Input id="zone" value={formData.zone} onChange={(e) => updateFormData("zone", e.target.value)} required />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bcert_number">Clearance Number</Label>
                <Input id="bcert_number" placeholder="Auto-generated" value={formData.bcert_number} disabled />
              </div>
              <div>
                <Label htmlFor="issuedDate">Issued Date</Label>
                <Input id="issuedDate" type="date" value={formData.issuedDate} onChange={(e) => updateFormData("issuedDate", e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="orNo">O.R. Number</Label>
              <Input id="orNo" value={formData.orNo} onChange={(e) => updateFormData("orNo", e.target.value)} />
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks" value={formData.remarks} onChange={(e) => updateFormData("remarks", e.target.value)} />
            </div>

            <h4 className="font-medium text-muted-foreground mt-4">Authorization</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="punongBarangay">Punong Barangay</Label>
                <Input id="punongBarangay" value={formData.punongBarangay} onChange={(e) => updateFormData("punongBarangay", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="forThePunongBarangay">For the Punong Barangay</Label>
                <Input id="forThePunongBarangay" value={formData.forThePunongBarangay} onChange={(e) => updateFormData("forThePunongBarangay", e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="barangayPosition">Barangay Position</Label>
              <Input id="barangayPosition" value={formData.barangayPosition} onChange={(e) => updateFormData("barangayPosition", e.target.value)} />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg mb-4">Review Your Information</h3>
            
            <div className="grid gap-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Applicant Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{formData.prefix} {formData.firstname} {formData.middlename} {formData.surname} {formData.extension}</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Building Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Establishment:</span>
                  <span>{formData.establishment || "Not specified"}</span>
                  <span className="text-muted-foreground">Purpose:</span>
                  <span>{formData.purpose || "Not specified"}</span>
                  <span className="text-muted-foreground">Details:</span>
                  <span>{formData.purposeDetails || "Not specified"}</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Location</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Address:</span>
                  <span>{formData.houseBlockLot} {formData.street}, Zone {formData.zone}</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Clearance Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">O.R. Number:</span>
                  <span>{formData.orNo || "Not specified"}</span>
                  <span className="text-muted-foreground">Remarks:</span>
                  <span>{formData.remarks || "None"}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="shadow-lg">

      <CardContent className="pt-6">
        <FormProgress currentStep={currentStep} totalSteps={stepLabels.length} stepLabels={stepLabels} />
        {renderStep()}
        <FormNavigation
          currentStep={currentStep}
          totalSteps={stepLabels.length}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};

export default BuildingClearanceForm;
