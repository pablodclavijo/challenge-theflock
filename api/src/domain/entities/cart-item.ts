export interface CartItem {
  id: number;
  userId: string;
  productId: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  // hydrated snapshot from the joined product row
  productName?: string;
  productPrice?: number;
  productStock?: number;
  productImageUrl?: string | null;
}
