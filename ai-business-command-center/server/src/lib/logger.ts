// Pino logger with secret redaction.

import pino from "pino";
import { env } from "../env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.OPENAI_API_KEY",
      "*.JWT_SECRET",
      "*.STRIPE_SECRET_KEY",
    ],
    censor: "[REDACTED]",
  },
});
