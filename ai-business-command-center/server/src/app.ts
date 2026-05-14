import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./env.js";
import { logger } from "./lib/logger.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { requireCsrf } from "./middleware/requireCsrf.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import productsRoutes from "./routes/products.routes.js";
import generateRoutes from "./routes/generate.routes.js";
import outputsRoutes from "./routes/outputs.routes.js";
import accountRoutes from "./routes/account.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

import brandVoicesRoutes from "./routes/brandVoices.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import workflowsRoutes from "./routes/workflows.routes.js";
import automationsRoutes from "./routes/automations.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import videoStudioRoutes from "./routes/videoStudio.routes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());

  const allowedOrigins = [
    env.CLIENT_ORIGIN,
    ...(env.CORS_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        logger.warn({ origin }, "Blocked CORS origin");
        return callback(new Error("CORS origin not allowed"));
      },
      credentials: true,
    })
  );

  app.use(cookieParser());

  /**
   * Stripe webhooks need raw body parsing for signature verification.
   * Keep this mounted before express.json().
   */
  app.use(
    "/api/webhooks",
    express.raw({ type: "application/json" }),
    webhookRoutes
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "chief-of-staff-api",
      environment: env.NODE_ENV,
    });
  });

  app.use("/api", apiLimiter);
  app.use("/api", requireCsrf);

  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectsRoutes);
  app.use("/api/projects/:projectId/products", productsRoutes);
  app.use("/api/generate", generateRoutes);
  app.use("/api/outputs", outputsRoutes);
  app.use("/api/account", accountRoutes);
  app.use("/api/billing", billingRoutes);

  app.use("/api/brand-voices", brandVoicesRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/workflows", workflowsRoutes);
  app.use("/api/automations", automationsRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/video-studio", videoStudioRoutes);

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    });
  });

  app.use(errorHandler);

  return app;
}
