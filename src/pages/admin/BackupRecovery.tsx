import { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, FileArchive, Clock, Play, Trash2, Database, RotateCcw } from 'lucide-react';
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

const API_BASE = 'http://127.0.0.1:8000/api';

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
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [selectedDbType, setSelectedDbType] = useState<DbType>('mysql');
  const [restoreFromFilename, setRestoreFromFilename] = useState<string | null>(null);
  const [isRestoringFromFile, setIsRestoringFromFile] = useState(false);

  /* =======================
     LOAD BACKUPS
  ======================= */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/backup`, { withCredentials: true });
      const backupsData = Array.isArray(res.data.backups) ? res.data.backups : [];

      const formattedBackups = backupsData.map((b: any, index: number) => ({
        id: index,
        filename: b.name,
        size: `${b.size_kb} KB`,
        created_at: b.last_modified,
        download_url: b.download_url,
        db_type: (b.db_type ?? 'mysql') as DbType,
        status: 'completed' as const,
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

  useEffect(() => { loadData(); }, [loadData]);

  /* =======================
     CREATE DATABASE BACKUP
  ======================= */
  const triggerBackup = async () => {
    setIsRunning(true);
    setBackupDialogOpen(false);

    const tempBackup: Backup = {
      id: Date.now(),
      filename: `backup_${new Date().toISOString().replace(/[-T:.Z]/g, '_').slice(0, 19)}.sql`,
      size: 'Calculating...',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'in_progress',
      db_type: selectedDbType,
    };

    setBackups(prev => [tempBackup, ...prev]);

    try {
      const res = await axios.post(
        `${API_BASE}/backup/database`,
        {},
        { withCredentials: true }
      );

      setBackups(prev => prev.map(b =>
        b.id === tempBackup.id
          ? { ...b, filename: res.data.file, status: 'completed' as const, size: 'N/A' }
          : b
      ));

      toast({
        title: 'Backup Complete',
        description: 'Full SQL dump saved successfully',
      });

      loadData();
    } catch (err: any) {
      setBackups(prev =>
        prev.map(b => b.id === tempBackup.id ? { ...b, status: 'failed' as const } : b)
      );
      toast({
        title: 'Backup failed',
        description: err?.response?.data?.message ?? 'Admin permission required or backup error',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  /* =======================
     RESTORE — UPLOAD SQL FILE
  ======================= */
  const handleRestoreUpload = async () => {
    if (!restoreFile) return;
    setIsRestoring(true);

    const formData = new FormData();
    formData.append('file', restoreFile);

    try {
      await axios.post(`${API_BASE}/backup/restore-upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      toast({ title: 'Restore Complete', description: 'Database imported successfully' });
      setRestoreDialogOpen(false);
      setRestoreFile(null);
      loadData();
    } catch (err: any) {
      toast({
        title: 'Restore failed',
        description: err?.response?.data?.message ?? 'Import error or permission denied',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  /* =======================
     RESTORE — FROM EXISTING BACKUP FILE
  ======================= */
  const handleRestoreFromFile = async () => {
    if (!restoreFromFilename) return;
    setIsRestoringFromFile(true);

    try {
      await axios.post(
        `${API_BASE}/backup/restore/${encodeURIComponent(restoreFromFilename)}`,
        {},
        { withCredentials: true }
      );

      toast({ title: 'Restore Complete', description: `Restored from ${restoreFromFilename}` });
      loadData();
    } catch (err: any) {
      toast({
        title: 'Restore failed',
        description: err?.response?.data?.message ?? 'Restore error or permission denied',
        variant: 'destructive',
      });
    } finally {
      setIsRestoringFromFile(false);
      setRestoreFromFilename(null);
    }
  };

  /* =======================
     DOWNLOAD BACKUP
     Downloads the raw .sql file — no zip confusion
  ======================= */
  const downloadBackup = async (backup: Backup) => {
    try {
      if (!backup.filename) return;

      const url = `${API_BASE}/backup/${encodeURIComponent(backup.filename)}/download`;

      const res = await axios.get(url, {
        responseType: 'blob',
        withCredentials: true,
      });

      const blob = new Blob([res.data], { type: 'application/sql' });
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = backup.filename; // keep the original filename exactly
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Download error',
        description: 'File not found or access denied',
        variant: 'destructive',
      });
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setBackupDialogOpen(true)}
              disabled={isRunning}
              className="bg-card rounded-lg border border-border p-5 text-left hover:bg-muted/30 transition-colors disabled:opacity-50"
            >
              <FileArchive className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-sm font-medium">Database Backup</h3>
              <p className="text-xs text-muted-foreground mt-1">Full SQL dump saved to local storage</p>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Play className="h-3 w-3" />
                  {isRunning ? 'Running...' : 'Run Now'}
                </span>
              </div>
            </button>

            <button
              onClick={() => setRestoreDialogOpen(true)}
              className="bg-card rounded-lg border border-border p-5 text-left hover:bg-muted/30 transition-colors"
            >
              <Database className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-sm font-medium">Import Database</h3>
              <p className="text-xs text-muted-foreground mt-1">Upload a .sql file to restore database</p>
            </button>
          </div>

          {/* Backup History Table */}
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
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {backups.length ? (
                      backups.map(backup => {
                        const dbType = backup.db_type ?? 'mysql';
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
                                  title="Download"
                                  onClick={() => downloadBackup(backup)}
                                  disabled={backup.status !== 'completed'}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8 text-amber-600"
                                  title="Restore this backup"
                                  onClick={() => setRestoreFromFilename(backup.filename)}
                                  disabled={backup.status !== 'completed'}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                  title="Delete (no route defined)"
                                  disabled
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

          {/* Backup Dialog */}
          <Dialog open={backupDialogOpen} onOpenChange={open => { if (!isRunning) setBackupDialogOpen(open); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Database Backup</DialogTitle>
                <DialogDescription>
                  Runs <code>mysqldump</code> and saves a full <code>.sql</code> file to local storage.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Database Type</Label>
                  <Select value={selectedDbType} onValueChange={(v: DbType) => setSelectedDbType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">
                        <span className="flex items-center gap-2"><Database className="h-4 w-4 text-blue-600" /> PostgreSQL</span>
                      </SelectItem>
                      <SelectItem value="mysql">
                        <span className="flex items-center gap-2"><Database className="h-4 w-4 text-orange-600" /> MySQL</span>
                      </SelectItem>
                      <SelectItem value="sqlite">
                        <span className="flex items-center gap-2"><Database className="h-4 w-4 text-emerald-600" /> SQLite</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={`rounded-md border p-3 text-sm ${dbTypeConfig[selectedDbType].className}`}>
                  <p className="font-medium mb-1">{dbTypeConfig[selectedDbType].label} selected</p>
                  <p className="text-xs opacity-80">
                    {selectedDbType === 'postgresql' && 'Uses pg_dump to export a plain SQL file.'}
                    {selectedDbType === 'mysql'      && 'Uses mysqldump --quick --single-transaction (no locks).'}
                    {selectedDbType === 'sqlite'     && 'Copies the .sqlite database file directly.'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBackupDialogOpen(false)} disabled={isRunning}>Cancel</Button>
                <Button onClick={triggerBackup} disabled={isRunning}>
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? 'Running...' : 'Start Backup'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Upload Restore Dialog */}
          <Dialog open={restoreDialogOpen} onOpenChange={open => { if (!isRestoring) { setRestoreDialogOpen(open); if (!open) setRestoreFile(null); } }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Database</DialogTitle>
                <DialogDescription>
                  Upload a <code>.sql</code> file to restore the database. This will overwrite existing data.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="restore-file">SQL File</Label>
                  <input
                    id="restore-file"
                    type="file"
                    accept=".sql"
                    onChange={e => setRestoreFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  />
                </div>
                {restoreFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{restoreFile.name}</span>
                    {' '}({(restoreFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setRestoreDialogOpen(false); setRestoreFile(null); }} disabled={isRestoring}>
                  Cancel
                </Button>
                <Button onClick={handleRestoreUpload} disabled={!restoreFile || isRestoring}>
                  {isRestoring ? 'Restoring...' : 'Import'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Restore-from-file confirmation dialog */}
          <AlertDialog open={!!restoreFromFilename} onOpenChange={() => { if (!isRestoringFromFile) setRestoreFromFilename(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restore from Backup</AlertDialogTitle>
                <AlertDialogDescription>
                  This will restore the database from <span className="font-medium text-foreground">{restoreFromFilename}</span>.
                  All current data will be overwritten. Are you sure?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRestoringFromFile}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRestoreFromFile}
                  disabled={isRestoringFromFile}
                  className="bg-amber-600 text-white hover:bg-amber-700"
                >
                  {isRestoringFromFile ? 'Restoring...' : 'Yes, Restore'}
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