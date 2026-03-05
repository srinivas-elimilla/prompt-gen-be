import { Router } from "express";
import { promptController } from "../controllers/promptController";

export const promptRouter = Router();

promptRouter.post("/generate", promptController);
