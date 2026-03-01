import { useState, useEffect, useCallback } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, ImageIcon } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Layout } from '@/components/Layout';

const API_BASE = 'https://westrembomis.onrender.com/api';

interface ElectedOfficial {
  id: number;
  fullName: string;
  position: string;
  committee: string;
  order: number;
  image: string | null;
  term: string;
  visible: boolean;
}

const POSITION_OPTIONS = [
  'PUNONG BARANGAY',
  'KAGAWAD',
  'INGAT-YAMAN',
  'KALIHIM',
  'SK CHAIRPERSON',
];

const defaultOfficials: ElectedOfficial[] = [
  { id: 1, fullName: 'Roberto C. Dela Cruz', position: 'PUNONG BARANGAY', committee: 'Barangay Captain', order: 1, image: null, term: '2023-2025', visible: true },
  { id: 2, fullName: 'Leonard J. Mercado', position: 'KAGAWAD', committee: 'Youth and Sports Development Committee', order: 2, image: null, term: '2023-2025', visible: true },
  { id: 3, fullName: 'Clarisse H. Navarro', position: 'KAGAWAD', committee: 'Health and Sanitation Committee', order: 3, image: null, term: '2023-2025', visible: true },
  { id: 4, fullName: 'Rowena G. Santos', position: 'KAGAWAD', committee: 'Livelihood and Economic Development', order: 4, image: null, term: '2023-2025', visible: true },
  { id: 5, fullName: 'Joshua L. Ferrer', position: 'KAGAWAD', committee: 'Disaster Preparedness and Emergency Response', order: 5, image: null, term: '2023-2025', visible: true },
  { id: 6, fullName: 'Diana V. Aquino', position: 'KAGAWAD', committee: 'Peace and Order Committee', order: 6, image: null, term: '2023-2025', visible: true },
  { id: 7, fullName: 'Geraldine M. Roldan', position: 'KAGAWAD', committee: 'Education, Culture and Gender Equality', order: 7, image: null, term: '2023-2025', visible: true },
  { id: 8, fullName: 'Marco Elias D. Trinidad', position: 'INGAT-YAMAN', committee: 'Barangay Budget and Fiscal Management', order: 8, image: null, term: '2023-2025', visible: true },
  { id: 9, fullName: 'Kristine Joy P. Lacson', position: 'KALIHIM', committee: 'Community Records and Documentation', order: 9, image: null, term: '2023-2025', visible: true },
  { id: 10, fullName: 'Benjamin A. Reyes', position: 'KAGAWAD', committee: 'Environmental Protection and Cleanliness', order: 10, image: null, term: '2023-2025', visible: true },
];

const emptyForm: Omit<ElectedOfficial, 'id'> = {
  fullName: '',
  position: '',
  committee: '',
  order: 0,
  image: null,
  term: '',
  visible: true,
};

const ElectedOfficials = () => {
  const { toast } = useToast();
  const [officials, setOfficials] = useState<ElectedOfficial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/elected-officials`);
      setOfficials(res.data?.data ?? res.data ?? defaultOfficials);
    } catch {
      setOfficials(defaultOfficials);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, order: officials.length + 1 });
    setImageFile(null);
    setDialogOpen(true);
  };

  const openEdit = (official: ElectedOfficial) => {
    setEditingId(official.id);
    setForm({ fullName: official.fullName, position: official.position, committee: official.committee, order: official.order, image: official.image, term: official.term, visible: official.visible });
    setImageFile(null);
    setDialogOpen(true);
  };

  const openDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.position || !form.committee) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('fullName', form.fullName);
      formData.append('position', form.position);
      formData.append('committee', form.committee);
      formData.append('order', String(form.order));
      formData.append('term', form.term);
      formData.append('visible', form.visible ? '1' : '0');
      if (imageFile) formData.append('image', imageFile);

      if (editingId) {
        formData.append('_method', 'PUT');
        await axios.post(`${API_BASE}/elected-officials/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setOfficials(prev => prev.map(o => o.id === editingId ? { ...o, ...form } : o));
        toast({ title: 'Updated', description: 'Official updated successfully' });
      } else {
        const res = await axios.post(`${API_BASE}/elected-officials`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const newOfficial: ElectedOfficial = res.data?.data ?? { id: Date.now(), ...form };
        setOfficials(prev => [...prev, newOfficial]);
        toast({ title: 'Created', description: 'Official added successfully' });
      }
      setDialogOpen(false);
    } catch {
      // Fallback: update local state anyway for demo
      if (editingId) {
        setOfficials(prev => prev.map(o => o.id === editingId ? { ...o, ...form } : o));
      } else {
        setOfficials(prev => [...prev, { id: Date.now(), ...form }]);
      }
      setDialogOpen(false);
      toast({ title: 'Saved locally', description: 'API unavailable — saved locally' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await axios.delete(`${API_BASE}/elected-officials/${deletingId}`);
    } catch {
      // continue with local delete
    }
    setOfficials(prev => prev.filter(o => o.id !== deletingId));
    setDeleteDialogOpen(false);
    setDeletingId(null);
    toast({ title: 'Deleted', description: 'Official removed successfully' });
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'PUNONG BARANGAY': return 'bg-primary/10 text-primary border-primary/20';
      case 'KAGAWAD': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'INGAT-YAMAN': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'KALIHIM': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'SK CHAIRPERSON': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Elected Officials</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage barangay elected officials and their committees</p>
            </div>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Official
            </Button>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">#</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Position</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Committee / Role</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Term</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Visible</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {officials.sort((a, b) => a.order - b.order).map((official, index) => (
                      <tr key={official.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-sm text-muted-foreground">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary overflow-hidden">
                              {official.image ? <img src={official.image} alt="" className="w-full h-full object-cover" /> : official.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <span className="text-sm font-medium">{official.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPositionColor(official.position)}`}>
                            {official.position}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{official.committee}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{official.term || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${official.visible ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                            {official.visible ? <><Eye className="h-3 w-3" /> Visible</> : <><EyeOff className="h-3 w-3" /> Hidden</>}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(official)}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => openDelete(official.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {officials.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No officials found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create / Edit Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Official' : 'Add New Official'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Profile Image</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                      {(imageFile || form.image) ? (
                        <img src={imageFile ? URL.createObjectURL(imageFile) : form.image!} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Juan A. Dela Cruz" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select value={form.position} onValueChange={v => setForm(f => ({ ...f, position: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_OPTIONS.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="committee">Committee / Role</Label>
                  <Input id="committee" value={form.committee} onChange={e => setForm(f => ({ ...f, committee: e.target.value }))} placeholder="e.g. Health and Sanitation Committee" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="term">Term</Label>
                    <Input id="term" value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))} placeholder="e.g. 2023-2025" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Display Order</Label>
                    <Input id="order" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Visible on Public Website</Label>
                  <Switch checked={form.visible} onCheckedChange={v => setForm(f => ({ ...f, visible: v }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingId ? 'Update' : 'Add Official'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Official</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to remove this official? This action cannot be undone.</AlertDialogDescription>
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

export default ElectedOfficials;
