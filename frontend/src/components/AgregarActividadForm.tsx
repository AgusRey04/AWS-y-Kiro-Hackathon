import { useEffect, useRef, useState } from 'react';
import type { Actividad } from '../types';
import type { NuevaActividadInput } from '../contexts/PlanContext';

export type { NuevaActividadInput };

export const DIAS_DISPONIBLES: { value: Actividad['dia']; label: string }[] = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
];

export const TITULO_MAX_LENGTH = 500;
export const DESCRIPCION_MAX_LENGTH = 2000;
export const SEMANA_MIN = 1;

interface AgregarActividadFormProps {
  /** Se ejecuta al confirmar. Si rechaza, el formulario permanece abierto y muestra el error. */
  onSubmit: (input: NuevaActividadInput) => Promise<unknown>;
  onCancel: () => void;
  /** Día preseleccionado (opcional). */
  diaInicial?: Actividad['dia'] | '';
  /** Semana preseleccionada: por defecto, la última semana existente de la planificación. */
  semanaInicial?: number;
}

const ERROR_DIA = 'Elegí un día para la actividad.';
const ERROR_SEMANA = 'La semana debe ser un número entero mayor o igual a 1.';
const ERROR_TITULO = 'El título es obligatorio.';
const ERROR_DESCRIPCION = 'La descripción es obligatoria.';

interface Errores {
  dia?: string;
  semana?: string;
  titulo?: string;
  descripcion?: string;
}

export default function AgregarActividadForm({
  onSubmit,
  onCancel,
  diaInicial = '',
  semanaInicial = SEMANA_MIN,
}: AgregarActividadFormProps) {
  const [dia, setDia] = useState<Actividad['dia'] | ''>(diaInicial);
  const [semana, setSemana] = useState<string>(
    String(Number.isFinite(semanaInicial) && semanaInicial >= SEMANA_MIN
      ? Math.trunc(semanaInicial)
      : SEMANA_MIN)
  );
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const diaRef = useRef<HTMLSelectElement>(null);

  // Foco inicial en el primer campo del formulario
  useEffect(() => {
    diaRef.current?.focus();
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

  const semanaNumero = Number(semana);
  const semanaEsValida =
    semana.trim().length > 0 && Number.isInteger(semanaNumero) && semanaNumero >= SEMANA_MIN;

  const validar = () => {
    const nuevos: Errores = {};
    if (!dia) nuevos.dia = ERROR_DIA;
    if (!semanaEsValida) nuevos.semana = ERROR_SEMANA;
    if (titulo.trim().length === 0) nuevos.titulo = ERROR_TITULO;
    if (descripcion.trim().length === 0) nuevos.descripcion = ERROR_DESCRIPCION;
    return nuevos;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const nuevosErrores = validar();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        dia: dia as Actividad['dia'],
        semana: semanaNumero,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
      });
    } catch (err) {
      const message = err instanceof Error && err.message
        ? err.message
        : 'No pudimos agregar la actividad. ¿Querés reintentar?';
      setSubmitError(message);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  const tituloRestantes = TITULO_MAX_LENGTH - titulo.length;
  const descripcionRestantes = DESCRIPCION_MAX_LENGTH - descripcion.length;

  const inputBase =
    'w-full min-h-[56px] rounded-xl border px-4 py-3 font-quicksand text-sm text-text-dark bg-white focus:outline-none focus:ring-2 focus:ring-green-primary/30';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agregar-actividad-titulo"
        className="w-full max-w-md bg-white rounded-xl shadow-lg border border-border-light p-5 max-h-[90vh] overflow-y-auto"
      >
        <h2
          id="agregar-actividad-titulo"
          className="text-base font-bold font-quicksand text-text-dark mb-4"
        >
          Agregar actividad
        </h2>

        <form onSubmit={handleSubmit} noValidate aria-label="Formulario para agregar actividad">
          {/* Día */}
          <div className="mb-4">
            <label
              htmlFor="nueva-actividad-dia"
              className="block text-sm font-medium font-quicksand text-text-dark mb-1"
            >
              Día
            </label>
            <select
              id="nueva-actividad-dia"
              ref={diaRef}
              value={dia}
              onChange={(e) => {
                setDia(e.target.value as Actividad['dia'] | '');
                setErrores((prev) => ({ ...prev, dia: undefined }));
              }}
              aria-invalid={errores.dia ? true : undefined}
              aria-describedby={errores.dia ? 'error-dia' : undefined}
              className={`${inputBase} ${errores.dia ? 'border-red-500' : 'border-border-light'}`}
            >
              <option value="">Elegí un día</option>
              {DIAS_DISPONIBLES.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
            {errores.dia && (
              <p id="error-dia" className="mt-1 text-xs font-quicksand text-red-500">
                {errores.dia}
              </p>
            )}
          </div>

          {/* Semana */}
          <div className="mb-4">
            <label
              htmlFor="nueva-actividad-semana"
              className="block text-sm font-medium font-quicksand text-text-dark mb-1"
            >
              Semana
            </label>
            <input
              id="nueva-actividad-semana"
              type="number"
              inputMode="numeric"
              min={SEMANA_MIN}
              step={1}
              value={semana}
              onChange={(e) => {
                setSemana(e.target.value);
                setErrores((prev) => ({ ...prev, semana: undefined }));
              }}
              aria-invalid={errores.semana ? true : undefined}
              aria-describedby={errores.semana ? 'error-semana' : 'ayuda-semana'}
              className={`${inputBase} ${errores.semana ? 'border-red-500' : 'border-border-light'}`}
            />
            {errores.semana ? (
              <p id="error-semana" className="mt-1 text-xs font-quicksand text-red-500">
                {errores.semana}
              </p>
            ) : (
              <p id="ayuda-semana" className="mt-1 text-xs font-quicksand text-text-muted">
                Semana de la planificación (1, 2, 3...).
              </p>
            )}
          </div>

          {/* Título */}
          <div className="mb-4">
            <label
              htmlFor="nueva-actividad-titulo"
              className="block text-sm font-medium font-quicksand text-text-dark mb-1"
            >
              Título
            </label>
            <input
              id="nueva-actividad-titulo"
              type="text"
              value={titulo}
              maxLength={TITULO_MAX_LENGTH}
              onChange={(e) => {
                setTitulo(e.target.value.slice(0, TITULO_MAX_LENGTH));
                setErrores((prev) => ({ ...prev, titulo: undefined }));
              }}
              aria-invalid={errores.titulo ? true : undefined}
              aria-describedby={errores.titulo ? 'error-titulo' : 'contador-titulo'}
              className={`${inputBase} ${errores.titulo ? 'border-red-500' : 'border-border-light'}`}
            />
            <div className="flex justify-between items-start gap-2 mt-1">
              {errores.titulo ? (
                <p id="error-titulo" className="text-xs font-quicksand text-red-500">
                  {errores.titulo}
                </p>
              ) : (
                <span />
              )}
              <span
                id="contador-titulo"
                className={`text-xs font-quicksand whitespace-nowrap ${
                  tituloRestantes <= 20 ? 'text-red-500' : 'text-text-muted'
                }`}
                aria-live="polite"
              >
                {tituloRestantes} caracteres restantes
              </span>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-4">
            <label
              htmlFor="nueva-actividad-descripcion"
              className="block text-sm font-medium font-quicksand text-text-dark mb-1"
            >
              Descripción
            </label>
            <textarea
              id="nueva-actividad-descripcion"
              rows={5}
              value={descripcion}
              maxLength={DESCRIPCION_MAX_LENGTH}
              onChange={(e) => {
                setDescripcion(e.target.value.slice(0, DESCRIPCION_MAX_LENGTH));
                setErrores((prev) => ({ ...prev, descripcion: undefined }));
              }}
              aria-invalid={errores.descripcion ? true : undefined}
              aria-describedby={errores.descripcion ? 'error-descripcion' : 'contador-descripcion'}
              className={`${inputBase} resize-none ${
                errores.descripcion ? 'border-red-500' : 'border-border-light'
              }`}
            />
            <div className="flex justify-between items-start gap-2 mt-1">
              {errores.descripcion ? (
                <p id="error-descripcion" className="text-xs font-quicksand text-red-500">
                  {errores.descripcion}
                </p>
              ) : (
                <span />
              )}
              <span
                id="contador-descripcion"
                className={`text-xs font-quicksand whitespace-nowrap ${
                  descripcionRestantes <= 20 ? 'text-red-500' : 'text-text-muted'
                }`}
                aria-live="polite"
              >
                {descripcionRestantes} caracteres restantes
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
              disabled={isSubmitting}
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
