import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate, createRequireCompradorMiddleware } from "../middlewares/authenticate.middleware";
import { SequelizeRoleRepository } from "../../../infrastructure/persistence/sequelize/repositories/sequelize-role.repository";

const roleRepository = new SequelizeRoleRepository();
const requireComprador = createRequireCompradorMiddleware(roleRepository);

export const userRouter = Router();

userRouter.use(authenticate, requireComprador);

userRouter.get("/profile", userController.getProfile);
userRouter.put("/profile", userController.updateProfile);
