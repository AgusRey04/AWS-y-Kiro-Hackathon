export interface TabItem {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <nav
      className="flex border-b border-border-light overflow-x-auto"
      role="tablist"
      aria-label="Secciones de la planificación"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 min-w-0 px-3 py-3 text-sm font-semibold font-quicksand
              whitespace-nowrap transition-colors focus:outline-none
              ${
                isActive
                  ? 'text-green-primary bg-white border border-border-light border-b-white rounded-t-xl -mb-px z-10'
                  : 'text-text-muted hover:text-text-dark'
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export type { TabBarProps };
