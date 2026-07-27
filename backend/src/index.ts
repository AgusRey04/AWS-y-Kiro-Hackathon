import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.js';
import { planificacionesRoutes } from './routes/planificaciones.js';
import { datosEstaticosRoutes } from './routes/datos-estaticos.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/planificaciones', planificacionesRoutes);
app.use('/api/datos-estaticos', datosEstaticosRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vercel invokes the exported app directly; only listen when running locally.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`EduPlanner backend running on port ${PORT}`);
  });
}

export default app;
