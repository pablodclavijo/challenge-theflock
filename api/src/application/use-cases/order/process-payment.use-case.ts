import { IOrderRepository } from "../../../domain/repositories/order.repository";
import { IPaymentService } from "../../ports/payment.port";
import { PaymentResponseDto } from "../../dtos/order.dto";
import { OrderStatus } from "../../../domain/enums/order-status";
import { NotFoundError } from "../../../shared/errors/AppError";
import { IProductRepository } from "../../../domain/repositories/product.repository";

export class ProcessPaymentUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly paymentService: IPaymentService,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(userId: string, orderId: number): Promise<PaymentResponseDto> {
    const order = await this.orderRepository.findById(orderId);

    if (!order || order.userId !== userId) {
      throw new NotFoundError("Order not found");
    }

    const result = await this.paymentService.processPayment(orderId, order.total);

    const newStatus = result.success ? OrderStatus.Paid : OrderStatus.PaymentFailed;
    await this.orderRepository.updateStatus(orderId, newStatus);

    // Decrement stock when payment is approved
    if (result.success && order.items) {
      const stockUpdates = order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));
      
      await this.productRepository.decrementStock(stockUpdates);
    }

    return {
      orderId,
      status: newStatus,
      transactionId: result.transactionId,
      message: result.message
    };
  }
}
