import { getRabbitMQChannel } from "./rabbitmq.connection";
import { SequelizeOrderRepository } from "../persistence/sequelize/repositories/sequelize-order.repository";
import { OrderStatus } from "../../domain/enums/order-status";
import { env } from "../config/env";

const EXCHANGE    = "order_events";
const ROUTING_KEY = "order.status.changed";
const QUEUE       = "api.order.status.changed";

interface OrderStatusChangedEvent {
  OrderId:   number;
  OldStatus: number;
  NewStatus: number;
  ChangedBy: string;
  Timestamp: string;
}

export const startOrderStatusConsumer = async (): Promise<void> => {
  try {
    const channel = await getRabbitMQChannel(env.rabbitmq.url);

    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    const { queue } = await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(queue, EXCHANGE, ROUTING_KEY);
    await channel.prefetch(1);

    const orderRepository = new SequelizeOrderRepository();

    console.log(`[RabbitMQ] Consuming queue: ${QUEUE}`);

    await channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const payload: OrderStatusChangedEvent = JSON.parse(msg.content.toString());

        console.log(
          `[RabbitMQ] Order ${payload.OrderId} status: ${payload.OldStatus} -> ${payload.NewStatus}`
        );

        await orderRepository.updateStatus(payload.OrderId, payload.NewStatus as OrderStatus);

        channel.ack(msg);
      } catch (err) {
        console.error("[RabbitMQ] Failed to process message:", err);
        channel.nack(msg, false, false); // dead-letter, do not re-queue
      }
    });
  } catch (err) {
    console.warn("[RabbitMQ] Consumer unavailable – order sync disabled:", (err as Error).message);
  }
};
