import { prisma } from "../lib/prisma.js";
import {
  PLANS,
  planFromStripePriceId,
  type PlanId,
} from "../lib/plans.js";
import { recordPlanResetUsage } from "./usage.service.js";

export async function applySubscriptionChange(args: {
  userId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  planOverride?: PlanId;
}) {
  const planId =
    args.planOverride ??
    planFromStripePriceId(args.stripePriceId) ??
    "free";

  await prisma.subscription.upsert({
    where: {
      userId: args.userId,
    },
    create: {
      userId: args.userId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      plan: planId,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
    },
    update: {
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      plan: planId,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
    },
  });

  await syncUserPlan(args.userId, planId, true);
}

export async function downgradeToFree(userId: string) {
  await prisma.subscription.updateMany({
    where: { userId },
    data: {
      status: "canceled",
      cancelAtPeriodEnd: false,
    },
  });

  await syncUserPlan(userId, "free", false);
}

async function syncUserPlan(
  userId: string,
  planId: PlanId,
  resetCredits: boolean,
) {
  const plan = PLANS[planId];

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      plan: planId,
      creditsMax: plan.textCredits,
      videoCreditsMax: plan.videoCredits,
      ...(resetCredits
        ? {
            credits: plan.textCredits,
            videoCredits: plan.videoCredits,
          }
        : {}),
    },
  });

  if (resetCredits) {
    await recordPlanResetUsage(
      userId,
      planId,
      plan.textCredits,
      plan.videoCredits,
    );
  }
}

export async function resetMonthlyCredits() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      plan: true,
    },
  });

  for (const user of users) {
    const planId = (user.plan as PlanId) || "free";
    const plan = PLANS[planId] ?? PLANS.free;

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        credits: plan.textCredits,
        creditsMax: plan.textCredits,
        videoCredits: plan.videoCredits,
        videoCreditsMax: plan.videoCredits,
      },
    });

    await recordPlanResetUsage(
      user.id,
      planId,
      plan.textCredits,
      plan.videoCredits,
    );
  }
}
