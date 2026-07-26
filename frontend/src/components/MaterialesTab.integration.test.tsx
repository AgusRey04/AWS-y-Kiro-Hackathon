import { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MaterialesTab from './MaterialesTab';
import { PlanProvider, usePlan } from '../contexts/PlanContext';
import { server } from '../test/mocks/server';

/**
 * Integración: botón de tacho + confirmación + PlanContext + endpoint
 * DELETE /api/planificaciones/:id/materiales/:materialId (mockeado con MSW).
 */

const PLAN_ID = 'plan-1';

const MOCK_PLAN = {
  id: PLAN_ID,
  titulo: 'Semana del otoño',
  consignaOriginal: 'Trabajar el otoño',
  fechaInicio: '2024-06-10',
  fechaFin: '2024-06-14',
  objetivos: ['Explorar texturas'],
  areaCurricular: 'Ambiente Natural',
  ambitoExperiencia: 'Descubrimiento del entorno',
  fundamentacion: 'Fundamentación.',
  categoria: 'recientes' as const,
  actividades: [],
  materiales: [
    { id: 'mat-1', nombre: 'Hojas secas', icono: '🍂', orden: 1 },
    { id: 'mat-2', nombre: 'Témperas', icono: '🎨', orden: 2 },
  ],
  adaptaciones: [],
  createdAt: '2024-06-09T10:00:00Z',
};

function Harness() {
  const { planificacion, loadById } = usePlan();

  useEffect(() => {
    loadById(PLAN_ID);
  }, [loadById]);

  if (!planificacion) return <p>Cargando…</p>;

  return (
    <MaterialesTab
      materiales={planificacion.materiales}
      planificacionId={planificacion.id}
    />
  );
}

function renderHarness() {
  return render(
    <MemoryRouter>
      <PlanProvider>
        <Harness />
      </PlanProvider>
    </MemoryRouter>
  );
}

describe('MaterialesTab + PlanContext: eliminar material (integración con MSW)', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'token-de-prueba');
    server.use(
      http.get(`/api/planificaciones/${PLAN_ID}`, () => HttpResponse.json({ data: MOCK_PLAN }))
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('borra el material end-to-end: llama al endpoint y lo quita del preview', async () => {
    let urlLlamada: string | null = null;
    let metodoLlamado: string | null = null;
    let authRecibido: string | null = null;

    server.use(
      http.delete(
        `/api/planificaciones/${PLAN_ID}/materiales/:materialId`,
        ({ request }) => {
          urlLlamada = new URL(request.url).pathname;
          metodoLlamado = request.method;
          authRecibido = request.headers.get('Authorization');
          return HttpResponse.json({ data: { success: true } });
        }
      )
    );

    renderHarness();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText('Hojas secas')).toBeInTheDocument());
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    await user.click(
      screen.getByRole('button', { name: 'Eliminar material: Témperas' })
    );
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(metodoLlamado).toBe('DELETE');
    expect(urlLlamada).toBe(`/api/planificaciones/${PLAN_ID}/materiales/mat-2`);
    expect(authRecibido).toBe('Bearer token-de-prueba');

    expect(screen.queryByText('Témperas')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('muestra el estado vacío cuando se borra el último material', async () => {
    const PLAN_UN_MATERIAL = { ...MOCK_PLAN, materiales: [MOCK_PLAN.materiales[0]] };
    server.use(
      http.get(`/api/planificaciones/${PLAN_ID}`, () =>
        HttpResponse.json({ data: PLAN_UN_MATERIAL })
      ),
      http.delete(`/api/planificaciones/${PLAN_ID}/materiales/:materialId`, () =>
        HttpResponse.json({ data: { success: true } })
      )
    );

    renderHarness();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText('Hojas secas')).toBeInTheDocument());

    await user.click(
      screen.getByRole('button', { name: 'Eliminar material: Hojas secas' })
    );
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(
      await screen.findByText('No hay materiales disponibles para esta planificación.')
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('muestra el error del endpoint, no borra nada y permite reintentar', async () => {
    let llamadas = 0;
    server.use(
      http.delete(`/api/planificaciones/${PLAN_ID}/materiales/:materialId`, () => {
        llamadas += 1;
        if (llamadas === 1) {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
            { status: 500 }
          );
        }
        return HttpResponse.json({ data: { success: true } });
      })
    );

    renderHarness();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText('Hojas secas')).toBeInTheDocument());

    await user.click(
      screen.getByRole('button', { name: 'Eliminar material: Témperas' })
    );
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Témperas')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByText('Témperas')).not.toBeInTheDocument();
    expect(llamadas).toBe(2);
  });
});
