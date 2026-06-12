import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import {
  addComment,
  addVersion,
  createFile,
  getFile,
  listComments,
  listFiles,
  listVersions,
  resolveComment,
  restoreFile,
  softDeleteFile,
  updateFile
} from "../../services/workspace.service.js";

export const filesRouter = Router();

filesRouter.get("/files", (_req, res) => {
  res.json({ data: listFiles() });
});

filesRouter.post(
  "/files",
  validateBody(z.object({ title: z.string().min(1), kind: z.string().min(1), folder: z.string().min(1) })),
  (req, res) => {
    res.status(201).json({ data: createFile(req.body) });
  }
);

filesRouter.get("/files/:fileId", (req, res, next) => {
  const file = getFile(param(req.params.fileId));
  if (!file) {
    next(new HttpError(404, "File not found", "file_not_found"));
    return;
  }
  res.json({ data: file });
});

filesRouter.patch(
  "/files/:fileId",
  validateBody(z.object({
    title: z.string().min(1).optional(),
    markdown: z.string().optional(),
    diagramDsl: z.string().optional(),
    shared: z.boolean().optional()
  })),
  (req, res, next) => {
    const file = updateFile(param(req.params.fileId), req.body);
    if (!file) {
      next(new HttpError(404, "File not found", "file_not_found"));
      return;
    }
    res.json({ data: file });
  }
);

filesRouter.post(
  "/files/:fileId/autosave",
  validateBody(z.object({ title: z.string().min(1), markdown: z.string(), diagramDsl: z.string(), contentVersion: z.number().int().optional() })),
  (req, res, next) => {
    const file = updateFile(param(req.params.fileId), req.body);
    if (!file) {
      next(new HttpError(404, "File not found", "file_not_found"));
      return;
    }
    res.json({ data: { file, conflict: false, savedAt: new Date().toISOString() } });
  }
);

filesRouter.delete("/files/:fileId", (req, res, next) => {
  const file = softDeleteFile(param(req.params.fileId));
  if (!file) {
    next(new HttpError(404, "File not found", "file_not_found"));
    return;
  }
  res.json({ data: file });
});

filesRouter.post("/files/:fileId/restore", (req, res, next) => {
  const file = restoreFile(param(req.params.fileId));
  if (!file) {
    next(new HttpError(404, "File not found", "file_not_found"));
    return;
  }
  res.json({ data: file });
});

filesRouter.get("/files/:fileId/versions", (req, res) => {
  res.json({ data: listVersions(param(req.params.fileId)) });
});

filesRouter.post(
  "/files/:fileId/versions",
  validateBody(z.object({ label: z.string().min(1), by: z.string().optional() })),
  (req, res) => {
    res.status(201).json({ data: addVersion(param(req.params.fileId), req.body.label, req.body.by) });
  }
);

filesRouter.post("/files/:fileId/versions/:versionId/restore", (req, res) => {
  res.json({ data: { fileId: req.params.fileId, versionId: req.params.versionId, status: "restored" } });
});

filesRouter.get("/files/:fileId/comments", (req, res) => {
  res.json({ data: listComments(param(req.params.fileId)) });
});

filesRouter.post(
  "/files/:fileId/comments",
  validateBody(z.object({ text: z.string().min(1), author: z.string().optional(), target: z.string().optional() })),
  (req, res) => {
    res.status(201).json({ data: addComment(param(req.params.fileId), req.body) });
  }
);

filesRouter.patch("/comments/:commentId/resolve", (req, res, next) => {
  const comment = resolveComment(param(req.params.commentId));
  if (!comment) {
    next(new HttpError(404, "Comment not found", "comment_not_found"));
    return;
  }
  res.json({ data: comment });
});

filesRouter.post(
  "/files/:fileId/share",
  validateBody(z.object({ role: z.enum(["viewer", "commenter", "editor"]), expiresAt: z.string().optional() })),
  (req, res) => {
    res.status(201).json({
      data: {
        fileId: req.params.fileId,
        role: req.body.role,
        url: `https://drawai.local/share/${req.params.fileId}.${req.body.role}.devtoken`,
        expiresAt: req.body.expiresAt ?? null
      }
    });
  }
);

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
