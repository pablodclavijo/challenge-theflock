import { Request, Response, NextFunction } from "express";
import { CheckoutSchema, ListOrdersQuerySchema } from "../../../application/dtos/order.dto";
import { CheckoutUseCase } from "../../../application/use-cases/order/checkout.use-case";
import { ListOrdersUseCase } from "../../../application/use-cases/order/list-orders.use-case";
import { GetOrderUseCase } from "../../../application/use-cases/order/get-order.use-case";
import { ProcessPaymentUseCase } from "../../../application/use-cases/order/process-payment.use-case";
import { SequelizeCartRepository } from "../../../infrastructure/persistence/sequelize/repositories/sequelize-cart.repository";
import { SequelizeOrderRepository } from "../../../infrastructure/persistence/sequelize/repositories/sequelize-order.repository";
import { MockPaymentService } from "../../../infrastructure/services/mock-payment.service";
import { AppError } from "../../../shared/errors/AppError";
import { publishOrderCreated } from "../../../infrastructure/messaging/order-created.publisher";

const cartRepository = new SequelizeCartRepository();
const orderRepository = new SequelizeOrderRepository();
const paymentService = new MockPaymentService();

const checkoutUseCase = new CheckoutUseCase(cartRepository, orderRepository);
const listOrdersUseCase = new ListOrdersUseCase(orderRepository);
const getOrderUseCase = new GetOrderUseCase(orderRepository);
const processPaymentUseCase = new ProcessPaymentUseCase(orderRepository, paymentService);

export const orderController = {
  /**
   * @openapi
   * /api/orders:
   *   post:
   *     tags: [Orders]
   *     summary: Checkout — create order from cart
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [shippingAddress]
   *             properties:
   *               shippingAddress: { type: string }
   *     responses:
   *       201:
   *         description: Created order with items
   *       400:
   *         description: Empty cart or validation error
   */
  async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = CheckoutSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues.map((e) => e.message).join(", "));
      }
      const userId = req.user!.sub;
      const result = await checkoutUseCase.execute(userId, parsed.data.shippingAddress);

      // Fire-and-forget: notify Admin via RabbitMQ (non-blocking)
      void publishOrderCreated({
        OrderId:         result.id,
        UserId:          userId,
        Total:           result.total,
        ItemCount:       result.items?.length ?? 0,
        CreatedAt:       result.createdAt.toISOString(),
        ShippingAddress: result.shippingAddress
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @openapi
   * /api/orders:
   *   get:
   *     tags: [Orders]
   *     summary: Buyer's order history (paginated)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *     responses:
   *       200:
   *         description: Paginated order list
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = ListOrdersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues.map((e) => e.message).join(", "));
      }
      const userId = req.user!.sub;
      const result = await listOrdersUseCase.execute(userId, parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @openapi
   * /api/orders/{id}:
   *   get:
   *     tags: [Orders]
   *     summary: Get order detail by ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Order detail with items
   *       404:
   *         description: Not found
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const orderId = parseInt(req.params.id as string, 10);
      if (isNaN(orderId)) {
        throw new AppError("Invalid order ID");
      }
      const result = await getOrderUseCase.execute(userId, orderId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @openapi
   * /api/orders/{id}/payment:
   *   post:
   *     tags: [Orders]
   *     summary: Process payment for an order (mock — 4/5 approve, 1/5 reject)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Payment result
   *       404:
   *         description: Order not found
   */
  async processPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const orderId = parseInt(req.params.id as string, 10);
      if (isNaN(orderId)) {
        throw new AppError("Invalid order ID");
      }
      const result = await processPaymentUseCase.execute(userId, orderId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};
