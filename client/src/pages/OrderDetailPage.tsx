/**
 * OrderDetailPage
 * Shows full detail of a single order + option to retry payment.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useGoBack } from "../hooks";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  CreditCard,
  ShoppingBag,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { apiClient } from "../services/api";
import { useAuthContext } from "../contexts/AuthContext";
import type { Order, PaymentResult } from "../types/order";
import { isPaymentApproved, OrderStatus } from "../types/order";
import { StatusBadge } from "./OrdersPage";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

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
  const queryClient = useQueryClient();
  const goBack = useGoBack("/orders");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Silent background re-fetch (no loading spinner)
  const silentFetch = useCallback(async () => {
    if (!id) return;
    try {
      const data: Order = await apiClient.getOrderById(id);
      setOrder(data);
    } catch {
      // ignore poll errors silently
    }
  }, [id]);

  // Start/stop polling based on current status (stop only when Delivered)
  useEffect(() => {
    if (!order) return;
    if (order.status === OrderStatus.Delivered) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(silentFetch, 10_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [order?.status, silentFetch]);

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
      // Invalidate products query to refresh stock numbers if payment succeeded
      if (isPaymentApproved(result)) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }
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
        <button onClick={goBack} className="text-sm text-primary underline underline-offset-2">
          Volver a mis pedidos
        </button>
      </div>
    );
  }

  const canRetryPayment = order.status === OrderStatus.Pending || order.status === OrderStatus.PaymentFailed;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Mis pedidos</span>
          </button>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Pedido <span className="font-mono">#{order.id}</span>
          </h1>
        </div>
        <button
          onClick={fetchOrder}
          className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          aria-label="Actualizar"
        >
          <RefreshCw className="h-4 w-4" />
          {order && order.status !== OrderStatus.Delivered && (
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          )}
        </button>
      </div>

        {/* Payment result toast */}
        {paymentResult && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-sm text-sm
            ${isPaymentApproved(paymentResult)
              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700"
              : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700"
            }`}>
            {isPaymentApproved(paymentResult) ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900 dark:text-green-100">¡Pago aprobado exitosamente!</p>
                  <p className="text-green-700 dark:text-green-300 mt-0.5 text-xs">
                    Tu pedido ha sido confirmado y está siendo procesado.
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 dark:text-red-100">Pago rechazado</p>
                  <p className="text-red-700 dark:text-red-300 mt-0.5 text-xs">{paymentResult.message}</p>
                </div>
              </>
            )}
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
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al historial de pedidos
        </button>
    </main>
  );
}
