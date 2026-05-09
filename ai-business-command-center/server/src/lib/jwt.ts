// Minimal JWT helpers. We sign + verify with HS256.
// Tokens travel in an httpOnly cookie (see auth.routes.ts).

import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../env.js";

export type JwtPayload = { sub: string; email: string };

export function signJwt(payload: JwtPayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

export function verifyJwt(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || !("sub" in decoded)) {
    throw new Error("Invalid token payload");
  }
  return { sub: String(decoded.sub), email: String((decoded as { email: string }).email) };
}

export const COOKIE_NAME = "cos_session";

export const cookieOptions = {
  httpOnly: true as const,
  secure: env.NODE_ENV === "production",
  sameSite: "none" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
