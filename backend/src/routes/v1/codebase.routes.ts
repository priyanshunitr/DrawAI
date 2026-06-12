import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../middleware/validate.js";

export const codebaseRouter = Router();

codebaseRouter.get("/codebase/repositories", (_req, res) => {
  res.json({
    data: [
      { id: "repo_1", name: "drawai/core-platform", defaultBranch: "main", indexed: true },
      { id: "repo_2", name: "drawai/web", defaultBranch: "main", indexed: false }
    ]
  });
});

codebaseRouter.post(
  "/codebase/index",
  validateBody(z.object({ repository: z.string().min(1), branch: z.string().min(1), paths: z.array(z.string()).default([]) })),
  (req, res) => {
    res.status(202).json({
      data: {
        jobId: `idx_${Date.now()}`,
        repository: req.body.repository,
        branch: req.body.branch,
        paths: req.body.paths,
        status: "queued"
      }
    });
  }
);

codebaseRouter.post(
  "/codebase/diagrams",
  validateBody(z.object({ repository: z.string().min(1), branch: z.string().min(1), paths: z.array(z.string()).default([]), prompt: z.string().optional() })),
  (req, res) => {
    res.status(202).json({
      data: {
        diagramDsl: `diagram architecture
Repository -> Indexer: ${req.body.repository}@${req.body.branch}
Indexer -> Embeddings: selected paths
Embeddings -> Diagram generator: context
Diagram generator -> File: codebase diagram`,
        citations: req.body.paths.map((path: string, index: number) => ({ path, lineStart: 1, lineEnd: 40 + index }))
      }
    });
  }
);
