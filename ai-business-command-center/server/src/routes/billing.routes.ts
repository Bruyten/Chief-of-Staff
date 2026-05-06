// Billing endpoints used by the frontend pricing & account pages.

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

const router = Router();

// Public — used by the pricing page
router.get("/plans", (_req, res) => {
  res.json({
    plans: (Object.keys(PLANS) as PlanId[]).map((id) => ({
      id,
      name: PLANS[id].name,
      priceUsd: PLANS[id].priceUsd,
      credits: PLANS[id].credits,
      features: PLANS[id].features,
    })),
    fakeStripe: isFakeStripe(),
  });
});

// Authenticated routes below
router.use(requireAuth);

// Returns current subscription state for /settings billing page
router.get("/me", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { plan: true, credits: true, creditsMax: true, stripeCustomerId: true },
    });
    const sub = await prisma.subscription.findUnique({ where: { userId: req.user!.id } });
    res.json({
      plan: user?.plan ?? "free",
      credits: user?.credits ?? 0,
      creditsMax: user?.creditsMax ?? 0,
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
  } catch (e) { next(e); }
});

// Start a Checkout Session
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
    }

    const session = await createCheckoutSession({
      customerId,
      priceId: planConfig.stripePriceId || `fake_price_${plan}`,
      successUrl: env.BILLING_SUCCESS_URL,
      cancelUrl: env.BILLING_CANCEL_URL,
      userId: user.id,
    });

    res.json({ url: session.url });
  } catch (e) { next(e); }
});

// Open the Stripe customer portal (or fake-equivalent in dev)
router.post("/portal", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) throw errors.badRequest("No active subscription to manage");
    const session = await createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: env.BILLING_SUCCESS_URL,
    });
    res.json({ url: session.url });
  } catch (e) { next(e); }
});

// FAKE-MODE ONLY: simulate the result of a successful checkout. This is
// what the frontend redirect calls when ?fake=1 is present, so the demo
// flow works end-to-end with no Stripe account.
const simulateSchema = z.object({
  plan: z.enum(["starter", "pro", "agency"]),
});
router.post("/simulate-success", async (req, res, next) => {
  try {
    if (!isFakeStripe()) throw errors.forbidden("Endpoint only available in FAKE_STRIPE mode");
    const { plan } = simulateSchema.parse(req.body);
    const planCfg = PLANS[plan];
    const now = new Date();
    const inAMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Upgrade the user to this plan with a fake subscription row
    await applySubscriptionChange({
      userId: req.user!.id,
      stripeSubscriptionId: `sub_fake_${Date.now()}`,
      stripePriceId: planCfg.stripePriceId || `fake_price_${plan}`,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: inAMonth,
      cancelAtPeriodEnd: false,
    });
    res.json({ ok: true, plan });
  } catch (e) { next(e); }
});

// FAKE-MODE ONLY: simulate cancellation
router.post("/simulate-cancel", async (req, res, next) => {
  try {
    if (!isFakeStripe()) throw errors.forbidden("Endpoint only available in FAKE_STRIPE mode");
    await downgradeToFree(req.user!.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
