import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Clock, DollarSign, FileText, MoreHorizontal } from 'lucide-react';
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

const API_BASE = 'http://127.0.0.1:8000/api';

interface Service {
  id: number;
  name: string;
  description: string;
  requirements: string;
  processing_time: string;
  fee: string;
}

const defaultServices: Service[] = [
  { id: 1, name: 'Resident Registration', description: 'Register as a resident of Barangay West Rembo to access various barangay services and programs.', requirements: "Valid government ID\nProof of residence (utility bill, lease contract)\n2x2 ID photos (2 pieces)\nAccomplished registration form", processing_time: '1-2 business days', fee: 'Free' },
  { id: 2, name: 'Barangay Clearance', description: 'Obtain a clearance certificate from Barangay West Rembo.', requirements: "Valid ID\nProof of residence\nClearance application form", processing_time: '1 business day', fee: 'Free' },
  { id: 3, name: 'Business Clearance', description: 'Apply for a business clearance to operate legally in Barangay West Rembo.', requirements: "Business permit\nValid ID\nCompleted application form", processing_time: '2-3 business days', fee: 'Free' },
  { id: 4, name: 'Building Clearance', description: 'Obtain building clearance for construction or renovation.', requirements: "Building permit\nID of applicant\nApplication form", processing_time: '3-5 business days', fee: 'Free' },
  { id: 5, name: 'Barangay Certificate', description: 'Get official certification from Barangay West Rembo.', requirements: "Valid ID\nPurpose of certificate\nApplication form", processing_time: '1-2 business days', fee: 'Free' },
];

const ServicesCms = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({ name: '', description: '', requirements: '', processing_time: '', fee: '' });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(API_BASE+'/services',{withCredentials:true}); // uses axiosAuth with withCredentials
      let data: Service[] = res.data?.data ?? res.data ?? defaultServices;

      console.log(data)

      // Keep only the latest version of each service by ID
      const latestMap = new Map<number, Service>();
      data.forEach(item => latestMap.set(item.id, item));
      data = Array.from(latestMap.values());

      setServices(data);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Failed to Load Services',
        description: err.response?.data?.message ?? err.message ?? 'Could not fetch services.',
        variant: 'destructive',
      });
      setServices(defaultServices);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingService(null);
    setForm({ name: '', description: '', requirements: '', processing_time: '', fee: '' });
    setDialogOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    setForm({ name: s.name, description: s.description, requirements: s.requirements, processing_time: s.processing_time, fee: s.fee });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !editingService) return;

    setIsSaving(true);

    try {
      const res = await axios.put(
        `${API_BASE}/services/${editingService.id}`,
        form,
        { withCredentials: true }
      );

      const updated = res.data?.data ?? res.data ?? form;

      setServices(prev =>
        prev.map(s => (s.id === editingService.id ? { ...s, ...updated } : s))
      );

      toast({
        title: "Service Updated",
        description: `${updated.name} has been updated.`,
      });

    } catch (err) {
      console.error(err);

      toast({
        title: "Update Failed",
        description: "Could not update the service.",
        variant: "destructive",
      });

    } finally {
      setIsSaving(false);
      setDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await axios.delete(`${API_BASE}/services/${deleteId}`,{withCredentials:true}); } catch { /* local fallback */ }
    setServices(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
    toast({ title: 'Service Deleted', description: 'The service has been removed.' });
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Services Management</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage barangay services displayed on the website</p>
            </div>
            {/* <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add Service
            </Button> */}
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
                  <p className="text-2xl font-bold">{services.filter(s => s.fee === 'Free').length}</p>
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
                  <p className="text-2xl font-bold">{services.filter(s => s.fee !== 'Free').length}</p>
                  <p className="text-xs text-muted-foreground">Paid Services</p>
                </div>
              </div>
            </div>
          </div>

          {/* Services Table */}
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.fee === 'Free' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                          {s.fee}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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

          {/* Create / Edit Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Barangay Clearance" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the service" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Requirements (one per line)</Label>
                  <Textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} placeholder="Valid ID&#10;Proof of residence&#10;Application form" rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Processing Time</Label>
                    <Input value={form.processing_time} onChange={e => setForm(f => ({ ...f, processing_time: e.target.value }))} placeholder="e.g. 1-2 business days" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fee</Label>
                    <Input value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} placeholder="e.g. Free or ₱100" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
                  {isSaving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
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
