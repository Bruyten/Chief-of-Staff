import { prisma } from "../lib/prisma.js";
    "chief_of_staff_chat",
    {
      referenceType: "chat_conversation",
      referenceId: context.conversation.id,
      metadata: {
        projectId: context.conversation.projectId,
        brandVoiceProfileId: context.conversation.brandVoiceProfileId,
      },
    }
  );

  const userMessage = await prisma.chatMessage.create({
    data: {
      conversationId: context.conversation.id,
      role: "user",
      content: input.content,
    },
  });

  try {
    const ai = await chat([
      {
        role: "system",
        content: CHIEF_OF_STAFF_SYSTEM_PROMPT,
      },
      ...(context.contextText
        ? [
            {
              role: "system" as const,
              content: context.contextText,
            },
          ]
        : []),
      ...context.historicMessages,
      {
        role: "user",
        content: input.content,
      },
    ]);

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId: context.conversation.id,
        role: "assistant",
        content: ai.content,
        tokensUsed: ai.tokensIn + ai.tokensOut,
        model: ai.model,
        metadata: {
          fake: ai.fake,
          latencyMs: ai.latencyMs,
        },
      },
    });

    await prisma.chatConversation.update({
      where: { id: context.conversation.id },
      data: {
        lastMessageAt: new Date(),
        title: context.conversation.title || input.content.slice(0, 80),
      },
    });

    return {
      userMessage,
      assistantMessage,
      creditsRemaining: usageReservation.remaining,
    };
  } catch (err) {
    logger.error({ err, conversationId: context.conversation.id }, "Chief of Staff chat failed");

    await refundUsage(input.userId, "text", 1, "chief_of_staff_chat_failed", {
      referenceType: "chat_conversation",
      referenceId: context.conversation.id,
    });

    throw errors.server("Chat generation failed. Your text credit was refunded.");
  }
}
