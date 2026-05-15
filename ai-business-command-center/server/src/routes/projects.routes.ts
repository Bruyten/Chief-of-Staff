import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { errors } from "../lib/errors.js";
import {
  optionalSafeText,
  safeText,
} from "../lib/securityText.js";
import {
  assertOwnsBrandProfile,
  assertOwnsProject,
} from "../services/ownership.service.js";

const router = Router();

router.use(requireAuth);

const campaignStatusSchema = z.enum([
  "planning",
  "active",
  "paused",
  "completed",
]);

const createSchema = z.object({
  name: safeText(80, 1),
  niche: optionalSafeText(80),
  brandVoice: optionalSafeText(500),
  emoji: optionalSafeText(8),
  campaignGoal: optionalSafeText(1200),
  targetAudience: optionalSafeText(1200),
  offer: optionalSafeText(1200),
  campaignStatus: campaignStatusSchema.optional(),
  launchDate: z.string().datetime().optional().or(z.literal("")),
  brandVoiceProfileId: z.string().cuid().nullable().optional(),
});

const updateSchema = createSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "Provide at least one field to update",
  },
);

function normalizeLaunchDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value);
}

router.get("/", async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        brandVoiceProfile: {
          select: {
            id: true,
            brandName: true,
          },
        },
        _count: {
          select: {
            products: true,
            outputs: true,
            workflowRuns: true,
            chatConversations: true,
            automations: true,
          },
        },
      },
    });

    res.json({
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        niche: project.niche,
        brandVoice: project.brandVoice,
        emoji: project.emoji,
        campaignGoal: project.campaignGoal,
        targetAudience: project.targetAudience,
        offer: project.offer,
        campaignStatus: project.campaignStatus,
        launchDate: project.launchDate,
        brandVoiceProfileId: project.brandVoiceProfileId,
        brandVoiceProfile: project.brandVoiceProfile,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        productCount: project._count.products,
        outputCount: project._count.outputs,
        workflowRunCount: project._count.workflowRuns,
        chatCount: project._count.chatConversations,
        automationCount: project._count.automations,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    await assertOwnsProject(req.user!.id, req.params.id);

    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        brandVoiceProfile: true,
        products: {
          orderBy: {
            updatedAt: "desc",
          },
        },
        outputs: {
          orderBy: {
            updatedAt: "desc",
          },
          take: 100,
        },
        workflowRuns: {
          orderBy: {
            updatedAt: "desc",
          },
          take: 20,
          include: {
            steps: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        chatConversations: {
          orderBy: {
            updatedAt: "desc",
          },
          take: 20,
        },
        _count: {
          select: {
            products: true,
            outputs: true,
            workflowRuns: true,
            chatConversations: true,
            automations: true,
          },
        },
      },
    });

    if (!project) {
      throw errors.notFound("Project not found");
    }

    res.json({
      project: {
        ...project,
        productCount: project._count.products,
        outputCount: project._count.outputs,
        workflowRunCount: project._count.workflowRuns,
        chatCount: project._count.chatConversations,
        automationCount: project._count.automations,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    if (data.brandVoiceProfileId) {
      await assertOwnsBrandProfile(
        req.user!.id,
        data.brandVoiceProfileId,
      );
    }

    const project = await prisma.project.create({
      data: {
        userId: req.user!.id,
        name: data.name,
        niche: data.niche || null,
        brandVoice: data.brandVoice || null,
        emoji: data.emoji || null,
        campaignGoal: data.campaignGoal || null,
        targetAudience: data.targetAudience || null,
        offer: data.offer || null,
        campaignStatus: data.campaignStatus ?? "planning",
        launchDate: normalizeLaunchDate(data.launchDate),
        brandVoiceProfileId: data.brandVoiceProfileId ?? null,
      },
    });

    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await assertOwnsProject(
      req.user!.id,
      req.params.id,
    );

    const data = updateSchema.parse(req.body);

    if (data.brandVoiceProfileId) {
      await assertOwnsBrandProfile(
        req.user!.id,
        data.brandVoiceProfileId,
      );
    }

    const project = await prisma.project.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.niche !== undefined
          ? { niche: data.niche || null }
          : {}),
        ...(data.brandVoice !== undefined
          ? { brandVoice: data.brandVoice || null }
          : {}),
        ...(data.emoji !== undefined
          ? { emoji: data.emoji || null }
          : {}),
        ...(data.campaignGoal !== undefined
          ? { campaignGoal: data.campaignGoal || null }
          : {}),
        ...(data.targetAudience !== undefined
          ? { targetAudience: data.targetAudience || null }
          : {}),
        ...(data.offer !== undefined
          ? { offer: data.offer || null }
          : {}),
        ...(data.campaignStatus !== undefined
          ? { campaignStatus: data.campaignStatus }
          : {}),
        ...(data.launchDate !== undefined
          ? { launchDate: normalizeLaunchDate(data.launchDate) }
          : {}),
        ...(data.brandVoiceProfileId !== undefined
          ? {
              brandVoiceProfileId:
                data.brandVoiceProfileId ?? null,
            }
          : {}),
      },
    });

    res.json({ project });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await assertOwnsProject(
      req.user!.id,
      req.params.id,
    );

    await prisma.project.delete({
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
