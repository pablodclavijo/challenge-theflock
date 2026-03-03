/**
 * CheckoutPage
 * Multi-step checkout: address → review → payment → confirmation
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuthContext } from "../contexts/AuthContext";
import { apiClient } from "../services/api";
import { TAX_RATE } from "../lib/constants";
import type { Order, PaymentResult } from "../types/order";

type Step = "address" | "review" | "processing" | "confirmed" | "failed";

const STEP_ORDER: Step[] = ["address", "review", "processing", "confirmed"];

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "address", label: "Dirección", icon: <MapPin className="h-4 w-4" /> },
    { key: "review", label: "Revisión", icon: <ShoppingBag className="h-4 w-4" /> },
    { key: "confirmed", label: "Confirmación", icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  const currentIndex = STEP_ORDER.indexOf(current);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const stepIndex = STEP_ORDER.indexOf(step.key);
        const done = currentIndex > stepIndex;
        const active = current === step.key || (current === "processing" && idx === 1) || (current === "failed" && idx === 2);

        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${done ? "bg-primary/15 text-primary" : active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className={`h-4 w-4 mx-1 ${done ? "text-primary" : "text-muted-foreground/40"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(price);

export function CheckoutPage() {
  const { user } = useAuthContext();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("address");
  const [shippingAddress, setShippingAddress] = useState(user?.shippingAddress ?? "");
  const [addressError, setAddressError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [apiError, setApiError] = useState("");

  const taxes = subtotal * TAX_RATE;
  const total = subtotal + taxes;

  // Redirect if cart is empty and not already on a final step
  if (items.length === 0 && step !== "confirmed" && step !== "failed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Tu carrito está vacío</h2>
          <p className="text-sm text-muted-foreground mt-1">Añade productos antes de continuar al checkout.</p>
        </div>
        <Link to="/" className="text-sm text-primary underline underline-offset-2">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  /* ─── Step handlers ─── */

  const handleAddressNext = () => {
    if (!shippingAddress.trim()) {
      setAddressError("Por favor, introduce una dirección de envío.");
      return;
    }
    setAddressError("");
    setStep("review");
  };

  const handleConfirmPurchase = async () => {
    setApiError("");
    setStep("processing");
    try {
      // 1. Create order
      const createdOrder: Order = await apiClient.createOrder(shippingAddress);
      setOrder(createdOrder);

      // 2. Process payment
      const paymentResult: PaymentResult = await apiClient.processPayment(createdOrder.id);
      setPayment(paymentResult);

      // 3. Clear server-side cart on success
      if (paymentResult.status === "Pagado") {
        await clearCart();
        setStep("confirmed");
      } else {
        setStep("failed");
      }
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setApiError(axiosErr?.response?.data?.error ?? "Error al procesar el pedido. Inténtalo de nuevo.");
      setStep("review");
    }
  };

  /* ─── Render ─── */

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          {step === "address" ? (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </button>
          ) : step === "review" ? (
            <button
              onClick={() => setStep("address")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dirección</span>
            </button>
          ) : (
            <div />
          )}
          <h1 className="font-serif text-lg font-semibold text-foreground">Checkout</h1>
          <StepIndicator current={step} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">

        {/* ─── STEP 1: ADDRESS ─── */}
        {step === "address" && (
          <div className="max-w-lg mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-serif font-semibold text-foreground">Dirección de envío</h2>
              <p className="text-sm text-muted-foreground mt-1">¿Dónde enviamos tu pedido?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium text-foreground">
                  Dirección completa
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="address"
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => { setShippingAddress(e.target.value); setAddressError(""); }}
                    placeholder="Calle, número, ciudad, código postal…"
                    className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all
                      ${addressError ? "border-destructive ring-1 ring-destructive" : "border-border"}`}
                  />
                </div>
                {addressError && (
                  <p className="text-xs text-destructive">{addressError}</p>
                )}
              </div>
            </div>

            {user?.shippingAddress && user.shippingAddress !== shippingAddress && (
              <button
                type="button"
                onClick={() => setShippingAddress(user.shippingAddress!)}
                className="text-xs text-primary underline underline-offset-2"
              >
                Usar mi dirección guardada: {user.shippingAddress}
              </button>
            )}

            <button
              onClick={handleAddressNext}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all text-sm"
            >
              Continuar al resumen
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ─── STEP 2: REVIEW ─── */}
        {step === "review" && (
          <div className="max-w-lg mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-serif font-semibold text-foreground">Resumen del pedido</h2>
              <p className="text-sm text-muted-foreground mt-1">Revisa tu pedido antes de confirmar.</p>
            </div>

            {/* Shipping address chip */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary border border-border">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Enviar a</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{shippingAddress}</p>
              </div>
              <button
                onClick={() => setStep("address")}
                className="text-xs text-primary underline underline-offset-2 shrink-0"
              >
                Cambiar
              </button>
            </div>

            {/* Items list */}
            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 p-4 bg-background">
                  <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="h-5 w-5 text-border" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-2">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA ({Math.round(TAX_RATE * 100)}%)</span>
                <span className="text-foreground">{formatPrice(taxes)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-xl text-foreground">{formatPrice(total)}</span>
              </div>
            </div>

            {apiError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                {apiError}
              </p>
            )}

            <button
              onClick={handleConfirmPurchase}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all text-sm"
            >
              <CreditCard className="h-4 w-4" />
              Confirmar y pagar {formatPrice(total)}
            </button>
          </div>
        )}

        {/* ─── PROCESSING ─── */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-primary/20"></div>
              <Loader2 className="absolute inset-0 m-auto h-10 w-10 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground text-lg">Procesando tu pedido…</p>
              <p className="text-sm text-muted-foreground mt-1">Por favor, no cierres esta ventana.</p>
            </div>
          </div>
        )}

        {/* ─── CONFIRMED (payment success) ─── */}
        {step === "confirmed" && order && payment && (
          <div className="max-w-lg mx-auto space-y-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-semibold text-foreground">¡Pedido confirmado!</h2>
                <p className="text-sm text-muted-foreground mt-1">Tu pago ha sido aprobado correctamente.</p>
              </div>
            </div>

            {/* Order summary card */}
            <div className="rounded-2xl border border-border bg-secondary/40 p-6 text-left space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Número de pedido</span>
                <span className="font-mono font-bold text-foreground text-lg">#{order.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  Pagado
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID de transacción</span>
                <span className="font-mono text-xs text-muted-foreground">{payment.transactionId}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="font-medium text-foreground">Total pagado</span>
                <span className="font-bold text-xl text-foreground">{formatPrice(order.total)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={`/orders/${order.id}`}
                className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground font-semibold py-3 rounded-xl hover:bg-secondary transition-colors text-sm"
              >
                Ver detalle del pedido
              </Link>
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
              >
                Seguir comprando
              </Link>
            </div>
          </div>
        )}

        {/* ─── FAILED (payment rejected) ─── */}
        {step === "failed" && order && payment && (
          <div className="max-w-lg mx-auto space-y-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-semibold text-foreground">Pago rechazado</h2>
                <p className="text-sm text-muted-foreground mt-1">{payment.message}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-6 text-left space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Número de pedido</span>
                <span className="font-mono font-bold text-foreground text-lg">#{order.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold">
                  <XCircle className="h-3 w-3" />
                  Pago fallido
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-bold text-foreground">{formatPrice(order.total)}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Tu pedido fue creado pero el pago no pudo procesarse. Puedes reintentar el pago desde el historial de pedidos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={`/orders/${order.id}`}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
              >
                Ver pedido y reintentar pago
              </Link>
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground font-semibold py-3 rounded-xl hover:bg-secondary transition-colors text-sm"
              >
                Seguir comprando
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
