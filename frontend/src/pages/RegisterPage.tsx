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

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [escuela, setEscuela] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <h1 className="text-2xl font-bold text-text-dark text-center mb-8 font-quicksand">
        Crear Cuenta
      </h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.general && (
          <div role="alert" className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-xl">
            {errors.general}
          </div>
        )}

        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-text-dark mb-1">
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-invalid={!!errors.nombre}
            aria-describedby={errors.nombre ? 'nombre-error' : undefined}
            className={`w-full min-h-[56px] rounded-xl border px-4 font-quicksand text-text-dark
              focus:outline-none focus:ring-2 focus:ring-[#4A7856]/20 focus:border-[#4A7856]
              ${errors.nombre ? 'border-red-500' : 'border-[#E5E1DB]'}`}
          />
          {errors.nombre && (
            <p id="nombre-error" className="text-red-600 text-sm mt-1">
              {errors.nombre}
            </p>
          )}
        </div>

        {/* Escuela */}
        <div>
          <label htmlFor="escuela" className="block text-sm font-medium text-text-dark mb-1">
            Escuela
          </label>
          <input
            id="escuela"
            type="text"
            value={escuela}
            onChange={(e) => setEscuela(e.target.value)}
            aria-invalid={!!errors.escuela}
            aria-describedby={errors.escuela ? 'escuela-error' : undefined}
            className={`w-full min-h-[56px] rounded-xl border px-4 font-quicksand text-text-dark
              focus:outline-none focus:ring-2 focus:ring-[#4A7856]/20 focus:border-[#4A7856]
              ${errors.escuela ? 'border-red-500' : 'border-[#E5E1DB]'}`}
          />
          {errors.escuela && (
            <p id="escuela-error" className="text-red-600 text-sm mt-1">
              {errors.escuela}
            </p>
          )}
        </div>

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

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[56px] rounded-full bg-green-primary text-white font-bold
            font-quicksand active:scale-95 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6 font-quicksand">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="text-green-primary font-semibold hover:underline">
          Iniciar Sesión
        </Link>
      </p>
    </div>
  );
}
