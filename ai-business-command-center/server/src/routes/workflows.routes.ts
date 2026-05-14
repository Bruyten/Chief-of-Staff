import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { workflowLimiter } from "../middleware/rateLimit.js";
import { boundedJsonRecord, optionalSafeText } from "../lib/securityText.js";
import {
  createWorkflowRun,
  getWorkflowRun,
  listWorkflowRuns,
  listWorkflowTemplates,
} from "../services/workflow.service.js";

const router = Router();
router.use(requireAuth);

const launchSchema = z.object({
  templateId: z.string().min(1).max(120),
  title: optionalSafeText(180),
  projectId: z.string().cuid().nullable().optional(),
  brandVoiceProfileId: z.string().cuid().nullable().optional(),
  context: boundedJsonRecord(40, 50_000),
});

router.get("/templates", (_req, res) => {
  res.json({ templates: listWorkflowTemplates() });
});

router.get("/runs", async (req, res, next) => {
  try {
    const runs = await listWorkflowRuns(req.user!.id);
    res.json({ runs });
  } catch (e) {
    next(e);
  }
});

router.get("/runs/:id", async (req, res, next) => {
  try {
    const run = await getWorkflowRun(req.user!.id, req.params.id);
    res.json({ run });
  } catch (e) {
    next(e);
  }
});

router.post("/runs", workflowLimiter, async (req, res, next) => {
  try {
    const data = launchSchema.parse(req.body);
    const run = await createWorkflowRun({
      userId: req.user!.id,
      templateId: data.templateId,
      title: data.title || undefined,
      projectId: data.projectId ?? null,
      brandVoiceProfileId: data.brandVoiceProfileId ?? null,
      context: data.context,
    });

    res.status(201).json({ run });
  } catch (e) {
    next(e);
  }
});

export default router;
