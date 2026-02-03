import { Search, SlidersHorizontal, RotateCw, List, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

export const SearchBar = ({ 
  searchValue, 
  onSearchChange, 
  onRefresh, 
  viewMode, 
  onViewModeChange 
}: SearchBarProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 h-9 bg-card border-border"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
        
        <Button variant="outline" size="icon" className="h-9 w-9 bg-card">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 bg-card"
          onClick={onRefresh}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => onViewModeChange('list')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => onViewModeChange('grid')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
