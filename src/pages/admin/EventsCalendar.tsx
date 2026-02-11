import { useState, useEffect, useCallback } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Calendar, MapPin, Clock, ImageIcon } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Layout } from '@/components/Layout';

const API_BASE = 'http://127.0.0.1:8000/api';

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  image: string | null;
  published: boolean;
  created_at?: string;
}

const defaultEvents: Event[] = [
  { id: 1, title: 'Barangay Assembly', description: 'Quarterly general assembly for all residents.', location: 'Barangay Hall', date: '2026-03-15', time: '09:00', image: null, published: true },
  { id: 2, title: 'Clean-Up Drive', description: 'Community clean-up along the main road.', location: 'Main Street', date: '2026-03-22', time: '06:00', image: null, published: true },
  { id: 3, title: 'Health Screening', description: 'Free medical and dental check-up.', location: 'Health Center', date: '2026-04-05', time: '08:00', image: null, published: false },
];

const emptyForm = { title: '', description: '', location: '', date: '', time: '', image: null as string | null, published: true };

const EventsCalendar = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
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
      const res = await axios.get(`${API_BASE}/events`);
      setEvents(res.data?.data ?? res.data ?? defaultEvents);
    } catch {
      setEvents(defaultEvents);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setImageFile(null);
    setDialogOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditingId(event.id);
    setForm({ title: event.title, description: event.description, location: event.location, date: event.date, time: event.time, image: event.image, published: event.published });
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.date || !form.time) {
      toast({ title: 'Validation Error', description: 'Title, date, and time are required', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('location', form.location);
      formData.append('date', form.date);
      formData.append('time', form.time);
      formData.append('published', form.published ? '1' : '0');
      if (imageFile) formData.append('image', imageFile);

      if (editingId) {
        formData.append('_method', 'PUT');
        const res = await axios.post(`${API_BASE}/events/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const updated = res.data?.data ?? { ...form, id: editingId };
        setEvents(prev => prev.map(e => e.id === editingId ? { ...e, ...updated } : e));
        toast({ title: 'Updated', description: 'Event updated successfully' });
      } else {
        const res = await axios.post(`${API_BASE}/events`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const newEvent: Event = res.data?.data ?? { id: Date.now(), ...form };
        setEvents(prev => [...prev, newEvent]);
        toast({ title: 'Created', description: 'Event added successfully' });
      }
      setDialogOpen(false);
    } catch {
      if (editingId) {
        setEvents(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e));
      } else {
        setEvents(prev => [...prev, { id: Date.now(), ...form }]);
      }
      setDialogOpen(false);
      toast({ title: 'Saved locally', description: 'API unavailable — saved locally' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try { await axios.delete(`${API_BASE}/events/${deletingId}`); } catch { /* local delete */ }
    setEvents(prev => prev.filter(e => e.id !== deletingId));
    setDeleteDialogOpen(false);
    setDeletingId(null);
    toast({ title: 'Deleted', description: 'Event removed successfully' });
  };

  const togglePublish = async (event: Event) => {
    const updated = { ...event, published: !event.published };
    setEvents(prev => prev.map(e => e.id === event.id ? updated : e));
    try {
      await axios.put(`${API_BASE}/events/${event.id}`, { published: updated.published });
    } catch { /* keep local state */ }
    toast({ title: updated.published ? 'Published' : 'Unpublished', description: `Event ${updated.published ? 'published' : 'unpublished'}` });
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Events & Calendar</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage community events and calendar</p>
            </div>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Event
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
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Event</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date & Time</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {events.map(event => (
                      <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                              {event.image ? <img src={event.image} alt="" className="w-full h-full object-cover" /> : <Calendar className="h-5 w-5 text-primary" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{event.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /> {event.location || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">{event.date}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {event.time}</div>
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => togglePublish(event)} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${event.published ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                            {event.published ? <><Eye className="h-3 w-3" /> Published</> : <><EyeOff className="h-3 w-3" /> Draft</>}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(event)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => { setDeletingId(event.id); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No events found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Event' : 'Add New Event'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Event Image</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
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
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Event description" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Barangay Hall" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Published</Label>
                  <Switch checked={form.published} onCheckedChange={v => setForm(f => ({ ...f, published: v }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : editingId ? 'Update' : 'Add Event'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
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

export default EventsCalendar;
