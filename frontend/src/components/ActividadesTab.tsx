import type { Actividad } from '../types';
import { usePlan } from '../contexts/PlanContext';
import EditableBlock from './EditableBlock';

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
  planificacionId?: string;
}

export default function ActividadesTab({ actividades, planificacionId }: ActividadesTabProps) {
  const { updateField, addActividad } = usePlan();

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
          diaKey={group.dia}
          color={group.color}
          actividades={group.actividades}
          planificacionId={planificacionId}
          onUpdateField={updateField}
          onAddActividad={addActividad}
        />
      ))}
    </div>
  );
}

interface DayCardProps {
  dia: string;
  diaKey: string;
  color: string;
  actividades: Actividad[];
  planificacionId?: string;
  onUpdateField: (path: string, value: string) => Promise<void>;
  onAddActividad: (dia: string) => void;
}

function DayCard({ dia, diaKey, color, actividades, planificacionId, onUpdateField, onAddActividad }: DayCardProps) {
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
            {planificacionId ? (
              <>
                <EditableBlock
                  content={actividad.titulo}
                  maxLength={500}
                  onSave={(newValue) => onUpdateField(`actividades.${actividad.id}.titulo`, newValue)}
                  type="title"
                  fieldPath={`actividades.${actividad.id}.titulo`}
                  planificacionId={planificacionId}
                  className="text-sm font-quicksand text-text-dark"
                  as="p"
                />
                <EditableBlock
                  content={actividad.descripcion}
                  maxLength={2000}
                  onSave={(newValue) => onUpdateField(`actividades.${actividad.id}.descripcion`, newValue)}
                  type="description"
                  fieldPath={`actividades.${actividad.id}.descripcion`}
                  planificacionId={planificacionId}
                  className="text-sm font-quicksand text-text-muted mt-0.5"
                  as="p"
                />
              </>
            ) : (
              <>
                <p className="text-sm font-semibold font-quicksand text-text-dark">
                  {actividad.titulo}
                </p>
                <p className="text-sm font-quicksand text-text-muted mt-0.5">
                  {actividad.descripcion}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Agregar actividad button */}
      {planificacionId && (
        <button
          onClick={() => onAddActividad(diaKey)}
          className="mt-3 w-full border-2 border-dashed border-green-primary/40 text-green-primary rounded-full px-6 py-3 min-h-[56px] font-quicksand text-sm font-medium hover:bg-green-primary/5 active:scale-95 transition-all"
          aria-label={`Agregar actividad para ${dia}`}
        >
          + Agregar actividad
        </button>
      )}
    </article>
  );
}

export { DayCard, DAY_ORDER, DAY_COLORS, DAY_LABELS };
