import { useEffect, useRef, useState } from 'react';
import type { NuevoMaterialInput } from '../contexts/PlanContext';

export type { NuevoMaterialInput };

/**
 * Set de íconos representativos de materiales típicos de nivel inicial,
 * cubriendo categorías como arte, naturaleza, clima/estaciones, cocina,
 * juego y textiles. No pretende ser exhaustivo: cualquier ícono no listado
 * puede seguir escribiéndose a mano en el nombre del material.
 */
export const ICONOS_DISPONIBLES: { emoji: string; label: string }[] = [
  { emoji: '🔦', label: 'Linterna' },
  { emoji: '🧦', label: 'Lana' },
  { emoji: '🥕', label: 'Verdura' },
  { emoji: '🧊', label: 'Hielo' },
  { emoji: '🎨', label: 'Pintura' },
  { emoji: '✂️', label: 'Tijera' },
  { emoji: '📄', label: 'Papel' },
  { emoji: '🧵', label: 'Hilo' },
  { emoji: '🪣', label: 'Balde' },
  { emoji: '🧸', label: 'Peluche' },
  { emoji: '🎵', label: 'Música' },
  { emoji: '🌂', label: 'Paraguas' },
  { emoji: '❄️', label: 'Invierno' },
  { emoji: '🍲', label: 'Cocina' },
  { emoji: '🧶', label: 'Ovillo' },
  { emoji: '🪁', label: 'Juego' },
  { emoji: '📚', label: 'Libro' },
  { emoji: '🖍️', label: 'Crayón' },
  { emoji: '🧩', label: 'Rompecabezas' },
  { emoji: '🎈', label: 'Globo' },
  { emoji: '🌱', label: 'Planta' },
  { emoji: '🪴', label: 'Maceta' },
  { emoji: '📦', label: 'Caja' },
  { emoji: '🥁', label: 'Tambor' },
];

export const ICONO_POR_DEFECTO = ICONOS_DISPONIBLES[0].emoji;

export const NOMBRE_MAX_LENGTH = 500;

interface AgregarMaterialFormProps {
  /** Se ejecuta al confirmar. Si rechaza, el formulario permanece abierto y muestra el error. */
  onSubmit: (input: NuevoMaterialInput) => Promise<unknown>;
  onCancel: () => void;
  /** Ícono preseleccionado al abrir el formulario. */
  iconoInicial?: string;
}

const ERROR_NOMBRE = 'El nombre es obligatorio.';

export default function AgregarMaterialForm({
  onSubmit,
  onCancel,
  iconoInicial = ICONO_POR_DEFECTO,
}: AgregarMaterialFormProps) {
  const [icono, setIcono] = useState(iconoInicial);
  const [nombre, setNombre] = useState('');
  const [errorNombre, setErrorNombre] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const primerIconoRef = useRef<HTMLButtonElement>(null);

  // Foco inicial en el ícono seleccionado (o el primero de la grilla)
  useEffect(() => {
    primerIconoRef.current?.focus();
  }, []);

  // Cierre con Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const nombreValido = nombre.trim().length > 0;
    if (!nombreValido) {
      setErrorNombre(ERROR_NOMBRE);
      return;
    }
    setErrorNombre(undefined);

    setIsSubmitting(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        icono,
      });
    } catch (err) {
      const message = err instanceof Error && err.message
        ? err.message
        : 'No pudimos agregar el material. ¿Querés reintentar?';
      setSubmitError(message);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  const nombreRestantes = NOMBRE_MAX_LENGTH - nombre.length;
  const puedeEnviar = icono.length > 0 && nombre.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agregar-material-titulo"
        className="w-full max-w-md bg-white rounded-xl shadow-lg border border-border-light p-5 max-h-[90vh] overflow-y-auto"
      >
        <h2
          id="agregar-material-titulo"
          className="text-base font-bold font-quicksand text-text-dark mb-4"
        >
          Agregar material
        </h2>

        <form onSubmit={handleSubmit} noValidate aria-label="Formulario para agregar material">
          {/* Selector de ícono */}
          <div className="mb-4">
            <span
              id="material-icono-label"
              className="block text-sm font-medium font-quicksand text-text-dark mb-2"
            >
              Ícono
            </span>
            <div
              role="radiogroup"
              aria-labelledby="material-icono-label"
              className="grid grid-cols-6 gap-2"
            >
              {ICONOS_DISPONIBLES.map((opcion, index) => {
                const seleccionado = opcion.emoji === icono;
                return (
                  <button
                    key={opcion.emoji}
                    type="button"
                    role="radio"
                    aria-checked={seleccionado}
                    aria-label={opcion.label}
                    ref={index === 0 ? primerIconoRef : undefined}
                    onClick={() => setIcono(opcion.emoji)}
                    className={`flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-xl border-2 transition-all active:scale-95 ${
                      seleccionado
                        ? 'border-green-primary bg-green-primary/10'
                        : 'border-border-light bg-white hover:bg-green-primary/5'
                    }`}
                  >
                    <span aria-hidden="true">{opcion.emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nombre */}
          <div className="mb-4">
            <label
              htmlFor="nuevo-material-nombre"
              className="block text-sm font-medium font-quicksand text-text-dark mb-1"
            >
              Nombre
            </label>
            <input
              id="nuevo-material-nombre"
              type="text"
              value={nombre}
              maxLength={NOMBRE_MAX_LENGTH}
              onChange={(e) => {
                setNombre(e.target.value.slice(0, NOMBRE_MAX_LENGTH));
                setErrorNombre(undefined);
              }}
              aria-invalid={errorNombre ? true : undefined}
              aria-describedby={errorNombre ? 'error-nombre' : 'contador-nombre'}
              className={`w-full min-h-[56px] rounded-xl border px-4 py-3 font-quicksand text-sm text-text-dark bg-white focus:outline-none focus:ring-2 focus:ring-green-primary/30 ${
                errorNombre ? 'border-red-500' : 'border-border-light'
              }`}
            />
            <div className="flex justify-between items-start gap-2 mt-1">
              {errorNombre ? (
                <p id="error-nombre" className="text-xs font-quicksand text-red-500">
                  {errorNombre}
                </p>
              ) : (
                <span />
              )}
              <span
                id="contador-nombre"
                className={`text-xs font-quicksand whitespace-nowrap ${
                  nombreRestantes <= 20 ? 'text-red-500' : 'text-text-muted'
                }`}
                aria-live="polite"
              >
                {nombreRestantes} caracteres restantes
              </span>
            </div>
          </div>

          {/* Error del servidor */}
          {submitError && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-xs font-quicksand text-red-600"
            >
              {submitError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !puedeEnviar}
              className="flex-1 min-h-[56px] rounded-full bg-mostaza px-6 py-3 font-quicksand text-sm font-semibold text-text-dark hover:brightness-95 active:scale-95 transition-all disabled:opacity-60"
            >
              {isSubmitting ? 'Guardando...' : 'Agregar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 min-h-[56px] rounded-full border-2 border-green-primary/40 px-6 py-3 font-quicksand text-sm font-medium text-green-primary hover:bg-green-primary/5 active:scale-95 transition-all disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
