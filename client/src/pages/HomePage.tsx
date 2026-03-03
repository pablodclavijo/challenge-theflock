/**
 * Componente PÃ¡gina de Inicio
 * PÃ¡gina de aterrizaje para usuarios no autenticados
 */

import { Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export const HomePage = () => {
  const { isAuthenticated } = useAuthContext();

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-slate-900 font-bold text-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          ShopNow
        </Link>
      </div>
      <div className="text-center py-24 px-4">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Bienvenido a ShopNow</h1>
        <p className="text-slate-500 mb-8">Descubre productos increÃ­bles a precios excelentes.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="bg-slate-900 hover:bg-slate-700 text-white font-semibold py-3 px-8 rounded-full transition">
            Crear Cuenta
          </Link>
          <Link to="/login" className="border border-slate-300 text-slate-900 font-semibold py-3 px-8 rounded-full hover:bg-slate-50 transition">
            Iniciar SesiÃ³n
          </Link>
        </div>
      </div>
    </div>
  );
};

