import { Router } from "express";

    res.status(201).json({ conversation });
  } catch (e) {
    next(e);
  }
});

router.get("/conversations/:id", async (req, res, next) => {
  try {
    await assertOwnsConversation(req.user!.id, req.params.id);

    const conversation = await prisma.chatConversation.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: {
        project: { select: { id: true, name: true, emoji: true } },
        brandVoiceProfile: { select: { id: true, brandName: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) throw errors.notFound("Chat conversation not found");
    res.json({ conversation });
  } catch (e) {
    next(e);
  }
});

router.patch("/conversations/:id", async (req, res, next) => {
  try {
    const data = z
      .object({
        title: optionalSafeText(180),
        archived: z.boolean().optional(),
      })
      .parse(req.body);

    const owned = await assertOwnsConversation(req.user!.id, req.params.id);

    const conversation = await prisma.chatConversation.update({
      where: { id: owned.id },
      data: {
        ...(data.title !== undefined ? { title: data.title || null } : {}),
        ...(data.archived !== undefined ? { archivedAt: data.archived ? new Date() : null } : {}),
      },
    });

    res.json({ conversation });
  } catch (e) {
    next(e);
  }
});

router.delete("/conversations/:id", async (req, res, next) => {
  try {
    const owned = await assertOwnsConversation(req.user!.id, req.params.id);
    await prisma.chatConversation.delete({ where: { id: owned.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/conversations/:id/messages", chatLimiter, async (req, res, next) => {
  try {
    await assertOwnsConversation(req.user!.id, req.params.id);
    const data = sendMessageSchema.parse(req.body);

    const result = await sendChiefOfStaffMessage({
      userId: req.user!.id,
      conversationId: req.params.id,
      content: data.content,
    });

    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
