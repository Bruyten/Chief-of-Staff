import { prisma } from "../lib/prisma.js";
import { buildPrompt } from "../lib/promptAssembler.js";
import { chat } from "../lib/aiClient.js";
import { logger } from "../lib/logger.js";
import { errors } from "../lib/errors.js";
import { refundUsage, reserveUsage } from "./usage.service.js";

export type GenerationUnitInput = {
  userId: string;
  skill: string;
  projectId?: string | null;
  context: Record<string, unknown>;
  taskType?: string;
  supplementalSystemContext?: string;
};

export type GenerationUnitResult = {
  taskId: string;
  skill: string;
  content: string;
  meta: {
    model: string;
    tokensIn: number;
    tokensOut: number;
    latencyMs: number;
    fake: boolean;
  };
  creditsRemaining: number;
};

async function assertProjectOwnership(
  userId: string,
  projectId?: string | null
) {
  if (!projectId) return;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    throw errors.forbidden("Project does not belong to you");
  }
}

export async function runGenerationUnit(
  input: GenerationUnitInput
): Promise<GenerationUnitResult> {
  const {
    userId,
    skill,
    projectId,
    context,
    taskType,
    supplementalSystemContext,
  } = input;

  await assertProjectOwnership(userId, projectId);

  const task = await prisma.task.create({
    data: {
      userId,
      projectId: projectId ?? null,
      type: taskType ?? skill,
      status: "running",
      input: context as object,
    },
  });

  const reservation = await reserveUsage(
    userId,
    "text",
    1,
    "text_ai_generation",
    {
      referenceType: "task",
      referenceId: task.id,
      metadata: {
        skill,
        taskType: taskType ?? skill,
      },
    }
  );

  try {
    const messages = buildPrompt(skill, context, {
      supplementalSystemContext,
    });

    const ai = await chat(messages);

    await prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        status: "done",
        result: {
          content: ai.content,
        } as object,
        tokensUsed: ai.tokensIn + ai.tokensOut,
        completedAt: new Date(),
      },
    });

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
      creditsRemaining: reservation.remaining,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI generation failure";

    logger.error(
      {
        err: error,
        taskId: task.id,
        skill,
      },
      "Generation unit failed"
    );

    await Promise.all([
      refundUsage(
        userId,
        "text",
        1,
        "text_ai_generation_failed",
        {
          referenceType: "task",
          referenceId: task.id,
          metadata: {
            skill,
            taskType: taskType ?? skill,
          },
        }
      ),
      prisma.task.update({
        where: {
          id: task.id,
        },
        data: {
          status: "failed",
          errorMsg: message,
          completedAt: new Date(),
        },
      }),
    ]);

    throw errors.server(
      "AI generation failed. Your text credit was refunded."
    );
  }
}
