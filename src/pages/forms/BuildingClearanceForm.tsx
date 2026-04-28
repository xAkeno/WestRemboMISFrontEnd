import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import api from "@/components/services/clearanceApi";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle, Copy, Check, X, FileText, DollarSign, IdCard, Timer,
  Calendar, Clock, Info, AlertTriangle, ClipboardCheck,
} from "lucide-react";
import { PrefixCombobox } from "./PrefixCombobox";
import { toUpperCase, PREFIX_OPTIONS } from "./formUtils";
import Header from "@/components/forms/Header";
import { add } from "date-fns";

interface BuildingClearanceFormProps { onBack: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }
interface ServiceInfo { requirements: string[]; processing_time: string; fee: string; }

// ── Validation helpers ────────────────────────────────────────────────────────
const MIN_AGE = 18;

const todayDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const PH_HOLIDAYS_2026 = [
  "2026-01-01", "2026-04-09", "2026-05-01", "2026-06-12",
  "2026-08-25", "2026-11-30", "2026-12-25", "2026-12-30",
];

const isHoliday = (dateStr: string) => PH_HOLIDAYS_2026.includes(dateStr);

const validateScheduleDate = (value: string): string => {
  if (!value) return "Schedule date is required.";
  const date = new Date(value + "T00:00:00");
  const year = date.getFullYear();
  if (year > 2026) return "Scheduling beyond 2026 is not allowed. Please select a date within this year.";
  if (isWeekend(date)) return "Weekends (Saturday & Sunday) are not available. Please choose a weekday.";
  if (isHoliday(value)) return "Selected date is a Philippine holiday. Barangay services are unavailable on this day.";
  return "";
};

const maxDob = () => {
  const d = todayDate();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d;
};

const toInputMax = (d: Date) => d.toISOString().split("T")[0];

const validateRequired = (value: string, fieldName: string): string => {
  if (!value || value.trim() === "") return `${fieldName} is required.`;
  return "";
};

const validatePurposeDetails = (value: string): string => {
  if (!value || value.trim() === "") return "Purpose details are required.";
  if (value.trim().length < 10) return "Please provide more details (at least 10 characters).";
  return "";
};

const parseAddress = (address: string) => {
  if (!address) return { house_block_lot_no: "", street: "", zone: "" };
  const parts = address.split(",").map((p) => p.trim());
  return { house_block_lot_no: parts[0] || "", street: parts[1] || "", zone: parts[2] || "" };
};

const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

// ── Scheduling Info Modal ────────────────────────────────────────────────────
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

// ── Data Privacy Modal ──────────────────────────────────────────────────────
const DataPrivacyModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,60,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white overflow-hidden" style={{ borderRadius: 4, boxShadow: "0 8px 60px rgba(10,20,60,0.25)", border: "1px solid #dde3ed", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ backgroundColor: "#0f2a5e", padding: "16px 24px" }} className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#e8a0bf" }}>Legal</p>
            <h2 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1rem" }}>Data Privacy Notice</h2>
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
          <button type="button" onClick={onClose} className="w-full py-2.5 text-white text-xs font-semibold uppercase tracking-wider" style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ── Success Modal ──────────────────────────────────────────────────────────
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
          <p className="text-sm relative z-10" style={{ color: "rgba(255,255,255,0.65)" }}>Building Clearance & Appointment Scheduled</p>
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
          <p className="text-sm text-center leading-relaxed" style={{ color: "#6b7280" }}>Please arrive 10 minutes early on your scheduled date.</p>
          <button onClick={() => navigate(`/request/building_clearance/${successData.id}`)} className="w-full py-3 text-sm font-bold text-white rounded-lg hover:opacity-90" style={{ backgroundColor: "#0f2a5e" }}>View My Request</button>
          <button onClick={onBack} className="w-full py-3 text-sm font-semibold rounded-lg" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>Back to Services</button>
        </div>
      </div>
    </div>
  );
};

// ── Field Legend ────────────────────────────────────────────────────────────
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

// ── Main Component ──────────────────────────────────────────────────────────
const BuildingClearanceForm = ({ onBack }: BuildingClearanceFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [successData, setSuccessData] = useState<{ id: number; refNo: string; scheduleTime?: string; scheduleDate?: string } | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ morning: any; afternoon: any } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [loadingServiceInfo, setLoadingServiceInfo] = useState(true);

  const [errors, setErrors] = useState({
    establishment: "",
    purpose_details: "",
    schedule_date: "",
    time_group: "",
  });

  const { toast } = useToast();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) { console.error("Failed to fetch streets:", e); }
    };
    load();
  }, []);

  useEffect(() => {
    const loadServiceInfo = async () => {
      setLoadingServiceInfo(true);
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/services", { withCredentials: true });
        const services: any[] = res.data?.data ?? res.data ?? [];
        const building = services.find((s) => s.name === "Building Clearance");
        if (building) {
          setServiceInfo({
            requirements: building.requirements
              ? building.requirements.split("\n").map((r: string) => r.trim()).filter(Boolean)
              : [],
            processing_time: building.processing_time ?? "",
            fee: building.fee ?? "",
          });
        }
      } catch (e) { console.error("Failed to fetch service info:", e); }
      finally { setLoadingServiceInfo(false); }
    };
    loadServiceInfo();
  }, []);

  const [formData, setFormData] = useState({
    requester_type: "Online",
    prefix: "", surname: "", first_name: "", middle_name: "", ext_name: "",
    age: "", dob: "",
    contact_no: "", email: "",
    establishment: "", purpose: "", purpose_details: "",
    house_block_lot_no: "", street: "", zone: "",
    bcert_number: "", issued_date: "", or_no: "", remarks: "",
    punong_barangay: "", for_the_punong_barangay: "", barangay_position: "",
    schedule_date: "",
    time_group: "",
    document_type: "building_clearance",
  });

  // Only uppercase free-text editable fields
  const upd = (f: string, v: string) => {
    const textFields = ["establishment", "purpose_details",];
    const value = textFields.includes(f) ? toUpperCase(v) : v;
    setFormData((p) => ({ ...p, [f]: value }));
    if (errors[f as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [f]: "" }));
    }
  };

  const fetchAvailableSlots = async (date: string) => {
    if (!date) return;
    setLoadingSlots(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/schedules/available-slots", {
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
      return;
    }
    upd("schedule_date", date);
    fetchAvailableSlots(date);
  };

  const getMinScheduleDate = () => {
    const d = new Date();
    d.setDate(d.getDate());
    return d.toISOString().split("T")[0];
  };

  const getMaxScheduleDate = () => "2026-12-31";

  const validateForm = (): boolean => {
    const newErrors = {
      establishment: validateRequired(formData.establishment, "Establishment/Project name"),
      purpose_details: validatePurposeDetails(formData.purpose_details),
      schedule_date: validateRequired(formData.schedule_date, "Schedule date"),
      time_group: validateRequired(formData.time_group, "Time slot"),
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
    const payload = {
      requester_type: formData.requester_type,
      prefix: formData.prefix, surname: formData.surname,
      first_name: formData.first_name, middle_name: formData.middle_name,
      ext_name: formData.ext_name,
      age: formData.age ? Number(formData.age) : null,
      dob: formData.dob, contact_no: formData.contact_no, email: formData.email,
      establishment: formData.establishment,
      house_block_lot_no: formData.house_block_lot_no,
      street: formData.street, zone: formData.zone,
      purpose: formData.purpose, purpose_details: formData.purpose_details,
      bcert_number: formData.bcert_number, issued_date: formData.issued_date,
      or_no: formData.or_no, remarks: formData.remarks,
      punong_barangay: formData.punong_barangay,
      for_the_punong_barangay: formData.for_the_punong_barangay,
      barangay_position: formData.barangay_position,
    };
    try {
      const res = await api.post("/building-clearances", payload, { withCredentials: true });
      if (res.status === 200 || res.status === 201) {
        const newId = res.data?.data?.service?.id ?? res.data?.data?.id ?? res.data?.id;
        const documentNumber = res.data?.data?.service?.bcert_number;
        const scheduleRes = await axios.post(
          "http://127.0.0.1:8000/api/schedules",
          { document_type: formData.document_type, document_number: documentNumber, schedule_date: formData.schedule_date, time_group: formData.time_group },
          { withCredentials: true }
        );
        if (scheduleRes.status === 201) {
          const schedule = scheduleRes.data?.data?.schedule;
          setSuccessData({ id: newId, refNo: `REF-${String(newId).padStart(4, "0")}`, scheduleTime: schedule?.schedule_time, scheduleDate: schedule?.schedule_date });
        } else {
          setSuccessData({ id: newId, refNo: `REF-${String(newId).padStart(4, "0")}` });
        }
      }
    } catch (error: any) {
      toast({
        title: error.response?.status === 422 ? "Validation Error" : "Error",
        description: error.response?.status === 422 ? "Please check required fields and try again." : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally { setIsSubmitting(false); }
  };

  // ── Auto-fill from authenticated user ──
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/details", { withCredentials: true });
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
        setFormData((prev) => ({
          ...prev,
          prefix: user.prefix ?? "",
          surname: user.surname ?? "",
          first_name: user.first_name ?? "",
          middle_name: user.middle_name ?? "",
          ext_name: user.extension_name ?? "",
          dob: normalizedDob,
          contact_no: user.contact_number ?? "",
          email: user.email ?? "",
          house_block_lot_no: toUpperCase(addressParts.house_block_lot_no),
          street: matchedStreet,
          zone: toUpperCase(addressParts.zone),
          age: normalizedDob ? String(calculateAge(normalizedDob)) : "",
        }));
      } catch (error) { console.error("Failed to load authenticated user:", error); }
    };
    loadUser();
  }, [streets]);

  // ── Shared styles ──
  const readonlyStyle: React.CSSProperties = { borderBottomColor: "#c7d2fe", backgroundColor: "#f0f4ff" };
  const editableRequiredStyle: React.CSSProperties = { borderBottomColor: "#fed7aa", backgroundColor: "#fff7ed" };
  const editableOptionalStyle: React.CSSProperties = { borderBottomColor: "#bbf7d0", backgroundColor: "#f0fdf4" };
  const readonlyInputCls = "rounded-none border-0 border-b-2 px-0 text-sm cursor-not-allowed opacity-80";
  const editableInputCls = "rounded-none border-0 border-b-2 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm";

  if (successData) return <SuccessModal successData={successData} onBack={handleBack} />;

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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-0.5" style={{ color: "#e8a0bf" }}>Republic of the Philippines · City of Taguig</p>
            <h1 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1.15rem" }}>Building Clearance Application</h1>
          </div>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />

        <div className="p-8 md:p-10">

          {/* ── Before You Apply ── */}
          <div className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: "#fefce8", borderColor: "#fde047" }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: "#854d0e" }}>📌 Before You Apply</h3>
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
                      <li key={i} className="flex items-start gap-2"><IdCard className="w-4 h-4 mt-0.5 opacity-80 flex-shrink-0" />{req}</li>
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
                    <p className="text-base font-bold pl-2" style={{ color: "#713f12" }}>{serviceInfo.fee === "Free" ? "Free" : `₱${serviceInfo.fee}`}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "#713f12" }}>Service information is currently unavailable.</p>
            )}
          </div>

          {/* ── Field Legend ── */}
          <FieldLegend />

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ═══ Section 1 — Personal Information (READ-ONLY) ═══ */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>1</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Personal Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#f0f4ff", color: "#4338ca", border: "1px solid #c7d2fe" }}>Auto-filled</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Prefix</Label>
                  <PrefixCombobox options={PREFIX_OPTIONS} value={formData.prefix} onChange={() => {}} placeholder="Select prefix" disabled={true} />
                </div>
                {[
                  { label: "Surname *", value: formData.surname, placeholder: "de la Cruz" },
                  { label: "First Name *", value: formData.first_name, placeholder: "Juan" },
                  { label: "Middle Name", value: formData.middle_name, placeholder: "Reyes" },
                ].map(({ label, value, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>{label}</Label>
                    <Input value={value} readOnly disabled placeholder={placeholder} className={readonlyInputCls} style={readonlyStyle} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                {[
                  { label: "Extension", value: formData.ext_name, placeholder: "Jr., Sr." },
                  { label: "Age", value: formData.age, placeholder: "", type: "number" },
                  { label: "Date of Birth *", value: formData.dob, placeholder: "", type: "date" },
                ].map(({ label, value, placeholder, type }) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>{label}</Label>
                    <Input type={type ?? "text"} value={value} readOnly disabled placeholder={placeholder} className={readonlyInputCls} style={readonlyStyle} />
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ Section 2 — Contact Information (READ-ONLY) ═══ */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>2</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Contact Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#f0f4ff", color: "#4338ca", border: "1px solid #c7d2fe" }}>Auto-filled</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Contact Number *</Label>
                  <Input type="tel" placeholder="09XX XXX XXXX" value={formData.contact_no} readOnly disabled className={readonlyInputCls} style={readonlyStyle} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Email Address *</Label>
                  <Input type="email" placeholder="juan@email.com" value={formData.email} readOnly disabled className={readonlyInputCls} style={readonlyStyle} />
                </div>
              </div>
            </div>

            {/* ═══ Section 3 — Building Details (EDITABLE) ═══ */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>3</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Building Details</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>Fill in required fields</span>
              </div>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Establishment / Project Name <span style={{ color: "#ef4444" }}>*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Residential Building, Commercial Complex"
                    value={formData.establishment}
                    onChange={(e) => upd("establishment", e.target.value)}
                    className={editableInputCls}
                    style={{ ...editableRequiredStyle, borderBottomColor: errors.establishment ? "#ef4444" : "#fed7aa" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.establishment ? "#ef4444" : "#fed7aa")}
                  />
                  {errors.establishment && <p className="mt-1 text-xs text-red-500">{errors.establishment}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Purpose</Label>
                  <Select
                    value={formData.purpose}
                    onValueChange={(v) => {
                      setFormData((p) => ({ ...p, purpose: v }));
                    }}
                  >
                    <SelectTrigger className="rounded-none border-0 border-b-2 px-0 focus:ring-0 text-sm uppercase" style={editableRequiredStyle}>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {["New Construction", "Renovation", "Addition", "Demolition", "Fence", "Other"].map((p) => (
                        <SelectItem key={p} value={p} className="uppercase">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Purpose Details <span style={{ color: "#ef4444" }}>*</span>
                  </Label>
                  <textarea
                    rows={4}
                    placeholder="Describe the building / construction project in detail..."
                    value={formData.purpose_details}
                    onChange={(e) => upd("purpose_details", e.target.value)}
                    className="rounded-none border-0 border-b-2 px-0 focus-visible:ring-0 text-sm w-full resize-none outline-none"
                    style={{ ...editableRequiredStyle, borderBottomColor: errors.purpose_details ? "#ef4444" : "#fed7aa" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.purpose_details ? "#ef4444" : "#fed7aa")}
                  />
                  {errors.purpose_details && <p className="mt-1 text-xs text-red-500">{errors.purpose_details}</p>}
                </div>
              </div>
            </div>

            {/* ═══ Section 4 — Project Location (FULLY EDITABLE) ═══ */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>4</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Project Location</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                  Fill in required fields
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* House / Block / Lot */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    House / Block / Lot No.
                  </Label>
                  <Input
                    placeholder="e.g., 123-A"
                    value={formData.house_block_lot_no}
                    onChange={(e) => upd("house_block_lot_no", e.target.value)}
                    className={editableInputCls}
                    style={editableRequiredStyle}
                  />
                </div>

                {/* Street ComboBox */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Street
                  </Label>
                  <Select
                    value={formData.street}
                    onValueChange={(v) => {
                      const selectedStreet = streets.find(
                        (s) => toUpperCase(s.name) === v
                      );

                      setFormData((prev) => ({
                        ...prev,
                        street: v,
                        zone: selectedStreet
                          ? toUpperCase(selectedStreet.sitio)
                          : prev.zone,
                      }));
                    }}
                  >
                    <SelectTrigger
                      className="rounded-none border-0 border-b-2 px-0 focus:ring-0 text-sm"
                      style={editableRequiredStyle}
                    >
                      <SelectValue placeholder="Select street" />
                    </SelectTrigger>

                    <SelectContent>
                      {streets.map((street) => (
                        <SelectItem
                          key={street.id}
                          value={toUpperCase(street.name)}
                        >
                          {toUpperCase(street.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Zone ComboBox */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Zone / Purok
                  </Label>
                  <Select
                    value={formData.zone}
                    onValueChange={(v) => upd("zone", v)}
                  >
                    <SelectTrigger
                      className="rounded-none border-0 border-b-2 px-0 focus:ring-0 text-sm"
                      style={editableRequiredStyle}
                    >
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>

                    <SelectContent>
                      {[...new Set(streets.map((s) => s.sitio))]
                      .filter(Boolean)
                      .map((zone, i) => {
                        const upperZone = toUpperCase(zone);

                        return (
                          <SelectItem key={i} value={upperZone}>
                            {upperZone}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

              </div>
            </div>

            {/* ═══ Section 5 — Schedule Appointment ═══ */}
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
                  <Info className="w-3.5 h-3.5" /> Scheduling Guidelines
                </button>
              </div>

              <div className="mb-5 p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd" }}>
                <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#0284c7" }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: "#0369a1" }}>Appointments are available Monday – Friday only, within 2026.</p>
                  <p className="text-xs mt-0.5" style={{ color: "#0369a1" }}>
                    Weekends, public holidays, and special non-working holidays are not available.
                    <button type="button" onClick={() => setShowSchedulingModal(true)} className="underline ml-1 font-semibold" style={{ color: "#0284c7" }}>Learn more</button>
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Select Date <span style={{ color: "#ef4444" }}>*</span>
                  </Label>
                  <Input
                    type="date"
                    min={getMinScheduleDate()}
                    max={getMaxScheduleDate()}
                    value={formData.schedule_date}
                    onChange={(e) => handleScheduleDateChange(e.target.value)}
                    className={editableInputCls}
                    style={{ ...editableRequiredStyle, borderBottomColor: errors.schedule_date ? "#ef4444" : "#fed7aa" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.schedule_date ? "#ef4444" : "#fed7aa")}
                  />
                  {errors.schedule_date && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />{errors.schedule_date}
                    </p>
                  )}
                </div>

                {formData.schedule_date && (
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: "#6b7280" }}>
                      Select Time Slot <span style={{ color: "#ef4444" }}>*</span>
                    </Label>
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
                          const isSelected = formData.time_group === key;
                          return (
                            <div
                              key={key}
                              className="flex items-center space-x-3 p-4 rounded-lg border-2 transition-all"
                              style={{
                                borderColor: isSelected ? "#0f2a5e" : slot.available ? "#fed7aa" : "#e5e7eb",
                                backgroundColor: isSelected ? "rgba(15,42,94,0.05)" : slot.available ? "#fff7ed" : "#f9fafb",
                                cursor: slot.available ? "pointer" : "not-allowed",
                                opacity: slot.available ? 1 : 0.5,
                              }}
                            >
                              <RadioGroupItem value={key} id={`bldg-slot-${key}`} disabled={!slot.available} />
                              <label htmlFor={`bldg-slot-${key}`} className="flex-1" style={{ cursor: slot.available ? "pointer" : "not-allowed" }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="w-5 h-5" style={{ color: "#0f2a5e" }} />
                                  <span className="font-semibold text-sm" style={{ color: "#0f2a5e" }}>{label} ({time})</span>
                                </div>
                                <p className="text-xs" style={{ color: slot.available ? "#16a34a" : "#9ca3af" }}>
                                  {slot.available ? `${slot.remaining} slot${slot.remaining !== 1 ? "s" : ""} available` : "No slots available"}
                                </p>
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

export default BuildingClearanceForm;