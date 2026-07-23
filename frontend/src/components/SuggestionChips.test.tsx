import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SuggestionChips from './SuggestionChips';

describe('SuggestionChips', () => {
  it('renders chips as buttons', () => {
    render(<SuggestionChips chips={['Chip A', 'Chip B']} onChipSelect={vi.fn()} />);
    expect(screen.getByText('Chip A')).toBeInTheDocument();
    expect(screen.getByText('Chip B')).toBeInTheDocument();
  });

  it('renders nothing when fewer than 2 chips provided', () => {
    const { container } = render(<SuggestionChips chips={['Solo uno']} onChipSelect={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders max 5 chips even if more provided', () => {
    const chips = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    render(<SuggestionChips chips={chips} onChipSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('calls onChipSelect with chip text when clicked', async () => {
    const onChipSelect = vi.fn();
    render(<SuggestionChips chips={['Chip A', 'Chip B']} onChipSelect={onChipSelect} />);

    await userEvent.click(screen.getByText('Chip A'));
    expect(onChipSelect).toHaveBeenCalledWith('Chip A');
  });

  it('applies correct styling classes to chips', () => {
    render(<SuggestionChips chips={['Chip A', 'Chip B']} onChipSelect={vi.fn()} />);
    const chip = screen.getByText('Chip A');
    expect(chip).toHaveClass('bg-gray-100', 'rounded-full', 'px-4', 'py-2', 'min-h-[40px]');
  });

  it('has accessible group role', () => {
    render(<SuggestionChips chips={['Chip A', 'Chip B']} onChipSelect={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Sugerencias de consigna' })).toBeInTheDocument();
  });

  it('renders exactly 2 chips when given 2', () => {
    render(<SuggestionChips chips={['A', 'B']} onChipSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('renders exactly 5 chips when given 5', () => {
    render(<SuggestionChips chips={['A', 'B', 'C', 'D', 'E']} onChipSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });
});
