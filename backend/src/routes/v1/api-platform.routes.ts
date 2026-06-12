import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { createApiKey, getBootstrapData, revokeApiKey } from "../../services/workspace.service.js";

export const apiPlatformRouter = Router();

apiPlatformRouter.get("/api-keys", (_req, res) => {
  res.json({ data: getBootstrapData().apiKeys });
});

apiPlatformRouter.post(
  "/api-keys",
  validateBody(z.object({ name: z.string().min(1), scope: z.string().min(1) })),
  (req, res) => {
    res.status(201).json({ data: createApiKey(req.body) });
  }
);

apiPlatformRouter.delete("/api-keys/:keyId", (req, res, next) => {
  const key = revokeApiKey(req.params.keyId ?? "");
  if (!key) {
    next(new HttpError(404, "API key not found", "api_key_not_found"));
    return;
  }
  res.json({ data: key });
});

apiPlatformRouter.get("/openapi", (_req, res) => {
  res.json({
    openapi: "3.1.0",
    info: { title: "DrawAI API", version: "0.1.0" },
    paths: {
      "/api/v1/bootstrap": { get: { summary: "Bootstrap frontend data" } },
      "/api/v1/files": { get: { summary: "List files" }, post: { summary: "Create file" } },
      "/api/v1/diagrams/parse": { post: { summary: "Parse diagram DSL" } }
    }
  });
});

apiPlatformRouter.get("/api-usage", (_req, res) => {
  res.json({ data: { callsToday: 18204, rateLimit: 50000, resetAt: new Date(Date.now() + 86400000).toISOString() } });
});
