import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Clock, DollarSign, FileText, MoreHorizontal, Eye, Lock } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const API_BASE = `${import.meta.env.VITE_WEB_URL}/api`;
const STORAGE_KEY = 'services_overrides';

interface Service {
  id: number;
  name: string;
  description: string;
  requirements: string | string[];
  processing_time: string;
  fee: string;
}

const defaultServices: Service[] = [
  { id: 1, name: 'Resident Registration', description: 'Register as a resident of Barangay West Rembo to access various barangay services and programs.', requirements: ["Valid government ID", "Proof of residence (utility bill, lease contract)", "2x2 ID photos (2 pieces)", "Accomplished registration form"], processing_time: '1-2 business days', fee: 'Free' },
  { id: 2, name: 'Barangay Clearance', description: 'Obtain a clearance certificate from Barangay West Rembo.', requirements: ["Valid ID", "Proof of residence", "Clearance application form"], processing_time: '1 business day', fee: 'Free' },
  { id: 3, name: 'Business Clearance', description: 'Apply for a business clearance to operate legally in Barangay West Rembo.', requirements: ["Business permit", "Valid ID", "Completed application form"], processing_time: '2-3 business days', fee: 'Free' },
  { id: 4, name: 'Building Clearance', description: 'Obtain building clearance for construction or renovation.', requirements: ["Building permit", "ID of applicant", "Application form"], processing_time: '3-5 business days', fee: 'Free' },
  { id: 5, name: 'Barangay Certificate', description: 'Get official certification from Barangay West Rembo.', requirements: ["Valid ID", "Purpose of certificate", "Application form"], processing_time: '1-2 business days', fee: 'Free' },
];

// ─── localStorage helpers ────────────────────────────────────────────────────

const loadOverrides = (): Record<number, Partial<Service>> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveOverride = (service: Service) => {
  try {
    const overrides = loadOverrides();
    overrides[service.id] = service;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch { /* ignore */ }
};

const removeOverride = (id: number) => {
  try {
    const overrides = loadOverrides();
    delete overrides[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch { /* ignore */ }
};

/** Merge API data with locally saved overrides */
const applyOverrides = (services: Service[]): Service[] => {
  const overrides = loadOverrides();
  return services.map(s => overrides[s.id] ? { ...s, ...overrides[s.id] } : s);
};

// ─── Fee helpers ────────────────────────────────────────────────────────────

const isFree = (fee: string | undefined) =>
  !fee || fee.trim() === '' || fee.trim().toLowerCase() === 'free' || parseFloat(fee) === 0;

const formatFeeDisplay = (fee: string) =>
  isFree(fee) ? 'Free' : `₱${parseFloat(fee).toFixed(2)}`;

const normaliseFee = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === 'free') return 'Free';
  const num = parseFloat(trimmed);
  if (isNaN(num) || num === 0) return 'Free';
  return String(num);
};

// ─── Requirements helpers ────────────────────────────────────────────────────

const parseRequirements = (requirements: string | string[] | undefined) => {
  if (!requirements) return [];
  if (Array.isArray(requirements))
    return requirements.map(r => String(r).trim()).filter(Boolean);
  return requirements.split(/\n+/).map(r => r.trim()).filter(Boolean);
};

const requirementsToString = (reqs: string | string[]) =>
  Array.isArray(reqs) ? reqs.join('\n') : reqs ?? '';

// ─── Component ───────────────────────────────────────────────────────────────

const ServicesCms = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [feeMode, setFeeMode] = useState<'free' | 'paid'>('free');
  const [form, setForm] = useState({
    name: '',
    description: '',
    requirements: '',
    processing_time: '',
    fee: '',
  });

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/services`, { withCredentials: true });
      let data: Service[] = res.data?.data ?? res.data ?? defaultServices;
      const latestMap = new Map<number, Service>();
      data.forEach(item => latestMap.set(item.id, item));
      // Apply locally saved overrides on top of API data
      const merged = applyOverrides(Array.from(latestMap.values()));
      setServices(merged);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Failed to Load Services',
        description: err.response?.data?.message ?? err.message ?? 'Could not fetch services.',
        variant: 'destructive',
      });
      // Apply overrides on top of defaults too
      setServices(applyOverrides(defaultServices));
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Dialog helpers ────────────────────────────────────────────────────────
  const openEdit = (s: Service) => {
    setEditingService(s);
    const free = isFree(s.fee);
    setFeeMode(free ? 'free' : 'paid');
    setForm({
      name: s.name,
      description: s.description,
      requirements: requirementsToString(s.requirements),
      processing_time: s.processing_time,
      fee: free ? '' : String(parseFloat(s.fee)),
    });
    setDialogOpen(true);
  };

  const openView = (s: Service) => {
    setViewingService(s);
    setViewDialogOpen(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim() || !editingService) return;

    const canonicalFee = feeMode === 'free' ? 'Free' : normaliseFee(form.fee);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      requirements: form.requirements,
      processing_time: form.processing_time.trim(),
      fee: canonicalFee,
    };

    setIsSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE}/services/${editingService.id}`,
        payload,
        { withCredentials: true },
      );

      const updated: Service = { ...editingService, ...payload, ...(res.data?.data ?? res.data ?? {}) };
      updated.fee = canonicalFee;

      // Persist to localStorage so it survives refresh
      saveOverride(updated);

      setServices(prev => prev.map(s => (s.id === editingService.id ? updated : s)));

      toast({
        title: 'Service Updated',
        description: `${updated.name} has been updated successfully.`,
      });
    } catch (err: any) {
      console.error(err);

      // Even if API fails, save locally and update UI
      const localUpdated: Service = { ...editingService, ...payload };
      localUpdated.fee = canonicalFee;
      saveOverride(localUpdated);
      setServices(prev => prev.map(s => (s.id === editingService.id ? localUpdated : s)));

      toast({
        title: 'Saved Locally',
        description: 'API update failed, but your changes are saved locally and will persist.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setDialogOpen(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try { await axios.delete(`${API_BASE}/services/${deleteId}`, { withCredentials: true }); } catch { /* local fallback */ }
    removeOverride(deleteId);
    setServices(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
    toast({ title: 'Service Deleted', description: 'The service has been removed.' });
  };

  // ── Fee input handler ─────────────────────────────────────────────────────
  const handleFeeInput = (raw: string) => {
    let val = raw.replace(/[^\d.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (parts.length === 2) val = parts[0] + '.' + parts[1].slice(0, 2);
    if (parseFloat(val) > 99999) val = '99999';
    setForm(f => ({ ...f, fee: val }));
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Services Management</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage barangay services displayed on the website</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{services.length}</p>
                  <p className="text-xs text-muted-foreground">Total Services</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{services.filter(s => isFree(s.fee)).length}</p>
                  <p className="text-xs text-muted-foreground">Free Services</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{services.filter(s => !isFree(s.fee)).length}</p>
                  <p className="text-xs text-muted-foreground">Paid Services</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Processing Time</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fee</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={4} className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></td></tr>
                  ) : services.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No services found</td></tr>
                  ) : services.map(s => (
                    <tr key={s.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs"><Clock className="h-3 w-3" /> {s.processing_time}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          isFree(s.fee)
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {formatFeeDisplay(s.fee)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openView(s)}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(s)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* View Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Service Details</DialogTitle></DialogHeader>
              {viewingService && (
                <div className="space-y-4 py-2">
                  <h3 className="text-lg font-semibold">{viewingService.name}</h3>
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="mt-1 text-sm">{viewingService.description}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Processing Time</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{viewingService.processing_time}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Fee</Label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                        isFree(viewingService.fee)
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                        {formatFeeDisplay(viewingService.fee)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Requirements</Label>
                    <div className="space-y-2">
                      {parseRequirements(viewingService.requirements).length > 0
                        ? parseRequirements(viewingService.requirements).map((req, idx) => (
                          <div key={idx} className="flex gap-3 items-start p-3 rounded-md bg-muted/30 border border-border/50">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded min-w-fit">{idx + 1}</span>
                            <p className="text-sm">{req}</p>
                          </div>
                        ))
                        : <p className="text-sm text-muted-foreground italic">No requirements listed</p>
                      }
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">

                {/* Service Name — disabled/locked */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    Service Name
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input
                    value={form.name}
                    disabled
                    className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Service name cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the service" rows={3} className="resize-none" />
                </div>
                <div className="space-y-2">
                  <Label>Requirements (one per line)</Label>
                  <Textarea
                    value={form.requirements}
                    onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
                    placeholder={"Valid ID\nProof of residence\nApplication form"}
                    rows={5}
                    className="resize-none font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">Press Enter to separate each requirement</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Processing Time</Label>
                    <Input value={form.processing_time} onChange={e => setForm(f => ({ ...f, processing_time: e.target.value }))} placeholder="e.g. 1-2 business days" />
                  </div>

                  {/* ── Fee section ── */}
                  <div className="space-y-2">
                    <Label>Fee</Label>

                    {/* Free / Fee toggle */}
                    <div className="flex rounded-md border border-border overflow-hidden text-sm">
                      <button
                        type="button"
                        onClick={() => { setFeeMode('free'); setForm(f => ({ ...f, fee: '' })); }}
                        className={`flex-1 py-1.5 font-medium transition-colors ${
                          feeMode === 'free'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-card text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeeMode('paid')}
                        className={`flex-1 py-1.5 font-medium transition-colors ${
                          feeMode === 'paid'
                            ? 'bg-amber-500 text-white'
                            : 'bg-card text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        Fee
                      </button>
                    </div>

                    {/* Amount input — only shown when paid */}
                    {feeMode === 'paid' && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground font-medium select-none">₱</span>
                        <Input
                          value={form.fee}
                          onChange={e => handleFeeInput(e.target.value)}
                          placeholder="0.00"
                          className="pl-8"
                          inputMode="decimal"
                        />
                      </div>
                    )}

                    {/* Live preview */}
                    <p className="text-xs text-muted-foreground">
                      Will display as:{' '}
                      <span className={`font-semibold ${feeMode === 'free' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {feeMode === 'free' ? 'Free' : (form.fee ? `₱${parseFloat(form.fee || '0').toFixed(2)}` : '₱0.00')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
                  {isSaving ? 'Saving…' : editingService ? 'Update Service' : 'Create Service'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Service</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to delete this service? This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </Layout>
  );
};

export default ServicesCms;