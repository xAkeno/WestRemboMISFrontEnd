import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentType, BarangayDocument } from "@/types/BarangayDocument";
import { toast } from "sonner";
import {
  FileText, Building2, Briefcase, Users, Check,
  ChevronRight, ChevronDown, X, Type, Globe,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MaskedInput } from "@/components/MaskedInput";

// ─── Brand tokens ──────────────────────────────────────────────────────────────
const NAVY = "#0f2a5e";
const PINK = "#c2467d";

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════════
type Lang = "en" | "tl" | "ceb";

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    "a11y.language":          "Language",
    "a11y.fontSize":          "Text size",
    "a11y.small":             "A",
    "a11y.medium":            "A",
    "a11y.large":             "A",
    "a11y.xlarge":            "A",
    "a11y.lang.en":           "English",
    "a11y.lang.tl":           "Filipino",
    "a11y.lang.ceb":          "Bisaya",
    "header.title":           "Document Request Kiosk",
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
    "doc.resident.label":     "Resident Certificate",
    "doc.resident.sub":       "Proof of residency",
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
    "field.firstName":        "First name",
    "field.middleName":       "Middle name",
    "field.Surname":         "Last name",
    "field.dob":              "Date of birth",
    "field.pob":              "Place of birth",
    "field.houseUnit":        "House no. / Unit / Building",
    "field.street":           "Street",
    "field.zone":             "Zone",
    "field.fullAddress":      "Full address",
    "field.residency":        "Period of residency",
    "field.voter":            "Registered voter?",
    "field.houseOwner":       "House owner",
    "field.relation":         "Relation to owner",
    "field.contact":          "Contact number",
    "field.purpose":          "Purpose of request",
    "ph.firstName":           "e.g. Juan",
    "ph.middleName":          "Optional",
    "ph.Surname":            "e.g. Dela Cruz",
    "ph.pob":                 "City/Municipality, Province",
    "ph.houseUnit":           "e.g. 123 or Unit 4B",
    "ph.street":              "Select or type street…",
    "ph.zone":                "Select zone…",
    "ph.zoneFirst":           "Select a street first",
    "ph.residency":           "e.g. 5 years",
    "ph.contact":             "09XX XXX XXXX",
    "ph.purpose":             "e.g. Employment, Loan",
    "opt.select":             "Select…",
    "opt.yes":                "Yes",
    "opt.no":                 "No",
    "review.personal":        "Personal information",
    "review.address":         "Address & residency",
    "review.contact":         "Contact & purpose",
    "review.firstName":       "First name",
    "review.middleName":      "Middle name",
    "review.Surname":        "Last name",
    "review.dob":             "Date of birth",
    "review.pob":             "Place of birth",
    "review.fullAddress":     "Full address",
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
    "success.sub":            "Your document request has been received. Please wait for processing.",
    "addr.preview":           "Full address:",
  },

  tl: {
    "a11y.language":          "Wika",
    "a11y.fontSize":          "Laki ng teksto",
    "a11y.small":             "A",
    "a11y.medium":            "A",
    "a11y.large":             "A",
    "a11y.xlarge":            "A",
    "a11y.lang.en":           "Ingles",
    "a11y.lang.tl":           "Filipino",
    "a11y.lang.ceb":          "Bisaya",
    "header.title":           "Kiosk ng Kahilingan ng Dokumento",
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
    "doc.resident.label":     "Sertipiko ng Residente",
    "doc.resident.sub":       "Patunay ng paninirahan",
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
    "field.firstName":        "Unang pangalan",
    "field.middleName":       "Gitnang pangalan",
    "field.Surname":         "Apelyido",
    "field.dob":              "Petsa ng kapanganakan",
    "field.pob":              "Lugar ng kapanganakan",
    "field.houseUnit":        "Blg. ng bahay / Unit / Gusali",
    "field.street":           "Kalye",
    "field.zone":             "Zone",
    "field.fullAddress":      "Buong tirahan",
    "field.residency":        "Tagal ng paninirahan",
    "field.voter":            "Rehistradong botante?",
    "field.houseOwner":       "May-ari ng bahay",
    "field.relation":         "Relasyon sa may-ari",
    "field.contact":          "Numero sa pakikipag-ugnayan",
    "field.purpose":          "Layunin ng kahilingan",
    "ph.firstName":           "hal. Juan",
    "ph.middleName":          "Opsyonal",
    "ph.Surname":            "hal. Dela Cruz",
    "ph.pob":                 "Lungsod/Munisipalidad, Lalawigan",
    "ph.houseUnit":           "hal. 123 o Unit 4B",
    "ph.street":              "Piliin o i-type ang kalye…",
    "ph.zone":                "Piliin ang zone…",
    "ph.zoneFirst":           "Piliin muna ang kalye",
    "ph.residency":           "hal. 5 taon",
    "ph.contact":             "09XX XXX XXXX",
    "ph.purpose":             "hal. Trabaho, Pautang",
    "opt.select":             "Piliin…",
    "opt.yes":                "Oo",
    "opt.no":                 "Hindi",
    "review.personal":        "Personal na impormasyon",
    "review.address":         "Tirahan at paninirahan",
    "review.contact":         "Pakikipag-ugnayan at layunin",
    "review.firstName":       "Unang pangalan",
    "review.middleName":      "Gitnang pangalan",
    "review.Surname":        "Apelyido",
    "review.dob":             "Petsa ng kapanganakan",
    "review.pob":             "Lugar ng kapanganakan",
    "review.fullAddress":     "Buong tirahan",
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
    "addr.preview":           "Buong tirahan:",
  },

  ceb: {
    "a11y.language":          "Pinulongan",
    "a11y.fontSize":          "Gidak-on sa teksto",
    "a11y.small":             "A",
    "a11y.medium":            "A",
    "a11y.large":             "A",
    "a11y.xlarge":            "A",
    "a11y.lang.en":           "Ingles",
    "a11y.lang.tl":           "Filipino",
    "a11y.lang.ceb":          "Bisaya",
    "header.title":           "Kiosk sa Pagsugo og Dokumento",
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
    "doc.resident.label":     "Sertipiko sa Residente",
    "doc.resident.sub":       "Patunay sa pagpuyo",
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
    "field.firstName":        "Una nga ngalan",
    "field.middleName":       "Tungatunga nga ngalan",
    "field.Surname":         "Apelyido",
    "field.dob":              "Petsa sa pagkatawo",
    "field.pob":              "Lugar sa pagkatawo",
    "field.houseUnit":        "Blg. sa balay / Unit / Bilding",
    "field.street":           "Karsada",
    "field.zone":             "Zone",
    "field.fullAddress":      "Tibuok adres",
    "field.residency":        "Gidugayon sa pagpuyo",
    "field.voter":            "Rehistradong botante?",
    "field.houseOwner":       "Tag-iya sa balay",
    "field.relation":         "Relasyon sa tag-iya",
    "field.contact":          "Numero sa kontak",
    "field.purpose":          "Katuyoan sa hangyo",
    "ph.firstName":           "hal. Juan",
    "ph.middleName":          "Opsyonal",
    "ph.Surname":            "hal. Dela Cruz",
    "ph.pob":                 "Siyudad/Munisipyo, Probinsya",
    "ph.houseUnit":           "hal. 123 o Unit 4B",
    "ph.street":              "Pilia o i-type ang karsada…",
    "ph.zone":                "Pilia ang zone…",
    "ph.zoneFirst":           "Pilia una ang karsada",
    "ph.residency":           "hal. 5 ka tuig",
    "ph.contact":             "09XX XXX XXXX",
    "ph.purpose":             "hal. Trabaho, Pautang",
    "opt.select":             "Pilia…",
    "opt.yes":                "Oo",
    "opt.no":                 "Dili",
    "review.personal":        "Personal nga impormasyon",
    "review.address":         "Adres ug pagpuyo",
    "review.contact":         "Kontak ug katuyoan",
    "review.firstName":       "Una nga ngalan",
    "review.middleName":      "Tungatunga nga ngalan",
    "review.Surname":        "Apelyido",
    "review.dob":             "Petsa sa pagkatawo",
    "review.pob":             "Lugar sa pagkatawo",
    "review.fullAddress":     "Tibuok adres",
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
    "err.selectDoc":          "Palihug pilia ang matang sa dokumento.",
    "err.fillRequired":       "Palihug pun-a ang tanan nga gikinahanglang field.",
    "err.fillAddress":        "Palihug pun-a ang tanan nga gikinahanglang field lakip ang karsada ug zone.",
    "err.consent":            "Palihug dawata ang pahintulot sa privacy sa data aron magpadayon.",
    "success.title":          "Naisumite na ang hangyo!",
    "success.sub":            "Nadawat na ang imong hangyo sa dokumento. Palihug maghulat sa pagproseso.",
    "addr.preview":           "Tibuok adres:",
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
// PURE UI HELPERS  (module-level — stable identity, no focus-loss on re-render)
// ═══════════════════════════════════════════════════════════════════════════════
const labelCls = "block font-bold uppercase tracking-[0.14em] mb-1";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className={labelCls} style={{ color: PINK, fontSize: "0.65em" }}>{label}</label>
    {children}
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

// ─── Combobox ─────────────────────────────────────────────────────────────────
interface ComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  inputCls: string;
}

const Combobox = ({ value, onChange, options, placeholder = "Select or type…", disabled, inputCls }: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const select = (opt: string) => { setQuery(opt); onChange(opt); setOpen(false); };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v); onChange(v); setOpen(true);
  };
  const clear = () => { setQuery(""); onChange(""); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <div className="relative flex items-center">
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputCls} pr-12`}
          style={{ borderColor: open ? PINK : "#d1d5db" }}
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
        <div className="absolute right-0 flex items-center gap-0.5 pb-1">
          {query && (
            <button type="button" onClick={clear} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Clear">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setOpen((o) => !o)}
            className="p-1 text-gray-400"
            disabled={disabled}
            aria-label="Toggle dropdown"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto"
          style={{ borderRadius: 4, fontSize: "inherit" }}
        >
          {filtered.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
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

// ─── Card shell ────────────────────────────────────────────────────────────────
const Card = ({ eyebrow, title, subtitle, children }: {
  eyebrow: string; title: string; subtitle?: string; children: React.ReactNode;
}) => (
  <div
    className="bg-card border border-border overflow-hidden"
    style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: PINK }}
  >
    <div className="px-8 pt-6 pb-5" style={{ borderBottom: "1px solid #e5e7eb" }}>
      <p className="font-bold uppercase tracking-[0.16em] mb-1" style={{ color: PINK, fontSize: "0.65em" }}>{eyebrow}</p>
      <h2 className="font-bold text-foreground" style={{ fontFamily: "'Georgia', serif", fontSize: "1.25em" }}>{title}</h2>
      {subtitle && <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85em" }}>{subtitle}</p>}
    </div>
    <div className="p-6 sm:p-8">{children}</div>
  </div>
);

// ─── Action bar ────────────────────────────────────────────────────────────────
// FIX: Accept backLabel so translated "← Back" is used instead of the old hardcoded string
const Actions = ({ onBack, onNext, nextLabel = "Continue", backLabel = "← Back", extraLeft }: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  extraLeft?: React.ReactNode;
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
          className="inline-flex items-center gap-2 px-6 py-2.5 font-bold uppercase tracking-wider text-white transition-all duration-200"
          style={{ backgroundColor: NAVY, borderRadius: 1, fontSize: "0.75em" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = NAVY)}
        >
          {nextLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS  (all at module level → stable identity → no focus-loss bug)
// ═══════════════════════════════════════════════════════════════════════════════
interface StepDocumentProps {
  docType: DocumentType | "";
  setDocType: (t: DocumentType) => void;
  error: string;
  onNext: () => void;
  onHome: () => void;
  tr: (k: string) => string;
  inputCls: string;
}

const DOC_TYPE_KEYS = [
  { type: "clearance"          as DocumentType, bg: "#e8f0fe", icon: (cls: string) => <FileText  className={cls} /> },
  { type: "building-clearance" as DocumentType, bg: "#e8f8f0", icon: (cls: string) => <Building2 className={cls} /> },
  { type: "business-clearance" as DocumentType, bg: "#fef4e8", icon: (cls: string) => <Briefcase className={cls} /> },
  { type: "resident"           as DocumentType, bg: "#fce8f0", icon: (cls: string) => <Users     className={cls} /> },
];

const DOC_TR_KEYS: Record<DocumentType, { label: string; sub: string }> = {
  "clearance":          { label: "doc.clearance.label", sub: "doc.clearance.sub" },
  "building-clearance": { label: "doc.building.label",  sub: "doc.building.sub"  },
  "business-clearance": { label: "doc.business.label",  sub: "doc.business.sub"  },
  "resident":           { label: "doc.resident.label",  sub: "doc.resident.sub"  },
};

// FIX: Map frontend DocumentType to the exact service_type strings the backend expects
const getServiceType = (tab: DocumentType): string => {
  switch (tab) {
    case "clearance":          return "Barangay Clearance";
    case "building-clearance": return "Building Clearance";
    case "business-clearance": return "Business Clearance";
    case "resident":           return "Resident Registration";
    default:                   return "Barangay Clearance";
  }
};

const StepDocument = ({ docType, setDocType, error, onNext, onHome, tr }: StepDocumentProps) => (
  <Card eyebrow={tr("step1.eyebrow")} title={tr("step1.title")} subtitle={tr("step1.subtitle")}>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {DOC_TYPE_KEYS.map((d) => {
        const keys = DOC_TR_KEYS[d.type];
        return (
          <button
            key={d.type}
            onClick={() => setDocType(d.type)}
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
    {error && <p className="mt-3" style={{ color: PINK, fontSize: "0.8em" }}>{error}</p>}
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
      onNext={onNext}
      nextLabel={tr("btn.continue")}
    />
  </Card>
);

// ─── Step 1: Personal ─────────────────────────────────────────────────────────
interface CommonStepProps {
  formData: Partial<BarangayDocument> & Record<string, string>;
  set: (field: keyof BarangayDocument, value: string) => void;
  error: string;
  onBack: () => void;
  onNext: () => void;
  tr: (k: string) => string;
  inputCls: string;
}

const StepPersonal = ({ formData, set, error, onBack, onNext, tr, inputCls }: CommonStepProps) => (
  <Card eyebrow={tr("step2.eyebrow")} title={tr("step2.title")} subtitle={tr("step2.subtitle")}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
      <Field label={`${tr("field.firstName")} *`}>
        <MaskedInput value={formData.first_name || ""} onValueChange={(v) => set("first_name", v)}
          placeholder={tr("ph.firstName")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
      </Field>
      <Field label={tr("field.middleName")}>
        <MaskedInput value={formData.middle_name || ""} onValueChange={(v) => set("middle_name", v)}
          placeholder={tr("ph.middleName")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
      </Field>
      <Field label={`${tr("field.Surname")} *`}>
        <MaskedInput value={formData.surname || ""} onValueChange={(v) => set("surname", v)}
          placeholder={tr("ph.Surname")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
      </Field>
      <Field label={`${tr("field.dob")} *`}>
        <MaskedInput type="date" value={formData.date_of_birth || ""} onValueChange={(v) => set("date_of_birth", v)}
          placeholder={tr("field.dob")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
      </Field>
      <div className="md:col-span-2">
        <Field label={`${tr("field.pob")} *`}>
          <MaskedInput value={formData.place_of_birth || ""} onValueChange={(v) => set("place_of_birth", v)}
            placeholder={tr("ph.pob")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
        </Field>
      </div>
    </div>
    {error && <p className="mt-3" style={{ color: PINK, fontSize: "0.8em" }}>{error}</p>}
    <Actions onBack={onBack} onNext={onNext} nextLabel={tr("btn.continue")} backLabel={tr("btn.back")} />
  </Card>
);

// ─── Step 2: Address ──────────────────────────────────────────────────────────
interface StepAddressProps extends CommonStepProps {
  setExtra: (key: string, value: string) => void;
  streets: StreetRecord[];
}

interface StreetRecord { id: number; name: string; sitio?: string; formerly?: string | null; }

const StepAddress = ({ formData, set, setExtra, streets, error, onBack, onNext, tr, inputCls }: StepAddressProps) => {
  const streetNames = Array.from(new Set(streets.map((s) => s.name))).sort();

  const zoneOptions = Array.from(
    new Set(
      streets
        .filter((s) => s.name.trim().toLowerCase() === (formData._street ?? "").trim().toLowerCase())
        .map((s) => s.sitio ?? "")
        .filter((z) => z !== "")
    )
  ).sort();

  const buildAddress = (detail: string, street: string, sitio: string) =>
    [detail, street, sitio].filter(Boolean).join(", ");

  const handleStreetChange = (val: string) => {
    setExtra("_street", val);
    setExtra("_zone", "");
    set("address", buildAddress(formData._addressDetail || "", val, ""));
  };
  const handleZoneChange = (val: string) => {
    setExtra("_zone", val);
    set("address", buildAddress(formData._addressDetail || "", formData._street || "", val));
  };
  const handleDetailChange = (val: string) => {
    setExtra("_addressDetail", val);
    set("address", buildAddress(val, formData._street || "", formData._zone || ""));
  };

  return (
    <Card eyebrow={tr("step3.eyebrow")} title={tr("step3.title")} subtitle={tr("step3.subtitle")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <div className="md:col-span-2">
          <Field label={tr("field.houseUnit")}>
            <MaskedInput value={formData._addressDetail || ""} onValueChange={handleDetailChange}
              placeholder={tr("ph.houseUnit")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
          </Field>
        </div>
        <Field label={`${tr("field.street")} *`}>
          <Combobox value={formData._street || ""} onChange={handleStreetChange}
            options={streetNames} placeholder={tr("ph.street")} inputCls={inputCls} />
        </Field>
        <Field label={`${tr("field.zone")} *`}>
          <Combobox
            value={formData._zone || ""} onChange={handleZoneChange}
            options={zoneOptions}
            placeholder={formData._street ? tr("ph.zone") : tr("ph.zoneFirst")}
            disabled={!formData._street}
            inputCls={inputCls}
          />
        </Field>
        {formData.address && (
          <div className="md:col-span-2 p-3 text-muted-foreground"
            style={{ background: "#f8faff", borderRadius: 4, border: "1px solid #dde3ed", fontSize: "0.82em" }}>
            <span className="font-bold uppercase tracking-wider" style={{ color: NAVY }}>{tr("addr.preview")} </span>
            {formData.address}
          </div>
        )}
        <Field label={`${tr("field.residency")} *`}>
          <MaskedInput value={formData.period_of_residency || ""} onValueChange={(v) => set("period_of_residency", v)}
            placeholder={tr("ph.residency")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
        </Field>
        <Field label={`${tr("field.voter")} *`}>
          <select
            value={formData.registered_voter || ""}
            onChange={(e) => set("registered_voter", e.target.value as "Yes" | "No")}
            className="w-full bg-transparent border-0 border-b py-2.5 text-foreground focus:outline-none focus:border-[#c2467d] transition-colors duration-200 cursor-pointer"
            style={{ borderColor: "#d1d5db", fontSize: "inherit" }}
          >
            <option value="">{tr("opt.select")}</option>
            <option value="Yes">{tr("opt.yes")}</option>
            <option value="No">{tr("opt.no")}</option>
          </select>
        </Field>
        <Field label={`${tr("field.houseOwner")} *`}>
          <MaskedInput value={formData.house_owner || ""} onValueChange={(v) => set("house_owner", v)}
            placeholder={tr("field.houseOwner")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
        </Field>
        <Field label={`${tr("field.relation")} *`}>
          <MaskedInput value={formData.relation_to_house_owner || ""} onValueChange={(v) => set("relation_to_house_owner", v)}
            placeholder={tr("field.relation")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
        </Field>
      </div>
      {error && <p className="mt-3" style={{ color: PINK, fontSize: "0.8em" }}>{error}</p>}
      <Actions onBack={onBack} onNext={onNext} nextLabel={tr("btn.continue")} backLabel={tr("btn.back")} />
    </Card>
  );
};

// ─── Step 3: Details ──────────────────────────────────────────────────────────
const StepDetails = ({ formData, set, error, onBack, onNext, tr, inputCls }: CommonStepProps) => (
  <Card eyebrow={tr("step4.eyebrow")} title={tr("step4.title")} subtitle={tr("step4.subtitle")}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
      {/* FIX: field stored as contact_number to match backend */}
      <Field label={`${tr("field.contact")} *`}>
        <MaskedInput value={formData.contact_number || ""} onValueChange={(v) => set("contact_number" as keyof BarangayDocument, v)}
          placeholder={tr("ph.contact")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
      </Field>
      <Field label={`${tr("field.purpose")} *`}>
        <MaskedInput value={formData.purpose || ""} onValueChange={(v) => set("purpose", v)}
          placeholder={tr("ph.purpose")} className={inputCls} style={{ borderColor: "#d1d5db" }} />
      </Field>
    </div>
    {error && <p className="mt-3" style={{ color: PINK, fontSize: "0.8em" }}>{error}</p>}
    <Actions onBack={onBack} onNext={onNext} nextLabel={tr("btn.review")} backLabel={tr("btn.back")} />
  </Card>
);

// ─── Step 4: Review ───────────────────────────────────────────────────────────
interface StepReviewProps {
  docType: DocumentType | "";
  formData: Partial<BarangayDocument> & Record<string, string>;
  consentChecked: boolean;
  setConsentChecked: (v: boolean) => void;
  error: string;
  onBack: () => void;
  onSubmit: () => void;
  onEdit: () => void;
  tr: (k: string) => string;
}

const StepReview = ({
  docType, formData, consentChecked, setConsentChecked, error, onBack, onSubmit, onEdit, tr,
}: StepReviewProps) => {
  const docKeys = docType ? DOC_TR_KEYS[docType] : null;
  return (
    <Card eyebrow={tr("step5.eyebrow")} title={tr("step5.title")} subtitle={tr("step5.subtitle")}>
      {docKeys && (
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 font-bold uppercase tracking-wider"
          style={{ background: "#f0f4ff", border: "1px solid #dde3ed", borderRadius: 4, color: NAVY, fontSize: "0.75em" }}
        >
          {DOC_TYPE_KEYS.find((d) => d.type === docType)?.icon("h-4 w-4")}
          {tr(docKeys.label)}
        </div>
      )}

      <ReviewSection title={tr("review.personal")}>
        <ReviewRow label={tr("review.firstName")}  value={formData.first_name} />
        <ReviewRow label={tr("review.middleName")} value={formData.middle_name || "N/A"} />
        <ReviewRow label={tr("review.Surname")}   value={formData.surname} />
        <ReviewRow label={tr("review.dob")}        value={formData.date_of_birth} />
        <div className="col-span-2">
          <ReviewRow label={tr("review.pob")} value={formData.place_of_birth} />
        </div>
      </ReviewSection>

      <ReviewSection title={tr("review.address")}>
        <div className="col-span-2">
          <ReviewRow label={tr("review.fullAddress")} value={formData.address} />
        </div>
        <ReviewRow label={tr("review.residency")}  value={formData.period_of_residency} />
        <ReviewRow label={tr("review.voter")}      value={formData.registered_voter} />
        <ReviewRow label={tr("review.houseOwner")} value={formData.house_owner} />
        <ReviewRow label={tr("review.relation")}   value={formData.relation_to_house_owner} />
      </ReviewSection>

      <ReviewSection title={tr("review.contact")}>
        {/* FIX: use contact_number field consistent with backend */}
        <ReviewRow label={tr("review.contact")} value={formData.contact_number} />
        <ReviewRow label={tr("review.purpose")} value={formData.purpose} />
      </ReviewSection>

      <div className="mb-4 p-5" style={{ background: "#f8faff", border: "1px solid #dde3ed", borderRadius: 4 }}>
        <p className="font-bold uppercase tracking-[0.15em] mb-2" style={{ color: NAVY, fontSize: "0.65em" }}>
          {tr("consent.heading")}
        </p>
        <p className="text-muted-foreground leading-relaxed mb-3" style={{ fontSize: "0.85em" }}>{tr("consent.text")}</p>
        <div className="flex items-start gap-3">
          <Checkbox id="consent" checked={consentChecked} onCheckedChange={(v) => setConsentChecked(v as boolean)} />
          <label htmlFor="consent" className="cursor-pointer text-foreground leading-snug" style={{ fontSize: "0.85em" }}>
            {tr("consent.checkbox")}
          </label>
        </div>
      </div>

      {error && <p className="mb-3" style={{ color: PINK, fontSize: "0.8em" }}>{error}</p>}

      <Actions
        onBack={onBack}
        onNext={onSubmit}
        nextLabel={tr("btn.submit")}
        backLabel={tr("btn.back")}
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
const SuccessScreen = ({ onReset, tr }: { onReset: () => void; tr: (k: string) => string }) => (
  <div
    className="bg-card border border-border overflow-hidden text-center py-16 px-8"
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
    <p className="text-muted-foreground mb-8" style={{ fontSize: "0.9em" }}>{tr("success.sub")}</p>
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

// ═══════════════════════════════════════════════════════════════════════════════
// STEP BAR  — defined at module level so it never remounts on FrontDesk re-render
// ═══════════════════════════════════════════════════════════════════════════════
interface StepBarProps {
  currentStep: number;
  steps: string[];
}

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

  // ── Accessibility state (persisted) ────────────────────────────────────────
  const [lang, setLang]         = useState<Lang>(() => (localStorage.getItem(LS_LANG) as Lang) || "en");
  const [fontSize, setFontSize] = useState<FontSize>(() => (localStorage.getItem(LS_FONT) as FontSize) || "md");

  // Stable translation function — re-created only when lang changes
  const tr = useCallback((k: string) => TRANSLATIONS[lang][k] ?? k, [lang]);

  const inputCls =
    "w-full bg-transparent border-0 border-b py-2.5 text-foreground placeholder-gray-400 focus:outline-none transition-colors duration-200";

  // FIX: useMemo so STEPS_TR is stable and not recreated every render
  const STEPS_TR = useMemo(() => [
    tr("step.document"),
    tr("step.personal"),
    tr("step.address"),
    tr("step.details"),
    tr("step.review"),
  ], [tr]);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep]       = useState(0);
  const [docType, setDocType]               = useState<DocumentType | "">("");
  const [formData, setFormData]             = useState<Partial<BarangayDocument> & Record<string, string>>({});
  const [consentChecked, setConsentChecked] = useState(false);
  const [errors, setErrors]                 = useState("");
  const [submitted, setSubmitted]           = useState(false);
  const [streets, setStreets]               = useState<StreetRecord[]>([]);

  // ── Fetch streets once ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("api/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) { console.error("Failed to fetch streets:", e); }
    };
    load();
  }, []);

  // ── Stable setters ─────────────────────────────────────────────────────────
  const set = useCallback((field: keyof BarangayDocument, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setExtra = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setErrors("");
    if (currentStep === 0 && !docType) {
      setErrors(tr("err.selectDoc")); return;
    }
    if (currentStep === 1 && (!formData.first_name || !formData.surname || !formData.date_of_birth || !formData.place_of_birth)) {
      setErrors(tr("err.fillRequired")); return;
    }
    if (currentStep === 2 && (!formData._street || !formData._zone || !formData.period_of_residency || !formData.registered_voter || !formData.house_owner || !formData.relation_to_house_owner)) {
      setErrors(tr("err.fillAddress")); return;
    }
    // FIX: validate contact_number (not contact)
    if (currentStep === 3 && (!formData.contact_number || !formData.purpose)) {
      setErrors(tr("err.fillRequired")); return;
    }
    setCurrentStep((s) => s + 1);
  }, [currentStep, docType, formData, tr]);

  const goBack = useCallback(() => { setErrors(""); setCurrentStep((s) => s - 1); }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!consentChecked) { setErrors(tr("err.consent")); return; }
    try {
      // FIX: use the shared `api` instance (respects baseURL from your lib/api config)
      // FIX: send contact_number as contact_number — matches KioskSubmitRequest validation
      const response = await api.post(
        "api/kiosk/submit",
        {
          service_type:             getServiceType(docType as DocumentType),
          first_name:              formData.first_name              || "",
          middle_name:             formData.middle_name             || "",
          surname:               formData.surname               || "",
          authorized_person:       formData.authorized_person       || null,
          address:                 formData.address                 || "",
          date_of_birth:           formData.date_of_birth           || "",
          place_of_birth:          formData.place_of_birth          || "",
          period_of_residency:     formData.period_of_residency     || "",
          registered_voter:        formData.registered_voter        || "",
          house_owner:             formData.house_owner             || "",
          relation_to_house_owner: formData.relation_to_house_owner || "",
          contact_number:          formData.contact_number          || "",   // FIX: was formData.contact
          purpose:                 formData.purpose                 || "",
          priority:                "Normal",
          type:                    "walk_in",
        },
        { withCredentials: true }
      );
      console.log("Submission response:", response);
      toast.success(tr("success.title"));
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || tr("err.fillRequired"));
    }
  }, [consentChecked, docType, formData, tr]);

  const handleReset = useCallback(() => {
    setCurrentStep(0); setDocType(""); setFormData({});
    setConsentChecked(false); setErrors(""); setSubmitted(false);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontSize: `${FONT_SCALE[fontSize].scale}rem` }}>
      <AccessibilityBar lang={lang} setLang={setLang} fontSize={fontSize} setFontSize={setFontSize} />

      <main className="min-h-screen bg-background py-10 px-4">
        <div className="container max-w-3xl mx-auto">

          {/* Page header */}
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

          {/* FIX: StepBar is now module-level; pass props instead of defining it inside FrontDesk */}
          {!submitted && <StepBar currentStep={currentStep} steps={STEPS_TR} />}

          {submitted ? (
            <SuccessScreen onReset={handleReset} tr={tr} />
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
              onBack={goBack} onNext={goNext} tr={tr} inputCls={inputCls}
            />
          ) : currentStep === 2 ? (
            <StepAddress
              formData={formData} set={set} setExtra={setExtra}
              streets={streets} error={errors}
              onBack={goBack} onNext={goNext} tr={tr} inputCls={inputCls}
            />
          ) : currentStep === 3 ? (
            <StepDetails
              formData={formData} set={set} error={errors}
              onBack={goBack} onNext={goNext} tr={tr} inputCls={inputCls}
            />
          ) : (
            <StepReview
              docType={docType} formData={formData}
              consentChecked={consentChecked} setConsentChecked={setConsentChecked}
              error={errors} onBack={goBack} onSubmit={handleSubmit}
              onEdit={() => { setCurrentStep(0); setErrors(""); }}
              tr={tr}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default FrontDesk;