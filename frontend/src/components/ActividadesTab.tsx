import type { Actividad } from '../types';

const DAY_ORDER: Actividad['dia'][] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

const DAY_COLORS: Record<Actividad['dia'], string> = {
  lunes: '#4A7856',
  martes: '#E9B44C',
  miercoles: '#D97706',
  jueves: '#92400E',
  viernes: '#9B89B3',
};

const DAY_LABELS: Record<Actividad['dia'], string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
};

interface ActividadesTabProps {
  actividades: Actividad[];
}

export default function ActividadesTab({ actividades }: ActividadesTabProps) {
  if (actividades.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-muted font-quicksand text-center text-sm">
          No hay actividades disponibles para esta planificación.
        </p>
      </div>
    );
  }

  const grouped = DAY_ORDER.map((dia) => ({
    dia,
    label: DAY_LABELS[dia],
    color: DAY_COLORS[dia],
    actividades: actividades
      .filter((a) => a.dia === dia)
      .sort((a, b) => a.orden - b.orden),
  })).filter((group) => group.actividades.length > 0);

  return (
    <div className="space-y-4" role="list" aria-label="Actividades por día">
      {grouped.map((group) => (
        <DayCard
          key={group.dia}
          dia={group.label}
          color={group.color}
          actividades={group.actividades}
        />
      ))}
    </div>
  );
}

interface DayCardProps {
  dia: string;
  color: string;
  actividades: Actividad[];
}

function DayCard({ dia, color, actividades }: DayCardProps) {
  return (
    <article
      className="bg-white rounded-xl shadow-sm border border-border-light p-4"
      style={{ borderLeftWidth: '4px', borderLeftColor: color }}
      role="listitem"
      aria-label={`Actividades del ${dia}`}
    >
      <h3 className="text-sm font-bold font-quicksand text-text-dark uppercase tracking-wide mb-2">
        {dia}
      </h3>
      <div className="space-y-2">
        {actividades.map((actividad) => (
          <div key={actividad.id}>
            <p className="text-sm font-semibold font-quicksand text-text-dark">
              {actividad.titulo}
            </p>
            <p className="text-sm font-quicksand text-text-muted mt-0.5">
              {actividad.descripcion}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

export { DayCard, DAY_ORDER, DAY_COLORS, DAY_LABELS };
