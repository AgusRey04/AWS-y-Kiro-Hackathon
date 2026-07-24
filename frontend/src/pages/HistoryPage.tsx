import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Types ---

interface PlanificacionSummary {
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

// --- Category chip colors ---

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  recientes: { bg: 'bg-green-primary/10', text: 'text-green-primary' },
  efemerides: { bg: 'bg-mostaza/10', text: 'text-mostaza' },
  proyectos: { bg: 'bg-lavanda/10', text: 'text-lavanda' },
  archivado: { bg: 'bg-gray-200', text: 'text-text-muted' },
};

const CATEGORY_LABELS: Record<string, string> = {
  recientes: 'Reciente',
  efemerides: 'Efeméride',
  proyectos: 'Proyecto',
  archivado: 'Archivado',
};

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
    <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtros de planificaciones">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(isActive ? null : filter.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium font-quicksand transition-all active:scale-95 ${
              isActive
                ? 'bg-green-primary text-white'
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

function PlanCard({
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
    <article className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden flex flex-col">
      {/* Image */}
      <div className="h-32 bg-gradient-to-br from-green-primary/20 to-mostaza/20 flex items-center justify-center">
        {plan.imagenUrl ? (
          <img
            src={plan.imagenUrl}
            alt={plan.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl" aria-hidden="true">📋</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Date badge */}
        <span className="inline-block text-xs font-medium text-text-muted bg-gray-100 rounded-full px-2 py-0.5 w-fit mb-2">
          {plan.fechaInicio ? formatDate(plan.fechaInicio) : formatDate(plan.createdAt)}
        </span>

        {/* Title */}
        <h3 className="text-base font-bold font-quicksand text-text-dark mb-1 line-clamp-2">
          {plan.titulo}
        </h3>

        {/* Description */}
        <p className="text-sm text-text-muted font-quicksand mb-3 flex-1">
          {plan.descripcion}
        </p>

        {/* Category chip */}
        <div className="mb-3">
          <span
            className={`inline-block text-xs font-medium rounded-full px-3 py-1 ${categoryColor.bg} ${categoryColor.text}`}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onVer}
            className="flex-1 bg-green-primary text-white font-bold font-quicksand text-sm rounded-full px-4 py-3 min-h-[56px] transition-all active:scale-95 hover:brightness-110"
          >
            Ver
          </button>
          <button
            onClick={onArchivar}
            className="flex-1 border-2 border-green-primary text-green-primary font-bold font-quicksand text-sm rounded-full px-4 py-3 min-h-[56px] transition-all active:scale-95 hover:bg-green-primary/5"
          >
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
    <div className="flex flex-col min-h-full bg-bg-cream p-4">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold font-quicksand text-text-dark">
          Historial
        </h1>
        <p className="text-sm text-text-muted font-quicksand mt-1">
          Tus planificaciones anteriores
        </p>
      </header>

      {/* Filters */}
      <div className="mb-4">
        <FilterChips activeFilter={activeFilter} onFilterChange={handleFilterChange} />
      </div>

      {/* Content */}
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
            className="bg-green-primary text-white font-bold font-quicksand rounded-full px-6 py-3 min-h-[56px] transition-all active:scale-95"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && plans.length === 0 && (
        <EmptyState onNavigateHome={handleNavigateHome} />
      )}

      {!isLoading && !error && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  );
}
