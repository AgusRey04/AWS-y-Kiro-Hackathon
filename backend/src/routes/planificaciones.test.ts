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

// Helper con soporte de body JSON para requests POST/PATCH
async function requestWithBody(
  app: express.Express,
  method: string,
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Promise<{ status: number; body: any }>((resolve) => {
    const server = createServer(app);
    server.listen(0, () => {
      const addr = server.address() as { port: number };
      const url = `http://localhost:${addr.port}${path}`;
      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      }).then(async (res) => {
        const responseBody = await res.json();
        server.close();
        resolve({ status: res.status, body: responseBody });
      });
    });
  });
}

describe('POST /api/planificaciones/:id/actividades', () => {
  const validToken = 'Bearer valid-token';
  const userId = 'user-uuid-123';
  const planId = 'plan-uuid-1';
  const endpoint = `/api/planificaciones/${planId}/actividades`;

  const validBody = {
    dia: 'viernes',
    semana: 2,
    titulo: 'Kermesse del Movimiento para Calentar el Cuerpo',
    descripcion: 'Organizaremos una serie de postas lúdicas con juegos motores.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockResolvedValue({
      success: true,
      data: { id: userId },
    } as any);
  });

  function mockOwnershipOkAndInsert(orden: number, overrides: Record<string, unknown> = {}) {
    // 1) ownership check
    mockQuery.mockResolvedValueOnce({ rows: [{ id: planId }], rowCount: 1 } as any);
    // 2) next orden
    mockQuery.mockResolvedValueOnce({ rows: [{ siguiente: orden }], rowCount: 1 } as any);
    // 3) insert
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'act-uuid-nueva',
        semana: validBody.semana,
        dia: validBody.dia,
        titulo: validBody.titulo,
        descripcion: validBody.descripcion,
        orden,
        ...overrides,
      }],
      rowCount: 1,
    } as any);
  }

  it('should return 401 when no token is provided', async () => {
    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when token is invalid', async () => {
    mockVerifyToken.mockResolvedValueOnce({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token inválido' },
    } as any);

    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody, {
      Authorization: 'Bearer invalid-token',
    });
    expect(res.status).toBe(401);
  });

  it('should create the actividad and return it with its DB id (happy path)', async () => {
    mockOwnershipOkAndInsert(3);

    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody, {
      Authorization: validToken,
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({
      id: 'act-uuid-nueva',
      semana: 2,
      dia: 'viernes',
      titulo: validBody.titulo,
      descripcion: validBody.descripcion,
      orden: 3,
    });

    // Ownership validado por usuario_id
    expect(mockQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE id = $1 AND usuario_id = $2'),
      [planId, userId]
    );

    // orden calculado como el siguiente de esa semana + día
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('COALESCE(MAX(orden), 0) + 1'),
      [planId, 2, 'viernes']
    );

    // insert parametrizado con la semana y el orden calculado
    expect(mockQuery).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO actividad'),
      [planId, 2, 'viernes', validBody.titulo, validBody.descripcion, 3]
    );
  });

  it('should use orden 1 when the day has no activities yet', async () => {
    mockOwnershipOkAndInsert(1);

    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody, {
      Authorization: validToken,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.orden).toBe(1);
  });

  it('should trim titulo and descripcion before inserting', async () => {
    mockOwnershipOkAndInsert(1);

    const app = createApp();
    await requestWithBody(
      app,
      'POST',
      endpoint,
      { dia: 'lunes', semana: 1, titulo: '  Titulo  ', descripcion: '  Desc  ' },
      { Authorization: validToken }
    );

    expect(mockQuery).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO actividad'),
      [planId, 1, 'lunes', 'Titulo', 'Desc', 1]
    );
  });

  it.each(['sabado', 'domingo', 'Lunes', '', 'lunes ', 'miércoles'])(
    'should return 400 when dia is invalid: %s',
    async (dia) => {
      const app = createApp();
      const res = await requestWithBody(
        app,
        'POST',
        endpoint,
        { ...validBody, dia },
        { Authorization: validToken }
      );

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(mockQuery).not.toHaveBeenCalled();
    }
  );

  it('should accept all five valid days', async () => {
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

    for (const dia of dias) {
      vi.clearAllMocks();
      mockVerifyToken.mockResolvedValue({ success: true, data: { id: userId } } as any);
      mockOwnershipOkAndInsert(1, { dia });

      const app = createApp();
      const res = await requestWithBody(
        app,
        'POST',
        endpoint,
        { ...validBody, dia },
        { Authorization: validToken }
      );

      expect(res.status).toBe(201);
      expect(res.body.data.dia).toBe(dia);
    }
  });

  it('should return 400 when dia is missing', async () => {
    const app = createApp();
    const res = await requestWithBody(
      app,
      'POST',
      endpoint,
      { titulo: 'T', descripcion: 'D' },
      { Authorization: validToken }
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  // --- Semana ---

  it('should default semana to 1 when it is not provided', async () => {
    mockOwnershipOkAndInsert(1, { semana: 1 });

    const app = createApp();
    const res = await requestWithBody(
      app,
      'POST',
      endpoint,
      { dia: 'lunes', titulo: 'Titulo', descripcion: 'Desc' },
      { Authorization: validToken }
    );

    expect(res.status).toBe(201);
    expect(res.body.data.semana).toBe(1);
    expect(mockQuery).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO actividad'),
      [planId, 1, 'lunes', 'Titulo', 'Desc', 1]
    );
  });

  it.each([1, 2, 3, 12])('should accept semana %s (integer >= 1)', async (semana) => {
    vi.clearAllMocks();
    mockVerifyToken.mockResolvedValue({ success: true, data: { id: userId } } as any);
    mockOwnershipOkAndInsert(1, { semana });

    const app = createApp();
    const res = await requestWithBody(
      app,
      'POST',
      endpoint,
      { ...validBody, semana },
      { Authorization: validToken }
    );

    expect(res.status).toBe(201);
    expect(res.body.data.semana).toBe(semana);
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('semana = $2'),
      [planId, semana, validBody.dia]
    );
  });

  it.each([[0], [-1], [1.5], ['dos'], [''.padEnd(3, ' ')], [true], [[]], [{}]])(
    'should return 400 when semana is invalid: %s',
    async (semana: unknown) => {
      vi.clearAllMocks();
      mockVerifyToken.mockResolvedValue({ success: true, data: { id: userId } } as any);

      const app = createApp();
      const res = await requestWithBody(
        app,
        'POST',
        endpoint,
        { ...validBody, semana },
        { Authorization: validToken }
      );

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toContain('semana');
      expect(mockQuery).not.toHaveBeenCalled();
    }
  );

  it('should isolate orden per semana (same day, different weeks)', async () => {
    mockOwnershipOkAndInsert(1, { semana: 3 });

    const app = createApp();
    const res = await requestWithBody(
      app,
      'POST',
      endpoint,
      { ...validBody, semana: 3 },
      { Authorization: validToken }
    );

    expect(res.status).toBe(201);
    // El cálculo del orden se restringe a la semana y el día elegidos
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('semana = $2 AND dia = $3'),
      [planId, 3, validBody.dia]
    );
  });

  it('should return 400 when titulo is missing or empty', async () => {
    const app = createApp();

    for (const titulo of [undefined, '', '   ']) {
      vi.clearAllMocks();
      mockVerifyToken.mockResolvedValue({ success: true, data: { id: userId } } as any);

      const res = await requestWithBody(
        app,
        'POST',
        endpoint,
        { dia: 'lunes', titulo, descripcion: 'Desc' },
        { Authorization: validToken }
      );

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(mockQuery).not.toHaveBeenCalled();
    }
  });

  it('should return 400 when titulo exceeds 500 characters', async () => {
    const app = createApp();
    const res = await requestWithBody(
      app,
      'POST',
      endpoint,
      { dia: 'lunes', titulo: 'A'.repeat(501), descripcion: 'Desc' },
      { Authorization: validToken }
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toContain('500 caracteres');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should accept titulo of exactly 500 characters', async () => {
    mockOwnershipOkAndInsert(1, { titulo: 'A'.repeat(500) });

    const app = createApp();
    const res = await requestWithBody(
      app,
      'POST',
      endpoint,
      { dia: 'lunes', titulo: 'A'.repeat(500), descripcion: 'Desc' },
      { Authorization: validToken }
    );

    expect(res.status).toBe(201);
  });

  it('should return 400 when descripcion is missing or empty', async () => {
    const app = createApp();

    for (const descripcion of [undefined, '', '   ']) {
      vi.clearAllMocks();
      mockVerifyToken.mockResolvedValue({ success: true, data: { id: userId } } as any);

      const res = await requestWithBody(
        app,
        'POST',
        endpoint,
        { dia: 'lunes', titulo: 'Titulo', descripcion },
        { Authorization: validToken }
      );

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(mockQuery).not.toHaveBeenCalled();
    }
  });

  it('should return 400 when descripcion exceeds 2000 characters', async () => {
    const app = createApp();
    const res = await requestWithBody(
      app,
      'POST',
      endpoint,
      { dia: 'lunes', titulo: 'Titulo', descripcion: 'B'.repeat(2001) },
      { Authorization: validToken }
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toContain('2000 caracteres');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should accept descripcion of exactly 2000 characters', async () => {
    mockOwnershipOkAndInsert(1, { descripcion: 'B'.repeat(2000) });

    const app = createApp();
    const res = await requestWithBody(
      app,
      'POST',
      endpoint,
      { dia: 'lunes', titulo: 'Titulo', descripcion: 'B'.repeat(2000) },
      { Authorization: validToken }
    );

    expect(res.status).toBe(201);
  });

  it('should return 404 when the planificación belongs to another user', async () => {
    // Ownership check devuelve vacío
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody, {
      Authorization: validToken,
    });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.message).toBe('Planificación no encontrada.');
    // No debe insertar nada
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when the database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody, {
      Authorization: validToken,
    });

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });
});

describe('POST /api/planificaciones/:id/materiales', () => {
  const validToken = 'Bearer valid-token';
  const userId = 'user-uuid-123';
  const planId = 'plan-uuid-1';
  const endpoint = `/api/planificaciones/${planId}/materiales`;

  const validBody = {
    nombre: 'Linternas pequeñas',
    icono: '🔦',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockResolvedValue({
      success: true,
      data: { id: userId },
    } as any);
  });

  function mockOwnershipOkAndInsert(orden: number, overrides: Record<string, unknown> = {}) {
    // 1) ownership check
    mockQuery.mockResolvedValueOnce({ rows: [{ id: planId }], rowCount: 1 } as any);
    // 2) next orden
    mockQuery.mockResolvedValueOnce({ rows: [{ siguiente: orden }], rowCount: 1 } as any);
    // 3) insert
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'mat-uuid-nuevo',
        nombre: validBody.nombre,
        icono: validBody.icono,
        orden,
        ...overrides,
      }],
      rowCount: 1,
    } as any);
  }

  it('should return 401 when no token is provided', async () => {
    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when token is invalid', async () => {
    mockVerifyToken.mockResolvedValueOnce({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token inválido' },
    } as any);

    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody, {
      Authorization: 'Bearer invalid-token',
    });
    expect(res.status).toBe(401);
  });

  it('should create the material and return it with its DB id (happy path)', async () => {
    mockOwnershipOkAndInsert(4);

    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody, {
      Authorization: validToken,
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({
      id: 'mat-uuid-nuevo',
      nombre: validBody.nombre,
      icono: validBody.icono,
      orden: 4,
    });

    // Ownership validado por usuario_id
    expect(mockQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE id = $1 AND usuario_id = $2'),
      [planId, userId]
    );

    // orden calculado como el siguiente dentro de la planificación
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('COALESCE(MAX(orden), 0) + 1'),
      [planId]
    );

    // insert parametrizado con nombre, icono y orden calculado
    expect(mockQuery).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO material'),
      [planId, validBody.nombre, validBody.icono, 4]
    );
  });

  it('should use orden 1 when there are no materiales yet', async () => {
    mockOwnershipOkAndInsert(1);

    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody, {
      Authorization: validToken,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.orden).toBe(1);
  });

  it('should trim nombre and icono before inserting', async () => {
    mockOwnershipOkAndInsert(1);

    const app = createApp();
    await requestWithBody(
      app,
      'POST',
      endpoint,
      { nombre: '  Lana  ', icono: ' 🧦 ' },
      { Authorization: validToken }
    );

    expect(mockQuery).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO material'),
      [planId, 'Lana', '🧦', 1]
    );
  });

  it('should return 400 when nombre is missing or empty', async () => {
    const app = createApp();

    for (const nombre of [undefined, '', '   ']) {
      vi.clearAllMocks();
      mockVerifyToken.mockResolvedValue({ success: true, data: { id: userId } } as any);

      const res = await requestWithBody(
        app,
        'POST',
        endpoint,
        { nombre, icono: '🔦' },
        { Authorization: validToken }
      );

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(mockQuery).not.toHaveBeenCalled();
    }
  });

  it('should return 400 when nombre exceeds 500 characters', async () => {
    const app = createApp();
    const res = await requestWithBody(
      app,
      'POST',
      endpoint,
      { nombre: 'A'.repeat(501), icono: '🔦' },
      { Authorization: validToken }
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toContain('500 caracteres');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should accept nombre of exactly 500 characters', async () => {
    mockOwnershipOkAndInsert(1, { nombre: 'A'.repeat(500) });

    const app = createApp();
    const res = await requestWithBody(
      app,
      'POST',
      endpoint,
      { nombre: 'A'.repeat(500), icono: '🔦' },
      { Authorization: validToken }
    );

    expect(res.status).toBe(201);
  });

  it('should return 400 when icono is missing or empty', async () => {
    const app = createApp();

    for (const icono of [undefined, '', '   ']) {
      vi.clearAllMocks();
      mockVerifyToken.mockResolvedValue({ success: true, data: { id: userId } } as any);

      const res = await requestWithBody(
        app,
        'POST',
        endpoint,
        { nombre: 'Linternas', icono },
        { Authorization: validToken }
      );

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(mockQuery).not.toHaveBeenCalled();
    }
  });

  it('should return 400 when icono exceeds 8 characters', async () => {
    const app = createApp();
    const res = await requestWithBody(
      app,
      'POST',
      endpoint,
      { nombre: 'Linternas', icono: '🔦🔦🔦🔦🔦' },
      { Authorization: validToken }
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toContain('8 caracteres');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should return 404 when the planificación belongs to another user', async () => {
    // Ownership check devuelve vacío
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody, {
      Authorization: validToken,
    });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.message).toBe('Planificación no encontrada.');
    // No debe insertar nada
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when the database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const app = createApp();
    const res = await requestWithBody(app, 'POST', endpoint, validBody, {
      Authorization: validToken,
    });

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });
});

describe('DELETE /api/planificaciones/:id/actividades/:actividadId', () => {
  const validToken = 'Bearer valid-token';
  const userId = 'user-uuid-123';
  const planId = 'plan-uuid-1';
  const actividadId = 'act-uuid-1';
  const endpoint = `/api/planificaciones/${planId}/actividades/${actividadId}`;

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockResolvedValue({
      success: true,
      data: { id: userId },
    } as any);
  });

  it('should return 401 when no token is provided', async () => {
    const app = createApp();
    const res = await request(app, 'DELETE', endpoint);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    mockVerifyToken.mockResolvedValueOnce({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token inválido' },
    } as any);

    const app = createApp();
    const res = await request(app, 'DELETE', endpoint, {
      Authorization: 'Bearer invalid-token',
    });

    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should delete only that actividad and return success (happy path)', async () => {
    // 1) ownership check
    mockQuery.mockResolvedValueOnce({ rows: [{ id: planId }], rowCount: 1 } as any);
    // 2) delete
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const app = createApp();
    const res = await request(app, 'DELETE', endpoint, { Authorization: validToken });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ success: true });

    // Ownership validado ANTES de borrar
    expect(mockQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE id = $1 AND usuario_id = $2'),
      [planId, userId]
    );

    // Borra solo esa actividad, acotada a la planificación
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('DELETE FROM actividad WHERE id = $1 AND planificacion_id = $2'),
      [actividadId, planId]
    );
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('should return 404 when the planificación belongs to another user', async () => {
    // Ownership check devuelve vacío
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const app = createApp();
    const res = await request(app, 'DELETE', endpoint, { Authorization: validToken });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.message).toBe('Planificación no encontrada.');
    // No debe borrar nada
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('should return 404 when the actividad does not exist in that planificación', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: planId }], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const app = createApp();
    const res = await request(app, 'DELETE', endpoint, { Authorization: validToken });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.message).toBe('Actividad no encontrada.');
  });

  it('should return 500 when the database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const app = createApp();
    const res = await request(app, 'DELETE', endpoint, { Authorization: validToken });

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });

  it('should not be captured by DELETE /:id (the planificación is not deleted)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: planId }], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const app = createApp();
    await request(app, 'DELETE', endpoint, { Authorization: validToken });

    const sqls = mockQuery.mock.calls.map((call) => String(call[0]));
    expect(sqls.some((sql) => sql.includes('DELETE FROM planificacion'))).toBe(false);
    expect(sqls.some((sql) => sql.includes('DELETE FROM material'))).toBe(false);
  });
});
