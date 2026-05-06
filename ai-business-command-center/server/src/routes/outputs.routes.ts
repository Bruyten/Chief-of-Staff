import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { errors } from "../lib/errors.js";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  projectId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  inputSnapshot: z.record(z.unknown()).default({}),
});

const querySchema = z.object({
  projectId: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

router.get("/", async (req, res, next) => {
  try {
    const { projectId, type, search, limit } = querySchema.parse(req.query);
    const outputs = await prisma.output.findMany({
      where: {
        userId: req.user!.id,
        ...(projectId ? { projectId } : {}),
        ...(type ? { type } : {}),
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { project: { select: { name: true, emoji: true } } },
    });
    res.json({
      outputs: outputs.map((o) => ({
        id: o.id,
        type: o.type,
        title: o.title,
        content: o.content,
        projectId: o.projectId,
        projectName: o.project?.name ?? null,
        projectEmoji: o.project?.emoji ?? null,
        createdAt: o.createdAt,
      })),
    });
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    if (data.projectId) {
      const owns = await prisma.project.findFirst({
        where: { id: data.projectId, userId: req.user!.id },
        select: { id: true },
      });
      if (!owns) throw errors.forbidden("Project does not belong to you");
    }
    const output = await prisma.output.create({
      data: { ...data, userId: req.user!.id },
    });
    res.status(201).json({ output });
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const output = await prisma.output.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!output) throw errors.notFound("Output not found");
    res.json({ output });
  } catch (e) { next(e); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = z
      .object({ title: z.string().min(1).max(200).optional(), content: z.string().min(1).optional() })
      .parse(req.body);
    const owns = await prisma.output.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      select: { id: true },
    });
    if (!owns) throw errors.notFound("Output not found");
    const updated = await prisma.output.update({ where: { id: owns.id }, data });
    res.json({ output: updated });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const owns = await prisma.output.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      select: { id: true },
    });
    if (!owns) throw errors.notFound("Output not found");
    await prisma.output.delete({ where: { id: owns.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
