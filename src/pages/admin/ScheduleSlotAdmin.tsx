import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Clock, Users, Plus, MoreHorizontal, Eye, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layout } from '@/components/Layout';

const API_BASE = 'https://westrembomis.onrender.com/api';

interface ScheduleSlot {
  id: number;
  document_type: string;
  schedule_time: string;
  max_slots: number;
  created_at?: string;
  updated_at?: string;
}

interface FormData {
  document_type: string;
  schedule_time: string;
  max_slots: string;
}

const DOCUMENT_TYPES = [
  { value: 'barangay_clearance', label: 'Barangay Clearance' },
  { value: 'business_clearance', label: 'Business Clearance' },
  { value: 'building_clearance', label: 'Building Clearance' },
  { value: 'barangay_certificate', label: 'Barangay Certificate' },
];

interface TimeSlot {
  time24: string;
  time12: string;
  display: string;
}

const AVAILABLE_HOURS: TimeSlot[] = Array.from({ length: 13 }, (_, i) => {
  const hour = 6 + i;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const time24 = `${String(hour).padStart(2, '0')}:00`;
  const time12 = `${String(displayHour).padStart(2, '0')}:00 ${period}`;
  return { time24, time12, display: time12 };
});

// ─── Component ───────────────────────────────────────────────────────────────
const ScheduleSlotsAdmin = () => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingSlot, setViewingSlot] = useState<ScheduleSlot | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterDocType, setFilterDocType] = useState<string>('');

  const [form, setForm] = useState<FormData>({
    document_type: '',
    schedule_time: '',
    max_slots: '',
  });

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/schedule-slots`, { withCredentials: true });
      const data: ScheduleSlot[] = res.data?.data ?? res.data ?? [];
      setSlots(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Failed to Load Slots',
        description: err.response?.data?.message ?? err.message ?? 'Could not fetch schedule slots.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Dialog helpers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingSlot(null);
    setForm({ document_type: '', schedule_time: '', max_slots: '' });
    setDialogOpen(true);
  };

  const openEdit = (s: ScheduleSlot) => {
    setEditingSlot(s);
    setForm({
      document_type: s.document_type,
      schedule_time: s.schedule_time,
      max_slots: String(s.max_slots),
    });
    setDialogOpen(true);
  };

  const openView = (s: ScheduleSlot) => {
    setViewingSlot(s);
    setViewDialogOpen(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.document_type || !form.schedule_time || !form.max_slots) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    const maxSlots = parseInt(form.max_slots);
    if (isNaN(maxSlots) || maxSlots < 1) {
      toast({
        title: 'Validation Error',
        description: 'Max slots must be a positive number.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      document_type: form.document_type,
      schedule_time: form.schedule_time,
      max_slots: maxSlots,
    };

    setIsSaving(true);
    try {
      if (editingSlot) {
        // Update
        const res = await axios.put(
          `${API_BASE}/schedule-slots/${editingSlot.id}`,
          payload,
          { withCredentials: true },
        );

        const updated: ScheduleSlot = { ...editingSlot, ...payload, ...(res.data?.data ?? {}) };
        setSlots(prev => prev.map(s => (s.id === editingSlot.id ? updated : s)));

        toast({
          title: 'Slot Updated',
          description: `${form.document_type} at ${form.schedule_time} has been updated.`,
        });
      } else {
        // Create
        const res = await axios.post(
          `${API_BASE}/schedule-slots`,
          payload,
          { withCredentials: true },
        );

        const newSlot: ScheduleSlot = res.data?.data ?? { ...payload, id: Date.now() };
        setSlots(prev => [...prev, newSlot]);

        toast({
          title: 'Slot Created',
          description: `${form.document_type} at ${form.schedule_time} has been created.`,
        });
      }

      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message ?? err.message ?? 'An error occurred';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE}/schedule-slots/${deleteId}`, { withCredentials: true });
      setSlots(prev => prev.filter(s => s.id !== deleteId));
      toast({
        title: 'Slot Deleted',
        description: 'The schedule slot has been removed.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.response?.data?.message ?? 'Failed to delete slot.',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  // ── Filters & Stats ────────────────────────────────────────────────────────
  const filteredSlots = filterDocType
    ? slots.filter(s => s.document_type === filterDocType)
    : slots;

  const docTypeStats = DOCUMENT_TYPES.map(dt => ({
    ...dt,
    count: slots.filter(s => s.document_type === dt.value).length,
  }));

  const totalCapacity = slots.reduce((sum, s) => sum + s.max_slots, 0);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[1400px] mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Schedule Slots Management</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage appointment slots for document processing</p>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Slot
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{slots.length}</p>
                  <p className="text-xs text-muted-foreground">Total Slots</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCapacity}</p>
                  <p className="text-xs text-muted-foreground">Total Capacity</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{DOCUMENT_TYPES.length}</p>
                  <p className="text-xs text-muted-foreground">Document Types</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{docTypeStats.reduce((sum, dt) => sum + (dt.count > 0 ? 1 : 0), 0)}</p>
                  <p className="text-xs text-muted-foreground">Types Configured</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <Button
              variant={filterDocType === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterDocType('')}
              className="gap-2"
            >
              All Types ({slots.length})
            </Button>
            {DOCUMENT_TYPES.map(dt => {
              const count = docTypeStats.find(s => s.value === dt.value)?.count ?? 0;
              return (
                <Button
                  key={dt.value}
                  variant={filterDocType === dt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterDocType(dt.value)}
                  className="gap-2"
                >
                  {dt.label} ({count})
                </Button>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Document Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Time Slot</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Max Capacity</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                      </td>
                    </tr>
                  ) : filteredSlots.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            {filterDocType ? 'No slots found for this document type' : 'No schedule slots configured'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSlots.map(s => {
                    const docTypeName = DOCUMENT_TYPES.find(dt => dt.value === s.document_type)?.label || s.document_type;
                    return (
                      <tr key={s.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="font-medium">{docTypeName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono font-semibold text-base">{s.schedule_time}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            {s.max_slots} slots
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openView(s)}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(s)}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(s.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
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

          {/* View Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Slot Details</DialogTitle>
              </DialogHeader>
              {viewingSlot && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Document Type</Label>
                    <p className="text-lg font-semibold">
                      {DOCUMENT_TYPES.find(dt => dt.value === viewingSlot.document_type)?.label}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Time Slot</Label>
                      <div className="flex items-center gap-2 text-lg font-bold">
                        <Clock className="h-5 w-5 text-primary" />
                        {viewingSlot.schedule_time}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Max Capacity</Label>
                      <div className="flex items-center gap-2 text-lg font-bold">
                        <Users className="h-5 w-5 text-primary" />
                        {viewingSlot.max_slots}
                      </div>
                    </div>
                  </div>

                  {viewingSlot.created_at && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(viewingSlot.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create/Edit Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingSlot ? 'Edit Schedule Slot' : 'Create New Schedule Slot'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Document Type */}
                <div className="space-y-2">
                  <Label htmlFor="doc-type">Document Type *</Label>
                  <select
                    id="doc-type"
                    value={form.document_type}
                    onChange={(e) => setForm(f => ({ ...f, document_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select document type...</option>
                    {DOCUMENT_TYPES.map(dt => (
                      <option key={dt.value} value={dt.value}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Type of document this slot applies to</p>
                </div>

                {/* Time Slot */}
                <div className="space-y-2">
                  <Label htmlFor="time-slot">Schedule Time (06:00 AM - 06:00 PM) *</Label>
                  <select
                    id="time-slot"
                    value={form.schedule_time}
                    onChange={(e) => setForm(f => ({ ...f, schedule_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select time...</option>
                    {AVAILABLE_HOURS.map(slot => (
                      <option key={slot.time24} value={slot.time24}>
                        {slot.display}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Only full hour slots allowed (12-hour format)</p>
                </div>

                {/* Max Slots */}
                <div className="space-y-2">
                  <Label htmlFor="max-slots">Maximum Capacity *</Label>
                  <Input
                    id="max-slots"
                    type="number"
                    min="1"
                    max="100"
                    value={form.max_slots}
                    onChange={(e) => setForm(f => ({ ...f, max_slots: e.target.value }))}
                    placeholder="Enter maximum number of slots"
                  />
                  <p className="text-xs text-muted-foreground">Number of appointments this slot can accommodate</p>
                </div>

                {/* Info Box */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    💡 Slots are limited to hourly intervals in 12-hour format (06:00 AM - 06:00 PM). 13 slots available.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !form.document_type || !form.schedule_time || !form.max_slots}
                >
                  {isSaving ? 'Saving…' : editingSlot ? 'Update Slot' : 'Create Slot'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Schedule Slot</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this schedule slot? This action cannot be undone and may affect existing user schedules.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </Layout>
  );
};

export default ScheduleSlotsAdmin;
