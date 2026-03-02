import { ICartRepository } from "../../../domain/repositories/cart.repository";
import { NotFoundError } from "../../../shared/errors/AppError";

export class RemoveCartItemUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  async execute(userId: string, productId: number): Promise<void> {
    const removed = await this.cartRepository.removeItem(userId, productId);
    if (!removed) {
      throw new NotFoundError("Cart item not found");
    }
  }
}
