export interface Ticket {
  id: string;
  ticket_number: string;
  service_type: string;
  status: "PENDING" | "ENCODED" | "RELEASED" | "REJECTED";
  created_at?: string;
  counter?: number;
}

export interface QueueStats {
  total: number;
  byServiceType: Record<string, number>;
  averageWaitTime?: number;
}

export const SERVICE_TYPE_COLORS: Record<string, string> = {
  "Barangay Clearance": "bg-service-clearance",
  "Business Clearance": "bg-service-business",
  "Building Clearance": "bg-service-building",
  "Barangay Certificate": "bg-service-certificate",
  "Resident Registration": "bg-service-registration",
};
