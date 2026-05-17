import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";
import {
  findWorkflowTemplate,
  WORKFLOW_TEMPLATES,
} from "../lib/workflowTemplates.js";
import { runGenerationUnit } from "./generationUnit.service.js";
import { enrichDailyTrendResearchContext } from "./research.service.js";
import { enrichProductOpportunityContext } from "./productOpportunity.service.js";

export function listWorkflowTemplates() {
  return WORKFLOW_TEMPLATES;
}

export async function listWorkflowRuns(userId: string) {
  return prisma.workflowRun.findMany({
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
      steps: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

export async function getWorkflowRun(userId: string, runId: string) {
  const run = await prisma.workflowRun.findFirst({
    where: {
      id: runId,
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
      steps: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          output: true,
        },
      },
    },
  });

  if (!run) {
    throw errors.notFound("Workflow run not found");
  }

  return run;
}

async function assertWorkflowContextOwnership(input: {
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

export async function createWorkflowRun(input: {
  userId: string;
  templateId: string;
  title?: string;
  projectId?: string | null;
  brandVoiceProfileId?: string | null;
  context: Record<string, unknown>;
}) {
  const template = findWorkflowTemplate(input.templateId);

  if (!template) {
    throw errors.badRequest("Unknown workflow template");
  }

  await assertWorkflowContextOwnership({
    userId: input.userId,
    projectId: input.projectId,
    brandVoiceProfileId: input.brandVoiceProfileId,
  });

  let effectiveContext = input.context;

  if (
    template.id === "daily_trend_research" ||
    template.id === "daily_product_opportunity_engine"
  ) {
    effectiveContext =
      await enrichDailyTrendResearchContext(effectiveContext);
  }

  if (template.id === "daily_product_opportunity_engine") {
    effectiveContext = await enrichProductOpportunityContext(
      input.userId,
      effectiveContext,
    );
  }

  const run = await prisma.workflowRun.create({
    data: {
      userId: input.userId,
      projectId: input.projectId ?? null,
      brandVoiceProfileId: input.brandVoiceProfileId ?? null,
      templateId: template.id,
      title: input.title?.trim() || template.name,
      status: "running",
      input: effectiveContext as object,
    },
  });

  let creditsSpent = 0;
  let successfulSteps = 0;
  let failedSteps = 0;

  for (const step of template.steps) {
    const stepRecord = await prisma.workflowRunStep.create({
      data: {
        workflowRunId: run.id,
        stepKey: step.key,
        stepLabel: step.label,
        skill: step.skill,
        status: "running",
        input: effectiveContext as object,
        startedAt: new Date(),
      },
    });

    try {
      const result = await runGenerationUnit({
        userId: input.userId,
        skill: step.skill,
        projectId: input.projectId ?? null,
        context: effectiveContext,
        taskType: `workflow:${template.id}:${step.key}`,
      });

      const output = await prisma.output.create({
        data: {
          userId: input.userId,
          projectId: input.projectId ?? null,
          type: step.skill,
          title: step.outputTitle,
          content: result.content,
          inputSnapshot: effectiveContext as object,
        },
      });

      await prisma.workflowRunStep.update({
        where: {
          id: stepRecord.id,
        },
        data: {
          status: "done",
          content: result.content,
          tokensUsed: result.meta.tokensIn + result.meta.tokensOut,
          outputId: output.id,
          completedAt: new Date(),
        },
      });

      creditsSpent += 1;
      successfulSteps += 1;
    } catch (error) {
      failedSteps += 1;

      const message =
        error instanceof Error ? error.message : "Workflow step failed";

      await prisma.workflowRunStep.update({
        where: {
          id: stepRecord.id,
        },
        data: {
          status: "failed",
          errorMsg: message,
          completedAt: new Date(),
        },
      });
    }
  }

  const status =
    failedSteps === 0
      ? "completed"
      : successfulSteps > 0
        ? "completed_with_errors"
        : "failed";

  await prisma.workflowRun.update({
    where: {
      id: run.id,
    },
    data: {
      status,
      creditsSpent,
      completedAt: new Date(),
      summary:
        status === "completed"
          ? "Workflow completed successfully."
          : status === "completed_with_errors"
            ? "Workflow completed with one or more failed steps."
            : "Workflow failed before producing a successful step.",
    },
  });

  return getWorkflowRun(input.userId, run.id);
}
