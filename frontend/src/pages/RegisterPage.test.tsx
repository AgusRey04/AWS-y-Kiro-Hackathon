import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import RegisterPage from './RegisterPage';

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home" element={<div>Home Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders the register form with all fields', async () => {
    renderRegisterPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/escuela/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /registrarse/i }));

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La escuela es obligatoria')).toBeInTheDocument();
    expect(screen.getByText('El email es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
  });

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/escuela/i), 'Escuela 1');
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/contraseña/i), 'pass123');
    await user.click(screen.getByRole('button', { name: /registrarse/i }));

    expect(await screen.findByText('El formato del email no es válido')).toBeInTheDocument();
  });

  it('shows error for short password', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/escuela/i), 'Escuela 1');
    await user.type(screen.getByLabelText(/email/i), 'ana@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), '12345');
    await user.click(screen.getByRole('button', { name: /registrarse/i }));

    expect(await screen.findByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
  });

  it('redirects to /home on successful registration', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/nombre/i), 'Ana López');
    await user.type(screen.getByLabelText(/escuela/i), 'Escuela Nº 10');
    await user.type(screen.getByLabelText(/email/i), 'ana@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  it('shows error when email is already taken (409)', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/escuela/i), 'Escuela 1');
    await user.type(screen.getByLabelText(/email/i), 'existing@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /registrarse/i }));

    expect(await screen.findByText('El email ya tiene una cuenta asociada')).toBeInTheDocument();
  });

  it('has a link to login page', async () => {
    renderRegisterPage();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute('href', '/login');
  });
});
