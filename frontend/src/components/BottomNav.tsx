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
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
    </svg>
  );
}

export default function BottomNav() {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium font-quicksand transition-colors ${
      isActive ? 'text-green-primary' : 'text-text-muted'
    }`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light flex min-h-[56px]"
      aria-label="Navegación principal"
    >
      <NavLink to="/home" className={linkClasses} end>
        {({ isActive }) => (
          <>
            <HouseIcon className={`w-6 h-6 ${isActive ? 'text-green-primary' : 'text-text-muted'}`} />
            <span className="mt-1">Inicio</span>
          </>
        )}
      </NavLink>
      <NavLink to="/history" className={linkClasses}>
        {({ isActive }) => (
          <>
            <ClockIcon className={`w-6 h-6 ${isActive ? 'text-green-primary' : 'text-text-muted'}`} />
            <span className="mt-1">Historial</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
