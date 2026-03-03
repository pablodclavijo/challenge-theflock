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

export interface PaymentResult {
  orderId: number;
  status: 'Pagado' | 'PagoFallido';
  transactionId: string;
  message: string;
}
