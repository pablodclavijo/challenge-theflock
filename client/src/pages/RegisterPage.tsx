/**
 * Componente PÃ¡gina de Registro
 * Maneja el registro de usuarios con correo, contraseÃ±a, nombre y direcciÃ³n de envÃ­o
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import type { RegisterRequest } from '../types/auth';

interface RegisterFormInputs extends RegisterRequest {
  confirmPassword: string;
}

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthContext();
  const [error, setError] = useState<string>('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormInputs>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      shippingAddress: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormInputs) => {
    setError('');
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        shippingAddress: data.shippingAddress,
      });
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
          Â¿Ya tienes cuenta?{' '}
          <a href="/login" className="font-semibold text-slate-900 hover:underline">Inicia sesiÃ³n</a>
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Crea tu cuenta</h1>
            <p className="text-slate-500 text-sm">Ãšnete y empieza a comprar hoy</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Nombre completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Juan GarcÃ­a"
                  {...register('fullName', {
                    required: 'El nombre completo es requerido',
                    minLength: { value: 2, message: 'MÃ­nimo 2 caracteres' },
                  })}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition ${
                    errors.fullName ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1.5">{errors.fullName.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Correo electrÃ³nico
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'El correo electrÃ³nico es requerido',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo electrÃ³nico invÃ¡lido' },
                  })}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition ${
                    errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  ContraseÃ±a
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  {...register('password', {
                    required: 'La contraseÃ±a es requerida',
                    minLength: { value: 8, message: 'MÃ­nimo 8 caracteres' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Debe contener mayÃºsculas, minÃºsculas y nÃºmeros',
                    },
                  })}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Confirmar contraseÃ±a
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  {...register('confirmPassword', {
                    required: 'Por favor confirma tu contraseÃ±a',
                    validate: (value) => value === password || 'Las contraseÃ±as no coinciden',
                  })}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition ${
                    errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
              </div>

              {/* Shipping Address */}
              <div>
                <label htmlFor="shippingAddress" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  DirecciÃ³n de envÃ­o <span className="normal-case font-normal">(opcional)</span>
                </label>
                <input
                  id="shippingAddress"
                  type="text"
                  placeholder="Calle Mayor 1, Madrid 28001"
                  {...register('shippingAddress')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                    Creando cuentaâ€¦
                  </span>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Al registrarte, aceptas nuestros{' '}
              <a href="#" className="text-slate-600 underline hover:text-slate-900">TÃ©rminos de Servicio</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

};
