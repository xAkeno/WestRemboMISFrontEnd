import { useState, useEffect, useCallback } from 'react';
import { Plus, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClearanceSearchBar } from '@/components/clearance/ClearanceSearchBar';
import { ClearancePagination } from '@/components/clearance/ClearancePagination';
import { deleteBarangayClearance, fetchBuildingClearances, FetchClearanceParams } from '@/components/services/clearanceApi';
import { BuildingClearance as BuildingClearanceType } from '@/types/clearance';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layout } from "@/components/Layout";
import { useNavigate } from 'react-router-dom';

const BuildingClearance = () => {
  const { toast } = useToast();
  const [data, setData] = useState<BuildingClearanceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('issuedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
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
      const response = await fetchBuildingClearances(params);
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
  const handleDelete = async (id: number) => {
      const confirmDelete = window.confirm("Are you sure you want to delete this clearance?");
      if (!confirmDelete) return;

      try {
        await deleteBarangayClearance(id);

        toast({
          title: "Deleted",
          description: "Clearance has been deleted successfully.",
        });

        loadData(); // refresh table
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete clearance.",
          variant: "destructive",
        });
      }
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

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Building Clearance</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage building clearance records</p>
            </div>
            <Button className="gap-2" onClick={() => navigate('/document-edit/3')}>
              <Plus className="h-4 w-4" />
              New Clearance
            </Button>
          </div>

          <div className="mb-4">
            <ClearanceSearchBar searchValue={searchValue} onSearchChange={setSearchValue} onRefresh={handleRefresh} />
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <SortHeader field="surname">Full Name</SortHeader>
                      <SortHeader field="bcertNumber">BCert Number</SortHeader>
                      <SortHeader field="issuedDate">Issue Date</SortHeader>
                      <SortHeader field="establishment">Establishment</SortHeader>
                      <SortHeader field="purpose">Purpose</SortHeader>
                      <SortHeader field="street">Address</SortHeader>
                      <SortHeader field="orNo">OR No.</SortHeader>
                      <SortHeader field="orNo">Created By</SortHeader>
                      <SortHeader field="remarks">Remarks</SortHeader>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-sm">{`${item.firstname} ${item.middlename} ${item.surname}`}</td>
                        <td className="py-3 px-4 text-sm font-medium text-primary">{item.bcert_number}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(item.issuedDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm font-medium">{item.establishment}</td>
                        <td className="py-3 px-4 text-sm">{item.purpose}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{`${item.houseBlockLot}, ${item.street}, ${item.zone}`}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{item.orNo}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{item.created_by}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{item.remarks || '-'}</td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {navigate(`/document-edit/3/${item.bcert_number}`)}} className='cursor-pointer'>View / Edit</DropdownMenuItem>
                                {/* <DropdownMenuItem>Edit</DropdownMenuItem> */}
                                <DropdownMenuItem
                                  onClick={() => navigate(`/document-edit/2/${item.bcert_number}`, { state: { autoPrint: true } })}
                                >
                                  Print
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(Number(item.id))}
                                  className="text-destructive cursor-pointer"
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

          <ClearancePagination currentPage={currentPage} totalPages={totalPages} total={total} onPageChange={setCurrentPage} />
        </div>
      </div>
    </Layout>
  );
};

export default BuildingClearance;
