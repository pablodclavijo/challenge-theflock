/**
 * Componente Página Dashboard
 * Dashboard principal del usuario después de iniciar sesión
 */

import { useAuthContext } from '../contexts/AuthContext';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { Navbar } from '../components/Navbar';

export const DashboardPage = () => {
  const { user, isLoading } = useAuthContext();
  useProtectedRoute();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-900"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Hola, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-2">Bienvenido a tu panel de cuenta.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-7">
            <div className="flex items-center gap-5 mb-7">
              <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xl shrink-0">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{user?.fullName}</h2>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-5 pt-5 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo</span>
                <span className="text-sm text-slate-700 font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre</span>
                <span className="text-sm text-slate-700 font-medium">{user?.fullName}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">Dirección</span>
                <span className="text-sm text-slate-700 font-medium text-right ml-4">
                  {user?.shippingAddress || <span className="text-slate-400 font-normal italic">No configurada</span>}
                </span>
              </div>
            </div>

            <button className="mt-7 w-full py-3 px-4 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition">
              Editar Perfil
            </button>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-7">
            <h2 className="text-base font-bold text-slate-900 mb-5">Acciones rápidas</h2>
            <div className="space-y-3">
              <a
                href="/"
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition group"
              >
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Explorar productos</p>
                  <p className="text-xs text-slate-500">Navega nuestro catálogo</p>
                </div>
                <svg className="w-4 h-4 text-slate-400 ml-auto group-hover:text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition group text-left">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Ver carrito</p>
                  <p className="text-xs text-slate-500">Revisa tus productos</p>
                </div>
                <svg className="w-4 h-4 text-slate-400 ml-auto group-hover:text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition group text-left">
                <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Mis pedidos</p>
                  <p className="text-xs text-slate-500">Historial de compras</p>
                </div>
                <svg className="w-4 h-4 text-slate-400 ml-auto group-hover:text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Coming soon banner */}
        <div className="mt-8 bg-linear-to-r from-slate-900 to-slate-700 rounded-2xl p-10 text-center text-white">
          <p className="text-base font-semibold mb-1">Más funciones próximamente</p>
          <p className="text-slate-400 text-sm">Gestión de pedidos, lista de deseos y mucho más.</p>
        </div>
      </main>
    </div>
  );
};
