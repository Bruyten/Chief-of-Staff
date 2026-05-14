import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";

export type UsageBucket = "text" | "video";

export type UsageReference = {
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
};

function unavailableMessage(bucket: UsageBucket) {
  return bucket === "video"
    ? "You're out of premium video credits or your plan does not include Video Studio."
    : "You're out of text AI credits this month.";
}

export async function getUsageSnapshot(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      plan: true,
      credits: true,
      creditsMax: true,
      videoCredits: true,
      videoCreditsMax: true,
    },
  });

  if (!user) {
    throw errors.unauthorized("Account not found");
  }

  return {
    plan: user.plan,
    textCreditsRemaining: user.credits,
    textCreditsMax: user.creditsMax,
    videoCreditsRemaining: user.videoCredits,
    videoCreditsMax: user.videoCreditsMax,
  };
}

export async function ensureAvailableUsage(
  userId: string,
  bucket: UsageBucket,
  amount = 1
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      credits: true,
      creditsMax: true,
      videoCredits: true,
      videoCreditsMax: true,
    },
  });

  if (!user) {
    throw errors.unauthorized("Account not found");
  }

  if (bucket === "video") {
    if (user.videoCreditsMax <= 0) {
      throw errors.paymentRequired(
        "Upgrade to a video-enabled plan to use Video Studio."
      );
    }

    if (user.videoCredits < amount) {
      throw errors.paymentRequired(unavailableMessage(bucket));
    }

    return;
  }

  if (user.credits < amount) {
    throw errors.paymentRequired(unavailableMessage(bucket));
  }
}

export async function reserveUsage(
  userId: string,
  bucket: UsageBucket,
  amount = 1,
  reason: string,
  reference?: UsageReference
) {
  return prisma.$transaction(async (tx) => {
    if (bucket === "video") {
      const updated = await tx.user.updateMany({
        where: {
          id: userId,
          videoCreditsMax: {
            gt: 0,
          },
          videoCredits: {
            gte: amount,
          },
        },
        data: {
          videoCredits: {
            decrement: amount,
          },
        },
      });

      if (updated.count !== 1) {
        throw errors.paymentRequired(unavailableMessage(bucket));
      }

      await tx.usageLedgerEntry.create({
        data: {
          userId,
          bucket,
          action: "reserve",
          amount,
          reason,
          referenceType: reference?.referenceType,
          referenceId: reference?.referenceId,
          metadata: reference?.metadata as object | undefined,
        },
      });

      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          videoCredits: true,
        },
      });

      return {
        bucket,
        remaining: user?.videoCredits ?? 0,
      };
    }

    const updated = await tx.user.updateMany({
      where: {
        id: userId,
        credits: {
          gte: amount,
        },
      },
      data: {
        credits: {
          decrement: amount,
        },
      },
    });

    if (updated.count !== 1) {
      throw errors.paymentRequired(unavailableMessage(bucket));
    }

    await tx.usageLedgerEntry.create({
      data: {
        userId,
        bucket,
        action: "reserve",
        amount,
        reason,
        referenceType: reference?.referenceType,
        referenceId: reference?.referenceId,
        metadata: reference?.metadata as object | undefined,
      },
    });

    const user = await tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        credits: true,
      },
    });

    return {
      bucket,
      remaining: user?.credits ?? 0,
    };
  });
}

export async function refundUsage(
  userId: string,
  bucket: UsageBucket,
  amount = 1,
  reason: string,
  reference?: UsageReference
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        credits: true,
        creditsMax: true,
        videoCredits: true,
        videoCreditsMax: true,
      },
    });

    if (!user) {
      throw errors.unauthorized("Account not found");
    }

    if (bucket === "video") {
      const nextVideoCredits = Math.min(
        user.videoCredits + amount,
        user.videoCreditsMax
      );

      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          videoCredits: nextVideoCredits,
        },
      });

      await tx.usageLedgerEntry.create({
        data: {
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

      return {
        bucket,
        remaining: nextVideoCredits,
      };
    }

    const nextTextCredits = Math.min(user.credits + amount, user.creditsMax);

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        credits: nextTextCredits,
      },
    });

    await tx.usageLedgerEntry.create({
      data: {
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

    return {
      bucket,
      remaining: nextTextCredits,
    };
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
      return {
        refunded: false,
      };
    }

    const user = await tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        videoCredits: true,
        videoCreditsMax: true,
      },
    });

    if (!user) {
      throw errors.unauthorized("Account not found");
    }

    const nextVideoCredits = Math.min(
      user.videoCredits + 1,
      user.videoCreditsMax
    );

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        videoCredits: nextVideoCredits,
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
      remaining: nextVideoCredits,
    };
  });
}
