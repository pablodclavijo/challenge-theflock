import { createDedicatedChannel } from "./rabbitmq.connection";
import { env } from "../config/env";

const EXCHANGE    = "order_events";
const ROUTING_KEY = "order.created";
const QUEUE       = "admin.order.created";  // pre-declare so messages survive if consumer starts late

export interface OrderCreatedEvent {
  OrderId:         number;
  UserId:          string;
  Total:           number;
  ItemCount:       number;
  CreatedAt:       string;
  ShippingAddress: string;
}

export const publishOrderCreated = async (event: OrderCreatedEvent): Promise<void> => {
  try {
    // Use a dedicated channel — the shared one is in consuming mode for order-status events
    const channel = await createDedicatedChannel(env.rabbitmq.url);
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    // Ensure the queue and binding exist so no messages are lost if the Admin consumer
    // hasn't started yet or restarts
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
    channel.publish(
      EXCHANGE,
      ROUTING_KEY,
      Buffer.from(JSON.stringify(event)),
      { contentType: "application/json", persistent: true }
    );
    console.log(`[RabbitMQ] Published order.created for OrderId=${event.OrderId}`);
    // Close the dedicated channel after publishing — channels are lightweight
    await channel.close();
  } catch (err) {
    console.warn("[RabbitMQ] Could not publish order.created:", (err as Error).message);
  }
};
