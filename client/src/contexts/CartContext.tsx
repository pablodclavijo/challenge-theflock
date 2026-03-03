/**
 * CartContext
 * Guest-friendly local cart backed by localStorage.
 * Any visitor can add items. Login is only required at checkout.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { TAX_RATE } from "../lib/constants";

const STORAGE_KEY = "shopnow_cart";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  /** Sum of (price × qty) before taxes. */
  subtotal: number;
  /** Taxes = subtotal × TAX_RATE. */
  taxes: number;
  /** Grand total = subtotal + taxes. */
  total: number;
  /** @deprecated Use subtotal instead. */
  totalPrice: number;
  addToCart: (item: Omit<CartItem, "quantity">, qty: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadFromStorage);

  const updateItems = useCallback((next: CartItem[]) => {
    setItems(next);
    saveToStorage(next);
  }, []);

  const addToCart = useCallback(
    (product: Omit<CartItem, "quantity">, qty: number) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.productId);
        const next = existing
          ? prev.map((i) =>
              i.productId === product.productId
                ? { ...i, quantity: i.quantity + qty }
                : i
            )
          : [...prev, { ...product, quantity: qty }];
        saveToStorage(next);
        return next;
      });
    },
    []
  );

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) => {
      const next =
        quantity <= 0
          ? prev.filter((i) => i.productId !== productId)
          : prev.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            );
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    updateItems([]);
  }, [updateItems]);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const subtotal = totalPrice;
  const taxes = useMemo(() => subtotal * TAX_RATE, [subtotal]);
  const total = useMemo(() => subtotal + taxes, [subtotal, taxes]);

  const value = useMemo(
    () => ({
      items,
      totalItems,
      subtotal,
      taxes,
      total,
      totalPrice,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [items, totalItems, subtotal, taxes, total, totalPrice, addToCart, removeFromCart, updateQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
