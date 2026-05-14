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

router.post("/checkout", async (req, res, next) => {
  try {
    const { plan } = checkoutSchema.parse(req.body);
    const planConfig = PLANS[plan];

    if (!planConfig.stripePriceId && !isFakeStripe()) {
      throw errors.badRequest(`No Stripe price ID configured for plan: ${plan}`);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, stripeCustomerId: true },
    });

    if (!user) throw errors.unauthorized("Account not found");

    const customerId = await ensureCustomer({
      userId: user.id,
      email: user.email,
      existingCustomerId: user.stripeCustomerId,
    });

    if (customerId !== user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
export default router;
