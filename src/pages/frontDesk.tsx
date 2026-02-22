import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentType, BarangayDocument } from "@/types/BarangayDocument";
import { toast } from "sonner";
import { FileText, Building2, Briefcase, Users, Eye, EyeOff } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { MaskedInput } from "@/components/MaskedInput";
import { useLanguage } from "@/components/context/LanguageContext";

type GlobalVisibility = "show" | "hide" | null;

const FrontDesk = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DocumentType>("clearance");
  const [formData, setFormData] = useState<Partial<BarangayDocument>>({});
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  //global masking
  const [globalVisibility, setGlobalVisibility] = useState<GlobalVisibility>(null);

  const toggleGlobal = () => {
    // Toggle between "show" and "hide". If currently null, default to "show".
    setGlobalVisibility((prev) => (prev === "show" ? "hide" : "show"));
  };

  const handleSubmitClick = () => {
    if (!formData.first_name || !formData.last_name || !formData.address || !formData.date_of_birth ||
        !formData.place_of_birth || !formData.period_of_residency ||
        !formData.registered_voter || !formData.house_owner ||
        !formData.relation_to_house_owner || !formData.contact || !formData.purpose) {
      toast.error(t("message.fillRequired"));
      return;
    }
    setConsentChecked(false);
    setShowConsentDialog(true);
  };

  const getServiceType = (tab: DocumentType): string => {
    switch (tab) {
      case "clearance": return "Barangay Clearance";
      case "building-clearance": return "Building Clearance";
      case "business-clearance": return "Business Clearance";
      case "resident": return "Resident Registration";
      default: return "Barangay Clearance";
    }
  };

  const handleConfirmSubmit = async () => {
    if (!consentChecked) {
      toast.error(t("message.consentRequired"));
      return;
    }
    try {
      await axios.post(
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
        { withCredentials: true }
      );
      toast.success(t("message.submitSuccess"));
      setShowConsentDialog(false);
      setFormData({});
      setConsentChecked(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("message.submitError"));
    }
  };

  const handleClear = () => {
    setFormData({});
    toast.success(t("message.formCleared"));
  };

  const getIcon = (type: DocumentType) => {
    switch (type) {
      case "clearance": return <FileText className="h-5 w-5" />;
      case "building-clearance": return <Building2 className="h-5 w-5" />;
      case "business-clearance": return <Briefcase className="h-5 w-5" />;
      case "resident": return <Users className="h-5 w-5" />;
    }
  };

  const renderFormFields = () => (
    <div className="space-y-4">
      <MaskedInput
        value={formData.first_name || ""}
        onValueChange={(val) => setFormData({ ...formData, first_name: val })}
        placeholder={t("placeholder.firstName")}
        globalVisibility={globalVisibility}
      />
      <MaskedInput
        value={formData.middle_name || ""}
        onValueChange={(val) => setFormData({ ...formData, middle_name: val })}
        placeholder={t("placeholder.middleName")}
        globalVisibility={globalVisibility}
      />
      <MaskedInput
        value={formData.last_name || ""}
        onValueChange={(val) => setFormData({ ...formData, last_name: val })}
        placeholder={t("placeholder.lastName")}
        globalVisibility={globalVisibility}
      />
      <MaskedInput
        value={formData.address || ""}
        onValueChange={(val) => setFormData({ ...formData, address: val })}
        placeholder={t("placeholder.address")}
        globalVisibility={globalVisibility}
      />
      <MaskedInput
        type="date"
        value={formData.date_of_birth || ""}
        onValueChange={(val) => setFormData({ ...formData, date_of_birth: val })}
        placeholder={t("field.dateOfBirth")}
        globalVisibility={globalVisibility}
      />
      <MaskedInput
        value={formData.place_of_birth || ""}
        onValueChange={(val) => setFormData({ ...formData, place_of_birth: val })}
        placeholder={t("placeholder.placeOfBirth")}
        globalVisibility={globalVisibility}
      />
      <MaskedInput
        value={formData.period_of_residency || ""}
        onValueChange={(val) => setFormData({ ...formData, period_of_residency: val })}
        placeholder={t("placeholder.residency")}
        globalVisibility={globalVisibility}
      />
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">{t("field.registeredVoter")}</label>
        <select
          value={formData.registered_voter || ""}
          onChange={(e) =>
            setFormData({ ...formData, registered_voter: e.target.value as "Yes" | "No" })
          }
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{t("option.select")}</option>
          <option value="Yes">{t("option.yes")}</option>
          <option value="No">{t("option.no")}</option>
        </select>
      </div>
      <MaskedInput
        value={formData.house_owner || ""}
        onValueChange={(val) => setFormData({ ...formData, house_owner: val })}
        placeholder={t("field.houseOwner")}
        globalVisibility={globalVisibility}
      />
      <MaskedInput
        value={formData.relation_to_house_owner || ""}
        onValueChange={(val) => setFormData({ ...formData, relation_to_house_owner: val })}
        placeholder={t("placeholder.relationToOwner")}
        globalVisibility={globalVisibility}
      />
      <MaskedInput
        value={formData.contact || ""}
        onValueChange={(val) => setFormData({ ...formData, contact: val })}
        placeholder={t("placeholder.contact")}
        globalVisibility={globalVisibility}
      />
      <MaskedInput
        value={formData.purpose || ""}
        onValueChange={(val) => setFormData({ ...formData, purpose: val })}
        placeholder={t("placeholder.purpose")}
        globalVisibility={globalVisibility}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-heading font-bold text-primary mb-2">
            {t("header.title")}
          </h1>
          <p className="text-muted-foreground text-lg">{t("header.subtitle")}</p>
        </div>

        <Card className="shadow-lg border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-heading">{t("card.title")}</CardTitle>
                <CardDescription>{t("card.description")}</CardDescription>
              </div>

              {/* Global show/hide toggle */}
              <button
                type="button"
                onClick={toggleGlobal}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={globalVisibility === "show" ? "Hide all fields" : "Show all fields"}
              >
                {globalVisibility === "show" ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Hide All</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Show All</span>
                  </>
                )}
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DocumentType)}>
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 h-auto p-1">
                {(["clearance", "building-clearance", "business-clearance", "resident"] as DocumentType[]).map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
                    {getIcon(tab)} <span className="hidden sm:inline">{t(`tab.${tab.split("-")[0]}`)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeTab}>{renderFormFields()}</TabsContent>
            </Tabs>

            <div className="mt-8 flex justify-end gap-4">
              <Button variant="outline" size="lg" onClick={() => navigate("/frontdesk")}>{t("button.backHome")}</Button>
              <Button variant="outline" size="lg" onClick={handleClear}>{t("button.clear")}</Button>
              <Button size="lg" onClick={handleSubmitClick} className="bg-primary hover:bg-primary/90">{t("button.submit")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{t("consent.title")}</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed pt-4 space-y-4">
              <p className="text-foreground">{t("consent.text")}</p>
              <div className="flex items-start space-x-3 pt-4">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                />
                <label htmlFor="consent" className="text-sm font-medium leading-none cursor-pointer text-foreground">
                  {t("consent.checkbox")}
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConsentChecked(false)}>{t("button.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={!consentChecked} className="disabled:opacity-50 disabled:cursor-not-allowed">
              {t("consent.submit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FrontDesk; 