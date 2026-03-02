import { IOrderRepository } from "../../../domain/repositories/order.repository";
import { PaginatedOrdersDto, ListOrdersQueryDto } from "../../dtos/order.dto";

export class ListOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(userId: string, query: ListOrdersQueryDto): Promise<PaginatedOrdersDto> {
    const result = await this.orderRepository.findByUserId(userId, {
      page: query.page,
      limit: query.limit
    });

    return {
      data: result.data.map((o) => ({
        id: o.id,
        status: o.status,
        subtotal: o.subtotal,
        tax: o.tax,
        total: o.total,
        shippingAddress: o.shippingAddress,
        createdAt: o.createdAt
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }
}
