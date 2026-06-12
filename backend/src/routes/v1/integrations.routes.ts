import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../middleware/validate.js";
import { integrations } from "../../data/mock-data.js";

export const integrationsRouter = Router();

integrationsRouter.get("/integrations", (_req, res) => {
  res.json({ data: integrations });
});

integrationsRouter.patch("/integrations/:integrationId/reconnect", (req, res) => {
  res.json({ data: { integrationId: req.params.integrationId, status: "connected", reconnectedAt: new Date().toISOString() } });
});

integrationsRouter.post(
  "/git/sync/commit",
  validateBody(z.object({ fileId: z.string().min(1), message: z.string().min(1), branch: z.string().min(1) })),
  (req, res) => {
    res.status(201).json({ data: { commitSha: "devsha123", ...req.body } });
  }
);

integrationsRouter.post("/git/sync/conflicts/resolve", validateBody(z.object({ fileId: z.string().min(1), strategy: z.string().min(1) })), (req, res) => {
  res.json({ data: { fileId: req.body.fileId, strategy: req.body.strategy, status: "resolved" } });
});

integrationsRouter.get("/mcp/tools", (_req, res) => {
  res.json({ data: ["files.read", "diagrams.create", "diagrams.update", "exports.create"] });
});

integrationsRouter.post("/webhooks", validateBody(z.object({ url: z.string().url(), events: z.array(z.string()).min(1) })), (req, res) => {
  res.status(201).json({ data: { id: `wh_${Date.now()}`, ...req.body, status: "active" } });
});
