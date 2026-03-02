import { CartItem as CartItemModel } from "../models/cartItem.model";
import { Product } from "../models/product.model";
import { ICartRepository } from "../../../../domain/repositories/cart.repository";
import { CartItem } from "../../../../domain/entities/cart-item";

export class SequelizeCartRepository implements ICartRepository {
  async findByUserId(userId: string): Promise<CartItem[]> {
    const rows = await CartItemModel.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "price", "stock", "imageUrl"]
        }
      ],
      order: [["createdAt", "ASC"]]
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findItem(userId: string, productId: number): Promise<CartItem | null> {
    const row = await CartItemModel.findOne({ where: { userId, productId } });
    return row ? this.toDomain(row) : null;
  }

  async upsert(userId: string, productId: number, quantity: number): Promise<CartItem> {
    const [row] = await CartItemModel.upsert({ userId, productId, quantity });
    // reload with product to hydrate snapshot fields
    const loaded = await CartItemModel.findOne({
      where: { userId, productId },
      include: [{ model: Product, as: "product", attributes: ["id", "name", "price", "stock", "imageUrl"] }]
    });
    return this.toDomain(loaded ?? row);
  }

  async updateQuantity(userId: string, productId: number, quantity: number): Promise<CartItem | null> {
    const row = await CartItemModel.findOne({ where: { userId, productId } });
    if (!row) return null;
    row.quantity = quantity;
    await row.save();
    const loaded = await CartItemModel.findOne({
      where: { userId, productId },
      include: [{ model: Product, as: "product", attributes: ["id", "name", "price", "stock", "imageUrl"] }]
    });
    return this.toDomain(loaded ?? row);
  }

  async removeItem(userId: string, productId: number): Promise<boolean> {
    const deleted = await CartItemModel.destroy({ where: { userId, productId } });
    return deleted > 0;
  }

  async clearCart(userId: string): Promise<void> {
    await CartItemModel.destroy({ where: { userId } });
  }

  private toDomain(row: CartItemModel): CartItem {
    const product = (row as unknown as { product?: { name: string; price: number; stock: number; imageUrl: string | null } }).product;
    return {
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      quantity: row.quantity,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      productName: product?.name,
      productPrice: product?.price !== undefined ? Number(product.price) : undefined,
      productStock: product?.stock,
      productImageUrl: product?.imageUrl
    };
  }
}
