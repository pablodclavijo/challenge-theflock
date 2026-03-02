import { Router } from "express";
import { authRouter } from "./auth.routes";
import { userRouter } from "./user.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
