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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import FormProgress from "./FormProgress";
import FormNavigation from "./FormNavigation";
import { useToast } from "@/hooks/use-toast";

interface BarangayCertificateFormProps {
  onBack: () => void;
}

const stepLabels = [
  "Personal Info",
  "Contact",
  "Address",
  "Certificate Details",
  "Review",
];

const BarangayCertificateForm = ({ onBack }: BarangayCertificateFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Personal Information
    prefix: "",
    firstname: "",
    middle_name: "",
    surname: "",
    extension: "",
    age: "",
    date_of_birth: "",
    place_of_birth: "",
    // Contact
    contact_no: "",
    // Address
    house_block_lot_no: "",
    street: "",
    zone: "",
    house_owner: "",
    relationship_to_owner: "",
    // Certificate Details
    bcert_number: "",
    issued_date: "",
    period_of_residency: "",
    registered_voter: "",
    purpose: "",
    purpose_details: "",
    punong_barangay: "",
    for_the_punong_barangay: "",
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
      description: "Your barangay certificate request has been submitted successfully.",
    });
    onBack();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid gap-4">
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
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input id="middle_name" value={formData.middle_name} onChange={(e) => updateFormData("middle_name", e.target.value)} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="extension">Extension</Label>
                <Input id="extension" placeholder="Jr., Sr., III" value={formData.extension} onChange={(e) => updateFormData("extension", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input id="age" type="number" value={formData.age} onChange={(e) => updateFormData("age", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => updateFormData("date_of_birth", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="place_of_birth">Place of Birth</Label>
                <Input id="place_of_birth" value={formData.place_of_birth} onChange={(e) => updateFormData("place_of_birth", e.target.value)} />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid gap-4">
            <div>
              <Label htmlFor="contact_no">Contact Number *</Label>
              <Input id="contact_no" type="tel" placeholder="09XX XXX XXXX" value={formData.contact_no} onChange={(e) => updateFormData("contact_no", e.target.value)} required />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid gap-4">
            <div>
              <Label htmlFor="house_block_lot_no">House/Block/Lot No. *</Label>
              <Input id="house_block_lot_no" value={formData.house_block_lot_no} onChange={(e) => updateFormData("house_block_lot_no", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="street">Street *</Label>
              <Input id="street" value={formData.street} onChange={(e) => updateFormData("street", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="zone">Zone/Purok *</Label>
              <Input id="zone" value={formData.zone} onChange={(e) => updateFormData("zone", e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="house_owner">House Owner</Label>
                <Input id="house_owner" value={formData.house_owner} onChange={(e) => updateFormData("house_owner", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="relationship_to_owner">Relationship to Owner</Label>
                <Select value={formData.relationship_to_owner} onValueChange={(v) => updateFormData("relationship_to_owner", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Relative">Relative</SelectItem>
                    <SelectItem value="Tenant">Tenant</SelectItem>
                    <SelectItem value="Boarder">Boarder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bcert_number">Certificate Number</Label>
                <Input id="bcert_number" placeholder="Auto-generated" value={formData.bcert_number} disabled />
              </div>
              <div>
                <Label htmlFor="issued_date">Issued Date</Label>
                <Input id="issued_date" type="date" value={formData.issued_date} onChange={(e) => updateFormData("issued_date", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="period_of_residency">Period of Residency *</Label>
                <Input id="period_of_residency" placeholder="e.g., 5 years" value={formData.period_of_residency} onChange={(e) => updateFormData("period_of_residency", e.target.value)} required />
              </div>
              <div>
                <Label>Registered Voter</Label>
                <RadioGroup value={formData.registered_voter} onValueChange={(v) => updateFormData("registered_voter", v)} className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="cert-voter-yes" />
                    <Label htmlFor="cert-voter-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="cert-voter-no" />
                    <Label htmlFor="cert-voter-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div>
              <Label htmlFor="purpose">Purpose *</Label>
              <Select value={formData.purpose} onValueChange={(v) => updateFormData("purpose", v)}>
                <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Residency">Proof of Residency</SelectItem>
                  <SelectItem value="Employment">Employment</SelectItem>
                  <SelectItem value="School">School Requirement</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Legal">Legal Purposes</SelectItem>
                  <SelectItem value="Bank">Bank Transaction</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purpose_details">Purpose Details</Label>
              <Textarea id="purpose_details" placeholder="Additional details about the purpose..." value={formData.purpose_details} onChange={(e) => updateFormData("purpose_details", e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="punong_barangay">Punong Barangay</Label>
                <Input id="punong_barangay" value={formData.punong_barangay} onChange={(e) => updateFormData("punong_barangay", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="for_the_punong_barangay">For the Punong Barangay</Label>
                <Input id="for_the_punong_barangay" value={formData.for_the_punong_barangay} onChange={(e) => updateFormData("for_the_punong_barangay", e.target.value)} />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg mb-4">Review Your Information</h3>
            
            <div className="grid gap-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Personal Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{formData.prefix} {formData.firstname} {formData.middle_name} {formData.surname} {formData.extension}</span>
                  <span className="text-muted-foreground">Age:</span>
                  <span>{formData.age || "Not specified"}</span>
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span>{formData.date_of_birth || "Not specified"}</span>
                  <span className="text-muted-foreground">Place of Birth:</span>
                  <span>{formData.place_of_birth || "Not specified"}</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Contact Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Contact No.:</span>
                  <span>{formData.contact_no || "Not specified"}</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Address Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Address:</span>
                  <span>{formData.house_block_lot_no} {formData.street}, Zone {formData.zone}</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-gold mb-2">Certificate Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Purpose:</span>
                  <span>{formData.purpose || "Not specified"}</span>
                  <span className="text-muted-foreground">Period of Residency:</span>
                  <span>{formData.period_of_residency || "Not specified"}</span>
                  <span className="text-muted-foreground">Registered Voter:</span>
                  <span>{formData.registered_voter || "Not specified"}</span>
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
        <CardTitle className="text-xl">Barangay Certificate</CardTitle>
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

export default BarangayCertificateForm;
