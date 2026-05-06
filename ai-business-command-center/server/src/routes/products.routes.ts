import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { errors } from "../lib/errors.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

const productSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  audience: z.string().max(200).optional(),
  painPoint: z.string().max(300).optional(),
  benefits: z.string().max(500).optional(),
  price: z.string().max(40).optional(),
  offerType: z.string().max(40).optional(),
  cta: z.string().max(200).optional(),
});

/** Helper: assert the project belongs to the user. */
async function assertOwnsProject(userId: string, projectId: string) {
  const ok = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!ok) throw errors.forbidden("Project does not belong to you");
}

// GET    /api/projects/:projectId/products
router.get("/", async (req, res, next) => {
  try {
    await assertOwnsProject(req.user!.id, req.params.projectId);
    const products = await prisma.product.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ products });
  } catch (e) { next(e); }
});

// POST   /api/projects/:projectId/products
router.post("/", async (req, res, next) => {
  try {
    await assertOwnsProject(req.user!.id, req.params.projectId);
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: { ...data, projectId: req.params.projectId },
    });
    res.status(201).json({ product });
  } catch (e) { next(e); }
});

export default router;
