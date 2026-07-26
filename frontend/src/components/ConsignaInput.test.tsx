import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ConsignaInput from './ConsignaInput';

describe('ConsignaInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
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
    render(<ConsignaInput value={value} onChange={onChange} />);
    const textarea = screen.getByPlaceholderText('¿Qué querés trabajar esta semana?');

    await userEvent.type(textarea, 'x');
    // The native maxLength attr prevents the event, but our handler also guards
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not show character counter when text is 400 chars or fewer', () => {
    const value = 'a'.repeat(400);
    render(<ConsignaInput value={value} onChange={vi.fn()} />);
    expect(screen.queryByText(/\/500/)).not.toBeInTheDocument();
  });

  it('shows remaining character counter when text exceeds 400 chars', () => {
    const value = 'a'.repeat(401);
    render(<ConsignaInput value={value} onChange={vi.fn()} />);
    expect(screen.getByText('99/500')).toBeInTheDocument();
  });

  it('shows correct remaining count at 450 chars', () => {
    const value = 'a'.repeat(450);
    render(<ConsignaInput value={value} onChange={vi.fn()} />);
    expect(screen.getByText('50/500')).toBeInTheDocument();
  });

  it('calls onChange when user types in textarea', async () => {
    const onChange = vi.fn();
    render(<ConsignaInput value="" onChange={onChange} />);
    const textarea = screen.getByPlaceholderText('¿Qué querés trabajar esta semana?');

    await userEvent.type(textarea, 'H');
    expect(onChange).toHaveBeenCalledWith('H');
  });
});
