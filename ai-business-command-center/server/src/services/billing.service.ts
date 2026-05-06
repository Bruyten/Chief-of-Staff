// Subscription lifecycle. Webhook + fake-mode both call into here so the
// behavior stays identical regardless of Stripe-real vs Stripe-fake.

import { prisma } from "../lib/prisma.js";
import { PLANS, planFromStripePriceId, type PlanId } from "../lib/plans.js";

/** Apply a subscription state change to the User + Subscription tables. */
export async function applySubscriptionChange(args: {
  userId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}) {
  const planId = planFromStripePriceId(args.stripePriceId) ?? "free";

  await prisma.subscription.upsert({
    where: { userId: args.userId },
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

  // Promote the user — set plan + top up credits to the new ceiling.
  // We only RESET credits when the plan changes OR a new period starts.
  // Avoids letting users cancel + resub to refill mid-month.
  await syncUserPlan(args.userId, planId, /* resetCredits */ true);
}

/** Demote user to free. Used when subscription is canceled / unpaid. */
export async function downgradeToFree(userId: string) {
  await prisma.subscription.updateMany({
    where: { userId },
    data: { status: "canceled" },
  });
  await syncUserPlan(userId, "free", /* resetCredits */ false);
}

async function syncUserPlan(userId: string, planId: PlanId, resetCredits: boolean) {
  const plan = PLANS[planId];
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: planId,
      creditsMax: plan.credits,
      ...(resetCredits ? { credits: plan.credits } : {}),
    },
  });
}

/** Monthly credit reset (run as a cron in Phase 2.5). */
export async function resetMonthlyCredits() {
  // Bump everyone whose subscription period ended back to their plan's max.
  // Free users reset on signup-anniversary — keep simple for MVP and reset
  // them every 30 days from createdAt.
  const users = await prisma.user.findMany({
    select: { id: true, plan: true, createdAt: true },
  });
  for (const u of users) {
    const planId = (u.plan as PlanId) || "free";
    const plan = PLANS[planId] ?? PLANS.free;
    await prisma.user.update({
      where: { id: u.id },
      data: { credits: plan.credits, creditsMax: plan.credits },
    });
  }
}
