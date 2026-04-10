import { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, FileArchive, Clock, Play, Trash2, Database } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/Layout';

const API_BASE = 'https://westrembomis.onrender.com/api/backup';

type DbType = 'postgresql' | 'mysql' | 'sqlite';

interface Backup {
  id: number;
  filename: string;
  size: string;
  created_at: string;
  status: 'completed' | 'in_progress' | 'failed';
  download_url?: string;
  db_type?: DbType;
}

const dbTypeConfig: Record<DbType, { label: string; className: string }> = {
  postgresql: { label: 'PostgreSQL', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  mysql:      { label: 'MySQL',      className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  sqlite:     { label: 'SQLite',     className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
};

const BackupRecovery = () => {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Backup dialog
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [selectedDbType, setSelectedDbType] = useState<DbType>('postgresql');

  /* =======================
     LOAD BACKUPS
  ======================= */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(API_BASE, { withCredentials: true });
      const backupsData = Array.isArray(res.data.backups) ? res.data.backups : [];

      const formattedBackups = backupsData.map((b: any, index: number) => ({
        id: index,
        filename: b.name,
        size: `${b.size_kb} KB`,
        created_at: b.last_modified,
        download_url: b.download_url,
        db_type: b.db_type ?? 'postgresql',
        status: 'completed',
      }));

      setBackups(formattedBackups);
    } catch {
      toast({
        title: 'Access denied',
        description: 'Only admins can view backups',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =======================
     CREATE DATABASE BACKUP
  ======================= */
  const triggerBackup = async () => {
    setIsRunning(true);
    setBackupDialogOpen(false);

    const tempBackup: Backup = {
      id: Date.now(),
      filename: `backup_${selectedDbType}_${new Date().toISOString().split('T')[0]}.sql`,
      size: 'Calculating...',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'in_progress',
      db_type: selectedDbType,
    };

    setBackups(prev => [tempBackup, ...prev]);

    try {
      const res = await axios.post(
        `${API_BASE}/database`,
        { db_type: selectedDbType },
        { withCredentials: true }
      );

      const newBackup: Backup = {
        id: tempBackup.id,
        filename: res.data.file,
        size: 'N/A',
        created_at: tempBackup.created_at,
        status: 'completed',
        download_url: res.data.s3_path,
        db_type: selectedDbType,
      };

      setBackups(prev => prev.map(b => (b.id === tempBackup.id ? newBackup : b)));

      toast({
        title: 'Backup Complete',
        description: `${dbTypeConfig[selectedDbType].label} backup saved to S3 successfully`,
      });

      loadData();
    } catch {
      setBackups(prev =>
        prev.map(b => b.id === tempBackup.id ? { ...b, status: 'failed' } : b)
      );
      toast({
        title: 'Backup failed',
        description: 'Admin permission required or backup error',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  /* =======================
     DOWNLOAD BACKUP
  ======================= */
  const downloadBackup = async (backup: Backup) => {
    try {
      const res = await axios.get(backup.download_url!, {
        responseType: 'blob',
        withCredentials: true,
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: 'Download error',
        description: 'Unauthorized or file missing',
        variant: 'destructive',
      });
    }
  };

  /* =======================
     DELETE BACKUP
  ======================= */
  const handleDelete = async () => {
    if (deleteId === null) return;
    const backup = backups.find(b => b.id === deleteId);
    if (!backup) return;

    try {
      await axios.delete(`${API_BASE}/${encodeURIComponent(backup.filename)}`, {
        withCredentials: true,
      });

      setBackups(prev => prev.filter(b => b.id !== deleteId));
      toast({ title: 'Deleted', description: 'Backup removed successfully' });
    } catch {
      toast({ title: 'Delete failed', description: 'Admin permission required', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Backup & Recovery</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage database backups</p>
            </div>
            <Button variant="outline" onClick={loadData} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>

          {/* Quick Action */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setBackupDialogOpen(true)}
              disabled={isRunning}
              className="bg-card rounded-lg border border-border p-5 text-left hover:bg-muted/30 transition-colors disabled:opacity-50"
            >
              <FileArchive className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-sm font-medium">Database Backup</h3>
              <p className="text-xs text-muted-foreground mt-1">SQL dump of all tables, saved to S3</p>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Play className="h-3 w-3" />
                  {isRunning ? 'Running...' : 'Run Now'}
                </span>
              </div>
            </button>
          </div>

          {/* Backup History */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-medium text-foreground">Backup History</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Filename</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">DB Type</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {backups.length ? (
                      backups.map(backup => {
                        const dbType = backup.db_type ?? 'postgresql';
                        const tc = dbTypeConfig[dbType];
                        return (
                          <tr key={backup.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium">{backup.filename}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${tc.className}`}>
                                <Database className="h-3 w-3" />
                                {tc.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{backup.size}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" /> {backup.created_at}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                backup.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : backup.status === 'in_progress'
                                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                  : 'bg-destructive/10 text-destructive border-destructive/20'
                              }`}>
                                {backup.status === 'in_progress' ? 'In Progress' : backup.status.charAt(0).toUpperCase() + backup.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8"
                                  onClick={() => downloadBackup(backup)}
                                  disabled={backup.status !== 'completed' || !backup.download_url}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                  onClick={() => setDeleteId(backup.id)}
                                  disabled={backup.status === 'in_progress'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                          No backups found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Backup Type Dialog */}
          <Dialog open={backupDialogOpen} onOpenChange={open => { if (!isRunning) setBackupDialogOpen(open); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Database Backup</DialogTitle>
                <DialogDescription>
                  Select which database engine to back up. The dump will be saved directly to S3.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Database Type</Label>
                  <Select value={selectedDbType} onValueChange={(v: DbType) => setSelectedDbType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">
                        <span className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-blue-600" /> PostgreSQL
                        </span>
                      </SelectItem>
                      <SelectItem value="mysql">
                        <span className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-orange-600" /> MySQL
                        </span>
                      </SelectItem>
                      <SelectItem value="sqlite">
                        <span className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-emerald-600" /> SQLite
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className={`rounded-md border p-3 text-sm ${dbTypeConfig[selectedDbType].className}`}>
                  <p className="font-medium mb-1">{dbTypeConfig[selectedDbType].label} selected</p>
                  <p className="text-xs opacity-80">
                    {selectedDbType === 'postgresql' && 'Uses pg_dump to export a plain SQL file.'}
                    {selectedDbType === 'mysql'      && 'Uses mysqldump to export a plain SQL file.'}
                    {selectedDbType === 'sqlite'     && 'Copies the .sqlite database file directly.'}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setBackupDialogOpen(false)} disabled={isRunning}>
                  Cancel
                </Button>
                <Button onClick={triggerBackup} disabled={isRunning}>
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? 'Running...' : 'Start Backup'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure? This backup file will be permanently deleted from S3.
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

export default BackupRecovery;