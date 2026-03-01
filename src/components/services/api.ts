import axios from 'axios';
import { ResidentsResponse, FilterTab } from '@/types/resident';
import type { DocumentRequest, Notification } from '@/types/types';

const API_BASE_URL = 'https://westrembomis.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface FetchResidentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: FilterTab;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const fetchResidents = async (params: FetchResidentsParams = {}): Promise<ResidentsResponse> => {
  try {
    const response = await api.get('/latestRecordBrgyClearance', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 15,
        search: params.search || '',
        filter: params.filter || 'All',
        sortField: params.sortField || 'fullName',
        sortDirection: params.sortDirection || 'asc',
      },
    });
    return response.data;
  } catch (error) {
    // Return mock data for development/demo
    console.log('API not available, using mock data:', error);
    return generateMockData(params);
  }
};

export const submitKiosk = async (data: unknown) => {
  const response = await api.post('/kiosk/submit', data);
  return response.data;
};

// Mock data generator for development
const generateMockData = (params: FetchResidentsParams): ResidentsResponse => {
  const mockNames = [
    'Laboriosam Enim Pos Sed Ad Magnam Aliqui',
    'Ladarius Schroeder',
    'Ramiro Langworth',
    'Uriah Conn',
    'Daphne Considine',
    'Braeden Grimes',
    'Maymie Stamm',
    'Stanford Heathcote',
    'Sharon Cremin',
    'Annie Gibson',
    'Alexa Rosenbaum',
    'Jules Koch',
    'Rocky Shanahan',
    'Hallie Gleason',
    'Marcus Johnson',
  ];

  const verificationStatuses: ('Pending' | 'Verified' | 'Rejected')[] = ['Pending', 'Verified', 'Rejected'];
  const voterStatuses: ('Yes' | 'No')[] = ['Yes', 'No'];
  const activityStatuses: ('Active' | 'Inactive' | 'Deceased')[] = ['Active', 'Inactive', 'Deceased'];
  const sexOptions: ('Male' | 'Female' | 'Other')[] = ['Male', 'Female', 'Other'];

  const generateId = () => `BRY-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const generateDate = () => {
    const year = 1950 + Math.floor(Math.random() * 70);
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${month}/${day}/${year}`;
  };

  const calculateAge = (dateStr: string) => {
    const [month, day, year] = dateStr.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const total = 50001;
  const page = params.page || 1;
  const pageSize = params.pageSize || 15;
  const totalPages = Math.ceil(total / pageSize);

  let residents = Array.from({ length: pageSize }, (_, i) => {
    const dob = generateDate();
    const verificationStatus = verificationStatuses[Math.floor(Math.random() * verificationStatuses.length)];
    const voterStatus = voterStatuses[Math.floor(Math.random() * voterStatuses.length)];
    const activityStatus = activityStatuses[Math.floor(Math.random() * activityStatuses.length)];
    
    return {
      id: String((page - 1) * pageSize + i + 1),
      fullName: mockNames[i % mockNames.length],
      residentId: generateId(),
      verificationStatus,
      voterStatus,
      dateOfBirth: dob,
      age: calculateAge(dob),
      sex: sexOptions[Math.floor(Math.random() * sexOptions.length)],
      activityStatus,
    };
  });

  // Apply filters
  if (params.filter && params.filter !== 'All') {
    if (params.filter === 'Verified') {
      residents = residents.filter(r => r.verificationStatus === 'Verified');
    } else if (params.filter === 'Voters') {
      residents = residents.filter(r => r.voterStatus === 'Yes');
    } else if (params.filter === 'Active') {
      residents = residents.filter(r => r.activityStatus === 'Active');
    }
  }

  // Apply search
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    residents = residents.filter(r => 
      r.fullName.toLowerCase().includes(searchLower) ||
      r.residentId.toLowerCase().includes(searchLower)
    );
  }

  return {
    data: residents,
    total,
    page,
    pageSize,
    totalPages,
  };
};


// ─── Raw DB shapes ─────────────────────────────────────────────────────────────

interface RawBuilding {
  id: number;
  bcert_number: string | null;
  requester_type: string | null;
  issued_date: string | null;
  prefix: string | null;
  surname: string | null;
  first_name: string | null;
  middle_name: string | null;
  ext_name: string | null;
  establishment: string | null;
  house_block_lot_no: string | null;
  street: string | null;
  zone: string | null;
  purpose: string | null;
  purpose_details: string | null;
  or_no: string | null;
  remarks: string | null;
  punong_barangay: string | null;
  for_the_punong_barangay: string | null;
  barangay_position: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

interface RawBusiness {
  id: number;
  brgy_business_no: string | null;
  requester_type: string | null;
  issued_date: string | null;
  prefix: string | null;
  surname: string | null;
  first_name: string | null;
  middle_name: string | null;
  ext_name: string | null;
  business_name: string | null;
  business_type: string | null;
  business_details: string | null;
  capital: number | null;
  house_block_lot_no: string | null;
  street: string | null;
  zone: string | null;
  or_no: string | null;
  inspected_by: string | null;
  date_of_inspection: string | null;
  inspection_remarks: string | null;
  inspected_remarks: string | null;
  inspected_note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  date_inspected: string | null;
}

interface RawCertificate {
  id: number;
  bcert_number: string;
  requester_type: string | null;
  issued_date: string;
  prefix: string | null;
  firstname: string;
  middle_name: string | null;
  surname: string;
  extension: string | null;
  house_block_lot_no: string | null;
  street: string | null;
  zone: string | null;
  age: number | null;
  date_of_birth: string | null;
  place_of_birth: string | null;
  contact_no: string | null;
  period_of_residency: string | null;
  registered_voter: string | null;
  house_owner: string | null;
  relationship_to_owner: string | null;
  purpose: string;
  purpose_details: string | null;
  punong_barangay: string | null;
  for_the_punong_barangay: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

interface RawClearance {
  id: number;
  bcert_number: string | null;
  requester_type: string | null;
  issued_date: string | null;
  issued_at: string | null;
  issued_on: string | null;
  prefix: string | null;
  surname: string | null;
  first_name: string | null;
  middle_name: string | null;
  ext_name: string | null;
  house_block_lot_no: string | null;
  street: string | null;
  zone: string | null;
  dob: string | null;
  pob: string | null;
  contact_no: string | null;
  period_of_residency: string | null;
  registered_voter: string | null;
  house_owner: string | null;
  relationship_to_owner: string | null;
  purpose: string | null;
  purpose_details: string | null;
  ctc_vrr_no: string | null;
  or_no: string | null;
  remarks: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

interface MyAllRequestsResponse {
  status: "success" | "error";
  data: {
    business: RawBusiness[];
    certificate: RawCertificate[];
    clearance: RawClearance[];
    building: RawBuilding[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapStatus(raw: string): DocumentRequest["status"] {
  const s = raw.toLowerCase();
  if (s === "released")   return "released";
  if (s === "rejected")   return "rejected";
  if (s === "incomplete") return "incomplete";
  if (s === "processing") return "processing";
  return "pending";
}

function normaliseName(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ─── Mappers ──────────────────────────────────────────────────────────────────
function fromCertificate(r: RawCertificate): DocumentRequest {
  return {
    id: r.id,
    bcert_number: r.bcert_number,
    document_type: "barangay_certificate",
    status: mapStatus(r.status),
    purpose: r.purpose,
    purpose_details: r.purpose_details ?? undefined,
    requester_name: normaliseName(r.prefix, r.firstname, r.middle_name, r.surname, r.extension),
    address: [r.house_block_lot_no, r.street, r.zone].filter(Boolean).join(", "),
    scheduled_date: r.issued_date ?? undefined,
    remarks: undefined, // can fill if needed
    uploaded_files: undefined,
    missing_items: undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
    raw: r,
    // extra certificate fields
    age: r.age ?? undefined,
    date_of_birth: r.date_of_birth ?? undefined,
    place_of_birth: r.place_of_birth ?? undefined,
    contact_no: r.contact_no ?? undefined,
    period_of_residency: r.period_of_residency ?? undefined,
    registered_voter: r.registered_voter === "Yes",
    house_owner: r.house_owner ?? undefined,
    relationship_to_owner: r.relationship_to_owner ?? undefined,
  };
}

function fromClearance(r: RawClearance): DocumentRequest {
  return {
    id: r.id,
    bcert_number: r.bcert_number,
    document_type: "barangay_clearance",
    status: mapStatus(r.status),
    purpose: r.purpose ?? "Barangay Clearance",
    purpose_details: r.purpose_details ?? undefined,
    requester_name: normaliseName(r.prefix, r.first_name, r.middle_name, r.surname, r.ext_name),
    address: [r.house_block_lot_no, r.street, r.zone].filter(Boolean).join(", "),
    scheduled_date: r.issued_date ?? undefined,
    remarks: r.remarks ?? undefined,
    uploaded_files: undefined,
    missing_items: undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
    raw: r,
    // extra clearance fields
    dob: r.dob ?? undefined,
    pob: r.pob ?? undefined,
    contact_no: r.contact_no ?? undefined,
    period_of_residency: r.period_of_residency ?? undefined,
    registered_voter: r.registered_voter === "Yes",
    house_owner: r.house_owner ?? undefined,
    relationship_to_owner: r.relationship_to_owner ?? undefined,
    ctc_vrr_no: r.ctc_vrr_no ?? undefined,
    issued_at: r.issued_at ?? undefined,
    issued_on: r.issued_on ?? undefined,
    or_no: r.or_no ?? undefined,
    prefix: r.prefix ?? undefined,
  };
}

function fromBuilding(r: RawBuilding): DocumentRequest {
  return {
    id: r.id,
    bcert_number: r.bcert_number,
    document_type: "building_clearance",
    status: mapStatus(r.status),
    purpose: r.purpose ?? r.establishment ?? "Building Clearance",
    purpose_details: r.purpose_details ?? undefined,
    requester_name: normaliseName(r.prefix, r.first_name, r.middle_name, r.surname, r.ext_name),
    address: [r.house_block_lot_no, r.street, r.zone].filter(Boolean).join(", "),
    scheduled_date: r.issued_date ?? undefined,
    remarks: r.remarks ?? undefined,
    uploaded_files: undefined,
    missing_items: undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
    raw: r,
    updated_by: r.updated_by ?? undefined,
  };
}

function fromBusiness(r: RawBusiness): DocumentRequest {
  return {
    id: r.id,
    bcert_number: r.brgy_business_no,
    document_type: "business_clearance",
    status: mapStatus(r.status),
    purpose: r.business_name ?? r.business_type ?? "Business Clearance",
    purpose_details: r.business_details ?? undefined,
    requester_name: normaliseName(r.prefix, r.first_name, r.middle_name, r.surname, r.ext_name),
    address: [r.house_block_lot_no, r.street, r.zone].filter(Boolean).join(", "),
    scheduled_date: r.issued_date ?? r.date_of_inspection ?? undefined,
    remarks: r.inspected_remarks ?? r.inspection_remarks ?? undefined,
    uploaded_files: undefined,
    missing_items: undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
    raw: r,
    // extra business fields
    inspected_by: r.inspected_by ?? undefined,
    inspected_notes: r.inspected_note ?? undefined,
    date_of_inspection: r.date_of_inspection ?? undefined,
    capital: r.capital ?? undefined,
    updated_by: r.updated_by ?? undefined,
  };
}

// ─── Core fetch (one network call) ────────────────────────────────────────────

// const apiClient = axios.get(API_BASE_URL + "/my-all-requests", { withCredentials: true });


async function fetchAllRaw(): Promise<DocumentRequest[]> {
  const { data } = await axios.get(API_BASE_URL + "/my-all-requests", { withCredentials: true });

  console.log("Raw API response:", data);

  if (data.status !== "success") {
    throw new Error("Failed to fetch requests");
  }

  const { business, certificate, clearance, building } = data.data;

  return [
    ...business.map(fromBusiness),
    ...certificate.map(fromCertificate),
    ...clearance.map(fromClearance),
    ...building.map(fromBuilding),
  ].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// ─── Public exports ───────────────────────────────────────────────────────────

/**
 * MyRequest.tsx  →  useQuery({ queryKey: ["requests"], queryFn: fetchRequests })
 * Returns the full sorted list of all document requests.
 */
export async function fetchRequests(): Promise<DocumentRequest[]> {
  return fetchAllRaw();
}

/**
 * RequestDetail.tsx  →  useQuery({ queryKey: ["request", id], queryFn: () => fetchRequestById(id!) })
 * Fetches all records then finds the one matching the prefixed ID (e.g. "CLR-3").
 * Works on hard refresh / direct URL navigation because it doesn't rely on cache.
 */
export async function fetchRequestById(
  type: string,
  id: string
): Promise<DocumentRequest | null> {
  const all = await fetchAllRaw();

  return (
    all.find(
      (r) =>
        r.id === Number(id) &&
        r.document_type === type
    ) ?? null
  );
}




// const apiRequest = axios.create({
//   baseURL: "https://westrembomis.onrender.com/api",
//   headers: { "Content-Type": "application/json" },
// });

// --- Dummy data for development ---
// const DUMMY_REQUESTS: DocumentRequest[] = [
//   {
//     id: 1,
//     document_type: "barangay_clearance",
//     status: "approved",
//     created_at: "2024-12-10T08:00:00Z",
//     scheduled_date: "2024-12-15T10:00:00Z",
//     purpose: "Employment requirement",
//     uploaded_files: ["valid_id.jpg"],
//     updated_at: "2024-12-14T12:00:00Z",
//   },
//   {
//     id: 2,
//     document_type: "business_clearance",
//     status: "incomplete",
//     created_at: "2024-12-12T09:30:00Z",
//     purpose: "Business permit renewal",
//     missing_items: ["DTI Registration", "Proof of business address"],
//     updated_at: "2024-12-14T12:00:00Z",
//   },
//   {
//     id: 3,
//     document_type: "resident_certificate",
//     status: "pending",
//     created_at: "2024-12-14T14:00:00Z",
//     purpose: "School enrollment",
//     uploaded_files: ["birth_cert.pdf"],
//     updated_at: "2024-12-14T12:00:00Z",
//   },
//   {
//     id: 4,
//     document_type: "building_clearance",
//     status: "rejected",
//     created_at: "2024-12-08T11:00:00Z",
//     purpose: "House renovation",
//     remarks: "Submitted building plan does not meet standards. Please resubmit.",
//     updated_at: "2024-12-14T12:00:00Z",
//   },
//   {
//     id: 5,
//     document_type: "barangay_certificate",
//     status: "approved",
//     created_at: "2024-12-05T07:45:00Z",
//     scheduled_date: "2024-12-18T09:00:00Z",
//     purpose: "Scholarship application",
//     uploaded_files: ["valid_id.jpg", "proof_of_residency.pdf"],
//     updated_at: "2024-12-14T12:00:00Z",
//   },
// ];

// const DUMMY_NOTIFICATIONS: Notification[] = [
//   { id: "n1", message: "Your Barangay Clearance has been approved! Pick up on Dec 15.", type: "success", read: false, created_at: "2024-12-14T12:00:00Z", request_id: "REQ-2024-001" },
//   { id: "n2", message: "Business Clearance request is missing required documents.", type: "warning", read: false, created_at: "2024-12-13T10:00:00Z", request_id: "REQ-2024-002" },
//   { id: "n3", message: "Building Clearance request has been rejected. See remarks.", type: "error", read: true, created_at: "2024-12-09T15:00:00Z", request_id: "REQ-2024-004" },
//   { id: "n4", message: "Barangay Certificate is ready for pickup on Dec 18.", type: "success", read: true, created_at: "2024-12-06T08:00:00Z", request_id: "REQ-2024-005" },
// ];

// Simulate API calls with dummy data
// export async function fetchRequests(): Promise<DocumentRequest[]> {
//   try {
//     const res = await api.get("/requests");
//     return res.data;
//   } catch {
//     return DUMMY_REQUESTS;
//   }
// }

// export async function fetchRequestById(id: string): Promise<DocumentRequest | undefined> {
//   try {
//     const res = await api.get(`/requests/${id}`);
//     return res.data;
//   } catch {
//     return DUMMY_REQUESTS.find((r) => r.id === id);
//   }
// }

// export async function createRequest(data: {
//   document_type: string;
//   purpose: string;
// }): Promise<DocumentRequest> {
//   try {
//     const res = await api.post("/requests", data);
//     return res.data;
//   } catch {
//     const newReq: DocumentRequest = {
//       id: DUMMY_REQUESTS.length + 1,
//       document_type: data.document_type as DocumentRequest["document_type"],
//       status: "pending",
//       created_at: new Date().toISOString(),
//       purpose: data.purpose,
//       updated_at: new Date().toISOString(),
//     };
//     DUMMY_REQUESTS.push(newReq);
//     return newReq;
//   }
// }

// export async function fetchNotifications(): Promise<Notification[]> {
//   try {
//     const res = await api.get("/notifications");
//     return res.data;
//   } catch {
//     return DUMMY_NOTIFICATIONS;
//   }
// }

// export async function uploadFile(requestId: string, file: File): Promise<{ filename: string }> {
//   try {
//     const formData = new FormData();
//     formData.append("file", file);
//     const res = await api.post(`/requests/${requestId}/upload`, formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });
//     return res.data;
//   } catch {
//     return { filename: file.name };
//   }
// }

export default api;
