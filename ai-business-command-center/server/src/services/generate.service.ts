// THE CORE OF THE BACKEND.
//
// Every AI generation flows through this single function. Pattern:
//   1. Create Task row (status="running")
//   2. Build prompt
//   3. Call AI (or fake)
//   4. Update Task (status="done" or "failed")
//   5. Decrement credits
//   6. Return result
//
// Every generate route in routes/generate.routes.ts is a thin wrapper that
// validates input then calls this function.

import { prisma } from "../lib/prisma.js";
import { buildPrompt } from "../lib/promptAssembler.js";
import { chat } from "../lib/aiClient.js";
import { consumeCredit } from "./credits.service.js";
import { logger } from "../lib/logger.js";
import { errors } from "../lib/errors.js";

export type GenerateInput = {
  userId: string;
  skill: string;            // tiktok_script | instagram_caption | …
  projectId?: string;
  context: Record<string, unknown>; // form fields
};

export type GenerateResult = {
  taskId: string;
  skill: string;
  content: string;          // Markdown
  meta: {
    model: string;
    tokensIn: number;
    tokensOut: number;
    latencyMs: number;
    fake: boolean;
  };
  creditsRemaining: number;
};

export async function runGeneration(input: GenerateInput): Promise<GenerateResult> {
  const { userId, skill, projectId, context } = input;

  // If projectId is provided, verify the user owns it
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });
    if (!project) throw errors.forbidden("Project does not belong to you");
  }

  // 1. Reserve a Task row up front
  const task = await prisma.task.create({
    data: {
      userId,
      projectId: projectId ?? null,
      type: skill,
      status: "running",
      input: context as object,
    },
  });

  try {
    // 2. Assemble prompt
    const messages = buildPrompt(skill, context);

    // 3. Call AI
    const ai = await chat(messages);

    // 4. Mark task done
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: "done",
        result: { content: ai.content } as object,
        tokensUsed: ai.tokensIn + ai.tokensOut,
        completedAt: new Date(),
      },
    });

    // 5. Charge a credit (never charge for failures)
    const creditsRemaining = await consumeCredit(userId);

    return {
      taskId: task.id,
      skill,
      content: ai.content,
      meta: {
        model: ai.model,
        tokensIn: ai.tokensIn,
        tokensOut: ai.tokensOut,
        latencyMs: ai.latencyMs,
        fake: ai.fake,
      },
      creditsRemaining,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI failure";
    logger.error({ err, taskId: task.id, skill }, "Generation failed");
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "failed", errorMsg: message, completedAt: new Date() },
    });
    throw errors.server("AI generation failed. No credits were charged.");
  }
}
