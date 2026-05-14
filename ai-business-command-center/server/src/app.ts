import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./env.js";
import { logger } from "./lib/logger.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { requireCsrf } from "./middleware/requireCsrf.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
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
}
