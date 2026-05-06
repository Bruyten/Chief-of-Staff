// Single source of truth for plans, used by:
//   - billing routes (to look up Stripe price IDs)
//   - webhook (to set credits when subscription.updated fires)
//   - /api/account/usage (to surface plan info to the frontend)
//
// Adding a new plan = add an entry here + create a Stripe price + set the env var.

import { env } from "../env.js";

export type PlanId = "free" | "starter" | "pro" | "agency";

export type Plan = {
  id: PlanId;
  name: string;
  priceUsd: number;            // monthly USD
  credits: number;             // generations per month
  stripePriceId: string;       // empty for free
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceUsd: 0,
    credits: 5,
    stripePriceId: "",
    features: [
      "5 AI generations per month",
      "All 15 generators",
      "Unlimited projects",
      "Saved library",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceUsd: 19,
    credits: 100,
    stripePriceId: env.STRIPE_PRICE_STARTER,
    features: [
      "100 AI generations per month",
      "Everything in Free",
      "Priority email support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceUsd: 49,
    credits: 500,
    stripePriceId: env.STRIPE_PRICE_PRO,
    features: [
      "500 AI generations per month",
      "Everything in Starter",
      "Brand voice profiles (Phase 2)",
      "Bulk export",
    ],
  },
  agency: {
    id: "agency",
    name: "Agency",
    priceUsd: 99,
    credits: 2000,
    stripePriceId: env.STRIPE_PRICE_AGENCY,
    features: [
      "2,000 AI generations per month",
      "Everything in Pro",
      "3 client workspaces (Phase 2)",
      "Founder Slack channel",
    ],
  },
};

export const PAID_PLANS: PlanId[] = ["starter", "pro", "agency"];

/** Look up which plan a Stripe price ID corresponds to. */
export function planFromStripePriceId(priceId: string): PlanId | null {
  if (priceId && priceId === PLANS.starter.stripePriceId) return "starter";
  if (priceId && priceId === PLANS.pro.stripePriceId)     return "pro";
  if (priceId && priceId === PLANS.agency.stripePriceId)  return "agency";
  return null;
}
