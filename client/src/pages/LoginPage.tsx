/**
 * Componente Página de Inicio de Sesión
 * Maneja el inicio de sesión con correo/contraseña
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';

interface LoginFormInputs {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthContext();
  const [error, setError] = useState<string>('');
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-slate-900 font-bold text-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          ShopNow
        </a>
        <span className="text-sm text-slate-500">
          ¿Sin cuenta?{' '}
          <a href="/register" className="font-semibold text-slate-900 hover:underline">Regístrate</a>
        </span>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Bienvenido de nuevo</h1>
            <p className="text-slate-500 text-sm">Ingresa a tu cuenta para continuar</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
            {/* Error alert */}
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'El correo electrónico es requerido',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Ingresa un correo electrónico válido',
                    },
                  })}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition ${
                    errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'Mínimo 6 caracteres',
                    },
                  })}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                    Iniciando sesión…
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                ¿Nuevo usuario?{' '}
                <Link to="/register" className="font-semibold text-slate-900 hover:underline">
                  Crear una cuenta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
