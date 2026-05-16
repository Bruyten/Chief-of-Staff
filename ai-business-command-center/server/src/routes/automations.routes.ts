import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  boundedJsonRecord,
  optionalSafeText,
  safeText,
} from "../lib/securityText.js";
import {
  createAutomation,
  deleteAutomation,
  disableAutomation,
  enableAutomation,
  getAutomation,
  listAutomations,
  queueAutomationRunNow,
  updateAutomation,
} from "../services/automation.service.js";
import { assertOwnsAutomation } from "../services/ownership.service.js";

const router = Router();

router.use(requireAuth);

const automationTypeSchema = z.enum([
  "daily_trend_research",
  "weekly_content_plan",
  "monthly_campaign_ideas",
  "weekly_task_recommendation",
]);

const automationIdSchema = z.string().cuid();

const createSchema = z.object({
  name: safeText(180, 1),
  type: automationTypeSchema,
  projectId: z.string().cuid().nullable().optional(),
  brandVoiceProfileId: z.string().cuid().nullable().optional(),
  timezone: safeText(120, 1),
  dayOfWeek: z.number().int().min(1).max(7).nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  config: boundedJsonRecord(40, 50_000),
});

const updateSchema = z
  .object({
    name: optionalSafeText(180),
    enabled: z.boolean().optional(),
    timezone: safeText(120, 1).optional(),
    dayOfWeek: z
      .number()
      .int()
      .min(1)
      .max(7)
      .nullable()
      .optional(),
    dayOfMonth: z
      .number()
      .int()
      .min(1)
      .max(31)
      .nullable()
      .optional(),
    hour: z.number().int().min(0).max(23).optional(),
    minute: z.number().int().min(0).max(59).optional(),
    config: boundedJsonRecord(40, 50_000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

router.get("/", async (req, res, next) => {
  try {
    const automations = await listAutomations(req.user!.id);
    res.json({ automations });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const automationId = automationIdSchema.parse(req.params.id);

    const automation = await getAutomation(
      req.user!.id,
      automationId,
    );

    res.json({ automation });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const automation = await createAutomation({
      userId: req.user!.id,
      name: data.name,
      type: data.type,
      projectId: data.projectId ?? null,
      brandVoiceProfileId: data.brandVoiceProfileId ?? null,
      timezone: data.timezone,
      dayOfWeek: data.dayOfWeek ?? null,
      dayOfMonth: data.dayOfMonth ?? null,
      hour: data.hour,
      minute: data.minute,
      config: data.config,
    });

    res.status(201).json({ automation });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const automationId = automationIdSchema.parse(req.params.id);
    const data = updateSchema.parse(req.body);

    const automation = await updateAutomation(
      req.user!.id,
      automationId,
      {
        ...(data.name !== undefined
          ? {
              name: data.name || "",
            }
          : {}),
        ...(data.enabled !== undefined
          ? {
              enabled: data.enabled,
            }
          : {}),
        ...(data.timezone !== undefined
          ? {
              timezone: data.timezone,
            }
          : {}),
        ...(data.dayOfWeek !== undefined
          ? {
              dayOfWeek: data.dayOfWeek,
            }
          : {}),
        ...(data.dayOfMonth !== undefined
          ? {
              dayOfMonth: data.dayOfMonth,
            }
          : {}),
        ...(data.hour !== undefined
          ? {
              hour: data.hour,
            }
          : {}),
        ...(data.minute !== undefined
          ? {
              minute: data.minute,
            }
          : {}),
        ...(data.config !== undefined
          ? {
              config: data.config,
            }
          : {}),
      },
    );

    res.json({ automation });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const automationId = automationIdSchema.parse(req.params.id);

    await deleteAutomation(req.user!.id, automationId);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/enable", async (req, res, next) => {
  try {
    const automationId = automationIdSchema.parse(req.params.id);

    const automation = await enableAutomation(
      req.user!.id,
      automationId,
    );

    res.json({ automation });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/disable", async (req, res, next) => {
  try {
    const automationId = automationIdSchema.parse(req.params.id);

    const automation = await disableAutomation(
      req.user!.id,
      automationId,
    );

    res.json({ automation });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/run-now", async (req, res, next) => {
  try {
    const automationId = automationIdSchema.parse(req.params.id);

    await assertOwnsAutomation(req.user!.id, automationId);

    const run = await queueAutomationRunNow(
      req.user!.id,
      automationId,
    );

    res.status(201).json({ run });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/runs", async (req, res, next) => {
  try {
    const automationId = automationIdSchema.parse(req.params.id);

    await assertOwnsAutomation(req.user!.id, automationId);

    const runs = await prisma.automationRun.findMany({
      where: {
        automationId,
        userId: req.user!.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    res.json({ runs });
  } catch (error) {
    next(error);
  }
});

export default router;
