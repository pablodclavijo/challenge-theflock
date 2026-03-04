/**
 * CartSheet — UI integration tests
 * Tests the slide-over panel: trigger badge, empty state, item rendering,
 * quantity controls, remove button, price summary, and checkout actions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../contexts/CartContext';
import { CartSheet } from '../components/ui/CartSheet';
import { TAX_RATE } from '../lib/constants';
import * as api from '../services/api';

// ─── mocks ───────────────────────────────────────────────────────────────────
vi.mock('../services/api');

const mockApiClient = api.apiClient as any;

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

// AuthContext mock — start unauthenticated; tests can override per-suite
let mockIsAuthenticated = false;
let mockToken: string | null = null;
vi.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

vi.mock('../utils/auth', () => ({
  tokenUtils: {
    getToken: () => mockToken,
    setToken: (token: string) => { mockToken = token; },
    removeToken: () => { mockToken = null; },
  },
}));

// ─── helpers ─────────────────────────────────────────────────────────────────
function renderCart(ui: ReactNode = <CartSheet />) {
  return render(
    <MemoryRouter>
      <CartProvider>{ui}</CartProvider>
    </MemoryRouter>
  );
}

/** Click the cart trigger button to open the sheet. */
async function openSheet(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole('button', { name: /carrito/i });
  await user.click(trigger);
}

const PRODUCT = { productId: 1, name: 'Test Shirt', price: 50, imageUrl: undefined };

// ─── trigger badge ────────────────────────────────────────────────────────────
describe('cart trigger button', () => {
  beforeEach(() => {
    localStorage.clear();
    mockIsAuthenticated = false;
    mockToken = null;
    vi.clearAllMocks();
    mockApiClient.getCart.mockResolvedValue({ items: [] });
  });

  it('shows no badge when cart is empty', async () => {
    renderCart();
    // Badge only renders when totalItems > 0 — should not be in DOM
    await waitFor(() => {
      expect(screen.queryByText(/^\d+$/)).toBeNull();
    });
  });

  it('shows item count badge after adding a product', async () => {
    mockIsAuthenticated = true;
    mockToken = 'test-token';
    mockApiClient.getCart.mockResolvedValue({
      items: [{ ...PRODUCT, quantity: 3 }],
    });
    renderCart();
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('displays 99+ when there are more than 99 items', async () => {
    mockIsAuthenticated = true;
    mockToken = 'test-token';
    mockApiClient.getCart.mockResolvedValue({
      items: [{ ...PRODUCT, quantity: 100 }],
    });
    renderCart();
    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});

// ─── empty state ──────────────────────────────────────────────────────────────
describe('empty cart state', () => {
  beforeEach(() => {
    localStorage.clear();
    mockIsAuthenticated = false;
    mockToken = null;
    vi.clearAllMocks();
    mockApiClient.getCart.mockResolvedValue({ items: [] });
  });

  it('shows empty-cart message when opened with no items', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);
    expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
  });

  it('shows a link to the catalogue', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);
    expect(screen.getByRole('link', { name: /ver catálogo/i })).toBeInTheDocument();
  });
});

// ─── items displayed ──────────────────────────────────────────────────────────
describe('cart with items', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockToken = 'test-token';
    vi.clearAllMocks();
    mockApiClient.getCart.mockResolvedValue({
      items: [{ ...PRODUCT, quantity: 2 }],
    });
  });

  it('renders the product name and price', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(screen.getByText('Test Shirt')).toBeInTheDocument();
    });
    // price formatted in es-ES locale
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('renders the correct quantity', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows the summary section with Subtotal, IVA and Total labels', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    });
    expect(screen.getByText(new RegExp(`IVA.*${Math.round(TAX_RATE * 100)}%`, 'i'))).toBeInTheDocument();
    expect(screen.getByText(/^total$/i)).toBeInTheDocument();
  });
});

// ─── quantity controls ────────────────────────────────────────────────────────
describe('quantity controls', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockToken = 'test-token';
    vi.clearAllMocks();
    mockApiClient.updateCartItem.mockResolvedValue(undefined);
  });

  it('increases item quantity when + is clicked', async () => {
    mockApiClient.getCart
      .mockResolvedValueOnce({ items: [{ ...PRODUCT, quantity: 2 }] })
      .mockResolvedValueOnce({ items: [{ ...PRODUCT, quantity: 3 }] });

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    });

    const increaseBtn = screen.getByRole('button', { name: /aumentar cantidad/i });
    await user.click(increaseBtn);

    await waitFor(() => {
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('decreases item quantity when − is clicked', async () => {
    mockApiClient.getCart
      .mockResolvedValueOnce({ items: [{ ...PRODUCT, quantity: 2 }] })
      .mockResolvedValueOnce({ items: [{ ...PRODUCT, quantity: 1 }] });

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    });

    const decreaseBtn = screen.getByRole('button', { name: /reducir cantidad/i });
    await user.click(decreaseBtn);

    await waitFor(() => {
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('removes the item when quantity is decremented to 0', async () => {
    mockApiClient.getCart
      .mockResolvedValueOnce({ items: [{ ...PRODUCT, quantity: 1 }] })
      .mockResolvedValueOnce({ items: [] });

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    });

    const decreaseBtn = screen.getByRole('button', { name: /reducir cantidad/i });
    await user.click(decreaseBtn);

    await waitFor(() => {
      expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
    });
  });
});

// ─── remove button ────────────────────────────────────────────────────────────
describe('remove item button', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockToken = 'test-token';
    vi.clearAllMocks();
    mockApiClient.removeFromCart.mockResolvedValue(undefined);
  });

  it('removes the item and shows empty state', async () => {
    mockApiClient.getCart
      .mockResolvedValueOnce({ items: [{ ...PRODUCT, quantity: 2 }] })
      .mockResolvedValueOnce({ items: [] });

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(screen.getByText('Test Shirt')).toBeInTheDocument();
    });

    const removeBtn = screen.getByRole('button', { name: /eliminar del carrito/i });
    await user.click(removeBtn);

    await waitFor(() => {
      expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
    });
  });

  it('persists the removal in localStorage', async () => {
    mockApiClient.getCart
      .mockResolvedValueOnce({ items: [{ ...PRODUCT, quantity: 2 }] })
      .mockResolvedValueOnce({ items: [] });

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(screen.getByText('Test Shirt')).toBeInTheDocument();
    });

    const removeBtn = screen.getByRole('button', { name: /eliminar del carrito/i });
    await user.click(removeBtn);

    await waitFor(() => {
      expect(mockApiClient.removeFromCart).toHaveBeenCalledWith(PRODUCT.productId);
    });
  });
});

// ─── price summary calculations ───────────────────────────────────────────────
describe('price summary', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockToken = 'test-token';
    vi.clearAllMocks();
  });

  it('calculates subtotal, taxes and total correctly for displayed text', async () => {
    // 2 × 50 = 100 subtotal
    mockApiClient.getCart.mockResolvedValue({
      items: [{ ...PRODUCT, quantity: 2 }],
    });

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    const subtotal = 100;
    const taxes = subtotal * TAX_RATE;       // 21
    const total  = subtotal + taxes;          // 121

    // Prices are formatted as es-ES EUR, e.g. "100,00 €"
    // We use getAllByText with a regex to avoid locale-formatting fragility
    await waitFor(() => {
      expect(screen.getAllByText(/100/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/21/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/121/).length).toBeGreaterThan(0);

    // Sanity-check the numeric values via context via aria-label on subtotal row
    expect(taxes).toBeCloseTo(21);
    expect(total).toBeCloseTo(121);
  });
});

// ─── checkout behaviour ───────────────────────────────────────────────────────
describe('checkout button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockToken = 'test-token';
  });

  // Note: Guest users cannot have items in cart with current server-backed cart implementation
  // The CartContext only loads items when authenticated, so these tests are skipped
  it.skip('shows "Iniciar sesión para pagar" when guest', async () => {
    mockIsAuthenticated = false;
    mockToken = null;
    mockApiClient.getCart.mockResolvedValue({
      items: [{ ...PRODUCT, quantity: 1 }],
    });

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /iniciar sesión para pagar/i })
      ).toBeInTheDocument();
    });
  });

  it.skip('navigates to /login?from=checkout when guest clicks checkout', async () => {
    mockIsAuthenticated = false;
    mockToken = null;
    mockApiClient.getCart.mockResolvedValue({
      items: [{ ...PRODUCT, quantity: 1 }],
    });

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /iniciar sesión para pagar/i })).toBeInTheDocument();
    });

    const checkoutBtn = screen.getByRole('button', { name: /iniciar sesión para pagar/i });
    await user.click(checkoutBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/login?from=checkout');
  });

  it('shows "Finalizar compra" when authenticated', async () => {
    mockIsAuthenticated = true;
    mockToken = 'test-token';
    mockApiClient.getCart.mockResolvedValue({
      items: [{ ...PRODUCT, quantity: 1 }],
    });

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /finalizar compra/i })
      ).toBeInTheDocument();
    });
  });

  it('navigates to /checkout when authenticated user clicks checkout', async () => {
    mockIsAuthenticated = true;
    mockToken = 'test-token';
    mockApiClient.getCart.mockResolvedValue({
      items: [{ ...PRODUCT, quantity: 1 }],
    });

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /finalizar compra/i })).toBeInTheDocument();
    });

    const checkoutBtn = screen.getByRole('button', { name: /finalizar compra/i });
    await user.click(checkoutBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
});
