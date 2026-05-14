import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { errors } from "../lib/errors.js";
import {
  assertOwnsOutput,
  assertOwnsProduct,
  assertOwnsProject,
} from "../services/ownership.service.js";
import { boundedJsonRecord, cuidParam, safeText } from "../lib/securityText.js";

const router = Router();
router.use(requireAuth);

const outputTypeSchema = safeText(80, 1).refine((value) => /^[a-zA-Z0-9:_-]+$/.test(value), {
  message: "Output type contains invalid characters",
});

const createSchema = z.object({
  projectId: cuidParam.optional(),
  productId: cuidParam.optional(),
  type: outputTypeSchema,
  title: safeText(200, 1),
  content: safeText(100_000, 1),
  inputSnapshot: boundedJsonRecord(80, 50_000),
});

const querySchema = z.object({
  projectId: cuidParam.optional(),
  type: safeText(80).optional(),
  search: safeText(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

router.get("/", async (req, res, next) => {
  try {
    const { projectId, type, search, limit } = querySchema.parse(req.query);

    if (projectId) {
      await assertOwnsProject(req.user!.id, projectId);
    }

    const outputs = await prisma.output.findMany({
      where: {
        userId: req.user!.id,
        ...(projectId ? { projectId } : {}),
        ...(type ? { type } : {}),
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        project: { select: { name: true, emoji: true } },
      },
    });

    res.json({
      outputs: outputs.map((output) => ({
        id: output.id,
        type: output.type,
        title: output.title,
        content: output.content,
        projectId: output.projectId,
        projectName: output.project?.name ?? null,
        projectEmoji: output.project?.emoji ?? null,
        createdAt: output.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    if (data.projectId) {
      await assertOwnsProject(req.user!.id, data.projectId);
    }

    if (data.productId) {
      const product = await assertOwnsProduct(req.user!.id, data.productId);

      if (data.projectId && product.projectId !== data.projectId) {
        throw errors.badRequest("Product does not belong to the selected project");
      }
    }

    const output = await prisma.output.create({
      data: {
        ...data,
        userId: req.user!.id,
      },
    });

    res.status(201).json({ output });
  } catch (e) {
export default router;
