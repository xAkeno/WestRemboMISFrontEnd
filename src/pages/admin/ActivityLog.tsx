import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Search, Filter, RefreshCw, LogIn, UserCog, FilePlus, FileEdit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import {Layout} from '@/components/Layout';
const API_BASE = 'https://westrembomis.onrender.com/api';

interface ActivityLogEntry {
  id: number;
  user_name: string;
  user_email: string;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  login_attempt: { label: 'Login Attempt', icon: LogIn, variant: 'outline' },
  account_change: { label: 'Account Change', icon: UserCog, variant: 'secondary' },
  new_document: { label: 'New Document', icon: FilePlus, variant: 'default' },
  update_document: { label: 'Update Document', icon: FileEdit, variant: 'secondary' },
  delete_document: { label: 'Delete Document', icon: Trash2, variant: 'destructive' },
  other: { label: 'Other', icon: Activity, variant: 'outline' },
};

export default function ActivityLog() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 20;

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;

      const res = await axios.get(`${API_BASE}/activity-logs`, { params, withCredentials: true });
      const data = res.data;
      console.log("Fetched activity logs:", data);
      if (data.data) {
        setLogs(data.data);
        setTotalPages(data.last_page || 1);
        setTotalItems(data.total || 0);
        setCurrentPage(data.current_page || 1);
      } else {
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch activity logs.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [typeFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTypeInfo = (type: string) => {
    return typeConfig[type] || typeConfig.other;
  };

  const stats = {
    total: totalItems,
    logins: logs.filter(l => l.action.includes('login')).length,
    documents: logs.filter(l => l.action.includes('document')).length,
    accounts: logs.filter(l => l.action.includes('account')).length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">Track all system activities including logins, account changes, and document operations.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Login Attempts</CardTitle>
              <LogIn className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.logins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Document Actions</CardTitle>
              <FilePlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.documents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Changes</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accounts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Records</CardTitle>
            <CardDescription>Browse and filter all system activity logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="login_attempt">Login Attempts</SelectItem>
                  <SelectItem value="account_change">Account Changes</SelectItem>
                  <SelectItem value="new_document">New Documents</SelectItem>
                  <SelectItem value="update_document">Updated Documents</SelectItem>
                  <SelectItem value="delete_document">Deleted Documents</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => fetchLogs(currentPage)} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Table */}
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[130px]">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                        Loading activity logs...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No activity logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => {
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{log.user_name}</p>
                              <p className="text-xs text-muted-foreground">{log.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{log.action}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                            {log.description}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {log.ip_address}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({totalItems} total entries)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || loading}
                    onClick={() => { setCurrentPage(currentPage - 1); fetchLogs(currentPage - 1); }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || loading}
                    onClick={() => { setCurrentPage(currentPage + 1); fetchLogs(currentPage + 1); }}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}