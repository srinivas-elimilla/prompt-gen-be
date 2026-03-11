import express from "express";
import cors from "cors"
import { promptRouter } from "./routes/prompt.routes";

export const app = express();

app.use(express.json());
app.use(cors())

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/prompt", promptRouter);
