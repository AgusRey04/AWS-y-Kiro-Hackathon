import { useNavigate } from 'react-router-dom';

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22c-.3-3.4.5-6 2.3-8.2 1.2-1.4 2.7-2.4 4.4-3-.2 3.3-1.4 5.8-3.4 7.4-.9.7-1.9 1.2-3 1.5.3-2.6 1.5-4.7 3.5-6.4-2.6 1-4.5 2.9-5.6 5.6-.9-2.9-2.9-5-5.8-6.2 2.2 1.7 3.6 3.8 4.1 6.4-1.2-.3-2.3-.8-3.3-1.6C3 15.6 1.9 12.9 1.8 9.4c1.9.6 3.5 1.7 4.8 3.2C8.5 14.9 9.4 17.9 9 22h3z" />
      <path d="M12 2c1.9 1.7 3 3.6 3 5.6 0 1.9-1 3.5-3 4.9-2-1.4-3-3-3-4.9C9 5.6 10.1 3.7 12 2z" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
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

export default function TopHeader() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 bg-bg-cream/90 backdrop-blur-sm border-b border-border-light">
      <div className="w-full flex items-center justify-between px-6 h-16">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 -ml-1 px-1 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary"
          aria-label="Ir al inicio de EduPlanner"
        >
          <LeafIcon className="w-6 h-6 text-green-primary" />
          <span className="text-lg font-bold font-quicksand text-green-primary tracking-tight">
            EduPlanner
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/history')}
          className="w-10 h-10 flex items-center justify-center rounded-full text-text-muted transition-colors hover:bg-black/5 hover:text-green-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary"
          aria-label="Ver historial de planificaciones"
        >
          <HistoryIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
