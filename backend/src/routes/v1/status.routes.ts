import { Router } from "express";

export const statusRouter = Router();

statusRouter.get("/status", (_req, res) => {
  res.json({
    apiVersion: "v1",
    status: "ok",
    capabilities: {
      database: "postgresql",
      orm: "prisma",
      http: "express",
      language: "typescript"
    }
  });
});
