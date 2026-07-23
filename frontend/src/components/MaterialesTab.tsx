import type { Material } from '../types';

interface MaterialesTabProps {
  materiales: Material[];
}

export default function MaterialesTab({ materiales }: MaterialesTabProps) {
  if (materiales.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-muted font-quicksand text-center text-sm">
          No hay materiales disponibles para esta planificación.
        </p>
      </div>
    );
  }

  const sorted = [...materiales].sort((a, b) => a.orden - b.orden);

  return (
    <ul className="space-y-3" aria-label="Lista de materiales">
      {sorted.map((material) => (
        <li
          key={material.id}
          className="bg-white rounded-xl shadow-sm border border-border-light p-4 flex items-center gap-3"
        >
          <span className="text-2xl flex-shrink-0" aria-hidden="true">
            {material.icono}
          </span>
          <span className="text-sm font-medium font-quicksand text-text-dark">
            {material.nombre}
          </span>
        </li>
      ))}
    </ul>
  );
}
