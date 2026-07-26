import { useEffect, useRef, useState } from 'react';
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

/**
 * Etiqueta accesible del botón de eliminar. Incluye el título de la actividad
 * para distinguir un botón de otro cuando hay varias en la misma tarjeta.
 */
export function etiquetaEliminar(titulo: string | undefined): string {
  const limpio = (titulo ?? '').trim();
  return limpio ? `Eliminar actividad: ${limpio}` : 'Eliminar actividad sin título';
}

/** Ícono de tacho de basura (SVG inline, mismo estilo que los íconos de BottomNav). */
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 3h6a1 1 0 011 1v1h4v2H4V5h4V4a1 1 0 011-1zm1 2h4V4h-4v1zM6 9h12l-1 11a2 2 0 01-2 2H9a2 2 0 01-2-2L6 9zm4 2v9h1.5v-9H10zm2.5 0v9H14v-9h-1.5z" />
    </svg>
  );
}

interface ActividadesTabProps {
  actividades: Actividad[];
  planificacionId?: string;
}

export default function ActividadesTab({ actividades, planificacionId }: ActividadesTabProps) {
  const { updateField, addActividad, deleteActividad } = usePlan();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [aEliminar, setAEliminar] = useState<Actividad | null>(null);

  const handleSubmit = async (input: NuevaActividadInput) => {
    await addActividad(input);
    setIsFormOpen(false);
  };

  const confirmarBorrado = aEliminar ? (
    <ConfirmarBorradoActividad
      actividad={aEliminar}
      onConfirm={async () => {
        await deleteActividad(aEliminar.id);
        setAEliminar(null);
      }}
      onCancel={() => setAEliminar(null)}
    />
  ) : null;

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
        {confirmarBorrado}
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
            onSolicitarEliminar={setAEliminar}
          />
        ))}
      </div>

      {/* Botón único para agregar actividad (al final del listado) */}
      {agregarButton}
      {formulario}
      {confirmarBorrado}
    </div>
  );
}

interface ConfirmarBorradoActividadProps {
  actividad: Actividad;
  /** Si rechaza, el diálogo permanece abierto mostrando el error para reintentar. */
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Diálogo de confirmación de borrado. Sigue el patrón de AgregarActividadForm:
 * overlay fijo, role="dialog" + aria-modal, foco inicial dentro del diálogo y
 * cierre con Escape. No se usa window.confirm (no es accesible ni testeable).
 */
function ConfirmarBorradoActividad({
  actividad,
  onConfirm,
  onCancel,
}: ConfirmarBorradoActividadProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Foco inicial en "Cancelar": es la opción segura ante una acción destructiva
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Cierre con Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleConfirm = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (err) {
      const message = err instanceof Error && err.message
        ? err.message
        : 'No pudimos eliminar la actividad. ¿Querés reintentar?';
      setError(message);
      setIsDeleting(false);
      return;
    }
    setIsDeleting(false);
  };

  const tituloVisible = actividad.titulo?.trim() ? `"${actividad.titulo.trim()}"` : 'sin título';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="eliminar-actividad-titulo"
        aria-describedby="eliminar-actividad-descripcion"
        className="w-full max-w-md bg-white rounded-xl shadow-lg border border-border-light p-5"
      >
        <h2
          id="eliminar-actividad-titulo"
          className="text-base font-bold font-quicksand text-text-dark mb-2"
        >
          Eliminar actividad
        </h2>
        <p
          id="eliminar-actividad-descripcion"
          className="text-sm font-quicksand text-text-muted mb-4"
        >
          ¿Querés eliminar la actividad {tituloVisible}? Esta acción no se puede deshacer.
        </p>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-xs font-quicksand text-red-600"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 min-h-[56px] rounded-full bg-red-600 px-6 py-3 font-quicksand text-sm font-semibold text-white hover:brightness-95 active:scale-95 transition-all disabled:opacity-60"
          >
            {isDeleting ? 'Eliminando...' : error ? 'Reintentar' : 'Eliminar'}
          </button>
          <button
            type="button"
            ref={cancelRef}
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 min-h-[56px] rounded-full border-2 border-green-primary/40 px-6 py-3 font-quicksand text-sm font-medium text-green-primary hover:bg-green-primary/5 active:scale-95 transition-all disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
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
  /** Abre la confirmación de borrado para esa actividad (solo en modo edición). */
  onSolicitarEliminar?: (actividad: Actividad) => void;
}

function DayCard({
  dia,
  etiqueta,
  color,
  actividades,
  planificacionId,
  onUpdateField,
  onSolicitarEliminar,
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
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
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
                </div>
                {onSolicitarEliminar && (
                  <button
                    type="button"
                    onClick={() => onSolicitarEliminar(actividad)}
                    aria-label={etiquetaEliminar(actividad.titulo)}
                    aria-haspopup="dialog"
                    title="Eliminar actividad"
                    className="shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-red-600 hover:bg-red-50 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
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
