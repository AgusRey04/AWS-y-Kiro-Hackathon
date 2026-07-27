import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { PlanProvider } from './contexts/PlanContext';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';

// --- Lazy-loaded pages (code splitting por ruta) ---
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const PreviewPage = lazy(() => import('./pages/PreviewPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlanProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />

              {/* Auth routes (login/register) */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Protected routes (require authentication) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/preview/:id" element={<PreviewPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                </Route>
              </Route>

              {/* Catch-all: cualquier ruta no definida redirige a la landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </PlanProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
