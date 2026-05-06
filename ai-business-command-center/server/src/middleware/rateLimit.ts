// Per-IP rate limiting. Stricter on auth + AI generate to prevent abuse.

import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 min
  limit: 120,             // 120 req/min per IP — sane default for an SPA
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,               // 5 login/signup attempts per IP per minute
  message: { error: { code: "RATE_LIMITED", message: "Too many auth attempts. Try again in a minute." } },
});

export const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,              // 15 AI calls per IP per minute
  message: { error: { code: "RATE_LIMITED", message: "Slow down — too many generations. Wait a moment." } },
});
