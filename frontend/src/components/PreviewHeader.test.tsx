import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PreviewHeader, { formatDateRange } from './PreviewHeader';

describe('PreviewHeader', () => {
  const defaultProps = {
    titulo: 'El otoño en sala de 4',
    fechaInicio: '2025-06-02',
    fechaFin: '2025-06-06',
    objetivos: ['Explorar texturas naturales', 'Reconocer cambios estacionales'],
    areaCurricular: 'Ambiente Natural y Social',
  };

  it('muestra el subtítulo institucional', () => {
    render(<PreviewHeader {...defaultProps} />);
    expect(
      screen.getByText('PLANIFICACIÓN SEMANAL · NIVEL INICIAL')
    ).toBeInTheDocument();
  });

  it('muestra el título de la planificación', () => {
    render(<PreviewHeader {...defaultProps} />);
    expect(screen.getByText('El otoño en sala de 4')).toBeInTheDocument();
  });

  it('muestra el rango de fechas formateado', () => {
    render(<PreviewHeader {...defaultProps} />);
    expect(screen.getByText('2 - 6 Jun 2025')).toBeInTheDocument();
  });

  it('muestra el área curricular como chip', () => {
    render(<PreviewHeader {...defaultProps} />);
    expect(screen.getByText('Ambiente Natural y Social')).toBeInTheDocument();
  });

  it('muestra los objetivos como lista', () => {
    render(<PreviewHeader {...defaultProps} />);
    expect(screen.getByText('Explorar texturas naturales')).toBeInTheDocument();
    expect(screen.getByText('Reconocer cambios estacionales')).toBeInTheDocument();
  });

  it('no muestra lista de objetivos si está vacía', () => {
    render(<PreviewHeader {...defaultProps} objetivos={[]} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('formatDateRange', () => {
  it('formatea fechas del mismo mes correctamente', () => {
    expect(formatDateRange('2025-06-02', '2025-06-06')).toBe('2 - 6 Jun 2025');
  });

  it('formatea fechas de meses distintos correctamente', () => {
    expect(formatDateRange('2025-05-28', '2025-06-01')).toBe('28 May - 1 Jun 2025');
  });
});
