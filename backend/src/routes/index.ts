import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { v1Router } from "./v1/index.js";

export const router = Router();

router.use(healthRouter);
router.use("/api/v1", v1Router);
