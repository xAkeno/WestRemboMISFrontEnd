import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterTabs } from './FilterTabs';
import { SearchBar } from './SearchBar';
import { ResidentsTable } from './ResidentsTable';
import { Pagination } from './Pagination';
import { fetchResidents, FetchResidentsParams } from '../services/api';
import { Resident, FilterTab, SortField, SortDirection, ResidentsResponse } from '../../types/resident';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '../Layout';
import { useNavigate } from 'react-router-dom';

export const ResidentsPage = () => {
  const { toast } = useToast();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters & pagination state
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const loadResidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchResidentsParams = {
        page: currentPage,
        pageSize: 15,
        search: searchValue,
        filter: activeTab,
        sortField,
        sortDirection,
      };
      
      const response: ResidentsResponse = await fetchResidents(params);
      setResidents(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load residents data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchValue, activeTab, sortField, sortDirection, toast]);

  useEffect(() => {
    loadResidents();
  }, [loadResidents]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchValue]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRefresh = () => {
    loadResidents();
    toast({
      title: "Refreshed",
      description: "Data has been refreshed",
    });
  };
  const navigate = useNavigate();

  const [filterValue, setFilterValue] = useState('http://127.0.0.1:8000/api/residents');

  const handleFilterChange = (value: string) => {
    setFilterValue(value);
  }

  return (
    <Layout>
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Residents</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  View and manage resident records
                </p>
              </div>
              <Button className="gap-2" onClick={() => navigate('create')}>
                <Plus className="h-4 w-4" />
                Create Resident
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="mb-4">
              <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} FilterChange={handleFilterChange} />
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <SearchBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onRefresh={handleRefresh}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>

            {/* Table */}
            <ResidentsTable
              residents={residents}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              isLoading={isLoading}



              filterValue={filterValue}
            />

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
    </Layout>
  );
};
