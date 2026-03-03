/**
 * OrdersPage — integration tests
 * Covers: unauthenticated redirect, loading state, empty state,
 *         order list rendering, status badges, pagination, and navigation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OrdersPage } from '../pages/OrdersPage';

// ─── mocks ───────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

let mockIsAuthenticated = true;
vi.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

const mockGetOrders = vi.fn();
vi.mock('../services/api', () => ({
  apiClient: { getOrders: (...args: unknown[]) => mockGetOrders(...args) },
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

const BASE_ORDER = {
  subtotal: 100,
  tax: 21,
  total: 121,
  shippingAddress: '42 Oak St',
  createdAt: '2026-01-15T10:00:00.000Z',
};

const ORDERS = [
  { id: 1, status: 'Pendiente',   ...BASE_ORDER },
  { id: 2, status: 'Pagado',      ...BASE_ORDER },
  { id: 3, status: 'PagoFallido', ...BASE_ORDER },
  { id: 4, status: 'Confirmado',  ...BASE_ORDER },
  { id: 5, status: 'Enviado',     ...BASE_ORDER },
  { id: 6, status: 'Entregado',   ...BASE_ORDER },
];

const EMPTY_RESPONSE = { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
const LIST_RESPONSE  = { data: ORDERS, total: 6, page: 1, limit: 10, totalPages: 1 };

function renderOrders() {
  return render(
    <MemoryRouter>
      <OrdersPage />
    </MemoryRouter>
  );
}

// ─── auth redirect ────────────────────────────────────────────────────────────

describe('unauthenticated access', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    vi.clearAllMocks();
  });

  it('redirects to /login when not authenticated', () => {
    renderOrders();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

// ─── loading state ────────────────────────────────────────────────────────────

describe('loading state', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    // Never resolves so we stay in loading
    mockGetOrders.mockReturnValue(new Promise(() => {}));
  });

  it('shows a loading indicator while fetching', () => {
    renderOrders();
    expect(screen.getByText(/cargando pedidos/i)).toBeInTheDocument();
  });
});

// ─── empty state ──────────────────────────────────────────────────────────────

describe('empty orders state', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockGetOrders.mockResolvedValue(EMPTY_RESPONSE);
  });

  it('shows empty message when there are no orders', async () => {
    renderOrders();
    await waitFor(() =>
      expect(screen.getByText(/aún no tienes pedidos/i)).toBeInTheDocument()
    );
  });

  it('shows a link to the catalogue', async () => {
    renderOrders();
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /ir al catálogo/i })).toBeInTheDocument()
    );
  });
});

// ─── order list ───────────────────────────────────────────────────────────────

describe('order list', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockGetOrders.mockResolvedValue(LIST_RESPONSE);
  });

  it('renders all orders', async () => {
    renderOrders();
    await waitFor(() => expect(screen.getByText('#1')).toBeInTheDocument());
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#6')).toBeInTheDocument();
  });

  it('displays total order count', async () => {
    renderOrders();
    await waitFor(() => expect(screen.getByText(/6.*pedidos/i)).toBeInTheDocument());
  });

  it('renders each order as a link to its detail page', async () => {
    renderOrders();
    await waitFor(() => screen.getByText('#1'));
    const links = screen.getAllByRole('link');
    const orderLinks = links.filter((l) => l.getAttribute('href')?.startsWith('/orders/'));
    expect(orderLinks.length).toBeGreaterThanOrEqual(6);
  });
});

// ─── status badges ────────────────────────────────────────────────────────────

describe('status badges', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockGetOrders.mockResolvedValue(LIST_RESPONSE);
  });

  const statuses = [
    ['Pendiente',   /pendiente/i],
    ['Pagado',      /^pagado$/i],
    ['PagoFallido', /pago fallido/i],
    ['Confirmado',  /confirmado/i],
    ['Enviado',     /enviado/i],
    ['Entregado',   /entregado/i],
  ] as const;

  for (const [, pattern] of statuses) {
    it(`renders the "${pattern.source}" badge`, async () => {
      renderOrders();
      await waitFor(() => screen.getByText('#1'));
      expect(screen.getByText(pattern)).toBeInTheDocument();
    });
  }
});

// ─── pagination ───────────────────────────────────────────────────────────────

describe('pagination', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
  });

  it('does not render pagination when there is only one page', async () => {
    mockGetOrders.mockResolvedValue(LIST_RESPONSE);
    renderOrders();
    await waitFor(() => screen.getByText('#1'));
    expect(screen.queryByRole('button', { name: /anterior/i })).toBeNull();
  });

  it('renders pagination controls when there are multiple pages', async () => {
    mockGetOrders.mockResolvedValue({ ...LIST_RESPONSE, totalPages: 3 });
    renderOrders();
    await waitFor(() => screen.getByRole('button', { name: /anterior/i }));
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument();
  });

  it('disables "Anterior" on the first page', async () => {
    mockGetOrders.mockResolvedValue({ ...LIST_RESPONSE, totalPages: 3 });
    renderOrders();
    await waitFor(() => screen.getByRole('button', { name: /anterior/i }));
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
  });

  it('advances to next page when "Siguiente" is clicked', async () => {
    mockGetOrders.mockResolvedValue({ ...LIST_RESPONSE, totalPages: 3 });
    const user = userEvent.setup();
    renderOrders();
    await waitFor(() => screen.getByRole('button', { name: /siguiente/i }));

    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() =>
      expect(mockGetOrders).toHaveBeenCalledWith({ page: 2, limit: 10 })
    );
  });
});

// ─── error state ──────────────────────────────────────────────────────────────

describe('error state', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockGetOrders.mockRejectedValue(new Error('Network error'));
  });

  it('shows an error message on fetch failure', async () => {
    renderOrders();
    await waitFor(() =>
      expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument()
    );
  });

  it('shows a retry button on error', async () => {
    renderOrders();
    await waitFor(() => screen.getByText(/reintentar/i));
    expect(screen.getByText(/reintentar/i)).toBeInTheDocument();
  });
});
