import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FundamentacionTab from './FundamentacionTab';

// Mock PlanContext
vi.mock('../contexts/PlanContext', () => ({
  usePlan: () => ({
    planificacion: null,
    isLoading: false,
    error: null,
    crear: vi.fn(),
    updateField: vi.fn().mockResolvedValue(undefined),
    addActividad: vi.fn(),
    addMaterial: vi.fn(),
    addAdaptacion: vi.fn(),
  }),
}));

describe('FundamentacionTab', () => {
  it('muestra empty state cuando no hay fundamentación', () => {
    render(<FundamentacionTab fundamentacion="" />);
    expect(screen.getByText('No hay fundamentación disponible para esta planificación.')).toBeInTheDocument();
  });

  it('muestra el texto de fundamentación pedagógica', () => {
    const texto = 'Esta planificación se enmarca en el enfoque constructivista.';
    render(<FundamentacionTab fundamentacion={texto} />);
    expect(screen.getByText(texto)).toBeInTheDocument();
  });

  it('muestra el título Marco Teórico Pedagógico', () => {
    render(<FundamentacionTab fundamentacion="Contenido de prueba" />);
    expect(screen.getByText('Marco Teórico Pedagógico')).toBeInTheDocument();
  });

  it('tiene aria-label para accesibilidad', () => {
    render(<FundamentacionTab fundamentacion="Texto" />);
    expect(screen.getByLabelText('Fundamentación pedagógica')).toBeInTheDocument();
  });

  it('preserva saltos de línea en el texto cuando no está en modo edición', () => {
    const texto = 'Primera línea\nSegunda línea';
    render(<FundamentacionTab fundamentacion={texto} />);
    const container = screen.getByText(/Primera línea/);
    expect(container).toHaveClass('whitespace-pre-line');
  });
});
