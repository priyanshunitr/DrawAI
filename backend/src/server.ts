import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      nodeEnv: env.NODE_ENV
    },
    "DrawAI backend listening"
  );
});

async function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, "Shutting down backend");

  server.close(async (error) => {
    if (error) {
      logger.error({ error }, "Failed to close HTTP server");
      process.exit(1);
    }

    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");
  process.exit(1);
});
