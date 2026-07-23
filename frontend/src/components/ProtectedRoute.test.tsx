import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function renderWithRoute(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<div>Home Page</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('redirects to /login when no token is present', async () => {
    renderWithRoute('/home');
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
  });

  it('renders child route when valid token is present in localStorage', async () => {
    localStorage.setItem('token', 'mock-jwt-token-123');
    renderWithRoute('/home');
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('renders child route when valid token is present in sessionStorage', async () => {
    sessionStorage.setItem('token', 'mock-jwt-token-123');
    renderWithRoute('/home');
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to /login when token is invalid', async () => {
    localStorage.setItem('token', 'invalid-token');
    renderWithRoute('/home');
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});
