import { ICartRepository } from "../../../domain/repositories/cart.repository";
import { IProductRepository } from "../../../domain/repositories/product.repository";
import { CartItemResponseDto } from "../../dtos/cart.dto";
import { AppError, NotFoundError } from "../../../shared/errors/AppError";

export class AddToCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(
    userId: string,
    productId: number,
    quantity: number
  ): Promise<CartItemResponseDto> {
    // Validate product exists and is active
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Check if item is already in cart; if so, check combined quantity against stock
    const existing = await this.cartRepository.findItem(userId, productId);
    const newQuantity = (existing?.quantity ?? 0) + quantity;

    if (newQuantity > product.stock) {
      throw new AppError(
        `Insufficient stock. Available: ${product.stock}, requested: ${newQuantity}`,
        409
      );
    }

    const item = await this.cartRepository.upsert(userId, productId, newQuantity);

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
