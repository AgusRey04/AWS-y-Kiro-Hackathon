import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import LoginPage from './LoginPage';

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<div>Home Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

function getEmail() { return screen.getByLabelText(/correo electrónico/i); }
function getPassword() { return screen.getByLabelText('Contraseña'); }

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders the login form with all fields', async () => {
    renderLoginPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    });
    expect(getEmail()).toBeInTheDocument();
    expect(getPassword()).toBeInTheDocument();
    expect(screen.getByLabelText(/mantener sesión iniciada/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('El email es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
  });

  it('redirects to /home on successful login', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(getEmail()).toBeInTheDocument();
    });

    await user.type(getEmail(), 'maria@test.com');
    await user.type(getPassword(), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  it('shows error on invalid credentials', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(getEmail()).toBeInTheDocument();
    });

    await user.type(getEmail(), 'wrong@test.com');
    await user.type(getPassword(), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
  });

  it('persists token in localStorage when mantener sesión is checked', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(getEmail()).toBeInTheDocument();
    });

    await user.type(getEmail(), 'maria@test.com');
    await user.type(getPassword(), 'password123');
    await user.click(screen.getByLabelText(/mantener sesión iniciada/i));
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('mock-jwt-token-123');
    });
  });

  it('persists token in sessionStorage when mantener sesión is unchecked', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(getEmail()).toBeInTheDocument();
    });

    await user.type(getEmail(), 'maria@test.com');
    await user.type(getPassword(), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(sessionStorage.getItem('token')).toBe('mock-jwt-token-123');
    });
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('has a link to register page', async () => {
    renderLoginPage();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /registrate/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /registrate/i })).toHaveAttribute('href', '/register');
  });
});
