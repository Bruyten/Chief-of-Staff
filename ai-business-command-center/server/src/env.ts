// Type-safe env loader. Crashes on boot if anything required is missing —
// far better than a 500 in production three weeks from now.

import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  FAKE_AI: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),

  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),

  // Stripe
  FAKE_STRIPE: z.string().optional().transform((v) => v === undefined ? true : v === "true" || v === "1"),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PRICE_STARTER: z.string().optional().default(""),
  STRIPE_PRICE_PRO: z.string().optional().default(""),
  STRIPE_PRICE_AGENCY: z.string().optional().default(""),
  BILLING_SUCCESS_URL: z.string().url().default("http://localhost:5173/?billing=success"),
  BILLING_CANCEL_URL: z.string().url().default("http://localhost:5173/?billing=cancel"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
