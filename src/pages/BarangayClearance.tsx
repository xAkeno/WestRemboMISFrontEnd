import { useState, useEffect, useCallback } from 'react';
import { Plus, MoreHorizontal, ArrowUpDown, FolderSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClearanceSearchBar } from '@/components/clearance/ClearanceSearchBar';
import { ClearancePagination } from '@/components/clearance/ClearancePagination';
import { fetchBarangayClearances, FetchClearanceParams } from '@/components/services/clearanceApi';
import { BarangayClearance as BarangayClearanceType } from '@/types/clearance';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layout } from "@/components/Layout";
import { useNavigate } from 'react-router-dom';
import { deleteBarangayClearance } from '@/components/services/clearanceApi';
import DocumentInspectModal from './DocumentInspectModal';

const BarangayClearance = () => {
  const { toast } = useToast();
  const [data, setData] = useState<BarangayClearanceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('issueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // ── Inspect modal — stores the selected clearance row ──────────────────────
  const [inspectRecord, setInspectRecord] = useState<BarangayClearanceType | null>(null);

  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchClearanceParams = {
        page: currentPage,
        pageSize: 15,
        search: searchValue,
        sortField,
        sortDirection,
      };
      const response = await fetchBarangayClearances(params);
      setData(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchValue, sortField, sortDirection, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRefresh = () => {
    loadData();
    toast({ title: "Refreshed", description: "Data has been refreshed" });
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'opacity-50'}`} />
      </div>
    </th>
  );

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this clearance?");
    if (!confirmDelete) return;
    try {
      await deleteBarangayClearance(id);
      toast({ title: "Deleted", description: "Clearance has been deleted successfully." });
      loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete clearance.", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Barangay Clearance</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage barangay clearance records</p>
            </div>
            <Button className="gap-2" onClick={() => navigate('/document-edit/2')}>
              <Plus className="h-4 w-4" />
              New Clearance
            </Button>
          </div>

          <div className="mb-4">
            <ClearanceSearchBar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              onRefresh={handleRefresh}
            />
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
                      <SortHeader field="fullName">Full Name</SortHeader>
                      <SortHeader field="bcertNumber">BCert No.</SortHeader>
                      <SortHeader field="issueDate">Issue Date</SortHeader>
                      <SortHeader field="street">Address</SortHeader>
                      <SortHeader field="dateOfBirth">Date of Birth</SortHeader>
                      <SortHeader field="status">Status</SortHeader>
                      <SortHeader field="fullName">Created By</SortHeader>
                      <SortHeader field="purpose">Purpose</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-primary">
                          {`${item.first_name} ${item.middle_name} ${item.surname}${item.ext_name ? ` ${item.ext_name}` : ''}`}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-primary">
                          {item.bcert_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {item.issued_at}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {`${item.house_block_lot_no} ${item.street}, ${item.zone}`}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(item.dob).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {item.status ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm"
                              style={{
                                backgroundColor:
                                  item.status.toLowerCase() === "approved"  ? "#dcfce7" :
                                  item.status.toLowerCase() === "pending"   ? "#fefce8" :
                                  item.status.toLowerCase() === "scheduled" ? "#eff6ff" :
                                  item.status.toLowerCase() === "rejected"  ? "#fff1f2" :
                                  "#f3f4f6",
                                color:
                                  item.status.toLowerCase() === "approved"  ? "#15803d" :
                                  item.status.toLowerCase() === "pending"   ? "#92400e" :
                                  item.status.toLowerCase() === "scheduled" ? "#1e40af" :
                                  item.status.toLowerCase() === "rejected"  ? "#9f1239" :
                                  "#374151",
                              }}
                            >
                              {item.status}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {item.created_by}
                        </td>
                        <td className="py-3 px-4 text-sm">{item.purpose}</td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">

                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => navigate(`/document-edit/2/${item.bcert_number}`)}
                              >
                                View / Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() =>
                                  navigate(`/document-edit/2/${item.bcert_number}`, {
                                    state: { autoPrint: true },
                                  })
                                }
                              >
                                Print
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* ── Inspect Documents & Schedule ── */}
                              <DropdownMenuItem
                                className="cursor-pointer flex items-center gap-2 font-medium"
                                style={{ color: "#0f2a5e" }}
                                onClick={() => setInspectRecord(item)}
                              >
                                <FolderSearch className="h-3.5 w-3.5" />
                                Inspect Docs &amp; Schedule
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="text-destructive cursor-pointer"
                                onClick={() => handleDelete(Number(item.id))}
                              >
                                Delete
                              </DropdownMenuItem>

                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ClearancePagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* ── Document Inspect & Schedule Modal ── */}
      {inspectRecord && (
        <DocumentInspectModal
          record={{
            id:             inspectRecord.id,
            bcert_number:   inspectRecord.bcert_number,
            first_name:     inspectRecord.first_name,
            surname:        inspectRecord.surname,
            document_type:  "barangay_clearance",
            scheduled_date: (inspectRecord as any).scheduled_date ?? null,
            // ── Pass user_id so the modal fetches /api/mydocuments?user_id=X ──
            // Add user_id to your BarangayClearanceType if not already present.
            user_id:        (inspectRecord as any).user_id,
          }}
          onClose={() => setInspectRecord(null)}
          onScheduled={loadData}
        />
      )}
    </Layout>
  );
};

export default BarangayClearance;