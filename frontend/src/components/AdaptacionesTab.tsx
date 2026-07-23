import type { Adaptacion } from '../types';

interface AdaptacionesTabProps {
  adaptaciones: Adaptacion[];
}

export default function AdaptacionesTab({ adaptaciones }: AdaptacionesTabProps) {
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
    <div className="space-y-4" role="list" aria-label="Estrategias de inclusión">
      {sorted.map((adaptacion) => (
        <article
          key={adaptacion.id}
          className="rounded-xl p-4 bg-[#9B89B3]/15"
          role="listitem"
          aria-label={adaptacion.titulo}
        >
          <span className="inline-block text-xs font-semibold font-quicksand text-lavanda uppercase tracking-wide mb-1">
            {adaptacion.categoria}
          </span>
          <h3 className="text-sm font-bold font-quicksand text-text-dark">
            {adaptacion.titulo}
          </h3>
          <p className="text-sm font-quicksand text-text-muted mt-1">
            {adaptacion.descripcion}
          </p>
        </article>
      ))}
    </div>
  );
}
