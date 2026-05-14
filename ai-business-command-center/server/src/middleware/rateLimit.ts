import rateLimit from "express-rate-limit";

function message(value: string) {
  return {
    error: {
      code: "RATE_LIMITED",
      message: value,
    },
  };
}

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  message: message("Too many auth attempts. Try again in a minute."),
});

export const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  message: message("Slow down — too many text generation requests. Wait a moment."),
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  message: message("Slow down — too many chat requests. Wait a moment."),
});

export const workflowLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 4,
  message: message("Too many workflow launches. Wait before starting another."),
});

export const automationManualRunLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 4,
  message: message("Too many manual automation queue requests. Wait a moment."),
});

export const videoGenerationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  message: message("Too many video generation requests. Wait before creating another video job."),
});
