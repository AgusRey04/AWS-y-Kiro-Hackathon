import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-cream">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-green-primary mb-4">
          Planifica con amor, enseña con libertad
        </h1>
        <p className="text-text-muted text-lg mb-8 max-w-md">
          Genera planificaciones semanales personalizadas con inteligencia artificial para nivel inicial.
        </p>

        {/* Mockup */}
        <div
          className="w-full max-w-sm h-48 bg-white rounded-xl border border-border-light mb-8 flex items-center justify-center"
          role="img"
          aria-label="Mockup de planificación semanal"
        >
          <span className="text-text-muted text-sm">Vista previa de planificación</span>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-lg">
          <div className="bg-white rounded-lg p-4 border border-border-light">
            <p className="font-semibold text-text-dark">Fundamentación Propia</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-border-light">
            <p className="font-semibold text-text-dark">Actividades Editables</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-border-light">
            <p className="font-semibold text-text-dark">Inclusión a medida</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/register"
            className="bg-green-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-dark transition-colors"
          >
            Empezar Gratis
          </Link>
          <Link
            to="/login"
            className="border border-green-primary text-green-primary font-semibold px-6 py-3 rounded-lg hover:bg-green-primary hover:text-white transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </section>
    </main>
  );
}
