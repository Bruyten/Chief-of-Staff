import { prisma } from "../lib/prisma.js";
        lastStatus: true,
        lastError: true,
        project: { select: { id: true, name: true, emoji: true } },
        runs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            completedAt: true,
            errorMsg: true,
          },
        },
      },
    }),

    prisma.output.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { id: true, name: true, emoji: true } },
      },
    }),

    prisma.workflowRun.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        templateId: true,
        status: true,
        creditsSpent: true,
        startedAt: true,
        completedAt: true,
        updatedAt: true,
        project: { select: { id: true, name: true, emoji: true } },
      },
    }),

    prisma.project.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        emoji: true,
        campaignStatus: true,
        campaignGoal: true,
        targetAudience: true,
        offer: true,
        launchDate: true,
        updatedAt: true,
        _count: {
          select: {
            outputs: true,
            workflowRuns: true,
            chatConversations: true,
            automations: true,
          },
        },
      },
    }),
  ]);

  return {
    stats: {
      brandVoiceCount,
      projectCount,
      outputCount,
    },
    recommendations: buildRecommendations({
      brandVoiceCount,
      workflowCandidate,
      contentGapProject,
      strategyGapProject,
      videoConceptCandidate,
    }),
    activeAutomations: activeAutomations.map((automation) => ({
      ...automation,
      latestRun: automation.runs[0] ?? null,
      runs: undefined,
    })),
    recentOutputs,
    recentWorkflowRuns,
    recentlyActiveProject,
  };
}
