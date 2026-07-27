import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface FormErrors {
  nombre?: string;
  escuela?: string;
  email?: string;
  password?: string;
  general?: string;
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  );
}

function SchoolIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 21h18M5 21V9l7-5 7 5v12" />
      <path d="M9 21v-5h6v5" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [escuela, setEscuela] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre no puede superar los 100 caracteres';
    }

    if (!escuela.trim()) {
      newErrors.escuela = 'La escuela es obligatoria';
    } else if (escuela.trim().length > 150) {
      newErrors.escuela = 'La escuela no puede superar los 150 caracteres';
    }

    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (email.trim().length > 254) {
      newErrors.email = 'El email no puede superar los 254 caracteres';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'El formato del email no es válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    } else if (password.length > 72) {
      newErrors.password = 'La contraseña no puede superar los 72 caracteres';
    }

    return newErrors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(nombre.trim(), escuela.trim(), email.trim(), password);
      navigate('/home', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrarse';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-text-dark mb-1 font-quicksand">
        Crear Cuenta
      </h1>
      <p className="text-sm text-text-muted font-quicksand mb-6">
        Únete a nuestra comunidad de educadores/as y organizá tu aula con amor y estructura.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.general && (
          <div role="alert" className="text-red-600 text-sm text-center p-2.5 bg-red-50 rounded-xl border border-red-200">
            {errors.general}
          </div>
        )}

        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className="block text-xs font-semibold text-text-dark mb-1.5 font-quicksand">
            Nombre completo
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              aria-invalid={!!errors.nombre}
              aria-describedby={errors.nombre ? 'nombre-error' : undefined}
              className={`w-full min-h-[48px] rounded-xl border pl-10 pr-4 font-quicksand text-text-dark text-sm
                focus:outline-none focus:ring-2 focus:ring-green-primary/20 focus:border-green-primary
                ${errors.nombre ? 'border-red-500' : 'border-border-light'}`}
            />
          </div>
          {errors.nombre && (
            <p id="nombre-error" className="text-red-600 text-xs mt-1">{errors.nombre}</p>
          )}
        </div>

        {/* Escuela */}
        <div>
          <label htmlFor="escuela" className="block text-xs font-semibold text-text-dark mb-1.5 font-quicksand">
            Escuela o institución
          </label>
          <div className="relative">
            <SchoolIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="escuela"
              type="text"
              value={escuela}
              onChange={(e) => setEscuela(e.target.value)}
              placeholder="Nombre de tu centro educativo"
              aria-invalid={!!errors.escuela}
              aria-describedby={errors.escuela ? 'escuela-error' : undefined}
              className={`w-full min-h-[48px] rounded-xl border pl-10 pr-4 font-quicksand text-text-dark text-sm
                focus:outline-none focus:ring-2 focus:ring-green-primary/20 focus:border-green-primary
                ${errors.escuela ? 'border-red-500' : 'border-border-light'}`}
            />
          </div>
          {errors.escuela && (
            <p id="escuela-error" className="text-red-600 text-xs mt-1">{errors.escuela}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-text-dark mb-1.5 font-quicksand">
            Correo electrónico
          </label>
          <div className="relative">
            <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`w-full min-h-[48px] rounded-xl border pl-10 pr-4 font-quicksand text-text-dark text-sm
                focus:outline-none focus:ring-2 focus:ring-green-primary/20 focus:border-green-primary
                ${errors.email ? 'border-red-500' : 'border-border-light'}`}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-red-600 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-text-dark mb-1.5 font-quicksand">
            Contraseña
          </label>
          <div className="relative">
            <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`w-full min-h-[48px] rounded-xl border pl-10 pr-10 font-quicksand text-text-dark text-sm
                focus:outline-none focus:ring-2 focus:ring-green-primary/20 focus:border-green-primary
                ${errors.password ? 'border-red-500' : 'border-border-light'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-red-600 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[48px] rounded-full bg-mostaza text-white font-bold
            font-quicksand text-sm tracking-wide active:scale-95 hover:brightness-105 transition-all disabled:opacity-50 shadow-md shadow-mostaza/25 flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Registrando...' : (
            <>Registrarse <span aria-hidden="true">→</span></>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6 font-quicksand">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="text-green-primary font-semibold hover:underline">
          Iniciar Sesión
        </Link>
      </p>

      <p className="text-center text-[11px] text-text-muted mt-3 font-quicksand">
        ✦ Diseñado para educadores/as infantiles
      </p>

      <p className="text-center text-[10px] text-text-muted mt-4 font-quicksand">
        Al registrarte, aceptás nuestros{' '}
        <span className="underline">Términos de Servicio</span> y{' '}
        <span className="underline">Política de Privacidad</span>
      </p>
    </div>
  );
}
