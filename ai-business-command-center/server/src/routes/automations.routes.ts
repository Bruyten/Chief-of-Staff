import { Router } from "express";
  projectId: z.string().cuid().nullable().optional(),
  brandVoiceProfileId: z.string().cuid().nullable().optional(),
  timezone: safeText(80, 1),
  dayOfWeek: z.number().int().min(1).max(7).nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  config: boundedJsonRecord(40, 50_000),
});

router.get("/", async (req, res, next) => {
  try {
    const automations = await listAutomations(req.user!.id);
    res.json({ automations });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const automation = await createAutomation({
      userId: req.user!.id,
      ...data,
    });

    res.status(201).json({ automation });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const automation = await getAutomation(req.user!.id, req.params.id);
    res.json({ automation });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = createSchema.partial().parse(req.body);
    const automation = await updateAutomation(req.user!.id, req.params.id, data);
    res.json({ automation });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await deleteAutomation(req.user!.id, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/enable", async (req, res, next) => {
  try {
    const automation = await enableAutomation(req.user!.id, req.params.id);
    res.json({ automation });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/disable", async (req, res, next) => {
  try {
    const automation = await disableAutomation(req.user!.id, req.params.id);
    res.json({ automation });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/run-now", automationManualRunLimiter, async (req, res, next) => {
  try {
    const run = await queueAutomationRunNow(req.user!.id, req.params.id);
    res.status(202).json({ run });
  } catch (e) {
    next(e);
  }
});

router.get("/:id/runs", async (req, res, next) => {
  try {
    const automation = await getAutomation(req.user!.id, req.params.id);
    res.json({ runs: automation.runs });
  } catch (e) {
    next(e);
  }
});

export default router;
