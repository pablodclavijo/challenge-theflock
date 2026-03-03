/**
 * Order Types
 */

export type OrderStatus =
  | 'Pendiente'
  | 'Pagado'
  | 'PagoFallido'
  | 'Confirmado'
  | 'Enviado'
  | 'Entregado';

// Backend may return numeric enum values instead of strings.
// Mapping derived from observed API responses (5 = Pagado).
const NUMERIC_STATUS_MAP: Record<number, OrderStatus> = {
  0: 'Pendiente',
  1: 'Pendiente',
  2: 'Pagado',
  3: 'PagoFallido',
  4: 'Confirmado',
  5: 'Pagado',
  6: 'Enviado',
  7: 'Entregado',
};

export function normalizeOrderStatus(status: OrderStatus | number | string): OrderStatus {
  if (typeof status === 'number') {
    return NUMERIC_STATUS_MAP[status] ?? 'Pendiente';
  }
  return status as OrderStatus;
}

export interface OrderLineItem {
  id: number;
  productId: number;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: string;
  createdAt: string;
  items?: OrderLineItem[];
}

export interface OrderListResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Numeric status values returned by the backend (enum)
export const PAYMENT_STATUS_PAGADO = 'Pagado';
export const PAYMENT_STATUS_PAGADO_NUM = 5;

export interface PaymentResult {
  orderId: number;
  status: 'Pagado' | 'PagoFallido' | number;
  transactionId: string;
  message: string;
}

export function isPaymentApproved(result: PaymentResult): boolean {
  return (
    result.status === 'Pagado' ||
    result.status === PAYMENT_STATUS_PAGADO_NUM ||
    (typeof result.transactionId === 'string' && result.transactionId.includes('approved'))
  );
}
