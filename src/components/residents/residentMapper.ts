import {
  Resident,
  VerificationStatus,
  VoterStatus,
  ActivityStatus,
} from '@/types/resident';
export const formatDobWithAge = (date: string, age: number) => {
  const d = new Date(date);
  return `${d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} (${age})`;
};

export const mapResident = (r: any): Resident => {
  // Build full name safely
  const fullName = [
    r.first_name,
    r.middle_name,
    r.surname,
  ]
    .filter(Boolean)
    .join(' ');

  // Age calculation
  const birthDate = new Date(r.date_of_birth);
  const today = new Date();
  const age =
    today.getFullYear() -
    birthDate.getFullYear() -
    (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);

  // Status mapping
  const verificationStatus: VerificationStatus =
    r.status === 'PENDING'
      ? 'Pending'
      : r.status === 'APPROVED'
      ? 'Verified'
      : 'Rejected';

  const voterStatus: VoterStatus =
    r.voter_status === 'Registered' ? 'Yes' : 'No';

  const activityStatus: ActivityStatus =
    r.resident_status === 'Permanent'
      ? 'Active'
      : r.resident_status === 'Deceased'
      ? 'Deceased'
      : 'Inactive';

  return {
    id: String(r.id),
    residentId: r.resident_id,
    fullName,
    verificationStatus,
    voterStatus,
    dateOfBirth: r.date_of_birth,
    age,
    sex: r.sex,
    activityStatus,
    created_by: r.created_by,
    user_id: r.user_id,
  };
};
