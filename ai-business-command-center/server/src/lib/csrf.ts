import crypto from "node:crypto";
import type { Response } from "express";
import { env } from "../env.js";

export const CSRF_COOKIE_NAME = "cos_csrf";

export const csrfCookieOptions = {
  httpOnly: false as const,
  secure: env.NODE_ENV === "production",
  sameSite: "none" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function createCsrfToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function setCsrfCookie(res: Response) {
  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions);
  return token;
}

export function clearCsrfCookie(res: Response) {
  res.clearCookie(CSRF_COOKIE_NAME, { ...csrfCookieOptions, maxAge: 0 });
}

export function csrfTokensMatch(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
