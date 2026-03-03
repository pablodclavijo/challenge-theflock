import { Router } from "express";
import { authenticate, createRequireCompradorMiddleware } from "../middlewares/authenticate.middleware";
import { cartController } from "../controllers/cart.controller";
import { SequelizeRoleRepository } from "../../../infrastructure/persistence/sequelize/repositories/sequelize-role.repository";

const roleRepository = new SequelizeRoleRepository();
const requireComprador = createRequireCompradorMiddleware(roleRepository);

export const cartRouter = Router();

// All cart routes require authentication and buyer role
cartRouter.use(authenticate, requireComprador);

cartRouter.get("/", cartController.getCart);
cartRouter.post("/", cartController.addItem);
cartRouter.put("/:productId", cartController.updateItem);
cartRouter.delete("/:productId", cartController.removeItem);
