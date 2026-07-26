import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MaterialesTab from './MaterialesTab';
import type { Material } from '../types';

const mockAddMaterial = vi.fn().mockResolvedValue(undefined);

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
    addMaterial: mockAddMaterial,
    addAdaptacion: vi.fn(),
  }),
}));

const mockMateriales: Material[] = [
  { id: '1', nombre: 'Hojas secas', icono: '🍂', orden: 1 },
  { id: '2', nombre: 'Témperas', icono: '🎨', orden: 2 },
  { id: '3', nombre: 'Cartulina', icono: '📄', orden: 3 },
];

describe('MaterialesTab', () => {
  beforeEach(() => {
    mockAddMaterial.mockClear();
    mockAddMaterial.mockResolvedValue(undefined);
  });

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

  it('no muestra el botón Agregar item personalizado en modo lectura (sin planificacionId)', () => {
    render(<MaterialesTab materiales={mockMateriales} />);
    expect(screen.queryByText('+ Agregar item personalizado')).not.toBeInTheDocument();
  });

  it('muestra el botón Agregar item personalizado también en el empty state', () => {
    render(<MaterialesTab materiales={[]} planificacionId="plan-1" />);
    expect(screen.getByRole('button', { name: 'Agregar item personalizado' })).toBeInTheDocument();
  });

  it('abre el formulario al presionar el botón en vez de llamar directo a addMaterial', async () => {
    const user = userEvent.setup();
    render(<MaterialesTab materiales={mockMateriales} planificacionId="plan-1" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agregar item personalizado' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mockAddMaterial).not.toHaveBeenCalled();
  });

  it('cierra el formulario al cancelar sin llamar a addMaterial', async () => {
    const user = userEvent.setup();
    render(<MaterialesTab materiales={mockMateriales} planificacionId="plan-1" />);

    await user.click(screen.getByRole('button', { name: 'Agregar item personalizado' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockAddMaterial).not.toHaveBeenCalled();
  });

  it('llama a addMaterial con nombre e ícono elegidos y cierra el formulario', async () => {
    const user = userEvent.setup();
    render(<MaterialesTab materiales={mockMateriales} planificacionId="plan-1" />);

    await user.click(screen.getByRole('button', { name: 'Agregar item personalizado' }));
    await user.click(screen.getByRole('radio', { name: 'Hielo' }));
    await user.type(screen.getByLabelText('Nombre'), 'Cubitos de hielo');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(mockAddMaterial).toHaveBeenCalledWith({ nombre: 'Cubitos de hielo', icono: '🧊' })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('mantiene el formulario abierto cuando addMaterial falla', async () => {
    mockAddMaterial.mockRejectedValueOnce(new Error('Planificación no encontrada.'));
    const user = userEvent.setup();
    render(<MaterialesTab materiales={mockMateriales} planificacionId="plan-1" />);

    await user.click(screen.getByRole('button', { name: 'Agregar item personalizado' }));
    await user.type(screen.getByLabelText('Nombre'), 'Nuevo material');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Planificación no encontrada.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
