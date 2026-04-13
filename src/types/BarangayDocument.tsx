export type DocumentType = 'clearance' | 'building-clearance' | 'business-clearance' | 'resident';

export interface BarangayDocument {
  document_type?: DocumentType;
  first_name: string;
  middle_name: string;
  surname: string;
  authorized_person: string;
  address: string;
  date_of_birth: string;
  place_of_birth: string;
  period_of_residency: string;
  registered_voter: 'Yes' | 'No';
  house_owner: string;
  relation_to_house_owner: string;
  contact: string;
  purpose: string;
  priority?: 'Low' | 'Normal' | 'High';
}
