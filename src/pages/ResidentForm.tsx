import { useState, useRef, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Save, RefreshCw, Printer, FileText, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {Layout} from "../components/Layout";
import axios from "axios";

// api instance configured in src/lib/api.ts

const ResidentForm = () => {
  const navigate = useNavigate();
  const [pwd, setIsPWD] = useState(false);
  const [prefix, setPrefix] = useState("mr");
  const [sex, setSex] = useState("male");
  const [marital_status, setMaritalStatus] = useState("");
  const [resident_status, setResidentStatus] = useState("permanent");
  const [voter_status, setVoterStatus] = useState("registered");
  const [street, setStreet] = useState("papaya");
  const [zone, setZone] = useState("sitio2");
  const [complexion, setComplexion] = useState("");
  const [blood_type, setBloodType] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const location = useLocation();
  const ticket = location.state?.ticket;

  const handleUploadClick = () => {
    fileInputRef.current?.click(); // Trigger the hidden file input
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file); // create temporary URL
      setPhoto(imageURL); // update state to display image
      setPhotoFile(file); // store the file for uploading
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const residentData = {
        resident_id: "RES0001",
        prefix,
        surname: (document.getElementById("lastName") as HTMLInputElement).value,
        first_name: (document.getElementById("firstName") as HTMLInputElement).value,
        middle_name: (document.getElementById("middleName") as HTMLInputElement).value,
        ext_name: (document.getElementById("ext") as HTMLInputElement).value,
        nick_name: (document.getElementById("nickname") as HTMLInputElement).value,
        sex,
        marital_status,
        name_of_spouse: (document.getElementById("spouse") as HTMLInputElement).value,
        resident_status,
        date_of_birth: (document.getElementById("dateOfBirth") as HTMLInputElement).value,
        place_of_birth: (document.getElementById("placeOfBirth") as HTMLInputElement).value,
        height_cm: (document.getElementById("height") as HTMLInputElement).value,
        weight_kg: (document.getElementById("weight") as HTMLInputElement).value,
        religion: (document.getElementById("religion") as HTMLInputElement).value,
        voter_status,
        precinct_no: (document.getElementById("precinctNo") as HTMLInputElement).value,
        house_block_lot_no: (document.getElementById("houseBlockLot") as HTMLInputElement).value,
        street,
        zone,
        phone_number: (document.getElementById("phoneNumber") as HTMLInputElement).value,
        email_address: (document.getElementById("emailAddress") as HTMLInputElement).value,
        period_of_residency: (document.getElementById("residencyPeriod") as HTMLInputElement).value,
        house_owner: (document.getElementById("houseOwner") as HTMLInputElement).value,
        relationship_to_owner: (document.getElementById("relationshipToOwner") as HTMLInputElement).value,
        complexion,
        blood_type,
        emp_status: (document.getElementById("empStatus") as HTMLInputElement).value,
        occupation: (document.getElementById("occupation") as HTMLInputElement).value,
        position: (document.getElementById("position") as HTMLInputElement).value,
        notes: (document.getElementById("notes") as HTMLTextAreaElement).value,
        pwd,
      };

      // Prepare FormData for file upload
      const formData = new FormData();
      Object.entries(residentData).forEach(([key, value]) => formData.append(key, String(value)));
      if (photoFile) formData.append("photo", photoFile);

      // Ensure token exists (api interceptor will attach it

      console.log("Submitting resident data:", residentData);

      const response = await api.post("/api/residents", formData,{withCredentials: true});
      let savedRecordId = null;

      if (response.status === 201) {
        toast.success("Resident record saved successfully");
        savedRecordId = response.data.data.id;
      }

      // Update Ticket Based on the Service Saved
      if (ticket) {
        await axios.post(
          `http://127.0.0.1:8000/api/tickets/update-by-service/${ticket.ticket_number}`,
          {
            status: "ENCODED"
          },
          { withCredentials: true }
        );
        toast("Updated the ticket to encoded status");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to save resident record";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const parseAddress = (fullAddress: string = "") => {
    const parts = fullAddress.split(",");

    let house_block_lot_no = "";
    let street = "";
    let zone = "";

    if (parts.length === 2) {
      zone = parts[1].trim();
      const firstPart = parts[0].trim();

      const match = firstPart.match(/^(Block\s+\d+\s+Lot\s+\d+)\s+(.+)$/i);
      if (match) {
        house_block_lot_no = match[1];
        street = match[2];
      } else {
        street = firstPart;
      }
    } else {
      street = fullAddress;
    }

    return { house_block_lot_no, street, zone };
  };

  useEffect(() => {
    if (!ticket?.serviceable) return;

    console.log("Populating Resident Registration form:", ticket);

    const data = ticket.serviceable;

    const set = (id: string, value: any) => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el && value !== undefined && value !== null) el.value = value;
    };

    // Parse address → houseBlockLot + street + zone
    const { house_block_lot_no, street, zone } = parseAddress(data.address);

    // Personal Info
    set("lastName", data.last_name);
    set("firstName", data.first_name);
    set("middleName", data.middle_name);
    set("ext", data.ext || "");

    set("dateOfBirth", data.date_of_birth);
    set("placeOfBirth", data.place_of_birth);

    // Residency / Address
    set("houseBlockLot", house_block_lot_no);
    set("street", street);
    set("zone", zone);

    set("residencyPeriod", data.period_of_residency);
    set("houseOwner", data.house_owner);
    set("relationshipToOwner", data.relation_to_house_owner);

    // Contact
    set("phoneNumber", data.contact_number);

    // Purpose
    set("purpose", data.purpose);

    // Registered Voter (Yes / No)
    set("registeredVoter", data.registered_voter === "Yes" ? "yes" : "no");

    /** OPTIONAL Select fields you might have **/
    if (data.prefix) setPrefix(data.prefix.toLowerCase());
    if (data.sex) setSex(data.sex.toLowerCase());
    if (data.marital_status) setMaritalStatus(data.marital_status.toLowerCase());
    if (data.resident_status) setResidentStatus(data.resident_status.toLowerCase());
    if (data.complexion) setComplexion(data.complexion.toLowerCase());
    if (data.blood_type) setBloodType(data.blood_type.toLowerCase());
    if (data.pwd !== undefined) setIsPWD(Boolean(data.pwd));

  }, [ticket]);






  const handleRefresh = () => {
    toast.info("Form refreshed");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Barangay West Rembo Resident Information</h1>
            <p className="text-sm text-muted-foreground mt-1">Record ID: 0001 | Created: 07-Jan-25</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <X className="mr-2 h-4 w-4" />
            Close Form
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal & Other Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader className="bg-form-section">
                <CardTitle className="text-foreground">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Prefix</Label>
                    <Select value={prefix} onValueChange={setPrefix}>
                      <SelectTrigger id="prefix">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mr">Mr.</SelectItem>
                        <SelectItem value="ms">Ms.</SelectItem>
                        <SelectItem value="mrs">Mrs.</SelectItem>
                        <SelectItem value="dr">Dr.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName"  />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName"  />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ext">Ext.</Label>
                    <Input id="ext" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input id="nickname" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sex">Sex *</Label>
                    <Select value={sex} onValueChange={setSex}>
                      <SelectTrigger id="sex">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select value={marital_status} onValueChange={setMaritalStatus}>
                      <SelectTrigger id="maritalStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                        <SelectItem value="separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spouse">Name of Spouse</Label>
                  <Input id="spouse" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="residentStatus">Resident Status *</Label>
                  <Select value={resident_status} onValueChange={setResidentStatus}>
                    <SelectTrigger id="residentStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input id="dateOfBirth" type="date" defaultValue="1978-10-22" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placeOfBirth">Place of Birth</Label>
                    <Input id="placeOfBirth" defaultValue="Davao City" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" defaultValue="47" readOnly />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (CM)</Label>
                    <Input id="height" type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (KG)</Label>
                    <Input id="weight" type="number" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="religion">Religion</Label>
                    <Input id="religion" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voterStatus">Voter Status</Label>
                    <Select value={voter_status} onValueChange={setVoterStatus}>
                      <SelectTrigger id="voterStatus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registered">Registered</SelectItem>
                        <SelectItem value="not-registered">Not Registered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precinctNo">Precinct No.</Label>
                  <Input id="precinctNo" />
                </div>
              </CardContent>
            </Card>

            {/* Contact & Address */}
            <Card>
              <CardHeader className="bg-form-section">
                <CardTitle className="text-foreground">Contact's/Address</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="houseBlockLot">House Block Lot No.</Label>
                    <Input id="houseBlockLot" defaultValue="51-A" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street</Label>
                    <Select value={street} onValueChange={setStreet}>
                      <SelectTrigger id="street">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="papaya">Papaya Street</SelectItem>
                        <SelectItem value="mango">Mango Street</SelectItem>
                        <SelectItem value="banana">Banana Street</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone</Label>
                    <Select value={zone} onValueChange={setZone}>
                      <SelectTrigger id="zone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sitio1">Sitio 1</SelectItem>
                        <SelectItem value="sitio2">Sitio 2</SelectItem>
                        <SelectItem value="sitio3">Sitio 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" type="tel" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailAddress">Email Address</Label>
                  <Input id="emailAddress" type="email" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="residencyPeriod">Period of Residency</Label>
                    <Input id="residencyPeriod" defaultValue="20 Years" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="houseOwner">House Owner</Label>
                    <Input id="houseOwner" defaultValue="PERLA MINTAR" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationshipToOwner">Relationship to House Owner</Label>
                  <Input id="relationshipToOwner" defaultValue="Father in Law" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Photo & Other Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {photo ? (
                    <img src={photo} alt="User Photo" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-24 w-24 text-muted-foreground" />
                  )}
                </div>

                <Button className="w-full" variant="outline" onClick={handleUploadClick}>
                  Upload Photo
                </Button>

                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <Button className="w-full" variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Preview
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-form-section">
                <CardTitle className="text-foreground">Other Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="complexion">Complexion</Label>
                  <Select value={complexion} onValueChange={setComplexion}>
                    <SelectTrigger id="complexion">
                      <SelectValue placeholder="Select complexion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select value={blood_type} onValueChange={setBloodType}>
                    <SelectTrigger id="bloodType">
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a+">A+</SelectItem>
                      <SelectItem value="a-">A-</SelectItem>
                      <SelectItem value="b+">B+</SelectItem>
                      <SelectItem value="b-">B-</SelectItem>
                      <SelectItem value="o+">O+</SelectItem>
                      <SelectItem value="o-">O-</SelectItem>
                      <SelectItem value="ab+">AB+</SelectItem>
                      <SelectItem value="ab-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empStatus">Employment Status</Label>
                  <Input id="empStatus" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input id="occupation" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input id="position" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" rows={4} />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pwd" 
                    checked={pwd}
                    onCheckedChange={(checked) => setIsPWD(checked as boolean)}
                  />
                  <Label htmlFor="pwd" className="cursor-pointer">
                    PWD - Person With Disability
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 pb-6">
          <Button onClick={() => navigate("/residents/new")} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            New Record
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Record
              </>
            )}
          </Button>
          <Button onClick={handleRefresh} variant="outline" disabled={isSaving}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Preview
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Print PDF
          </Button>
        </div>
      </div>

    </Layout>
  );
};

export default ResidentForm;
