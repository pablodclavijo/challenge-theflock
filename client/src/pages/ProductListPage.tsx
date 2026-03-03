/**
 * Página de Lista de Productos con Infinite Scroll
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import type { Product, Category, ProductFilters } from '../types/product';

export const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const observerTarget = useRef<HTMLDivElement>(null);

  // Obtener filtros de los parámetros de búsqueda
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
      setProducts([]);
      setHasMore(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiClient.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };

    loadCategories();
  }, []);

  // Cargar productos
  const loadProducts = useCallback(
    async (page: number) => {
      if (isLoading || !hasMore) return;

      setIsLoading(true);
      setError(null);

      try {
        const filters: ProductFilters = {
          page,
          limit: 12,
          search: debouncedSearch,
          ...(selectedCategory && { category: parseInt(selectedCategory) }),
          ...(minPrice && { minPrice: parseFloat(minPrice) }),
          ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
        };

        const response = await apiClient.getProducts(filters);

        if (page === 1) {
          setProducts(response.data);
        } else {
          setProducts((prev) => [...prev, ...response.data]);
        }

        setHasMore(page < response.totalPages);
        setCurrentPage(page + 1);
      } catch (err) {
        setError('Error al cargar productos. Intenta de nuevo.');
        console.error('Error loading products:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, selectedCategory, minPrice, maxPrice, isLoading, hasMore]
  );

  // Cargar productos iniciales cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    loadProducts(1);
  }, [debouncedSearch, selectedCategory, minPrice, maxPrice, loadProducts]);

  // Infinite scroll observer
  useEffect(() => {
    const element = observerTarget.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadProducts(currentPage);
        }
      },
      { threshold: 0.1 }
    );

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [currentPage, hasMore, isLoading, loadProducts]);

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Catálogo de Productos
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Descubre nuestros productos destacados
            </p>
          </div>
          <div className="flex space-x-4">
            <a
              href="/login"
              className="hidden md:inline-block text-gray-700 hover:text-gray-900 font-semibold"
            >
              Iniciar Sesión
            </a>
            <a
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Registrarse
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nombre del producto..."
                value={searchQuery}
                onChange={(e) =>
                  handleFilterChange('search', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) =>
                  handleFilterChange('category', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Mín.
              </label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) =>
                  handleFilterChange('minPrice', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            {/* Precio Máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Máx.
              </label>
              <input
                type="number"
                placeholder="9999"
                value={maxPrice}
                onChange={(e) =>
                  handleFilterChange('maxPrice', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            {/* Botón Limpiar Filtros */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchParams('');
                  setCurrentPage(1);
                  setProducts([]);
                  setHasMore(true);
                }}
                className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition duration-200"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Grid de Productos */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Infinite Scroll Sentinel */}
            <div
              ref={observerTarget}
              className="flex justify-center items-center py-8"
            >
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Cargando más productos...</span>
                </div>
              )}
              {!hasMore && products.length > 0 && (
                <p className="text-gray-500 text-center py-4">
                  No hay más productos para mostrar
                </p>
              )}
            </div>
          </>
        ) : (
          !isLoading && (
            <div className="text-center py-16">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray-600 mb-6">
                Intenta ajustar tus filtros de búsqueda
              </p>
              <button
                onClick={() => {
                  setSearchParams('');
                  setCurrentPage(1);
                  setProducts([]);
                  setHasMore(true);
                }}
                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
              >
                Ver todos los productos
              </button>
            </div>
          )
        )}
      </main>
    </div>
  );
};
