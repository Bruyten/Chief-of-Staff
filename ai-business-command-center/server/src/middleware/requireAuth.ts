// Reads the JWT from the cookie, attaches { userId, email } to req.user.
// Sends 401 if missing or invalid.

import type { Request, Response, NextFunction } from "express";
import { COOKIE_NAME, verifyJwt } from "../lib/jwt.js";
import { errors } from "../lib/errors.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next(errors.unauthorized("Sign in required"));
  try {
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(errors.unauthorized("Invalid or expired session"));
  }
}
