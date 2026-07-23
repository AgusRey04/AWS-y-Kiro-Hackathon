import { Router } from 'express';

export const datosEstaticosRoutes = Router();

datosEstaticosRoutes.get('/efemerides', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

datosEstaticosRoutes.get('/sugerencias', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});
