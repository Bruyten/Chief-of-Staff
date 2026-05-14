import { prisma } from "../lib/prisma.js";

export type DashboardActionPage =
  | "brand-voices"
  | "workflows"
  | "new-task"
  | "chief-chat"
  | "projects"
  | "saved-outputs";

export type DashboardRecommendation = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionLabel: string;
  actionPage: DashboardActionPage;
  actionParams?: Record<string, string>;
};

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function buildRecommendations(input: {
  brandVoiceCount: number;
  projectCount: number;
  workflowCandidate:
    | {
        id: string;
        name: string;
        emoji: string | null;
      }
    | null;
  contentGapProject:
    | {
        id: string;
        name: string;
        emoji: string | null;
      }
    | null;
  strategyGapProject:
    | {
        id: string;
        name: string;
        emoji: string | null;
      }
    | null;
  videoConceptCandidate:
    | {
        id: string;
        title: string;
        type: string;
        projectId: string | null;
      }
    | null;
}): DashboardRecommendation[] {
  const recommendations: DashboardRecommendation[] = [];

  if (input.projectCount === 0) {
    recommendations.push({
      id: "create-first-project",
      title: "Create your first Campaign Workspace",
      description:
        "Projects organize campaign goals, saved outputs, chat context, workflows, and future automations.",
      priority: "high",
      actionLabel: "Create Campaign",
      actionPage: "projects",
    });
  }

  if (input.brandVoiceCount === 0) {
    recommendations.push({
      id: "add-brand-profile",
      title: "Add a Brand Voice Profile",
      description:
        "Create reusable messaging context so Chat, Workflows, and future video prompts stay more consistent.",
      priority: "high",
      actionLabel: "Create Brand Profile",
      actionPage: "brand-voices",
    });
  }

  if (input.workflowCandidate) {
    recommendations.push({
      id: `workflow-${input.workflowCandidate.id}`,
      title: `Launch a workflow for ${input.workflowCandidate.name}`,
      description:
        "This active campaign has not used a workflow yet. A launch or weekly content workflow can turn strategy into reusable assets.",
      priority: "high",
      actionLabel: "Open Workflows",
      actionPage: "workflows",
      actionParams: {
        projectId: input.workflowCandidate.id,
      },
    });
  }

  if (input.contentGapProject) {
    recommendations.push({
      id: `content-gap-${input.contentGapProject.id}`,
      title: `Generate fresh content for ${input.contentGapProject.name}`,
      description:
        "This campaign has no recent saved outputs. Create a generator result or workflow run to restart momentum.",
      priority: "medium",
      actionLabel: "Create Content",
      actionPage: "new-task",
      actionParams: {
        projectId: input.contentGapProject.id,
      },
    });
  }

  if (input.strategyGapProject) {
    recommendations.push({
      id: `strategy-gap-${input.strategyGapProject.id}`,
      title: `Use Chief of Staff Chat for ${input.strategyGapProject.name}`,
      description:
        "This campaign workspace is missing strategic guidance or has not used project-aware chat yet.",
      priority: "medium",
      actionLabel: "Open Chat",
      actionPage: "chief-chat",
      actionParams: {
        projectId: input.strategyGapProject.id,
      },
    });
  }

  if (input.videoConceptCandidate) {
    recommendations.push({
      id: `video-concept-${input.videoConceptCandidate.id}`,
      title: "Review a saved asset that could become a Video Studio concept",
      description:
        "You have a recent short-form script or hook asset that can later feed Premium Video Studio.",
      priority: "low",
      actionLabel: "Review Saved Output",
      actionPage: "saved-outputs",
      actionParams: {
        outputId: input.videoConceptCandidate.id,
      },
    });
  }

  return recommendations.slice(0, 5);
}

export async function getDashboardCommandCenter(userId: string) {
  const recentOutputCutoff = daysAgo(14);

  const [
    brandVoiceCount,
    projectCount,
    outputCount,
    workflowCandidate,
    contentGapProject,
    strategyGapProject,
    videoConceptCandidate,
    activeAutomations,
    recentOutputs,
    recentWorkflowRuns,
    recentlyActiveProject,
  ] = await Promise.all([
    prisma.brandVoiceProfile.count({
      where: {
        userId,
      },
    }),

    prisma.project.count({
      where: {
        userId,
      },
    }),

    prisma.output.count({
      where: {
        userId,
      },
    }),

    prisma.project.findFirst({
      where: {
        userId,
        campaignStatus: "active",
        workflowRuns: {
          none: {},
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        emoji: true,
      },
    }),

    prisma.project.findFirst({
      where: {
        userId,
        campaignStatus: {
          in: ["active", "planning"],
        },
        outputs: {
          none: {
            updatedAt: {
              gte: recentOutputCutoff,
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        emoji: true,
      },
    }),

    prisma.project.findFirst({
      where: {
        userId,
        OR: [
          {
            campaignGoal: null,
          },
          {
            targetAudience: null,
          },
          {
            offer: null,
          },
          {
            chatConversations: {
              none: {},
            },
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        emoji: true,
      },
    }),

    prisma.output.findFirst({
      where: {
        userId,
        type: {
          in: ["tiktok_script", "hook_generator"],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        type: true,
        projectId: true,
      },
    }),

    prisma.automation.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          enabled: "desc",
        },
        {
          nextRunAt: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
      take: 6,
      select: {
        id: true,
        name: true,
        type: true,
        enabled: true,
        nextRunAt: true,
        lastRunAt: true,
        lastStatus: true,
        lastError: true,
        project: {
          select: {
            id: true,
            name: true,
            emoji: true,
          },
        },
        runs: {
          orderBy: {
            createdAt: "desc",
          },
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
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            emoji: true,
          },
        },
      },
    }),

    prisma.workflowRun.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
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
        project: {
          select: {
            id: true,
            name: true,
            emoji: true,
          },
        },
      },
    }),

    prisma.project.findFirst({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
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
      projectCount,
      workflowCandidate,
      contentGapProject,
      strategyGapProject,
      videoConceptCandidate,
    }),

    activeAutomations: activeAutomations.map((automation) => ({
      id: automation.id,
      name: automation.name,
      type: automation.type,
      enabled: automation.enabled,
      nextRunAt: automation.nextRunAt,
      lastRunAt: automation.lastRunAt,
      lastStatus: automation.lastStatus,
      lastError: automation.lastError,
      project: automation.project,
      latestRun: automation.runs[0] ?? null,
    })),

    recentOutputs,
    recentWorkflowRuns,
    recentlyActiveProject,
  };
}
