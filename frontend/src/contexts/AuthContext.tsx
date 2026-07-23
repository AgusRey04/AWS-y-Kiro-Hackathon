import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, AuthState, ApiErrorResponse, ApiSuccessResponse } from '../../../shared/types';

// --- Actions ---

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; mantenerSesion: boolean } }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface AuthContextState extends AuthState {
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue {
  state: AuthContextState;
  login: (email: string, password: string, mantenerSesion: boolean) => Promise<void>;
  register: (nombre: string, escuela: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// --- Initial State ---

const initialState: AuthContextState = {
  user: null,
  token: null,
  isAuthenticated: false,
  mantenerSesion: false,
  isLoading: true,
  error: null,
};

// --- Reducer ---

function authReducer(state: AuthContextState, action: AuthAction): AuthContextState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        mantenerSesion: action.payload.mantenerSesion,
        isLoading: false,
        error: null,
      };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        mantenerSesion: true,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}

// --- Context ---

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// --- Provider ---

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount, check for persisted token and validate via /api/auth/me
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json: ApiSuccessResponse<{ user: User }> = await res.json();
          const mantenerSesion = localStorage.getItem('token') !== null;
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: json.data.user, token, mantenerSesion },
          });
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    validateSession();
  }, []);

  const login = useCallback(async (email: string, password: string, mantenerSesion: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorJson: ApiErrorResponse = await res.json();
        if (res.status === 401) {
          throw new Error('Credenciales inválidas');
        }
        throw new Error(errorJson.message || 'Error al iniciar sesión');
      }

      const json: ApiSuccessResponse<{ user: User; token: string }> = await res.json();
      const { user, token } = json.data;

      // Persist token according to mantenerSesion preference
      if (mantenerSesion) {
        localStorage.setItem('token', token);
        sessionStorage.removeItem('token');
      } else {
        sessionStorage.setItem('token', token);
        localStorage.removeItem('token');
      }

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token, mantenerSesion } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw err;
    }
  }, []);

  const register = useCallback(async (nombre: string, escuela: string, email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, escuela, email, password }),
      });

      if (!res.ok) {
        const errorJson: ApiErrorResponse = await res.json();
        if (res.status === 409) {
          throw new Error('El email ya tiene una cuenta asociada');
        }
        if (res.status === 400 && errorJson.details) {
          const firstDetail = Object.values(errorJson.details)[0];
          throw new Error(firstDetail || errorJson.message);
        }
        throw new Error(errorJson.message || 'Error al registrarse');
      }

      const json: ApiSuccessResponse<{ user: User; token: string }> = await res.json();
      const { user, token } = json.data;

      // Register always persists in localStorage
      localStorage.setItem('token', token);
      sessionStorage.removeItem('token');

      dispatch({ type: 'REGISTER_SUCCESS', payload: { user, token } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrarse';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = state.token;
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignore logout API errors
    } finally {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
    }
  }, [state.token]);

  return (
    <AuthContext.Provider value={{ state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Hook ---

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
