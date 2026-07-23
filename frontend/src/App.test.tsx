import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import LandingPage from './pages/LandingPage';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders landing page at root route', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Planifica con amor, enseña con libertad')).toBeInTheDocument();
    });
  });
});

describe('LandingPage', () => {
  function renderLandingPage() {
    return render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
  }

  it('renders hero title', () => {
    renderLandingPage();
    expect(
      screen.getByRole('heading', { name: /planifica con amor, enseña con libertad/i })
    ).toBeInTheDocument();
  });

  it('renders all three benefits', () => {
    renderLandingPage();
    expect(screen.getByText('Fundamentación Propia')).toBeInTheDocument();
    expect(screen.getByText('Actividades Editables')).toBeInTheDocument();
    expect(screen.getByText('Inclusión a medida')).toBeInTheDocument();
  });

  it('renders "Empezar Gratis" CTA button linking to /register', () => {
    renderLandingPage();
    const ctaLink = screen.getByRole('link', { name: /empezar gratis/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute('href', '/register');
  });

  it('renders "Iniciar Sesión" button linking to /login', () => {
    renderLandingPage();
    const loginLink = screen.getByRole('link', { name: /iniciar sesión/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('has responsive layout with no horizontal overflow', () => {
    renderLandingPage();
    const main = screen.getByRole('main');
    expect(main).toHaveClass('min-h-screen');
    expect(main).toHaveClass('flex');
    expect(main).toHaveClass('flex-col');
  });

  it('renders mockup image area with accessible label', () => {
    renderLandingPage();
    expect(screen.getByLabelText('Mockup de planificación semanal')).toBeInTheDocument();
  });
});
