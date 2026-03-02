import { Router } from "express";
import { productController } from "../controllers/product.controller";

export const productRouter = Router();

productRouter.get("/", productController.list);
productRouter.get("/:id", productController.getById);
