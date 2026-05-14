import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION",
        message: "Invalid input",
        fields: err.flatten().fieldErrors,
      },
    });
  }

  if (err instanceof HttpError) {
    if (err.status >= 500) {
      logger.error({ err }, "Internal HttpError");
      return res.status(500).json({
        error: {
          code: "SERVER_ERROR",
          message: "Something went wrong",
        },
      });
    }

    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  logger.error({ err }, "Unhandled error");
}
