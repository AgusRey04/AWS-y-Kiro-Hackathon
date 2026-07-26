import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MaterialesTab from './MaterialesTab';
import type { Material } from '../types';

const mockAddMaterial = vi.fn().mockResolvedValue(undefined);
const mockDeleteMaterial = vi.fn().mockResolvedValue(undefined);

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
    deleteMaterial: mockDeleteMaterial,
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
    mockDeleteMaterial.mockClear();
    mockDeleteMaterial.mockResolvedValue(undefined);
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

describe('MaterialesTab - eliminar material', () => {
  beforeEach(() => {
    mockDeleteMaterial.mockClear();
    mockDeleteMaterial.mockResolvedValue(undefined);
  });

  it('muestra un botón de eliminar por material con aria-label que incluye el nombre', () => {
    render(<MaterialesTab materiales={mockMateriales} planificacionId="plan-1" />);

    const botones = screen.getAllByRole('button', { name: /^Eliminar material/ });
    expect(botones).toHaveLength(mockMateriales.length);

    expect(
      screen.getByRole('button', { name: 'Eliminar material: Hojas secas' })
    ).toBeInTheDocument();
  });

  it('usa "material sin nombre" en el aria-label cuando el nombre está vacío', () => {
    const sinNombre: Material[] = [
      { id: 'x', nombre: '   ', icono: '❓', orden: 1 },
    ];
    render(<MaterialesTab materiales={sinNombre} planificacionId="plan-1" />);

    expect(
      screen.getByRole('button', { name: 'Eliminar material sin nombre' })
    ).toBeInTheDocument();
  });

  it('no muestra botones de eliminar en modo lectura (sin planificacionId)', () => {
    render(<MaterialesTab materiales={mockMateriales} />);
    expect(screen.queryByRole('button', { name: /^Eliminar material/ })).not.toBeInTheDocument();
  });

  it('el botón de eliminar tiene un área táctil de al menos 44x44 con foco visible', () => {
    render(<MaterialesTab materiales={[mockMateriales[0]]} planificacionId="plan-1" />);
    const boton = screen.getByRole('button', { name: /^Eliminar material/ });
    expect(boton.className).toContain('min-w-[44px]');
    expect(boton.className).toContain('min-h-[44px]');
    expect(boton.className).toContain('focus-visible:ring-2');
    expect(boton.className).toContain('focus-visible:ring-red-500');
    expect(boton.className).toContain('focus-visible:ring-offset-2');
  });

  it('abre un diálogo de confirmación accesible y enfoca Cancelar', async () => {
    const user = userEvent.setup();
    render(<MaterialesTab materiales={mockMateriales} planificacionId="plan-1" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Eliminar material: Hojas secas' })
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.textContent).toContain('Hojas secas');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(mockDeleteMaterial).not.toHaveBeenCalled();
  });

  it('cancelar cierra el diálogo y no borra', async () => {
    const user = userEvent.setup();
    render(<MaterialesTab materiales={mockMateriales} planificacionId="plan-1" />);

    await user.click(
      screen.getByRole('button', { name: 'Eliminar material: Hojas secas' })
    );
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockDeleteMaterial).not.toHaveBeenCalled();
  });

  it('Escape cierra el diálogo y no borra', async () => {
    const user = userEvent.setup();
    render(<MaterialesTab materiales={mockMateriales} planificacionId="plan-1" />);

    await user.click(
      screen.getByRole('button', { name: 'Eliminar material: Témperas' })
    );
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockDeleteMaterial).not.toHaveBeenCalled();
  });

  it('confirmar llama a deleteMaterial con el id del material y cierra el diálogo', async () => {
    const user = userEvent.setup();
    render(<MaterialesTab materiales={mockMateriales} planificacionId="plan-1" />);

    await user.click(
      screen.getByRole('button', { name: 'Eliminar material: Cartulina' })
    );
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(mockDeleteMaterial).toHaveBeenCalledWith('3'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('muestra una alerta con opción de reintentar cuando el borrado falla', async () => {
    mockDeleteMaterial.mockRejectedValueOnce(new Error('Material no encontrado.'));
    const user = userEvent.setup();
    render(<MaterialesTab materiales={mockMateriales} planificacionId="plan-1" />);

    await user.click(
      screen.getByRole('button', { name: 'Eliminar material: Témperas' })
    );
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Material no encontrado.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Reintento exitoso
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(mockDeleteMaterial).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('muestra el estado vacío cuando se borra el último material de la lista', async () => {
    const user = userEvent.setup();
    const unico: Material[] = [{ id: '1', nombre: 'Hojas secas', icono: '🍂', orden: 1 }];
    const { rerender } = render(<MaterialesTab materiales={unico} planificacionId="plan-1" />);

    await user.click(
      screen.getByRole('button', { name: 'Eliminar material: Hojas secas' })
    );
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(mockDeleteMaterial).toHaveBeenCalledWith('1'));

    // El padre (PlanContext) filtra el material del estado; se simula re-render con lista vacía
    rerender(<MaterialesTab materiales={[]} planificacionId="plan-1" />);

    expect(
      screen.getByText('No hay materiales disponibles para esta planificación.')
    ).toBeInTheDocument();
  });
});
