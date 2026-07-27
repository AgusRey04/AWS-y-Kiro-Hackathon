import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import HistoryPage from './HistoryPage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockPlans = [
  {
    id: 'plan-1',
    titulo: 'Explorando el otoño',
    descripcion: 'Actividades para trabajar las estaciones del año con sala de 4...',
    fechaInicio: '2025-06-02',
    fechaFin: '2025-06-06',
    categoria: 'recientes',
    imagenUrl: null,
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'plan-2',
    titulo: 'Día de la Bandera',
    descripcion: 'Planificación para trabajar el Día de la Bandera con actividades...',
    fechaInicio: '2025-06-16',
    fechaFin: '2025-06-20',
    categoria: 'archivado',
    imagenUrl: null,
    createdAt: '2025-06-15T08:00:00Z',
  },
  {
    id: 'plan-3',
    titulo: 'Proyecto huerta escolar',
    descripcion: 'Proyecto de investigación sobre plantas y crecimiento para sala de 5',
    fechaInicio: '2025-05-05',
    fechaFin: '2025-05-09',
    categoria: 'proyectos',
    imagenUrl: null,
    createdAt: '2025-05-04T14:00:00Z',
  },
];

function renderHistoryPage() {
  return render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>
  );
}

describe('HistoryPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Default handler: return mock plans
    server.use(
      http.get('/api/planificaciones', () => {
        return HttpResponse.json({ data: mockPlans });
      })
    );
  });

  it('muestra estado de carga', () => {
    // Use a handler that delays response
    server.use(
      http.get('/api/planificaciones', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ data: [] });
      })
    );

    renderHistoryPage();
    expect(screen.getByText('Cargando planificaciones...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('muestra estado vacío con mensaje descriptivo y botón de navegación', async () => {
    server.use(
      http.get('/api/planificaciones', () => {
        return HttpResponse.json({ data: [] });
      })
    );

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('No hay planificaciones aún')).toBeInTheDocument();
    });

    expect(screen.getByText(/Todavía no creaste ninguna planificación/)).toBeInTheDocument();

    const ctaButton = screen.getByRole('button', { name: /Crear mi primera planificación/i });
    expect(ctaButton).toBeInTheDocument();

    fireEvent.click(ctaButton);
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('muestra cards con contenido correcto (título, descripción, fecha, botones)', async () => {
    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('Explorando el otoño')).toBeInTheDocument();
    });

    // Titles
    expect(screen.getByText('Día de la Bandera')).toBeInTheDocument();
    expect(screen.getByText('Proyecto huerta escolar')).toBeInTheDocument();

    // Descriptions (truncated)
    expect(screen.getByText(/Actividades para trabajar las estaciones/)).toBeInTheDocument();

    // Date badge
    expect(screen.getByText('1 Jun 2025')).toBeInTheDocument();

    // Category chips (inside cards)
    expect(screen.getByText('Reciente')).toBeInTheDocument();
    expect(screen.getAllByText('Archivado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Proyecto')).toBeInTheDocument();

    // Action buttons (3 cards × 2 buttons: Ver + Archivar/Desarchivar)
    const verButtons = screen.getAllByRole('button', { name: 'Ver' });
    expect(verButtons).toHaveLength(3);
    // 2 cards show "Archivar", 1 card (archivado) shows "Desarchivar"
    const archivarButtons = screen.getAllByRole('button', { name: 'Archivar' });
    const desarchivarButtons = screen.getAllByRole('button', { name: 'Desarchivar' });
    expect(archivarButtons.length + desarchivarButtons.length).toBe(3);
  });

  it('los filter chips funcionan correctamente', async () => {
    server.use(
      http.get('/api/planificaciones', ({ request }) => {
        const url = new URL(request.url);
        const filtro = url.searchParams.get('filtro');

        if (filtro === 'archivado') {
          return HttpResponse.json({
            data: [mockPlans[1]],
          });
        }

        return HttpResponse.json({ data: mockPlans });
      })
    );

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('Explorando el otoño')).toBeInTheDocument();
    });

    // Click Archivados filter
    const archivadoChip = screen.getByRole('button', { name: 'Archivados' });
    fireEvent.click(archivadoChip);

    await waitFor(() => {
      expect(screen.getByText('Día de la Bandera')).toBeInTheDocument();
    });

    // Other plans should not be visible
    expect(screen.queryByText('Explorando el otoño')).not.toBeInTheDocument();
    expect(screen.queryByText('Proyecto huerta escolar')).not.toBeInTheDocument();

    // Filter chip should show active state
    expect(archivadoChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('el botón "Ver" navega a /preview/:id', async () => {
    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('Explorando el otoño')).toBeInTheDocument();
    });

    const verButtons = screen.getAllByRole('button', { name: 'Ver' });
    fireEvent.click(verButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/preview/plan-1');
  });

  it('el botón "Archivar" llama al endpoint de archivado', async () => {
    let archiveCalled = false;
    server.use(
      http.patch('/api/planificaciones/:id/archivar', () => {
        archiveCalled = true;
        return HttpResponse.json({ data: { success: true } });
      })
    );

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('Explorando el otoño')).toBeInTheDocument();
    });

    const archivarButtons = screen.getAllByRole('button', { name: 'Archivar' });
    fireEvent.click(archivarButtons[0]);

    await waitFor(() => {
      expect(archiveCalled).toBe(true);
    });
  });

  it('muestra error y botón reintentar cuando la API falla', async () => {
    server.use(
      http.get('/api/planificaciones', () => {
        return HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Error del servidor' },
          { status: 500 }
        );
      })
    );

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText(/No pudimos cargar tus planificaciones/)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('muestra el header con título y subtítulo', async () => {
    renderHistoryPage();

    expect(screen.getByRole('heading', { name: 'Mis Planificaciones' })).toBeInTheDocument();
    expect(screen.getByText(/Revisá tus actividades pasadas/)).toBeInTheDocument();
  });

  it('deseleccionar un filtro activo vuelve a mostrar todos los planes', async () => {
    let callCount = 0;
    server.use(
      http.get('/api/planificaciones', ({ request }) => {
        callCount++;
        const url = new URL(request.url);
        const filtro = url.searchParams.get('filtro');

        if (filtro === 'recientes') {
          return HttpResponse.json({ data: [mockPlans[0]] });
        }
        return HttpResponse.json({ data: mockPlans });
      })
    );

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('Explorando el otoño')).toBeInTheDocument();
    });

    // Activate Recientes filter
    const recientesChip = screen.getByRole('button', { name: 'Recientes' });
    fireEvent.click(recientesChip);

    await waitFor(() => {
      expect(screen.getByText('Explorando el otoño')).toBeInTheDocument();
    });

    // Deactivate filter
    fireEvent.click(recientesChip);

    await waitFor(() => {
      expect(screen.getByText('Explorando el otoño')).toBeInTheDocument();
    });

    expect(callCount).toBeGreaterThanOrEqual(3);
  });
});
