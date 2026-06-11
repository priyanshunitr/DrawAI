import cors from "cors";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { logger } from "./lib/logger.js";
import { router } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: "cross-origin"
      }
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(
    pinoHttp({
      logger,
      genReqId: (req: Request, res: Response) => {
        const header = req.headers["x-request-id"];
        const requestId = Array.isArray(header)
          ? header[0] ?? randomUUID()
          : header ?? randomUUID();

        res.setHeader("x-request-id", requestId);

        return requestId;
      }
    })
  );

  app.use(router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
