import { ICartRepository } from "../../../domain/repositories/cart.repository";
import { IOrderRepository } from "../../../domain/repositories/order.repository";
import { OrderDetailDto } from "../../dtos/order.dto";
import { AppError } from "../../../shared/errors/AppError";

export const TAX_RATE = 0.21; // 21 %

export class CheckoutUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(userId: string, shippingAddress: string): Promise<OrderDetailDto> {
    const cartItems = await this.cartRepository.findByUserId(userId);

    if (cartItems.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    const subtotal = parseFloat(
      cartItems
        .reduce((sum, item) => sum + (item.productPrice ?? 0) * item.quantity, 0)
        .toFixed(2)
    );

    const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const order = await this.orderRepository.create({
      userId,
      shippingAddress,
      subtotal,
      tax,
      total,
      items: cartItems.map((item) => ({
        productId: item.productId,
        productNameSnapshot: item.productName ?? "Unknown",
        unitPriceSnapshot: item.productPrice ?? 0,
        quantity: item.quantity,
        lineTotal: parseFloat(((item.productPrice ?? 0) * item.quantity).toFixed(2))
      }))
    });

    await this.cartRepository.clearCart(userId);

    return {
      id: order.id,
      status: order.status,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      items: (order.items ?? []).map((i) => ({
        id: i.id,
        productId: i.productId,
        productNameSnapshot: i.productNameSnapshot,
        unitPriceSnapshot: i.unitPriceSnapshot,
        quantity: i.quantity,
        lineTotal: i.lineTotal
      }))
    };
  }
}
