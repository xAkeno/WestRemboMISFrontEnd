// Barangay Clearance
export interface BarangayClearance {
  id: string;
  bcertNumber: string;
  issueDate: string;
  surname: string;
  firstName: string;
  middleName: string;
  ext?: string;
  blockNo: string;
  street: string;
  zone: string;
  dateOfBirth: string;
  placeOfBirth: string;
  purpose: string;
  remark?: string;
}

// Business Clearance
export interface BusinessClearance {
  id: string;
  brgyBusinessNo: string;
  issuedDate: string;
  surname: string;
  firstName: string;
  middleName: string;
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
  bcertNumber: string;
  issuedDate: string;
  firstName: string;
  middleName: string;
  surname: string;
  establishment: string;
  purpose: string;
  blockLotNo: string;
  street: string;
  zone: string;
  orNo: string;
  remarks?: string;
}

// Certificate
export interface Certificate {
  id: string;
  bcertNumber: string;
  issueDate: string;
  surname: string;
  firstName: string;
  middleName: string;
  ext?: string;
  blockNo: string;
  street: string;
  zone: string;
  dateOfBirth: string;
  age: number;
  registeredVoter: 'Yes' | 'No';
  periodOfResidency: string;
  purpose: string;
}

export type ClearanceType = 'barangay' | 'business' | 'building' | 'certificate';

export interface ClearanceResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
