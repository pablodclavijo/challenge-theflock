import { ICartRepository } from "../../../domain/repositories/cart.repository";
import { IProductRepository } from "../../../domain/repositories/product.repository";
import { CartItemResponseDto } from "../../dtos/cart.dto";
import { AppError, NotFoundError } from "../../../shared/errors/AppError";

export class UpdateCartItemUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(
    userId: string,
    productId: number,
    quantity: number
  ): Promise<CartItemResponseDto> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (quantity > product.stock) {
      throw new AppError(
        `Insufficient stock. Available: ${product.stock}, requested: ${quantity}`,
        409
      );
    }

    const item = await this.cartRepository.updateQuantity(userId, productId, quantity);
    if (!item) {
      throw new NotFoundError("Cart item not found");
    }

    const price = item.productPrice ?? product.price;
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName ?? product.name,
      productPrice: price,
      productImageUrl: item.productImageUrl ?? product.imageUrl,
      quantity: item.quantity,
      lineTotal: parseFloat((price * item.quantity).toFixed(2))
    };
  }
}
