import { Transaction } from "sequelize";
import { sequelize } from "../../../database/sequelize";
import { Order as OrderModel } from "../models/order.model";
import { OrderItem as OrderItemModel } from "../models/orderItem.model";
import { IOrderRepository, CreateOrderInput, OrderFilters } from "../../../../domain/repositories/order.repository";
import { Order, OrderItem } from "../../../../domain/entities/order";
import { OrderStatus } from "../../../../domain/enums/order-status";

export class SequelizeOrderRepository implements IOrderRepository {
  async create(input: CreateOrderInput): Promise<Order> {
    const { userId, shippingAddress, subtotal, tax, total, items } = input;

    const order = await sequelize.transaction(async (t: Transaction) => {
      const created = await OrderModel.create(
        { userId, shippingAddress, subtotal, tax, total },
        { transaction: t }
      );

      const orderItems = await OrderItemModel.bulkCreate(
        items.map((item) => ({
          orderId: created.id,
          productId: item.productId,
          productNameSnapshot: item.productNameSnapshot,
          unitPriceSnapshot: item.unitPriceSnapshot,
          quantity: item.quantity,
          lineTotal: item.lineTotal
        })),
        { transaction: t }
      );

      return { order: created, items: orderItems };
    });

    return this.toDomain(order.order, order.items);
  }

  async findById(id: number): Promise<Order | null> {
    const row = await OrderModel.findByPk(id, {
      include: [{ model: OrderItemModel, as: "items" }]
    });
    if (!row) return null;
    const items = (row as unknown as { items?: OrderItemModel[] }).items ?? [];
    return this.toDomain(row, items);
  }

  async findByUserId(
    userId: string,
    filters: OrderFilters
  ): Promise<{ data: Order[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await OrderModel.findAndCountAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit,
      offset
    });

    const total = Number(count);
    return {
      data: rows.map((r) => this.toDomain(r, [])),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateStatus(orderId: number, status: OrderStatus): Promise<void> {
    await OrderModel.update({ status }, { where: { id: orderId } });
  }

  private toDomain(row: OrderModel, items: OrderItemModel[]): Order {
    return {
      id: row.id,
      userId: row.userId,
      status: row.status as OrderStatus,
      subtotal: Number(row.subtotal),
      tax: Number(row.tax),
      total: Number(row.total),
      shippingAddress: row.shippingAddress,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      items: items.map((i) => this.toItemDomain(i))
    };
  }

  private toItemDomain(row: OrderItemModel): OrderItem {
    return {
      id: row.id,
      orderId: row.orderId,
      productId: row.productId,
      productNameSnapshot: row.productNameSnapshot,
      unitPriceSnapshot: Number(row.unitPriceSnapshot),
      quantity: row.quantity,
      lineTotal: Number(row.lineTotal)
    };
  }
}
