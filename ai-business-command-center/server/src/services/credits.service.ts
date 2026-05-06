// Atomic credit accounting. Uses a Prisma transaction so credits can never
// go negative under concurrent load.

import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";

/** Atomically decrement 1 credit. Throws 402 if user has none left. */
export async function consumeCredit(userId: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    if (!user) throw errors.unauthorized("Account not found");
    if (user.credits <= 0) throw errors.paymentRequired("You're out of credits this month");

    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
      select: { credits: true },
    });
    return updated.credits;
  });
}

export async function getUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, creditsMax: true, plan: true },
  });
  if (!user) throw errors.unauthorized("Account not found");

  const totalGenerations = await prisma.task.count({ where: { userId, status: "done" } });
  const totalOutputs = await prisma.output.count({ where: { userId } });

  return {
    plan: user.plan,
    creditsRemaining: user.credits,
    creditsMax: user.creditsMax,
    totalGenerations,
    totalOutputs,
  };
}
