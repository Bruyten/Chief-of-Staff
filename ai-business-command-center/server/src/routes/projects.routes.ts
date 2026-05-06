import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { errors } from "../lib/errors.js";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  name: z.string().min(1).max(80),
  niche: z.string().max(80).optional(),
  brandVoice: z.string().max(500).optional(),
  emoji: z.string().max(8).optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { products: true, outputs: true } },
      },
    });
    res.json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        niche: p.niche,
        brandVoice: p.brandVoice,
        emoji: p.emoji,
        createdAt: p.createdAt,
        productCount: p._count.products,
        outputCount: p._count.outputs,
      })),
    });
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const project = await prisma.project.create({
      data: { ...data, userId: req.user!.id },
    });
    res.status(201).json({ project });
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: {
        products: { orderBy: { createdAt: "desc" } },
        outputs: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!project) throw errors.notFound("Project not found");
    res.json({ project });
  } catch (e) { next(e); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = createSchema.partial().parse(req.body);
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      select: { id: true },
    });
    if (!project) throw errors.notFound("Project not found");
    const updated = await prisma.project.update({ where: { id: project.id }, data });
    res.json({ project: updated });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      select: { id: true },
    });
    if (!project) throw errors.notFound("Project not found");
    await prisma.project.delete({ where: { id: project.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
