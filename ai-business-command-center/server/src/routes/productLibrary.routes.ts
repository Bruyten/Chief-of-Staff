import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { errors } from "../lib/errors.js";
import { optionalSafeText, safeText } from "../lib/securityText.js";

const router = Router();

router.use(requireAuth);

const productTypeSchema = z.enum([
  "ebook",
  "template",
  "course",
  "program",
  "saas",
  "affiliate_product",
  "lead_magnet",
  "service",
  "other",
]);

const revenueLaneSchema = z.enum([
  "digital_products",
  "courses_programs",
  "saas",
  "tiktok_affiliate",
  "amazon_affiliate",
  "lead_generation",
  "other",
]);

const statusSchema = z.enum(["active", "paused", "archived"]);

const createSchema = z.object({
  name: safeText(180, 1),
  productType: productTypeSchema,
  revenueLane: revenueLaneSchema.optional(),
  description: optionalSafeText(2400),
  targetAudience: optionalSafeText(1800),
  painPoints: optionalSafeText(2400),
  benefits: optionalSafeText(2400),
  keywords: optionalSafeText(1600),
  tags: optionalSafeText(1200),
  offer: optionalSafeText(1800),
  cta: optionalSafeText(500),
  priceRange: optionalSafeText(120),
  productUrl: z.string().trim().url().optional().or(z.literal("")),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  promotionPriority: z.number().int().min(1).max(5).default(3),
  status: statusSchema.default("active"),
});

const updateSchema = createSchema.partial();

router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.productLibraryItem.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: [
        {
          promotionPriority: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
    });

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const item = await prisma.productLibraryItem.create({
      data: {
        userId: req.user!.id,
        name: data.name,
        productType: data.productType,
        revenueLane: data.revenueLane ?? null,
        description: data.description || null,
        targetAudience: data.targetAudience || null,
        painPoints: data.painPoints || null,
        benefits: data.benefits || null,
        keywords: data.keywords || null,
        tags: data.tags || null,
        offer: data.offer || null,
        cta: data.cta || null,
        priceRange: data.priceRange || null,
        productUrl: data.productUrl || null,
        coverImageUrl: data.coverImageUrl || null,
        promotionPriority: data.promotionPriority,
        status: data.status,
      },
    });

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const itemId = z.string().cuid().parse(req.params.id);
    const data = updateSchema.parse(req.body);

    const existing = await prisma.productLibraryItem.findFirst({
      where: {
        id: itemId,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      throw errors.notFound("Product library item not found");
    }

    const item = await prisma.productLibraryItem.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.productType !== undefined
          ? { productType: data.productType }
          : {}),
        ...(data.revenueLane !== undefined
          ? { revenueLane: data.revenueLane ?? null }
          : {}),
        ...(data.description !== undefined
          ? { description: data.description || null }
          : {}),
        ...(data.targetAudience !== undefined
          ? { targetAudience: data.targetAudience || null }
          : {}),
        ...(data.painPoints !== undefined
          ? { painPoints: data.painPoints || null }
          : {}),
        ...(data.benefits !== undefined
          ? { benefits: data.benefits || null }
          : {}),
        ...(data.keywords !== undefined
          ? { keywords: data.keywords || null }
          : {}),
        ...(data.tags !== undefined ? { tags: data.tags || null } : {}),
        ...(data.offer !== undefined ? { offer: data.offer || null } : {}),
        ...(data.cta !== undefined ? { cta: data.cta || null } : {}),
        ...(data.priceRange !== undefined
          ? { priceRange: data.priceRange || null }
          : {}),
        ...(data.productUrl !== undefined
          ? { productUrl: data.productUrl || null }
          : {}),
        ...(data.coverImageUrl !== undefined
          ? { coverImageUrl: data.coverImageUrl || null }
          : {}),
        ...(data.promotionPriority !== undefined
          ? { promotionPriority: data.promotionPriority }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const itemId = z.string().cuid().parse(req.params.id);

    const existing = await prisma.productLibraryItem.findFirst({
      where: {
        id: itemId,
        userId: req.user!.id,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw errors.notFound("Product library item not found");
    }

    await prisma.productLibraryItem.delete({
      where: {
        id: existing.id,
      },
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
