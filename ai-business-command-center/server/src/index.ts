// Entry point. Boots the HTTP server and handles graceful shutdown.

import { createApp } from "./app.js";
import { env } from "./env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, fakeAi: env.FAKE_AI },
    `🚀 Chief of Staff API listening on :${env.PORT}`
  );
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Shutting down…");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 8000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
