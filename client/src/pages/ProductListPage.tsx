import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  SlidersHorizontal,
  Heart,
  Star,
} from "lucide-react";
import { apiClient } from "../services/api";
import type { Product, Category } from "../types/product";
import { CartSheet } from "../components/ui/CartSheet";

export function ProductListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  const { data: productsResponse, isLoading: loadingProducts } = useQuery({
    queryKey: ["products", searchQuery, selectedCategoryId, minPrice, maxPrice],
    queryFn: () =>
      apiClient.getProducts({
        search: searchQuery || undefined,
        category: selectedCategoryId ?? undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.getCategories(),
  });

  const products: Product[] = productsResponse?.data ?? productsResponse ?? [];

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const getCategoryName = (categoryId: number) =>
    categories.find((c) => c.id === categoryId)?.name ?? "—";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategoryId(null);
    setMinPrice("");
    setMaxPrice("");
    setFiltersOpen(false);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(price);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent" />
              <span className="font-serif text-xl font-bold text-foreground tracking-tight">ShopNow</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <span className="text-sm font-medium text-foreground cursor-pointer">Productos</span>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Colecciones</span>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Nosotros</span>
            </nav>
            <div className="flex items-center gap-4">
              <CartSheet />
              <Link to="/dashboard">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  U
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary-foreground/50 mb-4">
              Coleccion 2026
            </span>
            <h1 className="font-serif text-4xl md:text-6xl font-bold leading-[0.95] tracking-tight mb-5">
              Descubre los mejores{" "}
              <span className="text-accent">productos</span>
            </h1>
            <p className="text-primary-foreground/50 text-base md:text-lg leading-relaxed">
              Explora nuestra seleccion curada. Calidad garantizada, envio rapido.
            </p>
          </div>

          {/* Hero search */}
          <div className="mt-10 max-w-xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-primary-foreground/30 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-primary-foreground/10 backdrop-blur border border-primary-foreground/15 rounded-xl text-primary-foreground placeholder-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent focus:bg-primary-foreground/15 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Toolbar */}
        <div className="flex flex-col gap-5 mb-10">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loadingProducts ? "Cargando..." : `${products.length} producto${products.length !== 1 ? "s" : ""}`}
            </p>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border transition-all ${
                filtersOpen
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-foreground/20"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`shrink-0 text-sm font-medium px-5 py-2 rounded-full border transition-all ${
                selectedCategoryId === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`shrink-0 text-sm font-medium px-5 py-2 rounded-full border transition-all ${
                  selectedCategoryId === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Filter panel */}
          {filtersOpen && (
            <div className="bg-card rounded-2xl border border-border p-6 lg:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Categoria
                  </label>
                  <select
                    value={selectedCategoryId ?? ""}
                    onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition"
                  >
                    <option value="">Todas las categorias</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Precio minimo
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">EUR</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent transition"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Precio maximo
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">EUR</span>
                    <input
                      type="number"
                      placeholder="9999"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent transition"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full py-3 px-4 border border-border text-foreground text-sm font-medium rounded-xl hover:bg-secondary transition"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {loadingProducts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-secondary rounded-2xl mb-5" />
                <div className="h-3 bg-secondary rounded w-1/3 mb-2" />
                <div className="h-4 bg-secondary rounded w-2/3 mb-2" />
                <div className="h-3 bg-secondary rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {!loadingProducts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {products.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="group cursor-pointer">
                <div className="relative aspect-[4/5] bg-secondary rounded-2xl mb-5 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="h-16 w-16 text-border" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500" />
                  {/* Favorite button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(product.id);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 bg-card/80 backdrop-blur rounded-full flex items-center justify-center border border-border hover:bg-card transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Agregar a favoritos"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        favorites.includes(product.id) ? "fill-accent text-accent" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                  {/* Out of stock badge */}
                  {product.stock === 0 && (
                    <div className="absolute top-4 left-4 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-full">
                      Agotado
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                      {getCategoryName(product.categoryId)}
                    </span>
                    <h3 className="font-semibold text-foreground mt-1 group-hover:text-accent transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      <span className="text-xs text-muted-foreground">{product.stock} en stock</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground shrink-0">{formatPrice(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingProducts && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-8">
              <Search className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="font-serif text-xl font-bold text-foreground mb-3">Sin resultados</h3>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm">
              No encontramos productos con esos criterios. Prueba ajustando los filtros.
            </p>
            <button
              onClick={clearFilters}
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-full transition-colors"
            >
              Ver todos los productos
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-accent" />
            <span className="font-serif text-sm font-bold text-foreground">ShopNow</span>
          </div>
          <p className="text-xs text-muted-foreground">&copy; 2026 ShopNow. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
