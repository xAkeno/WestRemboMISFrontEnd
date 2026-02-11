import { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, HardDrive, FileArchive, Clock, Play, Trash2 } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Layout } from '@/components/Layout';

const API_BASE = 'http://127.0.0.1:8000/api';

interface Backup {
  id: number;
  filename: string;
  type: 'full' | 'database' | 'files';
  size: string;
  created_at: string;
  status: 'completed' | 'in_progress' | 'failed';
  download_url?: string; // added for download link
}


const defaultBackups: Backup[] = [
  { id: 1, filename: 'backup_2026-02-10_full.zip', type: 'full', size: '45.2 MB', created_at: '2026-02-10 03:00:00', status: 'completed' },
  { id: 2, filename: 'backup_2026-02-09_db.sql', type: 'database', size: '12.8 MB', created_at: '2026-02-09 03:00:00', status: 'completed' },
  { id: 3, filename: 'backup_2026-02-08_files.zip', type: 'files', size: '32.4 MB', created_at: '2026-02-08 03:00:00', status: 'completed' },
];

const typeConfig = {
  full: { label: 'Full Backup', className: 'bg-primary/10 text-primary border-primary/20' },
  database: { label: 'Database', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  files: { label: 'Files', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
};


const BackupRecovery = () => {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const API_BASE = "http://127.0.0.1:8000/api/backup";




  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(API_BASE, {
        withCredentials: true,
      });

      // Laravel now returns: { success: true, backups: [...] }
      const backupsData = Array.isArray(res.data.backups) ? res.data.backups : [];

      // Map backups to your frontend structure
      const formattedBackups = backupsData.map((b: any, index: number) => ({
        id: index, // fallback ID
        filename: b.name,
        size: `${b.size_kb} KB`,
        created_at: b.last_modified,
        download_url: b.download_url,
        status: "completed",
      }));

      setBackups(formattedBackups);
    } catch {
      toast({
        title: "Access denied",
        description: "Only admins can view backups",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =======================
     CREATE BACKUP
  ======================= */

  const triggerBackup = async (type: "full" | "database" | "files") => {
    setIsRunning(true);

    // Temporary backup object for UI
    const tempBackup: Backup = {
      id: Date.now(),
      filename: `backup_${new Date().toISOString().split("T")[0]}_${
        type === "files" ? "images" : type
      }.${type === "files" ? "zip" : "sql"}`,
      type,
      size: "Calculating...",
      created_at: new Date().toISOString().replace("T", " ").slice(0, 19),
      status: "in_progress",
    };

    setBackups(prev => [tempBackup, ...prev]);

    try {
      // Send type to API to decide which backup to run
      const res = await axios.post(
        `${API_BASE}/${type}`, // URL
        {},                     // request body (empty here)
        { withCredentials: true } // Axios config
      );


      // Build new backup object from API response
      const newBackup: Backup = {
        id: res.data.data.id || tempBackup.id,
        filename: res.data.data.filename,
        type,
        size: res.data.data.size || "Unknown",
        created_at: res.data.data.created_at || tempBackup.created_at,
        status: res.data.data.status as "completed" | "in_progress" | "failed",
        // optional download URL
        download_url: res.data.data.download_url,
      };

      // Update the temporary backup in state
      setBackups(prev =>
        prev.map(b => (b.id === tempBackup.id ? newBackup : b))
      );

      toast({
        title: "Backup Complete",
        description: `${
          type === "files" ? "Images" : type.charAt(0).toUpperCase() + type.slice(1)
        } backup created successfully`,
      });
    } catch {
      toast({
        title: "Backup failed",
        description: "Admin permission required or backup error",
        variant: "destructive",
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
      const res = await axios.get("/api/" + backup.download_url, {
        responseType: "blob",
        withCredentials: true,
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Download error",
        description: "Unauthorized or file missing",
        variant: "destructive",
      });
    }
  };


  /* =======================
     DELETE BACKUP
  ======================= */

  const handleDelete = async (backup: Backup) => {
    if (!deleteId) return;

    try {
      await axios.delete(`${API_BASE}/${deleteId}`, {
        withCredentials: true,
      });

      setBackups(prev => prev.filter(b => b.id !== deleteId));

      toast({
        title: "Deleted",
        description: "Backup removed successfully",
      });
    } catch {
      toast({
        title: "Delete failed",
        description: "Admin permission required",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Layout>  
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Backup & Recovery</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage database and file backups</p>
            </div>
            <Button variant="outline" onClick={loadData} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {([
              { type: 'full' as const, icon: HardDrive, title: 'Full Backup', desc: 'Database + uploaded files' },
              { type: 'database' as const, icon: FileArchive, title: 'Database Only', desc: 'SQL dump of all tables' },
              { type: 'files' as const, icon: FileArchive, title: 'Files Only', desc: 'Uploaded images & documents' },
            ]).map(item => (
              <button key={item.type} onClick={() => triggerBackup(item.type)} disabled={isRunning}
                className="bg-card rounded-lg border border-border p-5 text-left hover:bg-muted/30 transition-colors disabled:opacity-50">
                <item.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Play className="h-3 w-3" /> Run Now
                  </span>
                </div>
              </button>
            ))}
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
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Actions</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-border">
                      {backups?.length
                        ? backups.map(backup => {
                            if (!backup) return null; // skip if undefined

                            // safe lookup
                            const tc = typeConfig[backup.type as keyof typeof typeConfig] ?? {
                              label: backup.type,
                              className: "bg-gray-200 text-gray-800 border-gray-200",
                            };

                            return (
                              <tr key={backup.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-4 text-sm font-medium">{backup.filename}</td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${tc.className}`}
                                  >
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
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                      backup.status === "completed"
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        : backup.status === "in_progress"
                                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                        : "bg-destructive/10 text-destructive border-destructive/20"
                                    }`}
                                  >
                                    {backup.status === "in_progress"
                                      ? "In Progress"
                                      : backup.status.charAt(0).toUpperCase() + backup.status.slice(1)}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => downloadBackup(backup)}
                                      disabled={backup.status !== "completed"}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => setDeleteId(backup.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        : (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                              No backups found
                            </td>
                          </tr>
                        )
                      }

                    </tbody>

                </table>
              </div>
            )}
          </div>

          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                <AlertDialogDescription>Are you sure? This backup file will be permanently deleted.</AlertDialogDescription>
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

export default BackupRecovery;
