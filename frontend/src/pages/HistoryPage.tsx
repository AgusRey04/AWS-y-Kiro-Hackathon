import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { truncarDescripcion } from '../utils/history';

// --- Types ---

export interface PlanificacionSummary {
  id: string;
  titulo: string;
  descripcion: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  categoria: 'recientes' | 'efemerides' | 'proyectos' | 'archivado';
  imagenUrl: string | null;
  createdAt: string;
}

type Filtro = 'recientes' | 'efemerides' | 'proyectos' | 'archivado';

// --- Category styles ---

const CATEGORY_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  recientes: {
    bg: 'bg-green-primary/10',
    text: 'text-green-primary',
    accent: 'border-t-green-primary',
  },
  // efemerides: {
  //   bg: 'bg-mostaza/20',
  //   text: 'text-[#A67C1B]',
  //   accent: 'border-t-mostaza',
  // },
  // proyectos: {
  //   bg: 'bg-lavanda/15',
  //   text: 'text-lavanda',
  //   accent: 'border-t-lavanda',
  // },
  archivado: {
    bg: 'bg-gray-200',
    text: 'text-text-muted',
    accent: 'border-t-border-light',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  recientes: 'Reciente',
  efemerides: 'Efeméride',
  proyectos: 'Proyecto',
  archivado: 'Archivado',
};

// --- Icons ---

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

function EyeIcon({ className }: { className?: string }) {
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
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ArchiveIcon({ className }: { className?: string }) {
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
      <rect x="3" y="4" width="18" height="4" rx="1.5" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// --- FilterChips component ---

function FilterChips({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: Filtro | null;
  onFilterChange: (filter: Filtro | null) => void;
}) {
  const filters: { id: Filtro; label: string }[] = [
    { id: 'recientes', label: 'Recientes' },
    { id: 'efemerides', label: 'Efemérides' },
    { id: 'proyectos', label: 'Proyectos' },
    { id: 'archivado', label: 'Archivados' },
  ];

  return (
    <div
      className="flex gap-2 flex-wrap sm:justify-end"
      role="group"
      aria-label="Filtros de planificaciones"
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(isActive ? null : filter.id)}
            className={`rounded-full px-4 py-2 min-h-[44px] text-sm font-medium font-quicksand transition-all active:scale-95 ${
              isActive
                ? 'bg-mostaza/45 text-[#8A6410] border border-mostaza/60'
                : 'bg-white border border-border-light text-text-dark hover:bg-gray-50'
            }`}
            aria-pressed={isActive}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

// --- PlanCard component ---

export function PlanCard({
  plan,
  onVer,
  onArchivar,
}: {
  plan: PlanificacionSummary;
  onVer: () => void;
  onArchivar: () => void;
}) {
  const categoryColor = CATEGORY_COLORS[plan.categoria] || CATEGORY_COLORS.recientes;
  const categoryLabel = CATEGORY_LABELS[plan.categoria] || plan.categoria;

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <article
      className={`bg-white rounded-2xl border border-border-light border-t-4 ${categoryColor.accent} shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col`}
    >
      {/* Imagen con badge de fecha superpuesto */}
      <div className="p-3 pb-0">
        <div
          data-testid="plan-card-imagen"
          className="relative h-40 rounded-xl overflow-hidden bg-gradient-to-br from-green-primary/20 to-mostaza/20 flex items-center justify-center"
        >
          {plan.imagenUrl ? (
            <img
              src={plan.imagenUrl}
              alt={plan.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl" aria-hidden="true">📋</span>
          )}

          <span
            data-testid="plan-card-fecha"
            className="absolute top-2 right-2 inline-flex items-center gap-1.5 bg-white/95 text-text-dark text-[11px] font-semibold font-quicksand rounded-full px-2.5 py-1 shadow-sm"
          >
            <CalendarIcon className="w-3 h-3 text-green-primary" />
            {plan.fechaInicio ? formatDate(plan.fechaInicio) : formatDate(plan.createdAt)}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          data-testid="plan-card-titulo"
          className="text-base font-semibold font-quicksand text-green-dark mb-1.5 line-clamp-2"
        >
          {plan.titulo}
        </h3>

        {/* Descripción (máx. 80 caracteres visibles - Req 7.1) */}
        <p
          data-testid="plan-card-descripcion"
          className="text-sm text-text-muted font-quicksand leading-relaxed mb-3 flex-1"
        >
          {truncarDescripcion(plan.descripcion)}
        </p>

        {/* Chip de categoría */}
        <div className="mb-4">
          <span
            data-testid="plan-card-categoria"
            className={`inline-block text-[10px] font-bold uppercase tracking-wider rounded-md px-2 py-1 ${categoryColor.bg} ${categoryColor.text}`}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={onVer}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 border border-border-light text-text-dark font-semibold font-quicksand text-sm rounded-xl px-4 py-3 min-h-[48px] transition-all active:scale-95 hover:bg-gray-200"
          >
            <EyeIcon className="w-4 h-4" />
            Ver
          </button>
          <button
            onClick={onArchivar}
            className="flex-1 flex items-center justify-center gap-2 bg-green-dark text-white font-semibold font-quicksand text-sm rounded-xl px-4 py-3 min-h-[48px] transition-all active:scale-95 hover:brightness-110"
          >
            <ArchiveIcon className="w-4 h-4" />
            {plan.categoria === 'archivado' ? 'Desarchivar' : 'Archivar'}
          </button>
        </div>
      </div>
    </article>
  );
}

// --- EmptyState component ---

function EmptyState({ onNavigateHome }: { onNavigateHome: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-6xl mb-4" aria-hidden="true">📝</span>
      <h2 className="text-xl font-bold font-quicksand text-text-dark mb-2">
        No hay planificaciones aún
      </h2>
      <p className="text-text-muted font-quicksand mb-6 max-w-sm">
        Todavía no creaste ninguna planificación. ¡Empezá ahora y organizá tu semana!
      </p>
      <button
        onClick={onNavigateHome}
        className="bg-mostaza text-white font-bold font-quicksand rounded-full px-6 py-3 min-h-[56px] transition-all active:scale-95 hover:brightness-110"
      >
        Crear mi primera planificación
      </button>
    </div>
  );
}

// --- Main HistoryPage ---

export default function HistoryPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanificacionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filtro | null>(null);

  const fetchPlans = useCallback(async (filtro: Filtro | null) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = filtro
        ? `/api/planificaciones?filtro=${filtro}`
        : '/api/planificaciones';

      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('No pudimos cargar tus planificaciones. Intentá de nuevo.');
      }

      const json = await res.json();
      setPlans(json.data || []);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Error al cargar el historial.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans(activeFilter);
  }, [activeFilter, fetchPlans]);

  const handleFilterChange = (filter: Filtro | null) => {
    setActiveFilter(filter);
  };

  const handleVer = (id: string) => {
    navigate(`/preview/${id}`);
  };

  const handleArchivar = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`/api/planificaciones/${id}/archivar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        // Refrescar la lista para reflejar el cambio de categoría
        fetchPlans(activeFilter);
      } else {
        setError('No se pudo archivar la planificación. Intentá de nuevo.');
      }
    } catch {
      setError('Error de conexión al archivar. Intentá de nuevo.');
    }
  };

  const handleNavigateHome = () => {
    navigate('/home');
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-6 pb-4 overflow-x-hidden">
      {/* Encabezado + filtros */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-quicksand text-green-primary">
            Mis Planificaciones
          </h1>
          <p className="text-sm text-text-muted font-quicksand mt-2 max-w-md leading-relaxed">
            Revisá tus actividades pasadas, descargá materiales y volvé a imprimir tus
            guías personalizadas para el aula.
          </p>
        </div>

        <FilterChips activeFilter={activeFilter} onFilterChange={handleFilterChange} />
      </header>

      {/* Contenido */}
      {isLoading && (
        <div className="flex items-center justify-center py-16" role="status">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-green-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-muted font-quicksand text-sm">Cargando planificaciones...</p>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <p className="text-red-600 font-quicksand mb-4">{error}</p>
          <button
            onClick={() => fetchPlans(activeFilter)}
            className="bg-green-primary text-white font-bold font-quicksand rounded-full px-6 py-3 min-h-[56px] transition-all active:scale-95 hover:brightness-110"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && plans.length === 0 && (
        <EmptyState onNavigateHome={handleNavigateHome} />
      )}

      {!isLoading && !error && plans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onVer={() => handleVer(plan.id)}
              onArchivar={() => handleArchivar(plan.id)}
            />
          ))}
        </div>
      )}

      {/* Acción flotante: nueva planificación */}
      <button
        type="button"
        onClick={handleNavigateHome}
        className="fixed bottom-24 right-6 z-30 w-14 h-14 rounded-full bg-green-primary text-white shadow-lg flex items-center justify-center transition-all hover:brightness-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark focus-visible:ring-offset-2"
        aria-label="Nueva planificación"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
    </div>
  );
}
