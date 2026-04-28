import { useState, useEffect, useRef, useCallback, useMemo } from "react";
// Auto-reset the success screen back to the kiosk welcome page after this idle
// window. Spec: "Wait for approximately 5 seconds." Also acts as the inactivity
// timeout if the resident leaves the success screen untouched.
const SUCCESS_AUTO_RESET_MS = 5000;
// Route that renders the SearchResident landing page (Yes/No prompt). The
// kiosk navigates back here after a successful submission so the next
// resident lands on the proper start-of-flow.
const KIOSK_WELCOME_ROUTE = "/frontdesk";

// ── Local kiosk profile cache ─────────────────────────────────────────────────
// Mirrors SearchResident.tsx so the Yes-flow can look up a resident's last
// submission entirely on-device when the backend search misses. The key is
// normalised so casing / whitespace differences don't break lookups.
const KIOSK_CACHE_PREFIX = "kiosk:profile:";
const makeKioskCacheKey = (fn: string, ln: string, dob: string) =>
  `${KIOSK_CACHE_PREFIX}${(fn || "").trim().toLowerCase()}|${(ln || "").trim().toLowerCase()}|${(dob || "").trim()}`;
import api from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentType, BarangayDocument } from "@/types/BarangayDocument";
import { toast } from "sonner";
import {
  FileText, Building2, Briefcase, Check,
  ChevronRight, ChevronDown, X, Type, Globe, ScrollText,
  Shield, ArrowRight,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { MaskedInput } from "@/components/MaskedInput";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Brand tokens ──────────────────────────────────────────────────────────────
const NAVY = "#0f2a5e";
const PINK = "#c2467d";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
type Lang = "en" | "tl" | "ceb";

const SERVICE_TYPE_MAP: Record<string, string> = {
  "clearance":             "Barangay Clearance",
  "building-clearance":    "Building Clearance",
  "business-clearance":    "Business Clearance",
  "barangay-certificate":  "Barangay Certificate",
};

// ─── Document-type → backend document_type string ─────────────────────────────
const DOC_TYPE_TO_SCHEDULE_TYPE: Record<string, string> = {
  "clearance":             "barangay_clearance",
  "building-clearance":    "building_clearance",
  "business-clearance":    "business_clearance",
  "barangay-certificate":  "barangay_certificate",
};

const getServiceType = (tab: string): string => SERVICE_TYPE_MAP[tab] ?? "Barangay Clearance";

// Prefix options for the combobox
const PREFIX_OPTIONS = ["Mr.", "Ms.", "Mrs.", "Dr.", "Atty.", "Engr.", "Prof."];

// ─── PH Holidays 2026 ─────────────────────────────────────────────────────────
const PH_HOLIDAYS_2026 = [
  "2026-01-01", "2026-04-09", "2026-05-01", "2026-06-12",
  "2026-08-25", "2026-11-30", "2026-12-25", "2026-12-30",
];

// ─── Auto-detect current time slot & today's date ─────────────────────────────
// Morning: 12:00 AM – 11:59 AM  |  Afternoon: 12:00 PM – 11:59 PM
const getAutoTimeGroup = (): "morning" | "afternoon" => {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : "afternoon";
};

const getTodayDateString = (): string => {
  return new Date().toISOString().split("T")[0];
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    // Welcome screen
    "welcome.title":          "Document Request System",
    "welcome.subtitle":       "Barangay West Rembo · Makati City",
    "welcome.tagline":        "Fast, simple, and paperless document requests for all barangay residents.",
    "welcome.startBtn":       "Start Request",
    "welcome.privacy.title":  "Data Privacy Notice",
    "welcome.privacy.text":   "Your personal information will be collected and processed solely for the purpose of this barangay document request, in accordance with the Data Privacy Act of 2012 (RA 10173). It will not be shared with unauthorized third parties.",
    "welcome.privacy.check":  "I have read and understood the Data Privacy Notice.",
    "welcome.privacy.proceed":"Proceed",
    // ── New fields ──────────────────────────────────────────
    "field.nickname":         "Nickname",
    "field.pwd":              "PWD",
    "field.email":            "Email address",
    "field.precinctNo":       "Precinct no.",
    "field.residentStatus":   "Resident status",
    "field.occupation":       "Occupation",
    "field.position":         "Position",
    "field.employmentStatus": "Employment status",
    "field.notes":            "Notes",
    "ph.nickname":            "Optional",
    "ph.pwd":                 "e.g. Visual, Hearing, Physical",
    "ph.email":               "e.g. juan@email.com",
    "ph.precinctNo":          "e.g. 1234A",
    "ph.residentStatus":      "e.g. Permanent, Transient",
    "ph.occupation":          "e.g. Teacher, Driver",
    "ph.position":            "e.g. Supervisor",
    "ph.employmentStatus":    "e.g. Employed, Self-employed",
    "ph.notes":               "Additional notes…",
    "review.nickname":        "Nickname",
    "review.pwd":             "PWD",
    "review.email":           "Email address",
    "review.precinctNo":      "Precinct no.",
    "review.residentStatus":  "Resident status",
    "review.occupation":      "Occupation",
    "review.position":        "Position",
    "review.employmentStatus":"Employment status",
    "review.notes":           "Notes",
    "ph.agePlaceholder":      "Auto-calculated from date of birth",
    "ph.complexion":          "Select or type complexion…",
    "opt.veryFair":           "Very Fair",
    "opt.fair":               "Fair",
    "opt.morena":             "Morena",
    "opt.brown":              "Brown",
    "opt.dark":               "Dark",
    "opt.veryDark":           "Very Dark",
    "err.minAge":             "Applicant must be at least 1 year old.",
    "err.invalidName":        "Name must contain only letters and be at least 2 characters.",
    "err.invalidContact":     "Contact number must be exactly 11 digits starting with 09.",
    "err.invalidEmail":       "Please enter a valid email address.",
    "err.invalidAge":         "Please enter a valid age.",
    "err.invalidHeight":      "Height must be a positive number.",
    "err.invalidWeight":      "Weight must be a positive number.",
    "err.invalidCapital":     "Capital must be a positive number.",
    "err.invalidResidency":   "Please enter a valid period (e.g., 5 years, 6 months).",
    "err.selectDoc": "Please select a document type before continuing.",
    "a11y.language":          "Language",
    "a11y.fontSize":          "Text size",
    "a11y.small":             "A",
    "a11y.medium":            "A",
    "a11y.large":             "A",
    "a11y.xlarge":            "A",
    "a11y.lang.en":           "English",
    "a11y.lang.tl":           "Filipino",
    "a11y.lang.ceb":          "Bisaya",
    "header.title":           "Document Request System",
    "header.subtitle":        "Complete the form below to request your barangay document",
    "step.document":          "Document",
    "step.personal":          "Personal",
    "step.address":           "Address",
    "step.details":           "Details",
    "step.review":            "Review",
    "doc.clearance.label":    "Barangay Clearance",
    "doc.clearance.sub":      "General purpose clearance",
    "doc.building.label":     "Building Clearance",
    "doc.building.sub":       "For construction permits",
    "doc.business.label":     "Business Clearance",
    "doc.business.sub":       "For business registration",
    "doc.bcert.label":        "Barangay Certificate",
    "doc.bcert.sub":          "Official barangay certificate",
    "step1.eyebrow":          "Step 1 of 5",
    "step1.title":            "Select document type",
    "step1.subtitle":         "Choose the document you need from the options below",
    "step2.eyebrow":          "Step 2 of 5",
    "step2.title":            "Personal information",
    "step2.subtitle":         "Please fill in your complete name and birth details",
    "step3.eyebrow":          "Step 3 of 5",
    "step3.title":            "Address & residency",
    "step3.subtitle":         "Provide your current address and residency information",
    "step4.eyebrow":          "Step 4 of 5",
    "step4.title":            "Contact & purpose",
    "step4.subtitle":         "Your contact number and the reason for this request",
    "step5.eyebrow":          "Step 5 of 5",
    "step5.title":            "Review your information",
    "step5.subtitle":         "Please verify all details before submitting",
    "field.prefix":           "Prefix",
    "field.firstName":        "First name",
    "field.middleName":       "Middle name (Optional)",
    "field.Surname":          "Last name",
    "field.extName":          "Ext. name (Jr./Sr./III) (Optional)",
    "field.dob":              "Date of birth",
    "field.pob":              "Place of birth",
    "field.sex":              "Sex",
    "field.civilStatus":      "Civil status",
    "field.age":              "Age",
    "field.houseUnit":        "House no. / Block / Lot",
    "field.street":           "Street",
    "field.zone":             "Zone / Sitio",
    "field.residency":        "Period of residency",
    "field.voter":            "Registered voter?",
    "field.houseOwner":       "House owner",
    "field.relation":         "Relation to owner",
    "field.contact":          "Contact number",
    "field.purpose":          "Purpose of request",
    "field.businessName":     "Business name",
    "field.businessType":     "Business type",
    "field.capital":          "Capital amount",
    "field.establishment":    "Establishment name",
    "ph.prefix":              "e.g. Mr./Ms.",
    "ph.firstName":           "e.g. Juan",
    "ph.middleName":          "Optional",
    "ph.Surname":             "e.g. Dela Cruz",
    "ph.extName":             "Optional",
    "ph.pob":                 "City/Municipality, Province",
    "ph.houseUnit":           "e.g. 123 or Blk 4 Lot 2",
    "ph.street":              "Select or type street…",
    "ph.zone":                "Select zone…",
    "ph.zoneFirst":           "Select a street first",
    "ph.residency":           "e.g. 5 years",
    "ph.contact":             "09XX XXX XXXX",
    "ph.purpose":             "e.g. Employment, Loan",
    "ph.businessName":        "e.g. ABC Store",
    "ph.businessType":        "e.g. Retail, Food, Service",
    "ph.capital":             "e.g. 50000",
    "ph.establishment":       "e.g. Building name",
    "ph.bcertNumber":         "e.g. 2024-001",
    "opt.select":             "Select…",
    "opt.yes":                "Yes",
    "opt.no":                 "No",
    "opt.male":               "Male",
    "opt.female":             "Female",
    "opt.single":             "Single",
    "opt.married":            "Married",
    "opt.widowed":            "Widowed",
    "opt.separated":          "Separated",
    "review.personal":        "Personal information",
    "review.address":         "Address & residency",
    "review.contact":         "Contact & purpose",
    "review.firstName":       "First name",
    "review.middleName":      "Middle name",
    "review.Surname":         "Last name",
    "review.dob":             "Date of birth",
    "review.pob":             "Place of birth",
    "review.sex":             "Sex",
    "review.civilStatus":     "Civil status",
    "review.houseUnit":       "House / Block / Lot",
    "review.street":          "Street",
    "review.zone":            "Zone",
    "review.residency":       "Period of residency",
    "review.voter":           "Registered voter",
    "review.houseOwner":      "House owner",
    "review.relation":        "Relation to owner",
    "review.contact":         "Contact number",
    "review.purpose":         "Purpose",
    "consent.heading":        "Data Privacy Notice",
    "consent.text":           "Your personal information will be collected and processed solely for the purpose of this barangay document request, in accordance with the Data Privacy Act of 2012 (RA 10173). It will not be shared with unauthorized third parties.",
    "consent.checkbox":       "I understand and consent to the collection and processing of my personal information for this request.",
    "btn.backHome":           "← Back to home",
    "btn.continue":           "Continue",
    "btn.review":             "Review",
    "btn.back":               "← Back",
    "btn.edit":               "Edit form",
    "btn.submit":             "Submit request",
    "btn.newRequest":         "Start new request",
    "btn.cancel":             "Cancel",
    "err.selectDoc":          "Please select a document type.",
    "err.fillRequired":       "Please fill in all required fields.",
    "err.fillAddress":        "Please fill in all required fields including street and zone.",
    "err.consent":            "Please accept the data privacy consent to proceed.",
    "success.title":          "Request submitted!",
    "success.sub":            "Your request has been successfully received. Kindly wait for your turn to be served.",
    "success.refLabel":       "Reference number",
    "success.autoReset":      "Returning to home in {n}s…",
    "addr.preview":           "Full address:",
    "field.spouse":           "Name of spouse (Optional)",
    "field.bloodType":        "Blood type (Optional)",
    "field.height":           "Height (cm) (Optional)",
    "field.weight":           "Weight (kg) (Optional)",
    "field.complexion":       "Complexion (Optional)",
    "field.religion":         "Religion (Optional)",
    "ph.spouse":              "e.g. Maria Dela Cruz",
    "ph.bloodType":           "e.g. O+",
    "ph.height":              "e.g. 165",
    "ph.weight":              "e.g. 60",
    "ph.complexion":          "e.g. Fair, Morena, Dark",
    "ph.religion":            "e.g. Roman Catholic",
    "review.spouse":          "Name of spouse",
    "review.bloodType":       "Blood type",
    "review.height":          "Height (cm)",
    "review.weight":          "Weight (kg)",
    "review.complexion":      "Complexion",
    "review.religion":        "Religion",
  },

  tl: {
    "welcome.title":          "Sistema ng Kahilingan ng Dokumento",
    "welcome.subtitle":       "Barangay West Rembo · Lungsod ng Makati",
    "welcome.tagline":        "Mabilis, simple, at walang papel na kahilingan ng dokumento para sa lahat ng residente.",
    "welcome.startBtn":       "Magsimula ng Kahilingan",
    "welcome.privacy.title":  "Abiso sa Privacy ng Data",
    "welcome.privacy.text":   "Ang iyong personal na impormasyon ay kokolektahin at ipoproseso lamang para sa layunin ng kahilingang ito ng dokumento ng barangay, alinsunod sa Batas sa Privacy ng Data ng 2012 (RA 10173). Hindi ito ibabahagi sa mga hindi awtorisadong third party.",
    "welcome.privacy.check":  "Nabasa at naunawaan ko ang Abiso sa Privacy ng Data.",
    "welcome.privacy.proceed":"Magpatuloy",
    "field.nickname":         "Palayaw",
    "field.pwd":              "PWD",
    "field.email":            "Email address",
    "field.precinctNo":       "Blg. ng presinto",
    "field.residentStatus":   "Katayuan bilang residente",
    "field.occupation":       "Trabaho",
    "field.position":         "Posisyon",
    "field.employmentStatus": "Katayuan sa trabaho",
    "field.notes":            "Mga tala",
    "ph.nickname":            "Opsyonal",
    "ph.pwd":                 "hal. Visual, Pandinig, Pisikal",
    "ph.email":               "hal. juan@email.com",
    "ph.precinctNo":          "hal. 1234A",
    "ph.residentStatus":      "hal. Permanente, Pansamantala",
    "ph.occupation":          "hal. Guro, Driver",
    "ph.position":            "hal. Superbisor",
    "ph.employmentStatus":    "hal. Employed, Self-employed",
    "ph.notes":               "Karagdagang tala…",
    "review.nickname":        "Palayaw",
    "review.pwd":             "PWD",
    "review.email":           "Email address",
    "review.precinctNo":      "Blg. ng presinto",
    "review.residentStatus":  "Katayuan bilang residente",
    "review.occupation":      "Trabaho",
    "review.position":        "Posisyon",
    "review.employmentStatus":"Katayuan sa trabaho",
    "review.notes":           "Mga tala",
    "ph.agePlaceholder":      "Awtomatikong kinukwenta mula sa petsa ng kapanganakan",
    "ph.complexion":          "Pumili o mag-type ng kutis…",
    "opt.veryFair":           "Napakaputi",
    "opt.fair":               "Maputi",
    "opt.morena":             "Morena",
    "opt.brown":              "Kayumanggi",
    "opt.dark":               "Maitim",
    "opt.veryDark":           "Napakaitim",
    "err.minAge":             "Ang aplikante ay dapat na hindi bababa sa 1 taong gulang.",
    "err.invalidName":        "Ang pangalan ay dapat naglalaman lamang ng mga letra at hindi bababa sa 2 character.",
    "err.invalidContact":     "Ang numero ng contact ay dapat eksaktong 11 digit na nagsisimula sa 09.",
    "err.invalidEmail":       "Mangyaring maglagay ng wastong email address.",
    "err.invalidAge":         "Mangyaring maglagay ng wastong edad.",
    "err.invalidHeight":      "Ang taas ay dapat na positibong numero.",
    "err.invalidWeight":      "Ang timbang ay dapat na positibong numero.",
    "err.invalidCapital":     "Ang kapital ay dapat na positibong numero.",
    "err.invalidResidency":   "Mangyaring maglagay ng wastong panahon (hal., 5 taon, 6 buwan).",
    "a11y.language":          "Wika",
    "a11y.fontSize":          "Laki ng teksto",
    "a11y.small":             "A",
    "a11y.medium":            "A",
    "a11y.large":             "A",
    "a11y.xlarge":            "A",
    "a11y.lang.en":           "Ingles",
    "a11y.lang.tl":           "Filipino",
    "a11y.lang.ceb":          "Bisaya",
    "header.title":           "Sistema ng Kahilingan ng Dokumento",
    "header.subtitle":        "Kumpletuhin ang form sa ibaba upang humiling ng dokumento mula sa barangay",
    "step.document":          "Dokumento",
    "step.personal":          "Personal",
    "step.address":           "Tirahan",
    "step.details":           "Detalye",
    "step.review":            "Suriin",
    "doc.clearance.label":    "Barangay Clearance",
    "doc.clearance.sub":      "Pangkalahatang layunin na clearance",
    "doc.building.label":     "Clearance sa Gusali",
    "doc.building.sub":       "Para sa mga permit sa konstruksiyon",
    "doc.business.label":     "Clearance sa Negosyo",
    "doc.business.sub":       "Para sa pagpaparehistro ng negosyo",
    "doc.bcert.label":        "Sertipiko ng Barangay",
    "doc.bcert.sub":          "Opisyal na sertipiko ng barangay",
    "step1.eyebrow":          "Hakbang 1 ng 5",
    "step1.title":            "Piliin ang uri ng dokumento",
    "step1.subtitle":         "Piliin ang dokumentong kailangan mo mula sa mga pagpipilian sa ibaba",
    "step2.eyebrow":          "Hakbang 2 ng 5",
    "step2.title":            "Personal na impormasyon",
    "step2.subtitle":         "Punan ang iyong kumpletong pangalan at mga detalye ng kapanganakan",
    "step3.eyebrow":          "Hakbang 3 ng 5",
    "step3.title":            "Tirahan at paninirahan",
    "step3.subtitle":         "Ibigay ang iyong kasalukuyang tirahan at impormasyon sa paninirahan",
    "step4.eyebrow":          "Hakbang 4 ng 5",
    "step4.title":            "Pakikipag-ugnayan at layunin",
    "step4.subtitle":         "Ang iyong numero sa pakikipag-ugnayan at dahilan ng kahilingang ito",
    "step5.eyebrow":          "Hakbang 5 ng 5",
    "step5.title":            "Suriin ang iyong impormasyon",
    "step5.subtitle":         "Pakiverify ang lahat ng detalye bago isumite",
    "field.prefix":           "Titulo",
    "field.firstName":        "Unang pangalan",
    "field.middleName":       "Gitnang pangalan (Opsyonal)",
    "field.Surname":          "Apelyido",
    "field.extName":          "Ext. pangalan (Jr./Sr./III) (Opsyonal)",
    "field.dob":              "Petsa ng kapanganakan",
    "field.pob":              "Lugar ng kapanganakan",
    "field.sex":              "Kasarian",
    "field.civilStatus":      "Katayuang sibil",
    "field.age":              "Edad",
    "field.houseUnit":        "Blg. ng bahay / Bloke / Lote",
    "field.street":           "Kalye",
    "field.zone":             "Zone / Sitio",
    "field.residency":        "Tagal ng paninirahan",
    "field.voter":            "Rehistradong botante?",
    "field.houseOwner":       "May-ari ng bahay",
    "field.relation":         "Relasyon sa may-ari",
    "field.contact":          "Numero sa pakikipag-ugnayan",
    "field.purpose":          "Layunin ng kahilingan",
    "field.businessName":     "Pangalan ng negosyo",
    "field.businessType":     "Uri ng negosyo",
    "field.capital":          "Halaga ng kapital",
    "field.establishment":    "Pangalan ng establisyamento",
    "ph.prefix":              "hal. G./Gng.",
    "ph.firstName":           "hal. Juan",
    "ph.middleName":          "Opsyonal",
    "ph.Surname":             "hal. Dela Cruz",
    "ph.extName":             "Opsyonal",
    "ph.pob":                 "Lungsod/Munisipalidad, Lalawigan",
    "ph.houseUnit":           "hal. 123 o Blk 4 Lote 2",
    "ph.street":              "Piliin o i-type ang kalye…",
    "ph.zone":                "Piliin ang zone…",
    "ph.zoneFirst":           "Piliin muna ang kalye",
    "ph.residency":           "hal. 5 taon",
    "ph.contact":             "09XX XXX XXXX",
    "ph.purpose":             "hal. Trabaho, Pautang",
    "ph.businessName":        "hal. Tindahan ng ABC",
    "ph.businessType":        "hal. Tingi, Pagkain, Serbisyo",
    "ph.capital":             "hal. 50000",
    "ph.establishment":       "hal. Pangalan ng gusali",
    "ph.bcertNumber":         "hal. 2024-001",
    "opt.select":             "Piliin…",
    "opt.yes":                "Oo",
    "opt.no":                 "Hindi",
    "opt.male":               "Lalaki",
    "opt.female":             "Babae",
    "opt.single":             "Walang asawa",
    "opt.married":            "May asawa",
    "opt.widowed":            "Biyudo/Biyuda",
    "opt.separated":          "Hiwalay",
    "review.personal":        "Personal na impormasyon",
    "review.address":         "Tirahan at paninirahan",
    "review.contact":         "Pakikipag-ugnayan at layunin",
    "review.firstName":       "Unang pangalan",
    "review.middleName":      "Gitnang pangalan",
    "review.Surname":         "Apelyido",
    "review.dob":             "Petsa ng kapanganakan",
    "review.pob":             "Lugar ng kapanganakan",
    "review.sex":             "Kasarian",
    "review.civilStatus":     "Katayuang sibil",
    "review.houseUnit":       "Bahay / Bloke / Lote",
    "review.street":          "Kalye",
    "review.zone":            "Zone",
    "review.residency":       "Tagal ng paninirahan",
    "review.voter":           "Rehistradong botante",
    "review.houseOwner":      "May-ari ng bahay",
    "review.relation":        "Relasyon sa may-ari",
    "review.contact":         "Numero sa pakikipag-ugnayan",
    "review.purpose":         "Layunin",
    "consent.heading":        "Abiso sa Privacy ng Data",
    "consent.text":           "Ang iyong personal na impormasyon ay kokolektahin at ipoproseso lamang para sa layunin ng kahilingang ito ng dokumento ng barangay, alinsunod sa Batas sa Privacy ng Data ng 2012 (RA 10173). Hindi ito ibabahagi sa mga hindi awtorisadong third party.",
    "consent.checkbox":       "Nauunawaan ko at pumapayag ako sa pagkolekta at pagproseso ng aking personal na impormasyon para sa kahilingang ito.",
    "btn.backHome":           "← Bumalik sa home",
    "btn.continue":           "Magpatuloy",
    "btn.review":             "Suriin",
    "btn.back":               "← Bumalik",
    "btn.edit":               "I-edit ang form",
    "btn.submit":             "Isumite ang kahilingan",
    "btn.newRequest":         "Magsimula ng bagong kahilingan",
    "btn.cancel":             "Kanselahin",
    "err.selectDoc":          "Mangyaring pumili ng uri ng dokumento.",
    "err.fillRequired":       "Mangyaring punan ang lahat ng kinakailangang field.",
    "err.fillAddress":        "Mangyaring punan ang lahat ng kinakailangang field kasama ang kalye at zone.",
    "err.consent":            "Mangyaring tanggapin ang pahintulot sa privacy ng data upang magpatuloy.",
    "success.title":          "Naisumite na ang kahilingan!",
    "success.sub":            "Natanggap na ang iyong kahilingan sa dokumento. Mangyaring maghintay ng pagpoproseso.",
    "success.refLabel":       "Reference number",
    "success.autoReset":      "Babalik sa home sa {n}s…",
    "addr.preview":           "Buong tirahan:",
    "field.spouse":           "Pangalan ng asawa (Opsyonal)",
    "field.bloodType":        "Uri ng dugo (Opsyonal)",
    "field.height":           "Taas (cm) (Opsyonal)",
    "field.weight":           "Timbang (kg) (Opsyonal)",
    "field.complexion":       "Kutis (Opsyonal)",
    "field.religion":         "Relihiyon (Opsyonal)",
    "ph.spouse":              "hal. Maria Dela Cruz",
    "ph.bloodType":           "hal. O+",
    "ph.height":              "hal. 165",
    "ph.weight":              "hal. 60",
    "ph.complexion":          "hal. Maputi, Morena, Maitim",
    "ph.religion":            "hal. Romano Katoliko",
    "review.spouse":          "Pangalan ng asawa",
    "review.bloodType":       "Uri ng dugo",
    "review.height":          "Taas (cm)",
    "review.weight":          "Timbang (kg)",
    "review.complexion":      "Kutis",
    "review.religion":        "Relihiyon",
  },

  ceb: {
    "welcome.title":          "Sistema sa Pagsugo og Dokumento",
    "welcome.subtitle":       "Barangay West Rembo · Lungsod sa Makati",
    "welcome.tagline":        "Paspas, simple, ug walay papel nga hangyo sa dokumento alang sa tanan nga residente.",
    "welcome.startBtn":       "Magsugod og Hangyo",
    "welcome.privacy.title":  "Abiso sa Privacy sa Data",
    "welcome.privacy.text":   "Ang imong personal nga impormasyon makolekta ug maproseso lamang alang sa katuyoan niini nga hangyo sa dokumento sa barangay, subay sa Data Privacy Act of 2012 (RA 10173). Dili kini ibahin sa mga wala'y awtorisasyon nga ikatulo nga partido.",
    "welcome.privacy.check":  "Nabasa ug nasabtan nako ang Abiso sa Privacy sa Data.",
    "welcome.privacy.proceed":"Magpadayon",
    "field.nickname":         "Ngalan sa balay",
    "field.pwd":              "PWD",
    "field.email":            "Email address",
    "field.precinctNo":       "Blg. sa presinto",
    "field.residentStatus":   "Kahimtang isip residente",
    "field.occupation":       "Trabaho",
    "field.position":         "Posisyon",
    "field.employmentStatus": "Kahimtang sa trabaho",
    "field.notes":            "Mga nota",
    "ph.nickname":            "Opsyonal",
    "ph.pwd":                 "hal. Visual, Pandungog, Pisikal",
    "ph.email":               "hal. juan@email.com",
    "ph.precinctNo":          "hal. 1234A",
    "ph.residentStatus":      "hal. Permanente, Transiente",
    "ph.occupation":          "hal. Magtutudlo, Drayber",
    "ph.position":            "hal. Superbisor",
    "ph.employmentStatus":    "hal. Employed, Self-employed",
    "ph.notes":               "Dugang nga nota…",
    "review.nickname":        "Ngalan sa balay",
    "review.pwd":             "PWD",
    "review.email":           "Email address",
    "review.precinctNo":      "Blg. sa presinto",
    "review.residentStatus":  "Kahimtang isip residente",
    "review.occupation":      "Trabaho",
    "review.position":        "Posisyon",
    "review.employmentStatus":"Kahimtang sa trabaho",
    "review.notes":           "Mga nota",
    "ph.agePlaceholder":      "Awtomatikong kalkulado gikan sa petsa sa pagkatawo",
    "ph.complexion":          "Pilia o i-type ang kolor sa panit…",
    "opt.veryFair":           "Puti Kaayo",
    "opt.fair":               "Maputi",
    "opt.morena":             "Morena",
    "opt.brown":              "Brownish",
    "opt.dark":               "Ngitngit",
    "opt.veryDark":           "Ngitngit Kaayo",
    "err.minAge":             "Ang aplikante kinahanglan nga may edad nga labing menos 1 ka tuig.",
    "err.invalidName":        "Ang ngalan kinahanglan nga adunay mga letra lamang ug dili moubos sa 2 ka karakter.",
    "err.invalidContact":     "Ang numero sa kontak kinahanglan nga eksaktong 11 ka digit nga nagsugod sa 09.",
    "err.invalidEmail":       "Palihug pagbutang og balido nga email address.",
    "err.invalidAge":         "Palihug pagbutang og balido nga edad.",
    "err.invalidHeight":      "Ang gitas-on kinahanglan nga positibo nga numero.",
    "err.invalidWeight":      "Ang timbang kinahanglan nga positibo nga numero.",
    "err.invalidCapital":     "Ang kapital kinahanglan nga positibo nga numero.",
    "err.invalidResidency":   "Palihug pagbutang og balido nga panahon (pananglitan, 5 ka tuig, 6 ka bulan).",
    "err.selectDoc": "Palihug pagpili sa matang sa dokumento sa wala pa magpadayon.",
    "a11y.language":          "Pinulongan",
    "a11y.fontSize":          "Gidak-on sa teksto",
    "a11y.small":             "A",
    "a11y.medium":            "A",
    "a11y.large":             "A",
    "a11y.xlarge":            "A",
    "a11y.lang.en":           "Ingles",
    "a11y.lang.tl":           "Filipino",
    "a11y.lang.ceb":          "Bisaya",
    "header.title":           "Sistema sa Pagsugo og Dokumento",
    "header.subtitle":        "Pun-a ang porma sa ubos aron makakuha og dokumento gikan sa barangay",
    "step.document":          "Dokumento",
    "step.personal":          "Personal",
    "step.address":           "Adres",
    "step.details":           "Detalye",
    "step.review":            "Susihon",
    "doc.clearance.label":    "Barangay Clearance",
    "doc.clearance.sub":      "Kinatibuk-ang katuyoan nga clearance",
    "doc.building.label":     "Clearance sa Pagtukod",
    "doc.building.sub":       "Para sa mga permit sa konstruksyon",
    "doc.business.label":     "Clearance sa Negosyo",
    "doc.business.sub":       "Para sa rehistrasyon sa negosyo",
    "doc.bcert.label":        "Sertipiko sa Barangay",
    "doc.bcert.sub":          "Opisyal nga sertipiko sa barangay",
    "step1.eyebrow":          "Lakang 1 sa 5",
    "step1.title":            "Pilia ang matang sa dokumento",
    "step1.subtitle":         "Pilia ang dokumento nga imong gikinahanglan gikan sa mga kapilian sa ubos",
    "step2.eyebrow":          "Lakang 2 sa 5",
    "step2.title":            "Personal nga impormasyon",
    "step2.subtitle":         "Palihug pun-a ang imong tibuok ngalan ug mga detalye sa pagkatawo",
    "step3.eyebrow":          "Lakang 3 sa 5",
    "step3.title":            "Adres ug pagpuyo",
    "step3.subtitle":         "Ihatag ang imong kasamtangang adres ug impormasyon sa pagpuyo",
    "step4.eyebrow":          "Lakang 4 sa 5",
    "step4.title":            "Kontak ug katuyoan",
    "step4.subtitle":         "Ang imong numero sa kontak ug rason niini nga hangyo",
    "step5.eyebrow":          "Lakang 5 sa 5",
    "step5.title":            "Susihon ang imong impormasyon",
    "step5.subtitle":         "Palihug i-verify ang tanan nga detalye sa wala pa isumite",
    "field.prefix":           "Titulo",
    "field.firstName":        "Una nga ngalan",
    "field.middleName":       "Tungatunga nga ngalan (Opsyonal)",
    "field.Surname":          "Apelyido",
    "field.extName":          "Ext. ngalan (Jr./Sr./III) (Opsyonal)",
    "field.dob":              "Petsa sa pagkatawo",
    "field.pob":              "Lugar sa pagkatawo",
    "field.sex":              "Sekso",
    "field.civilStatus":      "Katayoan sibil",
    "field.age":              "Edad",
    "field.houseUnit":        "Blg. sa balay / Bloke / Lote",
    "field.street":           "Karsada",
    "field.zone":             "Zone / Sitio",
    "field.residency":        "Gidugayon sa pagpuyo",
    "field.voter":            "Rehistradong botante?",
    "field.houseOwner":       "Tag-iya sa balay",
    "field.relation":         "Relasyon sa tag-iya",
    "field.contact":          "Numero sa kontak",
    "field.purpose":          "Katuyoan sa hangyo",
    "field.businessName":     "Ngalan sa negosyo",
    "field.businessType":     "Matang sa negosyo",
    "field.capital":          "Kantidad sa kapital",
    "field.establishment":    "Ngalan sa establisyamento",
    "ph.prefix":              "hal. G./Gng.",
    "ph.firstName":           "hal. Juan",
    "ph.middleName":          "Opsyonal",
    "ph.Surname":             "hal. Dela Cruz",
    "ph.extName":             "Opsyonal",
    "ph.pob":                 "Siyudad/Munisipyo, Probinsya",
    "ph.houseUnit":           "hal. 123 o Blk 4 Lote 2",
    "ph.street":              "Pilia o i-type ang karsada…",
    "ph.zone":                "Pilia ang zone…",
    "ph.zoneFirst":           "Pilia una ang karsada",
    "ph.residency":           "hal. 5 ka tuig",
    "ph.contact":             "09XX XXX XXXX",
    "ph.purpose":             "hal. Trabaho, Pautang",
    "ph.businessName":        "hal. Tindahan sa ABC",
    "ph.businessType":        "hal. Tingi, Pagkaon, Serbisyo",
    "ph.capital":             "hal. 50000",
    "ph.establishment":       "hal. Ngalan sa bilding",
    "ph.bcertNumber":         "hal. 2024-001",
    "opt.select":             "Pilia…",
    "opt.yes":                "Oo",
    "opt.no":                 "Dili",
    "opt.male":               "Lalaki",
    "opt.female":             "Babaye",
    "opt.single":             "Bulag",
    "opt.married":            "Minyo",
    "opt.widowed":            "Biyudo/Biyuda",
    "opt.separated":          "Bulag na",
    "review.personal":        "Personal nga impormasyon",
    "review.address":         "Adres ug pagpuyo",
    "review.contact":         "Kontak ug katuyoan",
    "review.firstName":       "Una nga ngalan",
    "review.middleName":      "Tungatunga nga ngalan",
    "review.Surname":         "Apelyido",
    "review.dob":             "Petsa sa pagkatawo",
    "review.pob":             "Lugar sa pagkatawo",
    "review.sex":             "Sekso",
    "review.civilStatus":     "Katayoan sibil",
    "review.houseUnit":       "Balay / Bloke / Lote",
    "review.street":          "Karsada",
    "review.zone":            "Zone",
    "review.residency":       "Gidugayon sa pagpuyo",
    "review.voter":           "Rehistradong botante",
    "review.houseOwner":      "Tag-iya sa balay",
    "review.relation":        "Relasyon sa tag-iya",
    "review.contact":         "Numero sa kontak",
    "review.purpose":         "Katuyoan",
    "consent.heading":        "Abiso sa Privacy sa Data",
    "consent.text":           "Ang imong personal nga impormasyon makolekta ug maproseso lamang alang sa katuyoan niini nga hangyo sa dokumento sa barangay, subay sa Data Privacy Act of 2012 (RA 10173). Dili kini ibahin sa mga wala'y awtorisasyon nga ikatulo nga partido.",
    "consent.checkbox":       "Nasabtan nako ug nagkauyon ako sa pagkolekta ug pagproseso sa akong personal nga impormasyon alang niini nga hangyo.",
    "btn.backHome":           "← Balik sa home",
    "btn.continue":           "Padayon",
    "btn.review":             "Susihon",
    "btn.back":               "← Balik",
    "btn.edit":               "I-edit ang porma",
    "btn.submit":             "Isumite ang hangyo",
    "btn.newRequest":         "Magsugod og bag-ong hangyo",
    "btn.cancel":             "Ikansela",
    
    "err.fillRequired":       "Palihug pun-a ang tanan nga gikinahanglang field.",
    "err.fillAddress":        "Palihug pun-a ang tanan nga gikinahanglang field lakip ang karsada ug zone.",
    "err.consent":            "Palihug dawata ang pahintulot sa privacy sa data aron magpadayon.",
    "success.title":          "Naisumite na ang hangyo!",
    "success.sub":            "Nadawat na ang imong hangyo sa dokumento. Palihug maghulat sa pagproseso.",
    "success.refLabel":       "Reference number",
    "success.autoReset":      "Mobalik sa home sulod sa {n}s…",
    "addr.preview":           "Tibuok adres:",
    "field.spouse":           "Ngalan sa asawa (Opsyonal)",
    "field.bloodType":        "Matang sa dugo (Opsyonal)",
    "field.height":           "Gihabugon (cm) (Opsyonal)",
    "field.weight":           "Gibug-aton (kg) (Opsyonal)",
    "field.complexion":       "Kolor sa panit (Opsyonal)",
    "field.religion":         "Relihiyon (Opsyonal)",
    "ph.spouse":              "hal. Maria Dela Cruz",
    "ph.bloodType":           "hal. O+",
    "ph.height":              "hal. 165",
    "ph.weight":              "hal. 60",
    "ph.complexion":          "hal. Maputi, Morena, Ngitngit",
    "ph.religion":            "hal. Romano Katoliko",
    "review.spouse":          "Ngalan sa asawa",
    "review.bloodType":       "Matang sa dugo",
    "review.height":          "Gihabugon (cm)",
    "review.weight":          "Gibug-aton (kg)",
    "review.complexion":      "Kolor sa panit",
    "review.religion":        "Relihiyon",
  },
};

// ─── Font size scale ───────────────────────────────────────────────────────────
type FontSize = "sm" | "md" | "lg" | "xl";
const FONT_SCALE: Record<FontSize, { scale: number; label: string; ariaLabel: string }> = {
  sm: { scale: 0.875, label: "A", ariaLabel: "Small text"       },
  md: { scale: 1,     label: "A", ariaLabel: "Normal text"      },
  lg: { scale: 1.15,  label: "A", ariaLabel: "Large text"       },
  xl: { scale: 1.3,   label: "A", ariaLabel: "Extra large text" },
};

const LS_LANG = "fd_lang";
const LS_FONT = "fd_font";

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const toUpperCase = (value: string): string => value.toUpperCase();

const validateName = (name: string, fieldName: string, tr: (k: string) => string): string => {
  if (!name || name.trim() === "") return `${fieldName} is required.`;
  if (!/^[A-Za-z\s\-']+$/.test(name)) return tr("err.invalidName");
  if (name.trim().length === 1) return tr("err.invalidName");
  return "";
};

const validateContact = (contact: string, tr: (k: string) => string): string => {
  if (!contact || contact.trim() === "") return "Contact number is required.";
  const cleanContact = contact.replace(/\D/g, '');
  if (cleanContact.length !== 11) return tr("err.invalidContact");
  if (!/^09\d{9}$/.test(cleanContact)) return tr("err.invalidContact");
  return "";
};

const validateEmail = (email: string, tr: (k: string) => string): string => {
  if (email && email.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return tr("err.invalidEmail");
  }
  return "";
};

const validateRequired = (value: string, fieldName: string): string => {
  if (!value || value.trim() === "") return `${fieldName} is required.`;
  return "";
};

const validatePositiveNumber = (value: string, fieldName: string, tr: (k: string) => string, required: boolean = false): string => {
  if (!value || value.trim() === "") {
    return required ? `${fieldName} is required.` : "";
  }
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return tr(`err.invalid${fieldName}`);
  return "";
};

const validatePeriodOfResidency = (value: string, tr: (k: string) => string): string => {
  if (!value || value.trim() === "") return "Period of residency is required.";
  if (!/^\d+\s*(year|years|month|months)?$/i.test(value.trim())) return tr("err.invalidResidency");
  return "";
};

const validateDob = (dob: string, tr: (k: string) => string): string => {
  if (!dob) return "Date of birth is required.";
  const date = new Date(dob);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(date.getTime())) return "Invalid date.";
  if (date > today) return "Date of birth cannot be a future date.";
  return "";
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY BAR
// ═══════════════════════════════════════════════════════════════════════════════
interface AccessibilityBarProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  fontSize: FontSize;
  setFontSize: (f: FontSize) => void;
}

const AccessibilityBar = ({ lang, setLang, fontSize, setFontSize }: AccessibilityBarProps) => {
  const tr = (k: string) => TRANSLATIONS[lang][k] ?? k;
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const LANG_OPTIONS: { id: Lang; flag: string }[] = [
    { id: "en",  flag: "🇺🇸" },
    { id: "tl",  flag: "🇵🇭" },
    { id: "ceb", flag: "🇵🇭" },
  ];
  const FONT_SIZES: FontSize[] = ["sm", "md", "lg", "xl"];

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between gap-4 px-4 py-2.5 border-b border-border"
      style={{ background: NAVY, backdropFilter: "blur(8px)" }}
      role="toolbar"
      aria-label="Accessibility controls"
    >
      <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:block" style={{ color: "#ffffff88" }}>
        Barangay West Rembo
      </span>
      <div className="flex items-center gap-5 ml-auto">
        <div className="flex items-center gap-2" role="group" aria-label={tr("a11y.fontSize")}>
          <Type className="h-3.5 w-3.5" style={{ color: "#ffffffaa" }} aria-hidden="true" />
          <div className="flex items-center gap-1">
            {FONT_SIZES.map((fs, i) => {
              const sizes = ["text-[11px]", "text-[13px]", "text-[15px]", "text-[18px]"];
              const isActive = fontSize === fs;
              return (
                <button
                  key={fs}
                  onClick={() => { setFontSize(fs); localStorage.setItem(LS_FONT, fs); }}
                  aria-label={FONT_SCALE[fs].ariaLabel}
                  aria-pressed={isActive}
                  className={`${sizes[i]} font-bold w-8 h-7 flex items-center justify-center rounded transition-all duration-150`}
                  style={{
                    background: isActive ? PINK : "transparent",
                    color:      isActive ? "#fff" : "#ffffffaa",
                    border:     isActive ? `1px solid ${PINK}` : "1px solid transparent",
                  }}
                >
                  {FONT_SCALE[fs].label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ width: 1, height: 20, background: "#ffffff22" }} />
        <div ref={langRef} className="relative" role="group" aria-label={tr("a11y.language")}>
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: langOpen ? PINK : "transparent",
              color:      "#fff",
              border:     `1px solid ${langOpen ? PINK : "#ffffff33"}`,
            }}
            aria-haspopup="listbox"
            aria-expanded={langOpen}
          >
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === "en" ? "EN" : lang === "tl" ? "TL" : "CEB"}</span>
            <ChevronDown className="h-3 w-3 opacity-70" aria-hidden="true" />
          </button>
          {langOpen && (
            <ul
              role="listbox"
              aria-label="Select language"
              className="absolute right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded overflow-hidden text-sm z-50"
              style={{ minWidth: 140 }}
            >
              {LANG_OPTIONS.map(({ id, flag }) => (
                <li key={id} role="option" aria-selected={lang === id}>
                  <button
                    onClick={() => { setLang(id); localStorage.setItem(LS_LANG, id); setLangOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    style={{
                      color:      lang === id ? NAVY : "#374151",
                      fontWeight: lang === id ? 700 : 400,
                      background: lang === id ? "#f0f4ff" : undefined,
                    }}
                  >
                    <span aria-hidden="true">{flag}</span>
                    {TRANSLATIONS[id][`a11y.lang.${id}`]}
                    {lang === id && <Check className="h-3.5 w-3.5 ml-auto" style={{ color: PINK }} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// WELCOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
interface WelcomeScreenProps {
  tr: (k: string) => string;
  onProceed: () => void;
}

const WelcomeScreen = ({ tr, onProceed }: WelcomeScreenProps) => {
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);

  const handleProceed = () => {
    if (!privacyChecked) { setPrivacyError(true); return; }
    onProceed();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div
          className="bg-card border border-border overflow-hidden mb-6"
          style={{ borderRadius: 2, borderTopWidth: 4, borderTopColor: NAVY }}
        >
          <div style={{ background: NAVY, padding: "32px 40px 28px" }}>
            <p className="font-bold uppercase tracking-[0.22em] mb-3" style={{ color: "#ffffffaa", fontSize: "0.62em" }}>
              Republic of the Philippines · Barangay West Rembo · Makati City
            </p>
            <h1
              className="font-bold text-white mb-3"
              style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", lineHeight: 1.15 }}
            >
              {tr("welcome.title")}
            </h1>
            <div style={{ width: 40, height: 3, backgroundColor: PINK, marginBottom: 14 }} />
            <p style={{ color: "#ffffffcc", fontSize: "0.92em", lineHeight: 1.6 }}>
              {tr("welcome.tagline")}
            </p>
          </div>

          <div className="px-8 py-6" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <p className="font-bold uppercase tracking-[0.14em] mb-4" style={{ color: PINK, fontSize: "0.62em" }}>
              Available Documents
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { icon: <FileText className="h-4 w-4" />, label: "Barangay Clearance" },
                { icon: <Building2 className="h-4 w-4" />, label: "Building Clearance" },
                { icon: <Briefcase className="h-4 w-4" />, label: "Business Clearance" },
                { icon: <ScrollText className="h-4 w-4" />, label: "Barangay Certificate" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ background: "#f8faff", borderRadius: 6, border: "1px solid #e8edf5" }}
                >
                  <span style={{ color: NAVY }}>{item.icon}</span>
                  <span className="font-medium text-foreground" style={{ fontSize: "0.78em" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="p-5 mb-5" style={{ background: "#f8faff", border: "1px solid #dde3ed", borderRadius: 6 }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 flex-shrink-0" style={{ color: NAVY }} />
                <p className="font-bold uppercase tracking-[0.14em]" style={{ color: NAVY, fontSize: "0.65em" }}>
                  {tr("welcome.privacy.title")}
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4" style={{ fontSize: "0.85em" }}>
                {tr("welcome.privacy.text")}
              </p>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="welcome-consent"
                  checked={privacyChecked}
                  onCheckedChange={(v) => { setPrivacyChecked(v as boolean); setPrivacyError(false); }}
                />
                <label
                  htmlFor="welcome-consent"
                  className="cursor-pointer leading-snug"
                  style={{ fontSize: "0.85em", color: privacyError ? PINK : "var(--color-text-primary)" }}
                >
                  {tr("welcome.privacy.check")}
                </label>
              </div>
              {privacyError && (
                <p className="mt-2" style={{ color: PINK, fontSize: "0.78em" }}>
                  Please accept the data privacy notice to continue.
                </p>
              )}
            </div>

            <button
              onClick={handleProceed}
              className="w-full inline-flex items-center justify-center gap-3 py-3.5 font-bold uppercase tracking-wider text-white transition-all duration-200"
              style={{ backgroundColor: NAVY, borderRadius: 2, fontSize: "0.82em" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = NAVY)}
            >
              {tr("welcome.startBtn")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-center text-muted-foreground" style={{ fontSize: "0.75em" }}>
          Walk-in kiosk · Barangay Hall, West Rembo, Makati City
        </p>
      </div>
    </div>
  );
};

////////////
////////////
///////////
// Add this new function near the top with other helper functions
const getDefaultAdultYear = (): number => {
  const currentYear = new Date().getFullYear();
  // Default to 18 years ago (ensures age >= 18)
  return currentYear - 18;
};

// Also add a function to get the default date string with the adult year
const getDefaultAdultDateString = (): string => {
  const defaultYear = getDefaultAdultYear();
  const defaultMonth = "01"; // January
  const defaultDay = "01"; // 1st day
  return `${defaultYear}-${defaultMonth}-${defaultDay}`;
};


// ═══════════════════════════════════════════════════════════════════════════════
// PURE UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const labelCls = "block font-bold uppercase tracking-[0.14em] mb-1";

const Field = ({ label, children, error, required }: { label: string; children: React.ReactNode; error?: string; required?: boolean }) => (
  <div>
    <label className={labelCls} style={{ color: PINK, fontSize: "0.65em" }}>
      {label}
      {required && <span style={{ color: PINK, marginLeft: 2 }}>*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs" style={{ color: PINK }}>{error}</p>}
  </div>
);

const ReviewRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-muted-foreground" style={{ fontSize: "0.72em" }}>{label}</span>
    <span className="font-medium text-foreground" style={{ fontSize: "0.88em" }}>{value || "—"}</span>
  </div>
);

const ReviewSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <h3
      className="font-bold uppercase tracking-[0.14em] mb-3 pb-2"
      style={{ color: NAVY, borderBottom: "1px solid #e5e7eb", fontSize: "0.65em" }}
    >
      {title}
    </h3>
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
  </div>
);

const SelectField = ({
  value, onChange, inputCls, children, error
}: {
  value: string;
  onChange: (v: string) => void;
  inputCls: string;
  children: React.ReactNode;
  error?: string;
}) => (
  <div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} cursor-pointer`}
      style={{ borderColor: error ? PINK : "#d1d5db", fontSize: "inherit" }}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs" style={{ color: PINK }}>{error}</p>}
  </div>
);

interface PrefixComboboxProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  inputCls: string;
  error?: string;
}

const PrefixCombobox = ({ value, onChange, placeholder = "Select prefix…", inputCls, error }: PrefixComboboxProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const select = (opt: string) => { onChange(opt); setOpen(false); };
  const clear = () => { onChange(""); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <div
        className="relative flex items-center"
        style={{ borderBottom: `1px solid ${error ? PINK : open ? PINK : "#d1d5db"}` }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full py-2.5 text-left bg-transparent focus:outline-none pr-12"
          style={{ color: value ? "var(--color-foreground)" : "#9ca3af", fontSize: "inherit", cursor: "pointer" }}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {value || placeholder}
        </button>
        <div className="absolute right-0 flex items-center gap-0.5">
          {value && (
            <button type="button" onClick={(e) => { e.stopPropagation(); clear(); }} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Clear">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="p-1 text-gray-400 pointer-events-none"><ChevronDown className="h-3.5 w-3.5" /></span>
        </div>
      </div>
      {error && <p className="mt-1 text-xs" style={{ color: PINK }}>{error}</p>}
      {open && (
        <ul role="listbox" className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto" style={{ borderRadius: 4, fontSize: "inherit" }}>
          {PREFIX_OPTIONS.map((opt) => (
            <li
              key={opt} role="option" aria-selected={opt === value}
              onMouseDown={() => select(opt)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
              style={{ color: opt === value ? NAVY : undefined, fontWeight: opt === value ? 500 : 400 }}
            >
              {opt}
              {opt === value && <Check className="h-3.5 w-3.5" style={{ color: PINK }} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface ComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  inputCls: string;
  error?: string;
}

const Combobox = ({ value, onChange, options, placeholder = "Select…", disabled, inputCls, error }: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const select = (opt: string) => { onChange(opt); setOpen(false); };
  const clear = () => { onChange(""); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <div
        className="relative flex items-center"
        style={{ borderBottom: `1px solid ${error ? PINK : open ? PINK : "#d1d5db"}` }}
      >
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className="w-full py-2.5 text-left bg-transparent focus:outline-none pr-12"
          style={{ color: value ? "var(--color-foreground)" : "#9ca3af", fontSize: "inherit", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {value || placeholder}
        </button>
        <div className="absolute right-0 flex items-center gap-0.5">
          {value && !disabled && (
            <button type="button" onClick={(e) => { e.stopPropagation(); clear(); }} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Clear">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="p-1 text-gray-400 pointer-events-none"><ChevronDown className="h-3.5 w-3.5" /></span>
        </div>
      </div>
      {error && <p className="mt-1 text-xs" style={{ color: PINK }}>{error}</p>}
      {open && (
        <ul role="listbox" className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto" style={{ borderRadius: 4, fontSize: "inherit" }}>
          {options.map((opt) => (
            <li
              key={opt} role="option" aria-selected={opt === value}
              onMouseDown={() => select(opt)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
              style={{ color: opt === value ? NAVY : undefined, fontWeight: opt === value ? 500 : 400 }}
            >
              {opt}
              {opt === value && <Check className="h-3.5 w-3.5" style={{ color: PINK }} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Card = ({ eyebrow, title, subtitle, children }: {
  eyebrow: string; title: string; subtitle?: string; children: React.ReactNode;
}) => (
  <div className="bg-card border border-border overflow-hidden" style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: PINK }}>
    <div className="px-8 pt-6 pb-5" style={{ borderBottom: "1px solid #e5e7eb" }}>
      <p className="font-bold uppercase tracking-[0.16em] mb-1" style={{ color: PINK, fontSize: "0.65em" }}>{eyebrow}</p>
      <h2 className="font-bold text-foreground" style={{ fontFamily: "'Georgia', serif", fontSize: "1.25em" }}>{title}</h2>
      {subtitle && <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85em" }}>{subtitle}</p>}
    </div>
    <div className="p-6 sm:p-8">{children}</div>
  </div>
);

const Actions = ({ onBack, onNext, nextLabel = "Continue", backLabel = "← Back", extraLeft, disabled }: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  extraLeft?: React.ReactNode;
  disabled?: boolean;
}) => (
  <div className="mt-8 pt-5 flex flex-wrap justify-between items-center gap-3" style={{ borderTop: "1px solid #e5e7eb" }}>
    <div className="flex gap-2">{extraLeft}</div>
    <div className="flex gap-2 ml-auto">
      {onBack && (
        <button
          onClick={onBack}
          className="px-5 py-2.5 font-bold uppercase tracking-wider text-foreground border border-border transition-all duration-200 hover:border-gray-400"
          style={{ borderRadius: 1, fontSize: "0.75em" }}
        >
          {backLabel}
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-6 py-2.5 font-bold uppercase tracking-wider text-white transition-all duration-200 disabled:opacity-60"
          style={{ backgroundColor: NAVY, borderRadius: 1, fontSize: "0.75em" }}
          onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"; }}
          onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.backgroundColor = NAVY; }}
        >
          {nextLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 0: DOCUMENT SELECTION
// ═══════════════════════════════════════════════════════════════════════════════
interface StepDocumentProps {
  docType: string;
  setDocType: (t: string) => void;
  error: string;
  onNext: () => void;
  onHome: () => void;
  tr: (k: string) => string;
  inputCls: string;
}

const DOC_TYPE_KEYS = [
  { type: "clearance",             bg: "#e8f0fe", icon: (cls: string) => <FileText   className={cls} /> },
  { type: "building-clearance",    bg: "#e8f8f0", icon: (cls: string) => <Building2  className={cls} /> },
  { type: "business-clearance",    bg: "#fef4e8", icon: (cls: string) => <Briefcase  className={cls} /> },
  { type: "barangay-certificate",  bg: "#f0e8fe", icon: (cls: string) => <ScrollText className={cls} /> },
];

const DOC_TR_KEYS: Record<string, { label: string; sub: string }> = {
  "clearance":             { label: "doc.clearance.label", sub: "doc.clearance.sub" },
  "building-clearance":    { label: "doc.building.label",  sub: "doc.building.sub"  },
  "business-clearance":    { label: "doc.business.label",  sub: "doc.business.sub"  },
  "barangay-certificate":  { label: "doc.bcert.label",     sub: "doc.bcert.sub"     },
};

const StepDocument = ({ docType, setDocType, error, onNext, onHome, tr }: StepDocumentProps) => {
  const [localError, setLocalError] = useState("");
  
  const handleNext = () => {
    if (!docType) {
      setLocalError(tr("err.selectDoc"));
    } else {
      setLocalError("");
      onNext();
    }
  };
  
  return (
    <Card eyebrow={tr("step1.eyebrow")} title={tr("step1.title")} subtitle={tr("step1.subtitle")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DOC_TYPE_KEYS.map((d) => {
          const keys = DOC_TR_KEYS[d.type];
          return (
            <button
              key={d.type}
              onClick={() => {
                setDocType(d.type);
                setLocalError("");
              }}
              className="flex items-center gap-3 p-4 text-left transition-all duration-150"
              style={{
                borderRadius: 2,
                border:       docType === d.type ? `1.5px solid ${NAVY}` : "1px solid #e5e7eb",
                background:   docType === d.type ? "#f0f4ff" : "transparent",
              }}
              aria-pressed={docType === d.type}
            >
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: d.bg, borderRadius: 4, color: NAVY }}>
                {d.icon("h-5 w-5")}
              </div>
              <div>
                <div className="font-bold text-foreground" style={{ fontSize: "0.9em" }}>{tr(keys.label)}</div>
                <div className="text-muted-foreground mt-0.5" style={{ fontSize: "0.78em" }}>{tr(keys.sub)}</div>
              </div>
              {docType === d.type && (
                <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: NAVY }}>
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {localError && <p className="mt-3" style={{ color: PINK, fontSize: "0.8em" }}>{localError}</p>}
      {error && !localError && <p className="mt-3" style={{ color: PINK, fontSize: "0.8em" }}>{error}</p>}
      <Actions
        extraLeft={
          <button
            onClick={onHome}
            className="px-5 py-2.5 font-bold uppercase tracking-wider text-foreground border border-border hover:border-gray-400 transition-all"
            style={{ borderRadius: 1, fontSize: "0.75em" }}
          >
            {tr("btn.backHome")}
          </button>
        }
        onNext={handleNext}
        nextLabel={tr("btn.continue")}
      />
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: PERSONAL INFORMATION
// ═══════════════════════════════════════════════════════════════════════════════
interface CommonStepProps {
  formData: Record<string, string>;
  set: (field: string, value: string) => void;
  error: string;
  onBack: () => void;
  onNext: () => void;
  tr: (k: string) => string;
  inputCls: string;
  docType: string;
}

const StepPersonal = ({ formData, set, error, onBack, onNext, tr, inputCls }: CommonStepProps) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const dateInputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (field: string, value: string) => {
    const textFields = ["first_name", "middle_name", "surname", "ext_name", "place_of_birth", "nickname", "religion", "name_of_spouse"];
    let processedValue = value;
    if (textFields.includes(field)) processedValue = toUpperCase(value);
    set(field, processedValue);

    let errorMsg = "";
    switch (field) {
      case "first_name":  errorMsg = validateName(processedValue, tr("field.firstName"), tr); break;
      case "surname":     errorMsg = validateName(processedValue, tr("field.Surname"), tr); break;
      case "date_of_birth":
        errorMsg = validateDob(processedValue, tr);
        if (!errorMsg && processedValue) {
          const dob = new Date(processedValue); const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
          if (age >= 0) set("age", String(age));
        }
        break;
      case "place_of_birth": errorMsg = validateRequired(processedValue, "Place of birth"); break;
      case "sex":            errorMsg = validateRequired(processedValue, "Sex"); break;
      case "marital_status": errorMsg = validateRequired(processedValue, "Marital status"); break;
      case "height_cm":      errorMsg = validatePositiveNumber(processedValue, "Height", tr, false); break;
      case "weight_kg":      errorMsg = validatePositiveNumber(processedValue, "Weight", tr, false); break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: errorMsg }));
  };

  // Handle calendar opening - set default date if field is empty
  const handleCalendarOpen = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.showPicker && !formData.date_of_birth) {
      // Set default adult date before opening calendar
      const defaultDate = getDefaultAdultDateString();
      validateAndSet("date_of_birth", defaultDate);
    }
  };

  // Alternative: Use the onClick event to pre-populate when clicking the calendar icon
  const handleDateInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!formData.date_of_birth) {
      const defaultDate = getDefaultAdultDateString();
      validateAndSet("date_of_birth", defaultDate);
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    newErrors.first_name     = validateName(formData.first_name || "", tr("field.firstName"), tr);
    newErrors.surname        = validateName(formData.surname || "", tr("field.Surname"), tr);
    newErrors.date_of_birth  = validateDob(formData.date_of_birth || "", tr);
    newErrors.place_of_birth = validateRequired(formData.place_of_birth || "", "Place of birth");
    setFieldErrors(newErrors);
    return !Object.values(newErrors).some(err => err);
  };

  const handleNext = () => {
    if (validateStep()) onNext();
    else toast.error(tr("err.fillRequired"));
  };

  return (
    <Card eyebrow={tr("step2.eyebrow")} title={tr("step2.title")} subtitle={tr("step2.subtitle")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <Field label={tr("field.prefix")}>
          <PrefixCombobox value={formData.prefix || ""} onChange={(v) => validateAndSet("prefix", v)} placeholder={tr("ph.prefix")} inputCls={inputCls} />
        </Field>
        <Field label={tr("field.extName")}>
          <MaskedInput value={formData.ext_name || ""} onValueChange={(v) => validateAndSet("ext_name", v)} placeholder={tr("ph.extName")} className={inputCls} style={{ borderColor: fieldErrors.ext_name ? PINK : "#d1d5db" }} />
        </Field>
        <Field label={`${tr("field.firstName")}`} error={fieldErrors.first_name} required>
          <MaskedInput value={formData.first_name || ""} onValueChange={(v) => validateAndSet("first_name", v)} placeholder={tr("ph.firstName")} className={inputCls} style={{ borderColor: fieldErrors.first_name ? PINK : "#d1d5db" }} />
        </Field>
        <Field label={tr("field.middleName")}>
          <MaskedInput value={formData.middle_name || ""} onValueChange={(v) => validateAndSet("middle_name", v)} placeholder={tr("ph.middleName")} className={inputCls} style={{ borderColor: fieldErrors.middle_name ? PINK : "#d1d5db" }} />
        </Field>
        <Field label={`${tr("field.Surname")}`} error={fieldErrors.surname} required>
          <MaskedInput value={formData.surname || ""} onValueChange={(v) => validateAndSet("surname", v)} placeholder={tr("ph.Surname")} className={inputCls} style={{ borderColor: fieldErrors.surname ? PINK : "#d1d5db" }} />
        </Field>
        <Field label={`${tr("field.dob")}`} error={fieldErrors.date_of_birth} required>
          <MaskedInput 
            type="date" 
            value={formData.date_of_birth || ""} 
            onValueChange={(v) => validateAndSet("date_of_birth", v)}
            onClick={handleDateInputClick}
            onFocus={handleDateInputClick}
            placeholder={tr("field.dob")} 
            className={inputCls} 
            style={{ borderColor: fieldErrors.date_of_birth ? PINK : "#d1d5db" }}
            ref={dateInputRef}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label={`${tr("field.pob")}`} error={fieldErrors.place_of_birth} required>
            <MaskedInput value={formData.place_of_birth || ""} onValueChange={(v) => validateAndSet("place_of_birth", v)} placeholder={tr("ph.pob")} className={inputCls} style={{ borderColor: fieldErrors.place_of_birth ? PINK : "#d1d5db" }} />
          </Field>
        </div>
      </div>
      {error && <p className="mt-3" style={{ color: PINK, fontSize: "0.8em" }}>{error}</p>}
      <Actions onBack={onBack} onNext={handleNext} nextLabel={tr("btn.continue")} backLabel={tr("btn.back")} />
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: ADDRESS & RESIDENCY
// ═══════════════════════════════════════════════════════════════════════════════
interface StepAddressProps extends CommonStepProps {
  streets: StreetRecord[];
}
interface StreetRecord { id: number; name: string; sitio?: string; formerly?: string | null; }

const StepAddress = ({ formData, set, streets, error, onBack, onNext, tr, inputCls, docType }: StepAddressProps) => {
  const streetNames = Array.from(new Set(streets.map((s) => s.name))).sort();
  const zoneOptions = Array.from(
    new Set(
      streets
        .filter((s) => s.name.trim().toLowerCase() === (formData.street ?? "").trim().toLowerCase())
        .map((s) => s.sitio ?? "")
        .filter((z) => z !== "")
    )
  ).sort();

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateAndSet = (field: string, value: string) => {
    const textFields = ["house_block_lot_no", "street", "zone", "house_owner", "resident_status", "precinct_no"];
    let processedValue = value;
    if (textFields.includes(field)) processedValue = toUpperCase(value);
    set(field, processedValue);

    let errorMsg = "";
    switch (field) {
      case "street":                 errorMsg = validateRequired(processedValue, "Street"); break;
      case "zone":                   errorMsg = validateRequired(processedValue, "Zone/Purok"); break;
      case "period_of_residency":    errorMsg = validatePeriodOfResidency(processedValue, tr); break;
      case "registered_voter":       errorMsg = validateRequired(processedValue, "Voter status"); break;
      case "house_owner":            errorMsg = validateRequired(processedValue, "House owner"); break;
      case "relationship_to_owner":  errorMsg = validateRequired(processedValue, "Relationship to owner"); break;
      case "house_block_lot_no":     errorMsg = validateRequired(processedValue, "House/Block/Lot number"); break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: errorMsg }));
  };

  const handleStreetChange = (val: string) => { validateAndSet("street", val); validateAndSet("zone", ""); };
  const addressPreview = [formData.house_block_lot_no, formData.street, formData.zone].filter(Boolean).join(", ");

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    newErrors.house_block_lot_no    = validateRequired(formData.house_block_lot_no || "", "House/Block/Lot number");
    newErrors.street                = validateRequired(formData.street || "", "Street");
    newErrors.zone                  = validateRequired(formData.zone || "", "Zone/Purok");
    newErrors.period_of_residency   = validatePeriodOfResidency(formData.period_of_residency || "", tr);
    newErrors.registered_voter      = validateRequired(formData.registered_voter || "", "Voter status");
    newErrors.house_owner           = validateRequired(formData.house_owner || "", "House owner");
    newErrors.relationship_to_owner = validateRequired(formData.relationship_to_owner || "", "Relationship to owner");
    setFieldErrors(newErrors);
    return !Object.values(newErrors).some(err => err);
  };

  const handleNext = () => {
    if (validateStep()) onNext();
    else toast.error(tr("err.fillAddress"));
  };

  return (
    <Card eyebrow={tr("step3.eyebrow")} title={tr("step3.title")} subtitle={tr("step3.subtitle")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <div className="md:col-span-2">
          <Field label={tr("field.houseUnit")} error={fieldErrors.house_block_lot_no} required>
            <MaskedInput value={formData.house_block_lot_no || ""} onValueChange={(v) => validateAndSet("house_block_lot_no", v)} placeholder={tr("ph.houseUnit")} className={inputCls} style={{ borderColor: fieldErrors.house_block_lot_no ? PINK : "#d1d5db" }} />
          </Field>
        </div>
        <Field label={`${tr("field.street")}`} error={fieldErrors.street} required>
          <Combobox value={formData.street || ""} onChange={handleStreetChange} options={streetNames} placeholder={tr("ph.street")} inputCls={inputCls} error={fieldErrors.street} />
        </Field>
        <Field label={`${tr("field.zone")}`} error={fieldErrors.zone} required>
          <Combobox value={formData.zone || ""} onChange={(v) => validateAndSet("zone", v)}
            options={zoneOptions} placeholder={formData.street ? tr("ph.zone") : tr("ph.zoneFirst")}
            disabled={!formData.street} inputCls={inputCls} error={fieldErrors.zone} />
        </Field>
        {addressPreview && (
          <div className="md:col-span-2 p-3 text-muted-foreground" style={{ background: "#f8faff", borderRadius: 4, border: "1px solid #dde3ed", fontSize: "0.82em" }}>
            <span className="font-bold uppercase tracking-wider" style={{ color: NAVY }}>{tr("addr.preview")} </span>
            {addressPreview}
          </div>
        )}
        <Field label={`${tr("field.residency")}`} error={fieldErrors.period_of_residency} required>
          <MaskedInput value={formData.period_of_residency || ""} onValueChange={(v) => validateAndSet("period_of_residency", v)} placeholder={tr("ph.residency")} className={inputCls} style={{ borderColor: fieldErrors.period_of_residency ? PINK : "#d1d5db" }} />
        </Field>
        <Field label={`${tr("field.voter")}`} error={fieldErrors.registered_voter} required>
          <SelectField value={formData.registered_voter || ""} onChange={(v) => validateAndSet("registered_voter", v)} inputCls={inputCls} error={fieldErrors.registered_voter}>
            <option value="">{tr("opt.select")}</option>
            <option value="Yes">{tr("opt.yes")}</option>
            <option value="No">{tr("opt.no")}</option>
          </SelectField>
        </Field>
        {formData.registered_voter === "Yes" && (
          <Field label={tr("field.precinctNo")}>
            <MaskedInput value={formData.precinct_no || ""} onValueChange={(v) => validateAndSet("precinct_no", v)} placeholder={tr("ph.precinctNo")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
          </Field>
        )}
        <Field label={`${tr("field.houseOwner")}`} error={fieldErrors.house_owner} required>
          <MaskedInput value={formData.house_owner || ""} onValueChange={(v) => validateAndSet("house_owner", v)} placeholder={tr("field.houseOwner")} className={inputCls} style={{ borderColor: fieldErrors.house_owner ? PINK : "#d1d5db" }} />
        </Field>
        <Field label={`${tr("field.relation")}`} error={fieldErrors.relationship_to_owner} required>
          <Select value={formData.relationship_to_owner || ""} onValueChange={(v) => validateAndSet("relationship_to_owner", v)}>
            <SelectTrigger className={inputCls} style={{ borderColor: fieldErrors.relationship_to_owner ? PINK : "#d1d5db" }}>
              <SelectValue placeholder={tr("opt.select")} />
            </SelectTrigger>
            <SelectContent>
              {["Owner","Spouse","Child","Parent","Sibling","Relative","Tenant","Boarder"].map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      {error && <p className="mt-3" style={{ color: PINK, fontSize: "0.8em" }}>{error}</p>}
      <Actions onBack={onBack} onNext={handleNext} nextLabel={tr("btn.continue")} backLabel={tr("btn.back")} />
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: CONTACT, PURPOSE & SERVICE-SPECIFIC FIELDS
// ═══════════════════════════════════════════════════════════════════════════════
const StepDetails = ({ formData, set, error, onBack, onNext, tr, inputCls, docType }: CommonStepProps) => {
  const isBusiness = docType === "business-clearance";
  const isBuilding = docType === "building-clearance";
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateAndSet = (field: string, value: string) => {
    const textFields = ["business_name", "business_type", "establishment", "occupation", "position", "employment_status", "notes", "purpose_details"];
    let processedValue = value;
    if (textFields.includes(field)) processedValue = toUpperCase(value);
    set(field, processedValue);

    let errorMsg = "";
    switch (field) {
      case "contact_number": errorMsg = validateContact(processedValue, tr); break;
      case "email":          errorMsg = validateEmail(processedValue, tr); break;
      case "purpose":        errorMsg = validateRequired(processedValue, "Purpose"); break;
      case "business_name":  if (isBusiness) errorMsg = validateRequired(processedValue, "Business name"); break;
      case "business_type":  if (isBusiness) errorMsg = validateRequired(processedValue, "Business type"); break;
      case "capital":        if (isBusiness) errorMsg = validatePositiveNumber(processedValue, "Capital", tr, false); break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: errorMsg }));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    newErrors.contact_number = validateContact(formData.contact_number || "", tr);
    if (formData.email?.trim()) newErrors.email = validateEmail(formData.email, tr);
    newErrors.purpose = validateRequired(formData.purpose || "", "Purpose");
    if (isBusiness) {
      newErrors.business_name = validateRequired(formData.business_name || "", "Business name");
      newErrors.business_type = validateRequired(formData.business_type || "", "Business type");
      if (formData.capital?.trim()) newErrors.capital = validatePositiveNumber(formData.capital, "Capital", tr, false);
    }
    setFieldErrors(newErrors);
    return !Object.values(newErrors).some(err => err);
  };

  const handleNext = () => {
    if (validateStep()) onNext();
    else toast.error(tr("err.fillRequired"));
  };

  return (
    <Card eyebrow={tr("step4.eyebrow")} title={tr("step4.title")} subtitle={tr("step4.subtitle")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <Field label={`${tr("field.contact")}`} error={fieldErrors.contact_number} required>
          <MaskedInput value={formData.contact_number || ""} onValueChange={(v) => validateAndSet("contact_number", v)} placeholder={tr("ph.contact")} className={inputCls} style={{ borderColor: fieldErrors.contact_number ? PINK : "#d1d5db" }} />
        </Field>
        <Field label={tr("field.email")} error={fieldErrors.email}>
          <MaskedInput value={formData.email || ""} onValueChange={(v) => validateAndSet("email", v)} placeholder={tr("ph.email")} className={inputCls} style={{ borderColor: fieldErrors.email ? PINK : "#d1d5db" }} />
        </Field>
        <div className="md:col-span-2">
          <Field label={`${tr("field.purpose")}`} error={fieldErrors.purpose} required>
            <Select value={formData.purpose || ""} onValueChange={(v) => validateAndSet("purpose", v)}>
              <SelectTrigger className={inputCls} style={{ borderColor: fieldErrors.purpose ? PINK : "#d1d5db" }}>
                <SelectValue placeholder={tr("ph.purpose")} />
              </SelectTrigger>
              <SelectContent>
                {["Employment", "Business", "Travel", "Legal Purposes", "School Requirement", "Bank Transaction", "Other"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Purpose Details (Optional)">
            <textarea value={formData.purpose_details || ""} onChange={(e) => set("purpose_details", e.target.value)}
              placeholder="Provide additional details about your purpose…" rows={3}
              className={inputCls} style={{ resize: "vertical", fontSize: "inherit" }} />
          </Field>
        </div>
        {isBusiness && (
          <>
            <Field label={`${tr("field.businessName")}`} error={fieldErrors.business_name} required>
              <MaskedInput value={formData.business_name || ""} onValueChange={(v) => validateAndSet("business_name", v)} placeholder={tr("ph.businessName")} className={inputCls} style={{ borderColor: fieldErrors.business_name ? PINK : "#d1d5db" }} />
            </Field>
            <Field label={`${tr("field.businessType")}`} error={fieldErrors.business_type} required>
              <Combobox value={formData.business_type || ""} onChange={(v) => validateAndSet("business_type", v)}
                options={["Retail","Food & Beverage","Services","Manufacturing","Construction","Transportation","Other"]}
                placeholder={tr("ph.businessType")} inputCls={inputCls} error={fieldErrors.business_type} />
            </Field>
            <Field label={tr("field.capital")} error={fieldErrors.capital}>
              <MaskedInput value={formData.capital || ""} onValueChange={(v) => validateAndSet("capital", v)} placeholder={tr("ph.capital")} className={inputCls} style={{ borderColor: fieldErrors.capital ? PINK : "#d1d5db" }} />
            </Field>
          </>
        )}
        {isBuilding && (
          <Field label={tr("field.establishment")}>
            <MaskedInput value={formData.establishment || ""} onValueChange={(v) => validateAndSet("establishment", v)} placeholder={tr("ph.establishment")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
          </Field>
        )}
      </div>
      {error && <p className="mt-3" style={{ color: PINK, fontSize: "0.8em" }}>{error}</p>}
      <Actions onBack={onBack} onNext={handleNext} nextLabel={tr("btn.continue")} backLabel={tr("btn.back")} />
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: REVIEW  (was Step 5, now Step 4 — schedule removed from UI)
// ═══════════════════════════════════════════════════════════════════════════════
interface StepReviewProps {
  docType: string;
  formData: Record<string, string>;
  consentChecked: boolean;
  setConsentChecked: (v: boolean) => void;
  error: string;
  onBack: () => void;
  onSubmit: () => void;
  onEdit: () => void; 
  tr: (k: string) => string;
  isSubmitting: boolean;
}

const StepReview = ({
  docType, formData,
  consentChecked, setConsentChecked, error, onBack, onSubmit, onEdit, tr, isSubmitting,
}: StepReviewProps) => {
  const docKeys   = docType ? DOC_TR_KEYS[docType] : null;
  const docConfig = DOC_TYPE_KEYS.find((d) => d.type === docType);
  const isBusiness = docType === "business-clearance";
  const isBuilding = docType === "building-clearance";
  const isBCert    = docType === "barangay-certificate";
  const addressPreview = [formData.house_block_lot_no, formData.street, formData.zone].filter(Boolean).join(", ");

  return (
    <Card eyebrow={tr("step5.eyebrow")} title={tr("step5.title")} subtitle={tr("step5.subtitle")}>
      {docKeys && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 font-bold uppercase tracking-wider"
          style={{ background: "#f0f4ff", border: "1px solid #dde3ed", borderRadius: 4, color: NAVY, fontSize: "0.75em" }}>
          {docConfig?.icon("h-4 w-4")}
          {tr(docKeys.label)}
        </div>
      )}

      <ReviewSection title={tr("review.personal")}>
        <ReviewRow label={tr("review.firstName")}  value={formData.first_name} />
        <ReviewRow label={tr("review.middleName")} value={formData.middle_name || "N/A"} />
        <ReviewRow label={tr("review.Surname")}    value={formData.surname} />
        <ReviewRow label={tr("review.dob")}        value={formData.date_of_birth} />
        <div className="col-span-2"><ReviewRow label={tr("review.pob")} value={formData.place_of_birth} /></div>
      </ReviewSection>

      <ReviewSection title={tr("review.address")}>
        <div className="col-span-2"><ReviewRow label="Full address" value={addressPreview} /></div>
        <ReviewRow label={tr("review.street")}    value={formData.street} />
        <ReviewRow label={tr("review.zone")}      value={formData.zone} />
        <ReviewRow label={tr("review.residency")} value={formData.period_of_residency} />
        <ReviewRow label={tr("review.voter")}     value={formData.registered_voter} />
        {formData.precinct_no && <ReviewRow label={tr("review.precinctNo")} value={formData.precinct_no} />}
        <ReviewRow label={tr("review.houseOwner")} value={formData.house_owner} />
        <ReviewRow label={tr("review.relation")}   value={formData.relationship_to_owner} />
      </ReviewSection>

      <ReviewSection title={tr("review.contact")}>
        <ReviewRow label={tr("review.contact")} value={formData.contact_number} />
        <ReviewRow label={tr("review.purpose")} value={formData.purpose} />
        {isBusiness && (
          <>
            <ReviewRow label={tr("field.businessName")} value={formData.business_name} />
            <ReviewRow label={tr("field.businessType")} value={formData.business_type} />
            <ReviewRow label={tr("field.capital")}      value={formData.capital} />
          </>
        )}
        {isBuilding && <ReviewRow label={tr("field.establishment")} value={formData.establishment} />}
        {isBCert    && <ReviewRow label={tr("field.bcertNumber")}   value={formData.bcert_number} />}
        <ReviewRow label={tr("review.email")} value={formData.email} />
      </ReviewSection>

      {error && <p className="mb-3" style={{ color: PINK, fontSize: "0.8em" }}>{error}</p>}

      <Actions
        onBack={onBack}
        onNext={onSubmit}
        nextLabel={isSubmitting ? "Submitting…" : tr("btn.submit")}
        backLabel={tr("btn.back")}
        disabled={isSubmitting}
        extraLeft={
          <button
            onClick={onEdit}
            className="px-5 py-2.5 font-bold uppercase tracking-wider transition-all duration-200"
            style={{ border: `1px solid ${PINK}`, color: PINK, borderRadius: 1, fontSize: "0.75em" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#fdf5f8")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
          >
            {tr("btn.edit")}
          </button>
        }
      />
    </Card>
  );
};

// ─── Success screen ────────────────────────────────────────────────────────────
interface SuccessScreenProps {
  onReset: () => void;
  tr: (k: string) => string;
  bcertNumber: string | null;
  serviceLabel: string;
  applicantName: string;
  autoResetSeconds: number;
}

const SuccessScreen = ({
  onReset, tr, bcertNumber, serviceLabel, applicantName, autoResetSeconds,
}: SuccessScreenProps) => {
  // Live countdown so the resident can see how long until the kiosk resets.
  // Drives the visible "Returning to home in Ns" text. The actual reset is
  // triggered by the parent's auto-reset timer; we only mirror the value
  // here for display.
  const [secondsLeft, setSecondsLeft] = useState(autoResetSeconds);
  useEffect(() => {
    setSecondsLeft(autoResetSeconds);
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [autoResetSeconds]);

  return (
    <div
      className="bg-card border border-border overflow-hidden text-center py-12 px-8"
      style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: PINK }}
      role="alert"
      aria-live="polite"
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#e8f0fe" }}>
        <Check className="h-6 w-6" style={{ color: NAVY }} />
      </div>
      <h2 className="font-bold mb-2" style={{ fontFamily: "'Georgia', serif", color: NAVY, fontSize: "1.3em" }}>
        {tr("success.title")}
      </h2>
      <p className="text-muted-foreground mb-6" style={{ fontSize: "0.9em" }}>{tr("success.sub")}</p>

      {bcertNumber && (
        <div
          className="inline-flex flex-col items-center px-6 py-4 mb-6"
          style={{ background: "#f8faff", border: `1px solid ${NAVY}22`, borderRadius: 4 }}
        >
          <span className="font-bold uppercase tracking-[0.18em]" style={{ color: PINK, fontSize: "0.6em" }}>
            {tr("success.refLabel")}
          </span>
          <span
            className="font-bold mt-1"
            style={{ color: NAVY, fontFamily: "'Georgia', serif", fontSize: "1.4em", letterSpacing: "0.04em" }}
          >
            {bcertNumber}
          </span>
          {(applicantName || serviceLabel) && (
            <span className="text-muted-foreground mt-2" style={{ fontSize: "0.78em" }}>
              {applicantName}{applicantName && serviceLabel ? " · " : ""}{serviceLabel}
            </span>
          )}
        </div>
      )}

      <p className="text-muted-foreground mb-4" style={{ fontSize: "0.78em" }}>
        {tr("success.autoReset").replace("{n}", String(secondsLeft))}
      </p>

      <button
        onClick={onReset}
        className="px-6 py-2.5 font-bold uppercase tracking-wider text-white transition-all duration-200"
        style={{ backgroundColor: NAVY, borderRadius: 1, fontSize: "0.8em" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = NAVY)}
      >
        {tr("btn.newRequest")}
      </button>
    </div>
  );
};

// ─── Step Bar (now 5 steps) ────────────────────────────────────────────────────
interface StepBarProps { currentStep: number; steps: string[]; }
const StepBar = ({ currentStep, steps }: StepBarProps) => (
  <div className="flex items-center mb-8" role="navigation" aria-label="Form steps">
    {steps.map((label, i) => {
      const done = i < currentStep, active = i === currentStep;
      return (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all duration-200 z-10"
              style={{
                fontSize:   "0.7em",
                background: done ? PINK : active ? NAVY : "transparent",
                border:     `2px solid ${done ? PINK : active ? NAVY : "#d1d5db"}`,
                color:      done || active ? "#fff" : "#9ca3af",
              }}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span
              className="mt-1.5 font-bold uppercase tracking-wider hidden sm:block"
              style={{ color: done ? PINK : active ? NAVY : "#9ca3af", fontSize: "0.62em" }}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="h-0.5 flex-1 -mx-2 relative top-[-9px] sm:top-[-18px]"
              style={{ background: i < currentStep ? PINK : "#e5e7eb" }}
            />
          )}
        </div>
      );
    })}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const FrontDesk = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Yes-flow handoff: SearchResident.tsx pushes a normalised `prefill` blob
  // into router state when a returning resident is matched. Pull it once on
  // mount; subsequent renders keep working off `formData`.
  const initialPrefill = useMemo<Record<string, string> | null>(() => {
    const state = location.state as { prefill?: Record<string, string> } | null;
    const p = state?.prefill;
    if (p && typeof p === "object" && Object.keys(p).length > 0) return p;
    return null;
  }, [location.state]);

  const [lang, setLang]         = useState<Lang>(() => (localStorage.getItem(LS_LANG) as Lang) || "en");
  const [fontSize, setFontSize] = useState<FontSize>(() => (localStorage.getItem(LS_FONT) as FontSize) || "md");
  const tr = useCallback((k: string) => TRANSLATIONS[lang][k] ?? k, [lang]);

  const inputCls =
    "w-full bg-transparent border-0 border-b py-2.5 text-foreground placeholder-gray-400 focus:outline-none transition-colors duration-200";

  // 5 steps now (schedule removed from UI)
  const STEPS_TR = useMemo(() => [
    tr("step.document"),
    tr("step.personal"),
    tr("step.address"),
    tr("step.details"),
    tr("step.review"),
  ], [tr]);

  // ── App stage ──────────────────────────────────────────────────────────────
  // Prefilled residents skip the welcome / privacy gate and land directly on
  // the document picker so they can pick a service and breeze through the
  // pre-populated steps. Fresh residents still see the welcome screen.
  const [stage, setStage]                   = useState<"welcome" | "form">(
    initialPrefill ? "form" : "welcome"
  );

  // ── Form state ─────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep]       = useState(0);
  const [docType, setDocType]               = useState("");
  const [formData, setFormData]             = useState<Record<string, string>>(
    () => initialPrefill ?? {}
  );
  // Already-consented Yes-flow residents inherit the privacy acknowledgement
  // they accepted on the previous submission so they don't have to re-tick
  // the review-step consent box.
  const [consentChecked, setConsentChecked] = useState(initialPrefill !== null);
  const [errors, setErrors]                 = useState("");
  const [submitted, setSubmitted]           = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [streets, setStreets]               = useState<StreetRecord[]>([]);
  const [bcertNumber, setBcertNumber]       = useState<string | null>(null);

  // ── Fetch streets ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("api/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) { console.error("Failed to fetch streets:", e); }
    };
    load();
  }, []);

  // ── Stable field setter ────────────────────────────────────────────────────
  const set = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ── Step navigation ────────────────────────────────────────────────────────
  const goNext = useCallback(() => { setErrors(""); setCurrentStep((s) => s + 1); }, []);
  const goBack = useCallback(() => { setErrors(""); setCurrentStep((s) => s - 1); }, []);

  // ── Submit — schedule auto-computed from wall-clock time at submission ─────
  const handleSubmit = useCallback(async () => {
    if (!consentChecked) { setErrors(tr("err.consent")); return; }
  
    // ── Derive schedule values at the moment of submission ──────────────────
    const submissionTimeGroup = getAutoTimeGroup();
    const submissionDate      = getTodayDateString();
  
    setIsSubmitting(true);
  
    // ── Build base payload ──────────────────────────────────────────────────
    const base = {
      requester_type:        "Walk-in",
      prefix:                formData.prefix         || null,
      surname:               formData.surname        || "",
      first_name:            formData.first_name     || "",
      middle_name:           formData.middle_name    || null,
      ext_name:              formData.ext_name       || null,
      extension:             formData.ext_name       || null,
      dob:                   formData.date_of_birth  || null,
      pob:                   formData.place_of_birth || null,
      age:                   formData.age ? Number(formData.age) : null,
      contact_no:            formData.contact_number || "",
      email:                 formData.email          || null,
      house_block_lot_no:    formData.house_block_lot_no    || null,
      street:                formData.street                || "",
      zone:                  formData.zone                  || "",
      period_of_residency:   formData.period_of_residency   || null,
      registered_voter:      formData.registered_voter      || null,
      house_owner:           formData.house_owner           || null,
      relationship_to_owner: formData.relationship_to_owner || null,
      purpose:               formData.purpose               || "",
      purpose_details:       formData.purpose_details       || null,
    };
  
    // ── Pick endpoint per document type ────────────────────────────────────
    type EndpointCfg = { url: string; payload: Record<string, unknown> };
    let cfg: EndpointCfg;
  
    switch (docType) {
      case "clearance":
        cfg = {
          url: "api/barangay-clearances",
          payload: { ...base, ctc_vrr_no: null, issued_at: null, issued_on: null, or_no: null },
        };
        break;
      case "building-clearance":
        cfg = {
          url: "api/building-clearances",
          payload: {
            ...base,
            establishment:           formData.establishment || null,
            purpose:                 formData.purpose       || "New Construction",
            purpose_details:         formData.purpose_details || null,
            or_no: null, remarks: null, punong_barangay: null,
            for_the_punong_barangay: null, barangay_position: null,
          },
        };
        break;
      case "business-clearance":
        cfg = {
          url: "api/business-clearances",
          payload: {
            ...base,
            ext:              formData.ext_name      || null,
            business_name:    formData.business_name || null,
            business_type:    formData.business_type || null,
            business_details: formData.purpose_details || null,
            capital:          formData.capital ? Number(formData.capital) : null,
            or_no: null, inspected_by: null, date_of_inspection: null,
            inspection_remarks: null, inspected_remarks: null,
            date_inspected: null, inspected_note: null,
          },
        };
        break;
      case "barangay-certificate":
        cfg = {
          url: "api/barangay-certificates",
          payload: {
            ...base,
            extension:               formData.ext_name || null,
            punong_barangay:         null,
            for_the_punong_barangay: null,
            bcert_number:            "Example",
            issued_date:             null,
          },
        };
        break;
      default:
        cfg = {
          url: "api/barangay-clearances",
          payload: { ...base, ctc_vrr_no: null, issued_at: null, issued_on: null, or_no: null },
        };
        break;
    }
  
    try {
      // ── Step 1: Submit the document ────────────────────────────────────────
      const docRes = await api.post(cfg.url, cfg.payload, { withCredentials: true });
  
      if (docRes.status === 201 || docRes.status === 200) {
        // ✅ FIX: Extract document number based on document type
        const service = docRes.data?.data?.service;
        let documentNumber: string | null = null;
  
        if (docType === "business-clearance") {
          documentNumber = service?.brgy_business_no ?? null;
        } else if (docType === "building-clearance") {
          documentNumber = service?.bcert_number ?? null;
        } else if (docType === "barangay-certificate") {
          documentNumber = service?.bcert_number ?? null;
        } else {
          
          documentNumber = service?.bcert_number ?? null;
        }
  
        const documentType   = DOC_TYPE_TO_SCHEDULE_TYPE[docType] ?? "barangay_clearance";
  
        // ── Step 2: Auto-schedule based on wall-clock time at submission ────
        if (docType !== "business-clearance") {
          try {
            await api.post(
              "api/schedules",
              {
                document_type:   documentType,
                document_number: documentNumber,
                schedule_date:   submissionDate,   // today
                time_group:      submissionTimeGroup, // "morning" or "afternoon"
              },
              { withCredentials: true }
            );
          } catch (schedErr) {
            // Non-blocking — document already submitted successfully
            console.error("Auto-schedule creation failed:", schedErr);
          }
        }
  
        // ── Step 3: Persist the resident's profile so future Yes-flow lookups
        // (FN/LN/DOB) auto-fill every step. We mirror to localStorage (keyed
        // by normalised FN|LN|DOB so SearchResident.tsx finds it) AND, best-
        // effort, push to a backend endpoint so the lookup survives across
        // browsers / kiosks. Both writes are non-blocking.
        const fn  = formData.first_name    || "";
        const ln  = formData.surname       || formData.last_name || "";
        const dob = formData.date_of_birth || "";
        if (fn && ln && dob) {
          const profileSnapshot: Record<string, string> = {};
          Object.entries(formData).forEach(([k, v]) => {
            if (v !== undefined && v !== null && String(v).trim() !== "") {
              profileSnapshot[k] = String(v);
            }
          });
          // Make sure both surname and last_name keys are populated so
          // either spelling resolves on the next lookup.
          if (!profileSnapshot.surname    && profileSnapshot.last_name)  profileSnapshot.surname   = profileSnapshot.last_name;
          if (!profileSnapshot.last_name  && profileSnapshot.surname)    profileSnapshot.last_name = profileSnapshot.surname;

          try {
            window.localStorage.setItem(
              makeKioskCacheKey(fn, ln, dob),
              JSON.stringify(profileSnapshot),
            );
          } catch (lsErr) {
            console.error("Local kiosk profile cache failed:", lsErr);
          }

          try {
            // Backend resident schema validates `surname`, not `last_name`,
            // so we send `surname` here to keep the kiosk-profile upsert
            // aligned with the kiosk-search lookup payload.
            await api.post(
              "api/kiosk/profile",
              { first_name: fn, surname: ln, date_of_birth: dob, payload: profileSnapshot },
              { withCredentials: true },
            );
          } catch (profileErr) {
            // Non-blocking — local cache still works for next Yes-flow.
            console.error("Backend kiosk profile save failed:", profileErr);
          }
        }

        setBcertNumber(documentNumber);
        toast.success(tr("success.title"));
        setSubmitted(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || tr("err.fillRequired"));
    } finally {
      setIsSubmitting(false);
    }
  }, [consentChecked, docType, formData, tr]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setCurrentStep(0); setDocType(""); setFormData({});
    setConsentChecked(false); setErrors(""); setSubmitted(false);
    setBcertNumber(null);
    setStage("welcome");
    // Also bounce back to the SearchResident landing page so the next
    // resident starts on the Yes/No prompt instead of the privacy gate.
    navigate(KIOSK_WELCOME_ROUTE, { replace: true });
  }, [navigate]);

  // ── Auto-reset after success ────────────────────────────────────────────────
  // The success screen shows a live countdown; this timer is the source of
  // truth that actually fires the reset. Cleared if the resident hits
  // "Start new request" early.
  useEffect(() => {
    if (!submitted) return;
    const id = setTimeout(() => { handleReset(); }, SUCCESS_AUTO_RESET_MS);
    return () => clearTimeout(id);
  }, [submitted, handleReset]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (stage === "welcome") {
    return (
      <div style={{ fontSize: `${FONT_SCALE[fontSize].scale}rem` }}>
        <AccessibilityBar lang={lang} setLang={setLang} fontSize={fontSize} setFontSize={setFontSize} />
        <WelcomeScreen tr={tr} onProceed={() => { setConsentChecked(true); setStage("form"); }} />
      </div>
    );
  }

  return (
    <div style={{ fontSize: `${FONT_SCALE[fontSize].scale}rem` }}>
      <AccessibilityBar lang={lang} setLang={setLang} fontSize={fontSize} setFontSize={setFontSize} />

      <main className="min-h-screen bg-background py-10 px-4">
        <div className="container max-w-3xl mx-auto">

          <div className="text-center mb-10">
            <p className="font-bold uppercase tracking-[0.20em] mb-2" style={{ color: PINK, fontSize: "0.72em" }}>
              Republic of the Philippines · Barangay West Rembo
            </p>
            <h1
              className="font-bold text-foreground mb-2"
              style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
            >
              {tr("header.title")}
            </h1>
            <div style={{ width: 48, height: 2, backgroundColor: PINK, margin: "10px auto 12px" }} />
            <p className="text-muted-foreground" style={{ fontSize: "0.88em" }}>{tr("header.subtitle")}</p>
          </div>

          {!submitted && <StepBar currentStep={currentStep} steps={STEPS_TR} />}

          {submitted ? (
            <SuccessScreen
              onReset={handleReset}
              tr={tr}
              bcertNumber={bcertNumber}
              serviceLabel={getServiceType(docType)}
              applicantName={[formData.first_name, formData.surname || formData.last_name].filter(Boolean).join(" ").trim()}
              autoResetSeconds={Math.round(SUCCESS_AUTO_RESET_MS / 1000)}
            />

          ) : currentStep === 0 ? (
            <StepDocument
              docType={docType} setDocType={setDocType}
              error={errors} onNext={goNext}
              onHome={() => navigate("/frontdesk")}
              tr={tr} inputCls={inputCls}
            />

          ) : currentStep === 1 ? (
            <StepPersonal
              formData={formData} set={set} error={errors}
              onBack={goBack} onNext={goNext}
              tr={tr} inputCls={inputCls} docType={docType}
            />

          ) : currentStep === 2 ? (
            <StepAddress
              formData={formData} set={set}
              streets={streets} error={errors}
              onBack={goBack} onNext={goNext}
              tr={tr} inputCls={inputCls} docType={docType}
            />

          ) : currentStep === 3 ? (
            <StepDetails
              formData={formData} set={set} error={errors}
              onBack={goBack} onNext={goNext}
              tr={tr} inputCls={inputCls} docType={docType}
            />

          ) : (
            <StepReview
              docType={docType} formData={formData}
              consentChecked={consentChecked} setConsentChecked={setConsentChecked}
              error={errors} onBack={goBack} onSubmit={handleSubmit}
              onEdit={() => { setCurrentStep(0); setErrors(""); }}
              tr={tr}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default FrontDesk;