import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  // Contact Info
  email: string;
  contact_number: string;
  // Address
  house_block_lot_no: string;
  street: string;
  zone_purok: string;
  house_owner: string;
  relationship_to_owner: string;
  // Residency
  resident_status: string;
  period_of_residency: string;
  voter_status: string;
  precinct_no: string;
  // Employment
  employment_status: string;
  occupation: string;
  position: string;
  // Health / PWD
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

const ProfileManagement = () => {
  const [activeTab, setActiveTab] = useState("personal");
  const [profileImage, setProfileImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    prefix: "",
    surname: "",
    first_name: "",
    middle_name: "",
    extension_name: "",
    nickname: "",
    sex: "",
    marital_status: "",
    name_of_spouse: "",
    date_of_birth: "",
    place_of_birth: "",
    religion: "",
    height_cm: "",
    weight_kg: "",
    blood_type: "",
    complexion: "",
    profile_image: "",
    email: "",
    contact_number: "",
    house_block_lot_no: "",
    street: "",
    zone_purok: "",
    house_owner: "",
    relationship_to_owner: "",
    resident_status: "",
    period_of_residency: "",
    voter_status: "",
    precinct_no: "",
    employment_status: "",
    occupation: "",
    position: "",
    pwd_status: false,

  });

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([
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
  const [self, setSelf] = useState(null);
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/details", { withCredentials: true });

      if (response.status === 200) {
        const user = response.data.data; // <-- use .data from your API
        setProfileImage(user.url_photo || ""); // Set profile image if available
        // Map API user object to formData
        setFormData({
          prefix: user.prefix || "",
          surname: user.surname || "",
          first_name: user.first_name || "",
          middle_name: user.middle_name || "",
          extension_name: user.extension_name || "",
          nickname: user.nickname || "",
          sex: user.sex || "",
          marital_status: user.marital_status || "",
          name_of_spouse: user.name_of_spouse || "",
          date_of_birth: user.date_of_birth || "",
          place_of_birth: user.place_of_birth || "",
          religion: user.religion || "",
          height_cm: user.height_cm ? String(user.height_cm) : "",
          weight_kg: user.weight_kg ? String(user.weight_kg) : "",
          blood_type: user.blood_type || "",
          complexion: user.complexion || "",
          profile_image: user.url_photo || "",
          email: user.email || "",
          contact_number: user.contact_number || "",
          house_block_lot_no: user.house_block_lot_no || "",
          street: user.street || "",
          zone_purok: user.zone_purok || "",
          house_owner: user.house_owner || "",
          relationship_to_owner: user.relationship_to_owner || "",
          resident_status: user.resident_status || "",
          period_of_residency: user.period_of_residency || "",
          voter_status: user.voter_status || "",
          precinct_no: user.precinct_no || "",
          employment_status: user.employment_status || "",
          occupation: user.occupation || "",
          position: user.position || "",
          pwd_status: user.pwd_status || false,

        });

        if (user.url_photo) {
          setProfileImage(user.url_photo);
        }
      } else {
        toast.error("Account is not logged in");
      }
    } catch (error: any) {
      toast.error("Error fetching profile: " + (error.message || "Unknown error"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    // const get = async () => {
    //   try {
    //     setIsLoading(true);
    //     const res = await axios.get(
    //       "http://127.0.0.1:8000/api/latestRecordBrgyCertificates",
    //       { withCredentials: true }
    //     );
    //     var json = res.data.data;
    //     if (json) {
    //       setFormData(json);
    //       if (json.profileImage) {
    //         setProfileImage(json.profileImage);
    //       }
    //     }
    //     console.log(json);
    //   } catch (error: any) {
    //     const errorMessage =
    //       error.response?.data?.message || "Failed to fetch profile data";
    //     toast.error(errorMessage);
    //     console.error(error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // get();
    fetchProfile();
  }, []);

  const handleInputChange = <K extends keyof ProfileData>(
    field: K,
    value: ProfileData[K] // <-- now TypeScript knows the correct type
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Show preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setProfileImage(reader.result as string); // just for preview
  };
  reader.readAsDataURL(file);

  // Upload image to Laravel
  const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/uploadProfileImage",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update formData with returned URL
      setFormData((prev) => ({
        ...prev,
        profileImage: response.data.url_photo,
      }));

      toast.success("Profile image uploaded successfully!");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to upload profile image";
      toast.error(errorMessage);
      console.error(error);
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
      const res = await axios.put(
        "http://127.0.0.1:8000/api/updateProfile",
        formData,
        { withCredentials: true }
      );
      toast.success("Profile updated successfully!");
      console.log(res.data);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const statusCounts = {
    total: serviceRequests.length,
    pending: serviceRequests.filter((r) => r.status === "pending").length,
    approved: serviceRequests.filter((r) => r.status === "approved").length,
    processing: serviceRequests.filter((r) => r.status === "processing").length,
    rejected: serviceRequests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Header */}
      <Header/>
      <div className="h-48 bg-gradient-to-r from-primary via-purple-500 to-pink-500 relative mt-12">
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-card overflow-hidden bg-muted flex items-center justify-center shadow-lg">
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
              className="absolute bottom-1 right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Profile Name */}
      <div className="text-center pt-16 pb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {formData.first_name || formData.surname
            ? `${formData.prefix} ${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.extension_name}`.trim()
            : "Your Name"}
        </h1>
        <p className="text-muted-foreground">Account Management</p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-card rounded-lg border border-border p-4 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Service Request Summary */}
            <div className="bg-card rounded-lg border border-border p-4 mt-4">
              <h3 className="font-semibold text-foreground mb-3">Request Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{statusCounts.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Approved</span>
                  <span className="font-semibold text-green-600">{statusCounts.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Processing</span>
                  <span className="font-semibold text-blue-600">{statusCounts.processing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600">Pending</span>
                  <span className="font-semibold text-yellow-600">{statusCounts.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Rejected</span>
                  <span className="font-semibold text-red-600">{statusCounts.rejected}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-card rounded-lg border border-border p-6">
              <form onSubmit={handleSubmit}>
                {/* Personal Info Tab */}
                {activeTab === "personal" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      Personal Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prefix">Prefix</Label>
                        <Select
                          value={formData.prefix}
                          onValueChange={(value) => handleInputChange("prefix", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mr.">Mr.</SelectItem>
                            <SelectItem value="Mrs.">Mrs.</SelectItem>
                            <SelectItem value="Ms.">Ms.</SelectItem>
                            <SelectItem value="Dr.">Dr.</SelectItem>
                            <SelectItem value="Engr.">Engr.</SelectItem>
                            <SelectItem value="Atty.">Atty.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="surname">
                          Surname <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="surname"
                          value={formData.surname}
                          onChange={(e) => handleInputChange("surname", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="firstName">
                          First Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          value={formData.first_name}
                          onChange={(e) => handleInputChange("first_name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input
                          id="middleName"
                          value={formData.middle_name}
                          onChange={(e) => handleInputChange("middle_name", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="extension">Extension (Jr., Sr.)</Label>
                        <Input
                          id="extension"
                          value={formData.extension_name}
                          onChange={(e) => handleInputChange("extension_name", e.target.value)}
                          placeholder="e.g., Jr., Sr., III"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nickname">Nickname</Label>
                        <Input
                          id="nickname"
                          value={formData.nickname}
                          onChange={(e) => handleInputChange("nickname", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Sex <span className="text-destructive">*</span>
                      </Label>
                      <RadioGroup
                        value={formData.sex}
                        onValueChange={(value) => handleInputChange("sex", value)}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Male" id="male" />
                          <Label htmlFor="male" className="cursor-pointer">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Female" id="female" />
                          <Label htmlFor="female" className="cursor-pointer">Female</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maritalStatus">Marital Status</Label>
                        <Select
                          value={formData.marital_status}
                          onValueChange={(value) => handleInputChange("marital_status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                            <SelectItem value="Separated">Separated</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="spouseName">Name of Spouse</Label>
                        <Input
                          id="spouseName"
                          value={formData.name_of_spouse}
                          onChange={(e) => handleInputChange("name_of_spouse", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">
                          Date of Birth <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="placeOfBirth">Place of Birth</Label>
                        <Input
                          id="placeOfBirth"
                          value={formData.place_of_birth}
                          onChange={(e) => handleInputChange("place_of_birth", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="religion">Religion</Label>
                        <Input
                          id="religion"
                          value={formData.religion}
                          onChange={(e) => handleInputChange("religion", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Contact Info Tab */}
                {activeTab === "contact" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      Contact Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="example@email.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactNumber">Contact Number</Label>
                        <Input
                          id="contactNumber"
                          value={formData.contact_number}
                          onChange={(e) => handleInputChange("contact_number", e.target.value)}
                          placeholder="e.g., 09123456789"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Address Tab */}
                {activeTab === "address" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      Address Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="houseBlockLot">
                          House/Block/Lot No. <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="houseBlockLot"
                          value={formData.house_block_lot_no}
                          onChange={(e) => handleInputChange("house_block_lot_no", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="street">
                          Street <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="street"
                          value={formData.street}
                          onChange={(e) => handleInputChange("street", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zonePurok">
                          Zone/Purok <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="zonePurok"
                          value={formData.zone_purok}
                          onChange={(e) => handleInputChange("zone_purok", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="houseOwner">House Owner</Label>
                        <Input
                          id="houseOwner"
                          value={formData.house_owner}
                          onChange={(e) => handleInputChange("house_owner", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="relationshipToOwner">Relationship to Owner</Label>
                        <Input
                          id="relationshipToOwner"
                          value={formData.relationship_to_owner}
                          onChange={(e) => handleInputChange("relationship_to_owner", e.target.value)}
                          placeholder="e.g., Owner, Renter, Relative"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Residency Tab */}
                {activeTab === "residency" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      Residency Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="residentStatus">Resident Status</Label>
                        <Select
                          value={formData.resident_status}
                          onValueChange={(value) => handleInputChange("resident_status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Permanent">Permanent</SelectItem>
                            <SelectItem value="Temporary">Temporary</SelectItem>
                            <SelectItem value="Transient">Transient</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="periodOfResidency">Period of Residency</Label>
                        <Input
                          id="periodOfResidency"
                          value={formData.period_of_residency}
                          onChange={(e) => handleInputChange("period_of_residency", e.target.value)}
                          placeholder="e.g., 5 years"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Voter Status</Label>
                      <RadioGroup
                        value={formData.voter_status}
                        onValueChange={(value) => handleInputChange("voter_status", value)}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Registered" id="registered" />
                          <Label htmlFor="registered" className="cursor-pointer">Registered</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Not Registered" id="notRegistered" />
                          <Label htmlFor="notRegistered" className="cursor-pointer">Not Registered</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="precinctNo">Precinct No.</Label>
                        <Input
                          id="precinctNo"
                          value={formData.precinct_no}
                          onChange={(e) => handleInputChange("precinct_no", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="employmentStatus">Employment Status</Label>
                        <Select
                          value={formData.employment_status}
                          onValueChange={(value) => handleInputChange("employment_status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Employed">Employed</SelectItem>
                            <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                            <SelectItem value="Unemployed">Unemployed</SelectItem>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Retired">Retired</SelectItem>
                            <SelectItem value="OFW">OFW</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                          id="occupation"
                          value={formData.occupation}
                          onChange={(e) => handleInputChange("occupation", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input
                          id="position"
                          value={formData.position}
                          onChange={(e) => handleInputChange("position", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Select
                          value={formData.pwd_status ? "true" : "false"}
                          onValueChange={(value) => handleInputChange("pwd_status", value === "true")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>


                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Physical Info Tab */}
                {activeTab === "physical" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      Physical Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          value={formData.height_cm}
                          onChange={(e) => handleInputChange("height_cm", e.target.value)}
                          placeholder="e.g., 170"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          value={formData.weight_kg}
                          onChange={(e) => handleInputChange("weight_kg", e.target.value)}
                          placeholder="e.g., 65"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bloodType">Blood Type</Label>
                        <Select
                          value={formData.blood_type}
                          onValueChange={(value) => handleInputChange("blood_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="complexion">Complexion</Label>
                        <Input
                          id="complexion"
                          value={formData.complexion}
                          onChange={(e) => handleInputChange("complexion", e.target.value)}
                          placeholder="e.g., Fair, Medium, Dark"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Service Requests Tab */}
                {activeTab === "services" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      Service Requests
                    </h2>

                    <div className="space-y-3">
                      {serviceRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                        >
                          <div>
                            <h4 className="font-medium text-foreground">{request.title}</h4>
                            <p className="text-sm text-muted-foreground">{request.date}</p>
                          </div>
                          <Badge className={`${getStatusColor(request.status)} border capitalize`}>
                            {request.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === "activity" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-3">
                      Recent Activity
                    </h2>

                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                          <div>
                            <h4 className="font-medium text-foreground">{activity.title}</h4>
                            <p className="text-sm text-muted-foreground">{activity.time}</p>
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
