import { FilterTab } from '../../types/resident';

interface FilterTabsProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  FilterChange: (value: string) => void;
}


const tabs: FilterTab[] = ['All', 'Verified', 'Voters', 'Active'];
const FILTER_URLS: Record<FilterTab, string> = {
  All: 'http://127.0.0.1:8000/api/residents',
  Verified: 'http://127.0.0.1:8000/api/residents?verified=1',
  Voters: 'http://127.0.0.1:8000/api/residents?voter=1',
  Active: 'http://127.0.0.1:8000/api/residents?active=1',
};



export const FilterTabs = ({ activeTab, onTabChange, FilterChange }: FilterTabsProps) => {
  return (
    <div className="flex rounded-lg bg-muted p-1 gap-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => {
            onTabChange(tab);   // UI state
            FilterChange(tab);  // 👈 selected value
          }}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === tab
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
