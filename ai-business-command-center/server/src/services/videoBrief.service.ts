import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";

export type VideoStudioCreateInput = {
  title: string;
  sourceType: "scratch" | "project" | "output" | "workflow_run";
  projectId?: string | null;
  sourceOutputId?: string | null;
  sourceWorkflowRunId?: string | null;
  useCase:
    | "promo_ad"
    | "product_highlight"
    | "offer_announcement"
    | "social_reel";
  aspectRatio: "9:16" | "1:1" | "16:9";
  durationSeconds: 6 | 8 | 12;
  toneStyle: string;
  cta?: string;
};

function clip(value: string | null | undefined, max: number) {
  const clean = (value ?? "").trim();

  if (clean.length <= max) {
    return clean;
  }

  return `${clean.slice(0, max).trim()}…`;
}

function useCaseLabel(input: VideoStudioCreateInput["useCase"]) {
  switch (input) {
    case "promo_ad":
      return "Promo ad";
    case "product_highlight":
      return "Product highlight";
    case "offer_announcement":
      return "Offer announcement";
    case "social_reel":
      return "Social reel";
    default:
      return "Marketing video";
  }
}

export async function buildVideoPromptBrief(
  userId: string,
  input: VideoStudioCreateInput,
) {
  const project = input.projectId
    ? await prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId,
        },
        include: {
          brandVoiceProfile: true,
        },
      })
    : null;

  if (input.projectId && !project) {
    throw errors.notFound("Selected project was not found");
  }

  const sourceOutput = input.sourceOutputId
    ? await prisma.output.findFirst({
        where: {
          id: input.sourceOutputId,
          userId,
        },
      })
    : null;

  if (input.sourceType === "output" && !sourceOutput) {
    throw errors.notFound("Selected saved output was not found");
  }

  const sourceWorkflowRun = input.sourceWorkflowRunId
    ? await prisma.workflowRun.findFirst({
        where: {
          id: input.sourceWorkflowRunId,
          userId,
        },
        include: {
          steps: {
            where: {
              status: "done",
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              stepLabel: true,
              content: true,
            },
          },
        },
      })
    : null;

  if (
    input.sourceType === "workflow_run" &&
    !sourceWorkflowRun
  ) {
    throw errors.notFound(
      "Selected workflow run was not found",
    );
  }

  if (
    sourceOutput?.projectId &&
    project &&
    sourceOutput.projectId !== project.id
  ) {
    throw errors.badRequest(
      "Selected output does not belong to the selected project",
    );
  }

  if (
    sourceWorkflowRun?.projectId &&
    project &&
    sourceWorkflowRun.projectId !== project.id
  ) {
    throw errors.badRequest(
      "Selected workflow run does not belong to the selected project",
    );
  }

  const lines: string[] = [
    "Create a polished AI-generated marketing video concept using the following production brief.",
    "",
    `Video use case: ${useCaseLabel(input.useCase)}`,
    `Title: ${input.title}`,
    `Aspect ratio: ${input.aspectRatio}`,
    `Target length: ${input.durationSeconds} seconds`,
    `Tone / visual style: ${input.toneStyle}`,
    `CTA: ${input.cta?.trim() || "No explicit CTA provided"}`,
    "",
    "Production guardrails:",
    "- Keep the concept concise and high-impact.",
    "- Favor short-form social pacing unless aspect ratio implies otherwise.",
    "- Do not invent claims, prices, or product details that are not provided.",
    "- Do not include real celebrity likenesses, protected logos, or copyrighted characters unless the source material explicitly makes that safe.",
  ];

  if (project) {
    lines.push(
      "",
      "Project / campaign context:",
      `- Project: ${project.name}`,
      `- Niche: ${project.niche || "(not provided)"}`,
      `- Campaign goal: ${project.campaignGoal || "(not provided)"}`,
      `- Target audience: ${project.targetAudience || "(not provided)"}`,
      `- Offer: ${project.offer || "(not provided)"}`,
      `- Status: ${project.campaignStatus || "planning"}`,
    );

    if (project.brandVoiceProfile) {
      lines.push(
        "",
        "Brand voice context:",
        `- Brand: ${project.brandVoiceProfile.brandName}`,
        `- Tone: ${project.brandVoiceProfile.toneOfVoice || "(not provided)"}`,
        `- Value proposition: ${project.brandVoiceProfile.valueProposition || "(not provided)"}`,
        `- Preferred CTAs: ${project.brandVoiceProfile.preferredCtas || "(not provided)"}`,
        `- Avoid: ${project.brandVoiceProfile.bannedPhrases || "(not provided)"}`,
      );
    }
  }

  if (sourceOutput) {
    lines.push(
      "",
      "Source saved output:",
      `- Title: ${sourceOutput.title}`,
      `- Type: ${sourceOutput.type}`,
      "- Excerpt:",
      clip(sourceOutput.content, 1800),
    );
  }

  if (sourceWorkflowRun) {
    lines.push(
      "",
      "Source workflow run:",
      `- Workflow: ${sourceWorkflowRun.title}`,
      `- Status: ${sourceWorkflowRun.status}`,
    );

    if (sourceWorkflowRun.steps.length) {
      lines.push("- Successful step excerpts:");

      sourceWorkflowRun.steps.forEach((step, index) => {
        lines.push(
          `${index + 1}. ${step.stepLabel}`,
          clip(step.content, 1200),
        );
      });
    }
  }

  lines.push(
    "",
    "Output intent:",
    "Use the above material to generate a concise, visually coherent short marketing video.",
  );

  return {
    project,
    sourceOutput,
    sourceWorkflowRun,
    promptBrief: lines.join("\n"),
  };
}
