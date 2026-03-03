import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  ChevronRight,
  Heart,
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  RotateCcw,
  Shield,
  Check,
} from "lucide-react";
import { apiClient } from "../services/api";
import type { Category } from "../types/product";
import { useCart } from "../contexts/CartContext";
import { CartSheet } from "../components/ui/CartSheet";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"description" | "specs">("description");
  const { addToCart } = useCart();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => apiClient.getProductById(id!),
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.getCategories(),
  });

  const getCategoryName = (categoryId: number) =>
    categories.find((c) => c.id === categoryId)?.name ?? "—";

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(price);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
        },
        quantity
      );
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent" />
              <span className="font-serif text-xl font-bold text-foreground tracking-tight">ShopNow</span>
            </Link>
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

      {/* Loading */}
      {isLoading && (
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
            <div className="aspect-square bg-secondary rounded-3xl animate-pulse" />
            <div className="space-y-4 py-2">
              <div className="h-4 bg-secondary rounded w-1/3 animate-pulse" />
              <div className="h-8 bg-secondary rounded w-2/3 animate-pulse" />
              <div className="h-10 bg-secondary rounded w-1/4 animate-pulse" />
            </div>
          </div>
        </main>
      )}

      {/* Error */}
      {isError && (
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-24 text-center">
          <p className="text-muted-foreground">No se pudo cargar el producto.</p>
          <Link to="/" className="mt-4 inline-block text-accent underline text-sm">Volver al catalogo</Link>
        </main>
      )}

      {product && (
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-10">
            <Link to="/" className="hover:text-foreground transition-colors font-medium cursor-pointer">Productos</Link>
            <ChevronRight className="h-3.5 w-3.5 text-border" />
            <span className="hover:text-foreground transition-colors font-medium cursor-pointer">{getCategoryName(product.categoryId)}</span>
            <ChevronRight className="h-3.5 w-3.5 text-border" />
            <span className="text-foreground font-semibold line-clamp-1">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          {/* Product Image */}
          <div className="group relative bg-secondary rounded-3xl overflow-hidden aspect-square flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <ShoppingBag className="h-28 w-28 text-border transition-transform duration-700 group-hover:scale-110" />
              )}
            {/* Favorite */}
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="absolute top-5 right-5 w-12 h-12 bg-card/80 backdrop-blur rounded-full flex items-center justify-center border border-border hover:bg-card transition-all"
              aria-label="Agregar a favoritos"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isFavorite ? "fill-accent text-accent" : "text-muted-foreground"
                }`}
              />
            </button>
          </div>

          {/* Product Details */}
          <div className="flex flex-col py-2">
            {/* Badge row */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground">
                {getCategoryName(product.categoryId)}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Star className="h-3 w-3 fill-accent" />
                {product.stock > 0 ? `${product.stock} disponibles` : "Agotado"}
              </span>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight tracking-tight text-balance">
              {product.name}
            </h1>

            {/* Price row */}
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-4xl font-bold text-foreground tracking-tight">
                {formatPrice(product.price)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/10 text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                {product.stock} disponibles
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-border mb-8" />

            {/* Tabs */}
            <div className="flex items-center gap-6 mb-6">
              <button
                onClick={() => setSelectedTab("description")}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                  selectedTab === "description"
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Descripcion
              </button>
              <button
                onClick={() => setSelectedTab("specs")}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                  selectedTab === "specs"
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Especificaciones
              </button>
            </div>

            {selectedTab === "description" ? (
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base mb-8">
                {product.description}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: "Codigo", value: `#${product.id}` },
                  { label: "Stock", value: String(product.stock) },
                  { label: "Anadido", value: new Date(product.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) },
                  { label: "Estado", value: product.isActive ? "Activo" : "Inactivo" },
                ].map((spec) => (
                  <div key={spec.label} className="bg-secondary rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{spec.label}</p>
                    <p className="font-bold text-foreground text-sm">{spec.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Perks */}
            <div className="flex flex-col gap-3 mb-8">
              {[
                { icon: Truck, text: "Envio gratuito a partir de 50 EUR" },
                { icon: RotateCcw, text: "Devolucion gratuita en 30 dias" },
                { icon: Shield, text: "Garantia de autenticidad" },
              ].map((perk) => (
                <div key={perk.text} className="flex items-center gap-3">
                  <perk.icon className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-sm text-muted-foreground">{perk.text}</span>
                </div>
              ))}
            </div>

            {/* Cart success toast */}
            {addedToCart && (
              <div className="mb-5 flex items-center gap-3 p-4 bg-accent/10 border border-accent/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">Anadido al carrito</p>
                  <p className="text-muted-foreground text-xs">Tu carrito ha sido actualizado</p>
                </div>
              </div>
            )}

            {/* Add to cart section */}
            <div className="flex items-center gap-4">
              {/* Quantity */}
              <div className="flex items-center bg-secondary rounded-xl overflow-hidden border border-border">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Reducir cantidad"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 h-12 flex items-center justify-center text-sm font-bold text-foreground">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Add to cart button */}
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold rounded-xl transition-all duration-150 text-sm"
              >
                <ShoppingCart className="h-5 w-5" />
                Anadir al carrito
              </button>
            </div>
          </div>
        </div>
      </main>
      )}
    </div>
  );
}
