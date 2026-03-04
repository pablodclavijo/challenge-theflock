/**
 * OrdersPage
 * Buyer's order history with status badges and pagination.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ChevronRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  PackageCheck,
} from "lucide-react";
import { apiClient } from "../services/api";
import { useAuthContext } from "../contexts/AuthContext";
import type { Order, OrderListResponse } from "../types/order";
import { OrderStatus } from "../types/order";

/* ─── Status helpers ─── */

interface StatusMeta {
  label: string;
  icon: React.ReactNode;
  className: string;
}

function getStatusMeta(status: OrderStatus): StatusMeta {
  switch (status) {
    case OrderStatus.Pending:
      return {
        label: "Pendiente",
        icon: <Clock className="h-3 w-3" />,
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      };
    case OrderStatus.Paid:
      return {
        label: "Pagado",
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      };
    case OrderStatus.PaymentFailed:
      return {
        label: "Pago fallido",
        icon: <XCircle className="h-3 w-3" />,
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      };
    case OrderStatus.Confirmed:
      return {
        label: "Confirmado",
        icon: <PackageCheck className="h-3 w-3" />,
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      };
    case OrderStatus.Shipped:
      return {
        label: "Enviado",
        icon: <Truck className="h-3 w-3" />,
        className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      };
    case OrderStatus.Delivered:
      return {
        label: "Entregado",
        icon: <Package className="h-3 w-3" />,
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      };
  }
}

export function StatusBadge({ status }: { status: OrderStatus | number }) {
  const meta = getStatusMeta(status as OrderStatus);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta?.className ?? 'bg-secondary text-muted-foreground'}`}>
      {meta?.icon}
      {meta?.label ?? String(status)}
    </span>
  );
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

/* ─── Component ─── */

const LIMIT = 10;

export function OrdersPage() {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageRef = useRef(page);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const res: OrderListResponse = await apiClient.getOrders({ page: p, limit: LIMIT });
      setOrders(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setError("No se pudo cargar el historial de pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep pageRef in sync so the polling closure always uses the latest page
  useEffect(() => { pageRef.current = page; }, [page]);

  // Silent background poll — no loading spinner
  const silentFetchOrders = useCallback(async () => {
    try {
      const res: OrderListResponse = await apiClient.getOrders({ page: pageRef.current, limit: LIMIT });
      setOrders(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      // ignore poll errors silently
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchOrders(page);
  }, [isAuthenticated, page, fetchOrders, navigate]);

  // Start polling on mount, stop on unmount
  useEffect(() => {
    if (!isAuthenticated) return;
    pollRef.current = setInterval(silentFetchOrders, 15_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAuthenticated, silentFetchOrders]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Mis pedidos</h1>
          <p className="text-sm text-muted-foreground mt-1">Historial de compras y estado de envíos</p>
        </div>
        <button
          onClick={() => fetchOrders(page)}
          className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          aria-label="Actualizar"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        </button>
      </div>

      <div>
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando pedidos…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20 space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => fetchOrders(page)}
              className="text-sm text-primary underline underline-offset-2"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
              <ShoppingBag className="h-9 w-9 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Aún no tienes pedidos</h2>
              <p className="text-sm text-muted-foreground mt-1">Cuando realices tu primera compra aparecerá aquí.</p>
            </div>
            <Link
              to="/"
              className="text-sm text-primary underline underline-offset-2"
            >
              Ir al catálogo
            </Link>
          </div>
        )}

        {/* Order list */}
        {!loading && !error && orders.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {total} {total === 1 ? "pedido" : "pedidos"} en total
            </p>

            <ul className="space-y-4">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/orders/${order.id}`}
                    className="group flex items-center gap-4 p-5 rounded-2xl border border-border bg-background hover:border-primary/40 hover:bg-secondary/40 transition-all"
                  >
                    {/* Order icon */}
                    <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-foreground">#{order.id}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(order.createdAt)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{order.shippingAddress}</p>
                    </div>

                    {/* Total + chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-foreground">{formatPrice(order.total)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
