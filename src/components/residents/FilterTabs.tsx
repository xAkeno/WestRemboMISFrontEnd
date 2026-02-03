import { FilterTab } from '../../types/resident';

interface FilterTabsProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
}

const tabs: FilterTab[] = ['All', 'Verified', 'Voters', 'Active'];

export const FilterTabs = ({ activeTab, onTabChange }: FilterTabsProps) => {
  return (
    <div className="flex rounded-lg bg-muted p-1 gap-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
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
