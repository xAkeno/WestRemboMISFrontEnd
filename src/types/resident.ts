export type VerificationStatus = 'Pending' | 'Verified' | 'Rejected';
export type VoterStatus = 'Yes' | 'No';
export type ActivityStatus = 'Active' | 'Inactive' | 'Deceased';

export interface Resident {
  id: string;
  fullName: string;
  residentId: string;
  verificationStatus: VerificationStatus;
  voterStatus: VoterStatus;
  dateOfBirth: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  activityStatus: ActivityStatus;
}

export interface ResidentsResponse {
  data: Resident[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type FilterTab = 'All' | 'Verified' | 'Voters' | 'Active';

export type SortField = 'fullName' | 'residentId' | 'verificationStatus' | 'voterStatus' | 'dateOfBirth' | 'sex' | 'activityStatus';
export type SortDirection = 'asc' | 'desc';
