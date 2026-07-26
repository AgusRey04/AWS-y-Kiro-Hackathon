import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PreviewPage from './PreviewPage';

// Mock the PlanContext
const mockUsePlan = vi.fn();
vi.mock('../contexts/PlanContext', () => ({
  usePlan: () => mockUsePlan(),
}));

// Mock react-router-dom useParams
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'test-id' }),
  useNavigate: () => mockNavigate,
}));

const mockPlanificacion = {
  id: 'test-id',
  titulo: 'Explorando el otoño',
  consignaOriginal: 'Trabajemos el otoño',
  fechaInicio: '2025-06-02',
  fechaFin: '2025-06-06',
  objetivos: ['Explorar texturas', 'Reconocer estaciones'],
  areaCurricular: 'Ambiente Natural',
  ambitoExperiencia: 'Experiencias para la construcción de la identidad',
  fundamentacion: 'Marco teórico de la planificación.',
  categoria: 'recientes' as const,
  actividades: [
    { id: '1', semana: 1, dia: 'lunes' as const, titulo: 'Paseo por el patio', descripcion: 'Desc', orden: 1 },
  ],
  materiales: [
    { id: '1', nombre: 'Hojas secas', icono: '🍂', orden: 1 },
  ],
  adaptaciones: [
    { id: '1', categoria: 'Visual', titulo: 'Materiales sensoriales', descripcion: 'Desc', orden: 1 },
  ],
  createdAt: '2025-06-01T00:00:00Z',
};

describe('PreviewPage', () => {
  it('muestra estado de carga', () => {
    mockUsePlan.mockReturnValue({ planificacion: null, isLoading: true, error: null, loadById: vi.fn(), updateField: vi.fn(), addActividad: vi.fn(), deleteActividad: vi.fn(), addMaterial: vi.fn(), deleteMaterial: vi.fn(), addAdaptacion: vi.fn() });
    render(<PreviewPage />);
    expect(screen.getByText('Cargando planificación...')).toBeInTheDocument();
  });

  it('muestra estado de error', () => {
    mockUsePlan.mockReturnValue({ planificacion: null, isLoading: false, error: 'Algo salió mal', loadById: vi.fn(), updateField: vi.fn(), addActividad: vi.fn(), deleteActividad: vi.fn(), addMaterial: vi.fn(), deleteMaterial: vi.fn(), addAdaptacion: vi.fn() });
    render(<PreviewPage />);
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay planificación', () => {
    mockUsePlan.mockReturnValue({ planificacion: null, isLoading: false, error: null, loadById: vi.fn(), updateField: vi.fn(), addActividad: vi.fn(), deleteActividad: vi.fn(), addMaterial: vi.fn(), deleteMaterial: vi.fn(), addAdaptacion: vi.fn() });
    render(<PreviewPage />);
    expect(screen.getByText('No hay planificación disponible.')).toBeInTheDocument();
  });

  it('muestra el header con datos de la planificación', () => {
    mockUsePlan.mockReturnValue({ planificacion: mockPlanificacion, isLoading: false, error: null, loadById: vi.fn(), updateField: vi.fn(), addActividad: vi.fn(), deleteActividad: vi.fn(), addMaterial: vi.fn(), deleteMaterial: vi.fn(), addAdaptacion: vi.fn() });
    render(<PreviewPage />);
    expect(screen.getByText('Explorando el otoño')).toBeInTheDocument();
    expect(screen.getByText('PLANIFICACIÓN SEMANAL · NIVEL INICIAL')).toBeInTheDocument();
    expect(screen.getByText('2 - 6 Jun 2025')).toBeInTheDocument();
    expect(screen.getByText('Ambiente Natural')).toBeInTheDocument();
  });

  it('muestra las 4 pestañas con Actividades como activa por defecto', () => {
    mockUsePlan.mockReturnValue({ planificacion: mockPlanificacion, isLoading: false, error: null, loadById: vi.fn(), updateField: vi.fn(), addActividad: vi.fn(), deleteActividad: vi.fn(), addMaterial: vi.fn(), deleteMaterial: vi.fn(), addAdaptacion: vi.fn() });
    render(<PreviewPage />);

    const actividadesTab = screen.getByRole('tab', { name: 'Actividades' });
    expect(actividadesTab).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByRole('tab', { name: 'Materiales' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Adaptaciones' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Fundamentación' })).toBeInTheDocument();
  });

  it('cambia de pestaña al hacer click', () => {
    mockUsePlan.mockReturnValue({ planificacion: mockPlanificacion, isLoading: false, error: null, loadById: vi.fn(), updateField: vi.fn(), addActividad: vi.fn(), deleteActividad: vi.fn(), addMaterial: vi.fn(), deleteMaterial: vi.fn(), addAdaptacion: vi.fn() });
    render(<PreviewPage />);

    fireEvent.click(screen.getByRole('tab', { name: 'Materiales' }));
    const materialesTab = screen.getByRole('tab', { name: 'Materiales' });
    expect(materialesTab).toHaveAttribute('aria-selected', 'true');
  });

  it('muestra empty state cuando una pestaña no tiene contenido', () => {
    const emptyPlan = {
      ...mockPlanificacion,
      actividades: [],
      materiales: [],
      adaptaciones: [],
      fundamentacion: '',
    };
    mockUsePlan.mockReturnValue({ planificacion: emptyPlan, isLoading: false, error: null, loadById: vi.fn(), updateField: vi.fn(), addActividad: vi.fn(), deleteActividad: vi.fn(), addMaterial: vi.fn(), deleteMaterial: vi.fn(), addAdaptacion: vi.fn() });
    render(<PreviewPage />);

    expect(screen.getByText('No hay actividades disponibles para esta planificación.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Materiales' }));
    expect(screen.getByText('No hay materiales disponibles para esta planificación.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Adaptaciones' }));
    expect(screen.getByText('No hay adaptaciones disponibles para esta planificación.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Fundamentación' }));
    expect(screen.getByText('No hay fundamentación disponible para esta planificación.')).toBeInTheDocument();
  });

  it('llama a loadById cuando el ID de la URL no coincide con la planificación en memoria', () => {
    const mockLoadById = vi.fn();
    mockUsePlan.mockReturnValue({ planificacion: null, isLoading: false, error: null, loadById: mockLoadById, updateField: vi.fn(), addActividad: vi.fn(), deleteActividad: vi.fn(), addMaterial: vi.fn(), deleteMaterial: vi.fn(), addAdaptacion: vi.fn() });
    render(<PreviewPage />);
    expect(mockLoadById).toHaveBeenCalledWith('test-id');
  });

  it('no llama a loadById cuando la planificación en memoria ya tiene el mismo ID', () => {
    const mockLoadById = vi.fn();
    mockUsePlan.mockReturnValue({ planificacion: mockPlanificacion, isLoading: false, error: null, loadById: mockLoadById, updateField: vi.fn(), addActividad: vi.fn(), deleteActividad: vi.fn(), addMaterial: vi.fn(), deleteMaterial: vi.fn(), addAdaptacion: vi.fn() });
    render(<PreviewPage />);
    expect(mockLoadById).not.toHaveBeenCalled();
  });
});
