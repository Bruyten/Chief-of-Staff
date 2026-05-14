import type { Request, Response, NextFunction } from "express";
import { errors } from "../lib/errors.js";
import { CSRF_COOKIE_NAME, csrfTokensMatch } from "../lib/csrf.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const EXEMPT_PATHS = new Set([
  "/auth/login",
  "/auth/signup",
  "/auth/csrf",
]);

export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (EXEMPT_PATHS.has(req.path)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken || !csrfTokensMatch(cookieToken, headerToken)) {
    return next(errors.forbidden("Invalid CSRF token"));
  }

  next();
}
