import { Outlet, useLocation } from 'react-router-dom';

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 22c-.3-3.4.5-6 2.3-8.2 1.2-1.4 2.7-2.4 4.4-3-.2 3.3-1.4 5.8-3.4 7.4-.9.7-1.9 1.2-3 1.5.3-2.6 1.5-4.7 3.5-6.4-2.6 1-4.5 2.9-5.6 5.6-.9-2.9-2.9-5-5.8-6.2 2.2 1.7 3.6 3.8 4.1 6.4-1.2-.3-2.3-.8-3.3-1.6C3 15.6 1.9 12.9 1.8 9.4c1.9.6 3.5 1.7 4.8 3.2C8.5 14.9 9.4 17.9 9 22h3z" />
      <path d="M12 2c1.9 1.7 3 3.6 3 5.6 0 1.9-1 3.5-3 4.9-2-1.4-3-3-3-4.9C9 5.6 10.1 3.7 12 2z" />
    </svg>
  );
}

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <div className="min-h-screen flex bg-bg-cream overflow-hidden">
      {/* Panel izquierdo — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Logo / Branding en Login */}
        {isLogin && (
          <div className="flex flex-col items-center mb-8">
            <span className="flex items-center justify-center w-14 h-14 rounded-xl bg-green-primary text-white mb-3">
              <LeafIcon className="w-8 h-8" />
            </span>
            <h2 className="text-2xl font-bold font-quicksand text-green-primary">EduPlanner</h2>
            <p className="text-sm text-text-muted font-quicksand mt-1 text-center max-w-[240px]">
              Tu agenda digital diseñada para mejorar cada día en el aula
            </p>
          </div>
        )}

        {/* Branding registro */}
        {!isLogin && (
          <div className="flex items-center gap-3 mb-6 self-start max-w-sm w-full mx-auto">
            <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-primary text-white">
              <LeafIcon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold font-quicksand text-green-primary">EduPlanner</p>
              <p className="text-xs text-text-muted font-quicksand">¡Hola! Educador/a</p>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm">
          <Outlet />
        </div>

        {/* Footer del panel */}
        {isLogin && (
          <p className="text-[11px] text-text-muted font-quicksand mt-8 text-center max-w-xs">
            © 2026 EduPlanner. Herramientas diseñadas para educadores/as infantiles.
          </p>
        )}
      </div>

      {/* Panel derecho — decorativo (solo desktop) */}
      <div className="hidden lg:flex w-[45%] relative bg-[#1E3A2B] items-center justify-center overflow-hidden rounded-l-[3rem]">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <svg className="w-full h-full" viewBox="0 0 400 600" fill="none">
            <circle cx="320" cy="500" r="120" stroke="white" strokeWidth="2" />
            <circle cx="350" cy="150" r="60" stroke="white" strokeWidth="1.5" />
            <path d="M50 300 Q200 200 350 350" stroke="white" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <div className="relative text-center px-12">
          <LeafIcon className="w-16 h-16 text-white/30 mx-auto mb-6" />
          <p className="text-white/70 text-lg font-quicksand leading-relaxed max-w-xs mx-auto">
            Planificá tu semana en minutos y dedicá más tiempo a lo que realmente importa: tus alumnos.
          </p>
        </div>
      </div>
    </div>
  );
}
