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
  Phone,
  MapPin,
  Home,
} from "lucide-react";
import Header from "@/components/forms/Header";

// ─── Token colors ──────────────────────────────────────────────────────────────
const NAVY = "#0f2a5e";
const PINK = "#c2467d";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StreetOption {
  id: number;
  name: string;
  sitio: string;
  formerly?: string;
}

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

const tabs = [
  { id: "personal",  label: "Personal Info",  icon: User },
  { id: "contact",   label: "Contact Info",   icon: Phone },
  { id: "address",   label: "Address",        icon: MapPin },
  { id: "residency", label: "Residency",      icon: Home },
  { id: "physical",  label: "Physical Info",  icon: FileText },
];

// SelectTrigger style — matches the other forms in your codebase
const ST = {
  className: "border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 text-sm px-0 h-9 bg-transparent shadow-none",
  style: { borderBottomWidth: 1, borderColor: "#d1d5db" } as React.CSSProperties,
};

// Helper to normalize text to uppercase
const toUpperCase = (str: string) => str ? str.toUpperCase() : "";

// ─── Address parser helper ────────────────────────────────────────────────────
const parseAddress = (address: string) => {
  if (!address) {
    return {
      house_block_lot_no: "",
      street: "",
      zone: "",
    };
  }

  const parts = address.split(",").map((p) => p.trim());

  return {
    house_block_lot_no: parts[0] || "",
    street: parts[1] || "",
    zone: parts[2] || "",
  };
};

const ProfileManagement = () => {
  const [activeTab, setActiveTab]       = useState("personal");
  const [profileImage, setProfileImage] = useState<string>("");
  const [isLoading, setIsLoading]       = useState(false);
  const [isSaving, setIsSaving]         = useState(false);

  // ─── Street / Zone data (fetched from API) ──────────────────────────────────
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  const uniqueZones = Array.from(
    new Set(streets.map((s) => s.sitio).filter(Boolean))
  );

  // Fetch streets first
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/streets", { withCredentials: true })
      .then((res) => setStreets(res.data?.data ?? res.data ?? []))
      .catch((e) => console.error("Failed to fetch streets:", e));
  }, []);

  // ─── Form state ─────────────────────────────────────────────────────────────
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

  // ─── Fetch profile AFTER streets are loaded ─────────────────────────────────
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/details", { withCredentials: true });
      if (response.status === 200) {
        const user = response.data.data;
        
        // Parse address from user.address string
        const addressParts = parseAddress(user.address || "");
        
        console.log("Parsed address:", addressParts);
        console.log("Available streets:", streets.map(s => s.name));
        console.log("Available zones:", uniqueZones);

        // Match street with available options - only set if exact match exists
        let matchedStreet = "";
        if (streets.length > 0 && addressParts.street) {
          const foundStreet = streets.find(s =>
            addressParts.street.toLowerCase() === s.name.toLowerCase() ||
            s.name.toLowerCase().includes(addressParts.street.toLowerCase()) ||
            addressParts.street.toLowerCase().includes(s.name.toLowerCase())
          );
          matchedStreet = foundStreet ? foundStreet.name : "";
          console.log("Street match:", { original: addressParts.street, matched: matchedStreet, found: !!foundStreet });
        }

        // Match zone with available options - only set if exact match exists
        let matchedZone = "";
        if (uniqueZones.length > 0 && addressParts.zone) {
          const foundZone = uniqueZones.find(z =>
            addressParts.zone.toLowerCase() === z.toLowerCase() ||
            z.toLowerCase().includes(addressParts.zone.toLowerCase()) ||
            addressParts.zone.toLowerCase().includes(z.toLowerCase())
          );
          matchedZone = foundZone ? foundZone : "";
          console.log("Zone match:", { original: addressParts.zone, matched: matchedZone, found: !!foundZone });
        }

        setProfileImage(user.url_photo || "");
        setFormData({
          prefix:                 user.prefix || "",
          surname:                user.surname || "",
          first_name:             user.first_name || "",
          middle_name:            user.middle_name || "",
          extension_name:         user.extension_name || "",
          nickname:               user.nickname || "",
          sex:                    user.sex || "",
          marital_status:         user.marital_status || "",
          name_of_spouse:         user.name_of_spouse || "",
          date_of_birth:          user.date_of_birth || "",
          place_of_birth:         user.place_of_birth || "",
          religion:               user.religion || "",
          height_cm:              user.height_cm ? String(user.height_cm) : "",
          weight_kg:              user.weight_kg ? String(user.weight_kg) : "",
          blood_type:             user.blood_type || "",
          complexion:             user.complexion || "",
          profile_image:          user.url_photo || "",
          email:                  user.email || "",
          contact_number:         user.contact_number || "",
          house_block_lot_no:     addressParts.house_block_lot_no || "",
          street:                 matchedStreet,
          zone_purok:             matchedZone,
          house_owner:            user.house_owner || "",
          relationship_to_owner:  user.relationship_to_owner || "",
          resident_status:        user.resident_status || "",
          period_of_residency:    user.period_of_residency || "",
          voter_status:           user.voter_status || "",
          precinct_no:            user.precinct_no || "",
          employment_status:      user.employment_status || "",
          occupation:             user.occupation || "",
          position:               user.position || "",
          pwd_status:             user.pwd_status || false,
        });
        setIsProfileLoaded(true);
      } else {
        toast.error("Account is not logged in");
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Error fetching profile: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Only fetch profile after streets are loaded
  useEffect(() => {
    if (streets.length > 0 && !isProfileLoaded) {
      fetchProfile();
    }
  }, [streets]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
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
      const response = await axios.post(
        "http://127.0.0.1:8000/api/uploadProfileImage",
        fd,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      setFormData((prev) => ({ ...prev, profile_image: response.data.url_photo }));
      toast.success("Profile image uploaded successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload profile image");
    }
  };

  // ─── Submit — only send the fields for the active tab ───────────────────────
  const getTabFields = (tab: string): (keyof ProfileData)[] => {
    switch (tab) {
      case "personal":
        return ["prefix","surname","first_name","middle_name","extension_name",
                "nickname","sex","marital_status","name_of_spouse","date_of_birth",
                "place_of_birth","religion"];
      case "contact":
        return ["email","contact_number"];
      case "address":
        return ["house_block_lot_no","street","zone_purok","house_owner","relationship_to_owner"];
      case "residency":
        return ["resident_status","period_of_residency","voter_status","precinct_no",
                "employment_status","occupation","position","pwd_status"];
      case "physical":
        return ["height_cm","weight_kg","blood_type","complexion"];
      default:
        return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "personal") {
      if (!formData.surname || !formData.first_name || !formData.sex || !formData.date_of_birth) {
        toast.error("Please fill in all required fields");
        return;
      }
    }

    // Only send fields for the current tab — prevents overwriting other tabs' data
    const fields = getTabFields(activeTab);
    const payload = fields.reduce((acc, key) => {
      acc[key] = formData[key] as any;
      return acc;
    }, {} as Record<string, any>);

    try {
      setIsSaving(true);
      await axios.put("http://127.0.0.1:8000/api/updateProfile", payload, { withCredentials: true });
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
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

  // ─── Shared Select style that matches inputCls look ─────────────────────────
  const SelectTriggerCls = "border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 text-sm px-0 h-9 bg-transparent shadow-none";

  if (isLoading && !isProfileLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: PINK, borderTopColor: "transparent" }} />
          <p style={{ color: NAVY }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Cover banner */}
      <div
        className="h-44 relative mt-16"
        style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3d7c 50%, #3b1a3a 100%)` }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: `repeating-linear-gradient(-45deg,#fff,#fff 1px,transparent 1px,transparent 18px)` }}
        />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, backgroundColor: PINK }} />

        {/* Profile photo */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full overflow-hidden bg-card flex items-center justify-center"
              style={{ border: `4px solid #fff`, boxShadow: `0 0 0 3px ${PINK}` }}
            >
              {profileImage ? (
                <img
                  src={"https://bold-sunset-533d.clarkkentraguhos.workers.dev/" + profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
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
          </div>

          {/* Content */}
          <div className="flex-1">
            <div
              className="bg-card border border-border p-6 sm:p-8"
              style={{ borderRadius: 2, borderTopWidth: 2, borderTopColor: PINK }}
            >
              <form onSubmit={handleSubmit}>

                {/* ── Personal ─────────────────────────────────────────────── */}
                {activeTab === "personal" && (
                  <div className="space-y-5">
                    <SectionTitle>Personal Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Prefix</Label>
                        <Select value={formData.prefix} onValueChange={(v) => handleInputChange("prefix", v)}>
                          <SelectTrigger className={SelectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {["Mr.","Mrs.","Ms.","Dr.","Engr.","Atty."].map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {[
                        { field: "surname",        label: "Surname *",           required: true },
                        { field: "first_name",     label: "First Name *",        required: true },
                        { field: "middle_name",    label: "Middle Name" },
                        { field: "extension_name", label: "Extension (Jr., Sr.)", placeholder: "e.g., Jr., Sr., III" },
                        { field: "nickname",       label: "Nickname" },
                      ].map(({ field, label, required, placeholder }: any) => (
                        <div key={field} className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>{label}</Label>
                          <Input
                            className={inputCls}
                            value={(formData as any)[field]}
                            onChange={(e) => handleInputChange(field as any, e.target.value)}
                            required={required}
                            placeholder={placeholder}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Sex *</Label>
                      <RadioGroup value={formData.sex} onValueChange={(v) => handleInputChange("sex", v)} className="flex gap-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Male" id="male" />
                          <Label htmlFor="male" className="cursor-pointer text-sm">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Female" id="female" />
                          <Label htmlFor="female" className="cursor-pointer text-sm">Female</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Marital Status</Label>
                        <Select value={formData.marital_status} onValueChange={(v) => handleInputChange("marital_status", v)}>
                          <SelectTrigger className={SelectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {["Single","Married","Widowed","Separated","Divorced"].map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
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
                          <Input
                            className={inputCls}
                            type={type || "text"}
                            value={(formData as any)[field]}
                            onChange={(e) => handleInputChange(field as any, e.target.value)}
                            required={required}
                          />
                        </div>
                      ))}
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* ── Contact ──────────────────────────────────────────────── */}
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
                          <Input
                            className={inputCls}
                            type={type || "text"}
                            value={(formData as any)[field]}
                            onChange={(e) => handleInputChange(field as any, e.target.value)}
                            placeholder={ph}
                          />
                        </div>
                      ))}
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* ── Address ──────────────────────────────────────────────── */}
                {activeTab === "address" && (
                  <div className="space-y-5">
                    <SectionTitle>Address Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

                      {/* House / Block / Lot */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>House / Block / Lot No. *</Label>
                        <Input
                          className={inputCls}
                          value={formData.house_block_lot_no}
                          onChange={(e) => handleInputChange("house_block_lot_no", e.target.value)}
                          required
                        />
                      </div>

                      {/* Street — dropdown if API has data, plain input as fallback */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Street *</Label>
                        {streets.length > 0 ? (
                          <Select
                            value={formData.street}
                            onValueChange={(v) => handleInputChange("street", v)}
                          >
                            <SelectTrigger className={SelectTriggerCls}>
                              <SelectValue placeholder="Select street" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {streets.map((s) => (
                                <SelectItem key={s.id} value={s.name}>
                                  {s.name}{s.formerly ? ` (formerly ${s.formerly})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            className={inputCls}
                            value={formData.street}
                            onChange={(e) => handleInputChange("street", e.target.value)}
                            placeholder="Enter street name"
                            required
                          />
                        )}
                      </div>

                      {/* Zone / Purok — dropdown if API has sitio data, plain input as fallback */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Zone / Purok *</Label>
                        {uniqueZones.length > 0 ? (
                          <Select
                            value={formData.zone_purok}
                            onValueChange={(v) => handleInputChange("zone_purok", v)}
                          >
                            <SelectTrigger className={SelectTriggerCls}>
                              <SelectValue placeholder="Select zone / purok" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {uniqueZones.map((z) => (
                                <SelectItem key={z} value={z}>{z}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            className={inputCls}
                            value={formData.zone_purok}
                            onChange={(e) => handleInputChange("zone_purok", e.target.value)}
                            placeholder="Enter zone / purok"
                            required
                          />
                        )}
                      </div>

                      {/* House Owner */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>House Owner</Label>
                        <Input
                          className={inputCls}
                          value={formData.house_owner}
                          onChange={(e) => handleInputChange("house_owner", e.target.value)}
                        />
                      </div>

                      {/* Relationship to Owner */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Relationship to Owner</Label>
                        <Select
                          value={formData.relationship_to_owner}
                          onValueChange={(v) => handleInputChange("relationship_to_owner", v)}
                        >
                          <SelectTrigger className={SelectTriggerCls}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Owner","Spouse","Child","Parent","Sibling","Relative","Tenant","Boarder"].map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* ── Residency ────────────────────────────────────────────── */}
                {activeTab === "residency" && (
                  <div className="space-y-5">
                    <SectionTitle>Residency Information</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Resident Status</Label>
                        <Select value={formData.resident_status} onValueChange={(v) => handleInputChange("resident_status", v)}>
                          <SelectTrigger className={SelectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {["Permanent","Temporary","Transient"].map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Period of Residency</Label>
                        <Input
                          className={inputCls}
                          value={formData.period_of_residency}
                          onChange={(e) => handleInputChange("period_of_residency", e.target.value)}
                          placeholder="e.g., 5 years"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Voter Status</Label>
                      <RadioGroup value={formData.voter_status} onValueChange={(v) => handleInputChange("voter_status", v)} className="flex gap-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Registered" id="registered" />
                          <Label htmlFor="registered" className="cursor-pointer text-sm">Registered</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Not Registered" id="notRegistered" />
                          <Label htmlFor="notRegistered" className="cursor-pointer text-sm">Not Registered</Label>
                        </div>
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
                          <SelectTrigger className={SelectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {["Employed","Self-Employed","Unemployed","Student","Retired","OFW"].map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
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
                          <SelectTrigger className={SelectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <SaveButton />
                  </div>
                )}

                {/* ── Physical ─────────────────────────────────────────────── */}
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
                          <Input
                            className={inputCls}
                            type={type || "text"}
                            value={(formData as any)[field]}
                            onChange={(e) => handleInputChange(field as any, e.target.value)}
                            placeholder={ph}
                          />
                        </div>
                      ))}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>Blood Type</Label>
                        <Select value={formData.blood_type} onValueChange={(v) => handleInputChange("blood_type", v)}>
                          <SelectTrigger className={SelectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => (
                              <SelectItem key={b} value={b}>{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <SaveButton />
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