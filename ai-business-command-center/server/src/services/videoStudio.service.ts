import { DateTime } from "luxon";

import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { env } from "../env.js";

import { consumeVideoCredit } from "./videoCredits.service.js";
import { refundVideoJobUsageOnce } from "./usage.service.js";
import {
  buildVideoPromptBrief,
  type VideoStudioCreateInput,
} from "./videoBrief.service.js";
import { getVideoProvider } from "../video/videoProviderFactory.js";

function nextPollTime(minutesFromNow: number) {
  return DateTime.utc().plus({ minutes: minutesFromNow }).toJSDate();
}

function isTerminal(status: string) {
  return (
    status === "completed" ||
    status === "failed" ||
    status === "canceled"
  );
}

export async function listVideoJobsForUser(userId: string) {
  return prisma.videoJob.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 50,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          emoji: true,
        },
      },
      sourceOutput: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
      sourceWorkflowRun: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
}

export async function getVideoJobForUser(
  userId: string,
  jobId: string,
) {
  const job = await prisma.videoJob.findFirst({
    where: {
      id: jobId,
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
      sourceOutput: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
      sourceWorkflowRun: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  if (!job) {
    throw errors.notFound("Video job not found");
  }

  return job;
}

export async function createVideoJob(
  userId: string,
  input: VideoStudioCreateInput,
) {
  const provider = getVideoProvider();
  const brief = await buildVideoPromptBrief(userId, input);
  const videoCreditsRemaining = await consumeVideoCredit(userId);

  const job = await prisma.videoJob.create({
    data: {
      userId,
      projectId: input.projectId ?? brief.project?.id ?? null,
      sourceOutputId: input.sourceOutputId ?? null,
      sourceWorkflowRunId: input.sourceWorkflowRunId ?? null,
      title: input.title,
      sourceType: input.sourceType,
      useCase: input.useCase,
      aspectRatio: input.aspectRatio,
      durationSeconds: input.durationSeconds,
      toneStyle: input.toneStyle,
      cta: input.cta?.trim() || null,
      promptBrief: brief.promptBrief,
      provider: provider.name,
      status: "queued",
      creditChargedAt: new Date(),
      nextPollAt: nextPollTime(2),
    },
  });

  try {
    const providerResult = await provider.createJob({
      internalJobId: job.id,
      promptBrief: brief.promptBrief,
      aspectRatio: input.aspectRatio,
      durationSeconds: input.durationSeconds,
      title: input.title,
      referenceImages: input.referenceImages ?? [],
    });

    const updated = await prisma.videoJob.update({
      where: {
        id: job.id,
      },
      data: {
        externalJobId: providerResult.externalJobId,
        providerStatus: providerResult.providerStatus,
        providerPayload: providerResult.raw as object | undefined,
        status: "submitted",
        submittedAt: new Date(),
        nextPollAt: nextPollTime(2),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            emoji: true,
          },
        },
        sourceOutput: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        sourceWorkflowRun: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return {
      job: updated,
      videoCreditsRemaining,
    };
  } catch (error) {
    logger.error(
      {
        err: error,
        videoJobId: job.id,
      },
      "Video provider submission failed",
    );

    await prisma.videoJob.update({
      where: {
        id: job.id,
      },
      data: {
        status: "failed",
        errorMsg:
          "The video provider could not accept this job. Your video credit was refunded.",
        failedAt: new Date(),
        providerStatus: "submission_failed",
        nextPollAt: null,
      },
    });

    await refundVideoJobUsageOnce(
      userId,
      job.id,
      "video_provider_submission_rejected",
    );

    throw errors.server(
      "Video provider submission failed. Your video credit was refunded.",
    );
  }
}

export async function pollSingleVideoJob(jobId: string) {
  const provider = getVideoProvider();

  const job = await prisma.videoJob.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw errors.notFound("Video job not found");
  }

  if (!job.externalJobId) {
    throw errors.badRequest(
      "Video job has no external provider job ID",
    );
  }

  if (isTerminal(job.status)) {
    return job;
  }

  const result = await provider.pollJob({
    externalJobId: job.externalJobId,
    internalJobId: job.id,
    pollAttempts: job.pollAttempts,
  });

  const normalizedStatus = result.normalizedStatus;
  const nextPollAt = isTerminal(normalizedStatus)
    ? null
    : nextPollTime(3);

  const updated = await prisma.videoJob.update({
    where: {
      id: job.id,
    },
    data: {
      providerStatus: result.providerStatus,
      providerPayload: result.raw as object | undefined,
      status: normalizedStatus,
      videoUrl: result.videoUrl ?? job.videoUrl,
      thumbnailUrl: result.thumbnailUrl ?? job.thumbnailUrl,
      errorMsg: result.errorMessage ?? job.errorMsg,
      completedAt:
        normalizedStatus === "completed"
          ? new Date()
          : job.completedAt,
      failedAt:
        normalizedStatus === "failed"
          ? new Date()
          : job.failedAt,
      pollAttempts: {
        increment: 1,
      },
      lastPolledAt: new Date(),
      nextPollAt,
      lockedUntil: null,
    },
  });

  if (normalizedStatus === "failed") {
    await refundVideoJobUsageOnce(
      job.userId,
      job.id,
      "video_provider_terminal_failure",
    );
  }

  return updated;
}

export async function refreshVideoJobForUser(
  userId: string,
  jobId: string,
) {
  await getVideoJobForUser(userId, jobId);
  await pollSingleVideoJob(jobId);

  return getVideoJobForUser(userId, jobId);
}

export async function claimVideoJobsDueForPoll(
  limit = env.VIDEO_POLL_BATCH_SIZE,
) {
  const now = new Date();
  const lockUntil = nextPollTime(20);

  const candidates = await prisma.videoJob.findMany({
    where: {
      status: {
        in: ["submitted", "processing"],
      },
      nextPollAt: {
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
      nextPollAt: "asc",
    },
    take: limit,
    select: {
      id: true,
    },
  });

  const claimedIds: string[] = [];

  for (const candidate of candidates) {
    const claimed = await prisma.videoJob.updateMany({
      where: {
        id: candidate.id,
        status: {
          in: ["submitted", "processing"],
        },
        nextPollAt: {
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

export async function pollDueVideoJobs(
  limit = env.VIDEO_POLL_BATCH_SIZE,
) {
  const claimedIds = await claimVideoJobsDueForPoll(limit);

  for (const jobId of claimedIds) {
    try {
      await pollSingleVideoJob(jobId);
    } catch (error) {
      logger.error(
        {
          err: error,
          videoJobId: jobId,
        },
        "Video job poll failed",
      );

      await prisma.videoJob.update({
        where: {
          id: jobId,
        },
        data: {
          lockedUntil: null,
          nextPollAt: nextPollTime(5),
        },
      });
    }
  }

  return {
    claimed: claimedIds.length,
    jobIds: claimedIds,
  };
}
