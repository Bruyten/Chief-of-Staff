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

  // Render/proxy support
  app.set("trust proxy", 1);

  // Security headers
  app.use(helmet());

  // CORS
  // Allows your Render frontend to call this Render backend.
  // Reads both CLIENT_ORIGIN and CORS_ORIGINS from Render env vars.
  const allowedOrigins = [
    env.CLIENT_ORIGIN,
    ...(process.env.CORS_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ].filter(Boolean);

  const corsOptions: cors.CorsOptions = {
    origin(origin, callback) {
      // Allow server-to-server requests, curl, Render health checks, etc.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn({
        msg: "Blocked by CORS",
        origin,
        allowedOrigins,
      });

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // Stripe webhook needs the RAW body to verify the signature.
  // Keep this BEFORE express.json().
  app.use(
    "/api/webhooks",
    express.raw({ type: "application/json" }),
    webhookRoutes
  );

  // Normal JSON parsing
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Tiny request logger
  app.use((req, _res, next) => {
    logger.debug({ method: req.method, url: req.url }, "-->");
    next();
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "chief-of-staff-api",
      env: env.NODE_ENV,
      fakeAi: env.FAKE_AI,
      time: new Date().toISOString(),
      allowedOrigins,
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

  // 404 + error handlers must come last
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
