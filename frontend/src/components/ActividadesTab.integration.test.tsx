import { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ActividadesTab from './ActividadesTab';
import { PlanProvider, usePlan } from '../contexts/PlanContext';
import { server } from '../test/mocks/server';

/**
 * Integración: botón único "Agregar actividad" + formulario + PlanContext + endpoint
 * POST /api/planificaciones/:id/actividades (mockeado con MSW).
 */

const PLAN_ID = 'plan-1';

const MOCK_PLAN = {
  id: PLAN_ID,
  titulo: 'Semana del movimiento',
  consignaOriginal: 'Trabajar el movimiento',
  fechaInicio: '2024-06-10',
  fechaFin: '2024-06-14',
  objetivos: ['Explorar el cuerpo'],
  areaCurricular: 'Educación Física',
  ambitoExperiencia: 'Juego',
  fundamentacion: 'Fundamentación.',
  categoria: 'recientes' as const,
  actividades: [
    { id: 'act-1', semana: 1, dia: 'lunes', titulo: 'Ronda inicial', descripcion: 'Presentación', orden: 1 },
  ],
  materiales: [],
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
    <ActividadesTab
      actividades={planificacion.actividades}
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

async function abrirFormularioYCompletar(
  user: ReturnType<typeof userEvent.setup>,
  dia: string,
  titulo: string,
  descripcion: string,
  semana?: number
) {
  await user.click(screen.getByRole('button', { name: 'Agregar actividad' }));
  await user.selectOptions(screen.getByLabelText('Día'), dia);
  if (semana !== undefined) {
    await user.clear(screen.getByLabelText('Semana'));
    await user.type(screen.getByLabelText('Semana'), String(semana));
  }
  await user.type(screen.getByLabelText('Título'), titulo);
  await user.type(screen.getByLabelText('Descripción'), descripcion);
  await user.click(screen.getByRole('button', { name: 'Agregar' }));
}

describe('ActividadesTab + PlanContext (integración con MSW)', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'token-de-prueba');
    server.use(
      http.get(`/api/planificaciones/${PLAN_ID}`, () => HttpResponse.json({ data: MOCK_PLAN }))
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('crea la actividad vía endpoint y la muestra en la DayCard del día elegido', async () => {
    let bodyRecibido: unknown = null;
    let authRecibido: string | null = null;

    server.use(
      http.post(`/api/planificaciones/${PLAN_ID}/actividades`, async ({ request }) => {
        bodyRecibido = await request.json();
        authRecibido = request.headers.get('Authorization');
        return HttpResponse.json(
          {
            data: {
              id: 'act-db-99',
              semana: 1,
              dia: 'viernes',
              titulo: 'Kermesse del Movimiento',
              descripcion: 'Postas lúdicas con juegos motores',
              orden: 1,
            },
          },
          { status: 201 }
        );
      })
    );

    renderHarness();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText('Ronda inicial')).toBeInTheDocument());

    // El viernes todavía no tiene DayCard
    expect(screen.queryByLabelText('Actividades del Viernes')).not.toBeInTheDocument();

    await abrirFormularioYCompletar(
      user,
      'viernes',
      'Kermesse del Movimiento',
      'Postas lúdicas con juegos motores'
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // La DayCard del viernes ahora existe y contiene la actividad nueva
    const cards = screen.getAllByRole('listitem');
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Actividades del Lunes',
      'Actividades del Viernes',
    ]);
    expect(cards[1].textContent).toContain('Kermesse del Movimiento');
    expect(cards[1].textContent).toContain('Postas lúdicas con juegos motores');

    expect(bodyRecibido).toEqual({
      dia: 'viernes',
      semana: 1,
      titulo: 'Kermesse del Movimiento',
      descripcion: 'Postas lúdicas con juegos motores',
    });
    expect(authRecibido).toBe('Bearer token-de-prueba');
  });

  it('agrega la actividad al final del día cuando el día ya tenía actividades', async () => {
    server.use(
      http.post(`/api/planificaciones/${PLAN_ID}/actividades`, () =>
        HttpResponse.json(
          {
            data: {
              id: 'act-db-2',
              semana: 1,
              dia: 'lunes',
              titulo: 'Cierre del lunes',
              descripcion: 'Reflexión grupal',
              orden: 2,
            },
          },
          { status: 201 }
        )
      )
    );

    renderHarness();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText('Ronda inicial')).toBeInTheDocument());

    await abrirFormularioYCompletar(user, 'lunes', 'Cierre del lunes', 'Reflexión grupal');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(1);
    const texto = cards[0].textContent ?? '';
    expect(texto.indexOf('Ronda inicial')).toBeLessThan(texto.indexOf('Cierre del lunes'));
  });

  it('crea la actividad en la semana 2 y la agrupa después de la semana 1', async () => {
    let bodyRecibido: unknown = null;

    server.use(
      http.post(`/api/planificaciones/${PLAN_ID}/actividades`, async ({ request }) => {
        bodyRecibido = await request.json();
        return HttpResponse.json(
          {
            data: {
              id: 'act-db-s2',
              semana: 2,
              dia: 'lunes',
              titulo: 'Arranque de la segunda semana',
              descripcion: 'Retomamos lo trabajado',
              orden: 1,
            },
          },
          { status: 201 }
        );
      })
    );

    renderHarness();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText('Ronda inicial')).toBeInTheDocument());

    await abrirFormularioYCompletar(
      user,
      'lunes',
      'Arranque de la segunda semana',
      'Retomamos lo trabajado',
      2
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(bodyRecibido).toEqual({
      dia: 'lunes',
      semana: 2,
      titulo: 'Arranque de la segunda semana',
      descripcion: 'Retomamos lo trabajado',
    });

    const cards = screen.getAllByRole('listitem');
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Actividades de la semana 1, Lunes',
      'Actividades de la semana 2, Lunes',
    ]);
    expect(cards[1].textContent).toContain('Arranque de la segunda semana');
  });

  it('muestra el error del endpoint y no cierra el formulario', async () => {
    server.use(
      http.post(`/api/planificaciones/${PLAN_ID}/actividades`, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
          { status: 500 }
        )
      )
    );

    renderHarness();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText('Ronda inicial')).toBeInTheDocument());

    await abrirFormularioYCompletar(user, 'martes', 'Actividad nueva', 'Descripción nueva');

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByLabelText('Actividades del Martes')).not.toBeInTheDocument();
  });

  it('permite reintentar y persistir después de un error del endpoint', async () => {
    let llamadas = 0;
    server.use(
      http.post(`/api/planificaciones/${PLAN_ID}/actividades`, () => {
        llamadas += 1;
        if (llamadas === 1) {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
            { status: 500 }
          );
        }
        return HttpResponse.json(
          {
            data: {
              id: 'act-db-3',
              semana: 1,
              dia: 'martes',
              titulo: 'Actividad nueva',
              descripcion: 'Descripción nueva',
              orden: 1,
            },
          },
          { status: 201 }
        );
      })
    );

    renderHarness();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText('Ronda inicial')).toBeInTheDocument());

    await abrirFormularioYCompletar(user, 'martes', 'Actividad nueva', 'Descripción nueva');
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Actividades del Martes')).toBeInTheDocument();
    expect(llamadas).toBe(2);
  });
});

/**
 * Integración: botón de tacho + confirmación + PlanContext + endpoint
 * DELETE /api/planificaciones/:id/actividades/:actividadId (mockeado con MSW).
 */
describe('ActividadesTab + PlanContext: eliminar actividad (integración con MSW)', () => {
  const PLAN_DOS_ACTIVIDADES = {
    ...MOCK_PLAN,
    actividades: [
      { id: 'act-1', semana: 1, dia: 'lunes', titulo: 'Ronda inicial', descripcion: 'Presentación', orden: 1 },
      { id: 'act-2', semana: 1, dia: 'martes', titulo: 'Pintura libre', descripcion: 'Témperas', orden: 1 },
    ],
  };

  beforeEach(() => {
    localStorage.setItem('token', 'token-de-prueba');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('borra la actividad end-to-end: llama al endpoint y la quita del preview', async () => {
    let urlLlamada: string | null = null;
    let metodoLlamado: string | null = null;
    let authRecibido: string | null = null;

    server.use(
      http.get(`/api/planificaciones/${PLAN_ID}`, () =>
        HttpResponse.json({ data: PLAN_DOS_ACTIVIDADES })
      ),
      http.delete(
        `/api/planificaciones/${PLAN_ID}/actividades/:actividadId`,
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

    await waitFor(() => expect(screen.getByText('Ronda inicial')).toBeInTheDocument());
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    await user.click(
      screen.getByRole('button', { name: 'Eliminar actividad: Pintura libre' })
    );
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(metodoLlamado).toBe('DELETE');
    expect(urlLlamada).toBe(`/api/planificaciones/${PLAN_ID}/actividades/act-2`);
    expect(authRecibido).toBe('Bearer token-de-prueba');

    // La actividad desapareció y la tarjeta del martes ya no se renderiza
    expect(screen.queryByText('Pintura libre')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Actividades del Martes')).not.toBeInTheDocument();
    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveAttribute('aria-label', 'Actividades del Lunes');
  });

  it('muestra el estado vacío cuando se borra la última actividad', async () => {
    server.use(
      http.get(`/api/planificaciones/${PLAN_ID}`, () => HttpResponse.json({ data: MOCK_PLAN })),
      http.delete(`/api/planificaciones/${PLAN_ID}/actividades/:actividadId`, () =>
        HttpResponse.json({ data: { success: true } })
      )
    );

    renderHarness();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText('Ronda inicial')).toBeInTheDocument());

    await user.click(
      screen.getByRole('button', { name: 'Eliminar actividad: Ronda inicial' })
    );
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(
      await screen.findByText('No hay actividades disponibles para esta planificación.')
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('muestra el error del endpoint, no borra nada y permite reintentar', async () => {
    let llamadas = 0;
    server.use(
      http.get(`/api/planificaciones/${PLAN_ID}`, () =>
        HttpResponse.json({ data: PLAN_DOS_ACTIVIDADES })
      ),
      http.delete(`/api/planificaciones/${PLAN_ID}/actividades/:actividadId`, () => {
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

    await waitFor(() => expect(screen.getByText('Ronda inicial')).toBeInTheDocument());

    await user.click(
      screen.getByRole('button', { name: 'Eliminar actividad: Pintura libre' })
    );
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Pintura libre')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByText('Pintura libre')).not.toBeInTheDocument();
    expect(llamadas).toBe(2);
  });
});
