import type { Adaptacion } from '../types';
import { usePlan } from '../contexts/PlanContext';
import EditableBlock from './EditableBlock';

interface AdaptacionesTabProps {
  adaptaciones: Adaptacion[];
  planificacionId?: string;
}

function PeopleIcon({ className }: { className?: string }) {
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
      <circle cx="9" cy="9" r="3" />
      <circle cx="17" cy="10" r="2.2" />
      <path d="M3.5 19c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5" />
      <path d="M16 14.8c2.4.2 4.5 1.6 4.5 4.2" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
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
      <path d="M12 4l1.6 4.3L18 10l-4.4 1.7L12 16l-1.6-4.3L6 10l4.4-1.7z" />
      <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </svg>
  );
}

export default function AdaptacionesTab({ adaptaciones, planificacionId }: AdaptacionesTabProps) {
  const { updateField } = usePlan();

  if (adaptaciones.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-muted font-quicksand text-center text-sm">
          No hay adaptaciones disponibles para esta planificación.
        </p>
      </div>
    );
  }

  const sorted = [...adaptaciones].sort((a, b) => a.orden - b.orden);

  return (
    <div className="rounded-2xl bg-lavanda/20 p-4 sm:p-5">
      {/* Encabezado de la sección */}
      <div className="flex items-start gap-3.5 mb-6">
        <span className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-lavanda text-white">
          <PeopleIcon className="w-[22px] h-[22px]" />
        </span>
        <div>
          <h3 className="text-xl font-semibold font-quicksand text-lavanda">
            Estrategias de Inclusión
          </h3>
          <p className="text-[15px] font-quicksand text-text-muted mt-0.5">
            Sugerencias para asegurar la participación de todo el alumnado.
          </p>
        </div>
      </div>

      <div className="space-y-3" role="list" aria-label="Estrategias de inclusión">
        {sorted.map((adaptacion) => (
          <article
            key={adaptacion.id}
            className="rounded-xl p-5 bg-[#9B89B3]/15"
            role="listitem"
            aria-label={adaptacion.titulo}
          >
            <span className="flex items-center gap-2 text-[12px] font-bold font-quicksand text-lavanda uppercase tracking-[0.14em] mb-2">
              <SparkIcon className="w-3.5 h-3.5" />
              {adaptacion.categoria}
            </span>
            {planificacionId ? (
              <>
                <EditableBlock
                  content={adaptacion.titulo}
                  maxLength={500}
                  onSave={(newValue) => updateField(`adaptaciones.${adaptacion.id}.titulo`, newValue)}
                  type="title"
                  fieldPath={`adaptaciones.${adaptacion.id}.titulo`}
                  planificacionId={planificacionId}
                  className="text-[15px] font-semibold font-quicksand text-text-dark"
                  as="h3"
                />
                <EditableBlock
                  content={adaptacion.descripcion}
                  maxLength={2000}
                  onSave={(newValue) => updateField(`adaptaciones.${adaptacion.id}.descripcion`, newValue)}
                  type="description"
                  fieldPath={`adaptaciones.${adaptacion.id}.descripcion`}
                  planificacionId={planificacionId}
                  className="text-[15px] font-quicksand text-text-muted mt-1.5 leading-relaxed"
                  as="p"
                />
              </>
            ) : (
              <>
                <h3 className="text-[15px] font-bold font-quicksand text-text-dark">
                  {adaptacion.titulo}
                </h3>
                <p className="text-[15px] font-quicksand text-text-muted mt-1.5 leading-relaxed">
                  {adaptacion.descripcion}
                </p>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
