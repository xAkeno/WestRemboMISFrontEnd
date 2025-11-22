import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DocumentType, BarangayDocument } from "@/types/BarangayDocument";

interface UnifiedFormProps {
  data: Partial<BarangayDocument>;
  onChange: (data: Partial<BarangayDocument>) => void;
}

export const UnifiedForm = ({ data, onChange }: UnifiedFormProps) => {
  const handleChange = (field: keyof BarangayDocument, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={data.first_name || ''}
            onChange={(e) => handleChange('first_name', e.target.value)}
            placeholder="Enter first name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="middle_name">Middle Name</Label>
          <Input
            id="middle_name"
            value={data.middle_name || ''}
            onChange={(e) => handleChange('middle_name', e.target.value)}
            placeholder="Enter middle name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={data.last_name || ''}
            onChange={(e) => handleChange('last_name', e.target.value)}
            placeholder="Enter last name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="authorized_person">Authorized Person</Label>
          <Input
            id="authorized_person"
            value={data.authorized_person || ''}
            onChange={(e) => handleChange('authorized_person', e.target.value)}
            placeholder="Enter authorized person"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            value={data.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter complete address"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth *</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={data.date_of_birth || ''}
            onChange={(e) => handleChange('date_of_birth', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="place_of_birth">Place of Birth *</Label>
          <Input
            id="place_of_birth"
            value={data.place_of_birth || ''}
            onChange={(e) => handleChange('place_of_birth', e.target.value)}
            placeholder="Enter place of birth"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="period_of_residency">Period of Residency in West Rembo *</Label>
          <Input
            id="period_of_residency"
            value={data.period_of_residency || ''}
            onChange={(e) => handleChange('period_of_residency', e.target.value)}
            placeholder="e.g., 5 years"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Registered Voter *</Label>
          <RadioGroup
            value={data.registered_voter || ''}
            onValueChange={(value) => handleChange('registered_voter', value as 'Yes' | 'No')}
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Yes" id="voter-yes" />
                <Label htmlFor="voter-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="No" id="voter-no" />
                <Label htmlFor="voter-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="house_owner">House Owner *</Label>
          <Input
            id="house_owner"
            value={data.house_owner || ''}
            onChange={(e) => handleChange('house_owner', e.target.value)}
            placeholder="Enter house owner name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="relation_to_house_owner">Relation to House Owner *</Label>
          <Input
            id="relation_to_house_owner"
            value={data.relation_to_house_owner || ''}
            onChange={(e) => handleChange('relation_to_house_owner', e.target.value)}
            placeholder="e.g., Son, Daughter, Tenant"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact">Contact Number *</Label>
          <Input
            id="contact"
            value={data.contact || ''}
            onChange={(e) => handleChange('contact', e.target.value)}
            placeholder="Enter contact number"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="purpose">Purpose *</Label>
          <Textarea
            id="purpose"
            value={data.purpose || ''}
            onChange={(e) => handleChange('purpose', e.target.value)}
            placeholder="Enter purpose of document request"
            rows={4}
            required
          />
        </div>
      </div>
    </div>
  );
};