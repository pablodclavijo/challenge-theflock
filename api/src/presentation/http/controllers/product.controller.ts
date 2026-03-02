import { Request, Response, NextFunction } from "express";
import { ListProductsQuerySchema } from "../../../application/dtos/product.dto";
import { ListProductsUseCase } from "../../../application/use-cases/product/list-products.use-case";
import { GetProductUseCase } from "../../../application/use-cases/product/get-product.use-case";
import { SequelizeProductRepository } from "../../../infrastructure/persistence/sequelize/repositories/sequelize-product.repository";
import { AppError } from "../../../shared/errors/AppError";

const productRepository = new SequelizeProductRepository();
const listProductsUseCase = new ListProductsUseCase(productRepository);
const getProductUseCase = new GetProductUseCase(productRepository);

export const productController = {
  /**
   * @openapi
   * /api/products:
   *   get:
   *     tags: [Products]
   *     summary: Paginated list of active products
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: category
   *         schema: { type: integer }
   *         description: Filter by category ID
   *       - in: query
   *         name: minPrice
   *         schema: { type: number }
   *       - in: query
   *         name: maxPrice
   *         schema: { type: number }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *         description: Case-insensitive name search (ILIKE)
   *     responses:
   *       200:
   *         description: Paginated product list
   *       400:
   *         description: Invalid query params
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = ListProductsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues.map((e) => e.message).join(", "));
      }
      const result = await listProductsUseCase.execute(parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @openapi
   * /api/products/{id}:
   *   get:
   *     tags: [Products]
   *     summary: Get product detail by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Product detail
   *       400:
   *         description: Invalid ID
   *       404:
   *         description: Product not found
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        throw new AppError("Invalid product ID");
      }
      const result = await getProductUseCase.execute(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};
