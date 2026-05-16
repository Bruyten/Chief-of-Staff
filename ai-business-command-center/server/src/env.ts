import "dotenv/config";
import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    JWT_SECRET: z
      .string()
      .min(32, "JWT_SECRET must be at least 32 chars"),

    JWT_EXPIRES_IN: z.string().default("7d"),

    OPENAI_API_KEY: z.string().optional().default(""),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),

    FAKE_AI: z
      .string()
      .optional()
      .transform((value) => value === "true" || value === "1"),

    CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
    CORS_ORIGINS: z.string().optional().default(""),

    FAKE_STRIPE: z
      .string()
      .optional()
      .transform((value) =>
        value === undefined ? true : value === "true" || value === "1",
      ),

    STRIPE_SECRET_KEY: z.string().optional().default(""),
    STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
    STRIPE_PRICE_STARTER: z.string().optional().default(""),
    STRIPE_PRICE_PRO: z.string().optional().default(""),
    STRIPE_PRICE_AGENCY: z.string().optional().default(""),

    BILLING_SUCCESS_URL: z
      .string()
      .url()
      .default("http://localhost:5173/?billing=success"),

    BILLING_CANCEL_URL: z
      .string()
      .url()
      .default("http://localhost:5173/?billing=cancel"),

    VIDEO_PROVIDER: z.string().default("mock"),
    VIDEO_PROVIDER_API_KEY: z.string().optional().default(""),
    VIDEO_PROVIDER_BASE_URL: z.string().optional().default(""),
    VIDEO_PROVIDER_WEBHOOK_SECRET: z.string().optional().default(""),
    VIDEO_MOCK_COMPLETED_URL: z.string().optional().default(""),
    VIDEO_POLL_BATCH_SIZE: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(10),

    TAVILY_API_KEY: z.string().optional().default(""),

    RESEARCH_PROVIDER_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(120_000)
      .default(20_000),
  })
  .superRefine((value, ctx) => {
    if (
      value.NODE_ENV === "production" &&
      !value.FAKE_AI &&
      !value.OPENAI_API_KEY
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OPENAI_API_KEY"],
        message:
          "OPENAI_API_KEY is required when FAKE_AI is false in production",
      });
    }

    if (value.NODE_ENV === "production" && !value.FAKE_STRIPE) {
      const requiredStripe = [
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_PRICE_STARTER",
        "STRIPE_PRICE_PRO",
        "STRIPE_PRICE_AGENCY",
      ] as const;

      for (const key of requiredStripe) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when FAKE_STRIPE is false in production`,
          });
        }
      }
    }

    if (
      value.NODE_ENV === "production" &&
      value.VIDEO_PROVIDER !== "mock" &&
      !value.VIDEO_PROVIDER_API_KEY
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["VIDEO_PROVIDER_API_KEY"],
        message:
          "VIDEO_PROVIDER_API_KEY is required for live video providers",
      });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
