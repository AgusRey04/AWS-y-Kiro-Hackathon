import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <h1 className="text-2xl font-bold text-text-dark text-center mb-8 font-quicksand">
        Iniciar Sesión
      </h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.general && (
          <div role="alert" className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-xl">
            {errors.general}
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`w-full min-h-[56px] rounded-xl border px-4 font-quicksand text-text-dark
              focus:outline-none focus:ring-2 focus:ring-[#4A7856]/20 focus:border-[#4A7856]
              ${errors.email ? 'border-red-500' : 'border-[#E5E1DB]'}`}
          />
          {errors.email && (
            <p id="email-error" className="text-red-600 text-sm mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-dark mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`w-full min-h-[56px] rounded-xl border px-4 font-quicksand text-text-dark
              focus:outline-none focus:ring-2 focus:ring-[#4A7856]/20 focus:border-[#4A7856]
              ${errors.password ? 'border-red-500' : 'border-[#E5E1DB]'}`}
          />
          {errors.password && (
            <p id="password-error" className="text-red-600 text-sm mt-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Mantener sesión */}
        <div className="flex items-center gap-2">
          <input
            id="mantener-sesion"
            type="checkbox"
            checked={mantenerSesion}
            onChange={(e) => setMantenerSesion(e.target.checked)}
            className="w-5 h-5 rounded border-[#E5E1DB] text-green-primary focus:ring-[#4A7856]/20"
          />
          <label htmlFor="mantener-sesion" className="text-sm text-text-dark font-quicksand">
            Mantener sesión iniciada
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[56px] rounded-full bg-green-primary text-white font-bold
            font-quicksand active:scale-95 hover:brightness-110 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
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
