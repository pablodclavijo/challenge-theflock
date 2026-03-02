import cors from "cors";
import express from "express";
import { apiRouter } from "./routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ message: "E-commerce API running" });
});

app.use("/api", apiRouter);
