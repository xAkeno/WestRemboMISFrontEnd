import { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, FileArchive, Clock, Play, Trash2, Database, RotateCcw, Calendar, Settings } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Layout } from '@/components/Layout';

const API_BASE = 'https://westrembomis.onrender.com/api';

type DbType = 'postgresql' | 'mysql' | 'sqlite';
type Frequency = 'hourly' | 'daily' | 'weekly';

interface Backup {
  id: number;
  filename: string;
  size: string;
  created_at: string;
  status: 'completed' | 'in_progress' | 'failed';
  download_url?: string;
  db_type?: DbType;
}

interface ScheduleSettings {
  enabled: boolean;
  frequency: Frequency;
  time: string;
  day_of_week: number | null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleSettings>({
    enabled: false,
    frequency: 'daily',
    time: '02:00',
    day_of_week: 1,
  });

  /* =======================
     COMPUTE NEXT RUN TEXT
  ======================= */
  const getNextRunText = (s: ScheduleSettings): string => {
    if (!s.enabled) return 'Disabled';

    const [h, m] = s.time.split(':').map(Number);
    const now = new Date();
    const next = new Date();

    if (s.frequency === 'hourly') {
      const n = new Date(now.getTime() + 60 * 60 * 1000);
      return `in ~1 hour (${n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    }

    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);

    if (s.frequency === 'weekly' && s.day_of_week !== null) {
      while (next.getDay() !== s.day_of_week) next.setDate(next.getDate() + 1);
      return `${DAYS[s.day_of_week]}, ${next.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return `${next.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  /* =======================
     LOAD BACKUPS
  ======================= */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/backup`, { withCredentials: true });

      const backupsData = Array.isArray(res.data.backups) ? res.data.backups : [];

      const formatted = backupsData.map((b: any, index: number) => ({
        id: index,
        filename: b.name,
        size: `${b.size_kb} KB`,
        created_at: b.last_modified,
        status: 'completed',
        db_type: 'mysql',
      }));

      setBackups(formatted);
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Cannot load backups',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* =======================
     SAVE SCHEDULE
  ======================= */
  const saveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      await axios.post(
        `${API_BASE}/backup/settings`,
        {
          enabled: schedule.enabled ? 1 : 0,
          frequency: schedule.frequency,
          time: schedule.time,
          day_of_week: schedule.frequency === 'weekly' ? schedule.day_of_week : null,
        },
        { withCredentials: true }
      );
      toast({ title: 'Schedule saved', description: 'Auto backup schedule updated successfully' });
      setScheduleDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Failed to save schedule',
        description: err?.response?.data?.message ?? 'Could not save schedule settings',
        variant: 'destructive',
      });
    } finally {
      setIsSavingSchedule(false);
    }
  };

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

      toast({ title: 'Backup Complete', description: 'Full SQL dump saved successfully' });
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
      a.download = backup.filename;
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

            {/* Manual Backup */}
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

            {/* Import / Restore Upload */}
            <button
              onClick={() => setRestoreDialogOpen(true)}
              className="bg-card rounded-lg border border-border p-5 text-left hover:bg-muted/30 transition-colors"
            >
              <Database className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-sm font-medium">Import Database</h3>
              <p className="text-xs text-muted-foreground mt-1">Upload a .sql file to restore database</p>
            </button>

            {/* Auto Schedule */}
            <button
              onClick={() => setScheduleDialogOpen(true)}
              className="bg-card rounded-lg border border-border p-5 text-left hover:bg-muted/30 transition-colors"
            >
              <Calendar className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-sm font-medium">Auto Schedule</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {schedule.enabled
                  ? `${schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} · ${schedule.frequency !== 'hourly' ? schedule.time : 'Every hour'}`
                  : 'Scheduled backups are off'}
              </p>
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${schedule.enabled ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  <Settings className="h-3 w-3" />
                  Configure
                </span>
              </div>
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

          {/* ================================
              SCHEDULE DIALOG
          ================================ */}
          <Dialog open={scheduleDialogOpen} onOpenChange={open => { if (!isSavingSchedule) setScheduleDialogOpen(open); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Auto Backup Schedule</DialogTitle>
                <DialogDescription>
                  Set when automatic backups should run.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">

                {/* Enable toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Enable auto backup</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Run backups automatically on a schedule</p>
                  </div>
                  <Switch
                    checked={schedule.enabled}
                    onCheckedChange={val => setSchedule(s => ({ ...s, enabled: val }))}
                  />
                </div>

                <div className={`space-y-4 transition-opacity ${schedule.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

                  {/* Frequency */}
                  <div className="space-y-1.5">
                    <Label>Frequency</Label>
                    <Select
                      value={schedule.frequency}
                      onValueChange={(v: Frequency) => setSchedule(s => ({ ...s, frequency: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time — hidden for hourly */}
                  {schedule.frequency !== 'hourly' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="sched-time">Time</Label>
                      <input
                        id="sched-time"
                        type="time"
                        value={schedule.time}
                        onChange={e => setSchedule(s => ({ ...s, time: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  )}

                  {/* Day of week — only for weekly */}
                  {schedule.frequency === 'weekly' && (
                    <div className="space-y-2">
                      <Label>Day of week</Label>
                      <div className="flex gap-1.5 flex-wrap">
                        {DAYS_SHORT.map((day, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSchedule(s => ({ ...s, day_of_week: i }))}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                              schedule.day_of_week === i
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border hover:bg-muted/50'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next run preview */}
                  <div className="rounded-md bg-muted/40 border border-border px-4 py-3 text-sm">
                    <p className="text-xs text-muted-foreground mb-0.5">Next scheduled run</p>
                    <p className="font-medium text-foreground">{getNextRunText(schedule)}</p>
                  </div>

                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setScheduleDialogOpen(false)} disabled={isSavingSchedule}>
                  Cancel
                </Button>
                <Button onClick={saveSchedule} disabled={isSavingSchedule}>
                  {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ================================
              BACKUP DIALOG
          ================================ */}
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

          {/* ================================
              UPLOAD RESTORE DIALOG
          ================================ */}
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

          {/* ================================
              RESTORE FROM FILE CONFIRM DIALOG
          ================================ */}
          <AlertDialog open={!!restoreFromFilename} onOpenChange={() => { if (!isRestoringFromFile) setRestoreFromFilename(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restore from Backup</AlertDialogTitle>
                <AlertDialogDescription>
                  This will restore the database from{' '}
                  <span className="font-medium text-foreground">{restoreFromFilename}</span>.
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