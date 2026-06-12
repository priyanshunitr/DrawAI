import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { HttpError } from "./error-handler.js";

export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      next(new HttpError(400, "Invalid request body", "validation_error", parsed.error.flatten()));
      return;
    }

    req.body = parsed.data;
    next();
  };
}
