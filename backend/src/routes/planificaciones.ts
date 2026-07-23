import { Router, Request, Response } from 'express';
import { verifyToken } from '../services/auth.service.js';
import { crear, PlanificacionServiceError } from '../services/planificacion.service.js';
import { GeminiServiceError } from '../services/gemini.service.js';
import { ApiErrorCode } from '../models/index.js';
import { query } from '../db/index.js';

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

/**
 * PATCH /api/planificaciones/:id
 * Update a specific field of a planificación.
 * Body: { path: string, value: string }
 * - path examples: "fundamentacion", "actividades.{id}.titulo", "materiales.{id}.nombre", "adaptaciones.{id}.descripcion"
 * - Validates character limits: 500 for titles/nombres, 2000 for descriptions/fundamentación
 */
planificacionesRoutes.patch('/:id', async (req: Request, res: Response) => {
  await authMiddleware(req, res, async () => {
    try {
      const user = (req as Request & { user: { id: string } }).user;
      const { id } = req.params;
      const { path, value } = req.body;

      if (!path || typeof path !== 'string') {
        res.status(400).json({
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'El campo "path" es requerido.',
        });
        return;
      }

      if (value === undefined || value === null || typeof value !== 'string') {
        res.status(400).json({
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'El campo "value" es requerido y debe ser texto.',
        });
        return;
      }

      // Validate character limits based on path
      const titlePaths = ['titulo', 'nombre'];
      const descPaths = ['descripcion', 'fundamentacion'];

      const lastSegment = path.split('.').pop() || '';
      const isTitleField = titlePaths.includes(lastSegment);
      const isDescField = descPaths.includes(lastSegment);

      if (isTitleField && value.length > 500) {
        res.status(400).json({
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Los títulos no pueden superar los 500 caracteres.',
        });
        return;
      }

      if (isDescField && value.length > 2000) {
        res.status(400).json({
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Las descripciones no pueden superar los 2000 caracteres.',
        });
        return;
      }

      // Verify planificación belongs to user
      const planCheck = await query(
        'SELECT id FROM planificacion WHERE id = $1 AND usuario_id = $2',
        [id, user.id]
      );

      if (planCheck.rows.length === 0) {
        res.status(404).json({
          code: ApiErrorCode.NOT_FOUND,
          message: 'Planificación no encontrada.',
        });
        return;
      }

      // Parse path and update accordingly
      const segments = path.split('.');

      if (segments.length === 1) {
        // Direct field on planificacion table (e.g., "fundamentacion", "titulo")
        const allowedFields = ['titulo', 'fundamentacion'];
        if (!allowedFields.includes(segments[0])) {
          res.status(400).json({
            code: ApiErrorCode.VALIDATION_ERROR,
            message: `Campo "${segments[0]}" no es editable.`,
          });
          return;
        }

        await query(
          `UPDATE planificacion SET ${segments[0]} = $1, updated_at = NOW() WHERE id = $2`,
          [value, id]
        );
      } else if (segments.length === 3) {
        // Nested field: "actividades.{id}.titulo", "materiales.{id}.nombre", etc.
        const [table, itemId, field] = segments;

        const tableMap: Record<string, { table: string; allowedFields: string[] }> = {
          actividades: { table: 'actividad', allowedFields: ['titulo', 'descripcion'] },
          materiales: { table: 'material', allowedFields: ['nombre'] },
          adaptaciones: { table: 'adaptacion', allowedFields: ['titulo', 'descripcion'] },
        };

        const tableConfig = tableMap[table];
        if (!tableConfig) {
          res.status(400).json({
            code: ApiErrorCode.VALIDATION_ERROR,
            message: `Tabla "${table}" no es válida.`,
          });
          return;
        }

        if (!tableConfig.allowedFields.includes(field)) {
          res.status(400).json({
            code: ApiErrorCode.VALIDATION_ERROR,
            message: `Campo "${field}" no es editable en "${table}".`,
          });
          return;
        }

        const updateResult = await query(
          `UPDATE ${tableConfig.table} SET ${field} = $1 WHERE id = $2 AND planificacion_id = $3`,
          [value, itemId, id]
        );

        if (updateResult.rowCount === 0) {
          res.status(404).json({
            code: ApiErrorCode.NOT_FOUND,
            message: 'Elemento no encontrado.',
          });
          return;
        }
      } else {
        res.status(400).json({
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Formato de path inválido.',
        });
        return;
      }

      res.status(200).json({ data: { success: true, path, value } });
    } catch (error) {
      console.error('Planificacion patch error:', error);
      res.status(500).json({
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Error interno del servidor',
      });
    }
  });
});

planificacionesRoutes.delete('/:id', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});
