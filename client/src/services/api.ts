/**
 * Clase del Servicio API
 * Maneja todas las interacciones HTTP con la API del backend
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { tokenUtils } from '../utils/auth';
import type {
  User,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
} from '../types/auth';

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private baseURL: string = '/api';

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor de solicitud: Añade token JWT a todas las solicitudes
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = tokenUtils.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor de respuesta: Maneja la expiración del token
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const url = error.config?.url ?? '';
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
        if (error.response?.status === 401 && !isAuthEndpoint) {
          // Token expirado o inválido — solo redirigir desde rutas protegidas
          tokenUtils.clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Verifiación de salud del endpoint
   */
  async health(): Promise<{ status: string }> {
    const response = await this.axiosInstance.get('/health');
    return response.data;
  }

  /* ==================== AUTHENTICATION ==================== */

  /**
   * Registra una nueva cuenta de usuario
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>(
      '/auth/register',
      data
    );
    return response.data;
  }

  /**
   * Inicia sesión con correo electrónico y contraseña
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>(
      '/auth/login',
      data
    );
    return response.data;
  }

  /* ==================== USER PROFILE ==================== */

  /**
   * Obtiene el perfil del usuario autenticado
   */
  async getUserProfile(): Promise<User> {
    const response = await this.axiosInstance.get<User>('/users/profile');
    return response.data;
  }

  /**
   * Actualiza el perfil del usuario
   */
  async updateUserProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await this.axiosInstance.put<User>(
      '/users/profile',
      data
    );
    return response.data;
  }

  /* ==================== PRODUCTS ==================== */

  /**
   * Obtiene una lista paginada de productos
   */
  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: number;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }): Promise<any> {
    const response = await this.axiosInstance.get('/products', { params });
    return response.data;
  }

  /**
   * Obtiene un producto por ID
   */
  async getProductById(id: string | number): Promise<any> {
    const response = await this.axiosInstance.get(`/products/${id}`);
    return response.data;
  }

  /* ==================== CATEGORIES ==================== */

  /**
   * Obtiene todas las categorías
   */
  async getCategories(): Promise<any[]> {
    const response = await this.axiosInstance.get('/categories');
    return response.data;
  }

  /* ==================== CART ==================== */

  /**
   * Obtiene el carrito del usuario actual
   */
  async getCart(): Promise<any> {
    const response = await this.axiosInstance.get('/cart');
    return response.data;
  }

  /**
   * Añade un artículo al carrito
   */
  async addToCart(productId: number, quantity: number): Promise<any> {
    const response = await this.axiosInstance.post('/cart', {
      productId,
      quantity,
    });
    return response.data;
  }

  /**
   * Actualiza la cantidad de un artículo en el carrito
   */
  async updateCartItem(productId: number, quantity: number): Promise<any> {
    const response = await this.axiosInstance.put(`/cart/${productId}`, {
      quantity,
    });
    return response.data;
  }

  /**
   * Elimina un artículo del carrito
   */
  async removeFromCart(productId: number): Promise<void> {
    await this.axiosInstance.delete(`/cart/${productId}`);
  }

  /* ==================== ORDERS ==================== */

  /**
   * Crea una orden desde el carrito (compra)
   */
  async createOrder(shippingAddress: string): Promise<any> {
    const response = await this.axiosInstance.post('/orders', {
      shippingAddress,
    });
    return response.data;
  }

  /**
   * Obtiene los pedidos del usuario con paginación
   */
  async getOrders(params?: {
    page?: number;
    limit?: number;
  }): Promise<any> {
    const response = await this.axiosInstance.get('/orders', { params });
    return response.data;
  }

  /**
   * Obtiene un pedido por ID
   */
  async getOrderById(id: string | number): Promise<any> {
    const response = await this.axiosInstance.get(`/orders/${id}`);
    return response.data;
  }

  /**
   * Procesa el pago de un pedido
   */
  async processPayment(orderId: string | number): Promise<any> {
    const response = await this.axiosInstance.post(
      `/orders/${orderId}/payment`
    );
    return response.data;
  }

  /**
   * Maneja errores de la API
   */
  static handleError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.error ||
        error.message ||
        'An error occurred'
      );
    }
    return String(error);
  }
}

// Exporta instancia singleton
export const apiClient = new ApiClient();
