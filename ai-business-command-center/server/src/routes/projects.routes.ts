import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { errors } from "../lib/errors.js";
import { optionalSafeText, safeText } from "../lib/securityText.js";
import { assertOwnsBrandProfile } from "../services/ownership.service.js";

const router = Router();
router.use(requireAuth);

const campaignStatusSchema = z.enum(["planning", "active", "paused", "completed"]);

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

router.get("/", async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: "desc" },
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
export default router;
