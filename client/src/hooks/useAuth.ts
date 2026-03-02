/**
 * Hook useAuth
 * Proporciona funcionalidad de autenticación y gestión de estado
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient, ApiClient } from '../services/api';
import { tokenUtils } from '../utils/auth';
import type {
  User,
  AuthContextType,
  RegisterRequest,
  UpdateProfileRequest,
} from '../types/auth';

export const useAuth = (): AuthContextType & { setUser: (user: User | null) => void } => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage
    return tokenUtils.getUser();
  });
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!user && !!tokenUtils.getToken();

  /**
   * Inicia sesión con correo electrónico y contraseña
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient.login({ email, password });
      tokenUtils.setToken(response.accessToken);
      tokenUtils.setUser(response.user);
      setUser(response.user);
    } catch (error) {
      tokenUtils.clearAuth();
      setUser(null);
      throw ApiClient.handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Registra una nueva cuenta
   */
  const register = useCallback(async (data: RegisterRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient.register(data);
      tokenUtils.setToken(response.accessToken);
      tokenUtils.setUser(response.user);
      setUser(response.user);
    } catch (error) {
      tokenUtils.clearAuth();
      setUser(null);
      throw ApiClient.handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback((): void => {
    tokenUtils.clearAuth();
    setUser(null);
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const updatedUser = await apiClient.updateUserProfile(data);
      tokenUtils.setUser(updatedUser);
      setUser(updatedUser);
    } catch (error) {
      throw ApiClient.handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const updatedUser = await apiClient.getUserProfile();
      tokenUtils.setUser(updatedUser);
      setUser(updatedUser);
    } catch (error) {
      // If refresh fails, clear auth
      tokenUtils.clearAuth();
      setUser(null);
      throw ApiClient.handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Check token validity on mount
   */
  useEffect(() => {
    const token = tokenUtils.getToken();
    if (token && tokenUtils.isTokenExpired(token)) {
      tokenUtils.clearAuth();
      setUser(null);
    }
  }, []);

  return {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };
};
