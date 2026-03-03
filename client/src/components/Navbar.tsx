/**
 * Shared Navbar Component
 * Responsive navigation bar for all pages
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-900 hover:text-slate-700 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <svg className="w-7 h-7 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xl font-bold tracking-tight">ShopNow</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Productos
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Mi Cuenta
              </Link>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">
                  Hola, <span className="font-semibold text-slate-900">{user?.fullName?.split(' ')[0]}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 px-4 py-1.5 rounded-full hover:border-slate-400 transition-all"
                >
                  Salir
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors px-4 py-1.5"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-slate-900 hover:bg-slate-700 text-white px-5 py-2 rounded-full transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-5 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-slate-700 hover:text-slate-900 py-3"
          >
            Productos
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-slate-700 hover:text-slate-900 py-3"
              >
                Mi Cuenta
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left text-sm font-medium text-red-600 hover:text-red-700 py-3"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-center text-sm font-medium text-slate-700 border border-slate-300 px-4 py-2 rounded-full"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block text-center text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-full"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
