/**
 * CartSheet
 * Slide-over panel that displays cart items.
 * Guests can view the cart freely; login is required only when they hit "Checkout".
 */

import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, Trash2, Minus, Plus, LogIn } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { TAX_RATE } from "../../lib/constants";
import { useAuthContext } from "../../contexts/AuthContext";
import { getImageUrl } from "../../lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

export function CartSheet() {
  const { items, totalItems, subtotal, taxes, total, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen } = useCart();
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (!isAuthenticated) {
      navigate("/login?from=checkout");
    } else {
      navigate("/checkout");
    }
  };

  const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
    try {
      await updateQuantity(productId, newQuantity);
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  const handleRemoveFromCart = async (productId: number) => {
    try {
      await removeFromCart(productId);
    } catch (err) {
      console.error("Failed to remove from cart:", err);
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetTrigger asChild>
        <button
          aria-label={`Carrito (${totalItems} artículos)`}
          className="relative cursor-pointer"
        >
          <ShoppingCart className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md px-4 pb-6">
        <SheetHeader>
          <SheetTitle className="font-serif text-xl tracking-tight">
            Tu carrito{" "}
            {totalItems > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({totalItems} {totalItems === 1 ? "artículo" : "artículos"})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <ShoppingCart className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Tu carrito está vacío</p>
              <p className="text-sm text-muted-foreground mt-1">
                Añade productos para empezar.
              </p>
            </div>
            <Link
              to="/products"
              onClick={() => setIsCartOpen(false)}
              className="text-sm text-accent underline underline-offset-2"
            >
              Ver catálogo
            </Link>
          </div>
        )}

        {/* Cart items */}
        {items.length > 0 && (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-border py-4 -mx-6 px-6">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={getImageUrl(item.imageUrl) || ""}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingCart className="h-6 w-6 text-border" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                      {item.name}
                    </p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
                        aria-label="Reducir cantidad"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveFromCart(item.productId)}
                    className="self-start mt-1 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Eliminar del carrito"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="border-t border-border pt-5 space-y-4">
              {/* Summary breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">IVA ({Math.round(TAX_RATE * 100)}%)</span>
                  <span className="text-foreground">{formatPrice(taxes)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-xl text-foreground">{formatPrice(total)}</span>
                </div>
              </div>

              {!isAuthenticated && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 text-sm">
                  <LogIn className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Inicia sesión para finalizar tu compra. Tus artículos se guardan automáticamente.
                  </span>
                </div>
              )}

              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all text-sm"
              >
                {!isAuthenticated && <LogIn className="h-4 w-4" />}
                {isAuthenticated ? "Finalizar compra" : "Iniciar sesión para pagar"}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
