import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActividadesTab from './ActividadesTab';
import type { Actividad } from '../types';

const mockAddActividad = vi.fn().mockResolvedValue(undefined);

// Mock PlanContext
vi.mock('../contexts/PlanContext', () => ({
  usePlan: () => ({
    planificacion: null,
    isLoading: false,
    error: null,
    crear: vi.fn(),
    updateField: vi.fn().mockResolvedValue(undefined),
    addActividad: mockAddActividad,
    addMaterial: vi.fn(),
    addAdaptacion: vi.fn(),
  }),
}));

const mockActividades: Actividad[] = [
  { id: '1', dia: 'lunes', titulo: 'Paseo por el patio', descripcion: 'Observar hojas', orden: 1 },
  { id: '2', dia: 'martes', titulo: 'Pintura libre', descripcion: 'Usar témperas', orden: 1 },
  { id: '3', dia: 'miercoles', titulo: 'Ronda de cuentos', descripcion: 'Leer en grupo', orden: 1 },
  { id: '4', dia: 'jueves', titulo: 'Juego dramático', descripcion: 'Simular roles', orden: 1 },
  { id: '5', dia: 'viernes', titulo: 'Cierre semanal', descripcion: 'Reflexión grupal', orden: 1 },
];

describe('ActividadesTab', () => {
  beforeEach(() => {
    mockAddActividad.mockClear();
    mockAddActividad.mockResolvedValue(undefined);
  });

  it('muestra empty state cuando no hay actividades', () => {
    render(<ActividadesTab actividades={[]} />);
    expect(screen.getByText('No hay actividades disponibles para esta planificación.')).toBeInTheDocument();
  });

  it('agrupa actividades por día en orden lunes a viernes', () => {
    render(<ActividadesTab actividades={mockActividades} />);

    const dayCards = screen.getAllByRole('listitem');
    expect(dayCards[0]).toHaveAttribute('aria-label', 'Actividades del Lunes');
    expect(dayCards[1]).toHaveAttribute('aria-label', 'Actividades del Martes');
    expect(dayCards[2]).toHaveAttribute('aria-label', 'Actividades del Miércoles');
    expect(dayCards[3]).toHaveAttribute('aria-label', 'Actividades del Jueves');
    expect(dayCards[4]).toHaveAttribute('aria-label', 'Actividades del Viernes');
  });

  it('muestra título y descripción de cada actividad', () => {
    render(<ActividadesTab actividades={mockActividades} />);
    expect(screen.getByText('Paseo por el patio')).toBeInTheDocument();
    expect(screen.getByText('Observar hojas')).toBeInTheDocument();
  });

  it('aplica borde izquierdo con color correspondiente al día', () => {
    render(<ActividadesTab actividades={[mockActividades[0]]} />);
    const card = screen.getByRole('listitem');
    expect(card).toHaveStyle({ borderLeftColor: '#4A7856' });
  });

  it('no muestra días sin actividades', () => {
    const soloLunes = [mockActividades[0]];
    render(<ActividadesTab actividades={soloLunes} />);
    const dayCards = screen.getAllByRole('listitem');
    expect(dayCards).toHaveLength(1);
  });

  it('ordena múltiples actividades del mismo día por orden', () => {
    const actividades: Actividad[] = [
      { id: '2', dia: 'lunes', titulo: 'Segunda', descripcion: 'Desc', orden: 2 },
      { id: '1', dia: 'lunes', titulo: 'Primera', descripcion: 'Desc', orden: 1 },
    ];
    render(<ActividadesTab actividades={actividades} />);
    // Without planificacionId, items render as plain <p> with font-semibold
    const card = screen.getByRole('listitem');
    const titles = card.querySelectorAll('.font-semibold');
    expect(titles[0].textContent).toBe('Primera');
    expect(titles[1].textContent).toBe('Segunda');
  });

  it('muestra botón Agregar actividad cuando hay planificacionId', () => {
    render(<ActividadesTab actividades={mockActividades} planificacionId="plan-1" />);
    const buttons = screen.getAllByText('+ Agregar actividad');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('muestra el botón Agregar actividad UNA SOLA VEZ aunque haya varios días', () => {
    render(<ActividadesTab actividades={mockActividades} planificacionId="plan-1" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getAllByRole('button', { name: 'Agregar actividad' })).toHaveLength(1);
  });

  it('no muestra botones de agregar dentro de las DayCards', () => {
    render(<ActividadesTab actividades={mockActividades} planificacionId="plan-1" />);
    screen.getAllByRole('listitem').forEach((card) => {
      expect(card.querySelector('button')).toBeNull();
    });
  });

  it('no muestra el botón Agregar actividad en modo lectura (sin planificacionId)', () => {
    render(<ActividadesTab actividades={mockActividades} />);
    expect(screen.queryByRole('button', { name: 'Agregar actividad' })).not.toBeInTheDocument();
  });

  it('muestra el botón Agregar actividad también en el empty state', () => {
    render(<ActividadesTab actividades={[]} planificacionId="plan-1" />);
    expect(screen.getByRole('button', { name: 'Agregar actividad' })).toBeInTheDocument();
  });

  it('abre el formulario al presionar el botón y lo cierra al cancelar', async () => {
    const user = userEvent.setup();
    render(<ActividadesTab actividades={mockActividades} planificacionId="plan-1" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agregar actividad' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockAddActividad).not.toHaveBeenCalled();
  });

  it('llama a addActividad con día, título y descripción y cierra el formulario', async () => {
    const user = userEvent.setup();
    render(<ActividadesTab actividades={mockActividades} planificacionId="plan-1" />);

    await user.click(screen.getByRole('button', { name: 'Agregar actividad' }));
    await user.selectOptions(screen.getByLabelText('Día'), 'viernes');
    await user.type(screen.getByLabelText('Título'), 'Kermesse del Movimiento');
    await user.type(screen.getByLabelText('Descripción'), 'Postas lúdicas con juegos motores');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(mockAddActividad).toHaveBeenCalledWith({
        dia: 'viernes',
        titulo: 'Kermesse del Movimiento',
        descripcion: 'Postas lúdicas con juegos motores',
      })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('mantiene el formulario abierto cuando addActividad falla', async () => {
    mockAddActividad.mockRejectedValueOnce(new Error('Planificación no encontrada.'));
    const user = userEvent.setup();
    render(<ActividadesTab actividades={mockActividades} planificacionId="plan-1" />);

    await user.click(screen.getByRole('button', { name: 'Agregar actividad' }));
    await user.selectOptions(screen.getByLabelText('Día'), 'lunes');
    await user.type(screen.getByLabelText('Título'), 'Nueva');
    await user.type(screen.getByLabelText('Descripción'), 'Desc');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Planificación no encontrada.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
