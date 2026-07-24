import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Request, Response } from 'express';
import { createServer } from 'http';

// Mock the db module
vi.mock('../db/index.js', () => ({
  query: vi.fn(),
}));

// Mock auth service
vi.mock('../services/auth.service.js', () => ({
  verifyToken: vi.fn(),
}));

// Mock planificacion service
vi.mock('../services/planificacion.service.js', () => ({
  crear: vi.fn(),
  PlanificacionServiceError: class extends Error {
    statusCode: number;
    code: string;
    constructor(msg: string, code: string, statusCode: number) {
      super(msg);
      this.code = code;
      this.statusCode = statusCode;
    }
  },
}));

// Mock gemini service
vi.mock('../services/gemini.service.js', () => ({
  GeminiServiceError: class extends Error {
    statusCode: number;
    code: string;
    constructor(msg: string, code: string, statusCode: number) {
      super(msg);
      this.code = code;
      this.statusCode = statusCode;
    }
  },
}));

import { planificacionesRoutes } from './planificaciones.js';
import { query } from '../db/index.js';
import { verifyToken } from '../services/auth.service.js';

const mockQuery = vi.mocked(query);
const mockVerifyToken = vi.mocked(verifyToken);

// Helper to make requests
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/planificaciones', planificacionesRoutes);
  return app;
}

async function request(app: express.Express, method: string, path: string, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; body: any }>((resolve) => {
    const server = createServer(app);
    server.listen(0, () => {
      const addr = server.address() as { port: number };
      const url = `http://localhost:${addr.port}${path}`;
      fetch(url, { method, headers }).then(async (res) => {
        const body = await res.json();
        server.close();
        resolve({ status: res.status, body });
      });
    });
  });
}

describe('GET /api/planificaciones', () => {
  const validToken = 'Bearer valid-token';
  const userId = 'user-uuid-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockResolvedValue({
      success: true,
      data: { id: userId },
    } as any);
  });

  it('should return 401 when no token is provided', async () => {
    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones');
    expect(res.status).toBe(401);
  });

  it('should return 401 when token is invalid', async () => {
    mockVerifyToken.mockResolvedValueOnce({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token inválido' },
    } as any);

    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones', {
      Authorization: 'Bearer invalid-token',
    });
    expect(res.status).toBe(401);
  });

  it('should return all planificaciones ordered by created_at DESC by default', async () => {
    const mockRows = [
      {
        id: 'plan-1',
        titulo: 'Planificación Otoño',
        consigna_original: 'Trabajar el otoño con sala de 4',
        fecha_inicio: '2024-03-11',
        fecha_fin: '2024-03-15',
        categoria: 'recientes',
        imagen_url: 'https://img.com/1.jpg',
        created_at: '2024-03-11T10:00:00Z',
      },
      {
        id: 'plan-2',
        titulo: 'Día de la Bandera',
        consigna_original: 'Actividades para el Día de la Bandera en sala de 5',
        fecha_inicio: '2024-06-17',
        fecha_fin: '2024-06-21',
        categoria: 'efemerides',
        imagen_url: null,
        created_at: '2024-06-10T10:00:00Z',
      },
    ];

    mockQuery.mockResolvedValueOnce({ rows: mockRows, rowCount: 2 } as any);

    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones', {
      Authorization: validToken,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].id).toBe('plan-1');
    expect(res.body.data[0].titulo).toBe('Planificación Otoño');
    expect(res.body.data[0].categoria).toBe('recientes');
    expect(res.body.data[0].imagenUrl).toBe('https://img.com/1.jpg');

    // Verify query was called with just the user id (no category filter)
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE usuario_id = $1'),
      [userId]
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY created_at DESC'),
      expect.any(Array)
    );
  });

  it('should return all planificaciones when filtro=recientes', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones?filtro=recientes', {
      Authorization: validToken,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    // Should NOT filter by categoria
    expect(mockQuery).toHaveBeenCalledWith(
      expect.not.stringContaining('categoria = $2'),
      [userId]
    );
  });

  it('should filter by categoria when filtro=efemerides', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones?filtro=efemerides', {
      Authorization: validToken,
    });

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('categoria = $2'),
      [userId, 'efemerides']
    );
  });

  it('should filter by categoria when filtro=proyectos', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones?filtro=proyectos', {
      Authorization: validToken,
    });

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('categoria = $2'),
      [userId, 'proyectos']
    );
  });

  it('should return 400 when filtro is invalid', async () => {
    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones?filtro=invalido', {
      Authorization: validToken,
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toContain('Filtro inválido');
  });

  it('should truncate description to 80 characters with "..." suffix', async () => {
    const longDescription = 'A'.repeat(100);
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'plan-1',
        titulo: 'Test',
        consigna_original: longDescription,
        fecha_inicio: '2024-03-11',
        fecha_fin: '2024-03-15',
        categoria: 'recientes',
        imagen_url: null,
        created_at: '2024-03-11T10:00:00Z',
      }],
      rowCount: 1,
    } as any);

    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones', {
      Authorization: validToken,
    });

    expect(res.status).toBe(200);
    expect(res.body.data[0].descripcion).toBe('A'.repeat(80) + '...');
    expect(res.body.data[0].descripcion.length).toBe(83); // 80 + "..."
  });

  it('should NOT truncate description when it is 80 chars or less', async () => {
    const shortDescription = 'A'.repeat(80);
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'plan-1',
        titulo: 'Test',
        consigna_original: shortDescription,
        fecha_inicio: '2024-03-11',
        fecha_fin: '2024-03-15',
        categoria: 'recientes',
        imagen_url: null,
        created_at: '2024-03-11T10:00:00Z',
      }],
      rowCount: 1,
    } as any);

    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones', {
      Authorization: validToken,
    });

    expect(res.status).toBe(200);
    expect(res.body.data[0].descripcion).toBe(shortDescription);
    expect(res.body.data[0].descripcion.length).toBe(80);
  });

  it('should return summary objects with correct field names (camelCase)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'plan-1',
        titulo: 'Mi planificación',
        consigna_original: 'Una consigna corta',
        fecha_inicio: '2024-03-11',
        fecha_fin: '2024-03-15',
        categoria: 'efemerides',
        imagen_url: 'https://img.com/1.jpg',
        created_at: '2024-03-11T10:00:00Z',
      }],
      rowCount: 1,
    } as any);

    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones', {
      Authorization: validToken,
    });

    const item = res.body.data[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('titulo');
    expect(item).toHaveProperty('descripcion');
    expect(item).toHaveProperty('fechaInicio');
    expect(item).toHaveProperty('fechaFin');
    expect(item).toHaveProperty('categoria');
    expect(item).toHaveProperty('imagenUrl');
    expect(item).toHaveProperty('createdAt');
    // Should NOT have snake_case fields
    expect(item).not.toHaveProperty('consigna_original');
    expect(item).not.toHaveProperty('fecha_inicio');
    expect(item).not.toHaveProperty('imagen_url');
    expect(item).not.toHaveProperty('created_at');
  });

  it('should return { data: [...] } format', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones', {
      Authorization: validToken,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return 500 when database query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const app = createApp();
    const res = await request(app, 'GET', '/api/planificaciones', {
      Authorization: validToken,
    });

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });
});
