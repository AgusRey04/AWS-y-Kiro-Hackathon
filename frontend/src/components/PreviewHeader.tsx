interface PreviewHeaderProps {
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  objetivos: string[];
  areaCurricular: string;
}

function formatDateRange(fechaInicio: string, fechaFin: string): string {
  const start = new Date(fechaInicio + 'T00:00:00');
  const end = new Date(fechaFin + 'T00:00:00');

  const dayStart = start.getDate();
  const dayEnd = end.getDate();

  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];

  const monthStart = months[start.getMonth()];
  const monthEnd = months[end.getMonth()];
  const year = end.getFullYear();

  if (monthStart === monthEnd) {
    return `${dayStart} - ${dayEnd} ${monthEnd} ${year}`;
  }
  return `${dayStart} ${monthStart} - ${dayEnd} ${monthEnd} ${year}`;
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

export default function PreviewHeader({
  titulo,
  fechaInicio,
  fechaFin,
  objetivos,
  areaCurricular,
}: PreviewHeaderProps) {
  return (
    <header className="bg-white rounded-2xl border border-border-light border-l-[6px] sm:border-l-[8px] border-l-green-primary shadow-sm px-5 py-6 sm:px-9 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-bold font-quicksand text-text-dark break-words leading-tight">
            {titulo}
          </h1>
          <p className="text-[11px] sm:text-[13px] font-bold tracking-[0.14em] uppercase text-green-primary mt-2 sm:mt-2.5">
            PLANIFICACIÓN SEMANAL · NIVEL INICIAL
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[#D9F0DC] text-green-dark text-[13px] sm:text-[15px] font-semibold font-quicksand px-3.5 py-2 sm:px-4 sm:py-2.5">
          <CalendarIcon className="w-4 h-4" />
          {formatDateRange(fechaInicio, fechaFin)}
        </span>
      </div>

      <div className="mt-6 sm:mt-7 border-t border-border-light pt-6 sm:pt-7 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Objetivos pedagógicos */}
        <div>
          <p className="flex items-center gap-2 text-[11px] sm:text-[13px] font-bold tracking-[0.14em] uppercase text-text-muted">
            <TargetIcon className="w-[18px] h-[18px]" />
            Objetivos pedagógicos
          </p>

          {objetivos.length > 0 && (
            <ul className="mt-4 space-y-3" aria-label="Objetivos">
              {objetivos.map((obj, idx) => (
                <li
                  key={idx}
                  className="text-sm sm:text-[15px] font-quicksand text-text-dark flex items-start gap-2.5 leading-relaxed"
                >
                  <CheckCircleIcon className="w-[18px] h-[18px] mt-0.5 shrink-0 text-green-primary" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Área curricular */}
        <div className="rounded-xl bg-[#FDF3DF] px-4 py-3.5 sm:px-5 sm:py-4">
          <p className="text-[11px] sm:text-[13px] font-bold tracking-[0.14em] uppercase text-[#A67C1B]">
            Área curricular
          </p>
          <p className="mt-2 text-sm sm:text-[15px] font-quicksand italic text-text-dark leading-relaxed">
            {areaCurricular}
          </p>
        </div>
      </div>
    </header>
  );
}

export { formatDateRange };
export type { PreviewHeaderProps };
