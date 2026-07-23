import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActividadesTab from './ActividadesTab';
import type { Actividad } from '../types';

const mockActividades: Actividad[] = [
  { id: '1', dia: 'lunes', titulo: 'Paseo por el patio', descripcion: 'Observar hojas', orden: 1 },
  { id: '2', dia: 'martes', titulo: 'Pintura libre', descripcion: 'Usar témperas', orden: 1 },
  { id: '3', dia: 'miercoles', titulo: 'Ronda de cuentos', descripcion: 'Leer en grupo', orden: 1 },
  { id: '4', dia: 'jueves', titulo: 'Juego dramático', descripcion: 'Simular roles', orden: 1 },
  { id: '5', dia: 'viernes', titulo: 'Cierre semanal', descripcion: 'Reflexión grupal', orden: 1 },
];

describe('ActividadesTab', () => {
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
    const card = screen.getByRole('listitem');
    const titles = card.querySelectorAll('.font-semibold');
    expect(titles[0].textContent).toBe('Primera');
    expect(titles[1].textContent).toBe('Segunda');
  });
});
