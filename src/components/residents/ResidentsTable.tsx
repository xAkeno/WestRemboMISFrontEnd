import { Resident, SortField, SortDirection } from '../../types/resident';
import { VerificationBadge, VoterBadge, ActivityBadge } from './StatusBadge';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from '../ui/sonner';
import { formatDobWithAge, mapResident } from './residentMapper';

interface ResidentsTableProps {
  residents: Resident[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  isLoading: boolean;
  filterValue: string;
}

const getInitials = (name: string) => {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const ResidentsTable = ({ 
  sortField, 
  sortDirection, 
  onSort,
  isLoading,
  filterValue
}: ResidentsTableProps) => {
  const navigate = useNavigate();
  const [residents, setResidents] = useState<Resident[]>([]);

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'opacity-50'}`} />
      </div>
    </th>
  );

  const fetchResidents = async (url: string) => {
    try {
      const res = await axios.get(url, { withCredentials: true });
      const json = res.data.data.data;
      setResidents(json.map(mapResident));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to fetch residents';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  useEffect(() => {
    const url =
      filterValue === ''
        ? 'https://westrembomis.onrender.com/api/residents'
        : filterValue;
    fetchResidents(url);
  }, [filterValue]);

  const handleDelete = async (residentId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this resident?");
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `https://westrembomis.onrender.com/api/residents/${residentId}`,
        { withCredentials: true }
      );
      toast.success("Resident deleted successfully.");
      fetchResidents(
        filterValue === '' ? 'https://westrembomis.onrender.com/api/residents' : filterValue
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to delete resident';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <SortHeader field="fullName">Full Name</SortHeader>
              <SortHeader field="residentId">Resident ID</SortHeader>
              <SortHeader field="verificationStatus">Verification Status</SortHeader>
              <SortHeader field="voterStatus">Voter Status</SortHeader>
              <SortHeader field="dateOfBirth">Date of Birth</SortHeader>
              <SortHeader field="sex">Sex</SortHeader>
              <SortHeader field="activityStatus">Activity Status</SortHeader>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {residents.map((resident) => (
              <tr key={resident.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground ${getAvatarColor(resident.fullName)}`}>
                      {getInitials(resident.fullName)}
                    </div>
                    <a
                      href="#"
                      className="text-sm text-primary hover:underline font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/residents/${resident.residentId}/iid`);
                      }}
                    >
                      {resident.fullName}
                    </a>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {resident.residentId}
                </td>
                <td className="py-3 px-4">
                  <VerificationBadge status={resident.verificationStatus} />
                </td>
                <td className="py-3 px-4">
                  <VoterBadge status={resident.voterStatus} />
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {formatDobWithAge(resident.dateOfBirth, resident.age)}
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {resident.sex}
                </td>
                <td className="py-3 px-4">
                  <ActivityBadge status={resident.activityStatus} />
                </td>
                <td className="py-3 px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/document-edit/6/${resident.residentId}`)}
                        className="cursor-pointer"
                      >
                        View / Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(`/residents/6/${resident.residentId}`, { state: { autoPrint: true } })}
                        className="cursor-pointer"
                      >
                        Print
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(resident.residentId)}
                        className="text-destructive cursor-pointer"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};