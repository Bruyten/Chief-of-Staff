import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import {
  signJwt,
  COOKIE_NAME,
  cookieOptions,
} from "../lib/jwt.js";
import { errors } from "../lib/errors.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  clearCsrfCookie,
  setCsrfCookie,
} from "../lib/csrf.js";

const router = Router();

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  plan: true,
  credits: true,
  creditsMax: true,
  videoCredits: true,
  videoCreditsMax: true,
} as const;

const signupSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1).max(80).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.get("/csrf", (_req, res) => {
  const token = setCsrfCookie(res);

  res.json({
    ok: true,
    ...(process.env.NODE_ENV === "test" ? { token } : {}),
  });
});

router.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw errors.conflict("Email already in use");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name?.trim() || normalizedEmail.split("@")[0],
      },
      select: userSelect,
    });

    const token = signJwt({
      sub: user.id,
      email: user.email,
    });

    res.cookie(COOKIE_NAME, token, cookieOptions);
    setCsrfCookie(res);

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const normalizedEmail = email.trim().toLowerCase();

    const userWithPassword = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!userWithPassword) {
      throw errors.unauthorized("Invalid email or password");
    }

    const validPassword = await bcrypt.compare(
      password,
      userWithPassword.passwordHash,
    );

    if (!validPassword) {
      throw errors.unauthorized("Invalid email or password");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userWithPassword.id,
      },
      select: userSelect,
    });

    if (!user) {
      throw errors.unauthorized("Account not found");
    }

    const token = signJwt({
      sub: user.id,
      email: user.email,
    });

    res.cookie(COOKIE_NAME, token, cookieOptions);
    setCsrfCookie(res);

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    ...cookieOptions,
    maxAge: 0,
  });

  clearCsrfCookie(res);

  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id,
      },
      select: userSelect,
    });

    if (!user) {
      throw errors.unauthorized("Account not found");
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
