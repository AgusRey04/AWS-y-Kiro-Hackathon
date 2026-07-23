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

export default function PreviewHeader({
  titulo,
  fechaInicio,
  fechaFin,
  objetivos,
  areaCurricular,
}: PreviewHeaderProps) {
  return (
    <header className="bg-green-primary text-white rounded-b-xl px-4 py-5">
      <p className="text-xs font-medium tracking-wide uppercase opacity-80">
        PLANIFICACIÓN SEMANAL · NIVEL INICIAL
      </p>
      <h1 className="text-xl font-bold font-quicksand mt-1">{titulo}</h1>
      <p className="text-sm mt-1 opacity-90">
        {formatDateRange(fechaInicio, fechaFin)}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-block bg-white/20 text-white text-xs font-medium rounded-full px-3 py-1">
          {areaCurricular}
        </span>
      </div>

      {objetivos.length > 0 && (
        <ul className="mt-3 space-y-1" aria-label="Objetivos">
          {objetivos.map((obj, idx) => (
            <li key={idx} className="text-sm opacity-90 flex items-start gap-1">
              <span className="shrink-0 mt-0.5">•</span>
              <span>{obj}</span>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

export { formatDateRange };
export type { PreviewHeaderProps };
