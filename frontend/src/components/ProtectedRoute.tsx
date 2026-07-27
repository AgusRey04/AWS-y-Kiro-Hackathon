import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-bg-cream flex items-center justify-center">
        <p className="text-text-muted font-quicksand">Cargando...</p>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
