import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FrontFromSection } from "@/components/FrontFromSection";
import { FormField } from "@/components/FormField";
import { toast } from "sonner";
import { FileText } from "lucide-react";

const Index = () => {
  const [applicationType, setApplicationType] = useState("regular");
  const [isRegisteredVoter, setIsRegisteredVoter] = useState<string>("");
  const [acknowledged, setAcknowledged] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) {
      toast.error("Please acknowledge the terms before submitting");
      return;
    }
    toast.success("Application submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground py-6">
            <div className="flex items-center gap-4">
              <FileText className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold">Barangay Clearance/Certificate</h1>
                <p className="text-sm text-primary-foreground/90">Application Form</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Application Type */}
              <FrontFromSection title="Application Type">
                <RadioGroup value={applicationType} onValueChange={setApplicationType}>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="regular" id="regular" />
                      <Label htmlFor="regular" className="cursor-pointer">Regular</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="building" id="building" />
                      <Label htmlFor="building" className="cursor-pointer">Building</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="business" id="business" />
                      <Label htmlFor="business" className="cursor-pointer">Business</Label>
                    </div>
                  </div>
                </RadioGroup>
                <div className="flex items-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="new" />
                    <Label htmlFor="new" className="cursor-pointer">New</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="renewal" />
                    <Label htmlFor="renewal" className="cursor-pointer">Renewal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="certificate" />
                    <Label htmlFor="certificate" className="cursor-pointer">Certificate</Label>
                  </div>
                </div>
              </FrontFromSection>

              {/* Personal Information */}
              <FrontFromSection title="Personal Information">
                <FormField label="Name" id="name" required placeholder="Enter full name" />
                <FormField label="Authorized Person" id="authorizedPerson" placeholder="If applicable" />
                <FormField label="Address" id="address" required placeholder="Complete address" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Date of Birth" id="dateOfBirth" type="date" required />
                  <FormField label="Place of Birth" id="placeOfBirth" required placeholder="City/Municipality" />
                </div>
              </FrontFromSection>

              {/* Residency Information */}
              <FrontFromSection title="Residency Information">
                <FormField 
                  label="Period of Residency in West Rembo" 
                  id="residencyPeriod" 
                  required 
                  placeholder="e.g., 5 years"
                />
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-form-label">
                    Registered Voter of West Rembo? <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup value={isRegisteredVoter} onValueChange={setIsRegisteredVoter}>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="voter-yes" />
                        <Label htmlFor="voter-yes" className="cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="voter-no" />
                        <Label htmlFor="voter-no" className="cursor-pointer">No</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </FrontFromSection>

              {/* House Owner Information */}
              <FrontFromSection title="House Owner Information">
                <FormField label="House Owner" id="houseOwner" required placeholder="Name of house owner" />
                <FormField 
                  label="Relation to House Owner" 
                  id="relationToOwner" 
                  required 
                  placeholder="e.g., Son, Daughter, Tenant"
                />
              </FrontFromSection>

              {/* Purpose and Contact */}
              <FrontFromSection title="Purpose and Contact Information">
                <div className="space-y-2">
                  <Label htmlFor="purpose" className="text-sm font-medium text-form-label">
                    Purpose <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="purpose"
                    name="purpose"
                    required
                    placeholder="State the purpose of this application"
                    className="min-h-[100px] border-form-border focus:ring-primary"
                  />
                </div>
                <FormField 
                  label="Contact Number" 
                  id="contactNumber" 
                  type="tel" 
                  required 
                  placeholder="+63 XXX XXX XXXX"
                />
              </FrontFromSection>

              {/* Acknowledgment */}
              <FrontFromSection>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I acknowledge that I understand the content of this document, voluntarily signed it, and certify to 
                    the correctness of the details stated above. I further give my consent to the processing of my personal 
                    and/or sensitive personal information for barangay clearance and its related purposes as mentioned 
                    above which may be reported as per National and/or Local Ordinances. I understand and accept that 
                    this will include access to personal data as provided under the Data Privacy Act of 2012.
                  </p>
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="acknowledge" 
                      checked={acknowledged}
                      onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                      className="mt-1"
                    />
                    <Label 
                      htmlFor="acknowledge" 
                      className="text-sm font-medium cursor-pointer leading-relaxed"
                    >
                      I acknowledge and agree to the terms stated above
                    </Label>
                  </div>
                </div>
              </FrontFromSection>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="min-w-[200px]"
                >
                  Submit Application
                </Button>
              </div>
            </form>

            {/* Administrative Section - To Be Accomplished by Barangay Personnel */}
            <div className="mt-8 border-t-2 border-primary pt-6">
              <h2 className="text-lg font-bold text-center mb-6 uppercase">
                TO BE ACCOMPLISHED BY BARANGAY PERSONNEL
              </h2>

              <div className="space-y-6">
                {/* 1. Screening */}
                <FrontFromSection title="1. SCREENING">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="By" id="screening-by" placeholder="Name" />
                    <FormField label="Date" id="screening-date" type="date" />
                    <FormField label="Time" id="screening-time" type="time" />
                  </div>
                  <div className="flex items-center space-x-6 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="complete-requirements" />
                      <Label htmlFor="complete-requirements" className="cursor-pointer">
                        Complete Requirements
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="incomplete" />
                      <Label htmlFor="incomplete" className="cursor-pointer">Incomplete</Label>
                    </div>
                  </div>
                </FrontFromSection>

                {/* 2. Inspection */}
                <FrontFromSection title="2. INSPECTION (For building/business clearance)">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="By" id="inspection-by" placeholder="Name" />
                    <FormField label="Date & Time received" id="inspection-datetime" type="datetime-local" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Recommendation" id="recommendation" placeholder="Recommendation" />
                    <FormField label="Date" id="recommendation-date" type="date" />
                    <FormField label="Time" id="recommendation-time" type="time" />
                  </div>
                  <div className="flex items-center space-x-6 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="approved" />
                      <Label htmlFor="approved" className="cursor-pointer">Approved</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="disapproved" />
                      <Label htmlFor="disapproved" className="cursor-pointer">Disapproved</Label>
                    </div>
                  </div>
                  <FormField label="Reason (if disapproved)" id="disapproved-reason" placeholder="Enter reason" />
                  <FormField label="Remarks" id="inspection-remarks" placeholder="Additional remarks" />
                </FrontFromSection>

                {/* 3. Encoding */}
                <FrontFromSection title="3. ENCODING">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Encoded by" id="encoded-by" placeholder="Name" />
                    <FormField label="Brgy. Clearance No." id="clearance-number" placeholder="Clearance number" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Date" id="encoding-date" type="date" />
                    <FormField label="Time" id="encoding-time" type="time" />
                  </div>
                </FrontFromSection>

                {/* 4. Final Approval */}
                <FrontFromSection title="4. FINAL APPROVAL">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Received by" id="final-received-by" placeholder="Name" />
                    <FormField label="Date" id="final-date" type="date" />
                    <FormField label="Time" id="final-time" type="time" />
                  </div>
                  <FormField label="Remarks" id="final-remarks" placeholder="Final remarks" />
                </FrontFromSection>

                {/* 5. Release */}
                <FrontFromSection title="5. RELEASE">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Received by" id="release-received-by" placeholder="Name" />
                    <FormField label="Date/Time" id="release-datetime" type="datetime-local" />
                  </div>
                </FrontFromSection>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          For inquiries, please contact your local Barangay office
        </p>
      </div>
    </div>
  );
};

export default Index;
