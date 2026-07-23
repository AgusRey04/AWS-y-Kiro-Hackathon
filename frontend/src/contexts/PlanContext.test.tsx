import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, it, expect } from 'vitest';
import { PlanProvider, usePlan } from './PlanContext';
import { server } from '../test/mocks/server';

// Helper component that exposes plan context to tests
function TestConsumer() {
  const { planificacion, isLoading, error, crear } = usePlan();

  return (
    <div>
      <button onClick={() => crear('Mi consigna de prueba')}>Crear</button>
      {isLoading && <p>Loading...</p>}
      {error && <p role="alert">{error}</p>}
      {planificacion && <p>Plan: {planificacion.titulo}</p>}
    </div>
  );
}

function renderWithRouter(initialRoute = '/home') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <PlanProvider>
        <Routes>
          <Route path="/home" element={<TestConsumer />} />
          <Route path="/preview/:id" element={<p>Preview Page</p>} />
        </Routes>
      </PlanProvider>
    </MemoryRouter>
  );
}

const MOCK_PLANIFICACION = {
  id: 'plan-123',
  titulo: 'Semana de los animales',
  consignaOriginal: 'Mi consigna de prueba',
  fechaInicio: '2024-06-10',
  fechaFin: '2024-06-14',
  objetivos: ['Conocer animales', 'Explorar hábitats'],
  areaCurricular: 'Ambiente Natural',
  ambitoExperiencia: 'Descubrimiento del entorno',
  fundamentacion: 'Fundamentación de la planificación.',
  categoria: 'recientes' as const,
  actividades: [],
  materiales: [],
  adaptaciones: [],
  createdAt: '2024-06-09T10:00:00Z',
};

describe('PlanContext', () => {
  it('crear() sets isLoading to true during API call', async () => {
    server.use(
      http.post('/api/planificaciones', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ data: { planificacion: MOCK_PLANIFICACION } });
      })
    );

    renderWithRouter();
    const user = userEvent.setup();

    await user.click(screen.getByText('Crear'));

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('crear() navigates to /preview/:id on success', async () => {
    server.use(
      http.post('/api/planificaciones', () => {
        return HttpResponse.json({ data: { planificacion: MOCK_PLANIFICACION } });
      })
    );

    renderWithRouter();
    const user = userEvent.setup();

    await user.click(screen.getByText('Crear'));

    await waitFor(() => {
      expect(screen.getByText('Preview Page')).toBeInTheDocument();
    });
  });

  it('crear() sets error message on API failure', async () => {
    server.use(
      http.post('/api/planificaciones', () => {
        return HttpResponse.json(
          { code: 'AI_GENERATION_FAILED', message: 'No pudimos generar tu planificación.' },
          { status: 502 }
        );
      })
    );

    renderWithRouter();
    const user = userEvent.setup();

    await user.click(screen.getByText('Crear'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No pudimos generar tu planificación.');
    });
  });

  it('crear() handles network errors gracefully', async () => {
    server.use(
      http.post('/api/planificaciones', () => {
        return HttpResponse.error();
      })
    );

    renderWithRouter();
    const user = userEvent.setup();

    await user.click(screen.getByText('Crear'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('crear() sends consigna in request body', async () => {
    let receivedBody: unknown = null;

    server.use(
      http.post('/api/planificaciones', async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ data: { planificacion: MOCK_PLANIFICACION } });
      })
    );

    renderWithRouter();
    const user = userEvent.setup();

    await user.click(screen.getByText('Crear'));

    await waitFor(() => {
      expect(receivedBody).toEqual({ consigna: 'Mi consigna de prueba' });
    });
  });
});
