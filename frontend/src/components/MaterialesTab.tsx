import type { Material } from '../types';
import { usePlan } from '../contexts/PlanContext';
import EditableBlock from './EditableBlock';

interface MaterialesTabProps {
  materiales: Material[];
  planificacionId?: string;
}

export default function MaterialesTab({ materiales, planificacionId }: MaterialesTabProps) {
  const { updateField, addMaterial } = usePlan();

  if (materiales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted font-quicksand text-center text-sm">
          No hay materiales disponibles para esta planificación.
        </p>
        {planificacionId && (
          <button
            onClick={() => addMaterial()}
            className="mt-4 border-2 border-dashed border-green-primary/40 text-green-primary rounded-full px-6 py-3 min-h-[56px] font-quicksand text-sm font-medium hover:bg-green-primary/5 active:scale-95 transition-all"
            aria-label="Agregar item personalizado"
          >
            + Agregar item personalizado
          </button>
        )}
      </div>
    );
  }

  const sorted = [...materiales].sort((a, b) => a.orden - b.orden);

  return (
    <div>
      <ul className="space-y-3" aria-label="Lista de materiales">
        {sorted.map((material) => (
          <li
            key={material.id}
            className="bg-white rounded-xl shadow-sm border border-border-light p-4 flex items-center gap-3"
          >
            <span className="text-2xl flex-shrink-0" aria-hidden="true">
              {material.icono}
            </span>
            {planificacionId ? (
              <EditableBlock
                content={material.nombre}
                maxLength={500}
                onSave={(newValue) => updateField(`materiales.${material.id}.nombre`, newValue)}
                type="title"
                fieldPath={`materiales.${material.id}.nombre`}
                planificacionId={planificacionId}
                className="text-sm font-medium font-quicksand text-text-dark flex-1"
                as="span"
              />
            ) : (
              <span className="text-sm font-medium font-quicksand text-text-dark">
                {material.nombre}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Agregar item personalizado button */}
      {planificacionId && (
        <button
          onClick={() => addMaterial()}
          className="mt-4 w-full border-2 border-dashed border-green-primary/40 text-green-primary rounded-full px-6 py-3 min-h-[56px] font-quicksand text-sm font-medium hover:bg-green-primary/5 active:scale-95 transition-all"
          aria-label="Agregar item personalizado"
        >
          + Agregar item personalizado
        </button>
      )}
    </div>
  );
}
