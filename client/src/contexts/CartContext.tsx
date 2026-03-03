/**
 * CartContext
 * Server-backed cart synced via API.
 * Items are persisted in the database per user.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { apiClient } from "../services/api";
import { TAX_RATE } from "../lib/constants";

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
  addToCart: (item: Omit<CartItem, "quantity">, qty: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Parse API response into items array
  const parseCartResponse = (cartData: any): any[] => {
    if (Array.isArray(cartData)) return cartData;
    if (Array.isArray(cartData?.items)) return cartData.items;
    if (Array.isArray(cartData?.data)) return cartData.data;
    if (Array.isArray(cartData?.cart)) return cartData.cart;
    return [];
  };

  // Ensure price is a number and fetch product details if needed
  const normalizeCartItems = async (data: any[]): Promise<CartItem[]> => {
    if (!Array.isArray(data)) return [];
    
    const normalized = await Promise.all(
      data
        .filter(item => item && typeof item === 'object')
        .map(async (item: any) => {
          const productId = item.productId !== undefined && item.productId !== null ? Number(item.productId) : undefined;
          const quantity = item.quantity !== undefined && item.quantity !== null ? Number(item.quantity) : 0;
          
          // If we already have name and price, use them
          if (item.name && item.price !== undefined && item.price !== null) {
            return {
              productId: productId || 0,
              name: String(item.name),
              price: isNaN(item.price) ? 0 : Number(item.price),
              imageUrl: item.imageUrl || undefined,
              quantity: isNaN(quantity) ? 0 : quantity,
            };
          }

          // Otherwise, fetch product details
          try {
            if (!productId) {
              return {
                productId: 0,
                name: 'Unknown Product',
                price: 0,
                imageUrl: undefined,
                quantity: isNaN(quantity) ? 0 : quantity,
              };
            }
            
            const product = await apiClient.getProductById(productId);
            return {
              productId,
              name: product.name || 'Unknown Product',
              price: Number(product.price) || 0,
              imageUrl: product.imageUrl || undefined,
              quantity: isNaN(quantity) ? 0 : quantity,
            };
          } catch (err) {
            console.error(`Failed to fetch product ${productId}:`, err);
            return {
              productId: productId || 0,
              name: 'Product',
              price: 0,
              imageUrl: undefined,
              quantity: isNaN(quantity) ? 0 : quantity,
            };
          }
        })
    );

    console.log("Normalized cart items:", normalized);
    return normalized;
  };

  // Load cart from server on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        setIsLoading(true);
        const cartData = await apiClient.getCart();
        console.log("Cart data from API:", cartData);
        
        const itemsArray = parseCartResponse(cartData);
        const items = await normalizeCartItems(itemsArray);
        setItems(items);
      } catch (err) {
        console.error("Failed to load cart:", err);
        // Fail silently if not authenticated
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  const addToCart = useCallback(
    async (product: Omit<CartItem, "quantity">, qty: number) => {
      try {
        await apiClient.addToCart(product.productId, qty);
        const cartData = await apiClient.getCart();
        const itemsArray = parseCartResponse(cartData);
        const items = await normalizeCartItems(itemsArray);
        setItems(items);
      } catch (err) {
        console.error("Failed to add to cart:", err);
        throw err;
      }
    },
    []
  );

  const removeFromCart = useCallback(async (productId: number) => {
    try {
      await apiClient.removeFromCart(productId);
      const cartData = await apiClient.getCart();
      const itemsArray = parseCartResponse(cartData);
      const items = await normalizeCartItems(itemsArray);
      setItems(items);
    } catch (err) {
      console.error("Failed to remove from cart:", err);
      throw err;
    }
  }, []);

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId);
      } else {
        await apiClient.updateCartItem(productId, quantity);
        const cartData = await apiClient.getCart();
        const itemsArray = parseCartResponse(cartData);
        const items = await normalizeCartItems(itemsArray);
        setItems(items);
      }
    } catch (err) {
      console.error("Failed to update quantity:", err);
      throw err;
    }
  }, [removeFromCart]);

  const clearCart = useCallback(async () => {
    try {
      // Remove all items from cart
      const itemsToRemove = [...items];
      for (const item of itemsToRemove) {
        await apiClient.removeFromCart(item.productId);
      }
      setItems([]);
    } catch (err) {
      console.error("Failed to clear cart:", err);
      throw err;
    }
  }, [items]);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => {
      const price = Number(i.price) || 0;
      const qty = Number(i.quantity) || 0;
      return sum + (price * qty);
    }, 0),
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
      isLoading,
    }),
    [items, totalItems, subtotal, taxes, total, totalPrice, addToCart, removeFromCart, updateQuantity, clearCart, isLoading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
