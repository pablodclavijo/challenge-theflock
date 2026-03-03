/**
 * PÃ¡gina de Lista de Productos con Infinite Scroll
 * RediseÃ±ada con UI moderna y mobile-first
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { Navbar } from '../components/Navbar';
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const hasActiveFilters = !!(searchQuery || selectedCategory || minPrice || maxPrice);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
      setProducts([]);
      setHasMore(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load categories
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

  // Load products
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

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    loadProducts(1);
  }, [debouncedSearch, selectedCategory, minPrice, maxPrice, loadProducts]);

  // Infinite scroll
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
    if (element) observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
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

  const clearFilters = () => {
    setSearchParams('');
    setCurrentPage(1);
    setProducts([]);
    setHasMore(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-slate-400 mb-3">
              ColecciÃ³n 2026
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Descubre los mejores<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-amber-300">
                productos
              </span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg">
              Explora nuestra selecciÃ³n curada. Calidad garantizada, envÃ­o rÃ¡pido.
            </p>
          </div>

          {/* Hero search */}
          <div className="mt-8 max-w-xl">
            <div className="relative flex items-center">
              <svg className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white/15 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Toolbar */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {isLoading && products.length === 0
                ? 'Cargando...'
                : `${products.length} producto${products.length !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpiar
                </button>
              )}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
                  filtersOpen || hasActiveFilters
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtros
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                )}
              </button>
            </div>
          </div>

          {/* Filter panel */}
          {filtersOpen && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    CategorÃ­a
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  >
                    <option value="">Todas las categorÃ­as</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Precio mÃ­nimo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">â‚¬</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Precio mÃ¡ximo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">â‚¬</span>
                    <input
                      type="number"
                      placeholder="9999"
                      value={maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full py-2.5 px-4 border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-900 text-white px-3 py-1.5 rounded-full">
                  "{searchQuery}"
                  <button onClick={() => handleFilterChange('search', '')} className="hover:text-slate-300 ml-0.5">Ã—</button>
                </span>
              )}
              {selectedCategory && categories.find(c => String(c.id) === selectedCategory) && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-900 text-white px-3 py-1.5 rounded-full">
                  {categories.find(c => String(c.id) === selectedCategory)?.name}
                  <button onClick={() => handleFilterChange('category', '')} className="hover:text-slate-300 ml-0.5">Ã—</button>
                </span>
              )}
              {minPrice && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-900 text-white px-3 py-1.5 rounded-full">
                  Desde â‚¬{minPrice}
                  <button onClick={() => handleFilterChange('minPrice', '')} className="hover:text-slate-300 ml-0.5">Ã—</button>
                </span>
              )}
              {maxPrice && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-900 text-white px-3 py-1.5 rounded-full">
                  Hasta â‚¬{maxPrice}
                  <button onClick={() => handleFilterChange('maxPrice', '')} className="hover:text-slate-300 ml-0.5">Ã—</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && products.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="aspect-square bg-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                  <div className="h-5 bg-slate-100 rounded-full w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Grid â€” 1 col mobile Â· 2 col sm Â· 3 col desktop */}
        {products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={observerTarget} className="flex justify-center items-center py-10">
              {isLoading && (
                <div className="flex items-center gap-3 text-slate-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-slate-700" />
                  <span className="text-sm">Cargando mÃ¡s productosâ€¦</span>
                </div>
              )}
              {!hasMore && products.length > 0 && (
                <div className="inline-flex items-center gap-3 text-slate-400 text-sm">
                  <div className="h-px w-16 bg-slate-200" />
                  Has visto todos los productos
                  <div className="h-px w-16 bg-slate-200" />
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Sin resultados</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">
              No encontramos productos con esos criterios. Prueba ajustando los filtros.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-full transition-colors"
            >
              Ver todos los productos
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            ShopNow
          </div>
          <p className="text-xs text-slate-400">Â© 2026 ShopNow. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

