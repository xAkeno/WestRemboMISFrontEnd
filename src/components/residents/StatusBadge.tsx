import { VerificationStatus, VoterStatus, ActivityStatus } from '../../types/resident';

interface VerificationBadgeProps {
  status: VerificationStatus;
}

export const VerificationBadge = ({ status }: VerificationBadgeProps) => {
  const getStatusClass = () => {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Verified':
        return 'status-verified';
      case 'Rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};

interface VoterBadgeProps {
  status: VoterStatus;
}

export const VoterBadge = ({ status }: VoterBadgeProps) => {
  return (
    <span className={status === 'Yes' ? 'status-yes' : 'status-no'}>
      {status}
    </span>
  );
};

interface ActivityBadgeProps {
  status: ActivityStatus;
}

export const ActivityBadge = ({ status }: ActivityBadgeProps) => {
  const getStatusClass = () => {
    switch (status) {
      case 'Active':
        return 'status-active';
      case 'Inactive':
        return 'status-inactive';
      case 'Deceased':
        return 'status-deceased';
      default:
        return 'status-inactive';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};
