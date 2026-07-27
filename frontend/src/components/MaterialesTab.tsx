import { useEffect, useRef, useState } from 'react';
import type { Material } from '../types';
import { usePlan } from '../contexts/PlanContext';
import EditableBlock from './EditableBlock';
import AgregarMaterialForm, { type NuevoMaterialInput } from './AgregarMaterialForm';

interface MaterialesTabProps {
  materiales: Material[];
  planificacionId?: string;
}

/**
 * Etiqueta accesible del botón de eliminar. Incluye el nombre del material
 * para distinguir un botón de otro cuando hay varios en la lista.
 */
export function etiquetaEliminarMaterial(nombre: string | undefined): string {
  const limpio = (nombre ?? '').trim();
  return limpio ? `Eliminar material: ${limpio}` : 'Eliminar material sin nombre';
}

/** Ícono de "+" en círculo para el bloque de agregar material. */
function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

/** Ícono de carrito para el encabezado de la lista de recursos. */
function CartIcon({ className }: { className?: string }) {
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
      <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.78L19.5 8H6" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="16.5" cy="19" r="1.4" />
    </svg>
  );
}

/** Ícono de tacho de basura (SVG inline, mismo estilo que el de ActividadesTab). */
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

export default function MaterialesTab({ materiales, planificacionId }: MaterialesTabProps) {
  const { updateField, addMaterial, deleteMaterial } = usePlan();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [aEliminar, setAEliminar] = useState<Material | null>(null);

  const handleSubmit = async (input: NuevoMaterialInput) => {
    await addMaterial(input);
    setIsFormOpen(false);
  };

  const confirmarBorrado = aEliminar ? (
    <ConfirmarBorradoMaterial
      material={aEliminar}
      onConfirm={async () => {
        await deleteMaterial(aEliminar.id);
        setAEliminar(null);
      }}
      onCancel={() => setAEliminar(null)}
    />
  ) : null;

  const agregarButton = planificacionId ? (
    <button
      onClick={() => setIsFormOpen(true)}
      className="mt-6 w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border-light rounded-2xl px-6 py-7 text-text-muted font-quicksand text-sm font-medium hover:border-green-primary/40 hover:text-green-primary hover:bg-green-primary/5 active:scale-[0.99] transition-all"
      aria-label="Agregar item personalizado"
      aria-haspopup="dialog"
      aria-expanded={isFormOpen}
    >
      <PlusCircleIcon className="w-7 h-7" />
      <span>+ Agregar item personalizado</span>
    </button>
  ) : null;

  const formulario = isFormOpen ? (
    <AgregarMaterialForm onSubmit={handleSubmit} onCancel={() => setIsFormOpen(false)} />
  ) : null;

  if (materiales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted font-quicksand text-center text-sm">
          No hay materiales disponibles para esta planificación.
        </p>
        {agregarButton}
        {formulario}
        {confirmarBorrado}
      </div>
    );
  }

  const sorted = [...materiales].sort((a, b) => a.orden - b.orden);

  return (
    <div>
      {/* Encabezado de la sección */}
      <div className="flex items-start gap-3.5 mb-6">
        <span className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-mostaza/70 text-white">
          <CartIcon className="w-[22px] h-[22px]" />
        </span>
        <div>
          <h3 className="text-xl font-semibold font-quicksand text-text-dark">
            Lista de Recursos
          </h3>
          <p className="text-[15px] font-quicksand text-text-muted mt-0.5">
            Prepará con antelación para asegurar el fluir de la semana.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Lista de materiales">
        {sorted.map((material) => (
          <li
            key={material.id}
            className="bg-[#F7F6F2] rounded-xl border border-border-light/60 px-5 py-4 flex items-center gap-3"
          >
            <span className="text-2xl flex-shrink-0" aria-hidden="true">
              {material.icono}
            </span>
            {planificacionId ? (
              <>
                <EditableBlock
                  content={material.nombre}
                  maxLength={500}
                  onSave={(newValue) => updateField(`materiales.${material.id}.nombre`, newValue)}
                  type="title"
                  fieldPath={`materiales.${material.id}.nombre`}
                  planificacionId={planificacionId}
                  className="text-[15px] font-medium font-quicksand text-text-dark flex-1"
                  as="span"
                />
                <button
                  type="button"
                  onClick={() => setAEliminar(material)}
                  aria-label={etiquetaEliminarMaterial(material.nombre)}
                  aria-haspopup="dialog"
                  title="Eliminar material"
                  className="shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-red-600 hover:bg-red-50 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </>
            ) : (
              <span className="text-[15px] font-medium font-quicksand text-text-dark">
                {material.nombre}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Agregar item personalizado button */}
      {agregarButton}
      {formulario}
      {confirmarBorrado}
    </div>
  );
}

interface ConfirmarBorradoMaterialProps {
  material: Material;
  /** Si rechaza, el diálogo permanece abierto mostrando el error para reintentar. */
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Diálogo de confirmación de borrado. Sigue el mismo patrón que
 * ConfirmarBorradoActividad: overlay fijo, role="dialog" + aria-modal, foco
 * inicial en "Cancelar" y cierre con Escape. No se usa window.confirm.
 */
function ConfirmarBorradoMaterial({
  material,
  onConfirm,
  onCancel,
}: ConfirmarBorradoMaterialProps) {
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
        : 'No pudimos eliminar el material. ¿Querés reintentar?';
      setError(message);
      setIsDeleting(false);
      return;
    }
    setIsDeleting(false);
  };

  const nombreVisible = material.nombre?.trim() ? `"${material.nombre.trim()}"` : 'sin nombre';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="eliminar-material-titulo"
        aria-describedby="eliminar-material-descripcion"
        className="w-full max-w-md bg-white rounded-xl shadow-lg border border-border-light p-5"
      >
        <h2
          id="eliminar-material-titulo"
          className="text-base font-bold font-quicksand text-text-dark mb-2"
        >
          Eliminar material
        </h2>
        <p
          id="eliminar-material-descripcion"
          className="text-sm font-quicksand text-text-muted mb-4"
        >
          ¿Querés eliminar el material {nombreVisible}? Esta acción no se puede deshacer.
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
