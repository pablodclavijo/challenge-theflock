import { z } from "zod";
import { OrderStatus } from "../../domain/enums/order-status";

// ── Request schemas ────────────────────────────────────────────────────────────

export const CheckoutSchema = z.object({
  shippingAddress: z.string().min(1, "shippingAddress is required")
});

export const ListOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

export type CheckoutDto = z.infer<typeof CheckoutSchema>;
export type ListOrdersQueryDto = z.infer<typeof ListOrdersQuerySchema>;

// ── Response types ─────────────────────────────────────────────────────────────

export interface OrderItemResponseDto {
  id: number;
  productId: number;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderSummaryDto {
  id: number;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: string;
  createdAt: Date;
}

export interface OrderDetailDto extends OrderSummaryDto {
  items: OrderItemResponseDto[];
}

export interface PaginatedOrdersDto {
  data: OrderSummaryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentResponseDto {
  orderId: number;
  status: OrderStatus;
  transactionId: string;
  message: string;
}
