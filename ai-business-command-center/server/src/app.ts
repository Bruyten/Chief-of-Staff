// Builds and configures the Express app. Kept separate from index.ts so
// it's easy to wrap with tests later.

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./env.js";
import { logger } from "./lib/logger.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import productsRoutes from "./routes/products.routes.js";
import generateRoutes from "./routes/generate.routes.js";
import outputsRoutes from "./routes/outputs.routes.js";
import accountRoutes from "./routes/account.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

export function createApp() {
  const app = express();

  // Security + parsing
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  // Stripe webhook needs the RAW body to verify the signature — mount BEFORE express.json()
  app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Tiny request logger
  app.use((req, _res, next) => {
    logger.debug({ method: req.method, url: req.url }, "→");
    next();
  });

  // Health (no rate limit, no auth — Render uses this)
  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "chief-of-staff-api",
      env: env.NODE_ENV,
      fakeAi: env.FAKE_AI,
      time: new Date().toISOString(),
    });
  });

  // Global rate limit for everything under /api
  app.use("/api", apiLimiter);

  // Mount routes
  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectsRoutes);
  app.use("/api/projects/:projectId/products", productsRoutes);
  app.use("/api/generate", generateRoutes);
  app.use("/api/outputs", outputsRoutes);
  app.use("/api/account", accountRoutes);
  app.use("/api/billing", billingRoutes);

  // 404 + error handlers (must come last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
