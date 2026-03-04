/**
 * OrderDetailPage — integration tests
 * Covers: unauthenticated redirect, loading state, not-found state,
 *         order detail display (line items, totals, status badge),
 *         retry payment (approved & rejected), and payment error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OrderDetailPage } from '../pages/OrderDetailPage';
import { OrderStatus } from '../types/order';

// ─── mocks ───────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '42' }),
  };
});

let mockIsAuthenticated = true;
vi.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

const mockGetOrderById = vi.fn();
const mockProcessPayment = vi.fn();
vi.mock('../services/api', () => ({
  apiClient: {
    getOrderById:     (...args: unknown[]) => mockGetOrderById(...args),
    processPayment:   (...args: unknown[]) => mockProcessPayment(...args),
  },
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

const LINE_ITEMS = [
  { id: 1, productId: 10, productNameSnapshot: 'Widget Pro', unitPriceSnapshot: 50, quantity: 2, lineTotal: 100 },
];

const ORDER_PENDING = {
  id: 42,
  status: OrderStatus.Pending,
  subtotal: 100,
  tax: 21,
  total: 121,
  shippingAddress: '42 Oak Street',
  createdAt: '2026-01-15T10:00:00.000Z',
  items: LINE_ITEMS,
};

const ORDER_PAID = { ...ORDER_PENDING, status: OrderStatus.Paid };
const ORDER_FAILED = { ...ORDER_PENDING, status: OrderStatus.PaymentFailed };
const ORDER_SHIPPED = { ...ORDER_PENDING, status: OrderStatus.Shipped };

const PAYMENT_APPROVED = {
  orderId: 42, status: OrderStatus.Paid,
  transactionId: 'txn_approved_42_123', message: 'Pago aprobado',
};

const PAYMENT_REJECTED = {
  orderId: 42, status: OrderStatus.PaymentFailed,
  transactionId: 'txn_rejected_42_456', message: 'Pago rechazado por el emisor',
};

function renderDetail() {
  return render(
    <MemoryRouter>
      <OrderDetailPage />
    </MemoryRouter>
  );
}

// ─── auth redirect ────────────────────────────────────────────────────────────

describe('unauthenticated access', () => {
  beforeEach(() => { mockIsAuthenticated = false; vi.clearAllMocks(); });

  it('redirects to /login', () => {
    renderDetail();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

// ─── loading state ────────────────────────────────────────────────────────────

describe('loading state', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockGetOrderById.mockReturnValue(new Promise(() => {}));
  });

  it('shows a loading indicator', () => {
    renderDetail();
    expect(screen.getByText(/cargando pedido/i)).toBeInTheDocument();
  });
});

// ─── not found / error ────────────────────────────────────────────────────────

describe('order not found', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockGetOrderById.mockRejectedValue(new Error('404'));
  });

  it('shows a not-found message', async () => {
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText(/pedido no encontrado/i)).toBeInTheDocument()
    );
  });

  it('shows a link back to orders history', async () => {
    renderDetail();
    await waitFor(() => screen.getByText(/pedido no encontrado/i));
    expect(screen.getByRole('button', { name: /volver a mis pedidos/i })).toBeInTheDocument();
  });
});

// ─── order detail display ─────────────────────────────────────────────────────

describe('order detail display', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockGetOrderById.mockResolvedValue(ORDER_PAID);
  });

  it('renders the order number in the header', async () => {
    renderDetail();
    await waitFor(() => screen.getByText(/#42/));
    expect(screen.getAllByText(/#42/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the shipping address', async () => {
    renderDetail();
    await waitFor(() => screen.getByText(ORDER_PAID.shippingAddress));
    expect(screen.getByText(ORDER_PAID.shippingAddress)).toBeInTheDocument();
  });

  it('renders each line item name', async () => {
    renderDetail();
    await waitFor(() => screen.getByText('Widget Pro'));
    expect(screen.getByText('Widget Pro')).toBeInTheDocument();
  });

  it('renders subtotal, IVA, and total rows', async () => {
    renderDetail();
    await waitFor(() => screen.getByText(/subtotal/i));
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(/IVA/i)).toBeInTheDocument();
    expect(screen.getByText(/^total$/i)).toBeInTheDocument();
  });

  it('shows the status badge', async () => {
    renderDetail();
    await waitFor(() => screen.getByText(/^pagado$/i));
    expect(screen.getByText(/^pagado$/i)).toBeInTheDocument();
  });
});

// ─── retry payment button visibility ─────────────────────────────────────────

describe('retry payment button visibility', () => {
  beforeEach(() => { mockIsAuthenticated = true; });

  it('shows retry button when status is Pendiente', async () => {
    mockGetOrderById.mockResolvedValue(ORDER_PENDING);
    renderDetail();
    await waitFor(() => screen.getByRole('button', { name: /reintentar pago/i }));
    expect(screen.getByRole('button', { name: /reintentar pago/i })).toBeInTheDocument();
  });

  it('shows retry button when status is PagoFallido', async () => {
    mockGetOrderById.mockResolvedValue(ORDER_FAILED);
    renderDetail();
    await waitFor(() => screen.getByRole('button', { name: /reintentar pago/i }));
    expect(screen.getByRole('button', { name: /reintentar pago/i })).toBeInTheDocument();
  });

  it('hides retry button when status is Pagado', async () => {
    mockGetOrderById.mockResolvedValue(ORDER_PAID);
    renderDetail();
    await waitFor(() => screen.getByText(/#42/));
    expect(screen.queryByRole('button', { name: /reintentar pago/i })).toBeNull();
  });

  it('hides retry button when status is Enviado', async () => {
    mockGetOrderById.mockResolvedValue(ORDER_SHIPPED);
    renderDetail();
    await waitFor(() => screen.getByText(/#42/));
    expect(screen.queryByRole('button', { name: /reintentar pago/i })).toBeNull();
  });
});

// ─── retry payment — approved ─────────────────────────────────────────────────

describe('retry payment — approved', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockGetOrderById
      .mockResolvedValueOnce(ORDER_PENDING)  // initial load
      .mockResolvedValueOnce(ORDER_PAID);    // after payment refresh
    mockProcessPayment.mockResolvedValue(PAYMENT_APPROVED);
  });

  it('calls processPayment with the order id', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => screen.getByRole('button', { name: /reintentar pago/i }));
    await user.click(screen.getByRole('button', { name: /reintentar pago/i }));
    await waitFor(() => expect(mockProcessPayment).toHaveBeenCalledWith(42));
  });

  it('shows approval success message', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => screen.getByRole('button', { name: /reintentar pago/i }));
    await user.click(screen.getByRole('button', { name: /reintentar pago/i }));
    await waitFor(() =>
      expect(screen.getByText(PAYMENT_APPROVED.message)).toBeInTheDocument()
    );
  });

  it('refreshes the order after payment and hides retry button', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => screen.getByRole('button', { name: /reintentar pago/i }));
    await user.click(screen.getByRole('button', { name: /reintentar pago/i }));
    // After refresh the order is Pagado — no retry button
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /reintentar pago/i })).toBeNull()
    );
  });
});

// ─── retry payment — rejected ─────────────────────────────────────────────────

describe('retry payment — rejected', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockGetOrderById
      .mockResolvedValueOnce(ORDER_PENDING)
      .mockResolvedValueOnce(ORDER_FAILED);
    mockProcessPayment.mockResolvedValue(PAYMENT_REJECTED);
  });

  it('shows rejection message', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => screen.getByRole('button', { name: /reintentar pago/i }));
    await user.click(screen.getByRole('button', { name: /reintentar pago/i }));
    await waitFor(() =>
      expect(screen.getByText(PAYMENT_REJECTED.message)).toBeInTheDocument()
    );
  });

  it('still shows retry button after rejection', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => screen.getByRole('button', { name: /reintentar pago/i }));
    await user.click(screen.getByRole('button', { name: /reintentar pago/i }));
    await waitFor(() => screen.getByText(PAYMENT_REJECTED.message));
    expect(screen.getByRole('button', { name: /reintentar pago/i })).toBeInTheDocument();
  });
});

// ─── payment API error ────────────────────────────────────────────────────────

describe('payment API error', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockGetOrderById.mockResolvedValue(ORDER_PENDING);
    mockProcessPayment.mockRejectedValue(new Error('Network error'));
  });

  it('shows an error message when payment API fails', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => screen.getByRole('button', { name: /reintentar pago/i }));
    await user.click(screen.getByRole('button', { name: /reintentar pago/i }));
    await waitFor(() =>
      expect(screen.getByText(/error al procesar el pago/i)).toBeInTheDocument()
    );
  });
});
