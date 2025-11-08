import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FormData {
  transactionNo: string;
  certificationNo: string;
  issuedDate: Date | undefined;
  prefix: string;
  firstname: string;
  middleName: string;
  surname: string;
  extension: string;
  houseBlockLot: string;
  street: string;
  zone: string;
  age: string;
  dateOfBirth: Date | undefined;
  placeOfBirth: string;
  contactNo: string;
  residencyPeriod: string;
  registeredVoter: string;
  houseOwner: string;
  relationship: string;
  purpose: string;
  punongBarangay: string;
  forPunongBrgy: string;
}

interface CertificationFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export const CertificationForm = ({ formData, setFormData }: CertificationFormProps) => {
  const updateField = (field: keyof FormData, value: string | Date | undefined) => {
    console.log(`Updating field ${field} to value:`, value);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transactionNo">Transaction No.</Label>
          <Input
            id="transactionNo"
            value={formData.transactionNo}
            onChange={(e) => updateField("transactionNo", e.target.value)}
            placeholder="10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="certificationNo">Certification No.</Label>
          <Input
            id="certificationNo"
            value={formData.certificationNo}
            onChange={(e) => updateField("certificationNo", e.target.value)}
            placeholder="BC-2025-01-0010"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="issuedDate">Issued Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.issuedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.issuedDate ? format(formData.issuedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-50">
              <Calendar
                mode="single"
                selected={formData.issuedDate}
                onSelect={(date) => updateField("issuedDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prefix">Prefix</Label>
          <Select value={formData.prefix} onValueChange={(value) => updateField("prefix", value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select prefix" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="MS.">MS.</SelectItem>
              <SelectItem value="MR.">MR.</SelectItem>
              <SelectItem value="MRS.">MRS.</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstname">Firstname</Label>
          <Input
            id="firstname"
            value={formData.firstname}
            onChange={(e) => updateField("firstname", e.target.value)}
            placeholder="SAGRE"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="middleName">Middle Name</Label>
          <Input
            id="middleName"
            value={formData.middleName}
            onChange={(e) => updateField("middleName", e.target.value)}
            placeholder="LOUISE"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="surname">Surname</Label>
          <Input
            id="surname"
            value={formData.surname}
            onChange={(e) => updateField("surname", e.target.value)}
            placeholder="MANZANO"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="extension">Extension</Label>
          <Input
            id="extension"
            value={formData.extension}
            onChange={(e) => updateField("extension", e.target.value)}
            placeholder="(e.g., Jr., Sr.)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="houseBlockLot">House Block Lot No.</Label>
          <Input
            id="houseBlockLot"
            value={formData.houseBlockLot}
            onChange={(e) => updateField("houseBlockLot", e.target.value)}
            placeholder="43-C"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Street</Label>
          <Input
            id="street"
            value={formData.street}
            onChange={(e) => updateField("street", e.target.value)}
            placeholder="A. Mabini Street"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zone">Zone</Label>
          <Input
            id="zone"
            value={formData.zone}
            onChange={(e) => updateField("zone", e.target.value)}
            placeholder="Sitio 5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => updateField("age", e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.dateOfBirth && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-50">
              <Calendar
                mode="single"
                selected={formData.dateOfBirth}
                onSelect={(date) => updateField("dateOfBirth", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="placeOfBirth">Place of Birth</Label>
          <Input
            id="placeOfBirth"
            value={formData.placeOfBirth}
            onChange={(e) => updateField("placeOfBirth", e.target.value)}
            placeholder="City, Province"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNo">Contact No.</Label>
          <Input
            id="contactNo"
            value={formData.contactNo}
            onChange={(e) => updateField("contactNo", e.target.value)}
            placeholder="09XX-XXX-XXXX"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="residencyPeriod">Period of Residency</Label>
          <Input
            id="residencyPeriod"
            value={formData.residencyPeriod}
            onChange={(e) => updateField("residencyPeriod", e.target.value)}
            placeholder="Years/Months"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registeredVoter">Registered Voter?</Label>
          <Select
            value={formData.registeredVoter}
            onValueChange={(value) => updateField("registeredVoter", value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="houseOwner">House Owner</Label>
          <Input
            id="houseOwner"
            value={formData.houseOwner}
            onChange={(e) => updateField("houseOwner", e.target.value)}
            placeholder="Name of house owner"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationship">Relationship to Owner</Label>
          <Input
            id="relationship"
            value={formData.relationship}
            onChange={(e) => updateField("relationship", e.target.value)}
            placeholder="e.g., Son, Daughter"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="purpose">Purpose</Label>
          <Select value={formData.purpose} onValueChange={(value) => updateField("purpose", value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="LOCAL EMPLOYMENT">LOCAL EMPLOYMENT</SelectItem>
              <SelectItem value="BUSINESS PERMIT">BUSINESS PERMIT</SelectItem>
              <SelectItem value="SCHOOL REQUIREMENTS">SCHOOL REQUIREMENTS</SelectItem>
              <SelectItem value="GOVERNMENT TRANSACTION">GOVERNMENT TRANSACTION</SelectItem>
              <SelectItem value="OTHERS">OTHERS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="punongBarangay">Punong Barangay</Label>
          <Input
            id="punongBarangay"
            value={formData.punongBarangay}
            onChange={(e) => updateField("punongBarangay", e.target.value)}
            placeholder="Hon. LEO E. BES"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="forPunongBrgy">For the Punong Brgy.</Label>
          <Input
            id="forPunongBrgy"
            value={formData.forPunongBrgy}
            onChange={(e) => updateField("forPunongBrgy", e.target.value)}
            placeholder="Representative name"
          />
        </div>
      </div>
    </div>
  );
};
