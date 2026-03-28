import { Search, RotateCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ClearanceSearchBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

export const ClearanceSearchBar = ({ 
  searchValue, 
  onSearchChange, 
  onRefresh 
}: ClearanceSearchBarProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative max-w-xs flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search..."
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
      
      <Button 
        variant="outline" 
        size="icon" 
        className="h-9 w-9 bg-card"
        onClick={onRefresh}
      >
        <RotateCw className="h-4 w-4" />
      </Button>
    </div>
  );
};
