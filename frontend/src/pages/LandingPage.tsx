import { Link } from 'react-router-dom';

/* ─── Íconos SVG ─── */

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 22c-.3-3.4.5-6 2.3-8.2 1.2-1.4 2.7-2.4 4.4-3-.2 3.3-1.4 5.8-3.4 7.4-.9.7-1.9 1.2-3 1.5.3-2.6 1.5-4.7 3.5-6.4-2.6 1-4.5 2.9-5.6 5.6-.9-2.9-2.9-5-5.8-6.2 2.2 1.7 3.6 3.8 4.1 6.4-1.2-.3-2.3-.8-3.3-1.6C3 15.6 1.9 12.9 1.8 9.4c1.9.6 3.5 1.7 4.8 3.2C8.5 14.9 9.4 17.9 9 22h3z" />
      <path d="M12 2c1.9 1.7 3 3.6 3 5.6 0 1.9-1 3.5-3 4.9-2-1.4-3-3-3-4.9C9 5.6 10.1 3.7 12 2z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function LoginIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 2l2 6.5L20.5 10l-5 4L17 20.5 12 17l-5 3.5 1.5-6.5-5-4L10 9z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
    </svg>
  );
}

function HandHeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 8c-1.5-2-4-2.5-5.5-1S5 9.5 6.5 11.5L12 17l5.5-5.5c1.5-2 1-4.5-.5-5.5S13.5 6 12 8z" />
      <path d="M4 21h16" />
      <path d="M12 17v4" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
    </svg>
  );
}

function AtIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1" />
    </svg>
  );
}

/* ─── Componentes ─── */

function Navbar() {
  return (
    <nav className="sticky top-0 z-30 bg-bg-cream/90 backdrop-blur-sm border-b border-border-light">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="EduPlanner Inicio">
          <LeafIcon className="w-6 h-6 text-green-primary" />
          <span className="text-xl font-bold font-quicksand text-green-primary tracking-tight">EduPlanner</span>
        </Link>

        <div className="hidden sm:flex items-center gap-8 text-sm font-medium font-quicksand text-text-dark">
          <a href="#hero" className="underline underline-offset-4 decoration-green-primary">Inicio</a>
          <a href="#beneficios" className="hover:text-green-primary transition-colors">Beneficios</a>
          <a href="#cta" className="hover:text-green-primary transition-colors">Contacto</a>
        </div>

        <Link
          to="/login"
          className="hidden sm:inline-flex items-center gap-2 border border-green-primary text-green-primary font-semibold font-quicksand text-sm rounded-full px-5 py-2 hover:bg-green-primary/5 active:scale-95 transition-all"
        >
          <LoginIcon className="w-4 h-4" />
          Iniciar Sesión
        </Link>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section id="hero" className="mx-auto max-w-6xl px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Columna izquierda */}
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl sm:text-5xl font-bold font-quicksand text-text-dark leading-tight">
          Planifica con <em className="not-italic text-mostaza">amor</em>,<br />
          enseña con libertad.
        </h1>

        <p className="text-text-muted text-lg leading-relaxed max-w-md">
          La primera herramienta gratuita que transforma tus ideas en planificaciones completas.
          Personalizá cada actividad, fundamentación y estrategia de inclusión con total flexibilidad.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 mt-2">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-mostaza text-white font-bold font-quicksand px-7 py-3 min-h-[52px] rounded-full shadow-md shadow-mostaza/25 hover:brightness-105 active:scale-95 transition-all"
          >
            Empezar Gratis
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 border border-green-primary text-green-primary font-semibold font-quicksand px-7 py-3 min-h-[52px] rounded-full hover:bg-green-primary/5 active:scale-95 transition-all"
          >
            <LoginIcon className="w-4 h-4" />
            Iniciar Sesión
          </Link>
        </div>
      </div>

      {/* Columna derecha — Mockup de tablet */}
      <div className="hidden lg:flex items-center justify-center">
        <div
          className="w-full max-w-md aspect-[4/3] rounded-2xl shadow-xl border border-border-light overflow-hidden"
          role="img"
          aria-label="Mockup de la aplicación EduPlanner en una tablet"
        >
          <img
            src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80"
            alt="Maestra planificando actividades en un aula de nivel inicial"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      icon: <SparkIcon className="w-6 h-6 text-green-primary" />,
      bg: 'bg-[#D9F0DC]',
      title: 'Fundamentación Propia',
      description:
        'Agregá tu marco teórico y pedagógico a cada unidad. La herramienta te ayuda a redactarla o te permite incluir tus propios textos de fundamentación fácilmente.',
      link: 'Personalizar mi plan',
      linkColor: 'text-green-dark',
    },
    {
      icon: <PlayIcon className="w-5 h-5 text-lavanda" />,
      bg: 'bg-lavanda/20',
      title: 'Actividades Editables',
      description:
        '¿Querés cambiar una dinámica? Editá cada paso de tus actividades semanales. Tenés el control total para adaptar el ritmo a la respuesta de tus alumnos.',
      link: 'Probar el editor',
      linkColor: 'text-text-dark',
    },
    {
      icon: <HandHeartIcon className="w-6 h-6 text-mostaza" />,
      bg: 'bg-mostaza/15',
      title: 'Inclusión a medida',
      description:
        'Personalizá las estrategias de inclusión para cada estudiante. Creá adaptaciones específicas y guardalas para usarlas en futuras planificaciones de forma sencilla.',
      link: 'Ver estrategias',
      linkColor: 'text-mostaza',
    },
  ];

  return (
    <section id="beneficios" className="bg-bg-cream py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold font-quicksand text-green-primary">
            Diseñado para la realidad del aula
          </h2>
          <p className="text-text-muted mt-4 max-w-2xl mx-auto leading-relaxed">
            Disfrutá de una flexibilidad total. Editá actividades, personalizá tu fundamentación y ajustá cada detalle para que tu planificación sea verdaderamente tuya.
          </p>
          {/* Accent line */}
          <div className="mx-auto mt-6 w-24 h-1 bg-green-primary rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <article key={i} className="flex flex-col gap-4">
              <span className={`inline-flex self-start items-center justify-center w-12 h-12 rounded-xl ${b.bg}`}>
                {b.icon}
              </span>
              <h3 className="text-xl font-bold font-quicksand text-text-dark">{b.title}</h3>
              <p className="text-text-muted leading-relaxed flex-1">{b.description}</p>
              <Link to="/register" className={`inline-flex items-center gap-1 font-semibold font-quicksand ${b.linkColor} hover:underline`}>
                {b.link}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section id="cta" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative bg-green-dark rounded-3xl px-8 py-16 sm:px-16 text-center overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute right-4 bottom-4 opacity-20" aria-hidden="true">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <circle cx="30" cy="30" r="25" stroke="currentColor" strokeWidth="4" className="text-white" />
              <circle cx="70" cy="30" r="25" stroke="currentColor" strokeWidth="4" className="text-white" />
              <circle cx="30" cy="70" r="25" stroke="currentColor" strokeWidth="4" className="text-white" />
              <circle cx="70" cy="70" r="25" stroke="currentColor" strokeWidth="4" className="text-white" />
              <circle cx="110" cy="50" r="25" stroke="currentColor" strokeWidth="4" className="text-white" />
            </svg>
          </div>

          <h2 className="relative text-3xl sm:text-4xl font-bold font-quicksand text-white mb-4">
            ¿Lista para recuperar tu tiempo?
          </h2>
          <p className="relative text-white/80 max-w-xl mx-auto leading-relaxed mb-8">
            Únete a cientos de educadores que ya están transformando la educación infantil con una herramienta gratuita, inteligente y humana.
          </p>

          <div className="relative flex flex-wrap items-center justify-center gap-4 mb-6">
            <Link
              to="/register"
              className="inline-flex items-center justify-center bg-white text-green-dark font-bold font-quicksand px-7 py-3 min-h-[52px] rounded-full hover:bg-gray-50 active:scale-95 transition-all"
            >
              Empezar Gratis
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center border border-white/60 text-white font-semibold font-quicksand px-7 py-3 min-h-[52px] rounded-full hover:bg-white/10 active:scale-95 transition-all"
            >
              Ver demo gratuita
            </Link>
          </div>

          <p className="relative text-white/50 text-sm font-quicksand">
            Herramienta 100% gratuita para educadores
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#E8E5DD] py-12">
      <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Marca */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LeafIcon className="w-5 h-5 text-green-primary" />
            <span className="text-lg font-bold font-quicksand text-green-primary">EduPlanner</span>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            © 2024 EduPlanner. Cultivando el futuro, un plan a la vez. Herramienta gratuita para la comunidad docente.
          </p>
          <div className="flex gap-3 mt-4">
            <span className="w-9 h-9 rounded-full border border-border-light flex items-center justify-center text-text-muted">
              <GlobeIcon className="w-4 h-4" />
            </span>
            <span className="w-9 h-9 rounded-full border border-border-light flex items-center justify-center text-text-muted">
              <AtIcon className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Explorar */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-dark mb-3">Explorar</h4>
          <ul className="space-y-2 text-sm text-text-muted font-quicksand">
            <li><a href="#hero" className="hover:text-green-primary transition-colors">Sobre la app</a></li>
            <li><a href="#beneficios" className="hover:text-green-primary transition-colors">Beneficios</a></li>
          </ul>
        </div>

        {/* Soporte */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-dark mb-3">Soporte</h4>
          <ul className="space-y-2 text-sm text-text-muted font-quicksand">
            <li><a href="#cta" className="hover:text-green-primary transition-colors">Contacto</a></li>
            <li><a href="#beneficios" className="hover:text-green-primary transition-colors">Blog</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

/* ─── Página principal ─── */

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-cream overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <BenefitsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
