import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EditableBlock from './EditableBlock';

describe('EditableBlock', () => {
  const defaultProps = {
    content: 'Contenido de prueba',
    maxLength: 500,
    onSave: vi.fn().mockResolvedValue(undefined),
    type: 'title' as const,
    fieldPath: 'actividades.1.titulo',
    planificacionId: 'plan-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el contenido en modo visualización', () => {
    render(<EditableBlock {...defaultProps} />);
    expect(screen.getByText('Contenido de prueba')).toBeInTheDocument();
  });

  it('muestra icono de lápiz al hacer click/touch', () => {
    render(<EditableBlock {...defaultProps} />);
    const block = screen.getByRole('button');
    fireEvent.click(block);
    expect(screen.getByLabelText('Editar campo')).toBeInTheDocument();
  });

  it('sin pencilSiempreVisible el lápiz permanece oculto hasta interactuar (comportamiento por defecto)', () => {
    render(<EditableBlock {...defaultProps} />);
    expect(screen.queryByLabelText('Editar campo')).not.toBeInTheDocument();
  });

  it('con pencilSiempreVisible el lápiz está visible sin necesidad de click previo', () => {
    render(<EditableBlock {...defaultProps} pencilSiempreVisible />);
    expect(screen.getByLabelText('Editar campo')).toBeInTheDocument();
  });

  it('con pencilSiempreVisible se puede entrar en modo edición haciendo click en el lápiz sin click previo en el bloque', async () => {
    render(<EditableBlock {...defaultProps} pencilSiempreVisible />);

    const pencil = screen.getByLabelText('Editar campo');
    fireEvent.click(pencil);

    const textarea = screen.getByLabelText('Editar title');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Contenido de prueba');
  });

  it('entra en modo edición al hacer click en el lápiz', async () => {
    render(<EditableBlock {...defaultProps} />);
    const block = screen.getByRole('button');
    fireEvent.click(block);

    const pencil = screen.getByLabelText('Editar campo');
    fireEvent.click(pencil);

    const textarea = screen.getByLabelText('Editar title');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Contenido de prueba');
  });

  it('muestra contador de caracteres restantes en modo edición', () => {
    render(<EditableBlock {...defaultProps} />);
    const block = screen.getByRole('button');
    fireEvent.click(block);
    fireEvent.click(screen.getByLabelText('Editar campo'));

    expect(screen.getByText('481 caracteres restantes')).toBeInTheDocument();
  });

  it('impone límite de caracteres', async () => {
    const user = userEvent.setup();
    render(<EditableBlock {...defaultProps} maxLength={25} />);

    const block = screen.getByRole('button');
    fireEvent.click(block);
    fireEvent.click(screen.getByLabelText('Editar campo'));

    const textarea = screen.getByLabelText('Editar title');
    await user.clear(textarea);
    await user.type(textarea, 'Este texto es muy largo xx');

    // Should be truncated to maxLength
    expect((textarea as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(25);
  });

  it('guarda cambios al salir del textarea (blur) con debounce', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditableBlock {...defaultProps} onSave={onSave} />);

    const block = screen.getByRole('button');
    fireEvent.click(block);
    fireEvent.click(screen.getByLabelText('Editar campo'));

    const textarea = screen.getByLabelText('Editar title');
    fireEvent.change(textarea, { target: { value: 'Nuevo contenido' } });
    fireEvent.blur(textarea);

    // Should not have called immediately
    expect(onSave).not.toHaveBeenCalled();

    // Advance debounce timer
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    expect(onSave).toHaveBeenCalledWith('Nuevo contenido');
  });

  it('almacena cambios pendientes en localStorage', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<EditableBlock {...defaultProps} onSave={onSave} />);

    const block = screen.getByRole('button');
    fireEvent.click(block);
    fireEvent.click(screen.getByLabelText('Editar campo'));

    const textarea = screen.getByLabelText('Editar title');
    fireEvent.change(textarea, { target: { value: 'Cambio pendiente' } });
    fireEvent.blur(textarea);

    // Advance debounce + retry delays
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    const stored = localStorage.getItem('pending-edits-plan-1');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed['actividades.1.titulo']).toBe('Cambio pendiente');
  });

  it('muestra indicador de error de sincronización después de 3 intentos fallidos', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<EditableBlock {...defaultProps} onSave={onSave} />);

    const block = screen.getByRole('button');
    fireEvent.click(block);
    fireEvent.click(screen.getByLabelText('Editar campo'));

    const textarea = screen.getByLabelText('Editar title');
    fireEvent.change(textarea, { target: { value: 'Cambio fallido' } });
    fireEvent.blur(textarea);

    // Advance debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    // Advance retry delays (500ms + 1000ms + finish)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Error de sincronización')).toBeInTheDocument();
    });
  });

  it('no guarda si el valor no cambió', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditableBlock {...defaultProps} onSave={onSave} />);

    const block = screen.getByRole('button');
    fireEvent.click(block);
    fireEvent.click(screen.getByLabelText('Editar campo'));

    const textarea = screen.getByLabelText('Editar title');
    fireEvent.blur(textarea); // blur without changing

    vi.advanceTimersByTime(2000);
    expect(onSave).not.toHaveBeenCalled();
  });
});
