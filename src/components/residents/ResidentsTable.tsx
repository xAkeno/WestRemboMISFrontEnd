import { Resident, SortField, SortDirection } from '../../types/resident';
import { VerificationBadge, VoterBadge, ActivityBadge } from './StatusBadge';
import {
  MoreHorizontal, ArrowUpDown, FolderSearch, RefreshCw,
  CalendarCheck, CalendarX, Calendar, Bell, X, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useRef, useState } from 'react';
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

interface NewRequestNotification {
  id: number;
  residentId: string;
  full_name: string;
  created_at: string;
  seen: boolean;
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

function formatCreatedAt(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    const d    = new Date(raw);
    const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${date} · ${time}`;
  } catch { return raw; }
}

function isNewRequest(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  try { return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000; }
  catch { return false; }
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

// ─── Notification Panel ────────────────────────────────────────────────────────
function NotificationPanel({
  notifications, onDismiss, onDismissAll, onSchedule,
}: {
  notifications: NewRequestNotification[];
  onDismiss: (id: number) => void;
  onDismissAll: () => void;
  onSchedule: (n: NewRequestNotification) => void;
}) {
  const unseenCount = notifications.filter(n => !n.seen).length;
  return (
    <div className="resident-notification-panel">
      <div className="resident-notification-panel-header">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-sm text-foreground">New Residents</span>
          {unseenCount > 0 && <span className="resident-notification-count-badge">{unseenCount}</span>}
        </div>
        {notifications.length > 0 && (
          <button onClick={onDismissAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Dismiss all
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">No new residents</div>
      ) : (
        <div className="resident-notification-list">
          {notifications.map(n => (
            <div key={n.id} className={`resident-notification-item ${!n.seen ? 'resident-notification-item--unseen' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!n.seen && <span className="resident-notification-new-dot" />}
                  <span className="text-sm font-medium text-foreground truncate">{n.full_name}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <span className="font-mono">{n.residentId}</span>
                  <span>·</span>
                  <Clock className="h-2.5 w-2.5" />
                  <span>{formatCreatedAt(n.created_at)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="resident-not-scheduled-badge" style={{ fontSize: 9 }}>
                    <CalendarX className="h-2.5 w-2.5" />
                    Not yet scheduled
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                <button onClick={() => onDismiss(n.id)} className="text-muted-foreground hover:text-foreground transition-colors" title="Dismiss">
                  <X className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onSchedule(n)} className="resident-notification-schedule-btn">Schedule</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationBell({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="resident-notification-bell-btn" title="New residents">
      <Bell className="h-5 w-5" />
      {count > 0 && <span className="resident-notification-bell-badge">{count > 9 ? '9+' : count}</span>}
    </button>
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

  const [notifications, setNotifications] = useState<NewRequestNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef    = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<number>>(new Set());

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

  // ── Close notification panel on outside click ──────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch residents ────────────────────────────────────────────────────────
  const fetchResidents = async (url: string) => {
    try {
      const res  = await axios.get(url, { withCredentials: true });
      const json = res.data.data.data;
      const mapped: Resident[] = json.map(mapResident);
      setResidents(mapped);

      // ── Detect new residents (< 24h) for notification bell ───────────────
      const newItems = mapped.filter(
        r => isNewRequest((r as any).created_at) && !knownIdsRef.current.has(r.id as any)
      );
      if (newItems.length > 0) {
        const fresh: NewRequestNotification[] = newItems.map(r => ({
          id: r.id as any,
          residentId: r.residentId,
          full_name: r.fullName,
          created_at: (r as any).created_at,
          seen: false,
        }));
        newItems.forEach(r => knownIdsRef.current.add(r.id as any));
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          return [...fresh.filter(n => !existingIds.has(n.id)), ...prev];
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch residents');
      console.error(error);
    }
  };

  useEffect(() => {
    const url = filterValue === '' ? 'http://127.0.0.1:8000/api/residents' : filterValue;
    fetchResidents(url);
  }, [filterValue]);

  // Poll every 30 s
  useEffect(() => {
    const url = filterValue === '' ? 'http://127.0.0.1:8000/api/residents' : filterValue;
    const id = setInterval(() => fetchResidents(url), 30_000);
    return () => clearInterval(id);
  }, [filterValue]);

  // Mark all as seen when panel opens
  useEffect(() => {
    if (showNotifications)
      setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
  }, [showNotifications]);

  const unseenCount = notifications.filter(n => !n.seen).length;

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

  const handleScheduleFromNotification = (n: NewRequestNotification) => {
    const record = residents.find(r => r.id === (n.id as any));
    if (record) { openInspect(record); setShowNotifications(false); }
    else navigate(`/document-edit/6/${n.residentId}`);
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
        .resident-new-request-row{background:linear-gradient(90deg,#eff6ff 0%,transparent 100%);}
        .resident-new-request-row:hover{background:linear-gradient(90deg,#dbeafe 0%,#f8fafc 100%) !important;}
        .resident-new-dot{
          display:inline-block;width:6px;height:6px;background:#3b82f6;
          border-radius:50%;flex-shrink:0;
          animation:pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.85)}}
        .resident-notification-bell-btn{
          position:relative;display:flex;align-items:center;justify-content:center;
          width:38px;height:38px;border-radius:8px;
          border:1px solid hsl(var(--border));background:hsl(var(--card));
          color:hsl(var(--foreground));cursor:pointer;transition:background .15s;
        }
        .resident-notification-bell-btn:hover{background:hsl(var(--muted));}
        .resident-notification-bell-badge{
          position:absolute;top:-5px;right:-5px;
          background:#ef4444;color:#fff;font-size:9px;font-weight:700;
          min-width:16px;height:16px;border-radius:99px;
          display:flex;align-items:center;justify-content:center;
          padding:0 3px;border:1.5px solid hsl(var(--background));
        }
        .resident-notification-panel{
          position:absolute;top:calc(100% + 8px);right:0;width:360px;
          background:hsl(var(--card));border:1px solid hsl(var(--border));
          border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06);
          z-index:50;overflow:hidden;
        }
        .resident-notification-panel-header{
          display:flex;align-items:center;justify-content:space-between;
          padding:12px 16px;border-bottom:1px solid hsl(var(--border));
          background:hsl(var(--muted)/.4);
        }
        .resident-notification-count-badge{
          background:#3b82f6;color:#fff;font-size:10px;font-weight:700;
          min-width:18px;height:18px;border-radius:99px;
          display:inline-flex;align-items:center;justify-content:center;padding:0 4px;
        }
        .resident-notification-list{max-height:380px;overflow-y:auto;}
        .resident-notification-item{
          display:flex;align-items:flex-start;gap:8px;padding:12px 16px;
          border-bottom:1px solid hsl(var(--border)/.5);transition:background .1s;
        }
        .resident-notification-item:last-child{border-bottom:none;}
        .resident-notification-item:hover{background:hsl(var(--muted)/.4);}
        .resident-notification-item--unseen{background:#eff6ff;}
        .resident-notification-item--unseen:hover{background:#dbeafe;}
        .resident-notification-new-dot{display:inline-block;width:6px;height:6px;background:#3b82f6;border-radius:50%;flex-shrink:0;margin-top:2px;}
        .resident-notification-schedule-btn{
          font-size:10px;font-weight:600;color:#2563eb;
          background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;
          padding:2px 8px;cursor:pointer;transition:background .1s;white-space:nowrap;
        }
        .resident-notification-schedule-btn:hover{background:#dbeafe;}
      `}</style>

      {/* ── Notification bell (rendered outside the table, floating top-right) ── */}
      {/* <div className="flex justify-end mb-3">
        <div className="relative" ref={notifRef}>
          <NotificationBell count={unseenCount} onClick={() => setShowNotifications(v => !v)} />
          {showNotifications && (
            <NotificationPanel
              notifications={notifications}
              onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))}
              onDismissAll={() => setNotifications([])}
              onSchedule={handleScheduleFromNotification}
            />
          )}
        </div>
      </div> */}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="w-5 py-3 pl-3" />
                <SortHeader field="fullName">Full Name</SortHeader>
                <SortHeader field="residentId">Resident ID</SortHeader>
                <SortHeader field="verificationStatus">Verification</SortHeader>
                <SortHeader field="voterStatus">Voter</SortHeader>
                <SortHeader field="dateOfBirth">Date of Birth</SortHeader>
                <SortHeader field="sex">Sex</SortHeader>
                <SortHeader field="created_by">Created By</SortHeader>
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
              {residents.map(resident => {
                const isNew = isNewRequest((resident as any).created_at);
                return (
                  <tr key={resident.id}
                    className={isNew ? 'resident-new-request-row transition-colors' : 'hover:bg-muted/30 transition-colors'}>

                    {/* New-request dot column */}
                    <td className="pl-3 pr-0 py-3">
                      {isNew && <span className="resident-new-dot" title="New resident (< 24h)" />}
                    </td>

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

                    {/* Created By */}
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {resident.created_by}
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
                );
              })}
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
            user_id:        (inspectRecord as any).user_id
                            ?? (inspectRecord as any).created_by,
          }}
          onClose={() => setInspectRecord(null)}
          onScheduled={() => handleScheduled(inspectRecord.residentId)}
        />
      )}
    </>
  );
};