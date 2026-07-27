import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
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

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mantenerSesion, setMantenerSesion] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const newErrors: FormErrors = {};
    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio';
    }
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
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
      await login(email, password, mantenerSesion);
      navigate('/home', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-text-dark mb-1 font-quicksand">
        Iniciar Sesión
      </h1>
      <p className="text-sm text-text-muted font-quicksand mb-6">
        ¡Hola de nuevo! Lista para planificar
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {errors.general && (
          <div role="alert" className="text-red-600 text-sm text-center p-2.5 bg-red-50 rounded-xl border border-red-200">
            {errors.general}
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-text-dark mb-1.5 font-quicksand">
            Correo Electrónico
          </label>
          <div className="relative">
            <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@escuela.com"
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
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-text-dark font-quicksand">
              Contraseña
            </label>
            {/* <button type="button" className="text-xs text-mostaza font-medium font-quicksand hover:underline" tabIndex={-1}>
              ¿Olvidaste tu contraseña?
            </button> */}
          </div>
          <div className="relative">
            <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
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

        {/* Mantener sesión */}
        <div className="flex items-center gap-2">
          <input
            id="mantener-sesion"
            type="checkbox"
            checked={mantenerSesion}
            onChange={(e) => setMantenerSesion(e.target.checked)}
            className="w-4 h-4 rounded border-border-light text-green-primary focus:ring-green-primary/20"
          />
          <label htmlFor="mantener-sesion" className="text-sm text-text-dark font-quicksand">
            Mantener sesión iniciada
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[48px] rounded-full bg-mostaza text-white font-bold
            font-quicksand text-sm tracking-wide active:scale-95 hover:brightness-105 transition-all disabled:opacity-50 shadow-md shadow-mostaza/25 flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Ingresando...' : (
            <>Entrar <span aria-hidden="true">→</span></>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6 font-quicksand">
        ¿No tenés cuenta?{' '}
        <Link to="/register" className="text-green-primary font-semibold hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
