import { Router } from 'express';

export const planificacionesRoutes = Router();

planificacionesRoutes.post('/', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
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
