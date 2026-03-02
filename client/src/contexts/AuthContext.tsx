/**
 * Proveedor de Contexto de Autenticación
 * Proporciona estado de autenticación y métodos a todos los componentes
 */

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AuthContextType, User } from '../types/auth';

const AuthContext = createContext<(AuthContextType & { setUser: (user: User | null) => void }) | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const authMethods = useAuth();

  const value = useMemo(() => authMethods, [authMethods]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación
 * @throws Error si se usa fuera del AuthProvider
 */
export const useAuthContext = (): AuthContextType & { setUser: (user: User | null) => void } => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
