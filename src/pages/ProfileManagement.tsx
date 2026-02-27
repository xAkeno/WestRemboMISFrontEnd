import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
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
  Home
} from "lucide-react";
import Header from "@/components/forms/Header";

interface ProfileData {
  prefix: string;
  surname: string;
  first_name: string;
  middle_name: string;
  extension_name: string;
  nickname: string;
  sex: string;
  marital_status: string;
  name_of_spouse: string;
  date_of_birth: string;
  place_of_birth: string;
  religion: string;
  height_cm: string;
  weight_kg: string;
  blood_type: string;
  complexion: string;
  profile_image: string;
  email: string;
  contact_number: string;
  house_block_lot_no: string;
  street: string;
  zone_purok: string;
  house_owner: string;
  relationship_to_owner: string;
  resident_status: string;
  period_of_residency: string;
  voter_status: string;
  precinct_no: string;
  employment_status: string;
  occupation: string;
  position: string;
  pwd_status: boolean;
}

interface ServiceRequest {
  id: number;
  title: string;
  status: "pending" | "approved" | "rejected" | "processing";
  date: string;
}

const tabs = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "contact", label: "Contact Info", icon: Phone },
  { id: "address", label: "Address", icon: MapPin },
  { id: "residency", label: "Residency", icon: Home },
  { id: "physical", label: "Physical Info", icon: FileText },
  { id: "services", label: "Service Requests", icon: ClipboardList },
  { id: "activity", label: "Activity", icon: Activity },
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
    { id: 1, title: "Barangay Clearance", status: "approved", date: "2024-01-15" },
    { id: 2, title: "Barangay ID", status: "processing", date: "2024-01-20" },
    { id: 3, title: "Certificate of Indigency", status: "pending", date: "2024-01-25" },
    { id: 4, title: "Business Permit", status: "rejected", date: "2024-01-10" },
  ]);

  const [recentActivity] = useState([
    { id: 1, title: "Updated profile picture", time: "2 hours ago" },
    { id: 2, title: "Submitted Barangay Clearance request", time: "Yesterday" },
    { id: 3, title: "Updated personal information", time: "3 days ago" },
  ]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/details", { withCredentials: true });
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
      const response = await axios.post("http://127.0.0.1:8000/api/uploadProfileImage", fd, {
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
      await axios.put("http://127.0.0.1:8000/api/updateProfile", formData, { withCredentials: true });
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const statusCounts = {
    total: serviceRequests.length,
    pending: serviceRequests.filter((r) => r.status === "pending").length,
    approved: serviceRequests.filter((r) => r.status === "approved").length,
    processing: serviceRequests.filter((r) => r.status === "processing").length,
    rejected: serviceRequests.filter((r) => r.status === "rejected").length,
  };

  // Shared save button
  const SaveButton = () => (
    <div className="flex justify-end pt-6" style={{ borderTop: "1px solid #fce7f3" }}>
      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
        style={{ backgroundColor: "#d45ea3", boxShadow: "0 4px 16px rgba(212,94,163,0.28)" }}
      >
        <Save className="w-4 h-4" />
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );

  // Shared section title
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: "'Georgia', serif" }}>
        {children}
      </h2>
      <div className="h-0.5 rounded-full" style={{ width: 40, backgroundColor: "#d45ea3" }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Cover banner */}
      <div
        className="h-48 relative mt-12"
        style={{
          background: "linear-gradient(135deg, #1a0a13 0%, #7c1d56 50%, #d45ea3 100%)",
        }}
      >
        {/* Dot texture */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Profile photo */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full overflow-hidden bg-card flex items-center justify-center"
              style={{ border: "4px solid #fff", boxShadow: "0 0 0 4px rgba(212,94,163,0.25)" }}
            >
              {profileImage ? (
                <img
                  src={"http://127.0.0.1:8000/storage/" + profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-14 h-14 text-muted-foreground" />
              )}
            </div>
            <label
              htmlFor="profileImage"
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: "#d45ea3", boxShadow: "0 2px 8px rgba(212,94,163,0.40)" }}
            >
              <Camera className="w-4 h-4 text-white" />
              <input type="file" id="profileImage" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="text-center pt-16 pb-8">
        <h1
          className="text-2xl font-bold text-foreground mb-1"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {formData.first_name || formData.surname
            ? `${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.extension_name}`.trim()
            : "Your Name"}
        </h1>
        <p className="text-sm text-muted-foreground">Account Management</p>
        <div
          className="mx-auto mt-3 rounded-full"
          style={{ width: 40, height: 2, backgroundColor: "#d45ea3" }}
        />
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <div className="lg:w-64 shrink-0 space-y-4">
            {/* Tab nav */}
            <div
              className="bg-card rounded-2xl border border-border p-3 space-y-1"
              style={{ boxShadow: "0 2px 12px rgba(212,94,163,0.07)" }}
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 text-sm font-medium"
                    style={
                      isActive
                        ? { backgroundColor: "#d45ea3", color: "#fff" }
                        : { color: "#607a86" }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "#fdf2f8";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }}
                  >
                    <tab.icon className="w-4 h-4 flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Request summary */}
            <div
              className="bg-card rounded-2xl border border-border p-5"
              style={{ boxShadow: "0 2px 12px rgba(212,94,163,0.07)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-5" style={{ backgroundColor: "#d45ea3" }} />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#d45ea3" }}>
                  Request Summary
                </h3>
              </div>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: "Total", value: statusCounts.total, color: "#1e4a5c" },
                  { label: "Approved", value: statusCounts.approved, color: "#16a34a" },
                  { label: "Processing", value: statusCounts.processing, color: "#2563eb" },
                  { label: "Pending", value: statusCounts.pending, color: "#ca8a04" },
                  { label: "Rejected", value: statusCounts.rejected, color: "#e11d48" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-bold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div
              className="bg-card rounded-2xl border border-border p-6 sm:p-8"
              style={{ boxShadow: "0 2px 16px rgba(212,94,163,0.07)" }}
            >
              <form onSubmit={handleSubmit}>

                {/* Personal Info */}
                {activeTab === "personal" && (
                  <div className="space-y-5">
                    <SectionTitle>Personal Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Prefix</Label>
                        <Select value={formData.prefix} onValueChange={(v) => handleInputChange("prefix", v)}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {["Mr.", "Mrs.", "Ms.", "Dr.", "Engr.", "Atty."].map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Surname <span style={{ color: "#d45ea3" }}>*</span></Label>
                        <Input className="rounded-xl" value={formData.surname} onChange={(e) => handleInputChange("surname", e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>First Name <span style={{ color: "#d45ea3" }}>*</span></Label>
                        <Input className="rounded-xl" value={formData.first_name} onChange={(e) => handleInputChange("first_name", e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Middle Name</Label>
                        <Input className="rounded-xl" value={formData.middle_name} onChange={(e) => handleInputChange("middle_name", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Extension (Jr., Sr.)</Label>
                        <Input className="rounded-xl" value={formData.extension_name} onChange={(e) => handleInputChange("extension_name", e.target.value)} placeholder="e.g., Jr., Sr., III" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Nickname</Label>
                        <Input className="rounded-xl" value={formData.nickname} onChange={(e) => handleInputChange("nickname", e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sex <span style={{ color: "#d45ea3" }}>*</span></Label>
                      <RadioGroup value={formData.sex} onValueChange={(v) => handleInputChange("sex", v)} className="flex gap-6">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male" className="cursor-pointer">Male</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female" className="cursor-pointer">Female</Label></div>
                      </RadioGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Marital Status</Label>
                        <Select value={formData.marital_status} onValueChange={(v) => handleInputChange("marital_status", v)}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {["Single", "Married", "Widowed", "Separated", "Divorced"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Name of Spouse</Label>
                        <Input className="rounded-xl" value={formData.name_of_spouse} onChange={(e) => handleInputChange("name_of_spouse", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Date of Birth <span style={{ color: "#d45ea3" }}>*</span></Label>
                        <Input className="rounded-xl" type="date" value={formData.date_of_birth} onChange={(e) => handleInputChange("date_of_birth", e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Place of Birth</Label>
                        <Input className="rounded-xl" value={formData.place_of_birth} onChange={(e) => handleInputChange("place_of_birth", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Religion</Label>
                        <Input className="rounded-xl" value={formData.religion} onChange={(e) => handleInputChange("religion", e.target.value)} />
                      </div>
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* Contact Info */}
                {activeTab === "contact" && (
                  <div className="space-y-5">
                    <SectionTitle>Contact Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Email Address</Label>
                        <Input className="rounded-xl" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="example@email.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Contact Number</Label>
                        <Input className="rounded-xl" value={formData.contact_number} onChange={(e) => handleInputChange("contact_number", e.target.value)} placeholder="09123456789" />
                      </div>
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* Address */}
                {activeTab === "address" && (
                  <div className="space-y-5">
                    <SectionTitle>Address Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label>House/Block/Lot No. <span style={{ color: "#d45ea3" }}>*</span></Label><Input className="rounded-xl" value={formData.house_block_lot_no} onChange={(e) => handleInputChange("house_block_lot_no", e.target.value)} required /></div>
                      <div className="space-y-1.5"><Label>Street <span style={{ color: "#d45ea3" }}>*</span></Label><Input className="rounded-xl" value={formData.street} onChange={(e) => handleInputChange("street", e.target.value)} required /></div>
                      <div className="space-y-1.5"><Label>Zone/Purok <span style={{ color: "#d45ea3" }}>*</span></Label><Input className="rounded-xl" value={formData.zone_purok} onChange={(e) => handleInputChange("zone_purok", e.target.value)} required /></div>
                      <div className="space-y-1.5"><Label>House Owner</Label><Input className="rounded-xl" value={formData.house_owner} onChange={(e) => handleInputChange("house_owner", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Relationship to Owner</Label><Input className="rounded-xl" value={formData.relationship_to_owner} onChange={(e) => handleInputChange("relationship_to_owner", e.target.value)} placeholder="e.g., Owner, Renter, Relative" /></div>
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* Residency */}
                {activeTab === "residency" && (
                  <div className="space-y-5">
                    <SectionTitle>Residency Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Resident Status</Label>
                        <Select value={formData.resident_status} onValueChange={(v) => handleInputChange("resident_status", v)}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["Permanent","Temporary","Transient"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Period of Residency</Label><Input className="rounded-xl" value={formData.period_of_residency} onChange={(e) => handleInputChange("period_of_residency", e.target.value)} placeholder="e.g., 5 years" /></div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Voter Status</Label>
                      <RadioGroup value={formData.voter_status} onValueChange={(v) => handleInputChange("voter_status", v)} className="flex gap-6">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Registered" id="registered" /><Label htmlFor="registered" className="cursor-pointer">Registered</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Not Registered" id="notRegistered" /><Label htmlFor="notRegistered" className="cursor-pointer">Not Registered</Label></div>
                      </RadioGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label>Precinct No.</Label><Input className="rounded-xl" value={formData.precinct_no} onChange={(e) => handleInputChange("precinct_no", e.target.value)} /></div>
                      <div className="space-y-1.5">
                        <Label>Employment Status</Label>
                        <Select value={formData.employment_status} onValueChange={(v) => handleInputChange("employment_status", v)}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["Employed","Self-Employed","Unemployed","Student","Retired","OFW"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Occupation</Label><Input className="rounded-xl" value={formData.occupation} onChange={(e) => handleInputChange("occupation", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Position</Label><Input className="rounded-xl" value={formData.position} onChange={(e) => handleInputChange("position", e.target.value)} /></div>
                      <div className="space-y-1.5">
                        <Label>PWD Status</Label>
                        <Select value={formData.pwd_status ? "true" : "false"} onValueChange={(v) => handleInputChange("pwd_status", v === "true")}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* Physical Info */}
                {activeTab === "physical" && (
                  <div className="space-y-5">
                    <SectionTitle>Physical Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label>Height (cm)</Label><Input className="rounded-xl" type="number" value={formData.height_cm} onChange={(e) => handleInputChange("height_cm", e.target.value)} placeholder="e.g., 170" /></div>
                      <div className="space-y-1.5"><Label>Weight (kg)</Label><Input className="rounded-xl" type="number" value={formData.weight_kg} onChange={(e) => handleInputChange("weight_kg", e.target.value)} placeholder="e.g., 65" /></div>
                      <div className="space-y-1.5">
                        <Label>Blood Type</Label>
                        <Select value={formData.blood_type} onValueChange={(v) => handleInputChange("blood_type", v)}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Complexion</Label><Input className="rounded-xl" value={formData.complexion} onChange={(e) => handleInputChange("complexion", e.target.value)} placeholder="e.g., Fair, Medium, Dark" /></div>
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
                            className="flex items-center justify-between p-4 rounded-xl border"
                            style={{ backgroundColor: "#fdf2f8", borderColor: "#fce7f3" }}
                          >
                            <div>
                              <h4 className="font-semibold text-foreground text-sm">{req.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{req.date}</p>
                            </div>
                            <span
                              className="text-xs font-bold capitalize px-3 py-1 rounded-full border"
                              style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
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
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                            style={{ backgroundColor: "#d45ea3" }}
                          />
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