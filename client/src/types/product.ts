/**
 * Tipos de Productos y Catálogo
 */

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  search?: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}
