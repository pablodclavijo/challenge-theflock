import { Router } from "express";
import { authenticate, requireComprador } from "../middlewares/authenticate.middleware";
import { orderController } from "../controllers/order.controller";

export const orderRouter = Router();

// All order routes require authentication and buyer role
orderRouter.use(authenticate, requireComprador);

orderRouter.post("/", orderController.checkout);
orderRouter.get("/", orderController.list);
orderRouter.get("/:id", orderController.getById);
orderRouter.post("/:id/payment", orderController.processPayment);
