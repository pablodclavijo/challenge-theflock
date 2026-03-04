import amqplib, { ChannelModel, Channel } from "amqplib";

let model: ChannelModel | null = null;

// Shared channel for the consumer (order-status.consumer)
let sharedChannel: Channel | null = null;

async function getModel(url: string): Promise<ChannelModel> {
  if (model) return model;

  model = await amqplib.connect(url);

  model.on("error", (err: Error) => {
    console.error("[RabbitMQ] Connection error:", err.message);
    sharedChannel = null;
    model = null;
  });

  model.on("close", () => {
    console.warn("[RabbitMQ] Connection closed");
    sharedChannel = null;
    model = null;
  });

  console.log("[RabbitMQ] Connected");
  return model;
}

/** Returns (or creates) the shared channel used by the order-status consumer. */
export const getRabbitMQChannel = async (url: string): Promise<Channel> => {
  if (sharedChannel) return sharedChannel;
  const m = await getModel(url);
  sharedChannel = await m.createChannel();
  return sharedChannel;
};

/** Creates a fresh, dedicated channel — use for publishers to avoid
 *  sharing a channel that is already in "consuming" mode. */
export const createDedicatedChannel = async (url: string): Promise<Channel> => {
  const m = await getModel(url);
  return m.createChannel();
};

export const closeRabbitMQ = async (): Promise<void> => {
  try { await sharedChannel?.close(); } catch { /* ignore */ }
  try { await model?.close(); }         catch { /* ignore */ }
};
