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

interface BusinessClearanceFormProps {
  onBack: () => void;
}

const stepLabels = [
  "Owner Info",
  "Business Info",
  "Address",
  "Clearance Details",
  "Review",
];

const BusinessClearanceForm = ({ onBack }: BusinessClearanceFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Owner Information
    prefix: "",
    surname: "",
    firstname: "",
    middlename: "",
    ext: "",
    // Business Information
    businessName: "",
    businessType: "",
    businessDetails: "",
    capital: "",
    // Business Address
    houseBlockLotNo: "",
    street: "",
    zone: "",
    // Clearance Details
    brgyBusinessNo: "",
    issuedDate: "",
    orNo: "",
    inspectedBy: "",
    dateOfInspection: "",
    inspectionRemarks: "",
    inspectedRemarks: "",
    dateInspected: "",
    inspectedNote: "",
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast({
      title: "Request Submitted",
      description: "Your business clearance request has been submitted successfully.",
    });
    onBack();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid gap-4">
            <h3 className="font-medium text-muted-foreground">Business Owner Information</h3>
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
              <Label htmlFor="ext">Extension</Label>
              <Input id="ext" placeholder="Jr., Sr., III" value={formData.ext} onChange={(e) => updateFormData("ext", e.target.value)} className="max-w-xs" />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid gap-4">
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input id="businessName" value={formData.businessName} onChange={(e) => updateFormData("businessName", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="businessType">Business Type *</Label>
              <Select value={formData.businessType} onValueChange={(v) => updateFormData("businessType", v)}>
                <SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="businessDetails">Business Details</Label>
              <Textarea id="businessDetails" placeholder="Describe your business activities..." value={formData.businessDetails} onChange={(e) => updateFormData("businessDetails", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="capital">Capital (PHP)</Label>
              <Input id="capital" type="number" placeholder="0.00" value={formData.capital} onChange={(e) => updateFormData("capital", e.target.value)} />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid gap-4">
            <h3 className="font-medium text-muted-foreground">Business Address</h3>
            <div>
              <Label htmlFor="houseBlockLotNo">House/Block/Lot No. *</Label>
              <Input id="houseBlockLotNo" value={formData.houseBlockLotNo} onChange={(e) => updateFormData("houseBlockLotNo", e.target.value)} required />
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
                <Label htmlFor="brgyBusinessNo">Barangay Business No.</Label>
                <Input id="brgyBusinessNo" placeholder="Auto-generated" value={formData.brgyBusinessNo} disabled />
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

            <h4 className="font-medium text-muted-foreground mt-4">Inspection Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inspectedBy">Inspected By</Label>
                <Input id="inspectedBy" value={formData.inspectedBy} onChange={(e) => updateFormData("inspectedBy", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dateOfInspection">Date of Inspection</Label>
                <Input id="dateOfInspection" type="date" value={formData.dateOfInspection} onChange={(e) => updateFormData("dateOfInspection", e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="inspectionRemarks">Inspection Remarks</Label>
              <Textarea id="inspectionRemarks" value={formData.inspectionRemarks} onChange={(e) => updateFormData("inspectionRemarks", e.target.value)} />
            </div>

            <div>
              <Label htmlFor="inspectedNote">Additional Notes</Label>
              <Textarea id="inspectedNote" value={formData.inspectedNote} onChange={(e) => updateFormData("inspectedNote", e.target.value)} />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg mb-4">Review Your Information</h3>
            
            <div className="grid gap-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Owner Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{formData.prefix} {formData.firstname} {formData.middlename} {formData.surname} {formData.ext}</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Business Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Business Name:</span>
                  <span>{formData.businessName || "Not specified"}</span>
                  <span className="text-muted-foreground">Business Type:</span>
                  <span>{formData.businessType || "Not specified"}</span>
                  <span className="text-muted-foreground">Capital:</span>
                  <span>{formData.capital ? `₱${formData.capital}` : "Not specified"}</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Business Address</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Address:</span>
                  <span>{formData.houseBlockLotNo} {formData.street}, Zone {formData.zone}</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Clearance Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">O.R. Number:</span>
                  <span>{formData.orNo || "Not specified"}</span>
                  <span className="text-muted-foreground">Inspected By:</span>
                  <span>{formData.inspectedBy || "Not specified"}</span>
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
      <CardHeader className="bg-navy text-navy-foreground rounded-t-lg">
        <CardTitle className="text-xl">Business Clearance</CardTitle>
      </CardHeader>
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

export default BusinessClearanceForm;
