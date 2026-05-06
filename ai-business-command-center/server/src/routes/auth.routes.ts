import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signJwt, COOKIE_NAME, cookieOptions } from "../lib/jwt.js";
import { errors } from "../lib/errors.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(80).optional(),
});

router.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw errors.conflict("Email already in use");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name ?? email.split("@")[0] },
      select: { id: true, email: true, name: true, plan: true, credits: true, creditsMax: true },
    });

    const token = signJwt({ sub: user.id, email: user.email });
    res.cookie(COOKIE_NAME, token, cookieOptions);
    res.status(201).json({ user });
  } catch (e) { next(e); }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw errors.unauthorized("Invalid email or password");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw errors.unauthorized("Invalid email or password");

    const token = signJwt({ sub: user.id, email: user.email });
    res.cookie(COOKIE_NAME, token, cookieOptions);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        credits: user.credits,
        creditsMax: user.creditsMax,
      },
    });
  } catch (e) { next(e); }
});

router.post("/logout", requireAuth, (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: 0 });
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, plan: true, credits: true, creditsMax: true },
    });
    if (!user) throw errors.unauthorized("Account not found");
    res.json({ user });
  } catch (e) { next(e); }
});

export default router;
