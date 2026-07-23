import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { ApiErrorCode } from '../models/index.js';

const SALT_ROUNDS = 10;
const JWT_EXPIRATION = '7d';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

export interface RegisterInput {
  nombre: string;
  escuela: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  nombre: string;
  escuela: string;
  email: string;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export interface ValidationError {
  code: typeof ApiErrorCode.VALIDATION_ERROR;
  message: string;
  details: Record<string, string>;
}

export interface ConflictError {
  code: typeof ApiErrorCode.CONFLICT;
  message: string;
}

export interface UnauthorizedError {
  code: typeof ApiErrorCode.UNAUTHORIZED;
  message: string;
}

type ServiceError = ValidationError | ConflictError | UnauthorizedError;

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };

/**
 * Validate registration input fields.
 */
function validateRegisterInput(input: RegisterInput): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (!input.nombre || input.nombre.trim().length === 0) {
    errors.nombre = 'El nombre es requerido';
  } else if (input.nombre.trim().length > 100) {
    errors.nombre = 'El nombre no puede exceder 100 caracteres';
  }

  if (!input.escuela || input.escuela.trim().length === 0) {
    errors.escuela = 'La escuela es requerida';
  } else if (input.escuela.trim().length > 150) {
    errors.escuela = 'La escuela no puede exceder 150 caracteres';
  }

  if (!input.email || input.email.trim().length === 0) {
    errors.email = 'El email es requerido';
  } else if (input.email.trim().length > 254) {
    errors.email = 'El email no puede exceder 254 caracteres';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = 'El formato del email no es válido';
  }

  if (!input.password) {
    errors.password = 'La contraseña es requerida';
  } else if (input.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  } else if (input.password.length > 72) {
    errors.password = 'La contraseña no puede exceder 72 caracteres';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Validate login input fields.
 */
function validateLoginInput(input: LoginInput): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (!input.email || input.email.trim().length === 0) {
    errors.email = 'El email es requerido';
  }

  if (!input.password) {
    errors.password = 'La contraseña es requerida';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Generate a JWT token for a user.
 */
function generateToken(user: AuthUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRATION }
  );
}

/**
 * Register a new user.
 */
export async function register(input: RegisterInput): Promise<ServiceResult<AuthResult>> {
  const validationErrors = validateRegisterInput(input);
  if (validationErrors) {
    return {
      success: false,
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Datos de registro inválidos',
        details: validationErrors,
      },
    };
  }

  const email = input.email.trim().toLowerCase();
  const nombre = input.nombre.trim();
  const escuela = input.escuela.trim();

  // Check if email already exists
  const existingUser = await query(
    'SELECT id FROM usuario WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    return {
      success: false,
      error: {
        code: ApiErrorCode.CONFLICT,
        message: 'El email ya tiene una cuenta asociada',
      },
    };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Insert user
  const result = await query<{ id: string; nombre: string; escuela: string; email: string }>(
    `INSERT INTO usuario (nombre, escuela, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nombre, escuela, email`,
    [nombre, escuela, email, passwordHash]
  );

  const user: AuthUser = result.rows[0];
  const token = generateToken(user);

  return { success: true, data: { user, token } };
}

/**
 * Login with email and password.
 * Returns a generic error message without revealing if email exists.
 */
export async function login(input: LoginInput): Promise<ServiceResult<AuthResult>> {
  const validationErrors = validateLoginInput(input);
  if (validationErrors) {
    return {
      success: false,
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Datos de inicio de sesión inválidos',
        details: validationErrors,
      },
    };
  }

  const email = input.email.trim().toLowerCase();

  const result = await query<{ id: string; nombre: string; escuela: string; email: string; password_hash: string }>(
    'SELECT id, nombre, escuela, email, password_hash FROM usuario WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return {
      success: false,
      error: {
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'Credenciales inválidas',
      },
    };
  }

  const row = result.rows[0];
  const isValid = await bcrypt.compare(input.password, row.password_hash);

  if (!isValid) {
    return {
      success: false,
      error: {
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'Credenciales inválidas',
      },
    };
  }

  const user: AuthUser = { id: row.id, nombre: row.nombre, escuela: row.escuela, email: row.email };
  const token = generateToken(user);

  return { success: true, data: { user, token } };
}

/**
 * Verify a JWT token and return the user.
 */
export async function verifyToken(token: string): Promise<ServiceResult<AuthUser>> {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: string; email: string };

    const result = await query<{ id: string; nombre: string; escuela: string; email: string }>(
      'SELECT id, nombre, escuela, email FROM usuario WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          message: 'Token inválido',
        },
      };
    }

    return { success: true, data: result.rows[0] };
  } catch {
    return {
      success: false,
      error: {
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'Token inválido o expirado',
      },
    };
  }
}
