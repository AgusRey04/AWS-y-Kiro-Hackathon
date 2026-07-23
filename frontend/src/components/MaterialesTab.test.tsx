import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MaterialesTab from './MaterialesTab';
import type { Material } from '../types';

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

const mockMateriales: Material[] = [
  { id: '1', nombre: 'Hojas secas', icono: '🍂', orden: 1 },
  { id: '2', nombre: 'Témperas', icono: '🎨', orden: 2 },
  { id: '3', nombre: 'Cartulina', icono: '📄', orden: 3 },
];

describe('MaterialesTab', () => {
  it('muestra empty state cuando no hay materiales', () => {
    render(<MaterialesTab materiales={[]} />);
    expect(screen.getByText('No hay materiales disponibles para esta planificación.')).toBeInTheDocument();
  });

  it('muestra la lista de materiales con icono y nombre', () => {
    render(<MaterialesTab materiales={mockMateriales} />);
    expect(screen.getByText('🍂')).toBeInTheDocument();
    expect(screen.getByText('Hojas secas')).toBeInTheDocument();
    expect(screen.getByText('🎨')).toBeInTheDocument();
    expect(screen.getByText('Témperas')).toBeInTheDocument();
  });

  it('ordena materiales por campo orden', () => {
    const desordenados: Material[] = [
      { id: '3', nombre: 'Cartulina', icono: '📄', orden: 3 },
      { id: '1', nombre: 'Hojas secas', icono: '🍂', orden: 1 },
      { id: '2', nombre: 'Témperas', icono: '🎨', orden: 2 },
    ];
    render(<MaterialesTab materiales={desordenados} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Hojas secas');
    expect(items[1]).toHaveTextContent('Témperas');
    expect(items[2]).toHaveTextContent('Cartulina');
  });

  it('tiene role list para accesibilidad', () => {
    render(<MaterialesTab materiales={mockMateriales} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('muestra botón Agregar item personalizado cuando hay planificacionId', () => {
    render(<MaterialesTab materiales={mockMateriales} planificacionId="plan-1" />);
    expect(screen.getByText('+ Agregar item personalizado')).toBeInTheDocument();
  });
});
