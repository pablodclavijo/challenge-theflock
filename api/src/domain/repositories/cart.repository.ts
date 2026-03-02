import { CartItem } from "../entities/cart-item";

export interface ICartRepository {
  findByUserId(userId: string): Promise<CartItem[]>;
  findItem(userId: string, productId: number): Promise<CartItem | null>;
  upsert(userId: string, productId: number, quantity: number): Promise<CartItem>;
  updateQuantity(userId: string, productId: number, quantity: number): Promise<CartItem | null>;
  removeItem(userId: string, productId: number): Promise<boolean>;
  clearCart(userId: string): Promise<void>;
}
