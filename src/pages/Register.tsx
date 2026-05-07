import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, Eye, EyeOff, Check, X, AlertTriangle, ChevronRight,
  Loader2, Scan, CreditCard, FileText, RefreshCw, ChevronDown,
} from "lucide-react";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";

// ─── Types ───────────────────────────────────────────────────────────────────
type OcrResult = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  idNumber?: string;
  isPWD?: boolean;
  raw?: Record<string, any>;
};

type IdTypeValue =
  | "national_id"
  | "sss"
  | "philhealth"
  | "school_id"
  | "drivers_license"
  | "pwd_id";

type IdType = {
  value: IdTypeValue;
  label: string;
  hasBack: boolean;
  icon: string;
};

// ─── NEW VALIDATOR ────────────────────────────────────────────────────────────

function normalizeOcr(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isDriverLicense(text: string): boolean {
  return (
    text.includes("land transportation office") &&
    (text.includes("driver") || text.includes("license"))
  );
}

function isPhilHealth(text: string): boolean {
  return (
    text.includes("philhealth") ||
    text.includes("philippine health insurance corporation")
  );
}

function isSSS(text: string): boolean {
  return (
    text.includes("social security system") ||
    (text.includes("sss") && !text.includes("philhealth") && !text.includes("land transportation"))
  );
}

function isNationalId(text: string): boolean {
  return (
    text.includes("philippine identification card") ||
    text.includes("phil identification") ||
    text.includes("pambansang pagkakakilanlan") ||
    text.includes("philsys") ||
    text.includes("phil sys") ||
    text.includes("psn") ||
    text.includes("pcn")
  );
}

function isSchoolId(text: string): boolean {
  return (
    text.includes("school") ||
    text.includes("university") ||
    text.includes("college") ||
    text.includes("student") ||
    text.includes("institute")
  );
}

function isPWDId(text: string): boolean {
  let score = 0;

  if (
    text.includes("pwd") ||
    text.includes("person with disability") ||
    text.includes("persons with disability") ||
    text.includes("persons with disabilites") || // OCR typo handled
    text.includes("disabilit")                   // partial match
  ) {
    score++;
  }

  if (text.includes("affairs office")) score++;
  if (text.includes("type of disability")) score++;
  if (text.includes("identification number") && text.includes("disabilit")) score++;

  return score >= 2;
}

function detectIdType(text: string): IdTypeValue | null {
  if (isDriverLicense(text)) return "drivers_license";
  if (isPhilHealth(text))    return "philhealth";
  if (isPWDId(text))         return "pwd_id";
  if (isSSS(text))           return "sss";
  if (isNationalId(text))    return "national_id";
  if (isSchoolId(text))      return "school_id";
  return null;
}

const ID_LABELS: Record<IdTypeValue, string> = {
  national_id:     "National ID (PhilSys)",
  sss:             "SSS",
  philhealth:      "PhilHealth",
  school_id:       "School ID",
  drivers_license: "Driver's License",
  pwd_id:          "PWD ID",
};

type OcrValidationResult = {
  isValid: boolean;
  detectedIdType: IdTypeValue | null;
  isPWD: boolean;
  errors: string[];
};

function validateOcrResult(
  rawText: string,
  selectedId: IdTypeValue
): OcrValidationResult {
  const errors: string[] = [];
  const text = normalizeOcr(rawText);

  if (!text) {
    return {
      isValid: false,
      detectedIdType: null,
      isPWD: false,
      errors: ["OCR returned no readable text. Please upload a clearer image."],
    };
  }

  const detected = detectIdType(text);
  const isPWD    = isPWDId(text);

  let selectedMatches = false;
  switch (selectedId) {
    case "drivers_license": selectedMatches = isDriverLicense(text); break;
    case "philhealth":      selectedMatches = isPhilHealth(text);    break;
    case "sss":             selectedMatches = isSSS(text);           break;
    case "pwd_id":          selectedMatches = isPWDId(text);         break;
    case "national_id":     selectedMatches = isNationalId(text);    break;
    case "school_id":       selectedMatches = isSchoolId(text);      break;
  }

  if (!selectedMatches) {
    const hint = detected ? ` The uploaded image appears to be a ${ID_LABELS[detected]}.` : "";
    errors.push(
      `The uploaded ID does not match the selected ID type (${ID_LABELS[selectedId]}).${hint}`
    );
  }

  return {
    isValid: errors.length === 0,
    detectedIdType: detected,
    isPWD,
    errors,
  };
}

// ─── West Rembo Address Validator ────────────────────────────────────────────

type WestRemboStreet = { name: string; formerly: string | null };

// Seeded from barangay DB — kept in sync with the streets API
const WEST_REMBO_STREETS: WestRemboStreet[] = [
  { name: "A. Bonifacio Street",                    formerly: null           },
  { name: "A. Luna Street",                         formerly: null           },
  { name: "A. Mabini Street",                       formerly: "21st street"  },
  { name: "Agulan Street corner Baden Powell",       formerly: null           },
  { name: "Agulan Street corner T. Alonzo",          formerly: null           },
  { name: "Avocado Street",                          formerly: null           },
  { name: "B. Serrano Street",                      formerly: "25th street"  },
  { name: "Balagtas Street",                        formerly: "3rd street"   },
  { name: "Banez Street",                           formerly: null           },
  { name: "Bayabas Street",                         formerly: null           },
  { name: "Block 4",                                formerly: null           },
  { name: "Block 5",                                formerly: null           },
  { name: "Block 6",                                formerly: null           },
  { name: "Block 7",                                formerly: null           },
  { name: "Block 8",                                formerly: null           },
  { name: "Caimito Street",                         formerly: null           },
  { name: "Crisolo Street",                         formerly: null           },
  { name: "Dagohoy Street",                         formerly: "7th street"   },
  { name: "Dalandan Street",                        formerly: null           },
  { name: "E. Aguinaldo Street",                    formerly: "1st street"   },
  { name: "E. Jacinto Street",                      formerly: "13th street"  },
  { name: "G.L. Jaena Street",                      formerly: "17th street"  },
  { name: "Gen. Arellano Street",                   formerly: null           },
  { name: "Hidalgo Street",                         formerly: null           },
  { name: "Ilustrado Street",                       formerly: "9th street"   },
  { name: "J. Rizal Street",                        formerly: null           },
  { name: "Katipunan Street",                       formerly: "5th street"   },
  { name: "Lapu-Lapu Street",                       formerly: null           },
  { name: "Lanzones Street",                        formerly: null           },
  { name: "Limahong Street",                        formerly: null           },
  { name: "Mactan Street",                          formerly: null           },
  { name: "Maharlika Street",                       formerly: null           },
  { name: "Makiling Street",                        formerly: null           },
  { name: "Mango Street",                           formerly: null           },
  { name: "Masagana Street",                        formerly: null           },
  { name: "Masikap Street",                         formerly: null           },
  { name: "N. Domingo Street",                      formerly: null           },
  { name: "Atis Street",                            formerly: null           },
  { name: "P. Guevarra Street",                     formerly: null           },
  { name: "P. Paterno Street",                      formerly: "15th street"  },
  { name: "Pakwan Street",                          formerly: null           },
  { name: "Pili Street",                            formerly: null           },
  { name: "Pinatubo Street",                        formerly: null           },
  { name: "R. Magsaysay Street",                    formerly: null           },
  { name: "R. Papa Street",                         formerly: "11th street"  },
  { name: "Rambutan Street",                        formerly: null           },
  { name: "S. Aquino Street",                       formerly: null           },
  { name: "Sampalok Street",                        formerly: null           },
  { name: "Santol Street",                          formerly: null           },
  { name: "Sineguelas Street",                      formerly: null           },
  { name: "Tamarind Street",                        formerly: null           },
  { name: "Tirad Pass Street",                      formerly: "19th street"  },
  { name: "Zapote Street",                          formerly: null           },
];

/** Strip road-type suffixes and noise so we compare only the core name token. */
function simplifyStreet(name: string): string {
  return normalizeOcr(name)
    .replace(/\b(street|st|avenue|ave|road|rd|corner|cor)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type AddressValidationResult = {
  isValid: boolean;
  isFromWestRembo: boolean;
  matchedStreet: string | null;
  errors: string[];
};

function validateAddress(
  ocrText: string,
  liveStreets?: WestRemboStreet[]          // optional: pass API streets to override defaults
): AddressValidationResult {
  const text = normalizeOcr(ocrText);

  // 1. West Rembo check
  const isFromWestRembo =
    text.includes("west rembo") ||
    text.includes("westrembo")  ||
    text.includes("w rembo");

  if (!isFromWestRembo) {
    return {
      isValid: false,
      isFromWestRembo: false,
      matchedStreet: null,
      errors: ["The uploaded ID is not from West Rembo. Only West Rembo residents may register here."],
    };
  }

  // 2. Street match — prefer live API streets, fallback to static list
  const streetList = (liveStreets && liveStreets.length > 0) ? liveStreets : WEST_REMBO_STREETS;
  let matchedStreet: string | null = null;

  for (const street of streetList) {
    const core = simplifyStreet(street.name);

    // Skip very short tokens (e.g. "block 4") only need exact block match
    if (core.length >= 3 && text.includes(core)) {
      matchedStreet = street.name;
      break;
    }

    // Formerly / old name
    if (street.formerly) {
      const oldCore = simplifyStreet(street.formerly);
      if (oldCore.length >= 3 && text.includes(oldCore)) {
        matchedStreet = street.name;
        break;
      }
    }
  }

  if (!matchedStreet) {
    return {
      isValid: false,
      isFromWestRembo: true,
      matchedStreet: null,
      errors: ["No valid West Rembo street was detected in your ID address. Please ensure your ID shows your complete current address."],
    };
  }

  return {
    isValid: true,
    isFromWestRembo: true,
    matchedStreet,
    errors: [],
  };
}

// ─── ID Types Config ──────────────────────────────────────────────────────────
const ALL_ID_TYPES: IdType[] = [
  { value: "national_id",     label: "National ID (PhilSys)", hasBack: true,  icon: "🪪"  },
  { value: "sss",             label: "SSS",                   hasBack: true,  icon: "🏛️" },
  { value: "philhealth",      label: "PhilHealth",            hasBack: false, icon: "🏥" },
  { value: "school_id",       label: "School ID",             hasBack: true,  icon: "🎓" },
  { value: "drivers_license", label: "Driver's License",      hasBack: true,  icon: "🚗" },
  { value: "pwd_id",          label: "PWD ID",                hasBack: true,  icon: "♿" },
];

// ─── OCR API Config ───────────────────────────────────────────────────────────
const OCR_ENDPOINT     = "https://api.ocr.space/parse/image";
const OCR_API_KEY      = "K81879032088957";
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES   = ["image/jpeg","image/jpg","image/png","image/webp","image/heic","image/heif"];
const ACCEPTED_ATTR    = ACCEPTED_TYPES.join(",");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const dd   = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
const getTodayString            = () => toDateString(new Date());
const getDefaultAdultDateString = () => { const y = new Date().getFullYear() - 18; return `${y}-01-01`; };
const validateFile = (file: File): string | null => {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Only JPG, PNG, WEBP, HEIC images are accepted.";
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_FILE_SIZE_MB}MB.`;
  return null;
};

const MONTHS: Record<string,string> = {
  january:"01",february:"02",march:"03",april:"04",may:"05",june:"06",
  july:"07",august:"08",september:"09",october:"10",november:"11",december:"12",
  jan:"01",feb:"02",mar:"03",apr:"04",jun:"06",jul:"07",aug:"08",
  sep:"09",oct:"10",nov:"11",dec:"12",
};
const normDate = (s?: string): string | undefined => {
  if (!s) return undefined;
  s = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;
  const ymd = s.match(/^(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  const mdy = s.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (mdy) { const m = MONTHS[mdy[1].toLowerCase()]; if (m) return `${mdy[3]}-${m}-${mdy[2].padStart(2,"0")}`; }
  const dmy2 = s.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (dmy2) { const m = MONTHS[dmy2[2].toLowerCase()]; if (m) return `${dmy2[3]}-${m}-${dmy2[1].padStart(2,"0")}`; }
  return undefined;
};

// ─── PWD Name Extractor ───────────────────────────────────────────────────────
/**
 * Smart name extraction for PWD IDs.
 *
 * PWD IDs do NOT use labels like "First Name / Given Name".
 * The name can appear:
 *   1. ABOVE the word "NAME" (e.g. "MIGUEL CARLO TAPALLA\nNAME")
 *   2. BELOW "NAME:" (e.g. "NAME:\nMauro B. Cruz")
 *   3. As a standalone ALL-CAPS line with no label at all
 */
function extractNameFromPWD(lines: string[]): {
  firstName?: string;
  middleName?: string;
  lastName?: string;
} {
  let fullName: string | null = null;

  // ── Strategy 1: label-based (NAME above or below) ──
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase().trim();

    if (lineLower.includes("name")) {
      const prev = lines[i - 1]?.trim() ?? "";
      const next = lines[i + 1]?.trim() ?? "";

      // Case A: name is the line ABOVE the "NAME" label
      // e.g. "MIGUEL CARLO TAPALLA\nNAME"
      if (
        prev &&
        /^[A-Za-z\s\.]+$/.test(prev) &&
        prev.split(" ").filter(Boolean).length >= 2 &&
        prev.length > 5 &&
        prev.length < 60
      ) {
        fullName = prev;
        break;
      }

      // Case B: name is the line BELOW the "NAME:" label
      // e.g. "NAME:\nMauro B. Cruz"
      if (
        next &&
        /^[A-Za-z\s\.]+$/.test(next) &&
        next.split(" ").filter(Boolean).length >= 2 &&
        next.length > 5 &&
        next.length < 60
      ) {
        fullName = next;
        break;
      }
    }
  }

  // ── Strategy 2: standalone ALL-CAPS line fallback ──
  if (!fullName) {
    const BLACKLIST = [
      "REPUBLIC","OFFICE","DISABILITY","IDENTIFICATION",
      "SIGNATURE","PHILIPPINES","DEPARTMENT","AFFAIRS",
      "BARANGAY","CITY","MUNICIPALITY","PROVINCE",
      "PERSONS","PERSON","WELFARE",
    ];
    for (const line of lines) {
      const clean = line.trim();
      if (
        /^[A-Z\s\.]+$/.test(clean) &&           // ALL CAPS (and dots for middle initials)
        clean.split(" ").filter(Boolean).length >= 2 &&  // at least 2 words
        clean.length > 5 &&
        clean.length < 50 &&
        !BLACKLIST.some((kw) => clean.includes(kw))
      ) {
        fullName = clean;
        break;
      }
    }
  }

  if (!fullName) return {};

  // ── Split into first / middle / last ──
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };

  const firstName  = parts[0];
  const lastName   = parts[parts.length - 1];
  const middleName = parts.length > 2 ? parts.slice(1, parts.length - 1).join(" ") : undefined;

  return { firstName, middleName, lastName };
}

// ─── OCR Response Parser ──────────────────────────────────────────────────────
/**
 * Accepts a raw OCR API response object.
 * The `raw.text` field may be the MERGED front+back text (see handleScan).
 */
const parseOcrResponse = (raw: any): OcrResult => {
  if (!raw) return {};
  const d = raw?.data ?? raw?.result ?? raw;
  const rawText: string = d?.text ?? (typeof d === "string" ? d : "");
  if (!rawText) return { raw: d };

  const lines    = rawText.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  const fullText = lines.join(" ");

  // ── Date of Birth ──
  let dateOfBirth: string | undefined;
  const dobMatch = fullText.match(
    /\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2}),?\s+(\d{4})\b/i
  );
  if (dobMatch) dateOfBirth = normDate(`${dobMatch[1]} ${dobMatch[2]}, ${dobMatch[3]}`);
  if (!dateOfBirth) {
    for (const line of lines) {
      const partial = line.match(/([A-Z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
      if (partial) {
        const suffixes: Record<string,string> = {
          tember:"September",ber:"October",vember:"November",cember:"December",
          nuary:"January",bruary:"February",ruary:"February",arch:"March",
          ril:"April",ne:"June",ly:"July",gust:"August",
        };
        const frag = partial[1].toLowerCase();
        const resolved = Object.entries(suffixes).find(([k]) => frag.endsWith(k));
        if (resolved) { dateOfBirth = normDate(`${resolved[1]} ${partial[2]}, ${partial[3]}`); if (dateOfBirth) break; }
      }
      const numDate = line.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
      if (numDate && !dateOfBirth) dateOfBirth = normDate(`${numDate[1]}/${numDate[2]}/${numDate[3]}`);
    }
  }

  // ── Address ──
  const addressKeywords = /\b(ST\.|STREET|AVE\.|AVENUE|ROAD|BLVD|BARANGAY|BRGY|VILLAGE|SUBD|SUBDIVISION|WEST REMBO|EAST REMBO|TAGUIG|MANILA|QUEZON|MAKATI|PASIG|CALOOCAN|MARIKINA|PARANAQUE|MUNTINLUPA|VALENZUELA|MALABON|NAVOTAS|PASAY|PATEROS|SAN JUAN|LAS PINAS)\b/i;
  let address: string | undefined;
  for (const line of lines) {
    if (addressKeywords.test(line) && line.length > 10) { address = line.replace(/[,;]+$/, "").trim(); break; }
  }
  if (!address) {
    const cityPattern = /\b(CITY|METRO MANILA|PHILIPPINES)\b/i;
    for (const line of lines) {
      if (cityPattern.test(line) && line.length > 10) { address = line.replace(/[,;]+$/, "").trim(); break; }
    }
  }

  // ── Detect ID type from the combined text ──
  const detectedType = detectIdType(normalizeOcr(rawText));

  // ── Name extraction ──
  let firstName:  string | undefined;
  let middleName: string | undefined;
  let lastName:   string | undefined;

  if (detectedType === "pwd_id") {
    // 🔥 PWD IDs use free-text layout — use smart extractor
    const nameParts = extractNameFromPWD(lines);
    firstName  = nameParts.firstName;
    middleName = nameParts.middleName;
    lastName   = nameParts.lastName;
  } else {
    // ── Standard label-based extraction for other IDs ──

    // Last Name
    for (let i = 0; i < lines.length; i++) {
      if (/apelyido|last\s*name|surname/i.test(lines[i])) {
        const next = lines[i + 1];
        if (next && /^[A-Z\s\-]+$/.test(next) && next.length > 1 && next.length < 40) { lastName = next.trim(); break; }
      }
    }
    if (!lastName) {
      for (const line of lines) {
        const m = line.match(/^-([A-Z][A-Z\s\-]{1,30})$/);
        if (m) { lastName = m[1].trim(); break; }
      }
    }

    // Middle Name
    for (let i = 0; i < lines.length; i++) {
      if (/gitnang|middle\s*name/i.test(lines[i])) {
        const next = lines[i + 1];
        if (next && /^[A-Z\s\-]+$/.test(next) && next.length > 1 && next.length < 40) { middleName = next.trim(); break; }
      }
    }

    // First Name
    for (let i = 0; i < lines.length; i++) {
      if (/pangalan|first\s*name|given\s*name/i.test(lines[i])) {
        const next = lines[i + 1];
        if (next && /^[A-Z\s\-]+$/.test(next) && next.length > 1 && next.length < 40) { firstName = next.trim(); break; }
      }
    }
  }

  // ── ID Number ──
  let idNumber: string | undefined;
  const idMatch = fullText.match(/\b(\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4})\b/);
  if (idMatch) idNumber = idMatch[1].replace(/\s/g, "-");

  return { firstName, middleName, lastName, dateOfBirth, address, idNumber, raw: d };
};

// ─── OCR Step ─────────────────────────────────────────────────────────────────
type OcrStepProps = {
  onComplete: (result: OcrResult, front: File, back: File | null) => void;
  onSkip: () => void;
  onSelectIdType: (v: string) => void;
  liveStreets?: WestRemboStreet[];  // live API streets passed down for address validation
};

const OcrStep = ({ onComplete, onSkip, onSelectIdType, liveStreets }: OcrStepProps) => {
  const [selectedType, setSelectedType] = useState<IdType | null>(null);
  const [frontFile,    setFrontFile]    = useState<File | null>(null);
  const [backFile,     setBackFile]     = useState<File | null>(null);
  const [frontError,   setFrontError]   = useState<string | null>(null);
  const [backError,    setBackError]    = useState<string | null>(null);
  const [ocrState,     setOcrState]     = useState<"idle"|"scanning"|"done"|"error">("idle");
  const [ocrError,     setOcrError]     = useState<string | null>(null);
  const [ocrErrorType, setOcrErrorType] = useState<"id"|"address"|"general"|null>(null);
  const [phase,        setPhase]        = useState<"select"|"requirements"|"upload">("select");
  const { toast } = useToast();

  const handleFileChange = (side: "front"|"back", file: File | null) => {
    if (!file) { side === "front" ? setFrontFile(null) : setBackFile(null); return; }
    const err = validateFile(file);
    if (err) { side === "front" ? setFrontError(err) : setBackError(err); return; }
    side === "front"
      ? (setFrontFile(file), setFrontError(null))
      : (setBackFile(file), setBackError(null));
  };

  const sendToOcr = async (file: File): Promise<any> => {
    const form = new FormData();
    form.append("apikey",            OCR_API_KEY);
    form.append("file",              file);
    form.append("language",          "eng");
    form.append("isOverlayRequired", "false");
    form.append("detectOrientation", "true");
    form.append("scale",             "true");
    form.append("OCREngine",         "2");
    const res = await axios.post(OCR_ENDPOINT, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
    if (res.data?.IsErroredOnProcessing) throw new Error(res.data?.ErrorMessage?.[0] ?? "OCR processing error");
    const text = res.data?.ParsedResults?.[0]?.ParsedText ?? "";
    return { text };
  };

  const handleScan = async () => {
    if (!frontFile || !selectedType) return;
    setOcrState("scanning");
    setOcrError(null);
    setOcrErrorType(null);

    try {
      // ── Scan front ──
      const frontRaw  = await sendToOcr(frontFile);
      const frontText: string = frontRaw?.text ?? "";

      // ── Scan back (if provided) — always OCR it when present ──
      let backRaw:  any    = null;
      let backText: string = "";
      if (backFile) {
        backRaw  = await sendToOcr(backFile);
        backText = backRaw?.text ?? "";
      }

      // ── Step 1: ID type validation (front only) ──
      const idValidation = validateOcrResult(frontText, selectedType.value);
      if (!idValidation.isValid) {
        setOcrState("error");
        setOcrErrorType("id");
        setOcrError(idValidation.errors.join(" "));
        toast({ title: "ID Validation Failed", description: idValidation.errors[0], variant: "destructive" });
        return;
      }

      // ── Step 2: Address validation — try front first, fall back to back ──
      let addrValidation = validateAddress(frontText, liveStreets);

      if (!addrValidation.isValid && backFile && backText) {
        const backAddr = validateAddress(backText, liveStreets);

        if (!backAddr.isValid) {
          // Neither side has a valid address
          setOcrState("error");
          setOcrErrorType("address");
          const finalError = backAddr.isFromWestRembo
            ? backAddr.errors[0]
            : addrValidation.isFromWestRembo
              ? addrValidation.errors[0]
              : "The uploaded ID does not show a West Rembo address on either side.";
          setOcrError(finalError);
          toast({ title: "Address Not Found", description: finalError, variant: "destructive" });
          return;
        }

        // Back has a valid address — merge and proceed
        addrValidation = backAddr;
      } else if (!addrValidation.isValid && !backFile) {
        // No back file — reject based on front result
        setOcrState("error");
        setOcrErrorType("address");
        setOcrError(addrValidation.errors.join(" "));
        toast({
          title: addrValidation.isFromWestRembo ? "Street Not Recognised" : "Address Not From West Rembo",
          description: addrValidation.errors[0],
          variant: "destructive",
        });
        return;
      }

      // ── 🔥 Merge front + back text before parsing ──
      // This gives the parser full context from both sides of the ID,
      // which is especially important for PWD IDs where the name may
      // appear on the front and the address on the back (or vice versa).
      const mergedText = backText
        ? `${frontText}\n${backText}`
        : frontText;

      const mergedRaw = { text: mergedText };
      const result    = parseOcrResponse(mergedRaw);
      result.isPWD    = idValidation.isPWD;

      setOcrState("done");
      onComplete(result, frontFile, backFile);
    } catch (err: any) {
      setOcrState("error");
      setOcrErrorType("general");
      const msg = err?.response?.data?.message ?? err?.message ?? "OCR processing failed. Please try again.";
      setOcrError(msg);
      toast({ title: "OCR Failed", description: msg, variant: "destructive" });
    }
  };

  const canScan = !!frontFile && (selectedType ? (!selectedType.hasBack || !!backFile) : true);

  // ── Phase: Select ──
  if (phase === "select") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ backgroundColor: "#0f2a5e" }}>
            <Scan className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Georgia', serif", color: "#0f2a5e" }}>
            Smart ID Scanning
          </h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Select your ID type to automatically fill the registration form via OCR.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {ALL_ID_TYPES.map((idType) => (
            <button
              key={idType.value}
              type="button"
              onClick={() => { setSelectedType(idType); onSelectIdType(idType.value); }}
              className="flex flex-col items-center gap-2 p-4 transition-all"
              style={{
                border: `2px solid ${selectedType?.value === idType.value ? "#c2467d" : "#dde3ed"}`,
                borderRadius: 4,
                backgroundColor: selectedType?.value === idType.value ? "#fdf5f8" : "#fafafa",
              }}
            >
              <span style={{ fontSize: 28 }}>{idType.icon}</span>
              <span className="text-xs font-semibold text-center"
                style={{ color: selectedType?.value === idType.value ? "#c2467d" : "#374151" }}>
                {idType.label}
              </span>
              {selectedType?.value === idType.value && (
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "#c2467d" }}>
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* <button type="button" onClick={onSkip}
            className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all"
            style={{ borderRadius: 2, border: "1.5px solid #dde3ed", color: "#9ca3af" }}>
            Skip — Fill Manually
          </button> */}
          <button type="button" disabled={!selectedType} onClick={() => setPhase("requirements")}
            className="flex-1 py-2.5 text-white text-xs font-semibold uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}>
            Continue <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: Requirements ──
  if (phase === "requirements") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <button type="button" onClick={() => setPhase("select")}
          className="flex items-center gap-1.5 text-xs font-semibold mb-6 transition-opacity hover:opacity-60"
          style={{ color: "#0f2a5e" }}>
          ← Back to ID Selection
        </button>

        <div className="flex items-center gap-3 mb-6">
          <span style={{ fontSize: 28 }}>{selectedType?.icon}</span>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#9ca3af" }}>Requirements</p>
            <h3 className="font-bold" style={{ fontFamily: "'Georgia', serif", color: "#0f2a5e" }}>{selectedType?.label}</h3>
          </div>
        </div>

        <div className="flex items-start gap-3 mb-5 p-3"
          style={{ backgroundColor: "#fff8e1", border: "1px solid #ffd54f", borderRadius: 2 }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <p className="text-xs" style={{ color: "#78350f" }}>
            Please read all requirements carefully before uploading your ID.
          </p>
        </div>

        <ul className="space-y-3 mb-8">
          {[
            "All ID details must be clearly readable — no blur, glare, or cropping",
            selectedType?.hasBack
              ? "Submit both the front and back of your ID"
              : "Only the front is required for this ID type",
            `Max file size: ${MAX_FILE_SIZE_MB}MB per image (JPG, PNG)`,
            "The ID type you selected must match the ID you upload — mismatches will be rejected",
          ].map((text) => (
            <li key={text} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "#c2467d" }} />
              <span className="text-xs" style={{ color: "#6b7280" }}>{text}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* <button type="button" onClick={onSkip}
            className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{ borderRadius: 2, border: "1.5px solid #dde3ed", color: "#9ca3af" }}>
            Skip — Fill Manually
          </button> */}
          <button type="button" onClick={() => setPhase("upload")}
            className="flex-1 py-2.5 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
            style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}>
            I Understand — Proceed <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: Upload ──
  return (
    <div className="w-full max-w-2xl mx-auto">
      <button type="button" onClick={() => setPhase("requirements")}
        className="flex items-center gap-1.5 text-xs font-semibold mb-6 transition-opacity hover:opacity-60"
        style={{ color: "#0f2a5e" }}>
        ← Back to Requirements
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span style={{ fontSize: 28 }}>{selectedType?.icon}</span>
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#9ca3af" }}>Uploading</p>
          <h3 className="font-bold" style={{ fontFamily: "'Georgia', serif", color: "#0f2a5e" }}>{selectedType?.label}</h3>
        </div>
      </div>

      {/* ID match notice */}
      <div className="flex items-start gap-3 mb-5 p-3"
        style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d2fe", borderRadius: 2 }}>
        <Scan className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#6366f1" }} />
        <p className="text-xs" style={{ color: "#374151" }}>
          <span className="font-semibold">ID type selected: {selectedType?.label}.</span>{" "}
          Make sure the photo you upload is the same type — the system will reject mismatched IDs.
        </p>
      </div>

      {selectedType?.value === "pwd_id" && (
        <div className="flex items-start gap-3 mb-5 p-3"
          style={{ backgroundColor: "#fdf5f8", border: "1px solid #c2467d", borderRadius: 2 }}>
          <span className="text-sm flex-shrink-0">♿</span>
          <p className="text-xs" style={{ color: "#9b2563" }}>
            Upload your <strong>PWD ID issued by the NCDA or your local government</strong>. Your PWD status will be detected automatically from the ID scan.
          </p>
        </div>
      )}

      <div className={`grid gap-4 mb-6 ${selectedType?.hasBack ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        <DropZone
          label={`Front of ${selectedType?.label} * (OCR)`}
          file={frontFile} error={frontError}
          onFileChange={(f) => handleFileChange("front", f)}
          hint="Used for scanning — id_url"
        />
        {selectedType?.hasBack && (
          <DropZone
            label={`Back of ${selectedType?.label} *`}
            file={backFile} error={backError}
            onFileChange={(f) => handleFileChange("back", f)}
            hint="Required for submission — id_url_back"
          />
        )}
      </div>

      {/* OCR / validation error */}
      {ocrState === "error" && ocrError && (
        <div className="flex items-start gap-3 mb-4 p-3"
          style={{
            backgroundColor: ocrErrorType === "address" ? "#fff8e1" : "#fef2f2",
            border: `1px solid ${ocrErrorType === "address" ? "#ffd54f" : "#fecaca"}`,
            borderRadius: 2,
          }}>
          {ocrErrorType === "address"
            ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
            : <X className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} strokeWidth={3} />
          }
          <div>
            <p className="text-xs font-semibold" style={{ color: ocrErrorType === "address" ? "#92400e" : "#dc2626" }}>
              {ocrErrorType === "address" ? "Address Validation Failed" : "ID Validation Failed"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: ocrErrorType === "address" ? "#78350f" : "#7f1d1d" }}>
              {ocrError}
            </p>
            <p className="text-xs mt-1.5" style={{ color: "#9ca3af" }}>
              {ocrErrorType === "address"
                ? "Only West Rembo residents with a valid street address may register. Please use a different ID that shows your West Rembo address."
                : "Please upload the correct ID type or go back to change your selection."}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {/* <button type="button" onClick={onSkip}
          className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider"
          style={{ borderRadius: 2, border: "1.5px solid #dde3ed", color: "#9ca3af" }}>
          Skip — Fill Manually
        </button> */}
        <button type="button" disabled={!canScan || ocrState === "scanning"} onClick={handleScan}
          className="flex-1 py-2.5 text-white text-xs font-semibold uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
          style={{ borderRadius: 2, backgroundColor: ocrState === "error" ? "#c2467d" : "#0f2a5e" }}>
          {ocrState === "scanning" ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" />Scanning ID…</>
          ) : ocrState === "error" ? (
            <><RefreshCw className="w-3.5 h-3.5" />Retry Scan</>
          ) : (
            <><Scan className="w-3.5 h-3.5" />Scan &amp; Auto-Fill</>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── DropZone ─────────────────────────────────────────────────────────────────
type DropZoneProps = {
  label: string; file: File | null; error: string | null;
  onFileChange: (f: File | null) => void; hint: string;
};

const DropZone = ({ label, file, error, onFileChange, hint }: DropZoneProps) => {
  const [preview,  setPreview]  = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileChange(dropped);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>{label}</p>
      <label
        className="flex flex-col items-center justify-center cursor-pointer transition-all min-h-[140px] relative overflow-hidden"
        style={{
          border: `1.5px dashed ${error ? "#ef4444" : file ? "#c2467d" : dragging ? "#c2467d" : "#d1d5db"}`,
          backgroundColor: file ? "#fdf5f8" : dragging ? "#fdf5f8" : "#fafafa",
          borderRadius: 2, padding: preview ? 0 : 16,
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onMouseEnter={(e) => { if (!file) (e.currentTarget as HTMLElement).style.borderColor = "#c2467d"; }}
        onMouseLeave={(e) => { if (!file) (e.currentTarget as HTMLElement).style.borderColor = error ? "#ef4444" : "#d1d5db"; }}
      >
        {preview ? (
          <img src={preview} alt="ID preview" className="w-full h-full object-cover" style={{ minHeight: 140, maxHeight: 200 }} />
        ) : file ? (
          <>
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: "#c2467d" }}>
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            <span className="text-xs font-semibold text-center px-2" style={{ color: "#c2467d" }}>{file.name}</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mb-1.5" style={{ color: "#9ca3af" }} />
            <span className="text-xs text-center" style={{ color: "#6b7280" }}>
              <span className="font-semibold" style={{ color: "#0f2a5e" }}>Click to upload</span> or drag & drop
            </span>
            <span className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{hint}</span>
          </>
        )}
        {file && (
          <button type="button" onClick={(e) => { e.preventDefault(); onFileChange(null); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <X className="w-3 h-3" />
          </button>
        )}
        <input type="file" className="hidden" accept={ACCEPTED_ATTR}
          onChange={(e) => onFileChange(e.target.files?.[0] || null)} />
      </label>
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
          <X className="w-3 h-3 flex-shrink-0" strokeWidth={3} />{error}
        </p>
      )}
    </div>
  );
};

// ─── OCR Preview Banner ───────────────────────────────────────────────────────
const OcrPreviewBanner = ({
  result, idType, isPWD, onRescan,
}: {
  result: OcrResult; idType: string; isPWD: boolean; onRescan: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const fields = [
    { label: "First Name",    value: result.firstName   },
    { label: "Middle Name",   value: result.middleName  },
    { label: "Last Name",     value: result.lastName    },
    { label: "Date of Birth", value: result.dateOfBirth },
    { label: "Address",       value: result.address     },
    { label: "ID Number",     value: result.idNumber    },
  ].filter(f => f.value);

  return (
    <div className="mb-8 overflow-hidden" style={{ border: "1.5px solid #c2467d", borderRadius: 4, backgroundColor: "#fdf5f8" }}>
      <div className="flex items-center justify-between px-5 py-3 cursor-pointer"
        style={{ backgroundColor: "#c2467d" }} onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-white">
            <Check className="w-3 h-3" style={{ color: "#c2467d" }} strokeWidth={3} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            OCR Complete — Form auto-filled from {ALL_ID_TYPES.find(i => i.value === idType)?.label ?? "ID"}
            {isPWD && " · PWD ✓"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={(e) => { e.stopPropagation(); onRescan(); }}
            className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors">
            <RefreshCw className="w-3 h-3" />Rescan
          </button>
          <ChevronDown className="w-4 h-4 text-white transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }} />
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-4">
          {isPWD && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2"
              style={{ backgroundColor: "#e0f2fe", border: "1px solid #7dd3fc", borderRadius: 2 }}>
              <span className="text-sm">♿</span>
              <p className="text-xs font-semibold" style={{ color: "#0369a1" }}>
                PWD status auto-detected from ID — <code className="font-mono">is_pwd=true</code> will be sent on submission.
              </p>
            </div>
          )}
          <p className="text-xs mb-3 font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
            Extracted Fields — please review and edit if needed
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {fields.map(f => (
              <div key={f.label}>
                <p className="text-xs font-semibold" style={{ color: "#9ca3af" }}>{f.label}</p>
                <p className="text-sm font-medium" style={{ color: "#0f2a5e" }}>{f.value}</p>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-xs col-span-3" style={{ color: "#9ca3af" }}>
                No fields were extracted. Please fill the form manually.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ID Upload Modal ──────────────────────────────────────────────────────────
const IDUploadModal = ({
  open, onClose, onConfirm,
  idFront, idBack, setIdFront, setIdBack,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  idFront: File | null; idBack: File | null;
  setIdFront: (f: File | null) => void; setIdBack: (f: File | null) => void;
}) => {
  const [step, setStep] = useState<"requirements"|"upload">("requirements");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,60,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white overflow-hidden"
        style={{ borderRadius: 4, boxShadow: "0 8px 60px rgba(10,20,60,0.25)", border: "1px solid #dde3ed" }}>
        <div style={{ backgroundColor: "#0f2a5e", padding: "16px 24px" }} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#e8a0bf" }}>Identity Verification</p>
            <h2 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1rem" }}>Government-Issued ID Upload</h2>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />
        <div className="p-6">
          {step === "requirements" ? (
            <>
              <div className="flex items-start gap-3 mb-5 p-3"
                style={{ backgroundColor: "#fff8e1", border: "1px solid #ffd54f", borderRadius: 2 }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                <p className="text-xs" style={{ color: "#78350f" }}>Please read all requirements carefully before uploading your ID.</p>
              </div>
              <ul className="space-y-2.5 mb-5">
                {[
                  "You must be visibly holding the government ID in the photo",
                  "All ID details must be clearly readable — no blur, glare, or cropping",
                  "Your face must be fully visible and well-lit",
                  "Submit both the front and back of your ID",
                ].map(text => (
                  <li key={text} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "#c2467d" }} />
                    <span className="text-xs" style={{ color: "#6b7280" }}>{text}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                  style={{ borderRadius: 2, border: "1.5px solid #dde3ed", color: "#6b7280" }}>Cancel</button>
                <button type="button" onClick={() => setStep("upload")}
                  className="flex-1 px-4 py-2.5 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
                  style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}>
                  I Understand — Proceed <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-5">
                <DropZone label="Front of ID *" file={idFront} error={null} onFileChange={setIdFront} hint="Clear photo of the front side" />
                <DropZone label="Back of ID *"  file={idBack}  error={null} onFileChange={setIdBack}  hint="Clear photo of the back side" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("requirements")}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                  style={{ borderRadius: 2, border: "1.5px solid #c2467d", color: "#c2467d" }}>← Back</button>
                <button type="button" disabled={!idFront || !idBack} onClick={() => { onConfirm(); onClose(); }}
                  className="flex-1 px-4 py-2.5 text-white text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
                  style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}>Confirm Upload</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Data Privacy Modal ───────────────────────────────────────────────────────
const DataPrivacyModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,60,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white overflow-hidden"
        style={{ borderRadius: 4, boxShadow: "0 8px 60px rgba(10,20,60,0.25)", border: "1px solid #dde3ed", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ backgroundColor: "#0f2a5e", padding: "16px 24px" }} className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#e8a0bf" }}>Legal</p>
            <h2 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1rem" }}>Data Privacy Notice</h2>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}><X className="w-4 h-4" /></button>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d", flexShrink: 0 }} />
        <div className="overflow-y-auto p-6 text-xs space-y-4" style={{ color: "#6b7280", lineHeight: 1.7 }}>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Republic Act No. 10173 — Data Privacy Act of 2012</p>
          <p>Barangay West Rembo, City of Taguig, is committed to protecting and respecting your privacy. This notice explains how we collect, use, and protect your personal data in compliance with the Data Privacy Act of 2012 (RA 10173).</p>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Purpose of Data Collection</p>
          <p>The personal information you provide — including your name, address, date of birth, contact details, and government-issued ID — is collected solely for the purpose of resident registration, verification of identity, and delivery of barangay services.</p>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Data Processing & Storage</p>
          <p>Your data will be stored securely and will only be accessed by authorized barangay personnel. We do not sell, trade, or transfer your personal information to third parties without your consent, except as required by law.</p>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Your Rights</p>
          <ul className="space-y-1 list-disc pl-4">
            <li>Right to be informed of the processing of your personal data</li>
            <li>Right to access your personal data held by the barangay</li>
            <li>Right to object to processing in certain circumstances</li>
            <li>Right to erasure or blocking of unlawfully processed data</li>
            <li>Right to file a complaint with the National Privacy Commission</li>
          </ul>
          <p>For questions or concerns about your data, please contact the Barangay West Rembo office directly.</p>
          <p className="text-xs" style={{ color: "#9ca3af" }}>By submitting this registration form, you acknowledge that you have read and understood this Data Privacy Notice and consent to the processing of your personal data for the stated purposes.</p>
        </div>
        <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid #e5e7eb" }}>
          <button type="button" onClick={onClose}
            className="w-full py-2.5 text-white text-xs font-semibold uppercase tracking-wider"
            style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Register Component ──────────────────────────────────────────────────
const Register = () => {
  // ── Flow state (2 steps: ocr → form) ──
  const [flowStep,       setFlowStep]       = useState<"ocr"|"form">("ocr");
  const [ocrResult,      setOcrResult]      = useState<OcrResult | null>(null);
  const [selectedIdType, setSelectedIdType] = useState<string>("");
  const [isPwdUser,      setIsPwdUser]      = useState(false);

  // ── Form state ──
  const [formData, setFormData] = useState({
    firstName: "", middleName: "", surname: "", email: "", phone: "",
    gender: "", dateOfBirth: "", houseBlockLotNo: "", street: "",
    zonePurok: "", password: "", confirmPassword: "",
  });

  // ── ID files ──
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack,  setIdBack]  = useState<File | null>(null);

  // ── UI state ──
  const [showIDModal,      setShowIDModal]      = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPassword,     setShowPassword]     = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [isLoading,        setIsLoading]        = useState(false);
  const [dobError,         setDobError]         = useState<string | null>(null);
  const [streets,          setStreets]          = useState<any[]>([]);
  const [zoneOptions,      setZoneOptions]      = useState<string[]>([]);

  // ── reCAPTCHA ──
  const recaptchaRef  = useRef<ReCAPTCHA>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    axios.get("https://westrembomis.onrender.com/api/streets", { withCredentials: true })
      .then(res => setStreets(res.data?.data ?? res.data ?? []))
      .catch(e => console.error("Failed to fetch streets:", e));
  }, []);

  useEffect(() => {
    if (formData.street) {
      const filtered = Array.from(new Set(
        streets
          .filter((s: any) => s.name.trim().toLowerCase() === formData.street.trim().toLowerCase())
          .map((s: any) => s.sitio ?? "")
          .filter((z: string) => z !== "")
      )).sort((a: any, b: any) => {
        const aN = parseInt(String(a).replace(/\D/g, ""), 10);
        const bN = parseInt(String(b).replace(/\D/g, ""), 10);
        if (!isNaN(aN) && !isNaN(bN)) return aN - bN;
        return String(a).localeCompare(String(b));
      });
      setZoneOptions(filtered as string[]);
    } else {
      setZoneOptions([]);
    }
  }, [formData.street, streets]);

  useEffect(() => { recaptchaRef.current?.reset(); setCaptchaToken(null); }, []);

  const updateField = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleDobChange = (value: string) => {
    updateField("dateOfBirth", value);
    if (!value) { setDobError(null); return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(value) >= today) setDobError("Invalid Date of Birth. Only past dates are allowed.");
    else setDobError(null);
  };

  const handleDobFocus = () => { if (!formData.dateOfBirth) handleDobChange(getDefaultAdultDateString()); };

  const handleStreetChange = (value: string) => {
    updateField("street", value);
    if (formData.zonePurok) updateField("zonePurok", "");
  };

  const sortSitios = (arr: string[]) => [...arr].sort((a, b) => {
    const aN = parseInt(a.replace(/\D/g, ""), 10), bN = parseInt(b.replace(/\D/g, ""), 10);
    if (!isNaN(aN) && !isNaN(bN)) return aN - bN;
    return a.localeCompare(b);
  });

  const rawZones     = Array.from(new Set(streets.map((s: any) => s.sitio).filter(Boolean)));
  const uniqueZones  = rawZones.length > 0
    ? sortSitios(rawZones as string[])
    : ["Sitio 1","Sitio 2","Sitio 3","Sitio 4","Sitio 5","Sitio 6","Sitio 7","Sitio 8","Sitio 9"];
  const displayZones = formData.street && zoneOptions.length > 0 ? zoneOptions : uniqueZones;

  const passwordRules = [
    { label: "Maximum 10 characters",               valid: formData.password.length >= 1 && formData.password.length <= 10 },
    { label: "Contains an uppercase letter",         valid: /[A-Z]/.test(formData.password) },
    { label: "Contains a lowercase letter",          valid: /[a-z]/.test(formData.password) },
    { label: "Contains a numeric digit",             valid: /\d/.test(formData.password) },
    { label: "Contains a special character (!@#…)",  valid: /[^A-Za-z0-9]/.test(formData.password) },
  ];
  const passwordValid = formData.password.length > 0 && passwordRules.every(r => r.valid);

  // ── Street fuzzy match ──
  const matchStreetFromOcr = (addressText: string): { street: string; sitio: string } | null => {
    if (!addressText || streets.length === 0) return null;
    const haystack = addressText.toUpperCase();
    let best: { street: string; sitio: string; score: number } | null = null;
    for (const s of streets as any[]) {
      const streetName: string = s.name.toUpperCase();
      const formerly: string   = s.formerly ? (s.formerly as string).toUpperCase() : "";
      const tokens = streetName.replace(/STREET|AVENUE|AVE|EXTENSION|EXT|CORNER/g, "").split(/[\s,.]+/).filter(t => t.length > 2);
      const score  = tokens.filter(t => haystack.includes(t)).length;
      let formerScore = 0;
      if (formerly) {
        const ft = formerly.split(/[\s,.]+/).filter(t => t.length > 2);
        formerScore = ft.filter(t => haystack.includes(t)).length;
      }
      const finalScore = Math.max(score, formerScore);
      if (finalScore > 0 && (!best || finalScore > best.score))
        best = { street: s.name, sitio: s.sitio ?? "", score: finalScore };
    }
    return best && best.score > 0 ? { street: best.street, sitio: best.sitio } : null;
  };

  // ── OCR complete handler ──
  const handleOcrComplete = (result: OcrResult, front: File, back: File | null) => {
    setOcrResult(result);
    setIdFront(front);
    if (back) setIdBack(back);

    // PWD is auto-detected from OCR scan — no manual question needed
    if (result.isPWD !== undefined) setIsPwdUser(result.isPWD);

    const streetMatch = result.address ? matchStreetFromOcr(result.address) : null;

    setFormData(prev => ({
      ...prev,
      firstName:       result.firstName  ?? prev.firstName,
      middleName:      result.middleName ?? prev.middleName,
      surname:         result.lastName   ?? prev.surname,
      dateOfBirth:     result.dateOfBirth ?? prev.dateOfBirth,
      houseBlockLotNo: result.address ? result.address.split(",")[0]?.trim() ?? prev.houseBlockLotNo : prev.houseBlockLotNo,
      street:    streetMatch ? streetMatch.street : prev.street,
      zonePurok: streetMatch?.sitio ? streetMatch.sitio : prev.zonePurok,
    }));

    if (result.dateOfBirth) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(result.dateOfBirth) >= today) setDobError("Invalid Date of Birth. Only past dates are allowed.");
      else setDobError(null);
    }

    setFlowStep("form");

    const autoFilledFields = [
      result.firstName && "First Name",
      result.lastName && "Last Name",
      result.dateOfBirth && "Date of Birth",
      streetMatch && `Street (${streetMatch.street})`,
      streetMatch?.sitio && `Zone (${streetMatch.sitio})`,
    ].filter(Boolean).join(", ");

    toast({
      title: "ID Scanned & Validated Successfully",
      description: autoFilledFields
        ? `Auto-filled: ${autoFilledFields}. Please review before submitting.`
        : "Form populated. Please review and complete any missing fields.",
    });
  };

  const handleOcrSkip = () => { setOcrResult(null); setFlowStep("form"); };
  const handleRescan  = () => { setFlowStep("ocr"); setOcrResult(null); };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.surname || !formData.email || !formData.password || !formData.confirmPassword || !formData.dateOfBirth || !formData.gender) {
      toast({ title: "Error", description: "Please fill in all required fields including Sex", variant: "destructive" }); return;
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(formData.dateOfBirth) >= today) {
      setDobError("Invalid Date of Birth. Only past dates are allowed.");
      toast({ title: "Invalid Date of Birth", description: "Only past dates are allowed.", variant: "destructive" }); return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" }); return;
    }
    if (!passwordValid) {
      toast({ title: "Error", description: "Please fix password requirements", variant: "destructive" }); return;
    }
    if (!idFront || !idBack) {
      toast({ title: "Error", description: "Please upload both the front and back of your government ID", variant: "destructive" }); return;
    }
    if (!captchaToken) {
      toast({ title: "CAPTCHA Required", description: "Please complete the reCAPTCHA verification.", variant: "destructive" }); return;
    }

    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("first_name",            formData.firstName);
      form.append("surname",               formData.surname);
      form.append("email",                 formData.email);
      form.append("contact_number",        formData.phone);
      const normSex = (v: string) => v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "";
      form.append("sex",                   normSex(formData.gender));
      form.append("date_of_birth",         formData.dateOfBirth);
      form.append("house_block_lot_no",    formData.houseBlockLotNo);
      form.append("street",                formData.street);
      form.append("zone_purok",            formData.zonePurok);
      form.append("password",              formData.password);
      form.append("password_confirmation", formData.confirmPassword);
      form.append("id_url",                idFront as File);
      form.append("id_url_back",           idBack  as File);
      form.append("recaptcha_token",       captchaToken ?? "");
      form.append("is_pwd",                String(isPwdUser));
      if (selectedIdType) form.append("id_type", selectedIdType);

      await api.post("/api/register", form, { headers: { "Content-Type": "multipart/form-data" } });
      toast({ title: "Registration Successful", description: "Please check your email for verification instructions." });
      navigate("/email-verification", { state: { email: formData.email } });
    } catch (error: any) {
      recaptchaRef.current?.reset(); setCaptchaToken(null);
      const msg = error.response?.data?.message || "Registration failed.";
      toast({ title: msg.includes("reCAPTCHA") ? "CAPTCHA Failed" : "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ firstName: "", middleName: "", surname: "", email: "", phone: "", gender: "", dateOfBirth: "", houseBlockLotNo: "", street: "", zonePurok: "", password: "", confirmPassword: "" });
    setIdFront(null); setIdBack(null);
    setDobError(null); setZoneOptions([]);
    recaptchaRef.current?.reset(); setCaptchaToken(null);
    setOcrResult(null); setIsPwdUser(false);
    setFlowStep("ocr");
  };

  const underlineInput = "rounded-none border-0 border-b-2 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm";
  const idUploaded     = idFront && idBack;

  // ── Progress steps config (2 steps now) ──
  const progressSteps = [
    { step: "ocr",  label: "ID Scan",      icon: <Scan className="w-3.5 h-3.5" />     },
    { step: "form", label: "Registration", icon: <FileText className="w-3.5 h-3.5" /> },
  ];
  const stepOrder      = ["ocr", "form"];
  const currentStepIdx = stepOrder.indexOf(flowStep);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AuthLayout>
      <IDUploadModal open={showIDModal} onClose={() => setShowIDModal(false)} onConfirm={() => {}}
        idFront={idFront} idBack={idBack} setIdFront={setIdFront} setIdBack={setIdBack} />
      <DataPrivacyModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      <div className="w-full max-w-4xl bg-white overflow-hidden"
        style={{ borderRadius: 4, boxShadow: "0 2px 40px rgba(10,20,60,0.15)", border: "1px solid #dde3ed" }}>

        {/* Header */}
        <div style={{ backgroundColor: "#0f2a5e", padding: "20px 40px" }} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-0.5" style={{ color: "#e8a0bf" }}>
              Republic of the Philippines · City of Taguig
            </p>
            <h1 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1.15rem" }}>
              Barangay West Rembo — Resident Registration
            </h1>
          </div>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />

        {/* Progress Indicator */}
        <div className="flex items-center px-8 md:px-10 py-4"
          style={{ backgroundColor: "#f8f9fb", borderBottom: "1px solid #e5e7eb" }}>
          {progressSteps.map((s, i) => {
            const sIdx     = stepOrder.indexOf(s.step);
            const isActive = s.step === flowStep;
            const isDone   = sIdx < currentStepIdx;
            return (
              <div key={s.step} className="flex items-center gap-2">
                {i > 0 && (
                  <div className="w-8 h-px mx-2"
                    style={{ backgroundColor: stepOrder.indexOf(progressSteps[i - 1].step) < currentStepIdx ? "#c2467d" : "#dde3ed" }} />
                )}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: isActive ? "#0f2a5e" : isDone ? "#c2467d" : "#e5e7eb",
                      color: isActive || isDone ? "white" : "#9ca3af",
                    }}>
                    {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : s.icon}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider hidden sm:block"
                    style={{ color: isActive ? "#0f2a5e" : "#9ca3af" }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 md:p-10">

          {/* ── STEP 1: OCR ── */}
          {flowStep === "ocr" && (
            <OcrStep
              onComplete={handleOcrComplete}
              onSkip={handleOcrSkip}
              onSelectIdType={setSelectedIdType}
              liveStreets={streets as WestRemboStreet[]}
            />
          )}

          {/* ── STEP 2: Registration Form ── */}
          {flowStep === "form" && (
            <>
              {ocrResult ? (
                <OcrPreviewBanner
                  result={ocrResult}
                  idType={selectedIdType}
                  isPWD={isPwdUser}
                  onRescan={handleRescan}
                />
              ) : (
                <div className="flex items-center gap-3 mb-8 p-3"
                  style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d2fe", borderRadius: 2 }}>
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "#6366f1" }} />
                  <p className="text-xs" style={{ color: "#374151" }}>
                    Filling manually. You can{" "}
                    <button type="button" onClick={() => setFlowStep("ocr")}
                      className="font-semibold underline underline-offset-2" style={{ color: "#0f2a5e" }}>
                      go back and scan your ID
                    </button>{" "}
                    to auto-fill the form.
                  </p>
                </div>
              )}

              {/* PWD badge — shown only when auto-detected from scan */}
              {isPwdUser && (
                <div className="flex items-center gap-2.5 mb-6 px-4 py-2.5 w-fit"
                  style={{ backgroundColor: "#e0f2fe", border: "1px solid #7dd3fc", borderRadius: 2 }}>
                  <span className="text-sm">♿</span>
                  <p className="text-xs font-semibold" style={{ color: "#0369a1" }}>
                    PWD auto-detected from ID scan — <code className="font-mono">is_pwd=true</code> will be included in your registration.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Section 1 — Personal Information */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>1</div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Personal Information</h3>
                    <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { label: "First Name *",  field: "firstName",  placeholder: "Juan"      },
                      { label: "Middle Name",   field: "middleName", placeholder: "Santos"    },
                      { label: "Last Name *",   field: "surname",    placeholder: "dela Cruz" },
                    ].map(({ label, field, placeholder }) => (
                      <div key={field} className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                          {label}
                          {ocrResult && (formData as any)[field] && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-normal lowercase normal-case" style={{ color: "#c2467d" }}>
                              <Scan className="w-2.5 h-2.5" /> auto-filled
                            </span>
                          )}
                        </Label>
                        <Input type="text" placeholder={placeholder} value={(formData as any)[field]}
                          onChange={(e) => updateField(field, e.target.value)} className={underlineInput}
                          style={{ borderBottomColor: "#dde3ed" }}
                          onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                          onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")} />
                      </div>
                    ))}

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Sex</Label>
                      <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                        <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm"
                          style={{ borderBottomColor: "#dde3ed" }}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                        Date of Birth *
                        {ocrResult && formData.dateOfBirth && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-normal lowercase normal-case" style={{ color: "#c2467d" }}>
                            <Scan className="w-2.5 h-2.5" /> auto-filled
                          </span>
                        )}
                      </Label>
                      <Input type="date" value={formData.dateOfBirth}
                        onChange={(e) => handleDobChange(e.target.value)} onFocus={handleDobFocus}
                        className={underlineInput}
                        style={{ borderBottomColor: dobError ? "#ef4444" : "#dde3ed" }}
                        onFocusCapture={(e) => { (e.currentTarget as HTMLInputElement).style.borderBottomColor = dobError ? "#ef4444" : "#c2467d"; }}
                        onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderBottomColor = dobError ? "#ef4444" : "#dde3ed"; }} />
                      {dobError && (
                        <p className="flex items-center gap-1 text-xs font-medium mt-1" style={{ color: "#ef4444" }}>
                          <X className="w-3 h-3 flex-shrink-0" strokeWidth={3} />{dobError}
                        </p>
                      )}
                      {!dobError && formData.dateOfBirth && (
                        <p className="flex items-center gap-1 text-xs mt-1" style={{ color: "#9ca3af" }}>
                          <Check className="w-3 h-3 flex-shrink-0" /> Date accepted
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2 — Contact */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>2</div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Contact Information</h3>
                    <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Phone Number</Label>
                      <Input placeholder="09XXXXXXXXX" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} className={underlineInput} style={{ borderBottomColor: "#dde3ed" }} onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")} onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Email Address *</Label>
                      <Input type="email" placeholder="juan@email.com" value={formData.email} onChange={(e) => updateField("email", e.target.value)} className={underlineInput} style={{ borderBottomColor: "#dde3ed" }} onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")} onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")} />
                    </div>
                    <div className="hidden md:block" />
                  </div>
                </div>

                {/* Section 3 — Address */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>3</div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Address Information</h3>
                    <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                  </div>
                  {ocrResult?.address && (
                    <div className="flex items-start gap-2 mb-4 p-2.5"
                      style={{ backgroundColor: "#fff8e1", border: "1px solid #ffd54f", borderRadius: 2 }}>
                      <Scan className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                      <p className="text-xs" style={{ color: "#78350f" }}>
                        <span className="font-semibold">OCR detected address:</span> {ocrResult.address}
                        <br />Please manually confirm your Street and Zone/Station.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                        House / Block / Lot No.
                        {ocrResult?.address && formData.houseBlockLotNo && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-normal lowercase normal-case" style={{ color: "#c2467d" }}>
                            <Scan className="w-2.5 h-2.5" /> auto-filled
                          </span>
                        )}
                      </Label>
                      <Input placeholder="e.g., 123-A, Blk 5, Lot 12" value={formData.houseBlockLotNo} onChange={(e) => updateField("houseBlockLotNo", e.target.value)} className={underlineInput} style={{ borderBottomColor: "#dde3ed" }} onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")} onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Street Name</Label>
                      {streets.length > 0 ? (
                        <Select value={formData.street} onValueChange={handleStreetChange}>
                          <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: "#dde3ed" }}>
                            <SelectValue placeholder="Select street" />
                          </SelectTrigger>
                          <SelectContent>
                            {streets.map((s) => (
                              <SelectItem key={s.id} value={s.name}>
                                {s.name}{s.formerly ? ` (formerly ${s.formerly})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input placeholder="Enter street name" value={formData.street} onChange={(e) => handleStreetChange(e.target.value)} className={underlineInput} style={{ borderBottomColor: "#dde3ed" }} onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")} onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")} />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Zone / Station</Label>
                      <Select value={formData.zonePurok} onValueChange={(v) => updateField("zonePurok", v)} disabled={!formData.street}>
                        <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm"
                          style={{ borderBottomColor: "#dde3ed", opacity: !formData.street ? 0.5 : 1 }}>
                          <SelectValue placeholder={formData.street ? "Select zone / station" : "Select a street first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {displayZones.map((z) => (<SelectItem key={z} value={z}>{z}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      {!formData.street && <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>Please select a street first to see available zones</p>}
                      {formData.street && zoneOptions.length === 0 && <p className="text-xs mt-1" style={{ color: "#f59e0b" }}>No specific zones found for this street. Showing all zones.</p>}
                    </div>
                  </div>
                </div>

                {/* Section 4 — Credentials & Documents */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>4</div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Credentials & Documents</h3>
                    <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ID Upload status */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                        Government-Issued ID with Address *
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { file: idFront, side: "Front", hint: "id_url"      },
                          { file: idBack,  side: "Back",  hint: "id_url_back" },
                        ].map(({ file, side, hint }) => (
                          <div key={side} className="flex flex-col items-center justify-center p-4 min-h-[100px]"
                            style={{
                              border: `1.5px dashed ${file ? "#c2467d" : "#d1d5db"}`,
                              backgroundColor: file ? "#fdf5f8" : "#fafafa", borderRadius: 2,
                            }}>
                            {file ? (
                              <>
                                <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1.5" style={{ backgroundColor: "#c2467d" }}>
                                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                </div>
                                <span className="text-xs font-semibold text-center" style={{ color: "#c2467d" }}>{side} Uploaded</span>
                                <span className="text-[10px] mt-0.5 text-center break-all" style={{ color: "#9ca3af" }}>{file.name}</span>
                                <span className="text-[10px] mt-1 flex items-center gap-0.5" style={{ color: "#c2467d" }}>{hint}</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mb-1" style={{ color: "#9ca3af" }} />
                                <span className="text-xs text-center" style={{ color: "#9ca3af" }}>{side} ({hint})</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => setShowIDModal(true)}
                        className="w-full py-2 text-xs font-semibold uppercase tracking-wider transition-all"
                        style={{ borderRadius: 2, border: `1.5px solid ${idUploaded ? "#c2467d" : "#dde3ed"}`, color: idUploaded ? "#c2467d" : "#9ca3af", backgroundColor: "transparent" }}>
                        {idUploaded ? "✓ Both IDs ready — Click to change" : "Click to upload / change IDs"}
                      </button>
                      <p className="text-xs" style={{ color: "#9ca3af" }}>
                        Accepted IDs: PhilSys, Driver's License, Passport, Voter's ID, NBI, SSS, PRC License, PWD ID, etc.
                      </p>
                    </div>

                    {/* Password */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Password *</Label>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={(e) => updateField("password", e.target.value)} maxLength={10} className={`${underlineInput} pr-8`} style={{ borderBottomColor: "#dde3ed" }} onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")} onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }}>
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Confirm Password *</Label>
                          <div className="relative">
                            <Input type={showConfirm ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} maxLength={10} className={`${underlineInput} pr-8`} style={{ borderBottomColor: "#dde3ed" }} onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")} onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")} />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-0 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }}>
                              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                              <div className="absolute left-0 -bottom-9 z-10 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white shadow-md"
                                style={{ backgroundColor: "#ef4444", borderRadius: 3, whiteSpace: "nowrap" }}>
                                <X className="w-3 h-3 flex-shrink-0" strokeWidth={3} /> Passwords do not match
                                <span className="absolute -top-1.5 left-3" style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid #ef4444" }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-2" style={{ backgroundColor: "#f8f9fb", border: "1px solid #e5e7eb", borderRadius: 2 }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#0f2a5e" }}>Password Requirements</p>
                        {passwordRules.map((rule) => (
                          <div key={rule.label} className="flex items-center gap-2">
                            {formData.password.length > 0 ? (
                              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: rule.valid ? "#d45ea3" : "#fee2e2" }}>
                                {rule.valid ? <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} /> : <X className="w-2.5 h-2.5" style={{ color: "#ef4444" }} strokeWidth={3} />}
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border flex-shrink-0" style={{ borderColor: "#d1d5db" }} />
                            )}
                            <span className="text-xs" style={{ color: "#6b7280" }}>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 5 — Data Privacy */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>5</div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Data Privacy</h3>
                    <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                  </div>
                  <div className="p-5 space-y-4" style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d2fe", borderRadius: 2 }}>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Data Privacy Notice</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
                      Your personal information will be collected and processed solely for the purpose of this barangay resident registration, in accordance with the{" "}
                      <button type="button" onClick={() => setShowPrivacyModal(true)}
                        className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-60" style={{ color: "#0f2a5e" }}>
                        Data Privacy Act of 2012 (RA 10173)
                      </button>.
                    </p>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input type="checkbox" required className="mt-0.5 flex-shrink-0"
                        style={{ accentColor: "#c2467d", width: 14, height: 14 }} />
                      <span className="text-xs" style={{ color: "#374151" }}>
                        I have read and understood the{" "}
                        <button type="button" onClick={() => setShowPrivacyModal(true)}
                          className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-60" style={{ color: "#0f2a5e" }}>
                          Data Privacy Notice
                        </button>.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Footer */}
                <div className="space-y-4 pt-6" style={{ borderTop: "1px solid #e5e7eb" }}>
                  <div className="flex flex-col items-end gap-1">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey="6LcxosUsAAAAAJpim7cdKsK_GgUJf8GBkPUNHtS1"
                      onChange={(token) => setCaptchaToken(token)}
                      onExpired={() => {
                        setCaptchaToken(null);
                        toast({ title: "CAPTCHA Expired", description: "Please complete the verification again.", variant: "destructive" });
                      }}
                      theme="light"
                    />
                    {!captchaToken && <p className="text-xs" style={{ color: "#ef4444" }}>↑ Please check the box above before submitting</p>}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      Already registered?{" "}
                      <Link to="/login" className="font-semibold hover:underline" style={{ color: "#0f2a5e" }}>Sign in here</Link>
                    </p>
                    <div className="flex gap-3">
                      <button type="button" onClick={handleClear}
                        className="px-6 py-2.5 text-sm font-semibold uppercase tracking-wider transition-all"
                        style={{ borderRadius: 2, border: "1.5px solid #c2467d", color: "#c2467d", backgroundColor: "transparent" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#fdf5f8"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}>
                        Clear Form
                      </button>
                      <button type="submit" disabled={isLoading || !captchaToken || !!dobError}
                        className="px-8 py-2.5 text-white text-sm font-semibold uppercase tracking-wider transition-all disabled:opacity-60"
                        style={{ borderRadius: 2, backgroundColor: "#0f2a5e", letterSpacing: "0.08em" }}
                        onMouseEnter={(e) => { if (!isLoading && captchaToken && !dobError) (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"; }}
                        onMouseLeave={(e) => { if (!isLoading && captchaToken && !dobError) (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2a5e"; }}>
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Submitting…
                          </span>
                        ) : !captchaToken ? "Complete CAPTCHA to Submit" : "Submit Registration"}
                      </button>
                    </div>
                  </div>
                </div>

              </form>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;