import { useState, useRef } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Save, RefreshCw, Printer, FileText, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {Layout} from "../components/Layout";
import axios from "axios";

// api instance configured in src/lib/api.ts

const ResidentForm = () => {
  const navigate = useNavigate();
  const [isPWD, setIsPWD] = useState(false);
  const [prefix, setPrefix] = useState("mr");
  const [sex, setSex] = useState("male");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [residentStatus, setResidentStatus] = useState("permanent");
  const [voterStatus, setVoterStatus] = useState("registered");
  const [street, setStreet] = useState("papaya");
  const [zone, setZone] = useState("sitio2");
  const [complexion, setComplexion] = useState("");
  const [bloodType, setBloodType] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
        prefix,
        lastName: (document.getElementById("lastName") as HTMLInputElement).value,
        firstName: (document.getElementById("firstName") as HTMLInputElement).value,
        middleName: (document.getElementById("middleName") as HTMLInputElement).value,
        ext: (document.getElementById("ext") as HTMLInputElement).value,
        nickname: (document.getElementById("nickname") as HTMLInputElement).value,
        sex,
        maritalStatus,
        spouse: (document.getElementById("spouse") as HTMLInputElement).value,
        residentStatus,
        dateOfBirth: (document.getElementById("dateOfBirth") as HTMLInputElement).value,
        placeOfBirth: (document.getElementById("placeOfBirth") as HTMLInputElement).value,
        age: (document.getElementById("age") as HTMLInputElement).value,
        height: (document.getElementById("height") as HTMLInputElement).value,
        weight: (document.getElementById("weight") as HTMLInputElement).value,
        religion: (document.getElementById("religion") as HTMLInputElement).value,
        voterStatus,
        precinctNo: (document.getElementById("precinctNo") as HTMLInputElement).value,
        houseBlockLot: (document.getElementById("houseBlockLot") as HTMLInputElement).value,
        street,
        zone,
        phoneNumber: (document.getElementById("phoneNumber") as HTMLInputElement).value,
        emailAddress: (document.getElementById("emailAddress") as HTMLInputElement).value,
        residencyPeriod: (document.getElementById("residencyPeriod") as HTMLInputElement).value,
        houseOwner: (document.getElementById("houseOwner") as HTMLInputElement).value,
        relationshipToOwner: (document.getElementById("relationshipToOwner") as HTMLInputElement).value,
        complexion,
        bloodType,
        empStatus: (document.getElementById("empStatus") as HTMLInputElement).value,
        occupation: (document.getElementById("occupation") as HTMLInputElement).value,
        position: (document.getElementById("position") as HTMLInputElement).value,
        notes: (document.getElementById("notes") as HTMLTextAreaElement).value,
        isPWD,
      };

      // Prepare FormData for file upload
      const formData = new FormData();
      Object.entries(residentData).forEach(([key, value]) => formData.append(key, String(value)));
      if (photoFile) formData.append("photo", photoFile);

      // Ensure token exists (api interceptor will attach it)
      const fallbackToken = "23|PDMlrBxvx6QqNKlR7mMT1T10vAwSjqOYvFotKAeBc455eff4";


      const response = await api.post("/api/residents", formData);

      toast.success("Resident record saved successfully");
      console.log(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to save resident record";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };




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
                    <Input id="lastName" defaultValue="ALBALADEJO" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" defaultValue="REBEL" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" defaultValue="I" />
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
                    <Select value={maritalStatus} onValueChange={setMaritalStatus}>
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
                  <Select value={residentStatus} onValueChange={setResidentStatus}>
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
                    <Select value={voterStatus} onValueChange={setVoterStatus}>
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
                <div className="text-center p-4 bg-primary rounded-lg">
                  <p className="font-bold text-primary-foreground">REBEL I ALBALADEJO</p>
                </div>
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
                  <Select value={bloodType} onValueChange={setBloodType}>
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
                    checked={isPWD}
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
