import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle, Copy, Check, Clock, Calendar, X,
  FileText, IdCard, Timer, DollarSign, Info, AlertTriangle,
  ClipboardCheck,
} from "lucide-react";
import { toUpperCase } from "./formUtils";
import Header from "@/components/forms/Header";
import { calculateAge } from "./BarangayCertificateForm";

interface BarangayClearanceFormProps { onBack?: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }
interface ServiceInfo { requirements: string[]; processing_time: string; fee: string; }

// ─── Validation helpers ────────────────────────────────────────────────────────
const MIN_AGE = 15;

const todayDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const PH_HOLIDAYS: string[] = [
  // 2025
  "2025-01-01", "2025-04-09", "2025-04-17", "2025-04-18",
  "2025-05-01", "2025-06-12", "2025-08-21", "2025-08-25",
  "2025-11-01", "2025-11-30", "2025-12-08", "2025-12-25", "2025-12-30", "2025-12-31",
  // 2026
  "2026-01-01", "2026-04-02", "2026-04-03", "2026-04-09",
  "2026-05-01", "2026-06-12", "2026-08-21", "2026-08-25",
  "2026-11-01", "2026-11-30", "2026-12-08", "2026-12-25", "2026-12-30", "2026-12-31",
];

const isHoliday = (dateStr: string) => PH_HOLIDAYS.includes(dateStr);

const toDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const isSelectableDate = (dateStr: string): boolean => {
  const date = new Date(dateStr + "T00:00:00");
  const today = todayDate();
  if (date < today) return false;
  if (date.getFullYear() > 2026) return false;
  if (isWeekend(date)) return false;
  if (isHoliday(dateStr)) return false;
  return true;
};

const validateScheduleDate = (value: string): string => {
  if (!value) return "Schedule date is required.";
  const date = new Date(value + "T00:00:00");
  const year = date.getFullYear();
  if (year > 2026) return "Scheduling beyond 2026 is not allowed. Please select a date within this year.";
  if (isWeekend(date)) return "Weekends (Saturday & Sunday) are not available. Please choose a weekday.";
  if (isHoliday(value)) return "Selected date is a Philippine holiday. Barangay services are unavailable on this day.";
  return "";
};

const validateRequired = (value: string, fieldName: string): string => {
  if (!value || value.trim() === "") return `${fieldName} is required.`;
  return "";
};

const validatePeriodOfResidency = (value: string): string => {
  if (!value || value.trim() === "") return "Period of residency is required.";
  if (!/^\d+\s*(year|years|month|months)?$/i.test(value.trim()))
    return "Please enter a valid period (e.g., 5 years, 6 months).";
  return "";
};

const validatePurpose = (value: string): string => {
  if (!value || value.trim() === "") return "Purpose is required.";
  return "";
};

// DOB must be strictly in the past — today and any future date are invalid
const validateDob = (value: string): string => {
  if (!value) return "Date of birth is required.";
  const dob = new Date(value + "T00:00:00");
  const today = todayDate();
  if (dob >= today) return "Date of birth must be in the past. Today and future dates are not allowed.";
  return "";
};

const parseAddress = (address: string) => {
  if (!address) return { house_block_lot_no: "", street: "", zone: "" };
  const parts = address.split(",").map((p) => p.trim());
  return { house_block_lot_no: parts[0] || "", street: parts[1] || "", zone: parts[2] || "" };
};

const getTimeSlotAvailability = (selectedDate: string) => {
  const today = toDateString(new Date());
  if (selectedDate !== today) {
    return { morningDisabled: false, afternoonDisabled: false };
  }
  const now = new Date();
  const currentHour = now.getHours();
  const morningDisabled = currentHour >= 12;
  const afternoonDisabled = currentHour >= 18;
  return { morningDisabled, afternoonDisabled };
};

// ─── Register Dependent Toggle ─────────────────────────────────────────────────
function RegisterDependentToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-4 rounded-lg mb-6 transition-all"
      style={{
        backgroundColor: enabled ? "#fffbeb" : "#f9fafb",
        border: `1.5px solid ${enabled ? "#f59e0b" : "#e5e7eb"}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: enabled ? "#fef3c7" : "#f3f4f6" }}
        >
          <svg
            className="w-4 h-4"
            style={{ color: enabled ? "#d97706" : "#9ca3af" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: enabled ? "#92400e" : "#374151" }}>
            Register Dependent
          </p>
          <p className="text-xs mt-0.5" style={{ color: enabled ? "#b45309" : "#9ca3af" }}>
            {enabled
              ? "Auto-fill is OFF — all fields are now manually editable for dependent registration"
              : "Toggle on to register a family member or dependent instead of yourself"}
          </p>
          {enabled && (
            <div
              className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full w-fit"
              style={{ backgroundColor: "#fef3c7", border: "1px solid #fcd34d" }}
            >
              <svg
                className="w-3 h-3"
                style={{ color: "#d97706" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs font-semibold" style={{ color: "#92400e" }}>
                Enter the dependent's information in all fields below
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Slider toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className="relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 focus:outline-none transition-colors duration-200"
        style={{ backgroundColor: enabled ? "#f59e0b" : "#d1d5db" }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200"
          style={{ transform: enabled ? "translateX(24px)" : "translateX(4px)" }}
        />
      </button>
    </div>
  );
}

// ─── Scheduling Info Modal ────────────────────────────────────────────────────
const SchedulingInfoModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,60,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md bg-white overflow-hidden"
        style={{ borderRadius: 4, boxShadow: "0 8px 60px rgba(10,20,60,0.25)", border: "1px solid #dde3ed" }}
      >
        <div style={{ backgroundColor: "#0f2a5e", padding: "16px 24px" }} className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#e8a0bf" }}>Document Pickup</p>
            <h2 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1rem" }}>Pickup Scheduling Guide</h2>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#0284c7" }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#0369a1" }}>What is a Pickup Appointment?</p>
              <p className="text-sm font-semibold" style={{ color: "#0c4a6e" }}>Schedule when to claim your document</p>
              <p className="text-xs mt-0.5" style={{ color: "#0369a1" }}>Once your request is approved, visit the barangay office in person on your chosen date to receive your document.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <ClipboardCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#16a34a" }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#15803d" }}>What to Bring</p>
              <p className="text-sm font-semibold" style={{ color: "#14532d" }}>Valid government-issued ID</p>
              <p className="text-xs mt-0.5" style={{ color: "#15803d" }}>Present a valid ID when claiming. If someone is picking up on your behalf, they must bring an authorization letter and their own valid ID.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#ea580c" }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#c2410c" }}>Be On Time</p>
              <p className="text-sm font-semibold" style={{ color: "#7c2d12" }}>Arrive within office hours</p>
              <p className="text-xs mt-0.5" style={{ color: "#c2410c" }}>Please arrive during regular office hours on your scheduled date. Missing your pickup date may require rescheduling.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#fafafa", border: "1px solid #e5e7eb" }}>
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#6b7280" }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#374151" }}>Missed Your Schedule?</p>
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>Contact the office to reschedule</p>
              <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>If you cannot pick up on your scheduled date, please coordinate with the barangay office as soon as possible to set a new pickup date.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-full py-2.5 text-white text-xs font-semibold uppercase tracking-wider" style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Data Privacy Modal ──────────────────────────────────────────────────────
const DataPrivacyModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,60,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg bg-white overflow-hidden"
        style={{ borderRadius: 4, boxShadow: "0 8px 60px rgba(10,20,60,0.25)", border: "1px solid #dde3ed", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
      >
        <div style={{ backgroundColor: "#0f2a5e", padding: "16px 24px" }} className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#e8a0bf" }}>Legal</p>
            <h2 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1rem" }}>
              Data Privacy Notice
            </h2>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d", flexShrink: 0 }} />
        <div className="overflow-y-auto p-6 text-xs space-y-4" style={{ color: "#6b7280", lineHeight: 1.7 }}>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Republic Act No. 10173 — Data Privacy Act of 2012</p>
          <p>Barangay West Rembo, City of Taguig, is committed to protecting and respecting your privacy.</p>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Purpose of Data Collection</p>
          <p>The personal information you provide is collected solely for the purpose of resident registration, verification of identity, and delivery of barangay services.</p>
          <p className="font-semibold" style={{ color: "#0f2a5e" }}>Your Rights</p>
          <ul className="space-y-1 list-disc pl-4">
            <li>Right to be informed of the processing of your personal data</li>
            <li>Right to access your personal data held by the barangay</li>
            <li>Right to object to processing in certain circumstances</li>
            <li>Right to erasure or blocking of unlawfully processed data</li>
            <li>Right to file a complaint with the National Privacy Commission</li>
          </ul>
        </div>
        <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid #e5e7eb" }}>
          <button type="button" onClick={onClose} className="w-full py-2.5 text-white text-xs font-semibold uppercase tracking-wider" style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Success Modal ──────────────────────────────────────────────────────────
const SuccessModal = ({
  successData,
  onBack,
}: {
  successData: { id: number; refNo: string; scheduleTime?: string; scheduleDate?: string } | null;
  onBack: () => void;
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  if (!successData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
      <div className="w-full sm:max-w-lg md:max-w-xl overflow-hidden" style={{ borderRadius: "20px", backgroundColor: "white", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
        <div className="relative overflow-hidden px-6 pt-8 pb-6 text-center" style={{ backgroundColor: "#0f2a5e" }}>
          <div className="absolute right-[-24px] bottom-[-24px] w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
          <div className="absolute left-[-16px] top-[-16px] w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <p className="text-white font-bold text-xl relative z-10 mb-1">Request Submitted!</p>
          <p className="text-sm relative z-10" style={{ color: "rgba(255,255,255,0.65)" }}>Barangay Clearance & Appointment Scheduled</p>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af" }}>Reference Number</p>
              <p className="text-lg font-black font-mono" style={{ color: "#0f2a5e" }}>{successData.refNo}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(successData.refNo); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="p-2 rounded-lg" style={{ backgroundColor: "#f3f4f6", color: copied ? "#16a34a" : "#9ca3af" }}>
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "#f0fdf4", border: "1px solid #dcfce7" }}>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 mt-0.5" style={{ color: "#16a34a" }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-1">Appointment Scheduled</p>
                <p className="text-sm font-semibold text-green-900">{successData.scheduleDate}</p>
                <p className="text-sm text-green-700">{successData.scheduleTime}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-center leading-relaxed" style={{ color: "#6b7280" }}>
            Please arrive 10 minutes early on your scheduled date.
          </p>
          <button onClick={() => navigate(`/request/barangay_clearance/${successData.id}?fromSubmit=1`)} className="w-full py-3 text-sm font-bold text-white rounded-lg hover:opacity-90" style={{ backgroundColor: "#0f2a5e" }}>
            View My Request
          </button>
          <button onClick={onBack} className="w-full py-3 text-sm font-semibold rounded-lg" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
            Back to Services
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Field Legend ────────────────────────────────────────────────────────────
const FieldLegend = () => (
  <div className="flex flex-wrap items-center gap-4 mb-6 px-4 py-3 rounded-lg" style={{ backgroundColor: "#f8f9fb", border: "1px solid #e5e7eb" }}>
    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#374151" }}>Field Guide:</p>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#f0f4ff", border: "1.5px solid #c7d2fe" }} />
      <span className="text-xs" style={{ color: "#6b7280" }}>Auto-filled / Read-only</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#fff7ed", border: "1.5px solid #fed7aa" }} />
      <span className="text-xs" style={{ color: "#6b7280" }}>Required — fill this in</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#f0fdf4", border: "1.5px solid #bbf7d0" }} />
      <span className="text-xs" style={{ color: "#6b7280" }}>Optional — editable</span>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────
const BarangayClearanceForm = ({ onBack }: BarangayClearanceFormProps = {}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [successData, setSuccessData] = useState<{ id: number; refNo: string; scheduleTime?: string; scheduleDate?: string } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ morning: any; afternoon: any } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [loadingServiceInfo, setLoadingServiceInfo] = useState(true);

  // ── Dependent toggle state ──
  const [isDependent, setIsDependent] = useState(false);
  // Stores the auto-fetched user data so we can restore it when toggling back off
  const autoFilledDataRef = useRef<Partial<typeof formData>>({});

  const [errors, setErrors] = useState({
    period_of_residency: "",
    purpose: "",
    schedule_date: "",
    time_group: "",
    house_owner: "",
    relationship_to_owner: "",
    dob: "",
  });

  const { toast } = useToast();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("https://westrembomis.onrender.com/api/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) { console.error("Failed to fetch streets:", e); }
    };
    load();
  }, []);

  useEffect(() => {
    const loadServiceInfo = async () => {
      setLoadingServiceInfo(true);
      try {
        const res = await axios.get("https://westrembomis.onrender.com/api/services", { withCredentials: true });
        const services: any[] = res.data?.data ?? res.data ?? [];
        const clearance = services.find((s) => s.name === "Barangay Clearance");
        if (clearance) {
          setServiceInfo({
            requirements: clearance.requirements
              ? clearance.requirements.split("\n").map((r: string) => r.trim()).filter(Boolean)
              : [],
            processing_time: clearance.processing_time ?? "",
            fee: clearance.fee ?? "",
          });
        }
      } catch (e) { console.error("Failed to fetch service info:", e); }
      finally { setLoadingServiceInfo(false); }
    };
    loadServiceInfo();
  }, []);

  const [formData, setFormData] = useState({
    requester_type: "Online",
    prefix: "", first_name: "", middle_name: "", surname: "", ext_name: "",
    age: "", dob: "", pob: "",
    contact_no: "", email: "",
    house_block_lot_no: "", street: "", zone: "",
    house_owner: "", relationship_to_owner: "",
    bcert_number: "", issued_date: "",
    period_of_residency: "", registered_voter: "",
    purpose: "", purpose_details: "",
    ctc_vrr_no: "", issued_at: "", issued_on: "", or_no: "", remarks: "",
    punong_barangay: "", for_the_punong_barangay: "",
    schedule_date: "",
    time_group: "",
    document_type: "barangay_clearance",
  });

  const upd = (f: string, v: string) => {
    // Fields that should NOT be uppercased (dates, email, and select-driven fields whose values must match exactly)
    const noUppercaseFields = ["email", "dob", "schedule_date", "issued_date", "issued_on", "prefix"];
    const value = noUppercaseFields.includes(f) ? v : toUpperCase(v);
    setFormData((p) => ({ ...p, [f]: value }));
    if (errors[f as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [f]: "" }));
    }
  };

  // ── Handle dependent toggle ──
  const handleDependentToggle = (enabled: boolean) => {
    setIsDependent(enabled);
    if (enabled) {
      // Clear all auto-filled personal / contact / address fields
      setFormData((prev) => ({
        ...prev,
        prefix: "",
        first_name: "",
        middle_name: "",
        surname: "",
        ext_name: "",
        age: "",
        dob: "",
        pob: "",
        contact_no: "",
        email: "",
        house_block_lot_no: "",
        street: "",
        zone: "",
        period_of_residency: "",
        registered_voter: "",
        house_owner: "",
        relationship_to_owner: "",
      }));
    } else {
      // Restore the saved auto-filled data
      setFormData((prev) => ({ ...prev, ...autoFilledDataRef.current }));
    }
  };

  const fetchAvailableSlots = async (date: string) => {
    if (!date) return;
    setLoadingSlots(true);
    try {
      const res = await axios.get("https://westrembomis.onrender.com/api/schedules/available-slots", {
        params: { document_type: formData.document_type, date },
        withCredentials: true,
      });
      setAvailableSlots(res.data?.data ?? null);
    } catch (error) { console.error("Failed to fetch available slots:", error); }
    finally { setLoadingSlots(false); }
  };

  const handleScheduleDateChange = (date: string) => {
    const err = validateScheduleDate(date);
    setErrors((prev) => ({ ...prev, schedule_date: err }));
    if (err) {
      upd("schedule_date", "");
      setAvailableSlots(null);
      setFormData((p) => ({ ...p, time_group: "" }));
      return;
    }
    upd("schedule_date", date);
    setFormData((p) => ({ ...p, schedule_date: date, time_group: "" }));
    fetchAvailableSlots(date);
  };

  const validateForm = (): boolean => {
    const newErrors = {
      ...errors,
      period_of_residency: validatePeriodOfResidency(formData.period_of_residency),
      purpose: validatePurpose(formData.purpose),
      schedule_date: validateRequired(formData.schedule_date, "Schedule date"),
      time_group: validateRequired(formData.time_group, "Time slot"),
      house_owner: validateRequired(formData.house_owner, "House owner"),
      relationship_to_owner: validateRequired(formData.relationship_to_owner, "Relationship to owner"),
      dob: isDependent ? validateDob(formData.dob) : "",
    };
    const isValid = Object.values(newErrors).every((e) => e === "");
    setErrors(newErrors);
    if (!isValid) toast({ title: "Validation Error", description: "Please fix the errors before submitting.", variant: "destructive" });
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const certRes = await axios.post(
        "https://westrembomis.onrender.com/api/barangay-clearances",
        { ...formData, age: formData.age ? Number(formData.age) : null },
        { withCredentials: true }
      );
      if (certRes.status === 201 || certRes.status === 200) {
        const documentNumber = certRes.data?.data?.service?.bcert_number;
        const scheduleRes = await axios.post(
          "https://westrembomis.onrender.com/api/schedules",
          { document_type: formData.document_type, document_number: documentNumber, schedule_date: formData.schedule_date, time_group: formData.time_group },
          { withCredentials: true }
        );
        if (scheduleRes.status === 201) {
          const schedule = scheduleRes.data?.data?.schedule;
          setSuccessData({
            id: certRes.data?.data?.service?.id,
            refNo: `REF-${String(certRes.data?.data?.service?.id).padStart(4, "0")}`,
            scheduleTime: schedule?.schedule_time,
            scheduleDate: schedule?.schedule_date,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: error.response?.status === 422 ? "Validation Error" : "Submission Error",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
      });
    } finally { setIsSubmitting(false); }
  };

  // ── Auto-fill from authenticated user — skipped when isDependent is on ──
  useEffect(() => {
    if (isDependent) return; // Do not auto-fill when registering a dependent

    const loadUser = async () => {
      try {
        const res = await axios.get("https://westrembomis.onrender.com/api/details", { withCredentials: true });
        const user = res.data.data;
        const normalizedDob = user.date_of_birth ? user.date_of_birth.split("T")[0] : "";
        const addressParts = parseAddress(user.address || "");
        let matchedStreet = toUpperCase(addressParts.street);
        if (addressParts.street && streets.length > 0) {
          const foundStreet = streets.find((s) =>
            addressParts.street.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(addressParts.street.toLowerCase())
          );
          if (foundStreet) matchedStreet = toUpperCase(foundStreet.name);
        }

        const profileHouseOwner = user.house_owner ?? user.houseOwner ?? user.house_owner_name ?? "";
        const VALID_RELATIONSHIPS = ["Owner", "Tenant", "Son", "Daughter", "Spouse", "Parent", "Sibling", "Relative", "Other"];
        const profileRelationship = user.relationship_to_owner ?? user.relationshipToOwner ?? user.relationship ?? "";
        const matchedRelationship = VALID_RELATIONSHIPS.find(
          (r) => r.toLowerCase() === String(profileRelationship).toLowerCase()
        ) ?? "";

        const filled = {
          prefix: user.prefix ?? "",
          first_name: user.first_name ?? "",
          middle_name: user.middle_name ?? "",
          surname: user.surname ?? "",
          ext_name: user.extension_name ?? "",
          dob: normalizedDob,
          pob: user.place_of_birth ?? "",
          contact_no: user.contact_number ?? "",
          email: user.email ?? "",
          house_block_lot_no: toUpperCase(addressParts.house_block_lot_no),
          street: matchedStreet,
          zone: toUpperCase(addressParts.zone),
          house_owner: profileHouseOwner ? toUpperCase(profileHouseOwner) : "",
          relationship_to_owner: matchedRelationship,
          period_of_residency: user.period_of_residency ?? "",
          age: normalizedDob ? String(calculateAge(normalizedDob)) : "",
          registered_voter: user.voter_status ? "Yes" : "No",
        };

        // Save a snapshot so we can restore it if the toggle is turned back off
        autoFilledDataRef.current = filled;

        setFormData((prev) => ({ ...prev, ...filled }));
      } catch (error) { console.error("Failed to load authenticated user:", error); }
    };
    loadUser();
  }, [streets, isDependent]); // re-runs when isDependent turns back off

  const getMinScheduleDate = () => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  };

  const getMaxScheduleDate = () => "2026-12-31";

  // ── Shared styles ──
  const readonlyStyle: React.CSSProperties = {
    borderBottomColor: "#c7d2fe",
    backgroundColor: "#f0f4ff",
  };
  const editableRequiredStyle: React.CSSProperties = {
    borderBottomColor: "#fed7aa",
    backgroundColor: "#fff7ed",
  };
  const editableOptionalStyle: React.CSSProperties = {
    borderBottomColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  };
  // When isDependent is on, auto-filled fields switch to this style
  const dependentEditableStyle: React.CSSProperties = {
    borderBottomColor: "#fcd34d",
    backgroundColor: "#fffbeb",
  };

  const readonlyInputCls = "rounded-none border-0 border-b-2 px-0 text-sm cursor-not-allowed opacity-80";
  const editableInputCls = "rounded-none border-0 border-b-2 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm";

  // ── Compute time-slot disabled states whenever schedule_date changes ──
  const { morningDisabled: isMorningPastDue, afternoonDisabled: isAfternoonPastDue } =
    getTimeSlotAvailability(formData.schedule_date);

  if (successData) return <SuccessModal successData={successData} onBack={handleBack} />;

  // ── Helper: badge for sections 1 & 2 ──
  const SectionBadge = () =>
    isDependent ? (
      <span
        className="text-xs px-2 py-0.5 rounded-full font-semibold"
        style={{ backgroundColor: "#fef3c7", color: "#d97706", border: "1px solid #fcd34d" }}
      >
        Enter Manually
      </span>
    ) : (
      <span
        className="text-xs px-2 py-0.5 rounded-full font-semibold"
        style={{ backgroundColor: "#f0f4ff", color: "#4338ca", border: "1px solid #c7d2fe" }}
      >
        Auto-filled
      </span>
    );
  

  return (
    <>
      <Header />
      <DataPrivacyModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <SchedulingInfoModal open={showSchedulingModal} onClose={() => setShowSchedulingModal(false)} />

      <div
        className="w-full max-w-4xl bg-white overflow-hidden items-start mx-auto my-24"
        style={{ borderRadius: 4, boxShadow: "0 2px 40px rgba(10,20,60,0.15)", border: "1px solid #dde3ed" }}
      >
        {/* ── Page Header ── */}
        <div style={{ backgroundColor: "#0f2a5e", padding: "20px 40px" }} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-0.5" style={{ color: "#e8a0bf" }}>
              Republic of the Philippines · City of Taguig
            </p>
            <h1 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1.15rem" }}>
              Barangay Clearance Application
            </h1>
          </div>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />

        <div className="p-8 md:p-10">

          {/* ── Before You Apply ── */}
          <div className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: "#fefce8", borderColor: "#fde047" }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: "#854d0e" }}>
              📌 Before You Apply
            </h3>
            {loadingServiceInfo ? (
              <div className="flex items-center gap-2" style={{ color: "#713f12" }}>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Loading service information...</span>
              </div>
            ) : serviceInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "#854d0e" }}>
                    <FileText className="w-4 h-4" /> Requirements
                  </h4>
                  <ul className="space-y-2 text-sm" style={{ color: "#713f12" }}>
                    {serviceInfo.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <IdCard className="w-4 h-4 mt-0.5 opacity-80 flex-shrink-0" />{req}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: "#854d0e" }}>
                      <Timer className="w-4 h-4" /> Processing Time
                    </h4>
                    <p className="text-sm font-medium pl-2" style={{ color: "#713f12" }}>{serviceInfo.processing_time}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: "#854d0e" }}>
                      <DollarSign className="w-4 h-4" /> Service Fee
                    </h4>
                    <p className="text-base font-bold pl-2" style={{ color: "#713f12" }}>
                      {serviceInfo.fee === "Free" ? "Free" : `₱${serviceInfo.fee}`}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "#713f12" }}>Service information is currently unavailable.</p>
            )}
          </div>

          {/* ── Field Legend ── */}
          <FieldLegend />

          {/* ── Register Dependent Toggle ── */}
          <RegisterDependentToggle enabled={isDependent} onChange={handleDependentToggle} />

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ═══════════════ Section 1 — Personal Information ═══════════════ */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>1</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Personal Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                <SectionBadge />
              </div>

              {/* Row 1: Prefix (Select in dependent mode), Surname, First Name, Middle Name */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Prefix — Select dropdown in dependent mode */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Prefix</Label>
                  {isDependent ? (
                    <Select value={formData.prefix} onValueChange={(v) => upd("prefix", v)}>
                      <SelectTrigger
                        className="rounded-none border-0 border-b-2 px-0 focus:ring-0 text-sm"
                        style={{ ...dependentEditableStyle, textTransform: "uppercase" }}
                        onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                        onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#fcd34d")}
                      >
                        <SelectValue placeholder="e.g. Mr., Ms." />
                      </SelectTrigger>
                      <SelectContent>
                        {["Mr.", "Mrs.", "Ms.", "Dr.", "Engr.", "Atty.", "Prof."].map((p) => (
                          <SelectItem key={p} value={p} style={{ textTransform: "uppercase" }}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.prefix}
                      readOnly
                      disabled
                      placeholder="e.g. Mr., Ms."
                      className={readonlyInputCls}
                      style={readonlyStyle}
                    />
                  )}
                </div>

                {/* Surname, First Name, Middle Name */}
                {(
                  [
                    { label: "Surname *", field: "surname", placeholder: "de la Cruz" },
                    { label: "First Name *", field: "first_name", placeholder: "Juan" },
                    { label: "Middle Name", field: "middle_name", placeholder: "Reyes" },
                  ] as const
                ).map(({ label, field, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>{label}</Label>
                    <Input
                      value={formData[field as keyof typeof formData] as string}
                      readOnly={!isDependent}
                      disabled={!isDependent}
                      placeholder={placeholder}
                      onChange={isDependent ? (e) => upd(field, e.target.value) : undefined}
                      className={isDependent ? editableInputCls : readonlyInputCls}
                      style={isDependent ? dependentEditableStyle : readonlyStyle}
                      onFocus={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#c2467d") : undefined}
                      onBlur={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#fcd34d") : undefined}
                    />
                  </div>
                ))}
              </div>

              {/* Row 2: Extension, Age, Date of Birth (no min/max), Place of Birth */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">

                {/* Extension */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Extension</Label>
                  <Input
                    type="text"
                    value={formData.ext_name}
                    readOnly={!isDependent}
                    disabled={!isDependent}
                    placeholder="Jr., Sr."
                    onChange={isDependent ? (e) => upd("ext_name", e.target.value) : undefined}
                    className={isDependent ? editableInputCls : readonlyInputCls}
                    style={isDependent ? dependentEditableStyle : readonlyStyle}
                    onFocus={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#c2467d") : undefined}
                    onBlur={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#fcd34d") : undefined}
                  />
                </div>

                {/* Age — read-only always (auto-calculated from DOB) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    readOnly
                    disabled
                    placeholder=""
                    className={readonlyInputCls}
                    style={readonlyStyle}
                  />
                </div>

                {/* Date of Birth — max = yesterday (today & future dates not allowed); auto-computes age */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={formData.dob}
                    readOnly={!isDependent}
                    disabled={!isDependent}
                    // max = yesterday so today and future dates are blocked at browser level too
                    max={(() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      return toDateString(yesterday);
                    })()}
                    onChange={isDependent ? (e) => {
                      const val = e.target.value;
                      const dobErr = val ? validateDob(val) : "Date of birth is required.";
                      setErrors((prev) => ({ ...prev, dob: dobErr }));
                      if (val) {
                        const computedAge = calculateAge(val);
                        setFormData((p) => ({ ...p, dob: val, age: String(computedAge) }));
                      } else {
                        setFormData((p) => ({ ...p, dob: val, age: "" }));
                      }
                    } : undefined}
                    className={isDependent ? editableInputCls : readonlyInputCls}
                    style={{
                      ...(isDependent ? dependentEditableStyle : readonlyStyle),
                      borderBottomColor: errors.dob ? "#ef4444" : isDependent ? "#fcd34d" : "#c7d2fe",
                    }}
                    onFocus={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#c2467d") : undefined}
                    onBlur={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = errors.dob ? "#ef4444" : "#fcd34d") : undefined}
                  />
                  {errors.dob && isDependent && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.dob}
                    </p>
                  )}
                </div>

                {/* Place of Birth */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Place of Birth *</Label>
                  <Input
                    type="text"
                    value={formData.pob}
                    readOnly={!isDependent}
                    disabled={!isDependent}
                    placeholder="Manila"
                    onChange={isDependent ? (e) => upd("pob", e.target.value) : undefined}
                    className={isDependent ? editableInputCls : readonlyInputCls}
                    style={isDependent ? dependentEditableStyle : readonlyStyle}
                    onFocus={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#c2467d") : undefined}
                    onBlur={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#fcd34d") : undefined}
                  />
                </div>
              </div>
            </div>

            {/* ═══════════════ Section 2 — Contact Information ═══════════════ */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>2</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Contact Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                <SectionBadge />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Contact Number *</Label>
                  <Input
                    type="tel"
                    placeholder="09XX XXX XXXX"
                    value={formData.contact_no}
                    readOnly={!isDependent}
                    disabled={!isDependent}
                    onChange={isDependent ? (e) => upd("contact_no", e.target.value) : undefined}
                    className={isDependent ? editableInputCls : readonlyInputCls}
                    style={isDependent ? dependentEditableStyle : readonlyStyle}
                    onFocus={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#c2467d") : undefined}
                    onBlur={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#fcd34d") : undefined}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="juan@email.com"
                    value={formData.email}
                    readOnly={!isDependent}
                    disabled={!isDependent}
                    onChange={isDependent ? (e) => upd("email", e.target.value) : undefined}
                    className={isDependent ? editableInputCls : readonlyInputCls}
                    style={isDependent ? dependentEditableStyle : readonlyStyle}
                    onFocus={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#c2467d") : undefined}
                    onBlur={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#fcd34d") : undefined}
                  />
                </div>
              </div>
            </div>

            {/* ═══════════════ Section 3 — Address Information ═══════════════ */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>3</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Address Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                {isDependent && <SectionBadge />}
              </div>

              {/* House/Block/Lot, Street (Select in dependent), Zone (Select in dependent) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* House / Block / Lot No. */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>House / Block / Lot No. *</Label>
                  <Input
                    placeholder="e.g., 123-A"
                    value={formData.house_block_lot_no}
                    readOnly={!isDependent}
                    disabled={!isDependent}
                    onChange={isDependent ? (e) => upd("house_block_lot_no", e.target.value) : undefined}
                    className={isDependent ? editableInputCls : readonlyInputCls}
                    style={isDependent ? dependentEditableStyle : readonlyStyle}
                    onFocus={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#c2467d") : undefined}
                    onBlur={isDependent ? (e) => (e.currentTarget.style.borderBottomColor = "#fcd34d") : undefined}
                  />
                </div>

                {/* Street — Select dropdown populated from API in dependent mode */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Street *</Label>
                  {isDependent ? (
                    <Select
                      value={formData.street}
                      onValueChange={(v) => {
                        const matched = streets.find((s) => toUpperCase(s.name) === v);
                        const sitio = matched?.sitio ? toUpperCase(matched.sitio) : "";
                        setFormData((p) => ({ ...p, street: v, zone: sitio }));
                      }}
                    >
                      <SelectTrigger
                        className="rounded-none border-0 border-b-2 px-0 focus:ring-0 text-sm"
                        style={dependentEditableStyle}
                        onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                        onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#fcd34d")}
                      >
                        <SelectValue placeholder="Select street" />
                      </SelectTrigger>
                      <SelectContent>
                        {streets.map((s) => (
                          <SelectItem key={s.id} value={toUpperCase(s.name)}>
                            {toUpperCase(s.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.street}
                      readOnly
                      disabled
                      placeholder="Street"
                      className={readonlyInputCls}
                      style={readonlyStyle}
                    />
                  )}
                </div>

                {/* Zone / Purok — Select dropdown from unique sitio values in dependent mode */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Zone / Purok *</Label>
                  <Input
                    value={formData.zone}
                    readOnly
                    disabled
                    placeholder="Auto-filled from street"
                    className={readonlyInputCls}
                    style={readonlyStyle}
                  />
                  {isDependent && formData.street && !formData.zone && (
                    <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>No sitio mapped for this street.</p>
                  )}
                </div>
              </div>

              {/* House Owner + Relationship — always editable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    House Owner <span style={{ color: "#ef4444" }}>*</span>
                  </Label>
                  <Input
                    placeholder="Enter name of house owner"
                    value={formData.house_owner}
                    onChange={(e) => upd("house_owner", e.target.value)}
                    className={editableInputCls}
                    style={{
                      ...editableRequiredStyle,
                      borderBottomColor: errors.house_owner ? "#ef4444" : "#fed7aa",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.house_owner ? "#ef4444" : "#fed7aa")}
                  />
                  {errors.house_owner && <p className="mt-1 text-xs text-red-500">{errors.house_owner}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Relationship to Owner <span style={{ color: "#ef4444" }}>*</span>
                  </Label>
                  <Select
                    value={formData.relationship_to_owner}
                    onValueChange={(v) => {
                      setFormData((p) => ({ ...p, relationship_to_owner: v }));
                      setErrors((p) => ({ ...p, relationship_to_owner: "" }));
                    }}
                  >
                    <SelectTrigger
                      className="rounded-none border-0 border-b-2 px-0 focus:ring-0 text-sm"
                      style={{
                        ...editableRequiredStyle,
                        borderBottomColor: errors.relationship_to_owner ? "#ef4444" : "#fed7aa",
                      }}
                    >
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Owner", "Tenant", "Son", "Daughter", "Spouse", "Parent", "Sibling", "Relative", "Other"].map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.relationship_to_owner && <p className="mt-1 text-xs text-red-500">{errors.relationship_to_owner}</p>}
                </div>
              </div>
            </div>

            {/* ═══════════════ Section 4 — Clearance Details (EDITABLE) ═══════════════ */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>4</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Clearance Details</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                  Fill in required fields
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Period of Residency <span style={{ color: "#ef4444" }}>*</span>
                  </Label>
                  <Input
                    placeholder="e.g., 5 years"
                    value={formData.period_of_residency}
                    onChange={(e) => upd("period_of_residency", e.target.value)}
                    className={editableInputCls}
                    style={{
                      ...editableRequiredStyle,
                      borderBottomColor: errors.period_of_residency ? "#ef4444" : "#fed7aa",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.period_of_residency ? "#ef4444" : "#fed7aa")}
                  />
                  {errors.period_of_residency && <p className="mt-1 text-xs text-red-500">{errors.period_of_residency}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Registered Voter</Label>
                  <RadioGroup value={formData.registered_voter} onValueChange={(v) => upd("registered_voter", v)} className="flex gap-6 mt-2.5">
                    {["Yes", "No"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`voter-${opt}`} />
                        <label htmlFor={`voter-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {/* CTC/VRR No. */}
              <div className="mt-6 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                  CTC / VRR No. <span style={{ color: "#ef4444" }}>*</span>
                </Label>
                <Input
                  inputMode="numeric"
                  placeholder="Enter CTC or VRR number"
                  value={formData.ctc_vrr_no}
                  maxLength={20}
                  onKeyDown={(e) => {
                    const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
                    if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;
                    if (allowedKeys.includes(e.key)) return;
                    if (!/^\d$/.test(e.key)) { e.preventDefault(); }
                    if (formData.ctc_vrr_no.length >= 20 && !allowedKeys.includes(e.key)) { e.preventDefault(); }
                  }}
                  onChange={(e) => {
                    const numericOnly = e.target.value.replace(/\D/g, "").slice(0, 20);
                    upd("ctc_vrr_no", numericOnly);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    const numericOnly = pasted.replace(/\D/g, "").slice(0, 20);
                    const current = formData.ctc_vrr_no;
                    const combined = (current + numericOnly).slice(0, 20);
                    upd("ctc_vrr_no", combined);
                  }}
                  className={editableInputCls}
                  style={{ ...editableRequiredStyle, borderBottomColor: "#bbf7d0" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#bbf7d0")}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    Community Tax Certificate or Voter's Registration Record number (numbers only)
                  </p>
                  <p className="text-xs" style={{ color: formData.ctc_vrr_no.length >= 20 ? "#ef4444" : "#9ca3af" }}>
                    {formData.ctc_vrr_no.length}/20
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                  Purpose <span style={{ color: "#ef4444" }}>*</span>
                </Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(v) => {
                    setFormData((p) => ({ ...p, purpose: v }));
                    setErrors((prev) => ({ ...prev, purpose: "" }));
                  }}
                >
                  <SelectTrigger
                    className="rounded-none border-0 border-b-2 px-0 focus:ring-0 text-sm"
                    style={{
                      ...editableRequiredStyle,
                      borderBottomColor: errors.purpose ? "#ef4444" : "#fed7aa",
                    }}
                  >
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Employment", "Business", "Travel", "Legal Purposes", "School Requirement", "Bank Transaction", "Other"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.purpose && <p className="mt-1 text-xs text-red-500">{errors.purpose}</p>}
              </div>

              <div className="mt-6 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Purpose Details</Label>
                <textarea
                  rows={3}
                  placeholder="Additional details about the purpose..."
                  value={formData.purpose_details}
                  onChange={(e) => upd("purpose_details", e.target.value)}
                  className="rounded-none border-0 border-b-2 px-0 focus-visible:ring-0 text-sm w-full resize-none outline-none"
                  style={{ ...editableOptionalStyle, borderBottomColor: "#bbf7d0" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#bbf7d0")}
                />
              </div>
            </div>

            {/* ═══════════════ Section 5 — Schedule Appointment ═══════════════ */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>5</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Schedule Appointment</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                <button
                  type="button"
                  onClick={() => setShowSchedulingModal(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                  style={{ backgroundColor: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#e0f2fe")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#f0f9ff")}
                >
                  <Info className="w-3.5 h-3.5" />
                  Scheduling Guidelines
                </button>
              </div>

              <div className="mb-5 p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd" }}>
                <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#0284c7" }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: "#0369a1" }}>
                    Appointments are available Monday – Friday only.
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#0369a1" }}>
                    Weekends, public holidays, and special non-working holidays are not available.
                    Weekends and holidays are automatically disabled in the date picker.
                    <button type="button" onClick={() => setShowSchedulingModal(true)} className="underline ml-1 font-semibold" style={{ color: "#0284c7" }}>
                      Learn more
                    </button>
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Select Date <span style={{ color: "#ef4444" }}>*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="date"
                      min={getMinScheduleDate()}
                      max={getMaxScheduleDate()}
                      value={formData.schedule_date}
                      onChange={(e) => handleScheduleDateChange(e.target.value)}
                      className={editableInputCls}
                      style={{
                        ...editableRequiredStyle,
                        borderBottomColor: errors.schedule_date ? "#ef4444" : "#fed7aa",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                      onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.schedule_date ? "#ef4444" : "#fed7aa")}
                    />
                  </div>
                  {errors.schedule_date && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.schedule_date}
                    </p>
                  )}
                  {(() => {
                    const today = new Date();
                    const todayStr = toDateString(today);
                    if (!isSelectableDate(todayStr)) {
                      const next = new Date(today);
                      for (let i = 1; i <= 14; i++) {
                        next.setDate(today.getDate() + i);
                        const nextStr = toDateString(next);
                        if (isSelectableDate(nextStr)) {
                          return (
                            <p className="text-xs mt-1" style={{ color: "#0369a1" }}>
                              💡 Today is a weekend or holiday. Next available date:{" "}
                              <button
                                type="button"
                                className="underline font-semibold"
                                style={{ color: "#0284c7" }}
                                onClick={() => handleScheduleDateChange(nextStr)}
                              >
                                {next.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                              </button>
                            </p>
                          );
                        }
                      }
                    }
                    return null;
                  })()}
                </div>

                {formData.schedule_date && !errors.schedule_date && (
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: "#6b7280" }}>
                      Select Time Slot <span style={{ color: "#ef4444" }}>*</span>
                    </Label>

                    {formData.schedule_date === toDateString(new Date()) && (isMorningPastDue || isAfternoonPastDue) && (
                      <div className="mb-3 p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
                        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#ea580c" }} />
                        <p className="text-xs" style={{ color: "#c2410c" }}>
                          {isAfternoonPastDue
                            ? "The barangay office is now closed for today. Please select a different date."
                            : "The morning slot has passed. Only the afternoon slot is available for today."}
                        </p>
                      </div>
                    )}

                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-sm">Loading available slots...</span>
                      </div>
                    ) : availableSlots ? (
                      <RadioGroup
                        value={formData.time_group}
                        onValueChange={(v) => {
                          setFormData((p) => ({ ...p, time_group: v }));
                          setErrors((prev) => ({ ...prev, time_group: "" }));
                        }}
                        className="space-y-3"
                      >
                        {[
                          { key: "morning", label: "Morning Slot", time: "8:00 AM – 11:50 AM" },
                          { key: "afternoon", label: "Afternoon Slot", time: "1:00 PM – 5:50 PM" },
                        ].map(({ key, label, time }) => {
                          const slot = availableSlots[key as "morning" | "afternoon"];
                          const timeDisabled =
                            key === "morning" ? isMorningPastDue :
                            key === "afternoon" ? isAfternoonPastDue : false;
                          const isDisabled = !slot.available || timeDisabled;
                          const isSelected = formData.time_group === key;
                          const disabledReason = !slot.available
                            ? "Fully booked"
                            : timeDisabled
                            ? key === "morning" ? "Morning has passed" : "Office closed"
                            : "";

                          return (
                            <div
                              key={key}
                              className="flex items-center space-x-3 p-4 rounded-lg border-2 transition-all"
                              style={{
                                borderColor: isSelected ? "#0f2a5e" : isDisabled ? "#e5e7eb" : "#fed7aa",
                                backgroundColor: isSelected ? "rgba(15,42,94,0.05)" : isDisabled ? "#f9fafb" : "#fff7ed",
                                cursor: isDisabled ? "not-allowed" : "pointer",
                                opacity: isDisabled ? 0.5 : 1,
                              }}
                            >
                              <RadioGroupItem value={key} id={`slot-${key}`} disabled={isDisabled} />
                              <label htmlFor={`slot-${key}`} className="flex-1" style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="w-5 h-5" style={{ color: "#0f2a5e" }} />
                                  <span className="font-semibold text-sm" style={{ color: "#0f2a5e" }}>{label} ({time})</span>
                                  {isDisabled && disabledReason && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#fee2e2", color: "#dc2626", fontSize: "10px", fontWeight: 600 }}>
                                      {disabledReason}
                                    </span>
                                  )}
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    ) : null}
                    {errors.time_group && <p className="mt-2 text-xs text-red-500">{errors.time_group}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* ── Form Actions ── */}
            <div className="flex flex-wrap items-center justify-end gap-4 pt-6" style={{ borderTop: "1px solid #e5e7eb" }}>
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2.5 text-sm font-semibold uppercase tracking-wider transition-all"
                style={{ borderRadius: 2, border: "1.5px solid #c2467d", color: "#c2467d", backgroundColor: "transparent" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#fdf5f8")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 text-white text-sm font-semibold uppercase tracking-wider transition-all disabled:opacity-60"
                style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}
                onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"; }}
                onMouseLeave={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2a5e"; }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : "Submit Application"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
};

export default BarangayClearanceForm;