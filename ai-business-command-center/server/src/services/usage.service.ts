import { prisma } from "../lib/prisma.js";
        userId,
        bucket,
        action: "refund",
        amount,
        reason,
        referenceType: reference?.referenceType,
        referenceId: reference?.referenceId,
        metadata: reference?.metadata as object | undefined,
      },
    });

    return { bucket, remaining: next };
  });
}

export async function recordPlanResetUsage(
  userId: string,
  plan: string,
  textCredits: number,
  videoCredits: number
) {
  await prisma.usageLedgerEntry.createMany({
    data: [
      {
        userId,
        bucket: "text",
        action: "plan_reset",
        amount: textCredits,
        reason: `Plan reset for ${plan}`,
      },
      {
        userId,
        bucket: "video",
        action: "plan_reset",
        amount: videoCredits,
        reason: `Plan reset for ${plan}`,
      },
    ],
  });
}

export async function refundVideoJobUsageOnce(
  userId: string,
  videoJobId: string,
  reason: string
) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.videoJob.updateMany({
      where: {
        id: videoJobId,
        userId,
        creditRefundedAt: null,
      },
      data: {
        creditRefundedAt: new Date(),
      },
    });

    if (claimed.count !== 1) {
      return { refunded: false };
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        videoCredits: true,
        videoCreditsMax: true,
      },
    });

    if (!user) throw errors.unauthorized("Account not found");

    const next = Math.min(user.videoCredits + 1, user.videoCreditsMax);

    await tx.user.update({
      where: { id: userId },
      data: {
        videoCredits: next,
      },
    });

    await tx.usageLedgerEntry.create({
      data: {
        userId,
        bucket: "video",
        action: "refund",
        amount: 1,
        reason,
        referenceType: "video_job",
        referenceId: videoJobId,
      },
    });

    return {
      refunded: true,
      remaining: next,
    };
  });
}
