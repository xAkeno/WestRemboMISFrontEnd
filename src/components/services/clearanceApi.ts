import axios from 'axios';
import { 
  BarangayClearance, 
  BusinessClearance, 
  BuildingClearance, 
  Certificate,
  ClearanceResponse 
} from '../../types/clearance';

const API_BASE_URL = `${import.meta.env.VITE_WEB_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const deleteBarangayClearance = async (id: number) => {
  return axios.delete(`${API_BASE_URL}/barangay-clearances/${id}`,{withCredentials:true});
};

export interface FetchClearanceParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  status?: string;
  filter_date?: string;
  from?: string;
  to?: string;
  zone?: string;
  street?: string;
  purpose?: string;
  schedule_filter?: string;
}

// Barangay Clearance API
export const fetchBarangayClearances = async (params: FetchClearanceParams = {}) => {
  try {
    const response = await api.get('/barangay-clearances', { params, withCredentials: true });
    console.log('API response:', response.data);
    
    // The API returns: { data: { data: [...], current_page, last_page, total, per_page } }
    const paginatedData = response.data.data;
    
    // Return the pagination metadata along with the data
    return {
      data: paginatedData.data || [],
      total: paginatedData.total || 0,
      currentPage: paginatedData.current_page || 1,
      totalPages: paginatedData.last_page || 1,
      perPage: paginatedData.per_page || 15,
    };
  } catch (error) {
    console.log('API not available, using mock data:', error);
    return generateMockBarangayClearances(params);
  }
};

// Business Clearance API
export const fetchBusinessClearances = async (params: FetchClearanceParams = {}): Promise<ClearanceResponse<BusinessClearance>> => {
  try {
    const response = await api.get('/business-clearances', { params,withCredentials: true });
    console.log('API response:', response.data);
    return response.data.data;
  } catch (error) {
    console.log('API not available, using mock data:', error);
    return generateMockBusinessClearances(params);
  }
};

// Building Clearance API
export const fetchBuildingClearances = async (params: FetchClearanceParams = {}): Promise<ClearanceResponse<BuildingClearance>> => {
  try {
    const response = await api.get('/building-clearances', { params,withCredentials: true });
    console.log('API response:', response.data);
    return response.data.data;
  } catch (error) {
    console.log('API not available, using mock data:', error);
    return generateMockBuildingClearances(params);
  }
};

// Certificate API
export const fetchCertificates = async (params: FetchClearanceParams = {}): Promise<ClearanceResponse<Certificate>> => {
  try {
    const response = await api.get('/barangay-certificates', { params,withCredentials: true });
    console.log('API response:', response.data);
    return response.data.data;
  } catch (error) {
    console.log('API not available, using mock data:', error);
    return generateMockCertificates(params);
  }
};

// Mock data generators
const surnames = ['Garcia', 'Santos', 'Reyes', 'Cruz', 'Bautista', 'Gonzales', 'Ramos', 'Aquino', 'Torres', 'Flores'];
const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena', 'Miguel', 'Sofia'];
const middleNames = ['Dela', 'San', 'De', 'La', 'Del'];
const streets = ['Rizal St.', 'Mabini St.', 'Bonifacio St.', 'Luna St.', 'Aguinaldo St.'];
const purposes = ['Employment', 'Business Permit', 'Travel', 'Loan Application', 'School Requirement'];
const businessTypes = ['Sari-sari Store', 'Restaurant', 'Retail', 'Services', 'Manufacturing'];

const generateId = () => `BCL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
const generateDate = () => {
  const date = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString('en-US');
};

const generateMockBarangayClearances = (params: FetchClearanceParams) => {
  const total = 500;
  const page = params.page || 1;
  const pageSize = params.pageSize || 15;
  
  const data: BarangayClearance[] = Array.from({ length: pageSize }, (_, i) => ({
    id: String((page - 1) * pageSize + i + 1),
    bcert_number: generateId(),
    created_at: generateDate(),
    surname: surnames[Math.floor(Math.random() * surnames.length)],
    first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
    middle_name: middleNames[Math.floor(Math.random() * middleNames.length)],
    ext_name: Math.random() > 0.8 ? 'Jr.' : undefined,
    house_block_lot_no: String(Math.floor(Math.random() * 50) + 1),
    street: streets[Math.floor(Math.random() * streets.length)],
    zone: `Zone ${Math.floor(Math.random() * 10) + 1}`,
    dob: generateDate(),
    pob: 'Manila',
    created_by: Math.floor(Math.random() * 100) + 1, // Make it a number (ID)
    purpose: purposes[Math.floor(Math.random() * purposes.length)],
    status: ['PENDING', 'APPROVED', 'RELEASED', 'REJECTED'][Math.floor(Math.random() * 4)],
  }));

  return { 
    data, 
    total, 
    currentPage: page, 
    totalPages: Math.ceil(total / pageSize),
    perPage: pageSize 
  };
};

const generateMockBusinessClearances = (params: FetchClearanceParams): ClearanceResponse<BusinessClearance> => {
  const total = 300;
  const page = params.page || 1;
  const pageSize = params.pageSize || 15;
  
  const data: BusinessClearance[] = Array.from({ length: pageSize }, (_, i) => ({
    id: String((page - 1) * pageSize + i + 1),
    brgyBusinessNo: `BUS-${generateId()}`,
    issuedDate: generateDate(),
    surname: surnames[Math.floor(Math.random() * surnames.length)],
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    middleName: middleNames[Math.floor(Math.random() * middleNames.length)],
    businessName: `${firstNames[Math.floor(Math.random() * firstNames.length)]}'s ${businessTypes[Math.floor(Math.random() * businessTypes.length)]}`,
    businessType: businessTypes[Math.floor(Math.random() * businessTypes.length)],
    street: streets[Math.floor(Math.random() * streets.length)],
    zone: `Zone ${Math.floor(Math.random() * 10) + 1}`,
    capital: Math.floor(Math.random() * 500000) + 10000,
    orNo: `OR-${Math.floor(Math.random() * 100000)}`,
    inspectedBy: Math.random() > 0.5 ? 'Inspector ' + surnames[Math.floor(Math.random() * surnames.length)] : undefined,
  }));

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};

const generateMockBuildingClearances = (params: FetchClearanceParams): ClearanceResponse<BuildingClearance> => {
  const total = 200;
  const page = params.page || 1;
  const pageSize = params.pageSize || 15;
  
  const data: BuildingClearance[] = Array.from({ length: pageSize }, (_, i) => ({
    id: String((page - 1) * pageSize + i + 1),
    recordId: `REC-${generateId()}`,
    bcertNumber: generateId(),
    issuedDate: generateDate(),
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    middleName: middleNames[Math.floor(Math.random() * middleNames.length)],
    surname: surnames[Math.floor(Math.random() * surnames.length)],
    establishment: `${firstNames[Math.floor(Math.random() * firstNames.length)]}'s Building`,
    purpose: purposes[Math.floor(Math.random() * purposes.length)],
    blockLotNo: `Block ${Math.floor(Math.random() * 20) + 1}, Lot ${Math.floor(Math.random() * 50) + 1}`,
    street: streets[Math.floor(Math.random() * streets.length)],
    zone: `Zone ${Math.floor(Math.random() * 10) + 1}`,
    orNo: `OR-${Math.floor(Math.random() * 100000)}`,
    remarks: Math.random() > 0.7 ? 'Approved' : undefined,
  }));

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};

const generateMockCertificates = (params: FetchClearanceParams): ClearanceResponse<Certificate> => {
  const total = 400;
  const page = params.page || 1;
  const pageSize = params.pageSize || 15;
  
  const data: Certificate[] = Array.from({ length: pageSize }, (_, i) => ({
    id: String((page - 1) * pageSize + i + 1),
    bcertNumber: generateId(),
    issueDate: generateDate(),
    surname: surnames[Math.floor(Math.random() * surnames.length)],
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    middleName: middleNames[Math.floor(Math.random() * middleNames.length)],
    ext: Math.random() > 0.8 ? 'Sr.' : undefined,
    blockNo: String(Math.floor(Math.random() * 50) + 1),
    street: streets[Math.floor(Math.random() * streets.length)],
    zone: `Zone ${Math.floor(Math.random() * 10) + 1}`,
    dateOfBirth: generateDate(),
    age: Math.floor(Math.random() * 50) + 18,
    registeredVoter: Math.random() > 0.5 ? 'Yes' : 'No',
    periodOfResidency: `${Math.floor(Math.random() * 20) + 1} years`,
    purpose: purposes[Math.floor(Math.random() * purposes.length)],
  }));

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};

export default api;