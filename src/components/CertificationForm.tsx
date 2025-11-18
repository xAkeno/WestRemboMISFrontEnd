import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface FormData {
  bcert_number: string;
  issued_date: Date | undefined;
  prefix: string;
  firstname: string;
  middle_name: string;
  surname: string;
  extension: string;
  house_block_lot: string;
  street: string;
  zone: string;
  age: string;
  date_of_birth: Date | undefined;
  place_of_birth: string;
  contact_no: string;
  residency_period: string;
  registered_voter: string;
  house_owner: string;
  relationship: string;
  purpose: string;
  punong_barangay: string;
  for_punong_brgy: string;
}

interface gg{
  nextId:number;
  nextRecord:string;
}

interface CertificationFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}


export const CertificationForm = ({ formData, setFormData }: CertificationFormProps) => {
  const updateField = (field: keyof FormData, value: string | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [latestId,setLatestId] = useState<gg>({
    nextId:0,
    nextRecord: ""
  });

  useEffect(() => {
    const get = async () => {
      try{
        const res = await axios.get('http://127.0.0.1:8000/api/latestRecordBrgyCertificates',{withCredentials:true})
        var json = res.data.data
        setLatestId(json);
         console.log(json);
      }catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to save barangay clearance record";
        toast.error(errorMessage);
        console.error(error);
      } 
    }
    get();
  },[])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
          <Label htmlFor="id">Record No.</Label>
          <Input
            id="id"
            value={latestId ? latestId.nextId : ""}
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="surname">Cert No.</Label>
          <Input
            id="surname"
            value={latestId ? latestId.nextRecord : ""}
            disabled
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="issued_date">Issued Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.issued_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.issued_date ? format(formData.issued_date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-50">
              <Calendar
                mode="single"
                selected={formData.issued_date}
                onSelect={(date) => updateField("issued_date", date)}
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
          <Label htmlFor="middle_name">Middle Name</Label>
          <Input
            id="middle_name"
            value={formData.middle_name}
            onChange={(e) => updateField("middle_name", e.target.value)}
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
          <Label htmlFor="house_block_lot">House Block Lot No.</Label>
          <Input
            id="house_block_lot"
            value={formData.house_block_lot}
            onChange={(e) => updateField("house_block_lot", e.target.value)}
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
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.date_of_birth && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date_of_birth ? format(formData.date_of_birth, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-50">
              <Calendar
                mode="single"
                selected={formData.date_of_birth}
                onSelect={(date) => updateField("date_of_birth", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="place_of_birth">Place of Birth</Label>
          <Input
            id="place_of_birth"
            value={formData.place_of_birth}
            onChange={(e) => updateField("place_of_birth", e.target.value)}
            placeholder="City, Province"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_no">Contact No.</Label>
          <Input
            id="contact_no"
            value={formData.contact_no}
            onChange={(e) => updateField("contact_no", e.target.value)}
            placeholder="09XX-XXX-XXXX"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="residency_period">Period of Residency</Label>
          <Input
            id="residency_period"
            value={formData.residency_period}
            onChange={(e) => updateField("residency_period", e.target.value)}
            placeholder="Years/Months"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registered_voter">Registered Voter?</Label>
          <Select
            value={formData.registered_voter}
            onValueChange={(value) => updateField("registered_voter", value)}
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
          <Label htmlFor="house_owner">House Owner</Label>
          <Input
            id="house_owner"
            value={formData.house_owner}
            onChange={(e) => updateField("house_owner", e.target.value)}
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
          <Label htmlFor="punong_barangay">Punong Barangay</Label>
          <Input
            id="punong_barangay"
            value={formData.punong_barangay}
            onChange={(e) => updateField("punong_barangay", e.target.value)}
            placeholder="Hon. LEO E. BES"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="for_punong_brgy">For the Punong Brgy.</Label>
          <Input
            id="for_punong_brgy"
            value={formData.for_punong_brgy}
            onChange={(e) => updateField("for_punong_brgy", e.target.value)}
            placeholder="Representative name"
          />
        </div>
      </div>
    </div>
  );
};
