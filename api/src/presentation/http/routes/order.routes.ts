import { Router } from "express";
import { authenticate, createRequireCompradorMiddleware } from "../middlewares/authenticate.middleware";
import { orderController } from "../controllers/order.controller";
import { SequelizeRoleRepository } from "../../../infrastructure/persistence/sequelize/repositories/sequelize-role.repository";

const roleRepository = new SequelizeRoleRepository();
const requireComprador = createRequireCompradorMiddleware(roleRepository);

export const orderRouter = Router();

// All order routes require authentication and buyer role
orderRouter.use(authenticate, requireComprador);

orderRouter.post("/", orderController.checkout);
orderRouter.get("/", orderController.list);
orderRouter.get("/:id", orderController.getById);
orderRouter.post("/:id/payment", orderController.processPayment);
