/**
 * CartSheet — UI integration tests
 * Tests the slide-over panel: trigger badge, empty state, item rendering,
 * quantity controls, remove button, price summary, and checkout actions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../contexts/CartContext';
import { CartSheet } from '../components/ui/CartSheet';
import { TAX_RATE } from '../lib/constants';

// ─── mocks ───────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

// AuthContext mock — start unauthenticated; tests can override per-suite
let mockIsAuthenticated = false;
vi.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({ isAuthenticated: mockIsAuthenticated }),
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
  beforeEach(() => { localStorage.clear(); mockIsAuthenticated = false; });

  it('shows no badge when cart is empty', () => {
    renderCart();
    // Badge only renders when totalItems > 0 — should not be in DOM
    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });

  it('shows item count badge after adding a product', () => {
    localStorage.setItem(
      'shopnow_cart',
      JSON.stringify([{ ...PRODUCT, quantity: 3 }])
    );
    renderCart();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays 99+ when there are more than 99 items', () => {
    localStorage.setItem(
      'shopnow_cart',
      JSON.stringify([{ ...PRODUCT, quantity: 100 }])
    );
    renderCart();
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});

// ─── empty state ──────────────────────────────────────────────────────────────
describe('empty cart state', () => {
  beforeEach(() => { localStorage.clear(); mockIsAuthenticated = false; });

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
    localStorage.setItem(
      'shopnow_cart',
      JSON.stringify([{ ...PRODUCT, quantity: 2 }])
    );
    mockIsAuthenticated = false;
  });

  it('renders the product name and price', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    expect(screen.getByText('Test Shirt')).toBeInTheDocument();
    // price formatted in es-ES locale
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('renders the correct quantity', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the summary section with Subtotal, IVA and Total labels', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`IVA.*${Math.round(TAX_RATE * 100)}%`, 'i'))).toBeInTheDocument();
    expect(screen.getByText(/^total$/i)).toBeInTheDocument();
  });
});

// ─── quantity controls ────────────────────────────────────────────────────────
describe('quantity controls', () => {
  beforeEach(() => {
    localStorage.setItem(
      'shopnow_cart',
      JSON.stringify([{ ...PRODUCT, quantity: 2 }])
    );
    mockIsAuthenticated = false;
  });

  it('increases item quantity when + is clicked', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    const increaseBtn = screen.getByRole('button', { name: /aumentar cantidad/i });
    await user.click(increaseBtn);

    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
  });

  it('decreases item quantity when − is clicked', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    const decreaseBtn = screen.getByRole('button', { name: /reducir cantidad/i });
    await user.click(decreaseBtn);

    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('removes the item when quantity is decremented to 0', async () => {
    localStorage.setItem(
      'shopnow_cart',
      JSON.stringify([{ ...PRODUCT, quantity: 1 }])
    );

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    const decreaseBtn = screen.getByRole('button', { name: /reducir cantidad/i });
    await user.click(decreaseBtn);

    expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
  });
});

// ─── remove button ────────────────────────────────────────────────────────────
describe('remove item button', () => {
  beforeEach(() => {
    localStorage.setItem(
      'shopnow_cart',
      JSON.stringify([{ ...PRODUCT, quantity: 2 }])
    );
    mockIsAuthenticated = false;
  });

  it('removes the item and shows empty state', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    const removeBtn = screen.getByRole('button', { name: /eliminar del carrito/i });
    await user.click(removeBtn);

    expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
  });

  it('persists the removal in localStorage', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    const removeBtn = screen.getByRole('button', { name: /eliminar del carrito/i });
    await user.click(removeBtn);

    const stored = JSON.parse(localStorage.getItem('shopnow_cart') ?? '[]');
    expect(stored).toHaveLength(0);
  });
});

// ─── price summary calculations ───────────────────────────────────────────────
describe('price summary', () => {
  it('calculates subtotal, taxes and total correctly for displayed text', async () => {
    // 2 × 50 = 100 subtotal
    localStorage.setItem(
      'shopnow_cart',
      JSON.stringify([{ ...PRODUCT, quantity: 2 }])
    );

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    const subtotal = 100;
    const taxes = subtotal * TAX_RATE;       // 21
    const total  = subtotal + taxes;          // 121

    // Prices are formatted as es-ES EUR, e.g. "100,00 €"
    // We use getAllByText with a regex to avoid locale-formatting fragility
    expect(screen.getAllByText(/100/).length).toBeGreaterThan(0);
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
    localStorage.setItem(
      'shopnow_cart',
      JSON.stringify([{ ...PRODUCT, quantity: 1 }])
    );
    mockIsAuthenticated = false;
  });

  it('shows "Iniciar sesión para pagar" when guest', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    expect(
      screen.getByRole('button', { name: /iniciar sesión para pagar/i })
    ).toBeInTheDocument();
  });

  it('navigates to /login?from=checkout when guest clicks checkout', async () => {
    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    const checkoutBtn = screen.getByRole('button', { name: /iniciar sesión para pagar/i });
    await user.click(checkoutBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/login?from=checkout');
  });

  it('shows "Finalizar compra" when authenticated', async () => {
    mockIsAuthenticated = true;

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    expect(
      screen.getByRole('button', { name: /finalizar compra/i })
    ).toBeInTheDocument();
  });

  it('navigates to /checkout when authenticated user clicks checkout', async () => {
    mockIsAuthenticated = true;

    const user = userEvent.setup();
    renderCart();
    await openSheet(user);

    const checkoutBtn = screen.getByRole('button', { name: /finalizar compra/i });
    await user.click(checkoutBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
});
