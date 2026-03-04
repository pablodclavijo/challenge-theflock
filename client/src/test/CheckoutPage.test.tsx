/**
 * CheckoutPage — integration tests
 * Covers: empty-cart redirect, address step validation, review step display,
 *         successful payment confirmation, rejected payment failure screen,
 *         and API error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderStatus } from '../types/order';

// ─── mocks ───────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

// AuthContext — authenticated by default with a saved address
const mockUser = { id: '1', email: 'test@test.com', fullName: 'Test User', shippingAddress: '123 Main St' };
let mockIsAuthenticated = true;
vi.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: mockUser, isAuthenticated: mockIsAuthenticated }),
}));

// Cart — populated by default; tests can override
let mockCartItems: { productId: number; name: string; price: number; quantity: number }[] = [];
const mockClearCart = vi.fn();
vi.mock('../contexts/CartContext', () => ({
  useCart: () => ({
    items: mockCartItems,
    subtotal: mockCartItems.reduce((s, i) => s + i.price * i.quantity, 0),
    clearCart: mockClearCart,
  }),
}));

// API
const mockCreateOrder = vi.fn();
const mockProcessPayment = vi.fn();
vi.mock('../services/api', () => ({
  apiClient: {
    createOrder: (...args: unknown[]) => mockCreateOrder(...args),
    processPayment: (...args: unknown[]) => mockProcessPayment(...args),
  },
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

const ITEMS = [
  { productId: 1, name: 'Widget', price: 50, quantity: 2 },
];

const ORDER = {
  id: 42,
  status: OrderStatus.Pending,
  subtotal: 100,
  tax: 21,
  total: 121,
  shippingAddress: '123 Main St',
  createdAt: new Date().toISOString(),
  items: [],
};

const PAYMENT_APPROVED = {
  orderId: 42,
  status: OrderStatus.Paid,
  transactionId: 'txn_approved_42_123',
  message: 'Pago aprobado',
};

const PAYMENT_REJECTED = {
  orderId: 42,
  status: OrderStatus.PaymentFailed,
  transactionId: 'txn_rejected_42_456',
  message: 'Pago rechazado por el emisor',
};

function renderCheckout() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ─── empty cart ───────────────────────────────────────────────────────────────

describe('empty cart guard', () => {
  beforeEach(() => {
    mockCartItems = [];
    mockIsAuthenticated = true;
    vi.clearAllMocks();
  });

  it('shows empty-cart message when there are no items', () => {
    renderCheckout();
    expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
  });

  it('shows a link back to the catalogue', () => {
    renderCheckout();
    expect(screen.getByRole('button', { name: /volver al catálogo/i })).toBeInTheDocument();
  });
});

// ─── address step ─────────────────────────────────────────────────────────────

describe('address step', () => {
  beforeEach(() => {
    mockCartItems = [...ITEMS];
    mockIsAuthenticated = true;
    vi.clearAllMocks();
  });

  it('renders the address input', () => {
    renderCheckout();
    expect(screen.getByRole('textbox', { name: /dirección completa/i })).toBeInTheDocument();
  });

  it('shows validation error when continuing with empty address', async () => {
    const user = userEvent.setup();
    renderCheckout();

    // Clear the default address
    const input = screen.getByRole('textbox', { name: /dirección completa/i });
    await user.clear(input);

    await user.click(screen.getByRole('button', { name: /continuar al resumen/i }));

    expect(screen.getByText(/por favor.*direcci/i)).toBeInTheDocument();
  });

  it('prefills address from user profile', () => {
    renderCheckout();
    const input = screen.getByRole('textbox', { name: /dirección completa/i }) as HTMLInputElement;
    expect(input.value).toBe(mockUser.shippingAddress);
  });

  it('navigates to review step when a valid address is provided', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await user.click(screen.getByRole('button', { name: /continuar al resumen/i }));

    expect(screen.getByText(/resumen del pedido/i)).toBeInTheDocument();
  });
});

// ─── review step ─────────────────────────────────────────────────────────────

describe('review step', () => {
  beforeEach(async () => {
    mockCartItems = [...ITEMS];
    mockIsAuthenticated = true;
    vi.clearAllMocks();
  });

  async function goToReview() {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(screen.getByRole('button', { name: /continuar al resumen/i }));
    return user;
  }

  it('shows the shipping address', async () => {
    await goToReview();
    expect(screen.getByText(mockUser.shippingAddress!)).toBeInTheDocument();
  });

  it('renders each cart item name', async () => {
    await goToReview();
    expect(screen.getByText('Widget')).toBeInTheDocument();
  });

  it('shows Subtotal, IVA, and Total labels', async () => {
    await goToReview();
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(/IVA/i)).toBeInTheDocument();
    expect(screen.getByText(/^total$/i)).toBeInTheDocument();
  });

  it('renders the "Confirmar y pagar" button with the total amount', async () => {
    await goToReview();
    // Button includes formatted EUR total — 121,00 € for subtotal=100 + 21% IVA
    expect(screen.getByRole('button', { name: /confirmar y pagar/i })).toBeInTheDocument();
  });

  it('allows going back to address step via Cambiar link', async () => {
    const user = await goToReview();
    const changeLink = screen.getByRole('button', { name: /cambiar/i });
    await user.click(changeLink);
    expect(screen.getByRole('textbox', { name: /dirección completa/i })).toBeInTheDocument();
  });
});

// ─── payment — approved ───────────────────────────────────────────────────────

describe('payment approved flow', () => {
  beforeEach(() => {
    mockCartItems = [...ITEMS];
    mockIsAuthenticated = true;
    vi.clearAllMocks();
    mockCreateOrder.mockResolvedValue(ORDER);
    mockProcessPayment.mockResolvedValue(PAYMENT_APPROVED);
  });

  async function completeCheckout() {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(screen.getByRole('button', { name: /continuar al resumen/i }));
    await user.click(screen.getByRole('button', { name: /confirmar y pagar/i }));
    return user;
  }

  it('calls createOrder with the shipping address', async () => {
    await completeCheckout();
    await waitFor(() => expect(mockCreateOrder).toHaveBeenCalledWith(mockUser.shippingAddress));
  });

  it('calls processPayment with the order id', async () => {
    await completeCheckout();
    await waitFor(() => expect(mockProcessPayment).toHaveBeenCalledWith(ORDER.id));
  });

  it('shows the confirmation screen with order number', async () => {
    await completeCheckout();
    await waitFor(() => expect(screen.getByText(/pedido confirmado/i)).toBeInTheDocument());
    expect(screen.getByText(new RegExp(`#${ORDER.id}`))).toBeInTheDocument();
  });

  it('displays the transaction id', async () => {
    await completeCheckout();
    await waitFor(() => screen.getByText(/pedido confirmado/i));
    expect(screen.getByText(PAYMENT_APPROVED.transactionId)).toBeInTheDocument();
  });

  it('clears the cart on success', async () => {
    await completeCheckout();
    await waitFor(() => screen.getByText(/pedido confirmado/i));
    expect(mockClearCart).toHaveBeenCalledOnce();
  });

  it('shows links to order detail and catalogue', async () => {
    await completeCheckout();
    await waitFor(() => screen.getByText(/pedido confirmado/i));
    expect(screen.getByRole('link', { name: /ver detalle del pedido/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /seguir comprando/i })).toBeInTheDocument();
  });
});

// ─── payment — rejected ───────────────────────────────────────────────────────

describe('payment rejected flow', () => {
  beforeEach(() => {
    mockCartItems = [...ITEMS];
    mockIsAuthenticated = true;
    vi.clearAllMocks();
    mockCreateOrder.mockResolvedValue(ORDER);
    mockProcessPayment.mockResolvedValue(PAYMENT_REJECTED);
  });

  async function completeCheckout() {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(screen.getByRole('button', { name: /continuar al resumen/i }));
    await user.click(screen.getByRole('button', { name: /confirmar y pagar/i }));
    return user;
  }

  /** Wait helper — waits for the failure heading to appear */
  const waitForFailure = () =>
    waitFor(() => screen.getByRole('heading', { name: /pago rechazado/i }));

  it('shows the failure screen', async () => {
    await completeCheckout();
    await waitForFailure();
    expect(screen.getByRole('heading', { name: /pago rechazado/i })).toBeInTheDocument();
  });

  it('shows the rejection message from the API', async () => {
    await completeCheckout();
    await waitForFailure();
    expect(screen.getByText(PAYMENT_REJECTED.message)).toBeInTheDocument();
  });

  it('shows the order number even on failure', async () => {
    await completeCheckout();
    await waitForFailure();
    expect(screen.getByText(new RegExp(`#${ORDER.id}`))).toBeInTheDocument();
  });

  it('does NOT clear the cart on failure', async () => {
    await completeCheckout();
    await waitForFailure();
    expect(mockClearCart).not.toHaveBeenCalled();
  });

  it('shows a link to view the order and retry', async () => {
    await completeCheckout();
    await waitForFailure();
    expect(screen.getByRole('link', { name: /ver pedido y reintentar pago/i })).toBeInTheDocument();
  });
});

// ─── API error handling ───────────────────────────────────────────────────────

describe('API error handling', () => {
  beforeEach(() => {
    mockCartItems = [...ITEMS];
    mockIsAuthenticated = true;
    mockCreateOrder.mockRejectedValue({ response: { data: { error: 'Stock insuficiente' } } });
  });

  it('stays on review step and shows API error message', async () => {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(screen.getByRole('button', { name: /continuar al resumen/i }));
    await user.click(screen.getByRole('button', { name: /confirmar y pagar/i }));

    await waitFor(() =>
      expect(screen.getByText(/stock insuficiente/i)).toBeInTheDocument()
    );
    // Should still be on review step (confirm button visible again)
    expect(screen.getByRole('button', { name: /confirmar y pagar/i })).toBeInTheDocument();
  });
});
