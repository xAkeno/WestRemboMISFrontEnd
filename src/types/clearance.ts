// Barangay Clearance
export interface BarangayClearance {
  // id: string;
  id: number;
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
  status?: string;
  email?: string;
  schedule?: Schedule;
}


// Business Clearance
export interface BusinessClearance {
  id: number;
  brgy_business_no: string;
  issued_date: string;
  surname: string;
  created_by: string;
  first_name: string;
  middle_name: string;
  business_name: string;
  business_type: string;
  street: string;
  zone: string;
  capital: number;
  or_no: string;
  inspected_by?: string;
  status?: string;
  house_block_lot_no?: string;
  email?: string;
  schedule?: Schedule;
}

// Building Clearance
export interface BuildingClearance {
  id: number;
  bcert_number: string;
  created_at: string;
  first_name: string;
  middle_name: string;
  surname: string;
  establishment: string;
  purpose: string;
  house_block_lot_no: string;
  street: string;
  created_by: string;
  zone: string;
  or_no: string;
  remarks: string;
  status: string;
  schedule?: Schedule;

}

// Certificate
export interface Certificate {
  id: number;
  bcert_number: string;
  issued_date: string;
  surname: string;
  first_name: string;
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
  schedule?: Schedule;
}

export interface Resident {
  id: number;
  resident_id: string;
  prefix?: string;
  first_name: string;
  middle_name?: string;
  surname: string;
  ext_name?: string;
  nick_name?: string;
  sex: string;
  date_of_birth: string;
  place_of_birth: string;
  marital_status: string;
  name_of_spouse?: string;
  religion?: string;
  blood_type?: string;
  complexion?: string;
  pwd?: string;
  height_cm?: number;
  weight_kg?: number;
  phone_number?: string;
  email_address?: string;
  house_block_lot_no?: string;
  street?: string;
  zone?: string;
  resident_status?: string;
  period_of_residency?: string;
  house_owner?: string;
  relationship_to_owner?: string;
  voter_status?: string;
  precinct_no?: string;
  occupation?: string;
  position?: string;
  emp_status?: string;
  notes?: string;
  photo?: string;
  status?: string;
  requester_id?: number;
  requester_type?: string;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

export type ClearanceType = 'barangay' | 'business' | 'building' | 'certificate' | 'resident';

export interface ClearanceResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Schedule {
  id: number;
  document_type: string;
  document_number: string;
  schedule_date: string;
  schedule_time: string;
  user_id: number;
}
