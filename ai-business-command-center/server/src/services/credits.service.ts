import {
  ensureAvailableUsage,
  getUsageSnapshot,
  refundUsage,
  reserveUsage,
} from "./usage.service.js";

export async function consumeCredit(userId: string): Promise<number> {
  const result = await reserveUsage(userId, "text", 1, "legacy_consume_credit");
  return result.remaining;
}

export async function refundCredit(userId: string): Promise<number> {
  const result = await refundUsage(userId, "text", 1, "legacy_refund_credit");
  return result.remaining;
}

export async function assertCreditsAvailable(userId: string, amount = 1) {
  return ensureAvailableUsage(userId, "text", amount);
}

export async function getUsage(userId: string) {
  const usage = await getUsageSnapshot(userId);

  return {
    plan: usage.plan,
    creditsRemaining: usage.textCreditsRemaining,
    creditsMax: usage.textCreditsMax,
    videoCreditsRemaining: usage.videoCreditsRemaining,
    videoCreditsMax: usage.videoCreditsMax,
  };
}
