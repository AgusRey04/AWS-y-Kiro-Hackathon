import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ConsignaInput from './ConsignaInput';

describe('ConsignaInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    suggestions: ['Chip uno', 'Chip dos', 'Chip tres'],
  };

  it('renders textarea with correct placeholder', () => {
    render(<ConsignaInput {...defaultProps} />);
    expect(
      screen.getByPlaceholderText('¿Qué querés trabajar esta semana?')
    ).toBeInTheDocument();
  });

  it('renders textarea with min-height 56px', () => {
    render(<ConsignaInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('¿Qué querés trabajar esta semana?');
    expect(textarea).toHaveClass('min-h-[56px]');
  });

  it('enforces 500 character max limit via maxLength attribute', () => {
    render(<ConsignaInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('¿Qué querés trabajar esta semana?');
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  it('does not call onChange when text would exceed maxLength', async () => {
    const onChange = vi.fn();
    const value = 'a'.repeat(500);
    render(<ConsignaInput value={value} onChange={onChange} suggestions={['Chip']} />);
    const textarea = screen.getByPlaceholderText('¿Qué querés trabajar esta semana?');

    await userEvent.type(textarea, 'x');
    // The native maxLength attr prevents the event, but our handler also guards
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not show character counter when text is 400 chars or fewer', () => {
    const value = 'a'.repeat(400);
    render(<ConsignaInput value={value} onChange={vi.fn()} suggestions={['Chip uno', 'Chip dos']} />);
    expect(screen.queryByText(/\/500/)).not.toBeInTheDocument();
  });

  it('shows remaining character counter when text exceeds 400 chars', () => {
    const value = 'a'.repeat(401);
    render(<ConsignaInput value={value} onChange={vi.fn()} suggestions={['Chip uno', 'Chip dos']} />);
    expect(screen.getByText('99/500')).toBeInTheDocument();
  });

  it('shows correct remaining count at 450 chars', () => {
    const value = 'a'.repeat(450);
    render(<ConsignaInput value={value} onChange={vi.fn()} suggestions={['Chip uno', 'Chip dos']} />);
    expect(screen.getByText('50/500')).toBeInTheDocument();
  });

  it('calls onChange when user types in textarea', async () => {
    const onChange = vi.fn();
    render(<ConsignaInput value="" onChange={onChange} suggestions={['Chip uno', 'Chip dos']} />);
    const textarea = screen.getByPlaceholderText('¿Qué querés trabajar esta semana?');

    await userEvent.type(textarea, 'H');
    expect(onChange).toHaveBeenCalledWith('H');
  });

  describe('chip insertion', () => {
    it('sets text to chip value when field is empty', async () => {
      const onChange = vi.fn();
      render(<ConsignaInput value="" onChange={onChange} suggestions={['Chip uno', 'Chip dos']} />);

      await userEvent.click(screen.getByText('Chip uno'));
      expect(onChange).toHaveBeenCalledWith('Chip uno');
    });

    it('appends chip with space when field has content', async () => {
      const onChange = vi.fn();
      render(
        <ConsignaInput value="Texto existente" onChange={onChange} suggestions={['Chip uno', 'Chip dos']} />
      );

      await userEvent.click(screen.getByText('Chip uno'));
      expect(onChange).toHaveBeenCalledWith('Texto existente Chip uno');
    });

    it('truncates inserted chip to respect 500 char limit', async () => {
      const onChange = vi.fn();
      const value = 'a'.repeat(495);
      render(
        <ConsignaInput value={value} onChange={onChange} suggestions={['Largo chip de texto', 'Otro chip']} />
      );

      await userEvent.click(screen.getByText('Largo chip de texto'));
      // value (495) + space (1) + chip = 495 + 1 + 19 = 515 > 500, should truncate
      const calledWith = onChange.mock.calls[0][0] as string;
      expect(calledWith.length).toBe(500);
    });

    it('does not insert chip when field is already at max length and empty chip', async () => {
      const onChange = vi.fn();
      const value = 'a'.repeat(500);
      render(
        <ConsignaInput value={value} onChange={onChange} suggestions={['Chip', 'Otro']} />
      );

      await userEvent.click(screen.getByText('Chip'));
      // value + space + chip > 500, truncate to 500 → same as original
      const calledWith = onChange.mock.calls[0][0] as string;
      expect(calledWith.length).toBe(500);
    });
  });

  it('renders suggestion chips', () => {
    render(<ConsignaInput {...defaultProps} />);
    expect(screen.getByText('Chip uno')).toBeInTheDocument();
    expect(screen.getByText('Chip dos')).toBeInTheDocument();
    expect(screen.getByText('Chip tres')).toBeInTheDocument();
  });
});
