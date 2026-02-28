import { useState, useEffect } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import FormProgress from "./FormProgress";
import FormNavigation from "./FormNavigation";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { UserCircle2 } from "lucide-react";
import {
  NAVY, PINK,
  FieldLabel, FieldInput, FieldTextarea,
  SectionDivider, ReviewRow, ReviewCard, ReviewHeader, FormCard,
} from "./LguFormPrimitives";

interface ResidentRegistrationFormProps { onBack: () => void; }
interface StreetOption { id: number; name: string; sitio: string; formerly?: string; }

const stepLabels = ["Personal Info", "Contact", "Address", "Residency", "Review"];

const ST = {
  className: "border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 text-sm px-0 h-9 bg-transparent shadow-none",
  style: { borderBottomWidth: 1, borderColor: "#d1d5db" } as React.CSSProperties,
};

const ResidentRegistrationForm = ({ onBack }: ResidentRegistrationFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [residentImage, setResidentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/streets", { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) { console.error("Failed to fetch streets:", e); }
    };
    load();
  }, []);

  const uniqueZones = Array.from(new Set(
    streets.map((s) => s.sitio).filter(Boolean)
  ));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResidentImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const [formData, setFormData] = useState({
    requester_type: "Online",
    prefix: "", surname: "", first_name: "", middle_name: "", ext_name: "",
    nick_name: "", sex: "", marital_status: "", name_of_spouse: "",
    date_of_birth: "", place_of_birth: "",
    height_cm: 0, weight_kg: 0, blood_type: "", complexion: "", religion: "",
    phone_number: "", email_address: "",
    house_block_lot_no: "", street: "", zone: "",
    house_owner: "", relationship_to_owner: "",
    resident_status: "", voter_status: "", precinct_no: "",
    emp_status: "", occupation: "", position: "", pwd: "",
    period_of_residency: "",
    notes: "",
  });

  const upd = (f: string, v: string | number) => setFormData((p) => ({ ...p, [f]: v }));
  const handleNext = () => { if (currentStep < stepLabels.length - 1) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); else onBack(); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => payload.append(k, String(v)));
      if (residentImage) payload.append("photo", residentImage);

      const res = await axios.post("http://127.0.0.1:8000/api/residents", payload, { withCredentials: true });
      if (res.status === 201 || res.status === 200) {
        toast({ title: "Request Submitted", description: "Your resident registration request has been submitted successfully." });
        onBack();
      }
    } catch {
      toast({ title: "Submission Failed", description: "There was an error submitting your request. Please try again.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const renderStep = () => {
    switch (currentStep) {
      // ── Step 0: Personal Info ───────────────────────────────────────────────
      case 0: return (
        <div className="space-y-6">
          {/* Photo upload */}
          <div
            className="flex items-center gap-6 p-4"
            style={{ backgroundColor: "#f8faff", borderRadius: 2, border: "1px solid #dde3ed" }}
          >
            {/* Avatar preview */}
            <div
              className="flex-shrink-0 overflow-hidden"
              style={{
                width: 80, height: 80, borderRadius: 2,
                border: `2px solid ${PINK}`,
                backgroundColor: "#f0f4ff",
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserCircle2 className="w-10 h-10" style={{ color: "#c8d5f0" }} />
                </div>
              )}
            </div>

            {/* Upload control */}
            <div className="flex-1">
              <FieldLabel htmlFor="resident_image">Resident Photo</FieldLabel>
              <input
                id="resident_image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 mt-1
                  file:mr-3 file:py-1.5 file:px-3
                  file:border file:rounded-none file:text-[10px] file:font-bold
                  file:uppercase file:tracking-wider file:cursor-pointer
                  file:transition-colors file:duration-200"
                style={{
                  ["--file-bg" as any]: "#f0f4ff",
                  ["--file-color" as any]: NAVY,
                  ["--file-border-color" as any]: "#c8d5f0",
                }}
              />
              <p className="text-[10px] text-gray-400 mt-1">JPG, PNG — max 5MB</p>
            </div>
          </div>

          <SectionDivider title="Personal Information" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="prefix">Prefix</FieldLabel>
              <Select value={formData.prefix} onValueChange={(v) => upd("prefix", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Mr.","Mrs.","Ms.","Dr."].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="surname" required>Surname</FieldLabel>
              <FieldInput id="surname" value={formData.surname} onChange={(e) => upd("surname", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="first_name" required>First Name</FieldLabel>
              <FieldInput id="first_name" value={formData.first_name} onChange={(e) => upd("first_name", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="middle_name">Middle Name</FieldLabel>
              <FieldInput id="middle_name" value={formData.middle_name} onChange={(e) => upd("middle_name", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="ext_name">Extension</FieldLabel>
              <FieldInput id="ext_name" placeholder="Jr., Sr." value={formData.ext_name} onChange={(e) => upd("ext_name", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="nick_name">Nickname</FieldLabel>
              <FieldInput id="nick_name" value={formData.nick_name} onChange={(e) => upd("nick_name", e.target.value)} />
            </div>
            <div>
              <FieldLabel required>Sex</FieldLabel>
              <RadioGroup value={formData.sex} onValueChange={(v) => upd("sex", v)} className="flex gap-5 mt-2.5">
                {["Male","Female"].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <RadioGroupItem value={s} id={`sex-${s}`} />
                    <label htmlFor={`sex-${s}`} className="text-sm cursor-pointer">{s}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <FieldLabel htmlFor="marital_status" required>Marital Status</FieldLabel>
              <Select value={formData.marital_status} onValueChange={(v) => upd("marital_status", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Single","Married","Widowed","Separated"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="name_of_spouse">Name of Spouse</FieldLabel>
              <FieldInput id="name_of_spouse" value={formData.name_of_spouse} onChange={(e) => upd("name_of_spouse", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="date_of_birth" required>Date of Birth</FieldLabel>
              <FieldInput id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => upd("date_of_birth", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="place_of_birth" required>Place of Birth</FieldLabel>
              <FieldInput id="place_of_birth" value={formData.place_of_birth} onChange={(e) => upd("place_of_birth", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="religion" required>Religion</FieldLabel>
              <FieldInput id="religion" value={formData.religion} onChange={(e) => upd("religion", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="height_cm" required>Height (cm)</FieldLabel>
              <FieldInput id="height_cm" type="number" value={formData.height_cm || ""} onChange={(e) => upd("height_cm", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="weight_kg" required>Weight (kg)</FieldLabel>
              <FieldInput id="weight_kg" type="number" value={formData.weight_kg || ""} onChange={(e) => upd("weight_kg", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="blood_type" required>Blood Type</FieldLabel>
              <Select value={formData.blood_type} onValueChange={(v) => upd("blood_type", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-","N/A"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="complexion" required>Complexion</FieldLabel>
              <Select value={formData.complexion} onValueChange={(v) => upd("complexion", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Fair","Light","Medium","Tan","Dark"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

      // ── Step 1: Contact ─────────────────────────────────────────────────────
      case 1: return (
        <div className="space-y-6">
          <SectionDivider title="Contact Information" />
          <div className="max-w-sm">
            <FieldLabel htmlFor="phone_number" required>Phone Number</FieldLabel>
            <FieldInput id="phone_number" type="tel" placeholder="09XX XXX XXXX" value={formData.phone_number} onChange={(e) => upd("phone_number", e.target.value)} />
          </div>
          <div className="max-w-sm">
            <FieldLabel htmlFor="email_address" required>Email Address</FieldLabel>
            <FieldInput id="email_address" type="email" placeholder="your.email@example.com" value={formData.email_address} onChange={(e) => upd("email_address", e.target.value)} />
          </div>
        </div>
      );

      // ── Step 2: Address ─────────────────────────────────────────────────────
      case 2: return (
        <div className="space-y-6">
          <SectionDivider title="Address Information" />

          <div>
            <FieldLabel htmlFor="house_block_lot_no" required>House / Block / Lot No.</FieldLabel>
            <FieldInput id="house_block_lot_no" value={formData.house_block_lot_no} onChange={(e) => upd("house_block_lot_no", e.target.value)} />
          </div>

          <div>
            <FieldLabel htmlFor="street" required>Street</FieldLabel>
            {streets.length > 0 ? (
              <Select value={formData.street} onValueChange={(v) => upd("street", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select street" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {streets.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}{s.formerly ? ` (formerly ${s.formerly})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <FieldInput id="street" value={formData.street} onChange={(e) => upd("street", e.target.value)} placeholder="Enter street name" />
            )}
          </div>

          <div>
            <FieldLabel htmlFor="zone" required>Zone / Purok</FieldLabel>
            {uniqueZones.length > 0 ? (
              <Select value={formData.zone} onValueChange={(v) => upd("zone", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select zone" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {uniqueZones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <FieldInput id="zone" value={formData.zone} onChange={(e) => upd("zone", e.target.value)} placeholder="Enter zone / purok" />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="house_owner">House Owner</FieldLabel>
              <FieldInput id="house_owner" value={formData.house_owner} onChange={(e) => upd("house_owner", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="relationship_to_owner">Relationship to Owner</FieldLabel>
              <Select value={formData.relationship_to_owner} onValueChange={(v) => upd("relationship_to_owner", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Owner","Spouse","Child","Parent","Sibling","Relative","Tenant","Boarder"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

      // ── Step 3: Residency & Status ──────────────────────────────────────────
      case 3: return (
        <div className="space-y-6">
          <SectionDivider title="Residency Information" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="resident_status" required>Resident Status</FieldLabel>
              <Select value={formData.resident_status} onValueChange={(v) => upd("resident_status", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Permanent","Temporary","Transient"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="period_of_residency" required>Period of Residency</FieldLabel>
              <FieldInput id="period_of_residency" placeholder="e.g., 5 years" value={formData.period_of_residency} onChange={(e) => upd("period_of_residency", e.target.value)} />
            </div>
          </div>

          <SectionDivider title="Voter & Employment Status" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <FieldLabel required>Voter Status</FieldLabel>
              <RadioGroup value={formData.voter_status} onValueChange={(v) => upd("voter_status", v)} className="flex gap-5 mt-2.5">
                {["Registered","Not Registered"].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <RadioGroupItem value={s} id={`voter-${s}`} />
                    <label htmlFor={`voter-${s}`} className="text-sm cursor-pointer">{s}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <FieldLabel htmlFor="precinct_no">Precinct No.</FieldLabel>
              <FieldInput id="precinct_no" value={formData.precinct_no} onChange={(e) => upd("precinct_no", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <FieldLabel htmlFor="emp_status" required>Employment Status</FieldLabel>
              <Select value={formData.emp_status} onValueChange={(v) => upd("emp_status", v)}>
                <SelectTrigger {...ST}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Employed","Self-Employed","Unemployed","Student","Retired"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="occupation">Occupation</FieldLabel>
              <FieldInput id="occupation" value={formData.occupation} onChange={(e) => upd("occupation", e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="position">Position</FieldLabel>
              <FieldInput id="position" value={formData.position} onChange={(e) => upd("position", e.target.value)} />
            </div>
          </div>

          <div>
            <FieldLabel required>PWD Status</FieldLabel>
            <RadioGroup value={formData.pwd} onValueChange={(v) => upd("pwd", v)} className="flex gap-6 mt-2.5">
              {["Yes","No"].map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`pwd-${opt}`} />
                  <label htmlFor={`pwd-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      );

      // ── Step 4: Review ──────────────────────────────────────────────────────
      case 4: return (
        <div className="space-y-5">
          <ReviewHeader current={5} total={5} />

          {/* Photo preview in review */}
          {imagePreview && (
            <div className="flex items-center gap-4 p-4" style={{ backgroundColor: "#f8faff", borderRadius: 2, border: "1px solid #dde3ed" }}>
              <img src={imagePreview} alt="Resident" className="w-14 h-14 object-cover flex-shrink-0" style={{ borderRadius: 2, border: `2px solid ${PINK}` }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: PINK }}>Photo</p>
                <p className="text-sm text-foreground">{residentImage?.name}</p>
              </div>
            </div>
          )}

          <ReviewCard title="Personal Information">
            <ReviewRow label="Full Name" value={`${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.ext_name}`.trim()} />
            <ReviewRow label="Sex" value={formData.sex} />
            <ReviewRow label="Date of Birth" value={formData.date_of_birth} />
            <ReviewRow label="Marital Status" value={formData.marital_status} />
            <ReviewRow label="Religion" value={formData.religion} />
          </ReviewCard>

          <ReviewCard title="Contact Information">
            <ReviewRow label="Phone" value={formData.phone_number} />
            <ReviewRow label="Email" value={formData.email_address} />
          </ReviewCard>

          <ReviewCard title="Address Information">
            <ReviewRow label="House / Block / Lot" value={formData.house_block_lot_no} />
            <ReviewRow label="Street" value={formData.street} />
            <ReviewRow label="Zone / Purok" value={formData.zone} />
            <ReviewRow label="House Owner" value={formData.house_owner} />
          </ReviewCard>

          <ReviewCard title="Residency & Status">
            <ReviewRow label="Resident Status" value={formData.resident_status} />
            <ReviewRow label="Voter Status" value={formData.voter_status} />
            <ReviewRow label="Employment" value={formData.emp_status} />
            <ReviewRow label="PWD" value={formData.pwd} />
          </ReviewCard>

          {/* Notes */}
          <div>
            <FieldLabel htmlFor="notes">Additional Notes</FieldLabel>
            <FieldTextarea id="notes" rows={3} placeholder="Any additional information..." value={formData.notes} onChange={(e) => upd("notes", e.target.value)} />
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <FormCard title="Resident Registration" subtitle="Online Application">
      <FormProgress currentStep={currentStep} totalSteps={stepLabels.length} stepLabels={stepLabels} />
      <div className="mt-6">{renderStep()}</div>
      <FormNavigation
        currentStep={currentStep} totalSteps={stepLabels.length}
        onBack={handleBack} onNext={handleNext}
        onSubmit={handleSubmit} isSubmitting={isSubmitting}
      />
    </FormCard>
  );
};

export default ResidentRegistrationForm;