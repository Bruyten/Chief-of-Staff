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
import {
  applySubscriptionChange,
  downgradeToFree,
} from "../services/billing.service.js";
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
      select: {
        stripeCustomerId: true,
      },
    });

    const subscription = await prisma.subscription.findUnique({
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
      subscription: subscription
        ? {
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
      fakeStripe: isFakeStripe(),
    });
  } catch (error) {
    next(error);
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
      throw errors.badRequest(
        `No Stripe price ID configured for plan: ${plan}`,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      throw errors.unauthorized("Account not found");
    }

    const customerId = await ensureCustomer({
      userId: user.id,
      email: user.email,
      existingCustomerId: user.stripeCustomerId,
    });

    if (customerId !== user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeCustomerId: customerId,
        },
      });
    }

    const session = await createCheckoutSession({
      customerId,
      priceId: planConfig.stripePriceId || `fake-price-${plan}`,
      successUrl: env.BILLING_SUCCESS_URL,
      cancelUrl: env.BILLING_CANCEL_URL,
      userId: user.id,
    });

    res.json({
      url: session.url,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/portal", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!user?.stripeCustomerId) {
      throw errors.badRequest(
        "No Stripe customer exists for this account yet",
      );
    }

    const session = await createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: env.CLIENT_ORIGIN,
    });

    res.json({
      url: session.url,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/simulate-success", async (req, res, next) => {
  try {
    if (!isFakeStripe()) {
      throw errors.forbidden(
        "Fake billing simulation is disabled in live Stripe mode",
      );
    }

    const { plan } = checkoutSchema.parse(req.body);
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await applySubscriptionChange({
      userId: req.user!.id,
      stripeSubscriptionId: `sub_fake_${req.user!.id}_${Date.now()}`,
      stripePriceId:
        PLANS[plan].stripePriceId || `fake-price-${plan}`,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      cancelAtPeriodEnd: false,
      planOverride: plan,
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post("/simulate-cancel", async (req, res, next) => {
  try {
    if (!isFakeStripe()) {
      throw errors.forbidden(
        "Fake billing simulation is disabled in live Stripe mode",
      );
    }

    await downgradeToFree(req.user!.id);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
