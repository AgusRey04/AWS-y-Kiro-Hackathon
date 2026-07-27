import { NavLink } from 'react-router-dom';

function HouseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3l9-8z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

interface NavItemProps {
  to: string;
  label: string;
  end?: boolean;
  icon: (props: { className?: string }) => React.ReactElement;
}

function NavItem({ to, label, end, icon: Icon }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center flex-1 gap-1 text-xs font-semibold font-quicksand transition-colors ${
          isActive ? 'text-green-primary' : 'text-text-muted'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex items-center justify-center w-11 h-11 rounded-full transition-all ${
              isActive
                ? 'bg-mostaza text-white shadow-md shadow-mostaza/40'
                : 'bg-transparent text-text-muted'
            }`}
          >
            <Icon className="w-5 h-5" />
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-[#F3F0E9] border-t border-border-light flex min-h-[56px] px-4 pt-2 pb-3"
      aria-label="Navegación principal"
    >
      <div className="w-full flex">
        <NavItem to="/home" label="Inicio" icon={HouseIcon} end />
        <NavItem to="/history" label="Historial" icon={ClockIcon} />
      </div>
    </nav>
  );
}
