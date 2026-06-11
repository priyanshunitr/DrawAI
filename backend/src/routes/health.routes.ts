import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "drawai-backend",
    timestamp: new Date().toISOString()
  });
});

healthRouter.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ready",
      checks: {
        database: "ok"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      checks: {
        database: "error"
      },
      timestamp: new Date().toISOString()
    });
  }
});
