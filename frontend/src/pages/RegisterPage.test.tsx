import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { AuthProvider } from '../contexts/AuthContext';
import RegisterPage from './RegisterPage';

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home" element={<div>Home Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

function getNombre() { return screen.getByLabelText(/nombre completo/i); }
function getEscuela() { return screen.getByLabelText(/escuela o institución/i); }
function getEmail() { return screen.getByLabelText(/correo electrónico/i); }
function getPassword() { return screen.getByLabelText('Contraseña'); }

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
    expect(getNombre()).toBeInTheDocument();
    expect(getEscuela()).toBeInTheDocument();
    expect(getEmail()).toBeInTheDocument();
    expect(getPassword()).toBeInTheDocument();
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
      expect(getEmail()).toBeInTheDocument();
    });

    await user.type(getNombre(), 'Ana');
    await user.type(getEscuela(), 'Escuela 1');
    await user.type(getEmail(), 'invalid-email');
    await user.type(getPassword(), 'pass123');
    await user.click(screen.getByRole('button', { name: /registrarse/i }));

    expect(await screen.findByText('El formato del email no es válido')).toBeInTheDocument();
  });

  it('shows error for short password', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await waitFor(() => {
      expect(getPassword()).toBeInTheDocument();
    });

    await user.type(getNombre(), 'Ana');
    await user.type(getEscuela(), 'Escuela 1');
    await user.type(getEmail(), 'ana@test.com');
    await user.type(getPassword(), '12345');
    await user.click(screen.getByRole('button', { name: /registrarse/i }));

    expect(await screen.findByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
  });

  it('redirects to /home on successful registration', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await waitFor(() => {
      expect(getNombre()).toBeInTheDocument();
    });

    await user.type(getNombre(), 'Ana López');
    await user.type(getEscuela(), 'Escuela Nº 10');
    await user.type(getEmail(), 'ana@test.com');
    await user.type(getPassword(), 'password123');
    await user.click(screen.getByRole('button', { name: /registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  it('shows error when email is already taken (409)', async () => {
    server.use(
      http.post('/api/auth/register', () => {
        return HttpResponse.json(
          { code: 'CONFLICT', message: 'El email ya tiene una cuenta asociada' },
          { status: 409 }
        );
      })
    );

    const user = userEvent.setup();
    renderRegisterPage();

    await waitFor(() => {
      expect(getNombre()).toBeInTheDocument();
    });

    await user.type(getNombre(), 'Ana');
    await user.type(getEscuela(), 'Escuela 1');
    await user.type(getEmail(), 'existing@test.com');
    await user.type(getPassword(), 'password123');
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
