import { ICartRepository } from "../../../domain/repositories/cart.repository";
import { CartResponseDto, CartItemResponseDto } from "../../dtos/cart.dto";

export class GetCartUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  async execute(userId: string): Promise<CartResponseDto> {
    const items = await this.cartRepository.findByUserId(userId);

    const mapped: CartItemResponseDto[] = items.map((item) => {
      const price = item.productPrice ?? 0;
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName ?? "Unknown",
        productPrice: price,
        productImageUrl: item.productImageUrl ?? null,
        quantity: item.quantity,
        lineTotal: parseFloat((price * item.quantity).toFixed(2))
      };
    });

    const subtotal = parseFloat(
      mapped.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2)
    );

    return { items: mapped, subtotal };
  }
}
