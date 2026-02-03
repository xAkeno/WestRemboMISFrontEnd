import axios from 'axios';
import { ResidentsResponse, FilterTab } from '@/types/resident';

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

export default api;
