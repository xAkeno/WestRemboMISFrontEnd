import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface BuildingClearanceFormData {
  recordNo: string;
  clearanceNo: string;
  issuedDate: string;
  prefix: string;
  firstname: string;
  middleName: string;
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
  applicantType: string;
  address: string;
}

export default function BuildingClearanceForm() {
  const [formData, setFormData] = useState<BuildingClearanceFormData>({
    recordNo: "",
    clearanceNo: "",
    issuedDate: new Date().toISOString().split("T")[0],
    prefix: "Mr.",
    firstname: "",
    middleName: "",
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
    applicantType: "Individual",
    address: "",
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
      recordNo: "",
      clearanceNo: "",
      issuedDate: new Date().toISOString().split("T")[0],
      prefix: "Mr.",
      firstname: "",
      middleName: "",
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
      applicantType: "Individual",
      address: "",
    });
    toast.info("New record started");
  };

  const handleFindRecord = () => {
    toast.info("Search functionality - Coming soon");
  };

  const handleRefresh = () => {
    toast.info("Form refreshed");
  };

  const handleSaveRecord = () => {
    toast.success("Record saved successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="grid lg:grid-cols-2 gap-6">
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
                    value={formData.recordNo}
                    onChange={(e) =>
                      handleInputChange("recordNo", e.target.value)
                    }
                    placeholder="(Auto)"
                  />
                </div>
                <div>
                  <Label htmlFor="clearanceNo">Clearance No.</Label>
                  <Input
                    id="clearanceNo"
                    value={formData.clearanceNo}
                    onChange={(e) =>
                      handleInputChange("clearanceNo", e.target.value)
                    }
                    placeholder="Enter clearance no."
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
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) =>
                      handleInputChange("middleName", e.target.value)
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
                  Save
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
