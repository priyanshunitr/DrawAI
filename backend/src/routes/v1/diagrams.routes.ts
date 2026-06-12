import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../middleware/validate.js";
import { getDiagramExamples, layoutDiagram, parseDiagramDsl, quickFixDiagramDsl } from "../../services/diagram.service.js";

export const diagramsRouter = Router();

const sourceSchema = z.object({ source: z.string().min(1) });

diagramsRouter.get("/diagrams/examples", (_req, res) => {
  res.json({ data: getDiagramExamples() });
});

diagramsRouter.post("/diagrams/parse", validateBody(sourceSchema), (req, res) => {
  res.json({ data: parseDiagramDsl(req.body.source) });
});

diagramsRouter.post("/diagrams/layout", validateBody(sourceSchema), (req, res) => {
  res.json({ data: layoutDiagram(req.body.source) });
});

diagramsRouter.post("/diagrams/quick-fix", validateBody(sourceSchema), (req, res) => {
  res.json({ data: { source: quickFixDiagramDsl(req.body.source) } });
});

diagramsRouter.post(
  "/diagrams/convert",
  validateBody(z.object({ source: z.string().min(1), targetType: z.string().min(1) })),
  (req, res) => {
    const fixed = quickFixDiagramDsl(req.body.source);
    res.json({ data: { source: fixed.replace(/^diagram .+$/m, `diagram ${req.body.targetType}`), targetType: req.body.targetType } });
  }
);
