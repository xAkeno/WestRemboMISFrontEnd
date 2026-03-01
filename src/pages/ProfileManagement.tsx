import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Save,
  User,
  FileText,
  Activity,
  ClipboardList,
  Phone,
  MapPin,
  Home,
} from "lucide-react";
import Header from "@/components/forms/Header";

// ─── Token colors ──────────────────────────────────────────────────────────────
const NAVY = "#0f2a5e";
const PINK = "#c2467d";

interface ProfileData {
  prefix: string; surname: string; first_name: string; middle_name: string;
  extension_name: string; nickname: string; sex: string; marital_status: string;
  name_of_spouse: string; date_of_birth: string; place_of_birth: string;
  religion: string; height_cm: string; weight_kg: string; blood_type: string;
  complexion: string; profile_image: string; email: string; contact_number: string;
  house_block_lot_no: string; street: string; zone_purok: string; house_owner: string;
  relationship_to_owner: string; resident_status: string; period_of_residency: string;
  voter_status: string; precinct_no: string; employment_status: string;
  occupation: string; position: string; pwd_status: boolean;
}

interface ServiceRequest {
  id: number; title: string;
  status: "pending" | "approved" | "rejected" | "processing"; date: string;
}

const tabs = [
  { id: "personal",  label: "Personal Info",    icon: User },
  { id: "contact",   label: "Contact Info",     icon: Phone },
  { id: "address",   label: "Address",          icon: MapPin },
  { id: "residency", label: "Residency",        icon: Home },
  { id: "physical",  label: "Physical Info",    icon: FileText },
  // { id: "services",  label: "Service Requests", icon: ClipboardList },
  // { id: "activity",  label: "Activity",         icon: Activity },
];

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  approved:   { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  pending:    { bg: "#fefce8", text: "#ca8a04", border: "#fde68a" },
  processing: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  rejected:   { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
};

const ProfileManagement = () => {
  const [activeTab, setActiveTab] = useState("personal");
  const [profileImage, setProfileImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    prefix: "", surname: "", first_name: "", middle_name: "", extension_name: "",
    nickname: "", sex: "", marital_status: "", name_of_spouse: "", date_of_birth: "",
    place_of_birth: "", religion: "", height_cm: "", weight_kg: "", blood_type: "",
    complexion: "", profile_image: "", email: "", contact_number: "",
    house_block_lot_no: "", street: "", zone_purok: "", house_owner: "",
    relationship_to_owner: "", resident_status: "", period_of_residency: "",
    voter_status: "", precinct_no: "", employment_status: "", occupation: "",
    position: "", pwd_status: false,
  });

  const [serviceRequests] = useState<ServiceRequest[]>([
    { id: 1, title: "Barangay Clearance",      status: "approved",   date: "2024-01-15" },
    { id: 2, title: "Barangay ID",             status: "processing", date: "2024-01-20" },
    { id: 3, title: "Certificate of Indigency",status: "pending",    date: "2024-01-25" },
    { id: 4, title: "Business Permit",         status: "rejected",   date: "2024-01-10" },
  ]);

  const [recentActivity] = useState([
    { id: 1, title: "Updated profile picture",              time: "2 hours ago" },
    { id: 2, title: "Submitted Barangay Clearance request", time: "Yesterday" },
    { id: 3, title: "Updated personal information",         time: "3 days ago" },
  ]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("https://westrembomis.onrender.com/api/details", { withCredentials: true });
      if (response.status === 200) {
        const user = response.data.data;
        setProfileImage(user.url_photo || "");
        setFormData({
          prefix: user.prefix || "", surname: user.surname || "",
          first_name: user.first_name || "", middle_name: user.middle_name || "",
          extension_name: user.extension_name || "", nickname: user.nickname || "",
          sex: user.sex || "", marital_status: user.marital_status || "",
          name_of_spouse: user.name_of_spouse || "", date_of_birth: user.date_of_birth || "",
          place_of_birth: user.place_of_birth || "", religion: user.religion || "",
          height_cm: user.height_cm ? String(user.height_cm) : "",
          weight_kg: user.weight_kg ? String(user.weight_kg) : "",
          blood_type: user.blood_type || "", complexion: user.complexion || "",
          profile_image: user.url_photo || "", email: user.email || "",
          contact_number: user.contact_number || "",
          house_block_lot_no: user.house_block_lot_no || "", street: user.street || "",
          zone_purok: user.zone_purok || "", house_owner: user.house_owner || "",
          relationship_to_owner: user.relationship_to_owner || "",
          resident_status: user.resident_status || "",
          period_of_residency: user.period_of_residency || "",
          voter_status: user.voter_status || "", precinct_no: user.precinct_no || "",
          employment_status: user.employment_status || "", occupation: user.occupation || "",
          position: user.position || "", pwd_status: user.pwd_status || false,
        });
        if (user.url_photo) setProfileImage(user.url_photo);
      } else {
        toast.error("Account is not logged in");
      }
    } catch (error: any) {
      toast.error("Error fetching profile: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleInputChange = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setProfileImage(reader.result as string); };
    reader.readAsDataURL(file);
    const fd = new FormData();
    fd.append("profileImage", file);
    try {
      const response = await axios.post("https://westrembomis.onrender.com/api/uploadProfileImage", fd, {
        withCredentials: true, headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData((prev) => ({ ...prev, profileImage: response.data.url_photo }));
      toast.success("Profile image uploaded successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload profile image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.surname || !formData.first_name || !formData.sex || !formData.date_of_birth) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setIsSaving(true);
      await axios.put("https://westrembomis.onrender.com/api/updateProfile", formData, { withCredentials: true });
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const statusCounts = {
    total:      serviceRequests.length,
    pending:    serviceRequests.filter((r) => r.status === "pending").length,
    approved:   serviceRequests.filter((r) => r.status === "approved").length,
    processing: serviceRequests.filter((r) => r.status === "processing").length,
    rejected:   serviceRequests.filter((r) => r.status === "rejected").length,
  };

  // ─── Sub-components ──────────────────────────────────────────────────────────

  const SaveButton = () => (
    <div className="flex justify-end pt-6" style={{ borderTop: "1px solid #e5e7eb" }}>
      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 disabled:opacity-60"
        style={{ backgroundColor: NAVY, borderRadius: 1 }}
        onMouseEnter={(e) => { if (!isSaving) (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"; }}
        onMouseLeave={(e) => { if (!isSaving) (e.currentTarget as HTMLElement).style.backgroundColor = NAVY; }}
      >
        <Save className="w-3.5 h-3.5" />
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-1" style={{ color: PINK }}>
        Profile
      </p>
      <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Georgia', serif" }}>
        {children}
      </h2>
      <div style={{ width: 36, height: 2, backgroundColor: PINK, marginTop: 8 }} />
    </div>
  );

  const inputCls = "border-0 border-b rounded-none focus-visible:ring-0 text-sm px-0 py-2";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Cover banner — navy gradient */}
      <div
        className="h-44 relative mt-16"
        style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3d7c 50%, #3b1a3a 100%)` }}
      >
        {/* Diagonal texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: `repeating-linear-gradient(-45deg,#fff,#fff 1px,transparent 1px,transparent 18px)` }}
        />
        {/* Pink accent bar */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, backgroundColor: PINK }} />

        {/* Profile photo */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full overflow-hidden bg-card flex items-center justify-center"
              style={{ border: `4px solid #fff`, boxShadow: `0 0 0 3px ${PINK}` }}
            >
              {profileImage ? (
                <img src={"https://westrembomis.onrender.com/storage/" + profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-14 h-14 text-muted-foreground" />
              )}
            </div>
            <label
              htmlFor="profileImage"
              className="absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: PINK, borderRadius: 1, boxShadow: "0 2px 8px rgba(194,70,125,0.40)" }}
            >
              <Camera className="w-4 h-4 text-white" />
              <input type="file" id="profileImage" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="text-center pt-16 pb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Georgia', serif" }}>
          {formData.first_name || formData.surname
            ? `${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.extension_name}`.trim()
            : "Your Name"}
        </h1>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: PINK }}>
          Resident · Account Management
        </p>
        <div style={{ width: 36, height: 2, backgroundColor: PINK, margin: "10px auto 0" }} />
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <div className="lg:w-60 shrink-0 space-y-4">
            {/* Tab nav */}
            <div
              className="bg-card border border-border overflow-hidden"
              style={{ borderRadius: 2, borderTopWidth: 2, borderTopColor: PINK }}
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider transition-all duration-150"
                    style={
                      isActive
                        ? { backgroundColor: NAVY, color: "#fff", borderLeft: `3px solid ${PINK}` }
                        : { color: "#6b7280", borderLeft: "3px solid transparent" }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f4ff";
                        (e.currentTarget as HTMLElement).style.color = NAVY;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "#6b7280";
                      }
                    }}
                  >
                    <tab.icon className="w-4 h-4 flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Request summary */}
            {/* <div
              className="bg-card border border-border p-5"
              style={{ borderRadius: 2, borderTopWidth: 2, borderTopColor: NAVY }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.16em] mb-4" style={{ color: NAVY }}>
                Request Summary
              </p>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: "Total",      value: statusCounts.total,      color: NAVY },
                  { label: "Approved",   value: statusCounts.approved,   color: "#16a34a" },
                  { label: "Processing", value: statusCounts.processing, color: "#2563eb" },
                  { label: "Pending",    value: statusCounts.pending,    color: "#ca8a04" },
                  { label: "Rejected",   value: statusCounts.rejected,   color: "#e11d48" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-bold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div> */}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div
              className="bg-card border border-border p-6 sm:p-8"
              style={{ borderRadius: 2, borderTopWidth: 2, borderTopColor: PINK }}
            >
              <form onSubmit={handleSubmit}>

                {/* Personal */}
                {activeTab === "personal" && (
                  <div className="space-y-5">
                    <SectionTitle>Personal Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Prefix</Label>
                        <Select value={formData.prefix} onValueChange={(v) => handleInputChange("prefix", v)}>
                          <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["Mr.","Mrs.","Ms.","Dr.","Engr.","Atty."].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      {[
                        { field: "surname",         label: "Surname *",      required: true },
                        { field: "first_name",      label: "First Name *",   required: true },
                        { field: "middle_name",     label: "Middle Name" },
                        { field: "extension_name",  label: "Extension (Jr., Sr.)", placeholder: "e.g., Jr., Sr., III" },
                        { field: "nickname",        label: "Nickname" },
                      ].map(({ field, label, required, placeholder }: any) => (
                        <div key={field} className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>{label}</Label>
                          <Input className={inputCls} value={(formData as any)[field]} onChange={(e) => handleInputChange(field as any, e.target.value)} required={required} placeholder={placeholder} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Sex *</Label>
                      <RadioGroup value={formData.sex} onValueChange={(v) => handleInputChange("sex", v)} className="flex gap-6">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male" className="cursor-pointer text-sm">Male</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female" className="cursor-pointer text-sm">Female</Label></div>
                      </RadioGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Marital Status</Label>
                        <Select value={formData.marital_status} onValueChange={(v) => handleInputChange("marital_status", v)}>
                          <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["Single","Married","Widowed","Separated","Divorced"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      {[
                        { field: "name_of_spouse", label: "Name of Spouse" },
                        { field: "date_of_birth",  label: "Date of Birth *", type: "date", required: true },
                        { field: "place_of_birth", label: "Place of Birth" },
                        { field: "religion",       label: "Religion" },
                      ].map(({ field, label, type, required }: any) => (
                        <div key={field} className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>{label}</Label>
                          <Input className={inputCls} type={type || "text"} value={(formData as any)[field]} onChange={(e) => handleInputChange(field as any, e.target.value)} required={required} />
                        </div>
                      ))}
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* Contact */}
                {activeTab === "contact" && (
                  <div className="space-y-5">
                    <SectionTitle>Contact Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      {[
                        { field: "email",          label: "Email Address",  type: "email", ph: "example@email.com" },
                        { field: "contact_number", label: "Contact Number", ph: "09123456789" },
                      ].map(({ field, label, type, ph }) => (
                        <div key={field} className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>{label}</Label>
                          <Input className={inputCls} type={type || "text"} value={(formData as any)[field]} onChange={(e) => handleInputChange(field as any, e.target.value)} placeholder={ph} />
                        </div>
                      ))}
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* Address */}
                {activeTab === "address" && (
                  <div className="space-y-5">
                    <SectionTitle>Address Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      {[
                        { field: "house_block_lot_no",    label: "House / Block / Lot No. *", required: true },
                        { field: "street",                label: "Street *",                  required: true },
                        { field: "zone_purok",            label: "Zone / Purok *",            required: true },
                        { field: "house_owner",           label: "House Owner" },
                        { field: "relationship_to_owner", label: "Relationship to Owner",     ph: "e.g., Owner, Renter, Relative" },
                      ].map(({ field, label, required, ph }: any) => (
                        <div key={field} className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>{label}</Label>
                          <Input className={inputCls} value={(formData as any)[field]} onChange={(e) => handleInputChange(field as any, e.target.value)} required={required} placeholder={ph} />
                        </div>
                      ))}
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* Residency */}
                {activeTab === "residency" && (
                  <div className="space-y-5">
                    <SectionTitle>Residency Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Resident Status</Label>
                        <Select value={formData.resident_status} onValueChange={(v) => handleInputChange("resident_status", v)}>
                          <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["Permanent","Temporary","Transient"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Period of Residency</Label>
                        <Input className={inputCls} value={formData.period_of_residency} onChange={(e) => handleInputChange("period_of_residency", e.target.value)} placeholder="e.g., 5 years" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Voter Status</Label>
                      <RadioGroup value={formData.voter_status} onValueChange={(v) => handleInputChange("voter_status", v)} className="flex gap-6">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Registered" id="registered" /><Label htmlFor="registered" className="cursor-pointer text-sm">Registered</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Not Registered" id="notRegistered" /><Label htmlFor="notRegistered" className="cursor-pointer text-sm">Not Registered</Label></div>
                      </RadioGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Precinct No.</Label>
                        <Input className={inputCls} value={formData.precinct_no} onChange={(e) => handleInputChange("precinct_no", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Employment Status</Label>
                        <Select value={formData.employment_status} onValueChange={(v) => handleInputChange("employment_status", v)}>
                          <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["Employed","Self-Employed","Unemployed","Student","Retired","OFW"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      {[
                        { field: "occupation", label: "Occupation" },
                        { field: "position",   label: "Position" },
                      ].map(({ field, label }) => (
                        <div key={field} className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>{label}</Label>
                          <Input className={inputCls} value={(formData as any)[field]} onChange={(e) => handleInputChange(field as any, e.target.value)} />
                        </div>
                      ))}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>PWD Status</Label>
                        <Select value={formData.pwd_status ? "true" : "false"} onValueChange={(v) => handleInputChange("pwd_status", v === "true")}>
                          <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* Physical */}
                {activeTab === "physical" && (
                  <div className="space-y-5">
                    <SectionTitle>Physical Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      {[
                        { field: "height_cm",  label: "Height (cm)", type: "number", ph: "e.g., 170" },
                        { field: "weight_kg",  label: "Weight (kg)", type: "number", ph: "e.g., 65" },
                        { field: "complexion", label: "Complexion",                  ph: "e.g., Fair, Medium, Dark" },
                      ].map(({ field, label, type, ph }) => (
                        <div key={field} className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>{label}</Label>
                          <Input className={inputCls} type={type || "text"} value={(formData as any)[field]} onChange={(e) => handleInputChange(field as any, e.target.value)} placeholder={ph} />
                        </div>
                      ))}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Blood Type</Label>
                        <Select value={formData.blood_type} onValueChange={(v) => handleInputChange("blood_type", v)}>
                          <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* Service Requests */}
                {activeTab === "services" && (
                  <div className="space-y-5">
                    <SectionTitle>Service Requests</SectionTitle>
                    <div className="space-y-3">
                      {serviceRequests.map((req) => {
                        const s = statusStyle[req.status] ?? statusStyle.pending;
                        return (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-4 border"
                            style={{ borderRadius: 2, backgroundColor: "#f8faff", borderColor: "#dde3ed", borderLeft: `3px solid ${NAVY}` }}
                          >
                            <div>
                              <h4 className="font-semibold text-sm text-foreground" style={{ fontFamily: "'Georgia', serif" }}>{req.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{req.date}</p>
                            </div>
                            <span
                              className="text-[10px] font-bold capitalize px-3 py-1 border uppercase tracking-wider"
                              style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border, borderRadius: 1 }}
                            >
                              {req.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Activity */}
                {activeTab === "activity" && (
                  <div className="space-y-5">
                    <SectionTitle>Recent Activity</SectionTitle>
                    <div className="space-y-5">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4">
                          <div style={{ width: 3, height: 36, backgroundColor: PINK, borderRadius: 1, flexShrink: 0 }} />
                          <div>
                            <p className="font-medium text-sm text-foreground">{activity.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;