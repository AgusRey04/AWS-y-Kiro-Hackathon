export interface TabItem {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

type IconProps = { className?: string };

function ActividadesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 6.5S10 4.5 5 4.5v13c5 0 7 2 7 2s2-2 7-2v-13c-5 0-7 2-7 2z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

function MaterialesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="4" rx="1.5" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

function AdaptacionesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3v4M12 17v4M4.6 7.5l3.4 2M16 14.5l3.4 2M4.6 16.5l3.4-2M16 9.5l3.4-2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function FundamentacionIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20z" />
      <path d="M14.5 3.5V8H19M9 12.5h6M9 16h4" />
    </svg>
  );
}

const TAB_ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  actividades: ActividadesIcon,
  materiales: MaterialesIcon,
  adaptaciones: AdaptacionesIcon,
  fundamentacion: FundamentacionIcon,
};

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto px-2 -mb-px"
      role="tablist"
      aria-label="Secciones de la planificación"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = TAB_ICONS[tab.id];

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 shrink-0 px-5 py-3.5 text-[15px] font-semibold font-quicksand
              whitespace-nowrap rounded-t-xl transition-colors focus:outline-none
              focus-visible:ring-2 focus-visible:ring-green-primary
              ${
                isActive
                  ? 'text-green-dark bg-white border border-border-light border-b-white relative z-10'
                  : 'text-text-muted bg-[#EFEDE7] border border-transparent hover:text-text-dark hover:bg-[#E8E5DD]'
              }
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export type { TabBarProps };
