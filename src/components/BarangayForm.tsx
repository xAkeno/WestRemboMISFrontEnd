import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { BarangayClearancePreview } from './BarangayClearancePreview';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Save,
  Search,
  RefreshCw,
  Eye,
  FileDown,
  PlusCircle,
  X,
} from "lucide-react";


interface FormData {
  recordNo: string;
  clearanceNo: string;
  issuedDate: string;
  prefix: string;
  firstname: string;
  middlename: string;
  surname: string;
  extension: string;
  houseBlockLot: string;
  street: string;
  age: string;
  zone: string;
  dateOfBirth: string;
  placeOfBirth: string;
  contactNo: string;
  residencyPeriod: string;
  registeredVoter: string;
  houseOwner: string;
  relationshipToOwner: string;
  purpose: string;
  purposeDetails: string;
  ctcVrrNo: string;
  issuedAt: string;
  issuedOn: string;
  orNo: string;
  remarks: string;
}

export default function BarangayForm() {
  const [formData, setFormData] = useState<FormData>({
    recordNo: "",
    clearanceNo: "",
    issuedDate: new Date().toISOString().split('T')[0],
    prefix: "",
    firstname: "",
    middlename: "",
    surname: "",
    extension: "",
    houseBlockLot: "",
    street: "",
    age: "",
    zone: "",
    dateOfBirth: "",
    placeOfBirth: "",
    contactNo: "",
    residencyPeriod: "",
    registeredVoter: "",
    houseOwner: "",
    relationshipToOwner: "",
    purpose: "",
    purposeDetails: "",
    ctcVrrNo: "",
    issuedAt: "",
    issuedOn: "",
    orNo: "",
    remarks: "",
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = async () => {
    const instance = viewerInstanceRef.current;
    if (!instance) return;

    const { annotManager } = instance;

    // Flatten all form fields so the data shows in print
    annotManager.flattenAnnotations();

    // Print the PDF
    instance.print();

    // Optional: undo flatten to keep fields editable
    annotManager.undo();
  };


  

  const fullName = `${formData.prefix ? formData.prefix + ' ' : ''}${formData.firstname} ${formData.middlename} ${formData.surname} ${formData.extension}`.trim();

  const viewerInstanceRef = useRef<any>(null);
  
  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && viewerInstanceRef.current) {
      viewerInstanceRef.current.loadDocument(file);
    }
  };

  useEffect(() => {
    const instance = viewerInstanceRef.current;
    if (!instance || !instance.docViewer) return;

    const { annotManager } = instance;

    Object.keys(formData).forEach((key) => {
      const field = annotManager.getField(key);
      if (field) field.setValue(formData[key as keyof FormData]);
    });

    annotManager.drawAnnotationsFromList();
  }, [formData]);

  

  const handleSaveRecord = () => {
    toast.success("Record saved successfully");
  };

  const handleFindRecord = () => {
    toast.info("Search functionality - Coming soon");
  };

  const handleRefresh = () => {
    toast.info("Data refreshed");
  };


  const handleNewRecord = () => {
    setFormData(
      {
        recordNo: "",
        clearanceNo: "",
        issuedDate: new Date().toISOString().split('T')[0],
        prefix: "",
        firstname: "",
        middlename: "",
        surname: "",
        extension: "",
        houseBlockLot: "",
        street: "",
        age: "",
        zone: "",
        dateOfBirth: "",
        placeOfBirth: "",
        contactNo: "",
        residencyPeriod: "",
        registeredVoter: "",
        houseOwner: "",
        relationshipToOwner: "",
        purpose: "",
        purposeDetails: "",
        ctcVrrNo: "",
        issuedAt: "",
        issuedOn: "",
        orNo: "",
        remarks: "",
      }
    )

  };
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <div>
        <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Personal Information</h2>
        </div>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <Label htmlFor="recordNo">Record No.</Label>
                <Input
                  id="recordNo"
                  placeholder="Enter record number"
                  value={formData.recordNo}
                  onChange={(e) => handleInputChange("recordNo", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="clearanceNo">Clearance No.</Label>
                <Input
                  id="clearanceNo"
                  placeholder="Enter clearance number"
                  value={formData.clearanceNo}
                  onChange={(e) => handleInputChange("clearanceNo", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="issuedDate">Issued Date</Label>
              <Input
                id="issuedDate"
                type="date"
                value={formData.issuedDate}
                onChange={(e) => handleInputChange("issuedDate", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="prefix">Prefix</Label>
                <Select value={formData.prefix} onValueChange={(value) => handleInputChange("prefix", value)}>
                  <SelectTrigger id="prefix">
                    <SelectValue placeholder="Mr/Ms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Ms.">Ms.</SelectItem>
                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label htmlFor="firstname">Firstname</Label>
                <Input
                  id="firstname"
                  placeholder="Enter firstname"
                  value={formData.firstname}
                  onChange={(e) => handleInputChange("firstname", e.target.value)}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="middlename">Middle Name</Label>
                <Input
                  id="middlename"
                  placeholder="Enter middle name"
                  value={formData.middlename}
                  onChange={(e) => handleInputChange("middlename", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="surname"
                  placeholder="Enter surname"
                  value={formData.surname}
                  onChange={(e) => handleInputChange("surname", e.target.value)}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="extension">Extension</Label>
                <Input
                  id="extension"
                  placeholder="Jr., Sr., III"
                  value={formData.extension}
                  onChange={(e) => handleInputChange("extension", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="placeOfBirth">Place of Birth</Label>
              <Input
                id="placeOfBirth"
                placeholder="Enter place of birth"
                value={formData.placeOfBirth}
                onChange={(e) => handleInputChange("placeOfBirth", e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="houseBlockLot">House Block Lot No.</Label>
                <Input
                  id="houseBlockLot"
                  placeholder="Enter house block lot"
                  value={formData.houseBlockLot}
                  onChange={(e) => handleInputChange("houseBlockLot", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  placeholder="Enter street"
                  value={formData.street}
                  onChange={(e) => handleInputChange("street", e.target.value)}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zone">Zone</Label>
                <Input
                  id="zone"
                  placeholder="Enter zone"
                  value={formData.zone}
                  onChange={(e) => handleInputChange("zone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="contactNo">Contact No.</Label>
                <Input
                  id="contactNo"
                  type="tel"
                  placeholder="Enter contact number"
                  value={formData.contactNo}
                  onChange={(e) => handleInputChange("contactNo", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="residencyPeriod">Period of Residency</Label>
              <Input
                id="residencyPeriod"
                placeholder="e.g., 5 years"
                value={formData.residencyPeriod}
                onChange={(e) => handleInputChange("residencyPeriod", e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registeredVoter">Registered Voter?</Label>
                <Select value={formData.registeredVoter} onValueChange={(value) => handleInputChange("registeredVoter", value)}>
                  <SelectTrigger id="registeredVoter">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="houseOwner">House Owner</Label>
                <Input
                  id="houseOwner"
                  placeholder="Enter house owner name"
                  value={formData.houseOwner}
                  onChange={(e) => handleInputChange("houseOwner", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="relationshipToOwner">Relationship to Owner</Label>
              <Input
                id="relationshipToOwner"
                placeholder="e.g., Son, Daughter, Tenant"
                value={formData.relationshipToOwner}
                onChange={(e) => handleInputChange("relationshipToOwner", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Select value={formData.purpose} onValueChange={(value) => handleInputChange("purpose", value)}>
                <SelectTrigger id="purpose">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employment">Employment</SelectItem>
                  <SelectItem value="Business Permit">Business Permit</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="School Requirements">School Requirements</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purposeDetails">Purpose Details</Label>
              <Input
                id="purposeDetails"
                placeholder="Enter additional details"
                value={formData.purposeDetails}
                onChange={(e) => handleInputChange("purposeDetails", e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ctcVrrNo">CTC/VRR No.</Label>
                <Input
                  id="ctcVrrNo"
                  placeholder="Enter number"
                  value={formData.ctcVrrNo}
                  onChange={(e) => handleInputChange("ctcVrrNo", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="issuedAt">Issued at</Label>
                <Input
                  id="issuedAt"
                  placeholder="Location"
                  value={formData.issuedAt}
                  onChange={(e) => handleInputChange("issuedAt", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="issuedOn">Issued on</Label>
                <Input
                  id="issuedOn"
                  type="date"
                  value={formData.issuedOn}
                  onChange={(e) => handleInputChange("issuedOn", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="orNo">O.R. No.</Label>
              <Input
                id="orNo"
                placeholder="Enter O.R. number"
                value={formData.orNo}
                onChange={(e) => handleInputChange("orNo", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                placeholder="Enter any remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
              />
            </div>
          </div>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                onClick={handleNewRecord}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">New</span>
              </Button>
              <Button
                onClick={handleFindRecord}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Find</span>
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

            </div>
          </CardContent>
        </Card>
      </div>
      {/* Preview Section */}

      <div className="lg:sticky lg:top-8 lg:self-start">
        <Card className="shadow-lg">
          <CardHeader className="bg-accent/10">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Eye className="h-5 w-5" />
              Clearance Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <BarangayClearancePreview
              formData={formData}
              handleTemplateUpload={handleTemplateUpload}
          
            />
          </CardContent>
        </Card>
      </div>
      {/* <div className="space-y-4">
        <BarangayClearancePreview 
          formData={formData}
          handleTemplateUpload={handleTemplateUpload}
          viewerInstanceRef={viewerInstanceRef}
        />
      </div> */}
    </div>
  );
}
