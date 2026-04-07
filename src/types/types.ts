export type DocumentType =
  | "barangay_clearance"
  | "business_clearance"
  | "building_clearance"
  | "barangay_certificate"
  | "resident_registration";  

export type RequestStatus = "pending" | "released" | "rejected" | "incomplete" | "processing";

export interface DocumentRequest {
  id: number;
  bcert_number?: string;
  first_name?: string;
  last_name?: string;
  surname?: string;
  ext_name?: string;
  middle_name?: string;
  house_block_lot_no?: string;
  street?: string;
  zone?: string;
  establishment?: string;
  capital?: number;
  business_name?: string;
  business_type?: string;
  business_details?: string;
  inspected_by?: string;
  inspected_notes?: string;
  inspected_remarks?: string;
  inspection_remarks?: string;
  date_of_inspection?: string;
  date_inspected?: string;
  contact_no?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  prefix?: string;
  period_of_residency?: string;
  registered_voter?: boolean;
  relationship_to_owner?: string;
  house_owner?: string;
  ctc_vrr_no?: string;
  dob?: string;
  pob?: string;
  or_no?: string;
  age?: number;
  issued_at?: string;
  issued_on?: string;
  updated_by?: number;
  inspection_notes?: string;
  document_type: DocumentType;
  status: RequestStatus;
  created_at: string;
  scheduled_date?: string;
  purpose: string;
  missing_items?: string[];
  uploaded_files?: string[];
  remarks?: string;
  purpose_details?: string; 
  requester_name?: string;
  address?: string;
  updated_at: string;
  raw?: Record<string, any>;
}

export interface Notification {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
  request_id?: string;
}

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  barangay_clearance:   "Barangay Clearance",
  business_clearance:   "Business Clearance",
  building_clearance:   "Building Clearance",
  barangay_certificate: "Barangay Certificate",
  resident_registration: "Resident Registration",  // ← was resident_certificate
};

export const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string }> = {
  pending:    { label: "Pending",    color: "bg-warning/15 text-warning" },
  released:   { label: "Released",  color: "bg-success/15 text-success" },
  rejected:   { label: "Rejected",  color: "bg-destructive/15 text-destructive" },
  incomplete: { label: "Incomplete", color: "bg-info/15 text-info" },
  processing: { label: "Processing", color: "bg-blue-500/15 text-blue-600" },  // ← was missing
};
