import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { UnifiedForm } from "@/components/UnifiedForm";
import { DocumentType, BarangayDocument } from "@/types/BarangayDocument";
import { toast } from "sonner";
import { FileText, Building2, Briefcase, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const frontDesk = () => {
  const [activeTab, setActiveTab] = useState<DocumentType>("clearance");
  const [formData, setFormData] = useState<Partial<BarangayDocument>>({});
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const handleSubmitClick = () => {
    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.address || !formData.date_of_birth || 
        !formData.place_of_birth || !formData.period_of_residency || 
        !formData.registered_voter || !formData.house_owner || 
        !formData.relation_to_house_owner || !formData.contact || !formData.purpose) {
      toast.error("Please fill in all required fields");
      return;
    }
    setConsentChecked(false);
    setShowConsentDialog(true);
  };

  const getServiceType = (tab: DocumentType): string => {
    switch (tab) {
      case "clearance":
        return "Barangay Clearance";
      case "building-clearance":
        return "Building Clearance";
      case "business-clearance":
        return "Business Clearance";
      case "resident":
        return "Resident Registration";
      default:
        return "Barangay Clearance";
    }
  };

  const handleConfirmSubmit = async () => {
    if (!consentChecked) {
      toast.error("Please check the consent box to proceed");
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/kiosk/submit",
        {
          service_type: getServiceType(activeTab),
          first_name: formData.first_name || "",
          middle_name: formData.middle_name || "",
          last_name: formData.last_name || "",
          authorized_person: formData.authorized_person || null,
          address: formData.address || "",
          date_of_birth: formData.date_of_birth || "",
          place_of_birth: formData.place_of_birth || "",
          period_of_residency: formData.period_of_residency || "",
          registered_voter: formData.registered_voter || "",
          house_owner: formData.house_owner || "",
          relation_to_house_owner: formData.relation_to_house_owner || "",
          contact_number: formData.contact || "",
          purpose: formData.purpose || "",
          priority: "Normal",
        },
        {
          withCredentials: true,
        }
      );
      console.log("Response:", response.data);
      toast.success("Form submitted successfully!");
      setShowConsentDialog(false);
      setFormData({});
      setConsentChecked(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to submit form";
      toast.error(errorMessage);
      console.error("Error:", error);
    }
  };

  const handleClear = () => {
    setFormData({});
    toast.info("Form cleared");
  };

  const getIcon = (type: DocumentType) => {
    switch (type) {
      case "clearance":
        return <FileText className="h-5 w-5" />;
      case "building-clearance":
        return <Building2 className="h-5 w-5" />;
      case "business-clearance":
        return <Briefcase className="h-5 w-5" />;
      case "resident":
        return <Users className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-heading font-bold text-primary mb-2">
            Barangay Document Application
          </h1>
          <p className="text-muted-foreground text-lg">
            Select document type and fill out the required information
          </p>
        </div>

        <Card className="shadow-lg border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="text-2xl font-heading">Document Application</CardTitle>
            <CardDescription>Select the document type and fill in all required fields marked with *</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DocumentType)}>
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 h-auto p-1">
                <TabsTrigger 
                  value="clearance" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
                >
                  {getIcon("clearance")}
                  <span className="hidden sm:inline">Clearance</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="building-clearance"
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
                >
                  {getIcon("building-clearance")}
                  <span className="hidden sm:inline">Building</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="business-clearance"
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
                >
                  {getIcon("business-clearance")}
                  <span className="hidden sm:inline">Business</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="resident"
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
                >
                  {getIcon("resident")}
                  <span className="hidden sm:inline">Resident</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clearance">
                <UnifiedForm data={formData} onChange={setFormData} />
              </TabsContent>

              <TabsContent value="building-clearance">
                <UnifiedForm data={formData} onChange={setFormData} />
              </TabsContent>

              <TabsContent value="business-clearance">
                <UnifiedForm data={formData} onChange={setFormData} />
              </TabsContent>

              <TabsContent value="resident">
                <UnifiedForm data={formData} onChange={setFormData} />
              </TabsContent>
            </Tabs>

            <div className="mt-8 flex justify-end gap-4">
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleClear}
              >
                Clear Form
              </Button>
              <Button 
                size="lg" 
                onClick={handleSubmitClick}
                className="bg-primary hover:bg-primary/90"
              >
                Submit Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Data Privacy Consent</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed pt-4 space-y-4">
              <p className="text-foreground">
                I acknowledge that I understand the content of this document, voluntarily signed it, and certify to 
                the correctness of the details stated above. I further give my consent to the processing of my personal 
                and/or sensitive personal information for barangay clearance and its related purposes as mentioned 
                above which may be reported as per National and/or Local Ordinances. I understand and accept that 
                this will include access to personal data as provided under the Data Privacy Act of 2012.
              </p>
              <div className="flex items-start space-x-3 pt-4">
                <Checkbox 
                  id="consent" 
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                />
                <label 
                  htmlFor="consent" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-foreground"
                >
                  I have read and agree to the terms stated above
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConsentChecked(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSubmit}
              disabled={!consentChecked}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default frontDesk;