import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getUsage } from "../services/credits.service.js";

const router = Router();
router.use(requireAuth);

router.get("/usage", async (req, res, next) => {
  try {
    const usage = await getUsage(req.user!.id);
    res.json(usage);
  } catch (e) { next(e); }
});

router.patch("/profile", async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(80) }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name },
      select: { id: true, email: true, name: true, plan: true, credits: true, creditsMax: true },
    });
    res.json({ user });
  } catch (e) { next(e); }
});

export default router;
