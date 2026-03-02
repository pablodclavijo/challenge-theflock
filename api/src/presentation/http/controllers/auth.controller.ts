import { Request, Response, NextFunction } from "express";
import { LoginRequestSchema, RegisterRequestSchema } from "../../../application/dtos/auth.dto";
import { LoginUseCase } from "../../../application/use-cases/auth/login.use-case";
import { RegisterUseCase } from "../../../application/use-cases/auth/register.use-case";
import { SequelizeUserRepository } from "../../../infrastructure/persistence/sequelize/repositories/sequelize-user.repository";
import { JwtService } from "../../../infrastructure/auth/jwt.service";
import { AppError } from "../../../shared/errors/AppError";

const userRepository = new SequelizeUserRepository();
const jwtService = new JwtService();
const loginUseCase = new LoginUseCase(userRepository, jwtService);
const registerUseCase = new RegisterUseCase(userRepository, jwtService);

export const authController = {
  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Login with email and password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: JWT token and user info
   *       400:
   *         description: Validation error
   *       401:
   *         description: Invalid credentials
   *       403:
   *         description: Role not allowed
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = LoginRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }
      const result = await loginUseCase.execute(parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @openapi
   * /api/auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Register a new buyer account
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password, fullName]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 6
   *               fullName:
   *                 type: string
   *               shippingAddress:
   *                 type: string
   *     responses:
   *       201:
   *         description: Account created, JWT returned
   *       400:
   *         description: Validation error
   *       409:
   *         description: Email already registered
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = RegisterRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }
      const result = await registerUseCase.execute(parsed.data);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
};
