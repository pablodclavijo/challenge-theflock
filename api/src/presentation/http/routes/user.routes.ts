import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate, requireComprador } from "../middlewares/authenticate.middleware";

export const userRouter = Router();

userRouter.use(authenticate, requireComprador);

userRouter.get("/profile", userController.getProfile);
userRouter.put("/profile", userController.updateProfile);
