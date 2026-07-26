import { useState } from 'react';
import type { Actividad } from '../types';
import { usePlan } from '../contexts/PlanContext';
import EditableBlock from './EditableBlock';
import AgregarActividadForm, { type NuevaActividadInput } from './AgregarActividadForm';

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

/** Semana de una actividad, tolerante a datos viejos sin el campo. */
function semanaDe(actividad: Actividad): number {
  const valor = Number(actividad.semana);
  return Number.isFinite(valor) && valor >= 1 ? Math.trunc(valor) : 1;
}

/** Semanas presentes en el conjunto de actividades, en orden ascendente. */
export function semanasPresentes(actividades: Actividad[]): number[] {
  return [...new Set(actividades.map(semanaDe))].sort((a, b) => a - b);
}

/** Última semana existente (la que se propone por defecto al agregar). */
export function ultimaSemana(actividades: Actividad[]): number {
  const semanas = semanasPresentes(actividades);
  return semanas.length > 0 ? semanas[semanas.length - 1] : 1;
}

/**
 * Encabezado de una tarjeta. Con una sola semana se muestra solo el día para
 * evitar ruido visual; con varias semanas se prefija "Semana N · ".
 */
export function tituloTarjeta(semana: number, dia: Actividad['dia'], variasSemanas: boolean): string {
  return variasSemanas ? `Semana ${semana} · ${DAY_LABELS[dia]}` : DAY_LABELS[dia];
}

/** Etiqueta accesible de una tarjeta, coherente con el encabezado visible. */
export function etiquetaTarjeta(semana: number, dia: Actividad['dia'], variasSemanas: boolean): string {
  return variasSemanas
    ? `Actividades de la semana ${semana}, ${DAY_LABELS[dia]}`
    : `Actividades del ${DAY_LABELS[dia]}`;
}

interface GrupoActividades {
  semana: number;
  dia: Actividad['dia'];
  titulo: string;
  etiqueta: string;
  color: string;
  actividades: Actividad[];
}

/**
 * Agrupa las actividades por semana ascendente y, dentro de cada semana, por día
 * en el orden fijo lunes → viernes. Los grupos vacíos se descartan.
 */
export function agruparActividades(actividades: Actividad[]): GrupoActividades[] {
  const semanas = semanasPresentes(actividades);
  const variasSemanas = semanas.length > 1;

  const grupos: GrupoActividades[] = [];
  for (const semana of semanas) {
    for (const dia of DAY_ORDER) {
      const delGrupo = actividades
        .filter((a) => semanaDe(a) === semana && a.dia === dia)
        .sort((a, b) => a.orden - b.orden);

      if (delGrupo.length === 0) continue;

      grupos.push({
        semana,
        dia,
        titulo: tituloTarjeta(semana, dia, variasSemanas),
        etiqueta: etiquetaTarjeta(semana, dia, variasSemanas),
        color: DAY_COLORS[dia],
        actividades: delGrupo,
      });
    }
  }

  return grupos;
}

interface ActividadesTabProps {
  actividades: Actividad[];
  planificacionId?: string;
}

export default function ActividadesTab({ actividades, planificacionId }: ActividadesTabProps) {
  const { updateField, addActividad } = usePlan();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = async (input: NuevaActividadInput) => {
    await addActividad(input);
    setIsFormOpen(false);
  };

  const agregarButton = planificacionId ? (
    <button
      onClick={() => setIsFormOpen(true)}
      className="mt-4 w-full border-2 border-dashed border-green-primary/40 text-green-primary rounded-full px-6 py-3 min-h-[56px] font-quicksand text-sm font-medium hover:bg-green-primary/5 active:scale-95 transition-all"
      aria-label="Agregar actividad"
      aria-haspopup="dialog"
      aria-expanded={isFormOpen}
    >
      + Agregar actividad
    </button>
  ) : null;

  const formulario = isFormOpen ? (
    <AgregarActividadForm
      onSubmit={handleSubmit}
      onCancel={() => setIsFormOpen(false)}
      semanaInicial={ultimaSemana(actividades)}
    />
  ) : null;

  if (actividades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted font-quicksand text-center text-sm">
          No hay actividades disponibles para esta planificación.
        </p>
        {agregarButton}
        {formulario}
      </div>
    );
  }

  const grupos = agruparActividades(actividades);

  return (
    <div>
      <div className="space-y-4" role="list" aria-label="Actividades por semana y día">
        {grupos.map((grupo) => (
          <DayCard
            key={`${grupo.semana}-${grupo.dia}`}
            dia={grupo.titulo}
            etiqueta={grupo.etiqueta}
            color={grupo.color}
            actividades={grupo.actividades}
            planificacionId={planificacionId}
            onUpdateField={updateField}
          />
        ))}
      </div>

      {/* Botón único para agregar actividad (al final del listado) */}
      {agregarButton}
      {formulario}
    </div>
  );
}

interface DayCardProps {
  /** Texto del encabezado: "Lunes" o "Semana 2 · Lunes". */
  dia: string;
  /** Etiqueta accesible; por defecto se deriva del encabezado. */
  etiqueta?: string;
  color: string;
  actividades: Actividad[];
  planificacionId?: string;
  onUpdateField: (path: string, value: string) => Promise<void>;
}

function DayCard({
  dia,
  etiqueta,
  color,
  actividades,
  planificacionId,
  onUpdateField,
}: DayCardProps) {
  return (
    <article
      className="bg-white rounded-xl shadow-sm border border-border-light p-4"
      style={{ borderLeftWidth: '4px', borderLeftColor: color }}
      role="listitem"
      aria-label={etiqueta ?? `Actividades del ${dia}`}
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
    </article>
  );
}

export { DayCard, DAY_ORDER, DAY_COLORS, DAY_LABELS };
