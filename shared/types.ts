// === Domain Models ===

export interface User {
  id: string;
  nombre: string;
  escuela: string;
  email: string;
}

export interface Planificacion {
  id: string;
  titulo: string;
  consignaOriginal: string;
  fechaInicio: string;
  fechaFin: string;
  objetivos: string[];
  areaCurricular: string;
  ambitoExperiencia: string;
  fundamentacion: string;
  categoria: 'recientes' | 'efemerides' | 'proyectos' | 'archivado';
  imagenUrl?: string;
  actividades: Actividad[];
  materiales: Material[];
  adaptaciones: Adaptacion[];
  createdAt: string;
}

export interface Actividad {
  id: string;
  /** Semana de la planificación a la que pertenece la actividad (entero >= 1). */
  semana: number;
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
  titulo: string;
  descripcion: string;
  orden: number;
}

export interface Material {
  id: string;
  nombre: string;
  icono: string;
  orden: number;
}

export interface Adaptacion {
  id: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  orden: number;
}

// === Auth ===

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  mantenerSesion: boolean;
}

// === Voice ===

export type VoiceError =
  | 'not-supported'
  | 'permission-denied'
  | 'no-audio'
  | 'recognition-error'
  | 'max-length';

export interface VoiceState {
  isRecording: boolean;
  partialTranscript: string;
  error: VoiceError | null;
}

// === Static Data ===

export interface Efemeride {
  fecha: string; // MM-DD
  nombre: string;
  descripcion: string;
  sugerenciaConsigna: string;
}

export interface DatosEstaticos {
  efemerides: Efemeride[];
  estaciones: {
    nombre: string;
    meses: number[];
    sugerencias: string[];
  }[];
}

// === Gemini Response ===

export interface GeminiPlanificacionResponse {
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  objetivos: string[];
  areaCurricular: string;
  ambitoExperiencia: string;
  actividades: {
    /** Semana de la planificación (entero >= 1). Si falta, se asume 1. */
    semana?: number;
    dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
    titulo: string;
    descripcion: string;
  }[];
  materiales: {
    nombre: string;
    icono: string;
  }[];
  adaptaciones: {
    categoria: string;
    titulo: string;
    descripcion: string;
  }[];
  fundamentacion: string;
}

// === API Error Codes ===

export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  AI_TIMEOUT = 'AI_TIMEOUT',
  AI_PARSE_ERROR = 'AI_PARSE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// === API Response Wrappers ===

export interface ApiErrorResponse {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, string>;
}

export interface ApiSuccessResponse<T> {
  data: T;
}
