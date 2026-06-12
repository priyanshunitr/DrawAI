import { Router } from "express";
import { getBootstrapData } from "../../services/workspace.service.js";

export const bootstrapRouter = Router();

bootstrapRouter.get("/bootstrap", (_req, res) => {
  res.json({
    data: getBootstrapData(),
    meta: {
      source: "backend",
      generatedAt: new Date().toISOString()
    }
  });
});
