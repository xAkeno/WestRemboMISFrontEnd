import { useState } from "react";
import axios from "axios";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentType, BarangayDocument } from "@/types/BarangayDocument";
import { toast } from "sonner";
import { FileText, Building2, Briefcase, Users, X } from "lucide-react";
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

// ─── Shared token colors ───────────────────────────────────────────────────────
const NAVY   = "#0f2a5e";
const PINK   = "#c2467d";
const BLUSH  = "#e8a0bf";

const FrontDesk = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DocumentType>("clearance");
  const [formData, setFormData] = useState<Partial<BarangayDocument>>({});
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const handleSubmitClick = () => {
    if (
      !formData.first_name || !formData.last_name || !formData.address || !formData.date_of_birth ||
      !formData.place_of_birth || !formData.period_of_residency ||
      !formData.registered_voter || !formData.house_owner ||
      !formData.relation_to_house_owner || !formData.contact || !formData.purpose
    ) {
      toast.error(t("message.fillRequired"));
      return;
    }
    setConsentChecked(false);
    setShowConsentDialog(true);
  };

  const getServiceType = (tab: DocumentType): string => {
    switch (tab) {
      case "clearance":          return "Barangay Clearance";
      case "building-clearance": return "Building Clearance";
      case "business-clearance": return "Business Clearance";
      case "resident":           return "Resident Registration";
      default:                   return "Barangay Clearance";
    }
  };

  const handleConfirmSubmit = async () => {
    if (!consentChecked) { toast.error(t("message.consentRequired")); return; }
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

  const handleClear = () => { setFormData({}); toast.success(t("message.formCleared")); };

  const TABS: { type: DocumentType; label: string; icon: React.ReactNode }[] = [
    { type: "clearance",          label: t("tab.clearance"),  icon: <FileText className="h-4 w-4" /> },
    { type: "building-clearance", label: t("tab.building"),   icon: <Building2 className="h-4 w-4" /> },
    { type: "business-clearance", label: t("tab.business"),   icon: <Briefcase className="h-4 w-4" /> },
    { type: "resident",           label: t("tab.resident"),   icon: <Users className="h-4 w-4" /> },
  ];

  // Shared underline input style
  const inputCls = "w-full bg-transparent border-0 border-b py-2.5 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:border-[#c2467d] transition-colors duration-200";
  const labelCls = "block text-[10px] font-bold uppercase tracking-[0.14em] mb-1";

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
      {[
        { field: "first_name",             ph: t("placeholder.firstName") },
        { field: "middle_name",            ph: t("placeholder.middleName") },
        { field: "last_name",              ph: t("placeholder.lastName") },
        { field: "address",                ph: t("placeholder.address") },
        { field: "place_of_birth",         ph: t("placeholder.placeOfBirth") },
        { field: "period_of_residency",    ph: t("placeholder.residency") },
        { field: "house_owner",            ph: t("field.houseOwner") },
        { field: "relation_to_house_owner",ph: t("placeholder.relationToOwner") },
        { field: "contact",                ph: t("placeholder.contact") },
        { field: "purpose",                ph: t("placeholder.purpose") },
      ].map(({ field, ph }) => (
        <div key={field}>
          <label className={labelCls} style={{ color: PINK }}>{ph}</label>
          <MaskedInput
            value={(formData as any)[field] || ""}
            onValueChange={(val) => setFormData({ ...formData, [field]: val })}
            placeholder={ph}
            className={inputCls}
            style={{ borderColor: "#d1d5db" }}
          />
        </div>
      ))}

      {/* Date of Birth */}
      <div>
        <label className={labelCls} style={{ color: PINK }}>{t("field.dateOfBirth")}</label>
        <MaskedInput
          type="date"
          value={formData.date_of_birth || ""}
          onValueChange={(val) => setFormData({ ...formData, date_of_birth: val })}
          placeholder={t("field.dateOfBirth")}
          className={inputCls}
          style={{ borderColor: "#d1d5db" }}
        />
      </div>

      {/* Registered Voter */}
      <div>
        <label className={labelCls} style={{ color: PINK }}>{t("field.registeredVoter")}</label>
        <select
          value={formData.registered_voter || ""}
          onChange={(e) => setFormData({ ...formData, registered_voter: e.target.value as "Yes" | "No" })}
          className="w-full bg-transparent border-0 border-b py-2.5 text-sm text-foreground focus:outline-none focus:border-[#c2467d] transition-colors duration-200 cursor-pointer"
          style={{ borderColor: "#d1d5db" }}
        >
          <option value="">{t("option.select")}</option>
          <option value="Yes">{t("option.yes")}</option>
          <option value="No">{t("option.no")}</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="container max-w-5xl mx-auto">

        {/* Page header */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.20em] mb-2" style={{ color: PINK }}>
            Republic of the Philippines · Barangay West Rembo
          </p>
          <h1
            className="font-bold text-foreground mb-2"
            style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.6rem,3vw,2.25rem)" }}
          >
            {t("header.title")}
          </h1>
          <div style={{ width: 48, height: 2, backgroundColor: PINK, margin: "10px auto 12px" }} />
          <p className="text-muted-foreground text-sm">{t("header.subtitle")}</p>
        </div>

        {/* Card */}
        <div
          className="bg-card border border-border overflow-hidden"
          style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: PINK }}
        >
          {/* Card header */}
          <div className="px-8 pt-7 pb-5" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] mb-0.5" style={{ color: NAVY }}>
              {t("card.title")}
            </p>
            <p className="text-sm text-muted-foreground">{t("card.description")}</p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Tab row */}
            <div className="flex flex-wrap gap-2 mb-8">
              {TABS.map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200"
                  style={
                    activeTab === type
                      ? { backgroundColor: NAVY, color: "#fff", borderRadius: 1 }
                      : { backgroundColor: "transparent", color: "#6b7280", border: "1px solid #dde3ed", borderRadius: 1 }
                  }
                  onMouseEnter={(e) => {
                    if (activeTab !== type) {
                      (e.currentTarget as HTMLElement).style.borderColor = PINK;
                      (e.currentTarget as HTMLElement).style.color = PINK;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== type) {
                      (e.currentTarget as HTMLElement).style.borderColor = "#dde3ed";
                      (e.currentTarget as HTMLElement).style.color = "#6b7280";
                    }
                  }}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Form fields */}
            {renderFormFields()}

            {/* Actions */}
            <div className="mt-10 flex flex-wrap justify-end gap-3" style={{ borderTop: "1px solid #e5e7eb", paddingTop: 24 }}>
              <button
                onClick={() => navigate("/frontdesk")}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground border border-border transition-all duration-200"
                style={{ borderRadius: 1 }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = NAVY}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = ""}
              >
                {t("button.backHome")}
              </button>
              <button
                onClick={handleClear}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200"
                style={{ border: `1px solid ${PINK}`, color: PINK, borderRadius: 1 }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#fdf5f8"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
              >
                {t("button.clear")}
              </button>
              <button
                onClick={handleSubmitClick}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200"
                style={{ backgroundColor: NAVY, borderRadius: 1 }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = NAVY}
              >
                {t("button.submit")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Consent Dialog */}
      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent
          className="max-w-2xl bg-white p-0 overflow-hidden"
          style={{ borderRadius: 2, borderTop: `3px solid ${PINK}` }}
        >
          <AlertDialogHeader className="px-7 pt-7 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: PINK }}>
              Data Privacy Notice
            </p>
            <AlertDialogTitle
              className="text-lg font-bold"
              style={{ fontFamily: "'Georgia', serif", color: NAVY }}
            >
              {t("consent.title")}
            </AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogDescription className="px-7 pt-4 pb-6 text-sm leading-relaxed space-y-4">
            <p className="text-foreground">{t("consent.text")}</p>
            <div className="flex items-start gap-3 pt-2 p-4" style={{ backgroundColor: "#f8faff", borderRadius: 1, border: "1px solid #dde3ed" }}>
              <Checkbox
                id="consent"
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
              />
              <label htmlFor="consent" className="text-sm cursor-pointer text-foreground leading-snug">
                {t("consent.checkbox")}
              </label>
            </div>
          </AlertDialogDescription>

          <AlertDialogFooter className="px-7 pb-7 flex gap-3">
            <AlertDialogCancel
              onClick={() => setConsentChecked(false)}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider border border-border text-foreground"
              style={{ borderRadius: 1 }}
            >
              {t("button.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              disabled={!consentChecked}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: NAVY, borderRadius: 1 }}
            >
              {t("consent.submit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FrontDesk;