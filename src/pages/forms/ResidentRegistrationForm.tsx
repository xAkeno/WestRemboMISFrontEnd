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

interface ResidentRegistrationFormProps {
  onBack: () => void;
}

const stepLabels = [
  "Personal Info",
  "Contact",
  "Address",
  "Residency",
  "Review",
];

const ResidentRegistrationForm = ({ onBack }: ResidentRegistrationFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    // Personal Information
    prefix: "",
    surname: "",
    first_name: "",
    middle_name: "",
    ext_name: "",
    nick_name: "",
    sex: "",
    marital_status: "",
    name_of_spouse: "",
    date_of_birth: "",
    place_of_birth: "",
    height_cm: "",
    weight_kg: "",
    blood_type: "",
    complexion: "",
    religion: "",
    // Contact Information
    phone_number: "",
    email_address: "",
    // Address Information
    house_block_lot_no: "",
    street: "",
    zone: "",
    house_owner: "",
    relationship_to_owner: "",
    // Residency & Status
    resident_status: "",
    voter_status: "",
    precinct_no: "",
    emp_status: "",
    occupation: "",
    position: "",
    pwd: "",
    period_of_residency: "",
    // Additional Details
    notes: "",
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
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast({
      title: "Request Submitted",
      description: "Your resident registration request has been submitted successfully.",
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
                <Label htmlFor="first_name">First Name *</Label>
                <Input id="first_name" value={formData.first_name} onChange={(e) => updateFormData("first_name", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input id="middle_name" value={formData.middle_name} onChange={(e) => updateFormData("middle_name", e.target.value)} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="ext_name">Extension (Jr., Sr.)</Label>
                <Input id="ext_name" value={formData.ext_name} onChange={(e) => updateFormData("ext_name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="nick_name">Nickname</Label>
                <Input id="nick_name" value={formData.nick_name} onChange={(e) => updateFormData("nick_name", e.target.value)} />
              </div>
              <div>
                <Label>Sex *</Label>
                <RadioGroup value={formData.sex} onValueChange={(v) => updateFormData("sex", v)} className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Male" id="male" />
                    <Label htmlFor="male" className="font-normal">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Female" id="female" />
                    <Label htmlFor="female" className="font-normal">Female</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select value={formData.marital_status} onValueChange={(v) => updateFormData("marital_status", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                    <SelectItem value="Separated">Separated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name_of_spouse">Name of Spouse</Label>
                <Input id="name_of_spouse" value={formData.name_of_spouse} onChange={(e) => updateFormData("name_of_spouse", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => updateFormData("date_of_birth", e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="place_of_birth">Place of Birth</Label>
                <Input id="place_of_birth" value={formData.place_of_birth} onChange={(e) => updateFormData("place_of_birth", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="religion">Religion</Label>
                <Input id="religion" value={formData.religion} onChange={(e) => updateFormData("religion", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="height_cm">Height (cm)</Label>
                <Input id="height_cm" type="number" value={formData.height_cm} onChange={(e) => updateFormData("height_cm", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input id="weight_kg" type="number" value={formData.weight_kg} onChange={(e) => updateFormData("weight_kg", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="blood_type">Blood Type</Label>
                <Select value={formData.blood_type} onValueChange={(v) => updateFormData("blood_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="complexion">Complexion</Label>
                <Select value={formData.complexion} onValueChange={(v) => updateFormData("complexion", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Light">Light</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Tan">Tan</SelectItem>
                    <SelectItem value="Dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid gap-4">
            <div>
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input id="phone_number" type="tel" placeholder="09XX XXX XXXX" value={formData.phone_number} onChange={(e) => updateFormData("phone_number", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email_address">Email Address</Label>
              <Input id="email_address" type="email" placeholder="your.email@example.com" value={formData.email_address} onChange={(e) => updateFormData("email_address", e.target.value)} />
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
                <Label htmlFor="resident_status">Resident Status</Label>
                <Select value={formData.resident_status} onValueChange={(v) => updateFormData("resident_status", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Permanent">Permanent</SelectItem>
                    <SelectItem value="Temporary">Temporary</SelectItem>
                    <SelectItem value="Transient">Transient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="period_of_residency">Period of Residency</Label>
                <Input id="period_of_residency" placeholder="e.g., 5 years" value={formData.period_of_residency} onChange={(e) => updateFormData("period_of_residency", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Voter Status</Label>
                <RadioGroup value={formData.voter_status} onValueChange={(v) => updateFormData("voter_status", v)} className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Registered" id="registered" />
                    <Label htmlFor="registered" className="font-normal">Registered</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Not Registered" id="not-registered" />
                    <Label htmlFor="not-registered" className="font-normal">Not Registered</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="precinct_no">Precinct No.</Label>
                <Input id="precinct_no" value={formData.precinct_no} onChange={(e) => updateFormData("precinct_no", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="emp_status">Employment Status</Label>
                <Select value={formData.emp_status} onValueChange={(v) => updateFormData("emp_status", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employed">Employed</SelectItem>
                    <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                    <SelectItem value="Unemployed">Unemployed</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input id="occupation" value={formData.occupation} onChange={(e) => updateFormData("occupation", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Input id="position" value={formData.position} onChange={(e) => updateFormData("position", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>PWD Status</Label>
              <RadioGroup value={formData.pwd} onValueChange={(v) => updateFormData("pwd", v)} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="pwd-yes" />
                  <Label htmlFor="pwd-yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="pwd-no" />
                  <Label htmlFor="pwd-no" className="font-normal">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Review Your Information</h3>
              
              <div className="grid gap-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium text-gold mb-2">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{formData.prefix} {formData.first_name} {formData.middle_name} {formData.surname} {formData.ext_name}</span>
                    <span className="text-muted-foreground">Sex:</span>
                    <span>{formData.sex || "Not specified"}</span>
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <span>{formData.date_of_birth || "Not specified"}</span>
                    <span className="text-muted-foreground">Marital Status:</span>
                    <span>{formData.marital_status || "Not specified"}</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium text-gold mb-2">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{formData.phone_number || "Not specified"}</span>
                    <span className="text-muted-foreground">Email:</span>
                    <span>{formData.email_address || "Not specified"}</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium text-gold mb-2">Address Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Address:</span>
                    <span>{formData.house_block_lot_no} {formData.street}, Zone {formData.zone}</span>
                    <span className="text-muted-foreground">House Owner:</span>
                    <span>{formData.house_owner || "Not specified"}</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium text-gold mb-2">Residency & Status</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Resident Status:</span>
                    <span>{formData.resident_status || "Not specified"}</span>
                    <span className="text-muted-foreground">Voter Status:</span>
                    <span>{formData.voter_status || "Not specified"}</span>
                    <span className="text-muted-foreground">Employment:</span>
                    <span>{formData.emp_status || "Not specified"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea id="notes" placeholder="Any additional information..." value={formData.notes} onChange={(e) => updateFormData("notes", e.target.value)} />
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
        <CardTitle className="text-xl">Resident Registration</CardTitle>
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

export default ResidentRegistrationForm;
