/**
 * OrderDetailPage
 * Shows full detail of a single order + option to retry payment.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  CreditCard,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "../services/api";
import { useAuthContext } from "../contexts/AuthContext";
import type { Order, PaymentResult } from "../types/order";
import { isPaymentApproved, normalizeOrderStatus } from "../types/order";
import { StatusBadge } from "./OrdersPage";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(price);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data: Order = await apiClient.getOrderById(id);
      setOrder(data);
    } catch {
      setError("No se pudo cargar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    setPaymentLoading(true);
    setPaymentError("");
    setPaymentResult(null);
    try {
      const result: PaymentResult = await apiClient.processPayment(order.id);
      setPaymentResult(result);
      // Refresh order to get updated status
      const updated: Order = await apiClient.getOrderById(order.id);
      setOrder(updated);
    } catch {
      setPaymentError("Error al procesar el pago. Inténtalo de nuevo.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando pedido…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        <ShoppingBag className="h-14 w-14 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pedido no encontrado</h2>
          <p className="text-sm text-muted-foreground mt-1">{error || "No existe este pedido."}</p>
        </div>
        <Link to="/orders" className="text-sm text-primary underline underline-offset-2">
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  const normalizedStatus = normalizeOrderStatus(order.status);
  const canRetryPayment = normalizedStatus === "Pendiente" || normalizedStatus === "PagoFallido";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Mis pedidos</span>
          </button>
          <h1 className="font-serif text-lg font-semibold text-foreground flex-1">
            Pedido <span className="font-mono">#{order.id}</span>
          </h1>
          <button
            onClick={fetchOrder}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            aria-label="Actualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Payment result toast */}
        {paymentResult && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium
          {isPaymentApproved(paymentResult)
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300"
            }`}>
            {paymentResult.message}
          </div>
        )}

        {paymentError && (
          <div className="p-4 rounded-xl border bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300 text-sm">
            {paymentError}
          </div>
        )}

        {/* Status + meta */}
        <div className="rounded-2xl border border-border bg-secondary/40 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Estado</p>
              <div className="mt-1">
                <StatusBadge status={order.status} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Fecha</p>
              <p className="text-sm font-medium text-foreground mt-1">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Shipping address */}
          <div className="flex items-start gap-3 pt-4 border-t border-border">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Dirección de envío</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{order.shippingAddress}</p>
            </div>
          </div>
        </div>

        {/* Line items */}
        {order.items && order.items.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3">Artículos</h2>
            <ul className="rounded-2xl border border-border overflow-hidden divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 p-4 bg-background">
                  <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-5 w-5 text-border" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.productNameSnapshot}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatPrice(item.unitPriceSnapshot)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground shrink-0">
                    {formatPrice(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Totals */}
        <div className="rounded-2xl border border-border bg-secondary/40 p-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA (21%)</span>
            <span className="text-foreground">{formatPrice(order.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 mt-1">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-xl text-foreground">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Retry payment */}
        {canRetryPayment && (
          <div className="space-y-3">
            <button
              onClick={handleRetryPayment}
              disabled={paymentLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
            >
              {paymentLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Procesando pago…</>
              ) : (
                <><CreditCard className="h-4 w-4" /> Reintentar pago</>
              )}
            </button>
          </div>
        )}

        {/* Back link */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al historial de pedidos
        </Link>
      </main>
    </div>
  );
}
