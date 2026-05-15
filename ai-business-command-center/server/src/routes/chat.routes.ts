import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { chatLimiter } from "../middleware/rateLimit.js";
import { errors } from "../lib/errors.js";
import {
  optionalSafeText,
  safeText,
} from "../lib/securityText.js";
import {
  createChatConversation,
  sendChiefOfStaffMessage,
} from "../services/chat.service.js";
import { assertOwnsConversation } from "../services/ownership.service.js";

const router = Router();

router.use(requireAuth);

const conversationSchema = z.object({
  title: optionalSafeText(180),
  projectId: z.string().cuid().nullable().optional(),
  brandVoiceProfileId: z.string().cuid().nullable().optional(),
});

const messageSchema = z.object({
  content: safeText(8000, 1),
});

const conversationIdSchema = z.string().cuid();

const updateConversationSchema = z
  .object({
    title: optionalSafeText(180),
    archived: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

router.get("/conversations", async (req, res, next) => {
  try {
    const conversations = await prisma.chatConversation.findMany({
      where: {
        userId: req.user!.id,
        archivedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            emoji: true,
          },
        },
        brandVoiceProfile: {
          select: {
            id: true,
            brandName: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
});

router.post("/conversations", async (req, res, next) => {
  try {
    const data = conversationSchema.parse(req.body);

    const conversation = await createChatConversation({
      userId: req.user!.id,
      title: data.title || undefined,
      projectId: data.projectId ?? null,
      brandVoiceProfileId: data.brandVoiceProfileId ?? null,
    });

    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
});

router.get("/conversations/:id", async (req, res, next) => {
  try {
    const conversationId = conversationIdSchema.parse(req.params.id);

    await assertOwnsConversation(req.user!.id, conversationId);

    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId: req.user!.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            emoji: true,
          },
        },
        brandVoiceProfile: {
          select: {
            id: true,
            brandName: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      throw errors.notFound("Chat conversation not found");
    }

    res.json({ conversation });
  } catch (error) {
    next(error);
  }
});

router.patch("/conversations/:id", async (req, res, next) => {
  try {
    const conversationId = conversationIdSchema.parse(req.params.id);
    const data = updateConversationSchema.parse(req.body);

    const owned = await assertOwnsConversation(
      req.user!.id,
      conversationId,
    );

    const conversation = await prisma.chatConversation.update({
      where: {
        id: owned.id,
      },
      data: {
        ...(data.title !== undefined
          ? {
              title: data.title || null,
            }
          : {}),
        ...(data.archived !== undefined
          ? {
              archivedAt: data.archived ? new Date() : null,
            }
          : {}),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            emoji: true,
          },
        },
        brandVoiceProfile: {
          select: {
            id: true,
            brandName: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    res.json({ conversation });
  } catch (error) {
    next(error);
  }
});

router.delete("/conversations/:id", async (req, res, next) => {
  try {
    const conversationId = conversationIdSchema.parse(req.params.id);

    const owned = await assertOwnsConversation(
      req.user!.id,
      conversationId,
    );

    await prisma.chatConversation.delete({
      where: {
        id: owned.id,
      },
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/conversations/:id/messages",
  chatLimiter,
  async (req, res, next) => {
    try {
      const conversationId = conversationIdSchema.parse(req.params.id);

      await assertOwnsConversation(req.user!.id, conversationId);

      const data = messageSchema.parse(req.body);

      const result = await sendChiefOfStaffMessage({
        userId: req.user!.id,
        conversationId,
        content: data.content,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
