/**
 * Componente Página Dashboard
 * Dashboard principal del usuario después de iniciar sesión
 */

import { useAuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuthContext();
  useProtectedRoute();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel</h1>
            <p className="text-gray-600 mt-1">¡Bienvenido de nuevo, {user?.fullName}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta Información de Perfil */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Perfil</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Correo Electrónico</p>
                <p className="text-gray-900 font-semibold">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nombre Completo</p>
                <p className="text-gray-900 font-semibold">{user?.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dirección de Envío</p>
                <p className="text-gray-900 font-semibold">
                  {user?.shippingAddress || 'No configurada'}
                </p>
              </div>
            </div>
            <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
              Editar Perfil
            </button>
          </div>

          {/* Tarjeta Acciones Rápidas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition duration-200">
                <p className="font-semibold text-blue-900">Explorar Productos</p>
                <p className="text-sm text-blue-700">Navega nuestro catálogo</p>
              </button>
              <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition duration-200">
                <p className="font-semibold text-green-900">Ver Carrito</p>
                <p className="text-sm text-green-700">Verifica tus artículos</p>
              </button>
              <button className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition duration-200">
                <p className="font-semibold text-purple-900">Historial de Pedidos</p>
                <p className="text-sm text-purple-700">Ver pedidos anteriores</p>
              </button>
            </div>
          </div>
        </div>

        {/* Sección Placeholder */}
        <div className="mt-12 bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">¡Más características próximamente!</p>
          <p className="text-gray-500 text-sm">Catálogo de productos, carrito de compras y administración de pedidos</p>
        </div>
      </main>
    </div>
  );
};
