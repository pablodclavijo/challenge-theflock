import { Router } from "express";
import { authenticate, requireComprador } from "../middlewares/authenticate.middleware";
import { cartController } from "../controllers/cart.controller";

export const cartRouter = Router();

// All cart routes require authentication and buyer role
cartRouter.use(authenticate, requireComprador);

cartRouter.get("/", cartController.getCart);
cartRouter.post("/", cartController.addItem);
cartRouter.put("/:productId", cartController.updateItem);
cartRouter.delete("/:productId", cartController.removeItem);
