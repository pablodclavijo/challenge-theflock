/**
 * CartContext — unit tests
 * Covers: addToCart, removeFromCart, updateQuantity, clearCart,
 *         derived values (totalItems, subtotal, taxes, total),
 *         and server-side API sync.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from '../contexts/CartContext';
import { TAX_RATE } from '../lib/constants';
import * as api from '../services/api';

// ─── mocks ────────────────────────────────────────────────────────────────────
vi.mock('../services/api');

const mockApiClient = api.apiClient as any;

// Mock AuthContext to provide isAuthenticated = true by default
let mockIsAuthenticated = true;
let mockToken: string | null = 'test-token';
vi.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({ 
    isAuthenticated: mockIsAuthenticated,
    user: null,
  }),
}));

vi.mock('../utils/auth', () => ({
  tokenUtils: {
    getToken: () => mockToken,
    setToken: (token: string) => { mockToken = token; },
    removeToken: () => { mockToken = null; },
  },
}));

// ─── helper ──────────────────────────────────────────────────────────────────
const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

const PRODUCT_A = { productId: 1, name: 'Shirt', price: 10, imageUrl: undefined };
const PRODUCT_B = { productId: 2, name: 'Pants', price: 25, imageUrl: undefined };

// ─── add to cart ─────────────────────────────────────────────────────────────
describe('addToCart', () => {
  beforeEach(() => {
    mockApiClient.getCart.mockResolvedValue({ items: [] });
    mockApiClient.addToCart.mockResolvedValue(undefined);
  });

  it('adds a new product with the given quantity', async () => {
    mockApiClient.getCart
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [{ ...PRODUCT_A, quantity: 2 }] });
    
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addToCart(PRODUCT_A, 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({ ...PRODUCT_A, quantity: 2 });
  });
});

// ─── remove from cart ────────────────────────────────────────────────────────
describe('removeFromCart', () => {
  beforeEach(() => {
    mockApiClient.getCart.mockResolvedValue({ items: [] });
    mockApiClient.removeFromCart.mockResolvedValue(undefined);
  });

  it('removes the correct product', async () => {
    mockApiClient.getCart
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [{ ...PRODUCT_B, quantity: 1 }] });
    
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.removeFromCart(PRODUCT_A.productId);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productId).toBe(PRODUCT_B.productId);
  });
});

// ─── derived values ──────────────────────────────────────────────────────────
describe('derived values (totalItems, subtotal, taxes, total)', () => {
  beforeEach(() => {
    mockApiClient.getCart.mockResolvedValue({
      items: [
        { ...PRODUCT_A, quantity: 2 },
        { ...PRODUCT_B, quantity: 3 },
      ],
    });
  });

  it('calculates totalItems correctly', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.totalItems).toBe(5); // 2 + 3
  });

  it('calculates subtotal correctly', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const expected = 10 * 2 + 25 * 3; // 20 + 75 = 95
    expect(result.current.subtotal).toBe(expected);
  });

  it('calculates total correctly', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const subtotal = 10 * 2 + 25 * 3; // 95
    const taxes = subtotal * TAX_RATE;
    const expected = subtotal + taxes;
    expect(result.current.total).toBe(expected);
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
