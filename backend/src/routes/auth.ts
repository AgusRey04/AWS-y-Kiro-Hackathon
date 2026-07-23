import { Router, Request, Response } from 'express';
import { register, login, verifyToken } from '../services/auth.service.js';
import { ApiErrorCode } from '../models/index.js';

export const authRoutes = Router();

/**
 * POST /api/auth/register
 * Register a new user account.
 */
authRoutes.post('/register', async (req: Request, res: Response) => {
  try {
    const { nombre, escuela, email, password } = req.body;

    const result = await register({ nombre, escuela, email, password });

    if (!result.success) {
      const statusMap: Record<string, number> = {
        [ApiErrorCode.VALIDATION_ERROR]: 400,
        [ApiErrorCode.CONFLICT]: 409,
      };
      const status = statusMap[result.error.code] || 500;
      res.status(status).json(result.error);
      return;
    }

    res.status(201).json({ data: result.data });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user with email and password.
 */
authRoutes.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await login({ email, password });

    if (!result.success) {
      const statusMap: Record<string, number> = {
        [ApiErrorCode.VALIDATION_ERROR]: 400,
        [ApiErrorCode.UNAUTHORIZED]: 401,
      };
      const status = statusMap[result.error.code] || 500;
      res.status(status).json(result.error);
      return;
    }

    res.status(200).json({ data: result.data });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * POST /api/auth/logout
 * Client-side logout (stateless JWT - just acknowledges the request).
 */
authRoutes.post('/logout', (_req: Request, res: Response) => {
  // With JWT, logout is handled client-side by discarding the token.
  // This endpoint exists for API completeness and potential future token blacklisting.
  res.status(200).json({ data: { message: 'Sesión cerrada exitosamente' } });
});

/**
 * GET /api/auth/me
 * Get current authenticated user from JWT token.
 */
authRoutes.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'Token de autenticación requerido',
      });
      return;
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    const result = await verifyToken(token);

    if (!result.success) {
      res.status(401).json(result.error);
      return;
    }

    res.status(200).json({ data: { user: result.data } });
  } catch (error) {
    console.error('Auth/me error:', error);
    res.status(500).json({
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'Error interno del servidor',
    });
  }
});
