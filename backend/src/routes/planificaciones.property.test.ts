import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import { createServer, Server } from 'http';
import * as fc from 'fast-check';

/**
 * Feature: edu-planner
 * Property test for history ordering and filtering
 * Validates: Requirements 7.2, 7.3, 7.4, 7.5
 */

// Mock del módulo de base de datos: se reemplaza por un intérprete SQL en memoria
vi.mock('../db/index.js', () => ({
  query: vi.fn(),
}));

vi.mock('../services/auth.service.js', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('../services/planificacion.service.js', () => ({
  crear: vi.fn(),
  PlanificacionServiceError: class extends Error {},
}));

vi.mock('../services/gemini.service.js', () => ({
  GeminiServiceError: class extends Error {},
}));

import { planificacionesRoutes } from './planificaciones.js';
import { query } from '../db/index.js';
import { verifyToken } from '../services/auth.service.js';

const mockQuery = vi.mocked(query);
const mockVerifyToken = vi.mocked(verifyToken);

const USER_ID = 'user-under-test';
const OTHER_USER_ID = 'otro-usuario';

interface PlanRow {
  id: string;
  usuario_id: string;
  titulo: string;
  consigna_original: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  categoria: string;
  imagen_url: string | null;
  created_at: string;
}

/**
 * Intérprete mínimo de las cláusulas SQL que genera el endpoint de listado.
 * Aplica el filtro por usuario, el predicado sobre `categoria` y el ORDER BY
 * tal como están escritos en la consulta real, sin asumir nada extra.
 */
function ejecutarSqlEnMemoria(sql: string, params: unknown[], rows: PlanRow[]): PlanRow[] {
  let resultado = rows.filter((row) => row.usuario_id === params[0]);

  const igualLiteral = /categoria\s*=\s*'([a-z]+)'/i.exec(sql);
  const igualParam = /categoria\s*=\s*\$2/i.test(sql);
  const distintoLiteral = /categoria\s*!=\s*'([a-z]+)'/i.exec(sql);

  if (igualLiteral) {
    resultado = resultado.filter((row) => row.categoria === igualLiteral[1]);
  }
  if (igualParam) {
    resultado = resultado.filter((row) => row.categoria === params[1]);
  }
  if (distintoLiteral) {
    resultado = resultado.filter((row) => row.categoria !== distintoLiteral[1]);
  }

  const orderBy = /ORDER\s+BY\s+created_at\s+(ASC|DESC)/i.exec(sql);
  if (orderBy) {
    const factor = orderBy[1].toUpperCase() === 'DESC' ? -1 : 1;
    resultado = [...resultado].sort(
      (a, b) =>
        factor * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    );
  }

  return resultado;
}

// --- Servidor de test reutilizado entre iteraciones ---

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/planificaciones', planificacionesRoutes);

  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  baseUrl = `http://localhost:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

beforeEach(() => {
  mockVerifyToken.mockResolvedValue({
    success: true,
    data: { id: USER_ID },
  } as never);
});

interface Summary {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  createdAt: string;
}

async function listar(
  rows: PlanRow[],
  filtro: string | null
): Promise<{ status: number; data: Summary[] }> {
  mockQuery.mockImplementation((async (sql: string, params: unknown[] = []) => ({
    rows: ejecutarSqlEnMemoria(sql, params, rows),
    rowCount: 0,
  })) as never);

  const url = filtro
    ? `${baseUrl}/api/planificaciones?filtro=${filtro}`
    : `${baseUrl}/api/planificaciones`;

  const res = await fetch(url, { headers: { Authorization: 'Bearer valid-token' } });
  const body = (await res.json()) as { data?: Summary[] };

  return { status: res.status, data: body.data ?? [] };
}

// --- Generadores ---

const CATEGORIAS = ['recientes', 'efemerides', 'proyectos', 'archivado'];

/**
 * Generador inteligente: listas de filas con dueños, categorías y fechas de
 * creación mezcladas (incluyendo empates) e ids únicos por posición.
 */
const rowsArb: fc.Arbitrary<PlanRow[]> = fc
  .array(
    fc.record({
      usuario_id: fc.constantFrom(USER_ID, OTHER_USER_ID),
      categoria: fc.constantFrom(...CATEGORIAS),
      dias: fc.integer({ min: 0, max: 40 }),
      consigna: fc.string({ minLength: 0, maxLength: 300 }),
    }),
    { minLength: 0, maxLength: 12 }
  )
  .map((items) =>
    items.map((item, index) => {
      const tag = String(index).padStart(2, '0');
      const fecha = new Date(Date.UTC(2025, 0, 1 + item.dias, 12, 0, 0));
      return {
        id: `plan-${tag}`,
        usuario_id: item.usuario_id,
        titulo: `Titulo-${tag}`,
        consigna_original: item.consigna,
        fecha_inicio: '2025-03-10',
        fecha_fin: '2025-03-14',
        categoria: item.categoria,
        imagen_url: null,
        created_at: fecha.toISOString(),
      };
    })
  );

const filtroArb = fc.constantFrom<string | null>(
  null,
  'recientes',
  'efemerides',
  'proyectos',
  'archivado'
);

/** Orden esperado, calculado de forma independiente al endpoint. */
function esperadoOrdenado(rows: PlanRow[]): PlanRow[] {
  return [...rows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

describe('Feature: edu-planner, Property 12: History ordering and filtering', () => {
  /**
   * **Validates: Requirements 7.2, 7.3, 7.4, 7.5**
   *
   * For any list of planificaciones, the default and "Recientes" filter SHALL order
   * items by creation date descending. The "Efemérides" filter SHALL return only items
   * with category 'efemerides'. The "Proyectos" filter SHALL return only items with
   * category 'proyectos'.
   */

  it('orders results by creation date descending for every filter', async () => {
    await fc.assert(
      fc.asyncProperty(rowsArb, filtroArb, async (rows, filtro) => {
        const { status, data } = await listar(rows, filtro);

        expect(status).toBe(200);

        const fechas = data.map((item) => new Date(item.createdAt).getTime());
        const ordenadas = [...fechas].sort((a, b) => b - a);
        expect(fechas).toEqual(ordenadas);
      }),
      { numRuns: 100 }
    );
  });

  it('default and "recientes" filters return the same descending list of non-archived plans', async () => {
    await fc.assert(
      fc.asyncProperty(rowsArb, async (rows) => {
        const sinFiltro = await listar(rows, null);
        const recientes = await listar(rows, 'recientes');

        const esperados = esperadoOrdenado(
          rows.filter((row) => row.usuario_id === USER_ID && row.categoria !== 'archivado')
        ).map((row) => row.id);

        expect(sinFiltro.data.map((item) => item.id)).toEqual(esperados);
        expect(recientes.data.map((item) => item.id)).toEqual(esperados);
      }),
      { numRuns: 100 }
    );
  });

  it('"efemerides" and "proyectos" filters return only items of that category', async () => {
    await fc.assert(
      fc.asyncProperty(
        rowsArb,
        fc.constantFrom('efemerides', 'proyectos'),
        async (rows, filtro) => {
          const { data } = await listar(rows, filtro);

          data.forEach((item) => {
            expect(item.categoria).toBe(filtro);
          });

          const esperados = esperadoOrdenado(
            rows.filter((row) => row.usuario_id === USER_ID && row.categoria === filtro)
          ).map((row) => row.id);

          expect(data.map((item) => item.id)).toEqual(esperados);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('never leaks plans from other users nor archived plans in the default list', async () => {
    await fc.assert(
      fc.asyncProperty(rowsArb, filtroArb, async (rows, filtro) => {
        const { data } = await listar(rows, filtro);

        const idsDelUsuario = new Set(
          rows.filter((row) => row.usuario_id === USER_ID).map((row) => row.id)
        );

        data.forEach((item) => {
          expect(idsDelUsuario.has(item.id)).toBe(true);
          if (filtro === null || filtro === 'recientes') {
            expect(item.categoria).not.toBe('archivado');
          }
        });
      }),
      { numRuns: 100 }
    );
  });
});
