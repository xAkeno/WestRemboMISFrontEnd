import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  FileText,
  Save,
  Search,
  RefreshCw,
  Eye,
  FileDown,
  PlusCircle,
  X,
} from "lucide-react";

export interface ClearanceData {
  recordNo: string;
  brgyBusinessNo: string;
  issuedDate: string;
  prefix: string;
  firstname: string;
  middleName: string;
  surname: string;
  ext: string;
  businessName: string;
  businessType: string;
  businessDetails: string;
  capital: string;
  orNo: string;
  remarks: string;
  houseBlockLotNo: string;
  street: string;
  zone: string;
  inspectedBy: string;
  dateOfInspection: string;
  inspectionRemarks: string;
  inspectedRemarks: string;
  dateInspected: string;
  inspectedNote: string;
}

interface ClearanceFormProps {
  data: ClearanceData;
  onChange: (data: ClearanceData) => void;
}

export const BussinessClearanceCard = ({ data, onChange }: ClearanceFormProps) => {
  
  const updateField = (field: keyof ClearanceData, value: string) => {
    const newData = { ...data, [field]: value };
    console.log(newData);
    onChange(newData);
  };

  const handleFindRecord = () => {
    toast.info("Search functionality - Coming soon");
  };

  const handleRefresh = () => {
    toast.info("Data refreshed");
  };
  const handleNewRecord = () => {
    const newRecord: ClearanceData = {
      recordNo: "",
      brgyBusinessNo: "",
      issuedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      prefix: "",
      firstname: "",
      middleName: "",
      surname: "",
      ext: "",
      businessName: "",
      businessType: "",
      businessDetails: "",
      capital: "",
      orNo: "",
      remarks: "",
      houseBlockLotNo: "",
      street: "",
      zone: "",
      inspectedBy: "",
      dateOfInspection: "",
      inspectionRemarks: "",
      inspectedRemarks: "",
      dateInspected: "",
      inspectedNote: "",
    };
    onChange(newRecord);
  toast.success("New record initialized");
};

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6 space-y-6 bg-card border-border">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Business Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recordNo">Record No.</Label>
              <Input
                id="recordNo"
                value={data.recordNo}
                onChange={(e) => updateField("recordNo", e.target.value)}
                placeholder="New"
              />
            </div>
            <div>
              <Label htmlFor="brgyBusinessNo">Brgy Business No.</Label>
              <Input
                id="brgyBusinessNo"
                value={data.brgyBusinessNo}
                onChange={(e) => updateField("brgyBusinessNo", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issuedDate">Issued Date</Label>
              <Input
                id="issuedDate"
                type="date"
                value={data.issuedDate}
                onChange={(e) => updateField("issuedDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="prefix">Prefix</Label>
              <Select value={data.prefix} onValueChange={(value) => updateField("prefix", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select prefix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr.">Mr.</SelectItem>
                  <SelectItem value="Ms.">Ms.</SelectItem>
                  <SelectItem value="Mrs.">Mrs.</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="firstname">First Name</Label>
              <Input
                id="firstname"
                value={data.firstname}
                onChange={(e) => updateField("firstname", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={data.middleName}
                onChange={(e) => updateField("middleName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="surname">Surname</Label>
              <Input
                id="surname"
                value={data.surname}
                onChange={(e) => updateField("surname", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ext">Ext.</Label>
              <Input
                id="ext"
                value={data.ext}
                onChange={(e) => updateField("ext", e.target.value)}
                placeholder="Jr., Sr., etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={data.businessName}
              onChange={(e) => updateField("businessName", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Select value={data.businessType} onValueChange={(value) => updateField("businessType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="capital">Capital</Label>
              <Input
                id="capital"
                value={data.capital}
                onChange={(e) => updateField("capital", e.target.value)}
                placeholder="₱"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="businessDetails">Business Details</Label>
            <Textarea
              id="businessDetails"
              value={data.businessDetails}
              onChange={(e) => updateField("businessDetails", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orNo">O.R. No.</Label>
              <Input
                id="orNo"
                value={data.orNo}
                onChange={(e) => updateField("orNo", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={data.remarks}
                onChange={(e) => updateField("remarks", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="text-xl font-semibold text-primary">Address Information</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="houseBlockLotNo">House Block Lot No.</Label>
              <Input
                id="houseBlockLotNo"
                value={data.houseBlockLotNo}
                onChange={(e) => updateField("houseBlockLotNo", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                value={data.street}
                onChange={(e) => updateField("street", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="zone">Zone</Label>
              <Input
                id="zone"
                value={data.zone}
                onChange={(e) => updateField("zone", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="text-xl font-semibold text-primary">Inspection Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inspectedBy">Inspected By</Label>
              <Input
                id="inspectedBy"
                value={data.inspectedBy}
                onChange={(e) => updateField("inspectedBy", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateOfInspection">Date of Inspection</Label>
              <Input
                id="dateOfInspection"
                type="date"
                value={data.dateOfInspection}
                onChange={(e) => updateField("dateOfInspection", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="inspectionRemarks">Inspection Remarks</Label>
            <Textarea
              id="inspectionRemarks"
              value={data.inspectionRemarks}
              onChange={(e) => updateField("inspectionRemarks", e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="inspectedRemarks">Inspected Remarks</Label>
            <Textarea
              id="inspectedRemarks"
              value={data.inspectedRemarks}
              onChange={(e) => updateField("inspectedRemarks", e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="dateInspected">Date Inspected</Label>
            <Input
              id="dateInspected"
              type="date"
              value={data.dateInspected}
              onChange={(e) => updateField("dateInspected", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="inspectedNote">Inspected Note</Label>
            <Textarea
              id="inspectedNote"
              value={data.inspectedNote}
              onChange={(e) => updateField("inspectedNote", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </Card>
      {/* Action Buttons */}
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
  );
};


