import axios from 'axios';
import { ResidentsResponse, FilterTab } from '@/types/resident';
import type { DocumentRequest, Notification } from '@/types/types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

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


const apiRequest = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: { "Content-Type": "application/json" },
});

// --- Dummy data for development ---
const DUMMY_REQUESTS: DocumentRequest[] = [
  {
    id: "REQ-2024-001",
    document_type: "barangay_clearance",
    status: "approved",
    created_at: "2024-12-10T08:00:00Z",
    scheduled_date: "2024-12-15T10:00:00Z",
    purpose: "Employment requirement",
    uploaded_files: ["valid_id.jpg"],
  },
  {
    id: "REQ-2024-002",
    document_type: "business_clearance",
    status: "incomplete",
    created_at: "2024-12-12T09:30:00Z",
    purpose: "Business permit renewal",
    missing_items: ["DTI Registration", "Proof of business address"],
  },
  {
    id: "REQ-2024-003",
    document_type: "resident_certificate",
    status: "pending",
    created_at: "2024-12-14T14:00:00Z",
    purpose: "School enrollment",
    uploaded_files: ["birth_cert.pdf"],
  },
  {
    id: "REQ-2024-004",
    document_type: "building_clearance",
    status: "rejected",
    created_at: "2024-12-08T11:00:00Z",
    purpose: "House renovation",
    remarks: "Submitted building plan does not meet standards. Please resubmit.",
  },
  {
    id: "REQ-2024-005",
    document_type: "barangay_certificate",
    status: "approved",
    created_at: "2024-12-05T07:45:00Z",
    scheduled_date: "2024-12-18T09:00:00Z",
    purpose: "Scholarship application",
    uploaded_files: ["valid_id.jpg", "proof_of_residency.pdf"],
  },
];

const DUMMY_NOTIFICATIONS: Notification[] = [
  { id: "n1", message: "Your Barangay Clearance has been approved! Pick up on Dec 15.", type: "success", read: false, created_at: "2024-12-14T12:00:00Z", request_id: "REQ-2024-001" },
  { id: "n2", message: "Business Clearance request is missing required documents.", type: "warning", read: false, created_at: "2024-12-13T10:00:00Z", request_id: "REQ-2024-002" },
  { id: "n3", message: "Building Clearance request has been rejected. See remarks.", type: "error", read: true, created_at: "2024-12-09T15:00:00Z", request_id: "REQ-2024-004" },
  { id: "n4", message: "Barangay Certificate is ready for pickup on Dec 18.", type: "success", read: true, created_at: "2024-12-06T08:00:00Z", request_id: "REQ-2024-005" },
];

// Simulate API calls with dummy data
export async function fetchRequests(): Promise<DocumentRequest[]> {
  try {
    const res = await api.get("/requests");
    return res.data;
  } catch {
    return DUMMY_REQUESTS;
  }
}

export async function fetchRequestById(id: string): Promise<DocumentRequest | undefined> {
  try {
    const res = await api.get(`/requests/${id}`);
    return res.data;
  } catch {
    return DUMMY_REQUESTS.find((r) => r.id === id);
  }
}

export async function createRequest(data: {
  document_type: string;
  purpose: string;
}): Promise<DocumentRequest> {
  try {
    const res = await api.post("/requests", data);
    return res.data;
  } catch {
    const newReq: DocumentRequest = {
      id: `REQ-2024-${String(DUMMY_REQUESTS.length + 1).padStart(3, "0")}`,
      document_type: data.document_type as DocumentRequest["document_type"],
      status: "pending",
      created_at: new Date().toISOString(),
      purpose: data.purpose,
    };
    DUMMY_REQUESTS.push(newReq);
    return newReq;
  }
}

export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const res = await api.get("/notifications");
    return res.data;
  } catch {
    return DUMMY_NOTIFICATIONS;
  }
}

export async function uploadFile(requestId: string, file: File): Promise<{ filename: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(`/requests/${requestId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch {
    return { filename: file.name };
  }
}

export default api;
