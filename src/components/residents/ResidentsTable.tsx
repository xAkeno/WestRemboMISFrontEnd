import { Resident, SortField, SortDirection } from '../../types/resident';
import { VerificationBadge, VoterBadge, ActivityBadge } from './StatusBadge';
import { MoreHorizontal, ArrowUpDown, FolderSearch, RefreshCw, CalendarCheck, CalendarX, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from '../ui/sonner';
import { formatDobWithAge, mapResident } from './residentMapper';
import DocumentInspectModal from '@/pages/DocumentInspectModal';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ResidentsTableProps {
  residents: Resident[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  isLoading: boolean;
  filterValue: string;
}

interface ScheduleData {
  id: number;
  document_type: string;
  document_number: string;
  schedule_date: string;
  schedule_time: string;
  note?: string | null;
  status?: string;
}

// ─── API instance ──────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name: string) => {
  const words = name.split(' ');
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500',
    'bg-teal-500', 'bg-cyan-500',
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

function formatTimeRange(timeStr: string) {
  try {
    const [hStr, mStr] = timeStr.split(':');
    const startH = parseInt(hStr, 10);
    const endH   = startH + 1;
    const fmt = (h: number) => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${mStr}`;
    return `${fmt(startH)}–${fmt(endH)} ${endH >= 12 ? 'PM' : 'AM'}`;
  } catch { return timeStr; }
}

function formatDateShort(dateStr: string) {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return dateStr; }
}

// ─── Schedule Cell ─────────────────────────────────────────────────────────────
function ScheduleCell({ residentId }: { residentId: string }) {
  const [schedule, setSchedule] = useState<ScheduleData | null | undefined>(undefined);

  useEffect(() => {
    if (!residentId) { setSchedule(null); return; }
    let cancelled = false;
    api.get(`/api/schedules/${residentId}`)
      .then(({ data }) => { if (!cancelled) setSchedule(data?.data ?? null); })
      .catch(() => { if (!cancelled) setSchedule(null); });
    return () => { cancelled = true; };
  }, [residentId]);

  if (schedule === undefined)
    return <div className="h-5 w-28 rounded animate-pulse bg-muted" />;

  if (!schedule) {
    return (
      <span className="resident-not-scheduled-badge">
        <CalendarX className="h-3 w-3" />
        Not yet scheduled
      </span>
    );
  }

  const isUpcoming = new Date(`${schedule.schedule_date}T${schedule.schedule_time}`) >= new Date();
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="resident-schedule-badge"
        style={{
          backgroundColor: isUpcoming ? '#dcfce7' : '#f3f4f6',
          color:            isUpcoming ? '#15803d' : '#6b7280',
          border:           `1px solid ${isUpcoming ? '#86efac' : '#d1d5db'}`,
        }}
      >
        <CalendarCheck className="h-3 w-3" />
        {formatDateShort(schedule.schedule_date)}
      </span>
      <span className="text-[10px] text-muted-foreground pl-0.5">
        {formatTimeRange(schedule.schedule_time)}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export const ResidentsTable = ({
  sortField,
  sortDirection,
  onSort,
  isLoading,
  filterValue,
}: ResidentsTableProps) => {
  const navigate = useNavigate();
  const [residents, setResidents]         = useState<Resident[]>([]);
  const [inspectRecord, setInspectRecord] = useState<Resident | null>(null);
  const [inspectMode, setInspectMode]     = useState<'inspect' | 'reschedule'>('inspect');
  const [scheduledKeys, setScheduledKeys] = useState<Record<string, number>>({});

  // ── Sort header ────────────────────────────────────────────────────────────
  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'opacity-40'}`} />
      </div>
    </th>
  );

  // ── Fetch residents ────────────────────────────────────────────────────────
  const fetchResidents = async (url: string) => {
    try {
      const res  = await axios.get(url, { withCredentials: true });
      const json = res.data.data.data;
      setResidents(json.map(mapResident));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch residents');
      console.error(error);
    }
  };

  useEffect(() => {
    const url = filterValue === '' ? 'http://127.0.0.1:8000/api/residents' : filterValue;
    fetchResidents(url);
  }, [filterValue]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (residentId: string) => {
    if (!window.confirm('Are you sure you want to delete this resident?')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/residents/${residentId}`, { withCredentials: true });
      toast.success('Resident deleted successfully.');
      fetchResidents(filterValue === '' ? 'http://127.0.0.1:8000/api/residents' : filterValue);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete resident');
      console.error(error);
    }
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openInspect = (resident: Resident) => {
    setInspectMode('inspect');
    setInspectRecord(resident);
  };

  const openReschedule = (resident: Resident) => {
    setInspectMode('reschedule');
    setInspectRecord(resident);
  };

  const handleScheduled = (residentId?: string) => {
    fetchResidents(filterValue === '' ? 'http://127.0.0.1:8000/api/residents' : filterValue);
    if (residentId)
      setScheduledKeys(prev => ({ ...prev, [residentId]: (prev[residentId] ?? 0) + 1 }));
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!isLoading && residents.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <svg className="h-9 w-9 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6 5.87a4 4 0 10-8 0m12-8a4 4 0 10-8 0 4 4 0 008 0z" />
          </svg>
          <p className="text-sm font-medium">No residents found.</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .resident-not-scheduled-badge {
          display:inline-flex;align-items:center;gap:4px;
          font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
          padding:2px 7px;background:#fff7ed;color:#c2410c;
          border:1px solid #fed7aa;border-radius:3px;
        }
        .resident-schedule-badge {
          display:inline-flex;align-items:center;gap:4px;
          font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
          padding:2px 7px;border-radius:3px;width:fit-content;
        }
      `}</style>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <SortHeader field="fullName">Full Name</SortHeader>
                <SortHeader field="residentId">Resident ID</SortHeader>
                <SortHeader field="verificationStatus">Verification</SortHeader>
                <SortHeader field="voterStatus">Voter</SortHeader>
                <SortHeader field="dateOfBirth">Date of Birth</SortHeader>
                <SortHeader field="sex">Sex</SortHeader>
                <SortHeader field="activityStatus">Activity</SortHeader>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Schedule
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {residents.map(resident => (
                <tr key={resident.id} className="hover:bg-muted/30 transition-colors">

                  {/* Full Name + avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground flex-shrink-0 ${getAvatarColor(resident.fullName)}`}>
                        {getInitials(resident.fullName)}
                      </div>
                      <a
                        href="#"
                        className="text-sm text-primary hover:underline font-medium whitespace-nowrap"
                        onClick={e => { e.preventDefault(); navigate(`/residents/${resident.residentId}/iid`); }}
                      >
                        {resident.fullName}
                      </a>
                    </div>
                  </td>

                  {/* Resident ID */}
                  <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                    {resident.residentId}
                  </td>

                  {/* Verification */}
                  <td className="py-3 px-4">
                    <VerificationBadge status={resident.verificationStatus} />
                  </td>

                  {/* Voter */}
                  <td className="py-3 px-4">
                    <VoterBadge status={resident.voterStatus} />
                  </td>

                  {/* Date of Birth */}
                  <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDobWithAge(resident.dateOfBirth, resident.age)}
                  </td>

                  {/* Sex */}
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {resident.sex}
                  </td>

                  {/* Activity */}
                  <td className="py-3 px-4">
                    <ActivityBadge status={resident.activityStatus} />
                  </td>

                  {/* Schedule */}
                  <td className="py-3 px-4">
                    <ScheduleCell
                      key={`${resident.residentId}-${scheduledKeys[resident.residentId] ?? 0}`}
                      residentId={resident.residentId}
                    />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => navigate(`/document-edit/6/${resident.residentId}`)}
                        >
                          View / Edit
                        </DropdownMenuItem>
                        {/* Fixed: was navigating to /residents/6/... instead of /document-edit/6/... */}
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => navigate(`/document-edit/6/${resident.residentId}`, { state: { autoPrint: true } })}
                        >
                          Print
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer flex items-center gap-2 font-medium"
                          style={{ color: '#0f2a5e' }}
                          onClick={() => openInspect(resident)}
                        >
                          <FolderSearch className="h-3.5 w-3.5" />
                          Inspect Docs &amp; Schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer flex items-center gap-2"
                          onClick={() => openReschedule(resident)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Reschedule
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive cursor-pointer"
                          onClick={() => handleDelete(resident.residentId)}
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

      {/* ── Inspect / Reschedule Modal ── */}
      {inspectRecord && (
        <DocumentInspectModal
          mode={inspectMode}
          record={{
            id:             inspectRecord.id,
            bcert_number:   inspectRecord.residentId,
            first_name:     inspectRecord.fullName.split(' ')[0],
            surname:        inspectRecord.fullName.split(' ').slice(-1)[0],
            document_type:  'resident',
            scheduled_date: (inspectRecord as any).scheduled_date ?? null,
            user_id:        (inspectRecord as any).user_id,
          }}
          onClose={() => setInspectRecord(null)}
          onScheduled={() => handleScheduled(inspectRecord.residentId)}
        />
      )}
    </>
  );
};