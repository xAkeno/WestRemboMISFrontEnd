import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { BarangayClearancePreview } from './BarangayClearancePreview';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {BarangayClearanceFindModal} from "./BarangayClearanceFindModal";
import api from "@/lib/api";
import {
  Save,
  Search,
  RefreshCw,
  Eye,
  FileDown,
  PlusCircle,
  X,
} from "lucide-react";
import axios from "axios";


interface FormData {
  id:number;
  bcert_number: string;
  issued_date: string;
  prefix: string;
  first_name: string;
  middle_name: string;
  surname: string;
  ext_name: string;
  house_block_lot_no: string;
  street: string;
  zone: string;
  dob: string;
  pob: string;
  contact_no: string;
  period_of_residency: string;
  registered_voter: string;
  house_owner: string;
  relationship_to_owner: string;
  purpose: string;
  purpose_details: string;
  ctc_vrr_no: string;
  issued_at: string;
  issued_on: string;
  or_no: string;
  remarks: string;
}

interface gg{
  nextId:number;
  nextRecord:string;
}

export default function BarangayForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [modal,setModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    id: 0,
    bcert_number: "",
    issued_date: new Date().toISOString().split('T')[0],
    prefix: "",
    first_name: "",
    middle_name: "",
    surname: "",
    ext_name: "",
    house_block_lot_no: "",
    street: "",
    zone: "",
    dob: "",
    pob: "",
    contact_no: "",
    period_of_residency: "",
    registered_voter: "",
    house_owner: "",
    relationship_to_owner: "",
    purpose: "",
    purpose_details: "",
    ctc_vrr_no: "",
    issued_at: "",
    issued_on: "",
    or_no: "",
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

  const fullName = `${formData.prefix ? formData.prefix + ' ' : ''}${formData.first_name} ${formData.middle_name} ${formData.surname} ${formData.ext_name}`.trim();

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

  const [latestId,setLatestId] = useState<gg>({
    nextId:0,
    nextRecord: ""
  });

  useEffect(() => {
    const get = async () => {
      try{
        const res = await axios.get('http://127.0.0.1:8000/api/latestRecordBrgyClearance',{withCredentials:true})
        var json = res.data.data
        setLatestId(json);
      }catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to save barangay clearance record";
        toast.error(errorMessage);
        console.error(error);
      } 
    }
    get();
  },[])

  const [recordStatus,setRecordStatus] = useState("Save")

  const handleSaveRecord = async () => {
    setIsSaving(true);

    try {
      console.log("Submitting barangay clearance data:", formData);

      let response;

      if (recordStatus === "Save") {
        response = await api.post(
          "/api/barangay-clearances",
          formData,
          { withCredentials: true }
        );

        if (response.status === 201) {
          toast.success("Barangay clearance record saved successfully");
        }

      } else if (recordStatus === "Update") {

        if (!formData.id || formData.id === 0) {
          toast.error("No record selected to update");
          return;
        }

        response = await api.put(
          `/api/barangay-clearances/${formData.id}`,
          formData,
          { withCredentials: true }
        );

        if (response.status === 200) {
          toast.success("Barangay clearance record updated successfully");
        }
      }

    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to save barangay clearance record";
      toast.error(errorMessage);
      console.error(error);

    } finally {
      setIsSaving(false);
    }
  };


  const handleFindRecord = () => {
    setModal(true);
    toast.info("Search functionality - Coming soon");
  };

  const handleRefresh = () => {
    toast.info("Data refreshed");
  };


  const handleNewRecord = () => {
    setFormData(
      {
        id:0,
        bcert_number: "",
        issued_date: new Date().toISOString().split('T')[0],
        prefix: "",
        first_name: "",
        middle_name: "",
        surname: "",
        ext_name: "",
        house_block_lot_no: "",
        street: "",
        zone: "",
        dob: "",
        pob: "",
        contact_no: "",
        period_of_residency: "",
        registered_voter: "",
        house_owner: "",
        relationship_to_owner: "",
        purpose: "",
        purpose_details: "",
        ctc_vrr_no: "",
        issued_at: "",
        issued_on: "",
        or_no: "",
        remarks: "",
      }
    )
    setRecordStatus("Save")
  };
  const updateModal = (open: boolean) => {
    setModal(open);
  }
  const updateSelect = (open: any) => {
    toast.info("Record successfully selected");
    setModal(false);
    setFormData(open);
    setRecordStatus("Update")
  }
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {
        modal ? <BarangayClearanceFindModal updateModal={updateModal} updateSelect={updateSelect}/> : <></>
      }
      {/* Form Section */}
      <div>
        <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Personal Information</h2>
        </div>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col justify-between">
              <Label htmlFor="bcert_number">Record No.</Label>
                <Input
                  id="bcert_number"
                  placeholder="Enter record number"
                  value={latestId.nextRecord}
                  onChange={(e) => handleInputChange("bcert_number", e.target.value)}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="clearanceNo">Clearance No.</Label>
                <Input
                  id="id"
                  placeholder="Enter clearance number"
                  value={latestId.nextId}
                  onChange={(e) => handleInputChange("id", e.target.value)}
                  disabled
                />
              </div>
            </div>

            <div>
              <Label htmlFor="issuedDate">Issued Date</Label>
              <Input
                id="issuedDate"
                type="date"
                value={formData.issued_date}
                onChange={(e) => handleInputChange("issued_date", e.target.value)}
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
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="middlename">Middle Name</Label>
                <Input
                  id="middlename"
                  placeholder="Enter middle name"
                  value={formData.middle_name}
                  onChange={(e) => handleInputChange("middle_name", e.target.value)}
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
                  value={formData.ext_name}
                  onChange={(e) => handleInputChange("ext_name", e.target.value)}
                />
              </div>
              {/* <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                />
              </div> */}
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="placeOfBirth">Place of Birth</Label>
              <Input
                id="placeOfBirth"
                placeholder="Enter place of birth"
                value={formData.pob}
                onChange={(e) => handleInputChange("pob", e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="houseBlockLot">House Block Lot No.</Label>
                <Input
                  id="houseBlockLot"
                  placeholder="Enter house block lot"
                  value={formData.house_block_lot_no}
                  onChange={(e) => handleInputChange("house_block_lot_no", e.target.value)}
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
                  value={formData.contact_no}
                  onChange={(e) => handleInputChange("contact_no", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="residencyPeriod">Period of Residency</Label>
              <Input
                id="residencyPeriod"
                placeholder="e.g., 5 years"
                value={formData.period_of_residency}
                onChange={(e) => handleInputChange("period_of_residency", e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registeredVoter">Registered Voter?</Label>
                <Select value={formData.registered_voter} onValueChange={(value) => handleInputChange("registered_voter", value)}>
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
                  value={formData.house_owner}
                  onChange={(e) => handleInputChange("house_owner", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="relationshipToOwner">Relationship to Owner</Label>
              <Input
                id="relationshipToOwner"
                placeholder="e.g., Son, Daughter, Tenant"
                value={formData.relationship_to_owner}
                onChange={(e) => handleInputChange("relationship_to_owner", e.target.value)}
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
                value={formData.purpose_details}
                onChange={(e) => handleInputChange("purpose_details", e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ctcVrrNo">CTC/VRR No.</Label>
                <Input
                  id="ctcVrrNo"
                  placeholder="Enter number"
                  value={formData.ctc_vrr_no}
                  onChange={(e) => handleInputChange("ctc_vrr_no", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="issuedAt">Issued at</Label>
                <Input
                  id="issuedAt"
                  placeholder="Location"
                  value={formData.issued_at}
                  onChange={(e) => handleInputChange("issued_at", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="issuedOn">Issued on</Label>
                <Input
                  id="issuedOn"
                  type="date"
                  value={formData.issued_on}
                  onChange={(e) => handleInputChange("issued_on", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="orNo">O.R. No.</Label>
              <Input
                id="orNo"
                placeholder="Enter O.R. number"
                value={formData.or_no}
                onChange={(e) => handleInputChange("or_no", e.target.value)}
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
              <Button onClick={handleSaveRecord} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {recordStatus} Record
                  </>
                )}
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
