import { DateTime } from "luxon";
      lockedUntil: null,
    },
  });

  if (normalizedStatus === "failed") {
    await refundVideoJobUsageOnce(
      job.userId,
      job.id,
      "video_provider_terminal_failure"
    );
  }

  return updated;
}

export async function refreshVideoJobForUser(userId: string, jobId: string) {
  await getVideoJobForUser(userId, jobId);
  await pollSingleVideoJob(jobId);
  return getVideoJobForUser(userId, jobId);
}

export async function claimVideoJobsDueForPoll(limit = env.VIDEO_POLL_BATCH_SIZE) {
  const now = new Date();
  const lockUntil = nextPollTime(20);

  const candidates = await prisma.videoJob.findMany({
    where: {
      status: { in: ["submitted", "processing"] },
      nextPollAt: { lte: now },
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
    },
    orderBy: { nextPollAt: "asc" },
    take: limit,
    select: { id: true },
  });

  const claimed: string[] = [];

  for (const candidate of candidates) {
    const result = await prisma.videoJob.updateMany({
      where: {
        id: candidate.id,
        status: { in: ["submitted", "processing"] },
        nextPollAt: { lte: now },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      data: {
        lockedUntil: lockUntil,
      },
    });

    if (result.count === 1) claimed.push(candidate.id);
  }

  return claimed;
}

export async function pollDueVideoJobs(limit = env.VIDEO_POLL_BATCH_SIZE) {
  const claimedIds = await claimVideoJobsDueForPoll(limit);

  for (const jobId of claimedIds) {
    try {
      await pollSingleVideoJob(jobId);
    } catch (err) {
      logger.error({ err, videoJobId: jobId }, "Video job poll failed");
      await prisma.videoJob.update({
        where: { id: jobId },
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
