// StreetCms.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, RefreshCw, Search, Copy, Edit, Trash2, Save, X } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const API_BASE = 'http://127.0.0.1:8000/api';

interface Street {
  id: number;
  name: string;
  sitio: string | null;
  formerly: string | null;
  created_at: string;
}

interface StreetFormData {
  name: string;
  sitio: string;
  formerly: string;
}

const defaultFormData: StreetFormData = {
  name: '',
  sitio: '',
  formerly: '',
};

const PER_PAGE = 15;

const StreetCms = () => {
  const { toast } = useToast();
  const [streets, setStreets] = useState<Street[]>([]);
  const [filteredStreets, setFilteredStreets] = useState<Street[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingStreet, setDeletingStreet] = useState<Street | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<StreetFormData>(defaultFormData);

  const loadStreets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/streets`);
      const streetsData = res.data?.data ?? res.data ?? [];
      setStreets(streetsData);
      setFilteredStreets(streetsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load streets',
        variant: 'destructive',
      });
      setStreets([]);
      setFilteredStreets([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStreets();
  }, [loadStreets]);

  // Search handler
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = query
      ? streets.filter(s =>
          (s.name || '').toLowerCase().includes(query) ||
          (s.sitio || '').toLowerCase().includes(query) ||
          (s.formerly || '').toLowerCase().includes(query)
        )
      : [...streets];
    setFilteredStreets(filtered);
    setCurrentPage(1);
  }, [searchQuery, streets]);

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (street: Street) => {
    setEditingId(street.id);
    setFormData({
      name: street.name || '',
      sitio: street.sitio || '',
      formerly: street.formerly || '',
    });
    setIsFormModalOpen(true);
  };

  const openDeleteDialog = (street: Street) => {
    setDeletingStreet(street);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Street name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const payload = {
        name: formData.name.trim(),
        sitio: formData.sitio.trim() || null,
        formerly: formData.formerly.trim() || null,
      };

      if (editingId) {
        await axios.put(`${API_BASE}/streets/${editingId}`, payload);
        toast({
          title: 'Success',
          description: 'Street updated successfully',
        });
      } else {
        await axios.post(`${API_BASE}/streets`, payload);
        toast({
          title: 'Success',
          description: 'Street added successfully',
        });
      }
      
      setIsFormModalOpen(false);
      resetForm();
      loadStreets();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to save: ${(error as any).response?.data?.message || (error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStreet) return;
    
    setIsSaving(true);
    try {
      await axios.delete(`${API_BASE}/streets/${deletingStreet.id}`);
      toast({
        title: 'Success',
        description: 'Street deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setDeletingStreet(null);
      loadStreets();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to delete: ${(error as any).response?.data?.message || (error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async (street: Street) => {
    const text = [street.name, street.sitio, street.formerly].filter(Boolean).join(' | ');
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Street info copied to clipboard',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy',
        variant: 'destructive',
      });
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredStreets.length / PER_PAGE);
  const startIndex = (currentPage - 1) * PER_PAGE;
  const paginatedStreets = filteredStreets.slice(startIndex, startIndex + PER_PAGE);
  const startItem = startIndex + 1;
  const endItem = Math.min(startIndex + PER_PAGE, filteredStreets.length);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    let start = Math.max(1, currentPage - 3);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Streets Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage street records — name, sitio, and formerly used names
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadStreets} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
              <Button onClick={openAddModal} className="gap-2">
                <Plus className="h-4 w-4" /> Add Street
              </Button>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, sitio, formerly…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {filteredStreets.length} street{filteredStreets.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[70px]">
                      ID
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Street Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[120px]">
                      Sitio
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[180px]">
                      Formerly
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[130px]">
                      Created
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[140px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStreets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        No streets found.
                      </td>
                    </tr>
                  ) : (
                    paginatedStreets.map((street) => (
                      <tr key={street.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          #{street.id}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {street.name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {street.sitio ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {street.sitio}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground italic">
                          {street.formerly || <span className="text-muted-foreground/40">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(street.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(street)}
                              className="h-8 px-2"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(street)}
                              className="h-8 px-2"
                            >
                              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(street)}
                              className="h-8 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && filteredStreets.length > PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Showing {startItem}–{endItem} of {filteredStreets.length}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-3"
                  >
                    ‹ Prev
                  </Button>
                  
                  {getPageNumbers().map(pageNum => (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3"
                  >
                    Next ›
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Street' : 'Add Street'}</DialogTitle>
            <DialogDescription>
              {editingId 
                ? 'Update the street details below.' 
                : 'Fill in the street details below.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Street Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rizal Avenue"
                autoFocus
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sitio">Sitio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="sitio"
                  value={formData.sitio}
                  onChange={(e) => setFormData({ ...formData, sitio: e.target.value })}
                  placeholder="e.g. Sitio 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formerly">Formerly <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="formerly"
                  value={formData.formerly}
                  onChange={(e) => setFormData({ ...formData, formerly: e.target.value })}
                  placeholder="e.g. 21st Street"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : (editingId ? 'Update' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Street</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the street
              record <span className="font-semibold text-foreground">"{deletingStreet?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSaving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default StreetCms;