import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../middleware/validate.js";
import { editDiagram, explainDiagram, generateDiagram } from "../../services/ai.service.js";

export const aiRouter = Router();

aiRouter.post(
  "/ai/diagrams/generate",
  validateBody(z.object({ prompt: z.string(), diagramType: z.string().optional(), fileId: z.string().optional() })),
  (req, res) => {
    res.status(202).json({ data: generateDiagram(req.body) });
  }
);

aiRouter.post(
  "/ai/diagrams/edit",
  validateBody(z.object({ source: z.string().min(1), action: z.string().min(1), fileId: z.string().optional() })),
  (req, res) => {
    res.status(202).json({ data: editDiagram(req.body) });
  }
);

aiRouter.post(
  "/ai/diagrams/explain",
  validateBody(z.object({ source: z.string().min(1) })),
  (req, res) => {
    res.json({ data: explainDiagram(req.body.source) });
  }
);

aiRouter.get("/ai/usage", (_req, res) => {
  res.json({ data: { used: 760, limit: 2000, byAction: { generate: 420, edit: 190, explain: 150 } } });
});

aiRouter.get("/ai/evaluations", (_req, res) => {
  res.json({ data: { syntaxValidity: 0.98, renderSuccess: 0.97, medianLatencyMs: 1180 } });
});
