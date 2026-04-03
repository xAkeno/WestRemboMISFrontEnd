import { useState, useEffect, useCallback } from 'react';
import {
  Plus, MoreHorizontal, ArrowUpDown, FolderSearch,
  CalendarCheck, CalendarX, Calendar, RefreshCw,
  X, Filter, ChevronDown, SlidersHorizontal, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClearanceSearchBar } from '@/components/clearance/ClearanceSearchBar';
import { ClearancePagination } from '@/components/clearance/ClearancePagination';
import { fetchCertificates, FetchClearanceParams } from '@/components/services/clearanceApi';
import { Certificate as CertificateType } from '@/types/clearance';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layout } from "@/components/Layout";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DocumentInspectModal from './DocumentInspectModal';

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

interface FilterState {
  status: string;
  filter_date: string;
  from: string;
  to: string;
  purpose: string;
  schedule_filter: string;
}

const EMPTY_FILTERS: FilterState = {
  status: '', filter_date: '', from: '', to: '',
  purpose: '', schedule_filter: '',
};

const PURPOSE_OPTIONS = [
  'Employment',
  'Business',
  'Travel',
  'Legal Purposes',
  'School Requirement',
  'Bank Transaction',
  'Other',
];

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

function countActiveFilters(f: FilterState): number {
  return [
    f.status,
    f.filter_date,
    f.filter_date === 'custom' && f.from ? 'from' : '',
    f.purpose,
    f.schedule_filter,
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
function ScheduleCell({ bcertNumber }: { bcertNumber: string }) {
  const [schedule, setSchedule] = useState<ScheduleData | null | undefined>(undefined);

  useEffect(() => {
    if (!bcertNumber) { setSchedule(null); return; }
    let cancelled = false;
    api.get(`/api/schedules/${bcertNumber}`)
      .then(({ data }) => { if (!cancelled) setSchedule(data?.data ?? null); })
      .catch(() => { if (!cancelled) setSchedule(null); });
    return () => { cancelled = true; };
  }, [bcertNumber]);

  if (schedule === undefined)
    return <div className="h-5 w-28 rounded animate-pulse bg-muted" />;

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

// ─── Filter Bar ────────────────────────────────────────────────────────────────
const DATE_PERIOD_LABELS: Record<string, string> = {
  this_week: 'This week', this_month: 'This month', this_year: 'This year',
};

function FilterBar({
  filters, onChange, onReset, activeCount,
}: {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  activeCount: number;
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
          <span className="filter-pill">
            Status: <strong>{filters.status}</strong>
            <button onClick={() => onChange({ status: '' })}><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.schedule_filter && (
          <span className="filter-pill">
            Schedule: <strong>{filters.schedule_filter === 'scheduled' ? 'Scheduled' : 'Not yet scheduled'}</strong>
            <button onClick={() => onChange({ schedule_filter: '' })}><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.filter_date && filters.filter_date !== 'custom' && (
          <span className="filter-pill">
            Created: <strong>{DATE_PERIOD_LABELS[filters.filter_date]}</strong>
            <button onClick={() => onChange({ filter_date: '', from: '', to: '' })}><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.filter_date === 'custom' && (filters.from || filters.to) && (
          <span className="filter-pill">
            Created: <strong>{filters.from || '…'} → {filters.to || '…'}</strong>
            <button onClick={() => onChange({ filter_date: '', from: '', to: '' })}><X className="h-3 w-3" /></button>
          </span>
        )}
        {filters.purpose && (
          <span className="filter-pill">
            Purpose: <strong>{filters.purpose}</strong>
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
                  <button
                    key={v}
                    className={`filter-chip ${filters.status === v ? 'filter-chip--on' : ''}`}
                    onClick={() => onChange({ status: v })}
                  >
                    {v === '' ? 'All' : v.charAt(0) + v.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Schedule</label>
              <div className="filter-chip-row">
                {[
                  { v: '',              label: 'All' },
                  { v: 'scheduled',     label: 'Scheduled',        icon: <CalendarCheck className="h-3 w-3" /> },
                  { v: 'not_scheduled', label: 'Not yet scheduled', icon: <CalendarX className="h-3 w-3" /> },
                ].map(opt => (
                  <button
                    key={opt.v}
                    className={`filter-chip ${filters.schedule_filter === opt.v ? 'filter-chip--on' : ''}`}
                    onClick={() => onChange({ schedule_filter: opt.v })}
                  >
                    {opt.icon ?? null}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Created At</label>
              <div className="filter-chip-row">
                {[
                  { v: '',           label: 'Any time' },
                  { v: 'this_week',  label: 'This week' },
                  { v: 'this_month', label: 'This month' },
                  { v: 'this_year',  label: 'This year' },
                  { v: 'custom',     label: 'Custom range' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    className={`filter-chip ${filters.filter_date === opt.v ? 'filter-chip--on' : ''}`}
                    onClick={() => onChange({ filter_date: opt.v, from: '', to: '' })}
                  >
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
              <label className="filter-label">Purpose</label>
              <select className="filter-text-input" style={{ cursor: 'pointer' }}
                value={filters.purpose} onChange={e => onChange({ purpose: e.target.value })}>
                <option value="">All purposes</option>
                {PURPOSE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

          </div>
          <div className="filter-panel-footer">
            <button className="filter-reset-btn" onClick={onReset}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset filters
            </button>
            <button className="filter-apply-btn" onClick={() => setOpen(false)}>
              Apply &amp; close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const Certificate = () => {
  const { toast }  = useToast();
  const navigate   = useNavigate();

  const [data, setData]               = useState<CertificateType[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField]     = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters]         = useState<FilterState>(EMPTY_FILTERS);

  const [inspectRecord, setInspectRecord] = useState<CertificateType | null>(null);
  const [inspectMode, setInspectMode]     = useState<'inspect' | 'reschedule'>('inspect');
  const [scheduledKeys, setScheduledKeys] = useState<Record<string, number>>({});

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
        ...(filters.purpose                                         ? { purpose:     filters.purpose }     : {}),
      };

      const response = await fetchCertificates(params);
      setData(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchValue, sortField, sortDirection, filters, toast]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setCurrentPage(1); }, [searchValue, filters]);

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
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;
    try {
      const { deleteBarangayClearance } = await import('@/components/services/clearanceApi');
      await deleteBarangayClearance(id);
      toast({ title: 'Deleted', description: 'Certificate deleted successfully.' });
      loadData();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete certificate.', variant: 'destructive' });
    }
  };

  const handleScheduled = (bcertNumber?: string) => {
    loadData();
    if (bcertNumber)
      setScheduledKeys(prev => ({ ...prev, [bcertNumber]: (prev[bcertNumber] ?? 0) + 1 }));
  };

  const openInspect = (item: CertificateType) => {
    setInspectMode('inspect');
    setInspectRecord(item);
  };

  const openReschedule = (item: CertificateType) => {
    setInspectMode('reschedule');
    setInspectRecord(item);
  };

  const activeFilterCount = countActiveFilters(filters);

  // ── Sort Header ────────────────────────────────────────────────────────────
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
        .filter-bar-wrapper{display:flex;flex-direction:column;gap:8px;position:relative;}
        .filter-toggle-btn{
          display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px;border-radius:8px;
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
          display:inline-flex;align-items:center;gap:5px;font-size:11px;
          padding:3px 8px 3px 10px;background:#eff6ff;color:#1e40af;
          border:1px solid #bfdbfe;border-radius:99px;
        }
        .filter-pill button{display:flex;align-items:center;color:#60a5fa;cursor:pointer;}
        .filter-pill button:hover{color:#1e40af;}
        .filter-reset-link{
          display:inline-flex;align-items:center;gap:4px;font-size:11px;
          color:hsl(var(--muted-foreground));cursor:pointer;padding:3px 6px;
          border-radius:4px;transition:color .1s;border:none;background:none;
        }
        .filter-reset-link:hover{color:hsl(var(--foreground));}
        .filter-panel{
          position:absolute;top:calc(100% + 4px);right:0;min-width:560px;
          border:1px solid hsl(var(--border));border-radius:10px;background:hsl(var(--card));
          box-shadow:0 8px 32px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06);z-index:50;overflow:hidden;
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
          display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:500;
          padding:3px 10px;border:1px solid hsl(var(--border));border-radius:99px;
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
          display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:500;
          color:hsl(var(--muted-foreground));padding:6px 12px;border-radius:6px;
          border:1px solid hsl(var(--border));background:hsl(var(--background));
          cursor:pointer;transition:all .12s;
        }
        .filter-reset-btn:hover{color:hsl(var(--foreground));border-color:hsl(var(--foreground)/.3);}
        .filter-apply-btn{
          display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;
          color:#fff;padding:6px 16px;border-radius:6px;
          background:#1d4ed8;border:none;cursor:pointer;transition:background .12s;
        }
        .filter-apply-btn:hover{background:#1e40af;}
      `}</style>

      <div className="p-6">
        <div className="max-w-[1600px] mx-auto">

          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Certificate</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage certificate records</p>
            </div>
            <Button className="gap-2" onClick={() => navigate('/document-edit/1')}>
              <Plus className="h-4 w-4" />
              New Certificate
            </Button>
          </div>

          {/* ── Search + Filter row ── */}
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
            />
          </div>

          {activeFilterCount > 0 && !isLoading && (
            <p className="text-xs text-muted-foreground mb-3 mt-1">
              Showing <strong className="text-foreground">{total}</strong> result{total !== 1 ? 's' : ''} with {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
            </p>
          )}

          {/* ── Table card ── */}
          <div className="bg-card rounded-lg border border-border overflow-hidden mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Filter className="h-9 w-9 opacity-25" />
                <p className="text-sm font-medium">No records match your filters.</p>
                {activeFilterCount > 0 && (
                  <button className="text-xs text-blue-600 hover:underline" onClick={() => setFilters(EMPTY_FILTERS)}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <SortHeader field="bcert_number">BCert No.</SortHeader>
                      <SortHeader field="surname">Full Name</SortHeader>
                      <SortHeader field="issued_date">Issue Date</SortHeader>
                      <SortHeader field="age">Age</SortHeader>
                      <SortHeader field="purpose">Purpose</SortHeader>
                      <SortHeader field="status">Status</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Schedule
                        </div>
                      </th>
                      <SortHeader field="created_at">Date Created</SortHeader>
                      <SortHeader field="created_by">Created By</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.map(item => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">

                        {/* BCert No. */}
                        <td className="py-3 px-4 text-sm font-mono text-primary">
                          {item.bcert_number}
                        </td>

                        {/* Full Name — fixed: was rendering bcert_number in first column */}
                        <td className="py-3 px-4 text-sm font-medium whitespace-nowrap">
                          {`${item.firstname} ${item.middle_name ?? ''} ${item.surname}${item.extension ? ` ${item.extension}` : ''}`.trim()}
                        </td>

                        {/* Issue Date */}
                        <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          {item.issued_date
                            ? new Date(item.issued_date).toLocaleDateString()
                            : '—'}
                        </td>

                        {/* Age */}
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {item.age ?? '—'}
                        </td>

                        {/* Purpose */}
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {item.purpose ?? '—'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Schedule */}
                        <td className="py-3 px-4">
                          {item.bcert_number ? (
                            <ScheduleCell
                              key={`${item.bcert_number}-${scheduledKeys[item.bcert_number] ?? 0}`}
                              bcertNumber={item.bcert_number}
                            />
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Date Created — fixed: was duplicating issued_date */}
                        <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString()
                            : '—'}
                        </td>

                        {/* Created By */}
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {item.created_by ?? '—'}
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
                                onClick={() => navigate(`/document-edit/5/${item.bcert_number}`)}
                              >
                                View / Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => navigate(`/document-edit/5/${item.bcert_number}`, { state: { autoPrint: true } })}
                              >
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
                    ))}
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

      {/* ── Inspect / Reschedule Modal ── */}
      {inspectRecord && (
        <DocumentInspectModal
          mode={inspectMode}
          record={{
            id:             inspectRecord.id,
            bcert_number:   inspectRecord.bcert_number,
            first_name:     inspectRecord.firstname,
            surname:        inspectRecord.surname,
            document_type:  'barangay_certificate',
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

export default Certificate;