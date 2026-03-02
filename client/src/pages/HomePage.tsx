/**
 * Componente Página de Inicio
 * Página de aterrizaje para usuarios no autenticados
 */

import { Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export const HomePage = () => {
  const { isAuthenticated } = useAuthContext();

  if (isAuthenticated) {
    return null; // Redirect handled by App routing
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Encabezado */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Tienda</h1>
          <div className="space-x-4">
            <Link
              to="/login"
              className="text-gray-700 hover:text-gray-900 font-semibold"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      {/* Sección Principal */}
      <main className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Bienvenido a Nuestra Tienda
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Descubre productos increíbles a precios excelentes. Inicia sesión o crea una cuenta para comenzar.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 text-center"
            >
              Crear Cuenta
            </Link>
            <Link
              to="/login"
              className="bg-white hover:bg-gray-100 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition duration-200 text-center"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>

        {/* Sección de Características */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Productos de Calidad</h3>
            <p className="text-gray-600">Selección curada de artículos de alta calidad</p>
          </div>

          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-4">🚚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Envío Rápido</h3>
            <p className="text-gray-600">Entrega rápida a tu domicilio</p>
          </div>

          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pago Seguro</h3>
            <p className="text-gray-600">Proceso de compra seguro y fácil</p>
          </div>
        </div>
      </main>
    </div>
  );
};
