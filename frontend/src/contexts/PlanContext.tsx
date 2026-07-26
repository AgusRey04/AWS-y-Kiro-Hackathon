import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { Planificacion, Actividad, Material, Adaptacion, ApiErrorResponse } from '../types';

// --- Tipos ---

export interface NuevaActividadInput {
  dia: Actividad['dia'];
  /** Semana de la planificación (entero >= 1). */
  semana: number;
  titulo: string;
  descripcion: string;
}

// --- Context Value ---

interface PlanContextValue {
  planificacion: Planificacion | null;
  isLoading: boolean;
  error: string | null;
  crear: (consigna: string) => Promise<void>;
  loadById: (id: string) => Promise<void>;
  updateField: (path: string, value: string) => Promise<void>;
  addActividad: (input: NuevaActividadInput) => Promise<Actividad>;
  addMaterial: () => void;
  addAdaptacion: () => void;
}

// --- Context ---

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

// --- Provider ---

export function PlanProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [planificacion, setPlanificacion] = useState<Planificacion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = useCallback(async (consigna: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const fetchPromise = fetch('/api/planificaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ consigna }),
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 65000);
      });

      const res = await Promise.race([fetchPromise, timeoutPromise]);

      if (!res.ok) {
        const errorJson: ApiErrorResponse = await res.json();
        throw new Error(errorJson.message || 'No pudimos generar tu planificación.');
      }

      const json = await res.json();
      const planData = json.data.planificacion || json.data;
      setPlanificacion(planData);
      setIsLoading(false);
      navigate(`/preview/${planData.id}`);
    } catch (err) {
      setIsLoading(false);
      if (err instanceof Error && err.message === 'TIMEOUT') {
        setError('No pudimos generar tu planificación. El servidor tardó demasiado. ¿Querés reintentar?');
      } else {
        const message = err instanceof Error
          ? err.message
          : 'Hubo un problema generando tu planificación. ¿Querés reintentar?';
        setError(message);
      }
    }
  }, [navigate]);

  const loadById = useCallback(async (id: string) => {
    // Si ya tenemos esa planificación en memoria, no recargar
    if (planificacion?.id === id) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const res = await fetch(`/api/planificaciones/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errorJson: ApiErrorResponse = await res.json();
        throw new Error(errorJson.message || 'No pudimos cargar la planificación.');
      }

      const json = await res.json();
      setPlanificacion(json.data);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Error al cargar la planificación.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [planificacion?.id]);

  const updateField = useCallback(async (path: string, value: string) => {
    if (!planificacion) return;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    const res = await fetch(`/api/planificaciones/${planificacion.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ path, value }),
    });

    if (!res.ok) {
      const errorJson = await res.json();
      throw new Error(errorJson.message || 'Error al guardar el cambio.');
    }

    // Update local state optimistically
    const segments = path.split('.');
    setPlanificacion((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };

      if (segments.length === 1) {
        // Direct field: "fundamentacion", "titulo"
        (updated as Record<string, unknown>)[segments[0]] = value;
      } else if (segments.length === 3) {
        const [table, itemId, field] = segments;
        if (table === 'actividades') {
          updated.actividades = updated.actividades.map((a) =>
            a.id === itemId ? { ...a, [field]: value } : a
          );
        } else if (table === 'materiales') {
          updated.materiales = updated.materiales.map((m) =>
            m.id === itemId ? { ...m, [field]: value } : m
          );
        } else if (table === 'adaptaciones') {
          updated.adaptaciones = updated.adaptaciones.map((a) =>
            a.id === itemId ? { ...a, [field]: value } : a
          );
        }
      }

      return updated;
    });
  }, [planificacion]);

  /**
   * Crea una actividad en el backend y, con la respuesta, la agrega al estado local
   * usando el id real de la base de datos (así las ediciones inline con PATCH funcionan).
   * Lanza un Error si la llamada falla, para que el formulario pueda mostrarlo y reintentar.
   */
  const addActividad = useCallback(async (input: NuevaActividadInput): Promise<Actividad> => {
    if (!planificacion) {
      throw new Error('No hay una planificación activa.');
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    let res: Response;
    try {
      res = await fetch(`/api/planificaciones/${planificacion.id}/actividades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          dia: input.dia,
          semana: input.semana,
          titulo: input.titulo,
          descripcion: input.descripcion,
        }),
      });
    } catch {
      throw new Error('No pudimos agregar la actividad. Revisá tu conexión y reintentá.');
    }

    if (!res.ok) {
      let message = 'No pudimos agregar la actividad. ¿Querés reintentar?';
      try {
        const errorJson: ApiErrorResponse = await res.json();
        if (errorJson?.message) message = errorJson.message;
      } catch {
        // Respuesta sin JSON: se usa el mensaje por defecto
      }
      throw new Error(message);
    }

    const json = await res.json();
    const devuelta = (json.data?.actividad ?? json.data) as Actividad;
    // Si el backend no devolviera la semana, se usa la elegida en el formulario
    const creada: Actividad = {
      ...devuelta,
      semana: Number.isFinite(Number(devuelta?.semana)) ? Number(devuelta.semana) : input.semana,
    };

    setPlanificacion((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        actividades: [...prev.actividades, creada],
      };
    });

    return creada;
  }, [planificacion]);

  const addMaterial = useCallback(() => {
    setPlanificacion((prev) => {
      if (!prev) return prev;
      const newMaterial: Material = {
        id: crypto.randomUUID(),
        nombre: '',
        icono: '📦',
        orden: prev.materiales.length + 1,
      };
      return {
        ...prev,
        materiales: [...prev.materiales, newMaterial],
      };
    });
  }, []);

  const addAdaptacion = useCallback(() => {
    setPlanificacion((prev) => {
      if (!prev) return prev;
      const newAdaptacion: Adaptacion = {
        id: crypto.randomUUID(),
        categoria: 'General',
        titulo: '',
        descripcion: '',
        orden: prev.adaptaciones.length + 1,
      };
      return {
        ...prev,
        adaptaciones: [...prev.adaptaciones, newAdaptacion],
      };
    });
  }, []);

  return (
    <PlanContext.Provider
      value={{
        planificacion,
        isLoading,
        error,
        crear,
        loadById,
        updateField,
        addActividad,
        addMaterial,
        addAdaptacion,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

// --- Hook ---

export function usePlan(): PlanContextValue {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
