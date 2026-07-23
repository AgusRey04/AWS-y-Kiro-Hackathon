import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { Planificacion, ApiErrorResponse, ApiSuccessResponse } from '../types';

// --- Context Value ---

interface PlanContextValue {
  planificacion: Planificacion | null;
  isLoading: boolean;
  error: string | null;
  crear: (consigna: string) => Promise<void>;
  updateField: (path: string, value: string) => Promise<void>;
  addActividad: (dia: string) => void;
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
        setTimeout(() => reject(new Error('TIMEOUT')), 30000);
      });

      const res = await Promise.race([fetchPromise, timeoutPromise]);

      if (!res.ok) {
        const errorJson: ApiErrorResponse = await res.json();
        throw new Error(errorJson.message || 'No pudimos generar tu planificación.');
      }

      const json: ApiSuccessResponse<{ planificacion: Planificacion }> = await res.json();
      setPlanificacion(json.data.planificacion);
      setIsLoading(false);
      navigate(`/preview/${json.data.planificacion.id}`);
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

  const updateField = useCallback(async (_path: string, _value: string) => {
    // Will be implemented in a future task
  }, []);

  const addActividad = useCallback((_dia: string) => {
    // Will be implemented in a future task
  }, []);

  const addMaterial = useCallback(() => {
    // Will be implemented in a future task
  }, []);

  const addAdaptacion = useCallback(() => {
    // Will be implemented in a future task
  }, []);

  return (
    <PlanContext.Provider
      value={{
        planificacion,
        isLoading,
        error,
        crear,
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
