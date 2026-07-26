import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AgregarActividadForm, {
  DIAS_DISPONIBLES,
  TITULO_MAX_LENGTH,
  DESCRIPCION_MAX_LENGTH,
  SEMANA_MIN,
} from './AgregarActividadForm';

interface SetupOverrides {
  onSubmit?: ReturnType<typeof vi.fn>;
  onCancel?: ReturnType<typeof vi.fn>;
  semanaInicial?: number;
}

function setup(overrides: SetupOverrides = {}) {
  const onSubmit = overrides.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  const onCancel = overrides.onCancel ?? vi.fn();
  const utils = render(
    <AgregarActividadForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      semanaInicial={overrides.semanaInicial}
    />
  );
  return { onSubmit, onCancel, user: userEvent.setup(), ...utils };
}

describe('AgregarActividadForm', () => {
  it('renderiza los cuatro campos con labels asociados', () => {
    setup();
    expect(screen.getByLabelText('Día')).toBeInTheDocument();
    expect(screen.getByLabelText('Semana')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
  });

  it('ofrece los cinco días de lunes a viernes con los valores internos correctos', () => {
    setup();
    const select = screen.getByLabelText('Día') as HTMLSelectElement;
    const valores = Array.from(select.options).map((o) => o.value).filter((v) => v !== '');
    expect(valores).toEqual(['lunes', 'martes', 'miercoles', 'jueves', 'viernes']);
    expect(DIAS_DISPONIBLES.map((d) => d.label)).toEqual([
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
    ]);
  });

  it('es un diálogo accesible y toma el foco inicial en el campo Día', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByLabelText('Día')).toHaveFocus();
  });

  it('muestra errores inline y no envía cuando todos los campos están vacíos', async () => {
    const { onSubmit, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByText('Elegí un día para la actividad.')).toBeInTheDocument();
    expect(screen.getByText('El título es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('La descripción es obligatoria.')).toBeInTheDocument();
    expect(screen.getByLabelText('Día')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Título')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Descripción')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('no envía cuando falta solo el día', async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText('Título'), 'Kermesse');
    await user.type(screen.getByLabelText('Descripción'), 'Postas lúdicas');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByText('Elegí un día para la actividad.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('no envía cuando el título es solo espacios', async () => {
    const { onSubmit, user } = setup();

    await user.selectOptions(screen.getByLabelText('Día'), 'viernes');
    await user.type(screen.getByLabelText('Título'), '   ');
    await user.type(screen.getByLabelText('Descripción'), 'Postas lúdicas');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByText('El título es obligatorio.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('no envía cuando la descripción es solo espacios', async () => {
    const { onSubmit, user } = setup();

    await user.selectOptions(screen.getByLabelText('Día'), 'viernes');
    await user.type(screen.getByLabelText('Título'), 'Kermesse');
    await user.type(screen.getByLabelText('Descripción'), '  ');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByText('La descripción es obligatoria.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('limpia el error del campo al corregirlo', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(await screen.findByText('El título es obligatorio.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Título'), 'Kermesse');
    expect(screen.queryByText('El título es obligatorio.')).not.toBeInTheDocument();
  });

  it('respeta los límites de caracteres: 500 para título y 2000 para descripción', () => {
    setup();
    expect(screen.getByLabelText('Título')).toHaveAttribute('maxlength', String(TITULO_MAX_LENGTH));
    expect(screen.getByLabelText('Descripción')).toHaveAttribute(
      'maxlength',
      String(DESCRIPCION_MAX_LENGTH)
    );
    expect(TITULO_MAX_LENGTH).toBe(500);
    expect(DESCRIPCION_MAX_LENGTH).toBe(2000);
  });

  it('muestra contadores de caracteres restantes coherentes con el resto de la app', async () => {
    const { user } = setup();

    expect(screen.getByText(`${TITULO_MAX_LENGTH} caracteres restantes`)).toBeInTheDocument();
    expect(screen.getByText(`${DESCRIPCION_MAX_LENGTH} caracteres restantes`)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Título'), 'Hola');
    expect(screen.getByText(`${TITULO_MAX_LENGTH - 4} caracteres restantes`)).toBeInTheDocument();
  });

  it('trunca el valor del título si se pega texto más largo que el máximo', async () => {
    const { onSubmit, user } = setup();

    const input = screen.getByLabelText('Título') as HTMLInputElement;
    await user.click(input);
    await user.paste('A'.repeat(TITULO_MAX_LENGTH + 50));

    expect(input.value.length).toBe(TITULO_MAX_LENGTH);

    await user.selectOptions(screen.getByLabelText('Día'), 'lunes');
    await user.click(screen.getByLabelText('Descripción'));
    await user.paste('B'.repeat(DESCRIPCION_MAX_LENGTH + 100));

    const textarea = screen.getByLabelText('Descripción') as HTMLTextAreaElement;
    expect(textarea.value.length).toBe(DESCRIPCION_MAX_LENGTH);

    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.titulo.length).toBeLessThanOrEqual(TITULO_MAX_LENGTH);
    expect(payload.descripcion.length).toBeLessThanOrEqual(DESCRIPCION_MAX_LENGTH);
  });

  it('envía día, título y descripción recortados cuando el formulario es válido', async () => {
    const { onSubmit, user } = setup();

    await user.selectOptions(screen.getByLabelText('Día'), 'viernes');
    await user.type(screen.getByLabelText('Título'), '  Kermesse del Movimiento  ');
    await user.type(screen.getByLabelText('Descripción'), '  Postas lúdicas con juegos motores  ');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        dia: 'viernes',
        semana: 1,
        titulo: 'Kermesse del Movimiento',
        descripcion: 'Postas lúdicas con juegos motores',
      })
    );
  });

  it('llama a onCancel al presionar Cancelar sin enviar', async () => {
    const { onCancel, onSubmit, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('llama a onCancel al presionar Escape', async () => {
    const { onCancel, user } = setup();

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('muestra el error y mantiene el formulario abierto cuando el alta falla', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Error interno del servidor'));
    const { user } = setup({ onSubmit, onCancel: vi.fn() });

    await user.selectOptions(screen.getByLabelText('Día'), 'lunes');
    await user.type(screen.getByLabelText('Título'), 'Kermesse');
    await user.type(screen.getByLabelText('Descripción'), 'Postas lúdicas');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect((screen.getByLabelText('Título') as HTMLInputElement).value).toBe('Kermesse');
  });

  it('permite reintentar después de un error', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error('Error interno del servidor'))
      .mockResolvedValueOnce(undefined);
    const { user } = setup({ onSubmit, onCancel: vi.fn() });

    await user.selectOptions(screen.getByLabelText('Día'), 'lunes');
    await user.type(screen.getByLabelText('Título'), 'Kermesse');
    await user.type(screen.getByLabelText('Descripción'), 'Postas lúdicas');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('mantiene la altura mínima de 56px en inputs y botones (sistema de diseño)', () => {
    setup();
    expect(screen.getByLabelText('Día').className).toContain('min-h-[56px]');
    expect(screen.getByLabelText('Semana').className).toContain('min-h-[56px]');
    expect(screen.getByLabelText('Título').className).toContain('min-h-[56px]');
    expect(screen.getByRole('button', { name: 'Agregar' }).className).toContain('min-h-[56px]');
    expect(screen.getByRole('button', { name: 'Cancelar' }).className).toContain('min-h-[56px]');
  });
});

describe('AgregarActividadForm - campo Semana', () => {
  it('es un input numérico con mínimo 1 y paso 1', () => {
    setup();
    const input = screen.getByLabelText('Semana') as HTMLInputElement;
    expect(input.type).toBe('number');
    expect(input).toHaveAttribute('min', String(SEMANA_MIN));
    expect(input).toHaveAttribute('step', '1');
    expect(SEMANA_MIN).toBe(1);
  });

  it('usa la semana 1 por defecto cuando no se le pasa semanaInicial', () => {
    setup();
    expect((screen.getByLabelText('Semana') as HTMLInputElement).value).toBe('1');
  });

  it('preselecciona la última semana existente de la planificación', () => {
    setup({ semanaInicial: 4 });
    expect((screen.getByLabelText('Semana') as HTMLInputElement).value).toBe('4');
  });

  it('cae en la semana 1 si semanaInicial es inválida', () => {
    setup({ semanaInicial: 0 });
    expect((screen.getByLabelText('Semana') as HTMLInputElement).value).toBe('1');
  });

  it('envía la semana elegida junto con el resto del formulario', async () => {
    const { onSubmit, user } = setup({ semanaInicial: 1 });

    await user.selectOptions(screen.getByLabelText('Día'), 'martes');
    await user.clear(screen.getByLabelText('Semana'));
    await user.type(screen.getByLabelText('Semana'), '3');
    await user.type(screen.getByLabelText('Título'), 'Taller de arcilla');
    await user.type(screen.getByLabelText('Descripción'), 'Modelado libre con arcilla');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        dia: 'martes',
        semana: 3,
        titulo: 'Taller de arcilla',
        descripcion: 'Modelado libre con arcilla',
      })
    );
  });

  it.each(['0', '-2', '1.5'])('no envía cuando la semana es inválida: %s', async (valor) => {
    const { onSubmit, user } = setup();

    await user.selectOptions(screen.getByLabelText('Día'), 'lunes');
    await user.clear(screen.getByLabelText('Semana'));
    await user.type(screen.getByLabelText('Semana'), valor);
    await user.type(screen.getByLabelText('Título'), 'Kermesse');
    await user.type(screen.getByLabelText('Descripción'), 'Postas lúdicas');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(
      await screen.findByText('La semana debe ser un número entero mayor o igual a 1.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Semana')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('no envía cuando la semana quedó vacía', async () => {
    const { onSubmit, user } = setup();

    await user.selectOptions(screen.getByLabelText('Día'), 'lunes');
    await user.clear(screen.getByLabelText('Semana'));
    await user.type(screen.getByLabelText('Título'), 'Kermesse');
    await user.type(screen.getByLabelText('Descripción'), 'Postas lúdicas');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(
      await screen.findByText('La semana debe ser un número entero mayor o igual a 1.')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('limpia el error de semana al corregirla', async () => {
    const { user } = setup();

    await user.clear(screen.getByLabelText('Semana'));
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(
      await screen.findByText('La semana debe ser un número entero mayor o igual a 1.')
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Semana'), '2');
    expect(
      screen.queryByText('La semana debe ser un número entero mayor o igual a 1.')
    ).not.toBeInTheDocument();
  });

  it('acepta semanas altas (más allá de las existentes)', async () => {
    const { onSubmit, user } = setup();

    await user.selectOptions(screen.getByLabelText('Día'), 'jueves');
    await user.clear(screen.getByLabelText('Semana'));
    await user.type(screen.getByLabelText('Semana'), '12');
    await user.type(screen.getByLabelText('Título'), 'Cierre de proyecto');
    await user.type(screen.getByLabelText('Descripción'), 'Muestra a las familias');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ semana: 12 }))
    );
  });
});
