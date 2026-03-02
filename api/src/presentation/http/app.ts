import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import { apiRouter } from "./routes";
import { AppError } from "../../shared/errors/AppError";

export const app = express();

// Allow all origins during development; tighten by setting CORS_ORIGIN env var in production.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ message: "E-commerce API running" });
});

app.use("/api", apiRouter);

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
