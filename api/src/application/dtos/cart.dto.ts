import { z } from "zod";

// ── Request schemas ────────────────────────────────────────────────────────────

export const AddToCartSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1)
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1)
});

export type AddToCartDto = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>;

// ── Response types ─────────────────────────────────────────────────────────────

export interface CartItemResponseDto {
  id: number;
  productId: number;
  productName: string;
  productPrice: number;
  productImageUrl: string | null;
  quantity: number;
  lineTotal: number;
}

export interface CartResponseDto {
  items: CartItemResponseDto[];
  subtotal: number;
}
