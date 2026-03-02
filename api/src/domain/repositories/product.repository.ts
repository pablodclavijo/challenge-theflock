import { Product } from "../entities/product";

export interface ProductFilters {
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IProductRepository {
  findAll(filters: ProductFilters): Promise<PaginatedResult<Product>>;
  findById(id: number): Promise<Product | null>;
}
