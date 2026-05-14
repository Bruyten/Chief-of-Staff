import pino from "pino";
import { env } from "../env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
          },
        },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.x-csrf-token",
      "req.headers.stripe-signature",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.csrfToken",
      "*.OPENAI_API_KEY",
      "*.JWT_SECRET",
      "*.STRIPE_SECRET_KEY",
      "*.STRIPE_WEBHOOK_SECRET",
      "*.VIDEO_PROVIDER_API_KEY",
      "*.VIDEO_PROVIDER_WEBHOOK_SECRET",
      "*.apiKey",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
});
