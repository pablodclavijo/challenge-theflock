import { IOrderRepository } from "../../../domain/repositories/order.repository";
import { IPaymentService } from "../../ports/payment.port";
import { PaymentResponseDto } from "../../dtos/order.dto";
import { OrderStatus } from "../../../domain/enums/order-status";
import { NotFoundError } from "../../../shared/errors/AppError";

export class ProcessPaymentUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly paymentService: IPaymentService
  ) {}

  async execute(userId: string, orderId: number): Promise<PaymentResponseDto> {
    const order = await this.orderRepository.findById(orderId);

    if (!order || order.userId !== userId) {
      throw new NotFoundError("Order not found");
    }

    const result = await this.paymentService.processPayment(orderId, order.total);

    const newStatus = result.success ? OrderStatus.Paid : OrderStatus.PaymentFailed;
    await this.orderRepository.updateStatus(orderId, newStatus);

    return {
      orderId,
      status: newStatus,
      transactionId: result.transactionId,
      message: result.message
    };
  }
}
