import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { errors } from "../lib/errors.js";
import { env } from "../env.js";
import { PLANS, type PlanId } from "../lib/plans.js";
import {
  ensureCustomer,
  createCheckoutSession,
  createPortalSession,
  isFakeStripe,
} from "../lib/stripeClient.js";
import { applySubscriptionChange, downgradeToFree } from "../services/billing.service.js";
import { getUsageSnapshot } from "../services/usage.service.js";

const router = Router();

router.get("/plans", (_req, res) => {
  res.json({
    plans: (Object.keys(PLANS) as PlanId[]).map((id) => ({
      id,
      name: PLANS[id].name,
      priceUsd: PLANS[id].priceUsd,
      textCredits: PLANS[id].textCredits,
      videoCredits: PLANS[id].videoCredits,
      features: PLANS[id].features,
    })),
    fakeStripe: isFakeStripe(),
  });
});

router.use(requireAuth);

router.get("/me", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { stripeCustomerId: true },
    });

    const sub = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
    });

    const usage = await getUsageSnapshot(req.user!.id);

    res.json({
      plan: usage.plan,
      textCredits: usage.textCreditsRemaining,
      textCreditsMax: usage.textCreditsMax,
      videoCredits: usage.videoCreditsRemaining,
      videoCreditsMax: usage.videoCreditsMax,
      hasStripeCustomer: !!user?.stripeCustomerId,
      subscription: sub
        ? {
            status: sub.status,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            currentPeriodEnd: sub.currentPeriodEnd,
          }
        : null,
      fakeStripe: isFakeStripe(),
    });
  } catch (e) {
    next(e);
  }
});

const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro", "agency"]),
});
export default router;
