import { Request, Response, NextFunction } from "express";
import { ListCategoriesUseCase } from "../../../application/use-cases/category/list-categories.use-case";

const listCategoriesUseCase = new ListCategoriesUseCase();

export const categoryController = {
  /**
   * @openapi
   * /api/categories:
   *   get:
   *     tags: [Categories]
   *     summary: List all active categories
   *     responses:
   *       200:
   *         description: Array of active categories
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   name:
   *                     type: string
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await listCategoriesUseCase.execute();
      res.status(200).json(categories);
    } catch (err) {
      next(err);
    }
  }
};
