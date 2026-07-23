import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TabBar from './TabBar';

const TABS = [
  { id: 'actividades', label: 'Actividades' },
  { id: 'materiales', label: 'Materiales' },
  { id: 'adaptaciones', label: 'Adaptaciones' },
  { id: 'fundamentacion', label: 'Fundamentación' },
];

describe('TabBar', () => {
  it('renderiza las 4 pestañas', () => {
    render(<TabBar tabs={TABS} activeTab="actividades" onTabChange={() => {}} />);

    expect(screen.getByRole('tab', { name: 'Actividades' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Materiales' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Adaptaciones' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Fundamentación' })).toBeInTheDocument();
  });

  it('marca la pestaña activa con aria-selected=true', () => {
    render(<TabBar tabs={TABS} activeTab="actividades" onTabChange={() => {}} />);

    const activeTab = screen.getByRole('tab', { name: 'Actividades' });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');

    const inactiveTab = screen.getByRole('tab', { name: 'Materiales' });
    expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
  });

  it('llama a onTabChange al hacer click en una pestaña', () => {
    const onTabChange = vi.fn();
    render(<TabBar tabs={TABS} activeTab="actividades" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Materiales' }));
    expect(onTabChange).toHaveBeenCalledWith('materiales');
  });

  it('tiene role tablist en el contenedor', () => {
    render(<TabBar tabs={TABS} activeTab="actividades" onTabChange={() => {}} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
