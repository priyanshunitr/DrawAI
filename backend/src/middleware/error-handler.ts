import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = "http_error",
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`, "not_found"));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const statusCode =
    error instanceof HttpError
      ? error.statusCode
      : error instanceof ZodError
        ? 400
        : 500;

  const code =
    error instanceof HttpError
      ? error.code
      : error instanceof ZodError
        ? "validation_error"
        : "internal_server_error";

  const message =
    statusCode === 500 ? "Internal server error" : error.message;

  req.log.error({ error }, "Request failed");

  res.status(statusCode).json({
    error: {
      code,
      message,
      details: error instanceof ZodError ? error.flatten() : error.details
    }
  });
};
