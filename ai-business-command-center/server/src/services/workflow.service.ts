import { prisma } from "../lib/prisma.js";
  });

  let creditsSpent = 0;
  let failureCount = 0;

  for (const step of template.steps) {
    const stepRecord = await prisma.workflowRunStep.create({
      data: {
        workflowRunId: run.id,
        stepKey: step.key,
        stepLabel: step.label,
        skill: step.skill,
        status: "running",
        input: input.context as object,
        startedAt: new Date(),
      },
    });

    try {
      const result = await runGenerationUnit({
        userId: input.userId,
        skill: step.skill,
        projectId: input.projectId ?? null,
        context: input.context,
        taskType: `workflow:${template.id}:${step.key}`,
      });

      const output = await prisma.output.create({
        data: {
          userId: input.userId,
          projectId: input.projectId ?? null,
          type: step.skill,
          title: step.outputTitle,
          content: result.content,
          inputSnapshot: input.context as object,
        },
      });

      await prisma.workflowRunStep.update({
        where: { id: stepRecord.id },
        data: {
          status: "done",
          content: result.content,
          tokensUsed: result.meta.tokensIn + result.meta.tokensOut,
          outputId: output.id,
          completedAt: new Date(),
        },
      });

      creditsSpent += 1;
    } catch (err) {
      failureCount += 1;
      const message = err instanceof Error ? err.message : "Workflow step failed";

      await prisma.workflowRunStep.update({
        where: { id: stepRecord.id },
        data: {
          status: "failed",
          errorMsg: message,
          completedAt: new Date(),
        },
      });
    }
  }

  const status = failureCount === 0 ? "completed" : creditsSpent > 0 ? "completed_with_errors" : "failed";

  await prisma.workflowRun.update({
    where: { id: run.id },
    data: {
      status,
      creditsSpent,
      completedAt: new Date(),
    },
  });

  return getWorkflowRun(input.userId, run.id);
}
