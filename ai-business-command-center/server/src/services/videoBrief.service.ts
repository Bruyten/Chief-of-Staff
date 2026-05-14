import { prisma } from "../lib/prisma.js";
  }

  if (input.sourceType === "workflow_run" && !sourceWorkflowRun) {
    throw errors.notFound("Selected workflow run was not found");
  }

  if (sourceOutput?.projectId && project && sourceOutput.projectId !== project.id) {
    throw errors.badRequest("Selected output does not belong to the selected project");
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
      `- Status: ${project.campaignStatus || "planning"}`
    );

    if (project.brandVoiceProfile) {
      lines.push(
        "",
        "Brand voice context:",
        `- Brand: ${project.brandVoiceProfile.brandName}`,
        `- Tone: ${project.brandVoiceProfile.toneOfVoice || "(not provided)"}`,
        `- Value proposition: ${project.brandVoiceProfile.valueProposition || "(not provided)"}`,
        `- Preferred CTAs: ${project.brandVoiceProfile.preferredCtas || "(not provided)"}`,
        `- Avoid: ${project.brandVoiceProfile.bannedPhrases || "(not provided)"}`
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
      clip(sourceOutput.content, 1800)
    );
  }

  if (sourceWorkflowRun) {
    lines.push(
      "",
      "Source workflow run:",
      `- Workflow: ${sourceWorkflowRun.title}`,
      `- Status: ${sourceWorkflowRun.status}`
    );

    if (sourceWorkflowRun.steps.length) {
      lines.push("- Successful step excerpts:");
      sourceWorkflowRun.steps.forEach((step, index) => {
        lines.push(`${index + 1}. ${step.stepLabel}\n${clip(step.content, 1200)}`);
      });
    }
  }

  lines.push(
    "",
    "Output intent:",
    "Use the above material to generate a concise, visually coherent short marketing video."
  );

  return {
    project,
    sourceOutput,
    sourceWorkflowRun,
    promptBrief: lines.join("\n"),
  };
}
