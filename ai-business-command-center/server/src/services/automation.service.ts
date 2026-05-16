import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { computeNextRunAt } from "../lib/automationSchedule.js";
import {
  AUTOMATION_TYPE_META,
  type AutomationType,
} from "../lib/automationTypes.js";
import { ensureAvailableUsage } from "./usage.service.js";
import { createWorkflowRun } from "./workflow.service.js";
import { runGenerationUnit } from "./generationUnit.service.js";

type AutomationCadence = "daily" | "weekly" | "monthly";

export async function listAutomations(userId: string) {
  return prisma.automation.findMany({
    where: {
      userId,
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
      runs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });
}

export async function getAutomation(
  userId: string,
  automationId: string,
) {
  const automation = await prisma.automation.findFirst({
    where: {
      id: automationId,
      userId,
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
      runs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 25,
      },
    },
  });

  if (!automation) {
    throw errors.notFound("Automation not found");
  }

  return automation;
}

async function assertAutomationContextOwnership(input: {
  userId: string;
  projectId?: string | null;
  brandVoiceProfileId?: string | null;
}) {
  if (input.projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: input.projectId,
        userId: input.userId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw errors.notFound("Project not found");
    }
  }

  if (input.brandVoiceProfileId) {
    const profile = await prisma.brandVoiceProfile.findFirst({
      where: {
        id: input.brandVoiceProfileId,
        userId: input.userId,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw errors.notFound("Brand Voice Profile not found");
    }
  }
}

export async function createAutomation(input: {
  userId: string;
  name: string;
  type: AutomationType;
  projectId?: string | null;
  brandVoiceProfileId?: string | null;
  timezone: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  hour: number;
  minute: number;
  config: Record<string, unknown>;
}) {
  const meta = AUTOMATION_TYPE_META[input.type];

  await assertAutomationContextOwnership({
    userId: input.userId,
    projectId: input.projectId,
    brandVoiceProfileId: input.brandVoiceProfileId,
  });

  const nextRunAt = computeNextRunAt({
    cadence: meta.cadence,
    timezone: input.timezone,
    dayOfWeek: input.dayOfWeek ?? null,
    dayOfMonth: input.dayOfMonth ?? null,
    hour: input.hour,
    minute: input.minute,
  });

  return prisma.automation.create({
    data: {
      userId: input.userId,
      projectId: input.projectId ?? null,
      brandVoiceProfileId: input.brandVoiceProfileId ?? null,
      name: input.name,
      type: input.type,
      cadence: meta.cadence,
      enabled: true,
      timezone: input.timezone,
      dayOfWeek: input.dayOfWeek ?? null,
      dayOfMonth: input.dayOfMonth ?? null,
      hour: input.hour,
      minute: input.minute,
      config: input.config as object,
      nextRunAt,
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
      runs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });
}

export async function updateAutomation(
  userId: string,
  automationId: string,
  input: Partial<{
    name: string;
    enabled: boolean;
    timezone: string;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    hour: number;
    minute: number;
    config: Record<string, unknown>;
  }>,
) {
  const existing = await prisma.automation.findFirst({
    where: {
      id: automationId,
      userId,
    },
  });

  if (!existing) {
    throw errors.notFound("Automation not found");
  }

  const nextRunAt = computeNextRunAt({
    cadence: existing.cadence as AutomationCadence,
    timezone: input.timezone ?? existing.timezone,
    dayOfWeek:
      input.dayOfWeek !== undefined
        ? input.dayOfWeek
        : existing.dayOfWeek,
    dayOfMonth:
      input.dayOfMonth !== undefined
        ? input.dayOfMonth
        : existing.dayOfMonth,
    hour: input.hour ?? existing.hour,
    minute: input.minute ?? existing.minute,
  });

  return prisma.automation.update({
    where: {
      id: existing.id,
    },
    data: {
      ...(input.name !== undefined
        ? {
            name: input.name,
          }
        : {}),
      ...(input.enabled !== undefined
        ? {
            enabled: input.enabled,
          }
        : {}),
      ...(input.timezone !== undefined
        ? {
            timezone: input.timezone,
          }
        : {}),
      ...(input.dayOfWeek !== undefined
        ? {
            dayOfWeek: input.dayOfWeek,
          }
        : {}),
      ...(input.dayOfMonth !== undefined
        ? {
            dayOfMonth: input.dayOfMonth,
          }
        : {}),
      ...(input.hour !== undefined
        ? {
            hour: input.hour,
          }
        : {}),
      ...(input.minute !== undefined
        ? {
            minute: input.minute,
          }
        : {}),
      ...(input.config !== undefined
        ? {
            config: input.config as object,
          }
        : {}),
      nextRunAt,
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
      runs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });
}

export async function enableAutomation(
  userId: string,
  automationId: string,
) {
  return updateAutomation(userId, automationId, {
    enabled: true,
  });
}

export async function disableAutomation(
  userId: string,
  automationId: string,
) {
  return updateAutomation(userId, automationId, {
    enabled: false,
  });
}

export async function deleteAutomation(
  userId: string,
  automationId: string,
) {
  const existing = await prisma.automation.findFirst({
    where: {
      id: automationId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw errors.notFound("Automation not found");
  }

  await prisma.automation.delete({
    where: {
      id: existing.id,
    },
  });
}

export async function queueAutomationRunNow(
  userId: string,
  automationId: string,
) {
  const automation = await prisma.automation.findFirst({
    where: {
      id: automationId,
      userId,
    },
  });

  if (!automation) {
    throw errors.notFound("Automation not found");
  }

  const meta =
    AUTOMATION_TYPE_META[automation.type as AutomationType];

  return prisma.automationRun.create({
    data: {
      automationId: automation.id,
      userId,
      projectId: automation.projectId,
      brandVoiceProfileId: automation.brandVoiceProfileId,
      type: automation.type,
      trigger: "manual",
      status: "queued",
      creditsRequired: meta.creditsRequired,
    },
  });
}

export async function claimDueAutomations(limit: number) {
  const now = new Date();
  const lockUntil = new Date(now.getTime() + 20 * 60 * 1000);

  const candidates = await prisma.automation.findMany({
    where: {
      enabled: true,
      nextRunAt: {
        lte: now,
      },
      OR: [
        {
          lockedUntil: null,
        },
        {
          lockedUntil: {
            lt: now,
          },
        },
      ],
    },
    orderBy: {
      nextRunAt: "asc",
    },
    take: limit,
    select: {
      id: true,
    },
  });

  const claimedIds: string[] = [];

  for (const candidate of candidates) {
    const claimed = await prisma.automation.updateMany({
      where: {
        id: candidate.id,
        enabled: true,
        nextRunAt: {
          lte: now,
        },
        OR: [
          {
            lockedUntil: null,
          },
          {
            lockedUntil: {
              lt: now,
            },
          },
        ],
      },
      data: {
        lockedUntil: lockUntil,
      },
    });

    if (claimed.count === 1) {
      claimedIds.push(candidate.id);
    }
  }

  return claimedIds;
}

async function completeAutomationMetadata(input: {
  automationId: string;
  automationCadence: AutomationCadence;
  timezone: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  hour: number;
  minute: number;
  status: string;
  lastError?: string | null;
  failureIncrement?: boolean;
}) {
  await prisma.automation.update({
    where: {
      id: input.automationId,
    },
    data: {
      lastRunAt: new Date(),
      lastStatus: input.status,
      lastError: input.lastError ?? null,
      ...(input.failureIncrement
        ? {
            failureCount: {
              increment: 1,
            },
          }
        : {
            failureCount: 0,
          }),
      lockedUntil: null,
      nextRunAt: computeNextRunAt({
        cadence: input.automationCadence,
        timezone: input.timezone,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        hour: input.hour,
        minute: input.minute,
      }),
    },
  });
}

export async function executeAutomation(
  automationId: string,
  trigger: "scheduled" | "manual",
) {
  const automation = await prisma.automation.findUnique({
    where: {
      id: automationId,
    },
  });

  if (!automation) {
    throw errors.notFound("Automation not found");
  }

  const meta =
    AUTOMATION_TYPE_META[automation.type as AutomationType];

  const run = await prisma.automationRun.create({
    data: {
      automationId: automation.id,
      userId: automation.userId,
      projectId: automation.projectId,
      brandVoiceProfileId: automation.brandVoiceProfileId,
      type: automation.type,
      trigger,
      status: "running",
      creditsRequired: meta.creditsRequired,
      startedAt: new Date(),
    },
  });

  try {
    await ensureAvailableUsage(
      automation.userId,
      "text",
      meta.creditsRequired,
    );
  } catch {
    await prisma.automationRun.update({
      where: {
        id: run.id,
      },
      data: {
        status: "skipped",
        errorMsg:
          "Automation skipped because there are not enough text credits available.",
        completedAt: new Date(),
      },
    });

    await completeAutomationMetadata({
      automationId: automation.id,
      automationCadence: automation.cadence as AutomationCadence,
      timezone: automation.timezone,
      dayOfWeek: automation.dayOfWeek,
      dayOfMonth: automation.dayOfMonth,
      hour: automation.hour,
      minute: automation.minute,
      status: "skipped",
      lastError: "Not enough text credits",
    });

    return;
  }

  try {
    if (
      automation.type === "weekly_content_plan" ||
      automation.type === "daily_trend_research"
    ) {
      const workflowRun = await createWorkflowRun({
        userId: automation.userId,
        templateId:
          automation.type === "daily_trend_research"
            ? "daily_trend_research"
            : "weekly_content",
        title: automation.name,
        projectId: automation.projectId,
        brandVoiceProfileId: automation.brandVoiceProfileId,
        context:
          (automation.config as Record<string, unknown>) ?? {},
      });

      await prisma.automationRun.update({
        where: {
          id: run.id,
        },
        data: {
          status: workflowRun.status,
          workflowRunId: workflowRun.id,
          creditsSpent: workflowRun.creditsSpent,
          completedAt: new Date(),
          result: {
            workflowRunId: workflowRun.id,
          } as object,
        },
      });
    } else {
      const skill =
        automation.type === "monthly_campaign_ideas"
          ? "automation_monthly_campaign_ideas"
          : "automation_weekly_task_recommendation";

      const generation = await runGenerationUnit({
        userId: automation.userId,
        projectId: automation.projectId,
        skill,
        context:
          (automation.config as Record<string, unknown>) ?? {},
        taskType: `automation:${automation.type}`,
      });

      const output = await prisma.output.create({
        data: {
          userId: automation.userId,
          projectId: automation.projectId,
          type: skill,
          title: automation.name,
          content: generation.content,
          inputSnapshot:
            (automation.config as object) ?? {},
        },
      });

      await prisma.automationRun.update({
        where: {
          id: run.id,
        },
        data: {
          status: "completed",
          outputId: output.id,
          creditsSpent: 1,
          completedAt: new Date(),
          result: {
            outputId: output.id,
          } as object,
        },
      });
    }

    await completeAutomationMetadata({
      automationId: automation.id,
      automationCadence: automation.cadence as AutomationCadence,
      timezone: automation.timezone,
      dayOfWeek: automation.dayOfWeek,
      dayOfMonth: automation.dayOfMonth,
      hour: automation.hour,
      minute: automation.minute,
      status: "completed",
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        automationId: automation.id,
      },
      "Automation execution failed",
    );

    await prisma.automationRun.update({
      where: {
        id: run.id,
      },
      data: {
        status: "failed",
        errorMsg: "Automation execution failed.",
        completedAt: new Date(),
      },
    });

    await completeAutomationMetadata({
      automationId: automation.id,
      automationCadence: automation.cadence as AutomationCadence,
      timezone: automation.timezone,
      dayOfWeek: automation.dayOfWeek,
      dayOfMonth: automation.dayOfMonth,
      hour: automation.hour,
      minute: automation.minute,
      status: "failed",
      lastError: "Automation execution failed",
      failureIncrement: true,
    });
  }
}

export async function runDueAutomations(limit = 10) {
  const claimedIds = await claimDueAutomations(limit);

  for (const automationId of claimedIds) {
    await executeAutomation(automationId, "scheduled");
  }

  return {
    claimed: claimedIds.length,
    automationIds: claimedIds,
  };
}
