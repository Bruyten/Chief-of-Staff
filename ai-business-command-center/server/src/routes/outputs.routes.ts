import { Router } from "express";
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
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    await assertOwnsOutput(req.user!.id, req.params.id);

    const output = await prisma.output.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!output) throw errors.notFound("Output not found");
    res.json({ output });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = z
      .object({
        title: safeText(200, 1).optional(),
        content: safeText(100_000, 1).optional(),
      })
      .refine((value) => Object.keys(value).length > 0, {
        message: "Provide at least one field to update",
      })
      .parse(req.body);

    const owns = await assertOwnsOutput(req.user!.id, req.params.id);

    const updated = await prisma.output.update({
      where: { id: owns.id },
      data,
    });

    res.json({ output: updated });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const owns = await assertOwnsOutput(req.user!.id, req.params.id);
    await prisma.output.delete({ where: { id: owns.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
