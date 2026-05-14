import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signJwt, COOKIE_NAME, cookieOptions } from "../lib/jwt.js";
import { errors } from "../lib/errors.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { clearCsrfCookie, setCsrfCookie } from "../lib/csrf.js";

const router = Router();

const userSelect = {
  id: true,
  email: true,
  name: true,
  plan: true,
  credits: true,
  creditsMax: true,
  videoCredits: true,
  videoCreditsMax: true,
} as const;

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(80).optional(),
});

router.get("/csrf", (_req, res) => {
  const token = setCsrfCookie(res);
  res.json({ ok: true, ...(process.env.NODE_ENV === "test" ? { token } : {}) });
});

router.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw errors.conflict("Email already in use");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name ?? email.split("@")[0] },
      select: userSelect,
    });

    const token = signJwt({ sub: user.id, email: user.email });
    res.cookie(COOKIE_NAME, token, cookieOptions);
    setCsrfCookie(res);
    res.status(201).json({ user });
  } catch (e) {
    next(e);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
export default router;
