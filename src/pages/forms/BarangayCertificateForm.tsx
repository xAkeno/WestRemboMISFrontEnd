import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Copy, Check, Clock, Calendar, X, FileText, IdCard, Timer, DollarSign } from "lucide-react";
import { PrefixCombobox } from "./PrefixCombobox";
import { toUpperCase, PREFIX_OPTIONS } from "./formUtils";
import Header from "@/components/forms/Header";

interface BarangayCertificateFormProps { onBack?: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }
interface ServiceInfo { requirements: string[]; processing_time: string; fee: string; }

// ─── Validation helpers ────────────────────────────────────────────────────────
const MIN_AGE = 15;

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};
const PH_HOLIDAYS_2026 = [
  "2026-01-01",
  "2026-04-09",
  "2026-05-01",
  "2026-06-12",
  "2026-08-25",
  "2026-11-30",
  "2026-12-25",
  "2026-12-30",
];

const isHoliday = (dateStr: string) => PH_HOLIDAYS_2026.includes(dateStr);

const validateScheduleDate = (value: string): string => {
  if (!value) return "Schedule date is required.";
  const date = new Date(value);
  if (isWeekend(date)) return "Weekends (Saturday/Sunday) are not allowed.";
  if (isHoliday(value)) return "Selected date is a Philippine holiday. Please choose another date.";
  return "";
};

const maxDob = () => {
  const d = today();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d;
};

const validateDob = (dob: string): string => {
  if (!dob) return "Date of birth is required.";
  const date = new Date(dob);
  if (isNaN(date.getTime())) return "Invalid date.";
  if (date > today()) return "Date of birth cannot be a future date.";
  if (date > maxDob()) return `You must be at least ${MIN_AGE} years old.`;
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

const validateRequired = (value: string, fieldName: string): string => {
  if (!value || value.trim() === "") return `${fieldName} is required.`;
  return "";
};

const calculateAge = (dob: string): number => {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

const parseAddress = (address: string) => {
  if (!address) return { house_block_lot_no: "", street: "", zone: "" };
  const parts = address.split(",").map((p) => p.trim());
  return { house_block_lot_no: parts[0] || "", street: parts[1] || "", zone: parts[2] || "" };
};

const toInputMax = (d: Date) => d.toISOString().split("T")[0];

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
        </div>
        <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid #e5e7eb" }}>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-white text-xs font-semibold uppercase tracking-wider"
            style={{ borderRadius: 2, backgroundColor: "#0f2a5e" }}
          >
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <div
        className="w-full sm:max-w-lg md:max-w-xl overflow-hidden"
        style={{ borderRadius: "20px", backgroundColor: "white", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}
      >
        <div className="relative overflow-hidden px-6 pt-8 pb-6 text-center" style={{ backgroundColor: "#0f2a5e" }}>
          <div className="absolute right-[-24px] bottom-[-24px] w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
          <div className="absolute left-[-16px] top-[-16px] w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <p className="text-white font-bold text-xl relative z-10 mb-1">Request Submitted!</p>
          <p className="text-sm relative z-10" style={{ color: "rgba(255,255,255,0.65)" }}>Barangay Certificate & Appointment Scheduled</p>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: "#f8faff", border: "1px solid #e5e7eb" }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af" }}>Reference Number</p>
              <p className="text-lg font-black font-mono" style={{ color: "#0f2a5e" }}>{successData.refNo}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(successData.refNo); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: "#f3f4f6", color: copied ? "#16a34a" : "#9ca3af" }}
            >
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
            Your request and appointment have been submitted. Please arrive 10 minutes early on your scheduled date.
          </p>

          <button
            onClick={() => navigate(`/request/barangay_certificate/${successData.id}`)}
            className="w-full py-3 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0f2a5e" }}
          >
            View My Request
          </button>

          <button
            onClick={onBack}
            className="w-full py-3 text-sm font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
          >
            Back to Services
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const BarangayCertificateForm = ({ onBack }: BarangayCertificateFormProps = {}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [successData, setSuccessData] = useState<{ id: number; refNo: string; scheduleTime?: string; scheduleDate?: string } | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ morning: any; afternoon: any } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [loadingServiceInfo, setLoadingServiceInfo] = useState(true);

  const [errors, setErrors] = useState({
    surname: "", first_name: "", dob: "", pob: "", contact_no: "", email: "",
    house_block_lot_no: "", street: "", zone: "", period_of_residency: "",
    purpose: "", schedule_date: "", time_group: "",
  });

  const { toast } = useToast();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  // ── Fetch streets ──
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) {
        console.error("Failed to fetch streets:", e);
      }
    };
    load();
  }, []);

  // ── Fetch service info (requirements, processing time, fee) ──
  useEffect(() => {
    const loadServiceInfo = async () => {
      setLoadingServiceInfo(true);
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/services", { withCredentials: true });
        const services: any[] = res.data?.data ?? res.data ?? [];
        const cert = services.find((s) => s.name === "Barangay Certificate");
        if (cert) {
          setServiceInfo({
            requirements: cert.requirements
              ? cert.requirements.split("\n").map((r: string) => r.trim()).filter(Boolean)
              : [],
            processing_time: cert.processing_time ?? "",
            fee: cert.fee ?? "",
          });
        }
      } catch (e) {
        console.error("Failed to fetch service info:", e);
      } finally {
        setLoadingServiceInfo(false);
      }
    };
    loadServiceInfo();
  }, []);

  const [formData, setFormData] = useState({
    requester_type: "Online",
    prefix: "", first_name: "", middle_name: "", surname: "", extension: "",
    age: "", dob: "", pob: "",
    contact_no: "", email: "",
    house_block_lot_no: "", street: "", zone: "",
    house_owner: "", relationship_to_owner: "",
    bcert_number: "Example", issued_date: "",
    period_of_residency: "", registered_voter: "",
    purpose: "", purpose_details: "",
    punong_barangay: "", for_the_punong_barangay: "",
    schedule_date: "",
    time_group: "",
    document_type: "barangay_certificate",
  });

  const upd = (f: string, v: string) => {
    const textFields = [
      "first_name", "middle_name", "surname", "extension", "pob",
      "house_block_lot_no", "street", "zone", "house_owner",
      "relationship_to_owner", "bcert_number", "purpose_details",
      "punong_barangay", "for_the_punong_barangay",
    ];
    const value = textFields.includes(f) ? toUpperCase(v) : v;
    setFormData((p) => ({ ...p, [f]: value }));
    if (errors[f as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [f]: "" }));
    }
  };

  const handleDobChange = (val: string) => {
    upd("dob", val);
    const err = validateDob(val);
    setErrors((prev) => ({ ...prev, dob: err }));
    if (!err && val) {
      upd("age", String(calculateAge(val)));
    } else if (err) {
      upd("age", "");
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
    } catch (error) {
      console.error("Failed to fetch available slots:", error);
    } finally {
      setLoadingSlots(false);
    }
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

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    const periodError = validatePeriodOfResidency(formData.period_of_residency);
    const purposeError = validatePurpose(formData.purpose);
    const dateError = validateRequired(formData.schedule_date, "Schedule date");
    const timeError = validateRequired(formData.time_group, "Time slot");

    newErrors.period_of_residency = periodError;
    newErrors.purpose = purposeError;
    newErrors.schedule_date = dateError;
    newErrors.time_group = timeError;

    if (periodError || purposeError || dateError || timeError) isValid = false;

    setErrors(newErrors);
    if (!isValid) {
      toast({ title: "Validation Error", description: "Please fix the errors before submitting.", variant: "destructive" });
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const certRes = await axios.post(
        "http://127.0.0.1:8000/api/barangay-certificates",
        { ...formData, age: formData.age ? Number(formData.age) : null },
        { withCredentials: true }
      );

      if (certRes.status === 201 || certRes.status === 200) {
        const documentNumber = certRes.data?.data?.service?.bcert_number;

        const scheduleRes = await axios.post(
          "http://127.0.0.1:8000/api/schedules",
          {
            document_type: formData.document_type,
            document_number: documentNumber,
            schedule_date: formData.schedule_date,
            time_group: formData.time_group,
          },
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
      console.error("Submission error:", error);
      toast({
        title: error.response?.status === 422 ? "Validation Error" : "Submission Error",
        description:
          error.response?.status === 422
            ? error.response?.data?.message || "Please check the form. Some fields are invalid."
            : error.response?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Auto-fill from authenticated user ──
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/details", { withCredentials: true });
        const user = res.data.data;
        const filledFields: string[] = [];
        const normalizedDob = user.date_of_birth ? user.date_of_birth.split("T")[0] : "";
        const addressParts = parseAddress(user.address || "");

        let matchedStreet = "";
        if (addressParts.street && streets.length > 0) {
          const foundStreet = streets.find((s) =>
            addressParts.street.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(addressParts.street.toLowerCase())
          );
          matchedStreet = foundStreet ? toUpperCase(foundStreet.name) : toUpperCase(addressParts.street);
        } else {
          matchedStreet = toUpperCase(addressParts.street);
        }

        const newData = {
          prefix: user.prefix ?? "",
          first_name: user.first_name ?? "",
          middle_name: user.middle_name ?? "",
          surname: user.surname ?? "",
          extension: user.extension_name ?? "",
          dob: normalizedDob,
          pob: user.place_of_birth ?? "",
          contact_no: user.contact_number ?? "",
          email: user.email ?? "",
          house_block_lot_no: toUpperCase(addressParts.house_block_lot_no),
          street: matchedStreet,
          zone: toUpperCase(addressParts.zone),
          house_owner: toUpperCase(user.house_owner ?? ""),
          relationship_to_owner: user.relationship_to_owner ?? "",
          period_of_residency: user.period_of_residency ?? "",
        };

        Object.entries(newData).forEach(([key, value]) => {
          if (value && value !== "") filledFields.push(key);
        });

        setFormData((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(newData).map(([k, v]) => [
              k,
              k === "dob" ? (v ? v : "") : typeof v === "string" ? toUpperCase(v) : v,
            ])
          ),
          age: user.date_of_birth ? String(calculateAge(normalizedDob)) : "",
          registered_voter: user.voter_status ? "Yes" : "No",
        }));

        setAutoFilledFields(filledFields);
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
      }
    };
    loadUser();
  }, [streets]);

  const getMinScheduleDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const underlineInput = "rounded-none border-0 border-b-2 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm";
  const readonlyInputStyle = "rounded-none border-0 border-b-2 bg-gray-50 px-0 text-sm cursor-not-allowed opacity-75";

  if (successData) {
    return <SuccessModal successData={successData} onBack={handleBack} />;
  }

  return (
    <>
      <Header />
      <DataPrivacyModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      <div
        className="w-full max-w-4xl bg-white overflow-hidden items-start mx-auto my-24"
        style={{ borderRadius: 4, boxShadow: "0 2px 40px rgba(10,20,60,0.15)", border: "1px solid #dde3ed" }}
      >
        {/* ── Header ── */}
        <div style={{ backgroundColor: "#0f2a5e", padding: "20px 40px" }} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-0.5" style={{ color: "#e8a0bf" }}>
              Republic of the Philippines · City of Taguig
            </p>
            <h1 className="text-white font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1.15rem" }}>
              Barangay Certificate Application
            </h1>
          </div>
        </div>
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />

        <div className="p-8 md:p-10">

          {/* ── Before You Apply ── */}
          <div
            className="mb-8 p-6 rounded-lg border"
            style={{ backgroundColor: "#fefce8", borderColor: "#fde047" }}
          >
            <h3
              className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2"
              style={{ color: "#854d0e" }}
            >
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

                {/* Requirements */}
                <div>
                  <h4
                    className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                    style={{ color: "#854d0e" }}
                  >
                    <FileText className="w-4 h-4" />
                    Requirements
                  </h4>
                  <ul className="space-y-2 text-sm" style={{ color: "#713f12" }}>
                    {serviceInfo.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <IdCard className="w-4 h-4 mt-0.5 opacity-80 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Processing Time & Fee */}
                <div className="space-y-5">
                  <div>
                    <h4
                      className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"
                      style={{ color: "#854d0e" }}
                    >
                      <Timer className="w-4 h-4" />
                      Processing Time
                    </h4>
                    <p className="text-sm font-medium pl-2" style={{ color: "#713f12" }}>
                      {serviceInfo.processing_time}
                    </p>
                  </div>

                  <div>
                    <h4
                      className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"
                      style={{ color: "#854d0e" }}
                    >
                      <DollarSign className="w-4 h-4" />
                      Service Fee
                    </h4>
                    <p className="text-base font-bold pl-2" style={{ color: "#713f12" }}>
                      {serviceInfo.fee === "Free" ? "Free" : `₱${serviceInfo.fee}`}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <p className="text-sm" style={{ color: "#713f12" }}>
                Service information is currently unavailable.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── Section 1 — Personal Information (READ-ONLY) ── */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>1</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Personal Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Prefix</Label>
                  <PrefixCombobox options={PREFIX_OPTIONS} value={formData.prefix} onChange={() => {}} placeholder="Select prefix" disabled={true} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Surname *</Label>
                  <Input type="text" placeholder="de la Cruz" value={formData.surname} onChange={() => {}} className={readonlyInputStyle} style={{ borderBottomColor: "#dde3ed" }} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>First Name *</Label>
                  <Input type="text" placeholder="Juan" value={formData.first_name} onChange={() => {}} className={readonlyInputStyle} style={{ borderBottomColor: "#dde3ed" }} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Middle Name</Label>
                  <Input type="text" placeholder="Reyes" value={formData.middle_name} onChange={() => {}} className={readonlyInputStyle} style={{ borderBottomColor: "#dde3ed" }} readOnly disabled />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Extension</Label>
                  <Input placeholder="Jr., Sr., III" value={formData.extension} onChange={() => {}} className={readonlyInputStyle} style={{ borderBottomColor: "#dde3ed" }} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Age</Label>
                  <Input type="number" value={formData.age} readOnly disabled className={`${readonlyInputStyle} cursor-not-allowed`} style={{ borderBottomColor: "#dde3ed", backgroundColor: "#f3f4f6" }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Date of Birth *</Label>
                  <Input type="date" value={formData.dob} max={toInputMax(maxDob())} onChange={() => {}} className={readonlyInputStyle} style={{ borderBottomColor: "#dde3ed" }} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Place of Birth *</Label>
                  <Input type="text" placeholder="Manila" value={formData.pob} onChange={() => {}} className={readonlyInputStyle} style={{ borderBottomColor: "#dde3ed" }} readOnly disabled />
                </div>
              </div>
            </div>

            {/* ── Section 2 — Contact Information (READ-ONLY) ── */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>2</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Contact Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Contact Number *</Label>
                  <Input type="tel" placeholder="09XX XXX XXXX" value={formData.contact_no} onChange={() => {}} className={readonlyInputStyle} style={{ borderBottomColor: "#dde3ed" }} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Email Address *</Label>
                  <Input type="email" placeholder="juan@email.com" value={formData.email} onChange={() => {}} className={readonlyInputStyle} style={{ borderBottomColor: "#dde3ed" }} readOnly disabled />
                </div>
              </div>
            </div>

            {/* ── Section 3 — Address Information (READ-ONLY) ── */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>3</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Address Information</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>House / Block / Lot No. *</Label>
                  <Input placeholder="e.g., 123-A, Blk 5" value={formData.house_block_lot_no} onChange={() => {}} className={readonlyInputStyle} style={{ borderBottomColor: "#dde3ed" }} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Street *</Label>
                  <Select value={formData.street} onValueChange={() => {}} disabled>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-gray-50 px-0 focus:ring-0 text-sm cursor-not-allowed opacity-75" style={{ borderBottomColor: "#dde3ed" }}>
                      <SelectValue placeholder="Select street" />
                    </SelectTrigger>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Zone / Purok *</Label>
                  <Select value={formData.zone} onValueChange={() => {}} disabled>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-gray-50 px-0 focus:ring-0 text-sm cursor-not-allowed opacity-75" style={{ borderBottomColor: "#dde3ed" }}>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>House Owner</Label>
                  <Input placeholder="Name of house owner" value={formData.house_owner} onChange={() => {}} className={readonlyInputStyle} style={{ borderBottomColor: "#dde3ed" }} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Relationship to Owner</Label>
                  <Select value={formData.relationship_to_owner} onValueChange={() => {}} disabled>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-gray-50 px-0 focus:ring-0 text-sm cursor-not-allowed opacity-75" style={{ borderBottomColor: "#dde3ed" }}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── Section 4 — Certificate Details (EDITABLE) ── */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>4</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Certificate Details</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Period of Residency *</Label>
                  <Input
                    placeholder="e.g., 5 years"
                    value={formData.period_of_residency}
                    onChange={(e) => upd("period_of_residency", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: errors.period_of_residency ? "#ef4444" : "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.period_of_residency ? "#ef4444" : "#dde3ed")}
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

              <div className="mt-6 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Purpose *</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(v) => { upd("purpose", v); setErrors((prev) => ({ ...prev, purpose: "" })); }}
                >
                  <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: errors.purpose ? "#ef4444" : "#dde3ed" }}>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Residency", "Employment", "School", "Travel", "Legal", "Bank", "Other"].map((p) => (
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
                  className="rounded-none border-0 border-b-2 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm w-full"
                  style={{ borderBottomColor: "#dde3ed" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                />
              </div>
            </div>

            {/* ── Section 5 — Schedule Appointment (EDITABLE) ── */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>5</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Schedule Appointment</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Select Date *</Label>
                  <Input
                    type="date"
                    min={getMinScheduleDate()}
                    value={formData.schedule_date}
                    onChange={(e) => handleScheduleDateChange(e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: errors.schedule_date ? "#ef4444" : "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = errors.schedule_date ? "#ef4444" : "#dde3ed")}
                  />
                  {errors.schedule_date && <p className="mt-1 text-xs text-red-500">{errors.schedule_date}</p>}
                </div>

                {formData.schedule_date && (
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: "#6b7280" }}>Select Time Slot *</Label>
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
                        onValueChange={(v) => { setFormData((p) => ({ ...p, time_group: v })); setErrors((prev) => ({ ...prev, time_group: "" })); }}
                        className="space-y-3"
                      >
                        {/* Morning Slot */}
                        <div
                          className="flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all"
                          style={{
                            borderColor: formData.time_group === "morning" ? "#0f2a5e" : "#e5e7eb",
                            backgroundColor: formData.time_group === "morning" ? "rgba(15, 42, 94, 0.05)" : "transparent",
                          }}
                          onClick={() => availableSlots.morning.available && setFormData((p) => ({ ...p, time_group: "morning" }))}
                        >
                          <RadioGroupItem value="morning" id="slot-morning" disabled={!availableSlots.morning.available} />
                          <label htmlFor="slot-morning" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-5 h-5" style={{ color: "#0f2a5e" }} />
                              <span className="font-semibold text-sm" style={{ color: "#0f2a5e" }}>Morning Slot (8:00 AM - 11:50 AM)</span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {availableSlots.morning.available
                                ? `${availableSlots.morning.remaining} slot${availableSlots.morning.remaining !== 1 ? "s" : ""} available`
                                : "No slots available"}
                            </p>
                          </label>
                        </div>

                        {/* Afternoon Slot */}
                        <div
                          className="flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all"
                          style={{
                            borderColor: formData.time_group === "afternoon" ? "#0f2a5e" : "#e5e7eb",
                            backgroundColor: formData.time_group === "afternoon" ? "rgba(15, 42, 94, 0.05)" : "transparent",
                          }}
                          onClick={() => availableSlots.afternoon.available && setFormData((p) => ({ ...p, time_group: "afternoon" }))}
                        >
                          <RadioGroupItem value="afternoon" id="slot-afternoon" disabled={!availableSlots.afternoon.available} />
                          <label htmlFor="slot-afternoon" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-5 h-5" style={{ color: "#0f2a5e" }} />
                              <span className="font-semibold text-sm" style={{ color: "#0f2a5e" }}>Afternoon Slot (1:00 PM - 5:50 PM)</span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {availableSlots.afternoon.available
                                ? `${availableSlots.afternoon.remaining} slot${availableSlots.afternoon.remaining !== 1 ? "s" : ""} available`
                                : "No slots available"}
                            </p>
                          </label>
                        </div>
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
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#fdf5f8"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
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

export default BarangayCertificateForm;