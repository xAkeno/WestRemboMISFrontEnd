export type DocumentType =
  | "barangay_clearance"
  | "business_clearance"
  | "building_clearance"
  | "barangay_certificate"
  | "resident_certificate";

export type RequestStatus = "pending" | "approved" | "rejected" | "incomplete";

export interface DocumentRequest {
  id: string;
  document_type: DocumentType;
  status: RequestStatus;
  created_at: string;
  scheduled_date?: string;
  purpose: string;
  missing_items?: string[];
  uploaded_files?: string[];
  remarks?: string;
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
  barangay_clearance: "Barangay Clearance",
  business_clearance: "Business Clearance",
  building_clearance: "Building Clearance",
  barangay_certificate: "Barangay Certificate",
  resident_certificate: "Resident Certificate",
};

export const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning/15 text-warning" },
  approved: { label: "Approved", color: "bg-success/15 text-success" },
  rejected: { label: "Rejected", color: "bg-destructive/15 text-destructive" },
  incomplete: { label: "Incomplete", color: "bg-info/15 text-info" },
};
