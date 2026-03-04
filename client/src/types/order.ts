/**
 * Order Types
 */

export enum OrderStatus {
  Pending = 1,
  Confirmed = 2,
  Shipped = 3,
  Delivered = 4,
  Paid = 5,
  PaymentFailed = 6,
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

export interface PaymentResult {
  orderId: number;
  status: OrderStatus | number;
  transactionId: string;
  message: string;
}

export function isPaymentApproved(result: PaymentResult): boolean {
  return (
    result.status === OrderStatus.Paid ||
    (typeof result.transactionId === 'string' && result.transactionId.includes('approved'))
  );
}
