import { IOrderRepository } from "../../../domain/repositories/order.repository";
import { OrderDetailDto } from "../../dtos/order.dto";
import { NotFoundError } from "../../../shared/errors/AppError";

export class GetOrderUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(userId: string, orderId: number): Promise<OrderDetailDto> {
    const order = await this.orderRepository.findById(orderId);

    if (!order || order.userId !== userId) {
      throw new NotFoundError("Order not found");
    }

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
