/**
 * Utilidades de Gestión de Tokens JWT
 */

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

export const tokenUtils = {
  /**
   * Almacena el token JWT en localStorage
   */
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Recupera el token JWT de localStorage
   */
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Verifica si existe un token
   */
  hasToken: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Elimina el token JWT de localStorage
   */
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Almacena los datos del usuario en localStorage
   */
  setUser: (user: any): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Recupera los datos del usuario de localStorage
   */
  getUser: (): any | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  /**
   * Remove user data from localStorage
   */
  removeUser: (): void => {
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Clear all auth data
   */
  clearAuth: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Decode JWT payload (basic implementation)
   * Note: This is for inspection only. Do NOT use for validation.
   */
  decodeToken: (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired: (token: string): boolean => {
    const decoded = tokenUtils.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
  },
};
