import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import BottomNav from './BottomNav';

function renderBottomNav(initialRoute = '/home') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <BottomNav />
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  it('renders navigation with Inicio and Historial links', () => {
    renderBottomNav();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Historial')).toBeInTheDocument();
  });

  it('has accessible navigation landmark', () => {
    renderBottomNav();
    expect(screen.getByRole('navigation', { name: /navegación principal/i })).toBeInTheDocument();
  });

  it('highlights Inicio tab when on /home route', () => {
    renderBottomNav('/home');
    const inicioLink = screen.getByText('Inicio').closest('a');
    expect(inicioLink).toHaveClass('text-green-primary');
  });

  it('highlights Historial tab when on /history route', () => {
    renderBottomNav('/history');
    const historialLink = screen.getByText('Historial').closest('a');
    expect(historialLink).toHaveClass('text-green-primary');
  });

  it('has min-height of 56px', () => {
    renderBottomNav();
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('min-h-[56px]');
  });
});
