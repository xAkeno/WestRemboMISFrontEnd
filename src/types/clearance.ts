// Barangay Clearance
export interface BarangayClearance {
  id: string;
  bcert_number: string;
  issued_at: string;
  surname: string;
  first_name: string;
  middle_name: string;
  ext_name?: string;
  house_block_lot_no: string;
  street: string;
  zone: string;
  dob: string;
  pob: string;
  purpose: string;
  created_by: string;
  remark?: string;
}

// Business Clearance
export interface BusinessClearance {
  id: string;
  brgyBusinessNo: string;
  issuedDate: string;
  surname: string;
  created_by: string;
  firstname: string;
  middlename: string;
  businessName: string;
  businessType: string;
  street: string;
  zone: string;
  capital: number;
  orNo: string;
  inspectedBy?: string;
}

// Building Clearance
export interface BuildingClearance {
  id: string;
  recordId: string;
  bcert_number: string;
  issuedDate: string;
  firstname: string;
  middlename: string;
  surname: string;
  establishment: string;
  purpose: string;
  houseBlockLot: string;
  street: string;
  created_by: string;
  zone: string;
  orNo: string;
  remarks?: string;
}

// Certificate
export interface Certificate {
  id: string;
  bcert_number: string;
  issued_date: string;
  surname: string;
  firstname: string;
  middle_name: string;
  extension?: string;
  block_no: string;
  street: string;
  zone: string;
  date_of_birth: string;
  age: number;
  registered_voter: 'Yes' | 'No';
  period_of_residency: string;
  purpose: string;
  status: string;
  created_by: string;
}

export type ClearanceType = 'barangay' | 'business' | 'building' | 'certificate';

export interface ClearanceResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
