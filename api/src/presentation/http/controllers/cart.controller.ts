import { Request, Response, NextFunction } from "express";
import { AddToCartSchema, UpdateCartItemSchema } from "../../../application/dtos/cart.dto";
import { GetCartUseCase } from "../../../application/use-cases/cart/get-cart.use-case";
import { AddToCartUseCase } from "../../../application/use-cases/cart/add-to-cart.use-case";
import { UpdateCartItemUseCase } from "../../../application/use-cases/cart/update-cart-item.use-case";
import { RemoveCartItemUseCase } from "../../../application/use-cases/cart/remove-cart-item.use-case";
import { SequelizeCartRepository } from "../../../infrastructure/persistence/sequelize/repositories/sequelize-cart.repository";
import { SequelizeProductRepository } from "../../../infrastructure/persistence/sequelize/repositories/sequelize-product.repository";
import { AppError } from "../../../shared/errors/AppError";

const cartRepository = new SequelizeCartRepository();
const productRepository = new SequelizeProductRepository();

const getCartUseCase = new GetCartUseCase(cartRepository);
const addToCartUseCase = new AddToCartUseCase(cartRepository, productRepository);
const updateCartItemUseCase = new UpdateCartItemUseCase(cartRepository, productRepository);
const removeCartItemUseCase = new RemoveCartItemUseCase(cartRepository);

export const cartController = {
  /**
   * @openapi
   * /api/cart:
   *   get:
   *     tags: [Cart]
   *     summary: Get current user's cart
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart items with product snapshots
   *       401:
   *         description: Unauthorized
   */
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const result = await getCartUseCase.execute(userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @openapi
   * /api/cart:
   *   post:
   *     tags: [Cart]
   *     summary: Add item to cart (upserts if already present)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [productId, quantity]
   *             properties:
   *               productId: { type: integer }
   *               quantity: { type: integer, minimum: 1 }
   *     responses:
   *       201:
   *         description: Cart item
   *       400:
   *         description: Validation error
   *       404:
   *         description: Product not found
   *       409:
   *         description: Insufficient stock
   */
  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = AddToCartSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues.map((e) => e.message).join(", "));
      }
      const userId = req.user!.sub;
      const result = await addToCartUseCase.execute(userId, parsed.data.productId, parsed.data.quantity);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @openapi
   * /api/cart/{productId}:
   *   put:
   *     tags: [Cart]
   *     summary: Update item quantity in cart
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [quantity]
   *             properties:
   *               quantity: { type: integer, minimum: 1 }
   *     responses:
   *       200:
   *         description: Updated cart item
   *       400:
   *         description: Validation error
   *       404:
   *         description: Not found
   *       409:
   *         description: Insufficient stock
   */
  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = UpdateCartItemSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues.map((e) => e.message).join(", "));
      }
      const userId = req.user!.sub;
      const productId = parseInt(req.params.productId as string, 10);
      if (isNaN(productId)) {
        throw new AppError("Invalid productId");
      }
      const result = await updateCartItemUseCase.execute(userId, productId, parsed.data.quantity);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @openapi
   * /api/cart/{productId}:
   *   delete:
   *     tags: [Cart]
   *     summary: Remove item from cart
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       204:
   *         description: Item removed
   *       404:
   *         description: Not found
   */
  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const productId = parseInt(req.params.productId as string, 10);
      if (isNaN(productId)) {
        throw new AppError("Invalid productId");
      }
      await removeCartItemUseCase.execute(userId, productId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
};
