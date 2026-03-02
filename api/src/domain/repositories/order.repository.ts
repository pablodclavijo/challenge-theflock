import { Order, OrderItem } from "../entities/order";
import { OrderStatus } from "../enums/order-status";

export interface CreateOrderInput {
  userId: string;
  shippingAddress: string;
  subtotal: number;
  tax: number;
  total: number;
  items: Omit<OrderItem, "id" | "orderId">[];
}

export interface OrderFilters {
  page?: number;
  limit?: number;
}

export interface IOrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  findById(id: number): Promise<Order | null>;
  findByUserId(userId: string, filters: OrderFilters): Promise<{ data: Order[]; total: number; page: number; limit: number; totalPages: number }>;
  updateStatus(orderId: number, status: OrderStatus): Promise<void>;
}
