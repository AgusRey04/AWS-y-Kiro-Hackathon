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
    categoria: 'efemerides',
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

    // Category chips
    expect(screen.getByText('Reciente')).toBeInTheDocument();
    expect(screen.getByText('Efeméride')).toBeInTheDocument();
    expect(screen.getByText('Proyecto')).toBeInTheDocument();

    // Action buttons (3 cards × 2 buttons)
    const verButtons = screen.getAllByRole('button', { name: 'Ver' });
    const reImprimirButtons = screen.getAllByRole('button', { name: 'Re-Imprimir' });
    expect(verButtons).toHaveLength(3);
    expect(reImprimirButtons).toHaveLength(3);
  });

  it('los filter chips funcionan correctamente', async () => {
    server.use(
      http.get('/api/planificaciones', ({ request }) => {
        const url = new URL(request.url);
        const filtro = url.searchParams.get('filtro');

        if (filtro === 'efemerides') {
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

    // Click Efemérides filter
    const efemeridesChip = screen.getByRole('button', { name: 'Efemérides' });
    fireEvent.click(efemeridesChip);

    await waitFor(() => {
      expect(screen.getByText('Día de la Bandera')).toBeInTheDocument();
    });

    // Other plans should not be visible
    expect(screen.queryByText('Explorando el otoño')).not.toBeInTheDocument();
    expect(screen.queryByText('Proyecto huerta escolar')).not.toBeInTheDocument();

    // Filter chip should show active state
    expect(efemeridesChip).toHaveAttribute('aria-pressed', 'true');
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

  it('el botón "Re-Imprimir" muestra alerta de funcionalidad no disponible', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('Explorando el otoño')).toBeInTheDocument();
    });

    const reImprimirButtons = screen.getAllByRole('button', { name: 'Re-Imprimir' });
    fireEvent.click(reImprimirButtons[0]);

    expect(alertMock).toHaveBeenCalledWith(
      'La generación de PDF aún no está disponible. Esta funcionalidad se implementará próximamente.'
    );

    alertMock.mockRestore();
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

    expect(screen.getByText('Historial')).toBeInTheDocument();
    expect(screen.getByText('Tus planificaciones anteriores')).toBeInTheDocument();
  });

  it('deseleccionar un filtro activo vuelve a mostrar todos los planes', async () => {
    let callCount = 0;
    server.use(
      http.get('/api/planificaciones', ({ request }) => {
        callCount++;
        const url = new URL(request.url);
        const filtro = url.searchParams.get('filtro');

        if (filtro === 'proyectos') {
          return HttpResponse.json({ data: [mockPlans[2]] });
        }
        return HttpResponse.json({ data: mockPlans });
      })
    );

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('Explorando el otoño')).toBeInTheDocument();
    });

    // Activate Proyectos filter
    const proyectosChip = screen.getByRole('button', { name: 'Proyectos' });
    fireEvent.click(proyectosChip);

    await waitFor(() => {
      expect(screen.getByText('Proyecto huerta escolar')).toBeInTheDocument();
    });

    // Deactivate filter
    fireEvent.click(proyectosChip);

    await waitFor(() => {
      expect(screen.getByText('Explorando el otoño')).toBeInTheDocument();
    });

    expect(callCount).toBeGreaterThanOrEqual(3);
  });
});
