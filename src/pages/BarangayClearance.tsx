import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, MoreHorizontal, ArrowUpDown, FolderSearch,
  CalendarCheck, CalendarX, Calendar, RefreshCw, Bell, X, Clock,
  Filter, ChevronDown, SlidersHorizontal, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClearanceSearchBar } from '@/components/clearance/ClearanceSearchBar';
import { ClearancePagination } from '@/components/clearance/ClearancePagination';
import { fetchBarangayClearances, FetchClearanceParams } from '@/components/services/clearanceApi';
import { BarangayClearance as BarangayClearanceType } from '@/types/clearance';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layout } from "@/components/Layout";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deleteBarangayClearance } from '@/components/services/clearanceApi';
import DocumentInspectModal from './DocumentInspectModal';
import axios from 'axios';

// ─── Types ─────────────────────────────────────────────────────────────────────
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
  bcert_number: string;
  full_name: string;
  created_at: string;
  seen: boolean;
}

interface Street {
  id: number;
  name: string;
}

interface FilterState {
  status: string;
  filter_date: string;
  from: string;
  to: string;
  zone: string;
  street: string;
  purpose: string;
  schedule_filter: string;
}

const EMPTY_FILTERS: FilterState = {
  status: '', filter_date: '', from: '', to: '',
  zone: '', street: '', purpose: '', schedule_filter: '',
};

const PURPOSE_OPTIONS = [
  'Employment', 'Business', 'Travel', 'Legal Purposes',
  'School Requirement', 'Bank Transaction', 'Other',
];

// ─── URL param key map ─────────────────────────────────────────────────────────
// Maps FilterState keys → URL search param names
const FILTER_PARAM_KEYS: Record<keyof FilterState, string> = {
  status:          'status',
  filter_date:     'date',
  from:            'from',
  to:              'to',
  zone:            'zone',
  street:          'street',
  purpose:         'purpose',
  schedule_filter: 'schedule',
};

/** Read all filter state from URLSearchParams */
function filtersFromParams(params: URLSearchParams): FilterState {
  return {
    status:          params.get('status')   ?? '',
    filter_date:     params.get('date')     ?? '',
    from:            params.get('from')     ?? '',
    to:              params.get('to')       ?? '',
    zone:            params.get('zone')     ?? '',
    street:          params.get('street')   ?? '',
    purpose:         params.get('purpose')  ?? '',
    schedule_filter: params.get('schedule') ?? '',
  };
}

/** Write all active filters + search + page to URLSearchParams */
function buildParams(
  filters: FilterState,
  search: string,
  page: number,
): URLSearchParams {
  const p = new URLSearchParams();

  if (search)      p.set('search', search);
  if (page > 1)    p.set('page', String(page));

  (Object.keys(FILTER_PARAM_KEYS) as (keyof FilterState)[]).forEach(key => {
    const val = filters[key];
    if (val) p.set(FILTER_PARAM_KEYS[key], val);
  });

  return p;
}

// ─── API instance ──────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
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

function countActiveFilters(f: FilterState): number {
  return [
    f.status, f.filter_date,
    f.filter_date === 'custom' && f.from ? 'from' : '',
    f.zone, f.street, f.purpose, f.schedule_filter,
  ].filter(Boolean).length;
}

// ─── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  pending:    { bg: '#fef9c3', color: '#92400e', border: '#fde68a' },
  incomplete: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  rejected:   { bg: '#fff1f2', color: '#9f1239', border: '#fecdd3' },
  released:   { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  scheduled:  { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  encoded:    { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-muted-foreground text-sm">—</span>;
  const key = status.toLowerCase();
  const s   = STATUS_STYLES[key] ?? { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  );
}

// ─── Schedule Cell ─────────────────────────────────────────────────────────────
// ─── Schedule Cell ─────────────────────────────────────────────────────────────
function ScheduleCell({ schedule }: { schedule: ScheduleData | null | undefined }) {
  if (!schedule) {
    return (
      <span className="not-scheduled-badge">
        <CalendarX className="h-3 w-3" />
        Not yet scheduled
      </span>
    );
  }

  const isUpcoming = new Date(`${schedule.schedule_date}T${schedule.schedule_time}`) >= new Date();
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="schedule-badge"
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
    <div className="notification-panel">
      <div className="notification-panel-header">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-sm text-foreground">New Requests</span>
          {unseenCount > 0 && <span className="notification-count-badge">{unseenCount}</span>}
        </div>
        {notifications.length > 0 && (
          <button onClick={onDismissAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Dismiss all
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">No new requests</div>
      ) : (
        <div className="notification-list">
          {notifications.map(n => (
            <div key={n.id} className={`notification-item ${!n.seen ? 'notification-item--unseen' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!n.seen && <span className="notification-new-dot" />}
                  <span className="text-sm font-medium text-foreground truncate">{n.full_name}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <span className="font-mono">{n.bcert_number}</span>
                  <span>·</span>
                  <Clock className="h-2.5 w-2.5" />
                  <span>{formatCreatedAt(n.created_at)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="not-scheduled-badge" style={{ fontSize: 9 }}>
                    <CalendarX className="h-2.5 w-2.5" />
                    Not yet scheduled
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                <button onClick={() => onDismiss(n.id)} className="text-muted-foreground hover:text-foreground transition-colors" title="Dismiss">
                  <X className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onSchedule(n)} className="notification-schedule-btn">Schedule</button>
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
    <button onClick={onClick} className="notification-bell-btn" title="New clearance requests">
      <Bell className="h-5 w-5" />
      {count > 0 && <span className="notification-bell-badge">{count > 9 ? '9+' : count}</span>}
    </button>
  );
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────
const DATE_PERIOD_LABELS: Record<string, string> = {
  this_week: 'This week', this_month: 'This month', this_year: 'This year',
};

function FilterBar({
  filters, onChange, onReset, activeCount, streets,
}: {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  activeCount: number;
  streets: Street[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="filter-bar-wrapper">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className={`filter-toggle-btn ${activeCount > 0 ? 'filter-toggle-btn--active' : ''}`}
          onClick={() => setOpen(v => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {activeCount > 0 && <span className="filter-active-badge">{activeCount}</span>}
          <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {filters.status && (
          <span className="filter-pill">Status: <strong>{filters.status}</strong>
            <button onClick={() => onChange({ status: '' })}><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.schedule_filter && (
          <span className="filter-pill">Schedule: <strong>{filters.schedule_filter === 'scheduled' ? 'Scheduled' : 'Not yet scheduled'}</strong>
            <button onClick={() => onChange({ schedule_filter: '' })}><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.filter_date && filters.filter_date !== 'custom' && (
          <span className="filter-pill">Created: <strong>{DATE_PERIOD_LABELS[filters.filter_date]}</strong>
            <button onClick={() => onChange({ filter_date: '', from: '', to: '' })}><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.filter_date === 'custom' && (filters.from || filters.to) && (
          <span className="filter-pill">Created: <strong>{filters.from || '…'} → {filters.to || '…'}</strong>
            <button onClick={() => onChange({ filter_date: '', from: '', to: '' })}><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.zone && (
          <span className="filter-pill">Zone: <strong>{filters.zone}</strong>
            <button onClick={() => onChange({ zone: '' })}><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.street && (
          <span className="filter-pill">Street: <strong>{filters.street}</strong>
            <button onClick={() => onChange({ street: '' })}><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.purpose && (
          <span className="filter-pill">Purpose: <strong>{filters.purpose}</strong>
            <button onClick={() => onChange({ purpose: '' })}><X className="h-3 w-3" /></button>
          </span>
        )}
        {activeCount > 0 && (
          <button className="filter-reset-link" onClick={onReset}>
            <RotateCcw className="h-3 w-3" /> Reset all
          </button>
        )}
      </div>

      {open && (
        <div className="filter-panel">
          <div className="filter-panel-grid">
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <div className="filter-chip-row">
                {(['', 'PENDING', 'INCOMPLETE', 'REJECTED', 'RELEASED', 'ENCODED'] as const).map(v => (
                  <button key={v} className={`filter-chip ${filters.status === v ? 'filter-chip--on' : ''}`}
                    onClick={() => onChange({ status: v })}>
                    {v === '' ? 'All' : v.charAt(0) + v.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Schedule</label>
              <div className="filter-chip-row">
                {[
                  { v: '', label: 'All' },
                  { v: 'scheduled',     label: 'Scheduled',        icon: <CalendarCheck className="h-3 w-3" /> },
                  { v: 'not_scheduled', label: 'Not yet scheduled', icon: <CalendarX className="h-3 w-3" /> },
                ].map(opt => (
                  <button key={opt.v} className={`filter-chip ${filters.schedule_filter === opt.v ? 'filter-chip--on' : ''}`}
                    onClick={() => onChange({ schedule_filter: opt.v })}>
                    {opt.icon ?? null}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Created At</label>
              <div className="filter-chip-row">
                {[
                  { v: '', label: 'Any time' }, { v: 'this_week', label: 'This week' },
                  { v: 'this_month', label: 'This month' }, { v: 'this_year', label: 'This year' },
                  { v: 'custom', label: 'Custom range' },
                ].map(opt => (
                  <button key={opt.v} className={`filter-chip ${filters.filter_date === opt.v ? 'filter-chip--on' : ''}`}
                    onClick={() => onChange({ filter_date: opt.v, from: '', to: '' })}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {filters.filter_date === 'custom' && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <input type="date" className="filter-date-input" value={filters.from}
                    onChange={e => onChange({ from: e.target.value })} />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input type="date" className="filter-date-input" value={filters.to}
                    onChange={e => onChange({ to: e.target.value })} />
                </div>
              )}
            </div>

            <div className="filter-group">
              <label className="filter-label">Zone</label>
              <input type="text" placeholder="e.g. Zone 1, Zone 2…" className="filter-text-input"
                value={filters.zone} onChange={e => onChange({ zone: e.target.value })} />
            </div>

            <div className="filter-group">
              <label className="filter-label">Street</label>
              <select className="filter-text-input" style={{ cursor: 'pointer' }} value={filters.street}
                onChange={e => onChange({ street: e.target.value })}>
                <option value="">All streets</option>
                {streets.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Purpose</label>
              <select className="filter-text-input" style={{ cursor: 'pointer' }} value={filters.purpose}
                onChange={e => onChange({ purpose: e.target.value })}>
                <option value="">All purposes</option>
                {PURPOSE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-panel-footer">
            <button className="filter-reset-btn" onClick={onReset}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset filters
            </button>
            <button className="filter-apply-btn" onClick={() => setOpen(false)}>Apply &amp; close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const BarangayClearance = () => {
  const { toast }         = useToast();
  const navigate          = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Initialise state from URL params on first render ──────────────────────
  const [searchValue, setSearchValueRaw] = useState(() => searchParams.get('search') ?? '');
  const [currentPage, setCurrentPageRaw] = useState(() => Number(searchParams.get('page') ?? '1'));
  const [filters, setFiltersRaw]         = useState<FilterState>(() => filtersFromParams(searchParams));

  const [data, setData]               = useState<BarangayClearanceType[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [sortField, setSortField]     = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [streets, setStreets]         = useState<Street[]>([]);

  const [inspectRecord, setInspectRecord] = useState<BarangayClearanceType | null>(null);
  const [inspectMode, setInspectMode]     = useState<'inspect' | 'reschedule'>('inspect');
  // const [scheduledKeys, setScheduledKeys] = useState<Record<string, number>>({});

  const [notifications, setNotifications] = useState<NewRequestNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef    = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<number>>(new Set());

  // ── URL sync helpers ───────────────────────────────────────────────────────
  /**
   * Single source of truth: whenever search/page/filters change, call this
   * to both update local state AND push to the URL simultaneously.
   */
  const syncToUrl = useCallback((
    nextSearch: string,
    nextPage: number,
    nextFilters: FilterState,
  ) => {
    const p = buildParams(nextFilters, nextSearch, nextPage);
    // replace=true so simple filter tweaks don't spam the history stack
    setSearchParams(p, { replace: true });
  }, [setSearchParams]);

  const setSearchValue = (val: string) => {
    setSearchValueRaw(val);
    setCurrentPageRaw(1);
    syncToUrl(val, 1, filters);
  };

  const setCurrentPage = (page: number) => {
    setCurrentPageRaw(page);
    syncToUrl(searchValue, page, filters);
  };

  const setFilters = (next: FilterState | ((prev: FilterState) => FilterState)) => {
    setFiltersRaw(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      setCurrentPageRaw(1);
      syncToUrl(searchValue, 1, resolved);
      return resolved;
    });
  };

  // ── Keep state in sync if the user manually edits the URL or uses back/fwd ─
  useEffect(() => {
    setSearchValueRaw(searchParams.get('search') ?? '');
    setCurrentPageRaw(Number(searchParams.get('page') ?? '1'));
    setFiltersRaw(filtersFromParams(searchParams));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // ── Fetch streets ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('api/streets', { withCredentials: true });
        setStreets(res.data?.data ?? res.data ?? []);
      } catch (e) { console.error('Failed to fetch streets:', e); }
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchClearanceParams & Record<string, any> = {
        page:         currentPage,
        pageSize:     15,
        search:       searchValue || undefined,
        sortField,
        sortDirection,
        ...(filters.status                                           ? { status:      filters.status }      : {}),
        ...(filters.filter_date && filters.filter_date !== 'custom' ? { filter_date: filters.filter_date } : {}),
        ...(filters.filter_date === 'custom' && filters.from        ? { from:        filters.from }        : {}),
        ...(filters.filter_date === 'custom' && filters.to          ? { to:          filters.to }          : {}),
        ...(filters.zone                                            ? { zone:        filters.zone }        : {}),
        ...(filters.street                                          ? { street:      filters.street }      : {}),
        ...(filters.purpose                                         ? { purpose:     filters.purpose }     : {}),
        ...(filters.schedule_filter                                 ? { schedule_filter: filters.schedule_filter } : {}),
      };

      console.log('Fetching with params:', params);

      const response = await fetchBarangayClearances(params);
      const rows = response.data as any[];
      setData(rows);
      setTotal(response.total);
      setTotalPages(response.totalPages);

      const newItems = rows.filter(
        item => isNewRequest(item.created_at) && !knownIdsRef.current.has(item.id)
      );
      if (newItems.length > 0) {
        const fresh: NewRequestNotification[] = newItems.map(item => ({
          id: item.id, bcert_number: item.bcert_number,
          full_name: `${item.first_name} ${item.middle_name ?? ''} ${item.surname}`.trim(),
          created_at: item.created_at, seen: false,
        }));
        newItems.forEach(item => knownIdsRef.current.add(item.id));
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          return [...fresh.filter(n => !existingIds.has(n.id)), ...prev];
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchValue, sortField, sortDirection, filters, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Poll every 30 s
  useEffect(() => {
    const id = setInterval(loadData, 30_000);
    return () => clearInterval(id);
  }, [loadData]);

  useEffect(() => {
    if (showNotifications)
      setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
  }, [showNotifications]);

  const unseenCount = notifications.filter(n => !n.seen).length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const handleRefresh = () => {
    loadData();
    toast({ title: 'Refreshed', description: 'Data has been refreshed' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this clearance?')) return;
    try {
      await deleteBarangayClearance(id);
      toast({ title: 'Deleted', description: 'Clearance deleted successfully.' });
      loadData();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete clearance.', variant: 'destructive' });
    }
  };

  const handleScheduled = () => {
    loadData();
  };

  const openInspect = (item: BarangayClearanceType) => {
    setInspectMode('inspect');
    setInspectRecord(item);
  };

  const openReschedule = (item: BarangayClearanceType) => {
    setInspectMode('reschedule');
    setInspectRecord(item);
  };

  const handleScheduleFromNotification = (n: NewRequestNotification) => {
    const record = data.find(d => d.id === n.id);
    if (record) { openInspect(record); setShowNotifications(false); }
    else navigate(`/document-edit/2/${n.bcert_number}`);
  };

  const activeFilterCount = countActiveFilters(filters);

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'opacity-40'}`} />
      </div>
    </th>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <style>{`
        .not-scheduled-badge {
          display:inline-flex;align-items:center;gap:4px;
          font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
          padding:2px 7px;background:#fff7ed;color:#c2410c;
          border:1px solid #fed7aa;border-radius:3px;
        }
        .schedule-badge {
          display:inline-flex;align-items:center;gap:4px;
          font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
          padding:2px 7px;border-radius:3px;width:fit-content;
        }
        .new-request-row{background:linear-gradient(90deg,#eff6ff 0%,transparent 100%);}
        .new-request-row:hover{background:linear-gradient(90deg,#dbeafe 0%,#f8fafc 100%) !important;}
        .new-dot{
          display:inline-block;width:6px;height:6px;background:#3b82f6;
          border-radius:50%;flex-shrink:0;
          animation:pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.85)}}
        .notification-bell-btn{
          position:relative;display:flex;align-items:center;justify-content:center;
          width:38px;height:38px;border-radius:8px;
          border:1px solid hsl(var(--border));background:hsl(var(--card));
          color:hsl(var(--foreground));cursor:pointer;transition:background .15s;
        }
        .notification-bell-btn:hover{background:hsl(var(--muted));}
        .notification-bell-badge{
          position:absolute;top:-5px;right:-5px;
          background:#ef4444;color:#fff;font-size:9px;font-weight:700;
          min-width:16px;height:16px;border-radius:99px;
          display:flex;align-items:center;justify-content:center;
          padding:0 3px;border:1.5px solid hsl(var(--background));
        }
        .notification-panel{
          position:absolute;top:calc(100% + 8px);right:0;width:360px;
          background:hsl(var(--card));border:1px solid hsl(var(--border));
          border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06);
          z-index:50;overflow:hidden;
        }
        .notification-panel-header{
          display:flex;align-items:center;justify-content:space-between;
          padding:12px 16px;border-bottom:1px solid hsl(var(--border));
          background:hsl(var(--muted)/.4);
        }
        .notification-count-badge{
          background:#3b82f6;color:#fff;font-size:10px;font-weight:700;
          min-width:18px;height:18px;border-radius:99px;
          display:inline-flex;align-items:center;justify-content:center;padding:0 4px;
        }
        .notification-list{max-height:380px;overflow-y:auto;}
        .notification-item{
          display:flex;align-items:flex-start;gap:8px;padding:12px 16px;
          border-bottom:1px solid hsl(var(--border)/.5);transition:background .1s;
        }
        .notification-item:last-child{border-bottom:none;}
        .notification-item:hover{background:hsl(var(--muted)/.4);}
        .notification-item--unseen{background:#eff6ff;}
        .notification-item--unseen:hover{background:#dbeafe;}
        .notification-new-dot{display:inline-block;width:6px;height:6px;background:#3b82f6;border-radius:50%;flex-shrink:0;margin-top:2px;}
        .notification-schedule-btn{
          font-size:10px;font-weight:600;color:#2563eb;
          background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;
          padding:2px 8px;cursor:pointer;transition:background .1s;white-space:nowrap;
        }
        .notification-schedule-btn:hover{background:#dbeafe;}
        .filter-bar-wrapper{display:flex;flex-direction:column;gap:8px;position:relative;}
        .filter-toggle-btn{
          display:inline-flex;align-items:center;gap:6px;
          height:36px;padding:0 14px;border-radius:8px;
          border:1px solid hsl(var(--border));background:hsl(var(--card));
          color:hsl(var(--muted-foreground));font-size:13px;font-weight:500;
          cursor:pointer;transition:all .15s;white-space:nowrap;
        }
        .filter-toggle-btn:hover{background:hsl(var(--muted));color:hsl(var(--foreground));}
        .filter-toggle-btn--active{border-color:#3b82f6;color:#1d4ed8;background:#eff6ff;}
        .filter-active-badge{
          background:#3b82f6;color:#fff;font-size:10px;font-weight:700;
          min-width:18px;height:18px;border-radius:99px;
          display:inline-flex;align-items:center;justify-content:center;padding:0 4px;
        }
        .filter-pill{
          display:inline-flex;align-items:center;gap:5px;
          font-size:11px;padding:3px 8px 3px 10px;
          background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;border-radius:99px;
        }
        .filter-pill button{display:flex;align-items:center;color:#60a5fa;cursor:pointer;}
        .filter-pill button:hover{color:#1e40af;}
        .filter-reset-link{
          display:inline-flex;align-items:center;gap:4px;
          font-size:11px;color:hsl(var(--muted-foreground));cursor:pointer;
          padding:3px 6px;border-radius:4px;transition:color .1s;border:none;background:none;
        }
        .filter-reset-link:hover{color:hsl(var(--foreground));}
        .filter-panel{
          position:absolute;top:calc(100% + 4px);right:0;min-width:600px;
          border:1px solid hsl(var(--border));border-radius:10px;
          background:hsl(var(--card));
          box-shadow:0 8px 32px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06);
          z-index:50;overflow:hidden;
        }
        .filter-panel-grid{display:grid;grid-template-columns:1fr 1fr;}
        .filter-group{
          padding:14px 18px;border-bottom:1px solid hsl(var(--border)/.6);
          border-right:1px solid hsl(var(--border)/.6);
        }
        .filter-group:nth-child(2n){border-right:none;}
        .filter-group:nth-last-child(-n+2):nth-child(odd),.filter-group:last-child{border-bottom:none;}
        .filter-group:last-child{border-right:none;}
        .filter-label{
          display:block;font-size:10px;font-weight:700;text-transform:uppercase;
          letter-spacing:.07em;color:hsl(var(--muted-foreground));margin-bottom:8px;
        }
        .filter-chip-row{display:flex;flex-wrap:wrap;gap:5px;}
        .filter-chip{
          display:inline-flex;align-items:center;gap:4px;
          font-size:11px;font-weight:500;padding:3px 10px;
          border:1px solid hsl(var(--border));border-radius:99px;
          background:hsl(var(--background));color:hsl(var(--muted-foreground));
          cursor:pointer;transition:all .12s;
        }
        .filter-chip:hover{border-color:#93c5fd;color:#1e40af;background:#f0f9ff;}
        .filter-chip--on{background:#1d4ed8;color:#fff;border-color:#1d4ed8;}
        .filter-chip--on:hover{background:#1e40af;}
        .filter-date-input{
          height:32px;padding:0 10px;border-radius:6px;
          border:1px solid hsl(var(--border));background:hsl(var(--background));
          font-size:12px;color:hsl(var(--foreground));outline:none;transition:border-color .15s;
        }
        .filter-date-input:focus{border-color:#3b82f6;}
        .filter-text-input{
          width:100%;height:32px;padding:0 10px;border-radius:6px;
          border:1px solid hsl(var(--border));background:hsl(var(--background));
          font-size:12px;color:hsl(var(--foreground));outline:none;transition:border-color .15s;
        }
        .filter-text-input:focus{border-color:#3b82f6;}
        .filter-text-input::placeholder{color:hsl(var(--muted-foreground));}
        .filter-panel-footer{
          display:flex;align-items:center;justify-content:flex-end;gap:8px;
          padding:10px 18px;background:hsl(var(--muted)/.3);border-top:1px solid hsl(var(--border));
        }
        .filter-reset-btn{
          display:inline-flex;align-items:center;gap:5px;
          font-size:12px;font-weight:500;color:hsl(var(--muted-foreground));
          padding:6px 12px;border-radius:6px;
          border:1px solid hsl(var(--border));background:hsl(var(--background));
          cursor:pointer;transition:all .12s;
        }
        .filter-reset-btn:hover{color:hsl(var(--foreground));border-color:hsl(var(--foreground)/.3);}
        .filter-apply-btn{
          display:inline-flex;align-items:center;gap:5px;
          font-size:12px;font-weight:600;color:#fff;padding:6px 16px;border-radius:6px;
          background:#1d4ed8;border:none;cursor:pointer;transition:background .12s;
        }
        .filter-apply-btn:hover{background:#1e40af;}
      `}</style>

      <div className="p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Barangay Clearance</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage barangay clearance records</p>
            </div>
            <div className="flex items-center gap-2">
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
              <Button className="gap-2" onClick={() => navigate('/document-edit/2')}>
                <Plus className="h-4 w-4" />
                New Clearance
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-2 flex-wrap" style={{ position: 'relative', zIndex: 40 }}>
            <div className="flex-1 min-w-[200px]">
              <ClearanceSearchBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onRefresh={handleRefresh}
              />
            </div>
            <FilterBar
              filters={filters}
              onChange={patch => setFilters(prev => ({ ...prev, ...patch }))}
              onReset={() => setFilters(EMPTY_FILTERS)}
              activeCount={activeFilterCount}
              streets={streets}
            />
          </div>

          {/* Active filter summary line */}
          {(activeFilterCount > 0 || searchValue) && !isLoading && (
            <p className="text-xs text-muted-foreground mb-3 mt-1">
              Showing <strong className="text-foreground">{total}</strong> result{total !== 1 ? 's' : ''}
              {activeFilterCount > 0 && <> with <strong className="text-foreground">{activeFilterCount}</strong> active filter{activeFilterCount !== 1 ? 's' : ''}</>}
              {searchValue && <> for <strong className="text-foreground">"{searchValue}"</strong></>}
            </p>
          )}

          <div className="bg-card rounded-lg border border-border overflow-hidden mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Filter className="h-9 w-9 opacity-25" />
                <p className="text-sm font-medium">No records match your filters.</p>
                {(activeFilterCount > 0 || searchValue) && (
                  <button className="text-xs text-blue-600 hover:underline"
                    onClick={() => { setFilters(EMPTY_FILTERS); setSearchValue(''); }}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="w-5 py-3 pl-3" />
                      <SortHeader field="fullName">Full Name</SortHeader>
                      <SortHeader field="bcertNumber">BCert No.</SortHeader>
                      <SortHeader field="created_at">Created At</SortHeader>
                      <SortHeader field="zone">Zone</SortHeader>
                      <SortHeader field="street">Street</SortHeader>
                      <SortHeader field="dateOfBirth">Date of Birth</SortHeader>
                      <SortHeader field="status">Status</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Schedule
                        </div>
                      </th>
                      <SortHeader field="created_by">Created By</SortHeader>
                      <SortHeader field="purpose">Purpose</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.map(item => {
                      const isNew = isNewRequest((item as any).created_at);
                      return (
                        <tr key={item.id}
                          className={isNew ? 'new-request-row transition-colors' : 'hover:bg-muted/30 transition-colors'}>
                          <td className="pl-3 pr-0 py-3">
                            {isNew && <span className="new-dot" title="New request (< 24h)" />}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-primary whitespace-nowrap">
                            {`${item.first_name} ${item.middle_name ?? ''} ${item.surname}${item.ext_name ? ` ${item.ext_name}` : ''}`.trim()}
                          </td>
                          <td className="py-3 px-4 text-sm font-mono text-primary">{item.bcert_number}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span>{formatCreatedAt((item as any).created_at)}</span>
                              {isNew && (
                                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#3b82f6' }}>New</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{item.zone ?? '—'}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {`${item.house_block_lot_no ? item.house_block_lot_no + ' ' : ''}${item.street ?? ''}`.trim() || '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(item.dob).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm"><StatusBadge status={item.status} /></td>
                          <td className="py-3 px-4">
                            <ScheduleCell schedule={(item as any).schedule ?? null} />
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{item.created_by}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{item.purpose}</td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="cursor-pointer"
                                  onClick={() => navigate(`/document-edit/2/${item.bcert_number}`)}>
                                  View / Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer"
                                  onClick={() => navigate(`/document-edit/2/${item.bcert_number}`, { state: { autoPrint: true } })}>
                                  Print
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="cursor-pointer flex items-center gap-2 font-medium"
                                  style={{ color: '#0f2a5e' }}
                                  onClick={() => openInspect(item)}
                                >
                                  <FolderSearch className="h-3.5 w-3.5" />
                                  Inspect Docs &amp; Schedule
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer flex items-center gap-2"
                                  onClick={() => openReschedule(item)}
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  Reschedule
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive cursor-pointer"
                                  onClick={() => handleDelete(Number(item.id))}
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
            )}
          </div>

          <ClearancePagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {inspectRecord && (
        <DocumentInspectModal
          mode={inspectMode}
          record={{
            id:             inspectRecord.id,
            bcert_number:   inspectRecord.bcert_number,
            first_name:     inspectRecord.first_name,
            surname:        inspectRecord.surname,
            document_type:  'barangay_clearance',
            scheduled_date: (inspectRecord as any).scheduled_date ?? null,
            user_id:        (inspectRecord as any).user_id,
          }}
          onClose={() => setInspectRecord(null)}
          onScheduled={() => handleScheduled(inspectRecord.bcert_number)}
        />
      )}
    </Layout>
  );
};

export default BarangayClearance;