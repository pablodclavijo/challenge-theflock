import { OrderStatus } from "../enums/order-status";

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
}
