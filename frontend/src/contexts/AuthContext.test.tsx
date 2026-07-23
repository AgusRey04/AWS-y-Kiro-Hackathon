import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

function TestConsumer() {
  const { state, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(state.isAuthenticated)}</span>
      <span data-testid="user">{state.user?.nombre ?? 'null'}</span>
      <span data-testid="loading">{String(state.isLoading)}</span>
      <span data-testid="error">{state.error ?? 'null'}</span>
      <button onClick={() => login('maria@test.com', 'password123', true).catch(() => {})}>Login</button>
      <button onClick={() => login('maria@test.com', 'password123', false).catch(() => {})}>LoginSession</button>
      <button onClick={() => login('wrong@test.com', 'wrong', false).catch(() => {})}>LoginBad</button>
      <button onClick={() => register('Ana', 'Escuela 1', 'ana@test.com', 'pass123').catch(() => {})}>Register</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderAuthConsumer() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('starts with unauthenticated state when no token exists', async () => {
    renderAuthConsumer();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  it('login stores token in localStorage when mantenerSesion is true', async () => {
    renderAuthConsumer();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('María García');
    expect(localStorage.getItem('token')).toBe('mock-jwt-token-123');
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('login stores token in sessionStorage when mantenerSesion is false', async () => {
    renderAuthConsumer();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByText('LoginSession').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
    expect(sessionStorage.getItem('token')).toBe('mock-jwt-token-123');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('login sets error on invalid credentials', async () => {
    renderAuthConsumer();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByText('LoginBad').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Credenciales inválidas');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('register stores token and authenticates user', async () => {
    renderAuthConsumer();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByText('Register').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('Ana');
    expect(localStorage.getItem('token')).toBe('mock-jwt-token-123');
  });

  it('logout clears state and storage', async () => {
    renderAuthConsumer();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Login first
    await act(async () => {
      screen.getByText('Login').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    // Then logout
    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('restores session from localStorage on mount', async () => {
    localStorage.setItem('token', 'mock-jwt-token-123');

    renderAuthConsumer();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('María García');
  });

  it('restores session from sessionStorage on mount', async () => {
    sessionStorage.setItem('token', 'mock-jwt-token-123');

    renderAuthConsumer();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('María García');
  });

  it('clears invalid token on mount', async () => {
    localStorage.setItem('token', 'invalid-token');

    renderAuthConsumer();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
