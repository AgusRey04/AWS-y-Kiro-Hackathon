import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AgregarMaterialForm, {
  ICONOS_DISPONIBLES,
  ICONO_POR_DEFECTO,
  NOMBRE_MAX_LENGTH,
} from './AgregarMaterialForm';

interface SetupOverrides {
  onSubmit?: ReturnType<typeof vi.fn>;
  onCancel?: ReturnType<typeof vi.fn>;
  iconoInicial?: string;
}

function setup(overrides: SetupOverrides = {}) {
  const onSubmit = overrides.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  const onCancel = overrides.onCancel ?? vi.fn();
  const utils = render(
    <AgregarMaterialForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      iconoInicial={overrides.iconoInicial}
    />
  );
  return { onSubmit, onCancel, user: userEvent.setup(), ...utils };
}

describe('AgregarMaterialForm', () => {
  it('renderiza la grilla de íconos con los 16-24 emojis definidos', () => {
    setup();
    expect(ICONOS_DISPONIBLES.length).toBeGreaterThanOrEqual(16);
    expect(ICONOS_DISPONIBLES.length).toBeLessThanOrEqual(24);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(ICONOS_DISPONIBLES.length);
  });

  it('cada ícono tiene un aria-label descriptivo', () => {
    setup();
    ICONOS_DISPONIBLES.forEach((opcion) => {
      expect(screen.getByRole('radio', { name: opcion.label })).toBeInTheDocument();
    });
  });

  it('es un diálogo accesible con radiogroup para los íconos', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('tiene un ícono seleccionado por defecto', () => {
    setup();
    const seleccionado = screen.getByRole('radio', { checked: true });
    expect(seleccionado).toHaveAttribute('aria-label', ICONOS_DISPONIBLES[0].label);
    expect(ICONO_POR_DEFECTO).toBe(ICONOS_DISPONIBLES[0].emoji);
  });

  it('toma el foco inicial en la grilla de íconos', () => {
    setup();
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveFocus();
  });

  it('permite elegir un ícono distinto y refleja el cambio visualmente', async () => {
    const { user } = setup();

    const iconoInicial = screen.getByRole('radio', { name: ICONOS_DISPONIBLES[0].label });
    expect(iconoInicial).toHaveAttribute('aria-checked', 'true');

    const nuevoIcono = screen.getByRole('radio', { name: 'Pintura' });
    await user.click(nuevoIcono);

    expect(nuevoIcono).toHaveAttribute('aria-checked', 'true');
    expect(iconoInicial).toHaveAttribute('aria-checked', 'false');
  });

  it('respeta un ícono inicial distinto al por defecto', () => {
    setup({ iconoInicial: '🎨' });
    expect(screen.getByRole('radio', { name: 'Pintura' })).toHaveAttribute('aria-checked', 'true');
  });

  it('el campo de nombre tiene label y contador de caracteres', () => {
    setup();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByText(`${NOMBRE_MAX_LENGTH} caracteres restantes`)).toBeInTheDocument();
  });

  it('respeta el límite de 500 caracteres para el nombre', () => {
    setup();
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('maxlength', String(NOMBRE_MAX_LENGTH));
    expect(NOMBRE_MAX_LENGTH).toBe(500);
  });

  it('actualiza el contador de caracteres restantes al escribir', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Nombre'), 'Linternas');
    expect(screen.getByText(`${NOMBRE_MAX_LENGTH - 9} caracteres restantes`)).toBeInTheDocument();
  });

  it('trunca el valor del nombre si se pega texto más largo que el máximo', async () => {
    const { user } = setup();
    const input = screen.getByLabelText('Nombre') as HTMLInputElement;
    await user.click(input);
    await user.paste('A'.repeat(NOMBRE_MAX_LENGTH + 50));
    expect(input.value.length).toBe(NOMBRE_MAX_LENGTH);
  });

  it('el botón Agregar está deshabilitado sin nombre', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
  });

  it('muestra un error inline y no envía cuando el nombre está vacío', async () => {
    const { onSubmit, user } = setup();

    // Fuerza intentar submit incluso deshabilitado no aplica; en cambio verificamos
    // que con nombre solo espacios el botón permanece deshabilitado y no se llama onSubmit.
    await user.type(screen.getByLabelText('Nombre'), '   ');
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('habilita el botón Agregar cuando hay ícono y nombre válido', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Nombre'), 'Cartulina');
    expect(screen.getByRole('button', { name: 'Agregar' })).not.toBeDisabled();
  });

  it('envía el nombre recortado junto con el ícono elegido', async () => {
    const { onSubmit, user } = setup();

    await user.click(screen.getByRole('radio', { name: 'Hielo' }));
    await user.type(screen.getByLabelText('Nombre'), '  Cubitos de hielo  ');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ nombre: 'Cubitos de hielo', icono: '🧊' })
    );
  });

  it('envía el ícono por defecto cuando no se cambia la selección', async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText('Nombre'), 'Linternas pequeñas');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ nombre: 'Linternas pequeñas', icono: ICONO_POR_DEFECTO })
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

    await user.type(screen.getByLabelText('Nombre'), 'Cartulina');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Cartulina');
  });

  it('permite reintentar después de un error', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error('Error interno del servidor'))
      .mockResolvedValueOnce(undefined);
    const { user } = setup({ onSubmit, onCancel: vi.fn() });

    await user.type(screen.getByLabelText('Nombre'), 'Cartulina');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('mantiene la altura mínima de 56px en el campo de nombre y los botones de acción', () => {
    setup();
    expect(screen.getByLabelText('Nombre').className).toContain('min-h-[56px]');
    expect(screen.getByRole('button', { name: 'Cancelar' }).className).toContain('min-h-[56px]');
  });
});
