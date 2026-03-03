import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  ShoppingCart,
  Heart,
  MapPin,
  ChevronRight,
  Package,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";
import { apiClient } from "../services/api";
import { useAuthContext } from "../contexts/AuthContext";

export function DashboardPage() {
  const { user, logout } = useAuthContext();

  const { data: ordersResponse, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiClient.getOrders({ limit: 5 }),
  });

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiClient.getCart(),
  });

  const orders = ordersResponse?.data ?? ordersResponse ?? [];
  const cartCount = cartData?.items?.length ?? cartData?.length ?? 0;

  const totalSpent = orders
    .filter((o: any) => o.status === "paid" || o.status === "delivered" || o.status === "Entregado")
    .reduce((sum: number, o: any) => sum + (o.total ?? o.totalAmount ?? 0), 0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(price);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      paid: "Pagado",
      pending: "Pendiente",
      delivered: "Entregado",
      cancelled: "Cancelado",
      shipped: "En camino",
    };
    return map[status] ?? status;
  };

  const isDelivered = (status: string) =>
    status === "delivered" || status === "paid" || status === "Entregado";
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
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Productos</span>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Colecciones</span>
            </nav>
            <div className="flex items-center gap-4">
              <span className="relative cursor-pointer">
                <ShoppingCart className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </span>
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold">
                {user?.fullName?.charAt(0) ?? "U"}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 md:py-16">
        {/* Page header */}
        <div className="mb-12">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-3 block">Mi cuenta</span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Hola, {user?.fullName?.split(" ")[0] ?? ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Bienvenido a tu panel de cuenta.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Profile + Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile card */}
            <div className="bg-card rounded-2xl border border-border p-7 shadow-sm">
              <div className="flex flex-col items-center text-center mb-7">
                <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-accent font-serif font-bold text-2xl mb-4">
                  {user?.fullName?.charAt(0) ?? "U"}
                </div>
                <h2 className="text-base font-bold text-foreground">{user?.fullName}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
              </div>

              <div className="space-y-4 pt-5 border-t border-border">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Direccion</p>
                    <p className="text-sm text-foreground">{user?.shippingAddress ?? "Sin dirección guardada"}</p>
                  </div>
                </div>
              </div>

              <button className="mt-7 w-full py-3 px-4 border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-secondary transition flex items-center justify-center gap-2">
                <Settings className="h-4 w-4" />
                Editar Perfil
              </button>
            </div>

            {/* Quick actions */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <Link
                to="/"
                className="w-full flex items-center gap-4 p-5 hover:bg-secondary transition group text-left border-b border-border"
              >
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">Explorar productos</p>
                  <p className="text-xs text-muted-foreground">Navega nuestro catalogo</p>
                </div>
                <ChevronRight className="w-4 h-4 text-border group-hover:text-muted-foreground transition-colors shrink-0" />
              </Link>
              <button className="w-full flex items-center gap-4 p-5 hover:bg-secondary transition group text-left border-b border-border">
                <div className="w-10 h-10 bg-accent text-accent-foreground rounded-xl flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">Ver carrito</p>
                  <p className="text-xs text-muted-foreground">Revisa tus productos</p>
                </div>
                <ChevronRight className="w-4 h-4 text-border group-hover:text-muted-foreground transition-colors shrink-0" />
              </button>
              <button className="w-full flex items-center gap-4 p-5 hover:bg-secondary transition group text-left border-b border-border">
                <div className="w-10 h-10 bg-secondary text-foreground rounded-xl flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">Lista de deseos</p>
                  <p className="text-xs text-muted-foreground">Tus productos favoritos</p>
                </div>
                <ChevronRight className="w-4 h-4 text-border group-hover:text-muted-foreground transition-colors shrink-0" />
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-4 p-5 hover:bg-destructive/5 transition group text-left"
              >
                <div className="w-10 h-10 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-destructive text-sm">Cerrar sesion</p>
                </div>
              </button>
            </div>
          </div>

          {/* Right column: Orders + Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Pedidos", value: String(orders.length), icon: Package },
                { label: "Gastado", value: formatPrice(totalSpent), icon: CreditCard },
                { label: "En carrito", value: String(cartCount), icon: ShoppingCart },
                { label: "Favoritos", value: "0", icon: Heart },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            <div className="bg-card rounded-2xl border border-border shadow-sm">
              <div className="flex items-center justify-between p-6 pb-0">
                <h2 className="font-serif text-lg font-bold text-foreground">Pedidos recientes</h2>
                <span className="text-sm text-accent font-medium hover:underline cursor-pointer flex items-center gap-1">
                  Ver todos
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="p-6 pt-4">
                {loadingOrders ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No tienes pedidos aun.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order: any) => (
                      <div
                        key={order.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors cursor-pointer group"
                      >
                        <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground text-sm">#{order.id}</p>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isDelivered(order.status)
                                  ? "bg-accent/10 text-accent"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {statusLabel(order.status)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {order.createdAt ? formatDate(order.createdAt) : ""}
                            {order.items?.length ? ` · ${order.items.length} artículo${order.items.length !== 1 ? "s" : ""}` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-foreground text-sm">
                            {formatPrice(order.total ?? order.totalAmount ?? 0)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-border group-hover:text-muted-foreground transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CTA banner */}
            <div className="bg-primary rounded-2xl p-10 text-center text-primary-foreground">
              <p className="font-serif text-lg font-bold mb-2">Mas funciones proximamente</p>
              <p className="text-primary-foreground/50 text-sm">Gestion de pedidos, lista de deseos y mucho mas.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
