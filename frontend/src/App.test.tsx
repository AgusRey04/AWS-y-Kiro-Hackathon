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
      expect(screen.getByRole('heading', { name: /planifica con.*amor.*enseña con libertad/i })).toBeInTheDocument();
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
      screen.getByRole('heading', { name: /planifica con.*amor.*enseña con libertad/i })
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
    const links = screen.getAllByRole('link', { name: /empezar gratis/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute('href', '/register');
  });

  it('renders "Iniciar Sesión" button linking to /login', () => {
    renderLandingPage();
    const links = screen.getAllByRole('link', { name: /iniciar sesión/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute('href', '/login');
  });

  it('has responsive layout with no horizontal overflow', () => {
    renderLandingPage();
    // El contenedor raíz tiene overflow-x-hidden y flex column
    const wrapper = screen.getByRole('main').closest('.min-h-screen');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('overflow-x-hidden');
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('flex-col');
  });

  it('renders mockup image area with accessible label', () => {
    renderLandingPage();
    expect(
      screen.getByLabelText(/mockup de la aplicación eduplanner/i)
    ).toBeInTheDocument();
  });
});
