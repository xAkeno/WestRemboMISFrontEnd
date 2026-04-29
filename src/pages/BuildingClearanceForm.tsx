import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Save,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Printer,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { BuildingClearancePreview } from "@/components/BuildingClearancePreview";
import { Layout } from "@/components/Layout";
import { set } from "date-fns";
import { BarangayBusinessFindModal } from "@/components/BarangayBusinessFindModal";
import { BarangayBuildingFindModal } from "@/components/BarangayBuildingFindModal";
import { useLocation } from "react-router-dom";

interface BuildingClearanceFormData {
  id: number,
  bcert_number: string;
  issuedDate: string;
  prefix: string;
  firstname: string;
  middlename: string;
  surname: string;
  extension: string;
  establishment: string;
  purpose: string;
  purposeDetails: string;
  houseBlockLot: string;
  street: string;
  zone: string;
  orNo: string;
  remarks: string;
  punongBarangay: string;
  forThePunongBarangay: string;
  barangayPosition: string
}

interface gg{
  nextId:number,
  nextRecord:string
}

export default function BuildingClearanceForm() {
  const [isSaving,setIsSaving] = useState(false)
  
  const location = useLocation();
  const ticket = location.state?.ticket;
  const [formData, setFormData] = useState<BuildingClearanceFormData>({
    id: 0,
    bcert_number: "",
    issuedDate: new Date().toISOString().split("T")[0],
    prefix: "Mr.",
    firstname: "",
    middlename: "",
    surname: "",
    extension: "",
    establishment: "",
    purpose: "",
    purposeDetails: "",
    houseBlockLot: "",
    street: "",
    zone: "",
    orNo: "",
    remarks: "",
    punongBarangay: "",
    forThePunongBarangay: "",
    barangayPosition:"",
  });

  const viewerInstanceRef = useRef<any>(null);

  const handleInputChange = (
    field: keyof BuildingClearanceFormData,
    value: string
  ) => {

    setFormData((prev) => {
    const newData = { ...prev, [field]: value };
    
    // Print updated field and full form data
    console.log(`Updated ${field}:`, value);
    console.log("Full form data:", newData);

    return newData;
  });
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && viewerInstanceRef.current) {
      viewerInstanceRef.current.loadDocument(file);
    }
  };

  const handleNewRecord = () => {
    setFormData({
      id: 0,
      bcert_number: "",
      issuedDate: new Date().toISOString().split("T")[0],
      prefix: "Mr.",
      firstname: "",
      middlename: "",
      surname: "",
      extension: "",
      establishment: "",
      purpose: "",
      purposeDetails: "",
      houseBlockLot: "",
      street: "",
      zone: "",
      orNo: "",
      remarks: "",
      punongBarangay: "",
      forThePunongBarangay: "",
      barangayPosition:"",
    });
    toast.info("New record started");
  };
  const [modal,setModal] = useState(false);
  const updateModal = (open: boolean) => {
    setModal(open);
  }
  const updateSelect = (open: any) => {
    toast.info("Record successfully selected");
    setModal(false);
    setFormData(open);
    setRecordStatus("Update");
  }
  const handleFindRecord = () => {
    setModal(true);
    toast.info("Search functionality - Coming soon");
  };

  const handleRefresh = () => {
    toast.info("Form refreshed");
    setRecordStatus("Save")
  };
  const [recordStatus, setRecordStatus] = useState("Save");

  const handleSaveRecord = async () => {
    setIsSaving(true);

    try {
      let response;
      let savedRecordId = null;

      if (recordStatus === "Save") {
        response = await axios.post(
          "https://westrembomis.onrender.com/api/building-clearances",
          formData,
          { withCredentials: true }
        );

        if (response.status === 201 || response.status === 200) {
          toast.success("Successfully created building clearance record");
          savedRecordId = response.data.data.service.id;
        }

      } else if (recordStatus === "Update") {

        if (!formData.id || formData.id === 0) {
          toast.error("No record selected for update");
          return;
        }

        console.log(formData.id + "========================")

        response = await axios.put(
          `https://westrembomis.onrender.com/api/building-clearances/${formData.id}`,
          formData,
          { withCredentials: true }
        );

        if (response.status === 200) {
          toast.success("Successfully updated building clearance record");
          savedRecordId = formData.id;
        }
      }

      // Update Ticket Based on the Service Saved
      if (savedRecordId) {
        await axios.post(
          `https://westrembomis.onrender.com/api/tickets/update-by-service/${ticket.ticket_number}`,
          {
            status: "ENCODED"
          },
          { withCredentials: true }
        );

        console.log("Ticket status updated for service:", savedRecordId);
      }

    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "Failed to save building clearance record";
      toast.error(errMsg);
      console.error(error);

    } finally {
      setIsSaving(false);
    }
  };


  const handlePrint = () => {
    window.print();
  };

  const [latestId,setLatestId] = useState<gg>();

  useEffect(() => {
    const get = async () => {
      try{
        const res = await axios.get('https://westrembomis.onrender.com/api/latestRecordBrgyBuilding',{withCredentials:true})
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

  const parseAddress = (fullAddress: string) => {
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
    if (ticket?.serviceable) {
      const data = ticket.serviceable;
      const { house_block_lot_no, street, zone } = parseAddress(data.address || "");

      setFormData({
        id: data.id || 0,
        bcert_number: data.brgyBusinessNo || "",
        issuedDate: data.issuedDate || new Date().toISOString().split("T")[0],
        prefix: data.prefix || "Mr.",
        firstname: data.first_name || "",
        middlename: data.middle_name || "",
        surname: data.last_name || "",
        extension: data.ext || "",
        establishment: data.establishment || "",
        purpose: data.purpose || "",
        purposeDetails: data.purpose_details || "",
        houseBlockLot: house_block_lot_no,
        street: street,
        zone: zone,
        orNo: data.or_no || "",
        remarks: data.remarks || "",
        punongBarangay: data.punongBarangay || "",
        forThePunongBarangay: data.forThePunongBarangay || "",
        barangayPosition: data.barangayPosition || "",
      }); 
    };
  }, [ticket]);

  return (
    <Layout>
      <div className="grid lg:grid-cols-2 gap-6">
        {
          modal ? <BarangayBuildingFindModal updateModal={updateModal} updateSelect={updateSelect}/> : <></>
        }
        {/* Left Side — Form */}
        <div>
          <Card className="p-6 space-y-6 shadow-lg">
            <div className="flex items-center gap-3 pb-4 border-b">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">
                Building Clearance Form
              </h2>
            </div>

            <div className="space-y-4">
              {/* Record Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recordNo">Record No.</Label>
                  <Input
                    id="recordNo"
                    value={latestId ? latestId.nextRecord : ""}
                    onChange={(e) =>
                      handleInputChange("bcert_number", e.target.value)
                    }
                    placeholder="(Auto)"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="clearanceNo">Clearance No.</Label>
                  <Input
                    id="clearanceNo"
                    value={latestId ? latestId.nextId : ""}

                    placeholder="Enter clearance no."
                    disabled
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="issuedDate">Issued Date</Label>
                <Input
                  id="issuedDate"
                  type="date"
                  value={formData.issuedDate}
                  onChange={(e) =>
                    handleInputChange("issuedDate", e.target.value)
                  }
                />
              </div>

              {/* Applicant Info */}
              <div className="grid sm:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="prefix">Prefix</Label>
                  <Select
                    value={formData.prefix}
                    onValueChange={(v) => handleInputChange("prefix", v)}
                  >
                    <SelectTrigger id="prefix">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Engr.">Engr.</SelectItem>
                      <SelectItem value="Atty.">Atty.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label htmlFor="firstname">Firstname</Label>
                  <Input
                    id="firstname"
                    value={formData.firstname}
                    onChange={(e) =>
                      handleInputChange("firstname", e.target.value)
                    }
                    placeholder="Enter firstname"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="middlename">Middle Name</Label>
                  <Input
                    id="middlename"
                    value={formData.middlename}
                    onChange={(e) =>
                      handleInputChange("middlename", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="surname">Surname</Label>
                  <Input
                    id="surname"
                    value={formData.surname}
                    onChange={(e) =>
                      handleInputChange("surname", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="extension">Extension</Label>
                  <Input
                    id="extension"
                    value={formData.extension}
                    onChange={(e) =>
                      handleInputChange("extension", e.target.value)
                    }
                    placeholder="Jr., Sr., III"
                  />
                </div>
              </div>

              {/* Establishment */}
              <div>
                <Label htmlFor="establishment">Establishment</Label>
                <Input
                  id="establishment"
                  value={formData.establishment}
                  onChange={(e) =>
                    handleInputChange("establishment", e.target.value)
                  }
                  placeholder="Enter establishment name"
                />
              </div>

              {/* Purpose */}
              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(v) => handleInputChange("purpose", v)}
                >
                  <SelectTrigger id="purpose">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Business Permit">Business Permit</SelectItem>
                    <SelectItem value="Construction">Construction</SelectItem>
                    <SelectItem value="Renovation">Renovation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="purposeDetails">Purpose Details</Label>
                <Input
                  id="purposeDetails"
                  value={formData.purposeDetails}
                  onChange={(e) =>
                    handleInputChange("purposeDetails", e.target.value)
                  }
                  placeholder="Enter details"
                />
              </div>

              {/* Location */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="houseBlockLot">House/Block/Lot</Label>
                  <Input
                    id="houseBlockLot"
                    value={formData.houseBlockLot}
                    onChange={(e) =>
                      handleInputChange("houseBlockLot", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) =>
                      handleInputChange("street", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="zone">Zone</Label>
                  <Input
                    id="zone"
                    value={formData.zone}
                    onChange={(e) =>
                      handleInputChange("zone", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Others */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orNo">O.R. No.</Label>
                  <Input
                    id="orNo"
                    value={formData.orNo}
                    onChange={(e) => handleInputChange("orNo", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="remarks">Remarks</Label>
                  <Input
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) =>
                      handleInputChange("remarks", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="punongBarangay">Punong Barangay</Label>
                  <Select
                    value={formData.punongBarangay}
                    onValueChange={(v) => handleInputChange("punongBarangay", v)}
                  >
                    <SelectTrigger id="punongBarangay">
                      <SelectValue placeholder="Select punongBarangay" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">BES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="forThePunongBarangay">For The Punong Barangay</Label>
                  <Select
                    value={formData.forThePunongBarangay}
                    onValueChange={(v) => handleInputChange("forThePunongBarangay", v)}
                  >
                    <SelectTrigger id="forThePunongBarangay">
                      <SelectValue placeholder="Select forThePunongBarangay" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="barangayPosition">Barangay Position</Label>
                  <Input
                    id="barangayPosition"
                    value={formData.barangayPosition}
                    onChange={(e) =>
                      handleInputChange("barangayPosition", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card className="shadow-md mt-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button onClick={handleNewRecord} variant="outline" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  New
                </Button>
                <Button onClick={handleFindRecord} variant="outline" className="gap-2">
                  <Search className="h-4 w-4" />
                  Find
                </Button>
                <Button onClick={handleRefresh} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button onClick={handleSaveRecord} className="gap-2">
                  <Save className="h-4 w-4" />
                  {recordStatus} Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side — Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="shadow-lg">
            <CardHeader className="bg-accent/10">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Eye className="h-5 w-5" />
                Clearance Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <BuildingClearancePreview
                formData={formData}
                handleTemplateUpload={handleTemplateUpload}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <footer className="bg-card border-t mt-16 print:hidden">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            <p>© 2025 Barangay West Rembo. All rights reserved.</p>
          </div>
        </footer>
    </Layout>
  );
}
