"use client";

import { ArrowRight, ShoppingBag, Star, Truck, Shield, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../services/api";
import type { Category } from "../types/product";

export function HomePage() {
  const { data: productsResponse } = useQuery({
    queryKey: ["products", null, null, null, null],
    queryFn: () => apiClient.getProducts({ limit: 3 }),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.getCategories(),
  });

  const featuredProducts = (productsResponse?.data ?? productsResponse ?? []).slice(0, 3);

  const getCategoryName = (categoryId: number) =>
    categories.find((c: Category) => c.id === categoryId)?.name ?? "—";

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(price);
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent" />
              <span className="font-serif text-xl font-bold text-foreground tracking-tight">ShopNow</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Productos</span>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Colecciones</span>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Nosotros</span>
            </nav>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer hidden sm:inline">
                Iniciar Sesion
              </span>
              <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
                Crear Cuenta
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-44 lg:pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-6">
              Coleccion 2026
            </span>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[0.95] tracking-tight mb-8 text-balance">
              Donde el estilo
              <br />
              <span className="text-accent">se encuentra</span>
              <br />
              con la calidad
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-xl mb-12">
              Descubre productos seleccionados con mimo, con materiales de primera calidad y un diseno que habla por si solo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <span className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-10 py-4 rounded-full text-sm font-semibold hover:opacity-90 transition-all cursor-pointer">
                Explorar Catalogo
                <ArrowRight className="h-4 w-4" />
              </span>
              <span className="inline-flex items-center justify-center gap-3 border border-border text-foreground px-10 py-4 rounded-full text-sm font-semibold hover:bg-secondary transition-all cursor-pointer">
                Ver Colecciones
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="px-6 lg:px-8 pb-20 lg:pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: "Envio Gratuito", desc: "En pedidos superiores a 50EUR" },
              { icon: Shield, title: "Garantia de Calidad", desc: "Devolucion gratuita en 30 dias" },
              { icon: Star, title: "Productos Premium", desc: "Seleccion curada cuidadosamente" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-5 p-6 lg:p-8 bg-card rounded-2xl border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="px-6 lg:px-8 pb-20 lg:pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-3 block">Destacados</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Lo mas buscado
              </h2>
            </div>
            <span className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-colors cursor-pointer">
              Ver todo
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {featuredProducts.map((product: any) => (
              <Link key={product.id} to={`/products/${product.id}`} className="group cursor-pointer">
                <div className="aspect-[4/5] bg-secondary rounded-2xl mb-5 overflow-hidden relative">
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
                </div>
                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  {getCategoryName(product.categoryId)}
                </span>
                <h3 className="font-semibold text-foreground mt-1.5 mb-2 group-hover:text-accent transition-colors">{product.name}</h3>
                <p className="text-sm font-bold text-foreground">{formatPrice(product.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 lg:px-8 pb-20 lg:pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary rounded-3xl p-12 md:p-20 text-center">
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground mb-5 text-balance">
              Unete a nuestra comunidad
            </h2>
            <p className="text-primary-foreground/60 text-base md:text-lg max-w-md mx-auto mb-10">
              Recibe acceso anticipado a nuevas colecciones y ofertas exclusivas.
            </p>
            <span className="inline-flex items-center gap-3 bg-accent text-accent-foreground px-10 py-4 rounded-full text-sm font-semibold hover:opacity-90 transition-all cursor-pointer">
              Crear Cuenta Gratis
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-accent" />
              <span className="font-serif text-sm font-bold text-foreground">ShopNow</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Privacidad</span>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Terminos</span>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Contacto</span>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; 2026 ShopNow. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
