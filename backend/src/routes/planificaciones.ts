import { Router, Request, Response } from 'express';
import { verifyToken } from '../services/auth.service.js';
import { crear, PlanificacionServiceError } from '../services/planificacion.service.js';
import { GeminiServiceError } from '../services/gemini.service.js';
import { ApiErrorCode } from '../models/index.js';

export const planificacionesRoutes = Router();

/**
 * Auth middleware: extracts user from JWT Bearer token.
 */
async function authMiddleware(req: Request, res: Response, next: () => void): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: ApiErrorCode.UNAUTHORIZED,
      message: 'Token de autenticación requerido',
    });
    return;
  }

  const token = authHeader.slice(7);
  const result = await verifyToken(token);

  if (!result.success) {
    res.status(401).json(result.error);
    return;
  }

  // Attach user to request
  (req as Request & { user: { id: string } }).user = result.data;
  next();
}

/**
 * POST /api/planificaciones
 * Create a new planificación using Gemini AI.
 */
planificacionesRoutes.post('/', async (req: Request, res: Response) => {
  await authMiddleware(req, res, async () => {
    try {
      const user = (req as Request & { user: { id: string } }).user;
      const { consigna } = req.body;

      if (!consigna || typeof consigna !== 'string') {
        res.status(400).json({
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'La consigna es requerida y debe ser texto.',
        });
        return;
      }

      const planificacion = await crear(user.id, consigna);

      res.status(201).json({ data: planificacion });
    } catch (error) {
      if (error instanceof GeminiServiceError) {
        res.status(error.statusCode).json({
          code: error.code,
          message: error.message,
        });
        return;
      }

      if (error instanceof PlanificacionServiceError) {
        res.status(error.statusCode).json({
          code: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Planificacion creation error:', error);
      res.status(500).json({
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Error interno del servidor',
      });
    }
  });
});

planificacionesRoutes.get('/', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

planificacionesRoutes.get('/:id', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

planificacionesRoutes.patch('/:id', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

planificacionesRoutes.delete('/:id', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});
