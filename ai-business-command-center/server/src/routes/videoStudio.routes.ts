import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { videoGenerationLimiter } from "../middleware/rateLimit.js";
import {
  createVideoJob,
  getVideoJobForUser,
  listVideoJobsForUser,
  refreshVideoJobForUser,
} from "../services/videoStudio.service.js";

const router = Router();
router.use(requireAuth);

const createSchema = z
  .object({
    title: z.string().trim().min(1).max(140),
    sourceType: z.enum(["scratch", "project", "output", "workflow_run"]),
    projectId: z.string().cuid().nullable().optional(),
    sourceOutputId: z.string().cuid().nullable().optional(),
    sourceWorkflowRunId: z.string().cuid().nullable().optional(),
    useCase: z.enum(["promo_ad", "product_highlight", "offer_announcement", "social_reel"]),
    aspectRatio: z.enum(["9:16", "1:1", "16:9"]),
    durationSeconds: z.union([z.literal(6), z.literal(8), z.literal(12)]),
    toneStyle: z.string().trim().min(1).max(280),
    cta: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType === "project" && !value.projectId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["projectId"], message: "Select a project source" });
    }

    if (value.sourceType === "output" && !value.sourceOutputId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceOutputId"], message: "Select a saved output source" });
    }

    if (value.sourceType === "workflow_run" && !value.sourceWorkflowRunId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceWorkflowRunId"], message: "Select a workflow run source" });
    }
  });

router.get("/jobs", async (req, res, next) => {
  try {
    const jobs = await listVideoJobsForUser(req.user!.id);
    res.json({ jobs });
  } catch (e) {
    next(e);
  }
});

router.get("/jobs/:id", async (req, res, next) => {
  try {
    const job = await getVideoJobForUser(req.user!.id, req.params.id);
    res.json({ job });
  } catch (e) {
    next(e);
  }
});

router.post("/jobs", videoGenerationLimiter, async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const result = await createVideoJob(req.user!.id, data);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/jobs/:id/refresh", async (req, res, next) => {
  try {
    const job = await refreshVideoJobForUser(req.user!.id, req.params.id);
    res.json({ job });
  } catch (e) {
    next(e);
  }
});

export default router;
