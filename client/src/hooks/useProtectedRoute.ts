/**
 * Hook useProtectedRoute
 * Maneja el control de acceso para rutas protegidas
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

interface UseProtectedRouteOptions {
  redirectTo?: string;
  onUnauthorized?: () => void;
}

/**
 * Hook para proteger una ruta del acceso no autorizado
 * Redirige al inicio de sesión si el usuario no está autenticado
 */
export const useProtectedRoute = (options: UseProtectedRouteOptions = {}) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();
  const { redirectTo = '/login', onUnauthorized } = options;

  useEffect(() => {
    // Espera a que el estado de autenticación se cargue
    if (isLoading) return;

    if (!isAuthenticated) {
      onUnauthorized?.();
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, onUnauthorized]);

  return { isAuthenticated, isLoading };
};
