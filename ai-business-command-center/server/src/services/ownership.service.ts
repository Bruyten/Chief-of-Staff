import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";

export async function assertOwnsProject(userId: string, projectId: string) {
  const record = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });

  if (!record) throw errors.notFound("Project not found");
  return record;
}

export async function assertOwnsBrandProfile(userId: string, profileId: string) {
  const record = await prisma.brandVoiceProfile.findFirst({
    where: { id: profileId, userId },
    select: { id: true },
  });

  if (!record) throw errors.notFound("Brand Voice Profile not found");
  return record;
}

export async function assertOwnsOutput(userId: string, outputId: string) {
  const record = await prisma.output.findFirst({
    where: { id: outputId, userId },
    select: { id: true, projectId: true },
  });

  if (!record) throw errors.notFound("Output not found");
  return record;
}

export async function assertOwnsProduct(userId: string, productId: string) {
  const record = await prisma.product.findFirst({
    where: {
      id: productId,
      project: { userId },
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  if (!record) throw errors.notFound("Product not found");
  return record;
}

export async function assertOwnsConversation(userId: string, conversationId: string) {
  const record = await prisma.chatConversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });

  if (!record) throw errors.notFound("Chat conversation not found");
  return record;
}

export async function assertOwnsWorkflowRun(userId: string, workflowRunId: string) {
  const record = await prisma.workflowRun.findFirst({
    where: { id: workflowRunId, userId },
    select: { id: true, projectId: true },
  });

  if (!record) throw errors.notFound("Workflow run not found");
  return record;
}

export async function assertOwnsAutomation(userId: string, automationId: string) {
  const record = await prisma.automation.findFirst({
    where: { id: automationId, userId },
    select: { id: true },
  });

  if (!record) throw errors.notFound("Automation not found");
  return record;
}

export async function assertOwnsVideoJob(userId: string, videoJobId: string) {
  const record = await prisma.videoJob.findFirst({
    where: { id: videoJobId, userId },
    select: { id: true },
  });

  if (!record) throw errors.notFound("Video job not found");
  return record;
}
