import { Request, Response, NextFunction } from "express";
import { UpdateProfileSchema } from "../../../application/dtos/user.dto";
import { GetProfileUseCase } from "../../../application/use-cases/user/get-profile.use-case";
import { UpdateProfileUseCase } from "../../../application/use-cases/user/update-profile.use-case";
import { SequelizeUserRepository } from "../../../infrastructure/persistence/sequelize/repositories/sequelize-user.repository";

const userRepository = new SequelizeUserRepository();
const getProfileUseCase = new GetProfileUseCase(userRepository);
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);

export const userController = {
  /**
   * @openapi
   * /api/users/profile:
   *   get:
   *     tags: [Users]
   *     summary: Get authenticated buyer's profile
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 email:
   *                   type: string
   *                 fullName:
   *                   type: string
   *                 shippingAddress:
   *                   type: string
   *                   nullable: true
   *       401:
   *         description: No or invalid token
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getProfileUseCase.execute(req.user!.sub);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @openapi
   * /api/users/profile:
   *   put:
   *     tags: [Users]
   *     summary: Update authenticated buyer's profile
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fullName:
   *                 type: string
   *               shippingAddress:
   *                 type: string
   *     responses:
   *       200:
   *         description: Updated profile
   *       400:
   *         description: Validation error
   *       401:
   *         description: No or invalid token
   *       404:
   *         description: User not found
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = UpdateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }
      const result = await updateProfileUseCase.execute(req.user!.sub, parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};
