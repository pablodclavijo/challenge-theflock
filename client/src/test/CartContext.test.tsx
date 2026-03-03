/**
 * CartContext — unit tests
 * Covers: addToCart, removeFromCart, updateQuantity, clearCart,
 *         derived values (totalItems, subtotal, taxes, total),
 *         and localStorage persistence.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from '../contexts/CartContext';
import { TAX_RATE } from '../lib/constants';

// ─── helper ──────────────────────────────────────────────────────────────────
const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

const PRODUCT_A = { productId: 1, name: 'Shirt', price: 10, imageUrl: undefined };
const PRODUCT_B = { productId: 2, name: 'Pants', price: 25, imageUrl: undefined };

// ─── add to cart ─────────────────────────────────────────────────────────────
describe('addToCart', () => {
  it('adds a new product with the given quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 2));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({ ...PRODUCT_A, quantity: 2 });
  });

  it('increments quantity when the same product is added again', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 1));
    act(() => result.current.addToCart(PRODUCT_A, 3));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(4);
  });

  it('adds multiple distinct products as separate items', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 1));
    act(() => result.current.addToCart(PRODUCT_B, 2));

    expect(result.current.items).toHaveLength(2);
  });
});

// ─── remove from cart ────────────────────────────────────────────────────────
describe('removeFromCart', () => {
  it('removes the correct product', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 1));
    act(() => result.current.addToCart(PRODUCT_B, 1));
    act(() => result.current.removeFromCart(PRODUCT_A.productId));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productId).toBe(PRODUCT_B.productId);
  });

  it('cart becomes empty when the only item is removed', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 1));
    act(() => result.current.removeFromCart(PRODUCT_A.productId));

    expect(result.current.items).toHaveLength(0);
  });
});

// ─── update quantity ─────────────────────────────────────────────────────────
describe('updateQuantity', () => {
  it('updates the quantity for a given product', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 1));
    act(() => result.current.updateQuantity(PRODUCT_A.productId, 5));

    expect(result.current.items[0].quantity).toBe(5);
  });

  it('removes the item when quantity is set to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 3));
    act(() => result.current.updateQuantity(PRODUCT_A.productId, 0));

    expect(result.current.items).toHaveLength(0);
  });

  it('removes the item when quantity is negative', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 3));
    act(() => result.current.updateQuantity(PRODUCT_A.productId, -1));

    expect(result.current.items).toHaveLength(0);
  });
});

// ─── clear cart ──────────────────────────────────────────────────────────────
describe('clearCart', () => {
  it('removes all items', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 2));
    act(() => result.current.addToCart(PRODUCT_B, 1));
    act(() => result.current.clearCart());

    expect(result.current.items).toHaveLength(0);
  });
});

// ─── derived values ──────────────────────────────────────────────────────────
describe('derived values (totalItems, subtotal, taxes, total)', () => {
  beforeEach(() => localStorage.clear());

  it('totalItems sums quantities across all products', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 2)); // qty 2
    act(() => result.current.addToCart(PRODUCT_B, 3)); // qty 3

    expect(result.current.totalItems).toBe(5);
  });

  it('subtotal is price × quantity summed across all items', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    // 10 × 2 + 25 × 1 = 45
    act(() => result.current.addToCart(PRODUCT_A, 2));
    act(() => result.current.addToCart(PRODUCT_B, 1));

    expect(result.current.subtotal).toBeCloseTo(45);
  });

  it('taxes = subtotal × TAX_RATE', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 2)); // subtotal = 20

    expect(result.current.taxes).toBeCloseTo(20 * TAX_RATE);
  });

  it('total = subtotal + taxes', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 2)); // subtotal = 20

    const expected = 20 + 20 * TAX_RATE;
    expect(result.current.total).toBeCloseTo(expected);
  });

  it('all derived values reset to 0 after clearCart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 3));
    act(() => result.current.clearCart());

    expect(result.current.totalItems).toBe(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.taxes).toBe(0);
    expect(result.current.total).toBe(0);
  });
});

// ─── localStorage persistence ─────────────────────────────────────────────────
describe('localStorage persistence', () => {
  it('saves cart to localStorage on addToCart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 3));

    const stored = JSON.parse(localStorage.getItem('shopnow_cart') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ productId: 1, quantity: 3 });
  });

  it('reads persisted cart from localStorage on mount', () => {
    // Pre-populate localStorage before mounting the hook
    localStorage.setItem(
      'shopnow_cart',
      JSON.stringify([{ ...PRODUCT_A, quantity: 7 }])
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(7);
  });

  it('clears localStorage on clearCart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(PRODUCT_A, 2));
    act(() => result.current.clearCart());

    const stored = JSON.parse(localStorage.getItem('shopnow_cart') ?? '[]');
    expect(stored).toHaveLength(0);
  });
});

// ─── error boundary ───────────────────────────────────────────────────────────
describe('useCart outside provider', () => {
  it('throws when used outside CartProvider', () => {
    expect(() => renderHook(() => useCart())).toThrow(
      'useCart must be used within a CartProvider'
    );
  });
});
