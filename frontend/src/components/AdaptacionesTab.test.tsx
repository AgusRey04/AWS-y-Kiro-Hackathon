import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdaptacionesTab from './AdaptacionesTab';
import type { Adaptacion } from '../types';

// Mock PlanContext
vi.mock('../contexts/PlanContext', () => ({
  usePlan: () => ({
    planificacion: null,
    isLoading: false,
    error: null,
    crear: vi.fn(),
    updateField: vi.fn().mockResolvedValue(undefined),
    addActividad: vi.fn(),
    deleteActividad: vi.fn(),
    addMaterial: vi.fn(),
    addAdaptacion: vi.fn(),
  }),
}));

const mockAdaptaciones: Adaptacion[] = [
  { id: '1', categoria: 'Visual', titulo: 'Material sensorial', descripcion: 'Usar texturas variadas', orden: 1 },
  { id: '2', categoria: 'Motriz', titulo: 'Actividades adaptadas', descripcion: 'Movimientos simples', orden: 2 },
];

describe('AdaptacionesTab', () => {
  it('muestra empty state cuando no hay adaptaciones', () => {
    render(<AdaptacionesTab adaptaciones={[]} />);
    expect(screen.getByText('No hay adaptaciones disponibles para esta planificación.')).toBeInTheDocument();
  });

  it('muestra categoría, título y descripción de cada adaptación', () => {
    render(<AdaptacionesTab adaptaciones={mockAdaptaciones} />);
    expect(screen.getByText('Visual')).toBeInTheDocument();
    expect(screen.getByText('Material sensorial')).toBeInTheDocument();
    expect(screen.getByText('Usar texturas variadas')).toBeInTheDocument();
  });

  it('aplica fondo lavanda a las cards de adaptaciones', () => {
    render(<AdaptacionesTab adaptaciones={mockAdaptaciones} />);
    const cards = screen.getAllByRole('listitem');
    cards.forEach((card) => {
      expect(card).toHaveClass('bg-[#9B89B3]/15');
    });
  });

  it('ordena adaptaciones por campo orden', () => {
    const desordenadas: Adaptacion[] = [
      { id: '2', categoria: 'Motriz', titulo: 'Segunda', descripcion: 'Desc', orden: 2 },
      { id: '1', categoria: 'Visual', titulo: 'Primera', descripcion: 'Desc', orden: 1 },
    ];
    render(<AdaptacionesTab adaptaciones={desordenadas} />);
    const cards = screen.getAllByRole('listitem');
    expect(cards[0]).toHaveTextContent('Primera');
    expect(cards[1]).toHaveTextContent('Segunda');
  });

  it('tiene role list para accesibilidad', () => {
    render(<AdaptacionesTab adaptaciones={mockAdaptaciones} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
