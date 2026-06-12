import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { cancelExportJob, createExportJob, getExportJob } from "../../services/export.service.js";

export const exportsRouter = Router();

exportsRouter.post(
  "/exports",
  validateBody(z.object({ fileId: z.string().min(1), format: z.enum(["PNG", "SVG", "PDF", "HTML", "Markdown", "Clipboard"]) })),
  (req, res) => {
    res.status(202).json({ data: createExportJob(req.body.format, req.body.fileId) });
  }
);

exportsRouter.get("/exports/:exportId", (req, res, next) => {
  const job = getExportJob(req.params.exportId ?? "");
  if (!job) {
    next(new HttpError(404, "Export job not found", "export_not_found"));
    return;
  }
  res.json({ data: job });
});

exportsRouter.delete("/exports/:exportId", (req, res, next) => {
  const job = cancelExportJob(req.params.exportId ?? "");
  if (!job) {
    next(new HttpError(404, "Export job not found", "export_not_found"));
    return;
  }
  res.json({ data: job });
});
