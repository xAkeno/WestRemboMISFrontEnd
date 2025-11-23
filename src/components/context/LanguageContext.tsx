import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "tl";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Header
    "header.title": "Barangay Document Application",
    "header.subtitle": "Select document type and fill out the required information",
    
    // Card
    "card.title": "Document Application",
    "card.description": "Select the document type and fill in all required fields marked with *",
    
    // Tabs
    "tab.clearance": "Clearance",
    "tab.building": "Building",
    "tab.business": "Business",
    "tab.resident": "Resident",
    
    // Form Sections
    "section.personal": "Personal Information",
    "section.residency": "Residency Information",
    "section.purpose": "Purpose",
    
    // Form Fields
    "field.firstName": "First Name",
    "field.middleName": "Middle Name",
    "field.lastName": "Last Name",
    "field.authorizedPerson": "Authorized Person (if applicable)",
    "field.address": "Complete Address",
    "field.dateOfBirth": "Date of Birth",
    "field.placeOfBirth": "Place of Birth",
    "field.contact": "Contact Number",
    "field.residency": "Period of Residency",
    "field.registeredVoter": "Registered Voter",
    "field.houseOwner": "House Owner",
    "field.relationToOwner": "Relation to House Owner",
    "field.purpose": "Purpose of Request",
    
    // Placeholders
    "placeholder.firstName": "Enter first name",
    "placeholder.middleName": "Enter middle name",
    "placeholder.lastName": "Enter last name",
    "placeholder.authorizedPerson": "Name of authorized person",
    "placeholder.address": "Enter complete address",
    "placeholder.placeOfBirth": "Enter place of birth",
    "placeholder.contact": "09XXXXXXXXX",
    "placeholder.residency": "e.g., 5 years",
    "placeholder.relationToOwner": "e.g., Owner, Tenant, Family Member",
    "placeholder.purpose": "State the purpose of this document request",
    
    // Buttons
    "button.backHome": "Back home?",
    "button.clear": "Clear Form",
    "button.submit": "Submit Application",
    "button.cancel": "Cancel",
    
    // Select Options
    "option.yes": "Yes",
    "option.no": "No",
    "option.select": "Select option",
    
    // Messages
    "message.fillRequired": "Please fill in all required fields",
    "message.formCleared": "Form cleared",
    "message.submitSuccess": "Form submitted successfully!",
    "message.submitError": "Failed to submit form",
    "message.consentRequired": "Please check the consent box to proceed",
    
    // Consent Dialog
    "consent.title": "Data Privacy Consent",
    "consent.text": "I acknowledge that I understand the content of this document, voluntarily signed it, and certify to the correctness of the details stated above. I further give my consent to the processing of my personal and/or sensitive personal information for barangay clearance and its related purposes as mentioned above which may be reported as per National and/or Local Ordinances. I understand and accept that this will include access to personal data as provided under the Data Privacy Act of 2012.",
    "consent.checkbox": "I have read and agree to the terms stated above",
    "consent.submit": "Submit",
  },
  tl: {
    // Header
    "header.title": "Aplikasyon para sa Dokumento ng Barangay",
    "header.subtitle": "Pumili ng uri ng dokumento at sagutan ang kinakailangang impormasyon",
    
    // Card
    "card.title": "Aplikasyon ng Dokumento",
    "card.description": "Pumili ng uri ng dokumento at sagutan ang lahat ng kinakailangang patlang na may *",
    
    // Tabs
    "tab.clearance": "Clearance",
    "tab.building": "Gusali",
    "tab.business": "Negosyo",
    "tab.resident": "Residente",
    
    // Form Sections
    "section.personal": "Personal na Impormasyon",
    "section.residency": "Impormasyon sa Paninirahan",
    "section.purpose": "Layunin",
    
    // Form Fields
    "field.firstName": "Pangalan",
    "field.middleName": "Gitnang Pangalan",
    "field.lastName": "Apelyido",
    "field.authorizedPerson": "Awtorisadong Tao (kung mayroon)",
    "field.address": "Kumpletong Address",
    "field.dateOfBirth": "Petsa ng Kapanganakan",
    "field.placeOfBirth": "Lugar ng Kapanganakan",
    "field.contact": "Numero ng Telepono",
    "field.residency": "Tagal ng Paninirahan",
    "field.registeredVoter": "Rehistradong Botante",
    "field.houseOwner": "May-ari ng Bahay",
    "field.relationToOwner": "Relasyon sa May-ari ng Bahay",
    "field.purpose": "Layunin ng Kahilingan",
    
    // Placeholders
    "placeholder.firstName": "Ilagay ang pangalan",
    "placeholder.middleName": "Ilagay ang gitnang pangalan",
    "placeholder.lastName": "Ilagay ang apelyido",
    "placeholder.authorizedPerson": "Pangalan ng awtorisadong tao",
    "placeholder.address": "Ilagay ang kumpletong address",
    "placeholder.placeOfBirth": "Ilagay ang lugar ng kapanganakan",
    "placeholder.contact": "09XXXXXXXXX",
    "placeholder.residency": "hal., 5 taon",
    "placeholder.relationToOwner": "hal., May-ari, Nangungupahan, Miyembro ng Pamilya",
    "placeholder.purpose": "Ilagay ang layunin ng kahilingang ito",
    
    // Buttons
    "button.backHome": "Bumalik sa home?",
    "button.clear": "I-clear ang Form",
    "button.submit": "Isumite ang Aplikasyon",
    "button.cancel": "Kanselahin",
    
    // Select Options
    "option.yes": "Oo",
    "option.no": "Hindi",
    "option.select": "Pumili ng opsyon",
    
    // Messages
    "message.fillRequired": "Pakisagutan ang lahat ng kinakailangang patlang",
    "message.formCleared": "Na-clear ang form",
    "message.submitSuccess": "Matagumpay na naisumite ang form!",
    "message.submitError": "Hindi naisumite ang form",
    "message.consentRequired": "Pakicheck ang consent box upang magpatuloy",
    
    // Consent Dialog
    "consent.title": "Pahintulot sa Privacy ng Data",
    "consent.text": "Kinikilala ko na nauunawaan ko ang nilalaman ng dokumentong ito, kusang nilagdaan ito, at pinatutunayan ang katumpakan ng mga detalyeng nabanggit sa itaas. Binibigyan ko rin ng pahintulot ang pagproseso ng aking personal at/o sensitibong personal na impormasyon para sa barangay clearance at mga kaugnay na layunin nito gaya ng nabanggit sa itaas na maaaring iulat ayon sa Pambansa at/o Lokal na Ordinansa. Nauunawaan at tinatanggap ko na kasama dito ang access sa personal na data tulad ng itinakda sa Data Privacy Act of 2012.",
    "consent.checkbox": "Nabasa ko at sumasang-ayon sa mga tuntunin na nabanggit sa itaas",
    "consent.submit": "Isumite",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
export default LanguageContext;
